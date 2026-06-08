import { createReadStream, promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;
const filesDir = path.join(rootDir, 'arquivos');
const courseMetaPath = path.join(filesDir, '.courses.json');
const mediaMetaPath = path.join(filesDir, '.media.json');
const databasePath = path.join(filesDir, 'cursoteca.sqlite');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.mp4', 'video/mp4'],
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/mp4'],
  ['.aac', 'audio/aac'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
  ['.flac', 'audio/flac']
]);

const audioExtensions = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac']);

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body), {
    'content-type': 'application/json; charset=utf-8'
  });
}

function runSqlite(args, input = '') {
  return new Promise((resolve, reject) => {
    const child = execFile('sqlite3', [databasePath, ...args], {
      cwd: rootDir,
      maxBuffer: 1024 * 1024 * 20
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
    if (input) child.stdin.end(input);
  });
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function dbExec(sql) {
  await fs.mkdir(filesDir, { recursive: true });
  await runSqlite(['-batch'], sql);
}

async function dbAll(sql) {
  await fs.mkdir(filesDir, { recursive: true });
  const output = await runSqlite(['-json', sql]);
  return output.trim() ? JSON.parse(output) : [];
}

async function dbOne(sql) {
  return (await dbAll(sql))[0] || null;
}

async function initDatabase() {
  await dbExec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL UNIQUE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      video_path TEXT NOT NULL UNIQUE,
      source_url TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      node_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('file', 'link')),
      scope TEXT NOT NULL CHECK (scope IN ('course', 'node', 'lesson')),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      file_path TEXT UNIQUE,
      url TEXT,
      mime_type TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(course_id, parent_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_node ON lessons(course_id, node_id);
    CREATE INDEX IF NOT EXISTS idx_resources_targets ON resources(course_id, node_id, lesson_id, scope);
  `);
}

async function upsertCourse(name, description = '') {
  const cleanName = cleanPathPart(name);
  if (!cleanName) return null;
  const existing = await dbOne(`SELECT * FROM courses WHERE name = ${sqlValue(cleanName)} OR path = ${sqlValue(cleanName)}`);
  if (existing) {
    if (description) {
      await dbExec(`UPDATE courses SET description = ${sqlValue(description)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${existing.id};`);
      return dbOne(`SELECT * FROM courses WHERE id = ${existing.id}`);
    }
    return existing;
  }
  await dbExec(`
    INSERT INTO courses (name, description, path)
    VALUES (${sqlValue(cleanName)}, ${sqlValue(description)}, ${sqlValue(cleanName)});
  `);
  return dbOne(`SELECT * FROM courses WHERE name = ${sqlValue(cleanName)}`);
}

async function ensureNodeForPath(relativeDir) {
  const parts = cleanRelativePath(relativeDir).split(path.sep).filter(Boolean);
  if (!parts.length) return { course: null, node: null };

  const course = await upsertCourse(parts[0]);
  let parent = null;
  let partial = parts[0];

  for (let index = 1; index < parts.length; index += 1) {
    const title = parts[index];
    partial = cleanRelativePath(path.join(partial, title));
    let node = await dbOne(`SELECT * FROM nodes WHERE path = ${sqlValue(partial)}`);
    if (!node) {
      await dbExec(`
        INSERT INTO nodes (course_id, parent_id, title, path, position)
        VALUES (${course.id}, ${parent ? parent.id : 'NULL'}, ${sqlValue(title)}, ${sqlValue(partial)}, ${index});
      `);
      node = await dbOne(`SELECT * FROM nodes WHERE path = ${sqlValue(partial)}`);
    }
    parent = node;
  }

  return { course, node: parent };
}

async function findContextForPath(relativeDir) {
  const parts = cleanRelativePath(relativeDir).split(path.sep).filter(Boolean);
  if (!parts.length) return { course: null, node: null };
  const coursePath = parts[0];
  const course = await dbOne(`SELECT * FROM courses WHERE path = ${sqlValue(coursePath)} OR name = ${sqlValue(coursePath)}`);
  if (!course) return { course: null, node: null };
  if (parts.length === 1) return { course, node: null };
  const nodePath = cleanRelativePath(parts.join(path.sep));
  const node = await dbOne(`SELECT * FROM nodes WHERE path = ${sqlValue(nodePath)}`);
  return { course, node: node || null };
}

async function findLessonForFile(filePath) {
  const cleanPath = cleanRelativePath(filePath);
  return dbOne(`SELECT * FROM lessons WHERE video_path = ${sqlValue(cleanPath)}`);
}

async function findResourceForFile(filePath) {
  const cleanPath = cleanRelativePath(filePath);
  return dbOne(`SELECT * FROM resources WHERE file_path = ${sqlValue(cleanPath)}`);
}

async function ensureLessonForFile(filePath, metadata = null) {
  const cleanPath = cleanRelativePath(filePath);
  const directory = path.dirname(cleanPath).replace(/^\.$/, '');
  const { course, node } = await ensureNodeForPath(directory);
  if (!course) return null;
  const title = cleanPathPart(path.basename(cleanPath, path.extname(cleanPath)));
  const existing = await dbOne(`SELECT * FROM lessons WHERE video_path = ${sqlValue(cleanPath)}`);
  if (existing) {
    if (metadata?.description && !existing.description) {
      await dbExec(`UPDATE lessons SET description = ${sqlValue(metadata.description)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${existing.id};`);
    }
    await syncLessonLinks(existing.id, course.id, metadata?.links || []);
    return dbOne(`SELECT * FROM lessons WHERE id = ${existing.id}`);
  }
  await dbExec(`
    INSERT INTO lessons (course_id, node_id, title, description, video_path)
    VALUES (${course.id}, ${node ? node.id : 'NULL'}, ${sqlValue(title)}, ${sqlValue(metadata?.description || '')}, ${sqlValue(cleanPath)});
  `);
  const lesson = await dbOne(`SELECT * FROM lessons WHERE video_path = ${sqlValue(cleanPath)}`);
  await syncLessonLinks(lesson.id, course.id, metadata?.links || []);
  return lesson;
}

async function syncLessonLinks(lessonId, courseId, links) {
  const normalized = normalizeLinks(links);
  for (const link of normalized) {
    const existing = await dbOne(`
      SELECT id FROM resources
      WHERE type = 'link' AND scope = 'lesson' AND lesson_id = ${lessonId} AND url = ${sqlValue(link.url)}
    `);
    if (!existing) {
      await dbExec(`
        INSERT INTO resources (course_id, lesson_id, type, scope, title, url)
        VALUES (${courseId}, ${lessonId}, 'link', 'lesson', ${sqlValue(link.title || link.url)}, ${sqlValue(link.url)});
      `);
    }
  }
}

async function ensureFileResource(filePath, scope = 'node', lessonPath = '') {
  const cleanPath = cleanRelativePath(filePath);
  const directory = path.dirname(cleanPath).replace(/^\.$/, '');
  const { course, node } = await ensureNodeForPath(directory);
  if (!course) return null;
  const title = cleanPathPart(path.basename(cleanPath, path.extname(cleanPath)));
  let lesson = null;
  if (scope === 'lesson' && lessonPath) {
    lesson = await ensureLessonForFile(lessonPath);
  }
  const existing = await dbOne(`SELECT * FROM resources WHERE file_path = ${sqlValue(cleanPath)}`);
  if (existing) return existing;
  await dbExec(`
    INSERT INTO resources (course_id, node_id, lesson_id, type, scope, title, file_path, mime_type)
    VALUES (
      ${course.id},
      ${scope === 'course' ? 'NULL' : node ? node.id : 'NULL'},
      ${lesson ? lesson.id : 'NULL'},
      'file',
      ${sqlValue(scope)},
      ${sqlValue(title)},
      ${sqlValue(cleanPath)},
      ${sqlValue(mimeTypes.get(path.extname(cleanPath).toLowerCase()) || 'application/octet-stream')}
    );
  `);
  return dbOne(`SELECT * FROM resources WHERE file_path = ${sqlValue(cleanPath)}`);
}

async function resourcesForLesson(filePath) {
  const lesson = await dbOne(`SELECT * FROM lessons WHERE video_path = ${sqlValue(cleanRelativePath(filePath))}`);
  if (!lesson) return { lesson: [], node: [], ancestors: [], course: [] };
  const lessonResources = await dbAll(`
    SELECT * FROM resources
    WHERE lesson_id = ${lesson.id}
    ORDER BY position, title COLLATE NOCASE
  `);
  const nodeResources = lesson.node_id ? await dbAll(`
    SELECT * FROM resources
    WHERE scope = 'node' AND node_id = ${lesson.node_id} AND lesson_id IS NULL
    ORDER BY position, title COLLATE NOCASE
  `) : [];
  const ancestors = [];
  let current = lesson.node_id ? await dbOne(`SELECT * FROM nodes WHERE id = ${lesson.node_id}`) : null;
  while (current?.parent_id) {
    current = await dbOne(`SELECT * FROM nodes WHERE id = ${current.parent_id}`);
    if (!current) break;
    const items = await dbAll(`
      SELECT * FROM resources
      WHERE scope = 'node' AND node_id = ${current.id} AND lesson_id IS NULL
      ORDER BY position, title COLLATE NOCASE
    `);
    if (items.length) ancestors.push({ node: current, resources: items });
  }
  const courseResources = await dbAll(`
    SELECT * FROM resources
    WHERE scope = 'course' AND course_id = ${lesson.course_id} AND lesson_id IS NULL
    ORDER BY position, title COLLATE NOCASE
  `);
  return { lesson: lessonResources, node: nodeResources, ancestors, course: courseResources };
}

function resourceToClient(resource) {
  return {
    id: resource.id,
    type: resource.type,
    scope: resource.scope,
    title: resource.title,
    description: resource.description,
    path: resource.file_path,
    url: resource.url,
    mimeType: resource.mime_type
  };
}

function safeJoin(base, target) {
  const resolved = path.resolve(base, target);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error('Caminho fora da pasta do projeto.');
  }
  return resolved;
}

function cleanPathPart(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[<>:"|?*\u0000-\u001F]/g, '')
    .replace(/\.\.+/g, '.')
    .replace(/[\\/]+/g, '-')
    .trim();
}

async function readBody(req) {
  return (await readRawBody(req, 1024 * 64)).toString('utf8');
}

async function readRawBody(req, limit) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      throw new Error('Formulario muito grande.');
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function listDirectory(relativeDir = '') {
  const cleanRelative = cleanRelativePath(relativeDir);
  const currentDir = safeJoin(filesDir, cleanRelative);
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const mediaMetadata = await readMediaMetadata();
  const context = await findContextForPath(cleanRelative);
  const directories = [];
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const absolute = path.join(currentDir, entry.name);
    const relative = path.join(cleanRelative, entry.name);
    const stat = await fs.stat(absolute);

    if (entry.isDirectory()) {
      const childContext = await findContextForPath(relative);
      if (!childContext.course || (cleanRelative && !childContext.node)) {
        continue;
      }
      directories.push({
        name: entry.name,
        path: relative,
        modifiedAt: stat.mtime.toISOString(),
        node: childContext.node ? {
          id: childContext.node.id,
          title: childContext.node.title,
          description: childContext.node.description
        } : null
      });
    } else if (entry.isFile() && entry.name !== 'baixar_aula.sh' && entry.name !== path.basename(databasePath)) {
      const isMp4 = entry.name.toLowerCase().endsWith('.mp4');
      const ext = path.extname(entry.name).toLowerCase();
      const isPdfFile = ext === '.pdf';
      const isAudioFile = audioExtensions.has(ext);
      const metadata = mediaMetadata.files[relative] || null;
      let lesson = null;
      let resourceGroups = null;
      let resource = null;
      if (isMp4) {
        lesson = await findLessonForFile(relative);
        if (!lesson) continue;
        resourceGroups = lesson ? await resourcesForLesson(relative) : null;
      } else if (isPdfFile || isAudioFile) {
        resource = await findResourceForFile(relative);
        if (!resource) continue;
      } else {
        continue;
      }
      files.push({
        name: entry.name,
        path: relative,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        metadata: metadata || (lesson ? { description: lesson.description, links: [] } : null),
        lesson: lesson ? {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description
        } : null,
        resource: resource ? resourceToClient(resource) : null,
        resourceGroups: resourceGroups ? {
          lesson: resourceGroups.lesson.map(resourceToClient),
          node: resourceGroups.node.map(resourceToClient),
          course: resourceGroups.course.map(resourceToClient),
          ancestors: resourceGroups.ancestors.map((group) => ({
            node: {
              id: group.node.id,
              title: group.node.title
            },
            resources: group.resources.map(resourceToClient)
          }))
        } : null
      });
    }
  }

  directories.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  files.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return {
    current: cleanRelative,
    parent: cleanRelative ? path.dirname(cleanRelative).replace(/^\.$/, '') : null,
    context: {
      course: context.course ? {
        id: context.course.id,
        name: context.course.name,
        description: context.course.description
      } : null,
      node: context.node ? {
        id: context.node.id,
        title: context.node.title,
        description: context.node.description
      } : null
    },
    directories,
    files
  };
}

async function listCourses() {
  await fs.mkdir(filesDir, { recursive: true });
  const rows = await dbAll('SELECT * FROM courses ORDER BY name COLLATE NOCASE;');
  return rows.map((course) => ({
    id: course.id,
    name: course.name,
    description: course.description || '',
    createdAt: course.created_at || null,
    updatedAt: course.updated_at || null
  }));
}

async function readCourseMetadata() {
  try {
    const raw = await fs.readFile(courseMetaPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.courses || typeof parsed.courses !== 'object') {
      return { version: 1, courses: {} };
    }
    return { version: 1, courses: parsed.courses };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { version: 1, courses: {} };
    }
    throw error;
  }
}

async function writeCourseMetadata(metadata) {
  await fs.mkdir(filesDir, { recursive: true });
  await fs.writeFile(courseMetaPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

async function readMediaMetadata() {
  try {
    const raw = await fs.readFile(mediaMetaPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.files || typeof parsed.files !== 'object') {
      return { version: 1, files: {} };
    }
    return { version: 1, files: parsed.files };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { version: 1, files: {} };
    }
    throw error;
  }
}

async function writeMediaMetadata(metadata) {
  await fs.mkdir(filesDir, { recursive: true });
  await fs.writeFile(mediaMetaPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

function cleanRelativePath(value) {
  return String(value || '')
    .normalize('NFC')
    .split(/[\\/]+/)
    .map(cleanPathPart)
    .filter(Boolean)
    .join(path.sep);
}

function buildCoursePath(course, folder) {
  const cleanCourse = cleanPathPart(course);
  const cleanFolder = cleanRelativePath(folder);

  if (!cleanCourse) {
    return cleanFolder;
  }

  return cleanRelativePath(path.join(cleanCourse, cleanFolder));
}

function splitBuffer(buffer, delimiter) {
  const chunks = [];
  let start = 0;
  let index = buffer.indexOf(delimiter, start);

  while (index !== -1) {
    chunks.push(buffer.subarray(start, index));
    start = index + delimiter.length;
    index = buffer.indexOf(delimiter, start);
  }

  chunks.push(buffer.subarray(start));
  return chunks;
}

function parseMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];

  for (let part of splitBuffer(buffer, delimiter)) {
    if (part.length === 0) continue;
    if (part.subarray(0, 2).toString() === '--') continue;
    if (part.subarray(0, 2).toString() === '\r\n') {
      part = part.subarray(2);
    }
    if (part.subarray(-2).toString() === '\r\n') {
      part = part.subarray(0, -2);
    }

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const rawHeaders = part.subarray(0, headerEnd).toString('latin1');
    const content = part.subarray(headerEnd + 4);
    const disposition = rawHeaders
      .split('\r\n')
      .find((line) => line.toLowerCase().startsWith('content-disposition:')) || '';
    const name = decodeLatin1HeaderValue(/name="([^"]+)"/.exec(disposition)?.[1] || '');
    const encodedFilename = /filename\*=UTF-8''([^;\r\n]+)/i.exec(disposition)?.[1];
    const filename = encodedFilename
      ? decodeURIComponent(encodedFilename)
      : decodeLatin1HeaderValue(/filename="([^"]*)"/.exec(disposition)?.[1] || '');

    parts.push({ name, filename, content });
  }

  return parts;
}

function decodeLatin1HeaderValue(value) {
  return Buffer.from(value, 'latin1').toString('utf8');
}

async function uniqueFilePath(folderPath, fileName) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let candidate = safeJoin(folderPath, fileName);
  let counter = 2;

  while (true) {
    try {
      await fs.access(candidate);
      candidate = safeJoin(folderPath, `${base} (${counter})${ext}`);
      counter += 1;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return candidate;
      }
      throw error;
    }
  }
}

function runDownload({ folder, lessonName, url }) {
  return new Promise((resolve, reject) => {
    const output = path.join(folder, `${lessonName}.%(ext)s`);
    const args = buildDownloadArgs({ output, url });

    const child = spawn('yt-dlp', args, {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let log = '';
    const append = (chunk) => {
      log += chunk.toString();
      if (log.length > 20000) {
        log = log.slice(-20000);
      }
    };

    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ log });
      } else {
        reject(new Error(log || `yt-dlp saiu com codigo ${code}.`));
      }
    });
  });
}

function buildDownloadArgs({ output, url }) {
  const referer = downloadReferer(url);

  return [
    '-o',
    output,
    '--referer',
    referer,
    '-N',
    '15',
    '--format',
    'bv*[vcodec^=avc1][height<=1080]+ba/bv*[height<=1080]+ba/b[height<=1080]/best',
    '-S',
    'codec:avc,res,ext:mp4:m4a',
    '--merge-output-format',
    'mp4',
    '--remux-video',
    'mp4',
    '--postprocessor-args',
    'ffmpeg:-movflags +faststart',
    url
  ];
}

function downloadReferer(url) {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();

  if (host === 'player.vimeo.com') {
    return url;
  }

  if (host.endsWith('.vimeocdn.com') || host === 'vimeocdn.com' || host.endsWith('.vimeo.com')) {
    return 'https://player.vimeo.com/';
  }

  return 'https://player.hotmart.com/';
}

async function handleDownload(req, res) {
  try {
    const body = await readBody(req);
    const form = new URLSearchParams(body);
    const folder = buildCoursePath(form.get('course'), form.get('lessonFolder') || form.get('folder'));
    const lessonName = cleanPathPart(form.get('lessonName'));
    const url = String(form.get('url') || '').trim();

    if (!folder || !lessonName || !url) {
      return sendJson(res, 400, { error: 'Preencha pasta, nome da aula e URL.' });
    }

    try {
      new URL(url);
    } catch {
      return sendJson(res, 400, { error: 'Informe uma URL valida.' });
    }

    await fs.mkdir(filesDir, { recursive: true });
    const folderPath = safeJoin(filesDir, folder);
    await fs.mkdir(folderPath, { recursive: true });
    const result = await runDownload({ folder: folderPath, lessonName, url });
    const downloaded = (await fs.readdir(folderPath))
      .filter((name) => name.startsWith(lessonName) && path.extname(name).toLowerCase() === '.mp4')
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .at(-1);
    if (downloaded) {
      await ensureLessonForFile(cleanRelativePath(path.join(folder, downloaded)));
    }
    const listing = await listDirectory(folder);

    sendJson(res, 200, {
      ok: true,
      message: 'Download concluido.',
      log: result.log,
      listing
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || 'Falha ao baixar aula.'
    });
  }
}

async function handleCreateCourse(req, res) {
  try {
    const body = await readBody(req);
    const form = new URLSearchParams(body);
    const name = cleanPathPart(form.get('courseName'));
    const description = String(form.get('courseDescription') || '').trim().slice(0, 4000);

    if (!name) {
      return sendJson(res, 400, { error: 'Informe o nome do curso.' });
    }

    await fs.mkdir(safeJoin(filesDir, name), { recursive: true });
    const metadata = await readCourseMetadata();
    const now = new Date().toISOString();
    metadata.courses[name] = {
      description,
      createdAt: metadata.courses[name]?.createdAt || now,
      updatedAt: now
    };
    await writeCourseMetadata(metadata);
    const course = await upsertCourse(name, description);

    sendJson(res, 200, {
      ok: true,
      message: 'Curso cadastrado.',
      course: {
        id: course.id,
        name,
        description,
        createdAt: course.created_at || metadata.courses[name].createdAt,
        updatedAt: course.updated_at || now
      },
      courses: await listCourses(),
      listing: await listDirectory(name)
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || 'Falha ao cadastrar curso.'
    });
  }
}

async function handlePdfUpload(req, res) {
  try {
    const contentType = req.headers['content-type'] || '';
    const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)?.[1] ||
      /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)?.[2];

    if (!boundary) {
      return sendJson(res, 400, { error: 'Envio invalido.' });
    }

    const body = await readRawBody(req, 1024 * 1024 * 200);
    const parts = parseMultipart(body, boundary);
    const pdfFolder = cleanRelativePath(
      parts.find((part) => part.name === 'pdfFolder')?.content.toString('utf8') || ''
    );
    const pdfCourse = parts.find((part) => part.name === 'pdfCourse')?.content.toString('utf8') || '';
    const pdfScopeRaw = parts.find((part) => part.name === 'pdfScope')?.content.toString('utf8') || 'node';
    const pdfLessonPath = cleanRelativePath(
      parts.find((part) => part.name === 'pdfLessonPath')?.content.toString('utf8') || ''
    );
    const pdfScope = pdfScopeRaw === 'lesson' || pdfScopeRaw === 'course' ? pdfScopeRaw : 'node';
    const folder = buildCoursePath(pdfCourse, pdfFolder);
    const pdfs = parts.filter((part) => part.name === 'pdfFiles' && part.filename && part.content.length);

    if (!pdfs.length) {
      return sendJson(res, 400, { error: 'Selecione ao menos um PDF.' });
    }

    await fs.mkdir(filesDir, { recursive: true });
    const folderPath = safeJoin(filesDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    const saved = [];
    for (const pdf of pdfs) {
      const cleanName = cleanPathPart(path.basename(pdf.filename));
      if (path.extname(cleanName).toLowerCase() !== '.pdf') {
        return sendJson(res, 400, { error: 'Envie apenas arquivos PDF.' });
      }

      const destination = await uniqueFilePath(folderPath, cleanName);
      await fs.writeFile(destination, pdf.content);
      const relativePath = cleanRelativePath(path.relative(filesDir, destination));
      await ensureFileResource(relativePath, pdfScope, pdfLessonPath);
      saved.push(path.basename(destination));
    }

    sendJson(res, 200, {
      ok: true,
      message: saved.length === 1 ? 'PDF adicionado.' : 'PDFs adicionados.',
      saved,
      listing: await listDirectory(folder)
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || 'Falha ao adicionar PDF.'
    });
  }
}

async function handleAudioUpload(req, res) {
  try {
    const contentType = req.headers['content-type'] || '';
    const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)?.[1] ||
      /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)?.[2];

    if (!boundary) {
      return sendJson(res, 400, { error: 'Envio invalido.' });
    }

    const body = await readRawBody(req, 1024 * 1024 * 1024 * 2);
    const parts = parseMultipart(body, boundary);
    const audioFolder = cleanRelativePath(
      parts.find((part) => part.name === 'audioFolder')?.content.toString('utf8') || ''
    );
    const audioCourse = parts.find((part) => part.name === 'audioCourse')?.content.toString('utf8') || '';
    const audioScopeRaw = parts.find((part) => part.name === 'audioScope')?.content.toString('utf8') || 'node';
    const audioLessonPath = cleanRelativePath(
      parts.find((part) => part.name === 'audioLessonPath')?.content.toString('utf8') || ''
    );
    const audioScope = audioScopeRaw === 'lesson' || audioScopeRaw === 'course' ? audioScopeRaw : 'node';
    const folder = buildCoursePath(audioCourse, audioFolder);
    const audios = parts.filter((part) => part.name === 'audioFiles' && part.filename && part.content.length);

    if (!audios.length) {
      return sendJson(res, 400, { error: 'Selecione ao menos um audio.' });
    }

    await fs.mkdir(filesDir, { recursive: true });
    const folderPath = safeJoin(filesDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    const saved = [];
    for (const audio of audios) {
      const cleanName = cleanPathPart(path.basename(audio.filename));
      if (!audioExtensions.has(path.extname(cleanName).toLowerCase())) {
        return sendJson(res, 400, { error: 'Envie apenas arquivos de audio.' });
      }

      const destination = await uniqueFilePath(folderPath, cleanName);
      await fs.writeFile(destination, audio.content);
      const relativePath = cleanRelativePath(path.relative(filesDir, destination));
      await ensureFileResource(relativePath, audioScope, audioLessonPath);
      saved.push(path.basename(destination));
    }

    sendJson(res, 200, {
      ok: true,
      message: saved.length === 1 ? 'Audio adicionado.' : 'Audios adicionados.',
      saved,
      listing: await listDirectory(folder)
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || 'Falha ao adicionar audio.'
    });
  }
}

async function handleVideoUpload(req, res) {
  try {
    const contentType = req.headers['content-type'] || '';
    const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)?.[1] ||
      /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)?.[2];

    if (!boundary) {
      return sendJson(res, 400, { error: 'Envio invalido.' });
    }

    const body = await readRawBody(req, 1024 * 1024 * 1024 * 4);
    const parts = parseMultipart(body, boundary);
    const videoCourse = parts.find((part) => part.name === 'videoCourse')?.content.toString('utf8') || '';
    const videoFolder = cleanRelativePath(
      parts.find((part) => part.name === 'videoFolder')?.content.toString('utf8') || ''
    );
    const videoTitle = cleanPathPart(
      parts.find((part) => part.name === 'videoTitle')?.content.toString('utf8') || ''
    );
    const description = String(
      parts.find((part) => part.name === 'videoDescription')?.content.toString('utf8') || ''
    ).trim().slice(0, 8000);
    const video = parts.find((part) => part.name === 'videoFile' && part.filename && part.content.length);
    const folder = buildCoursePath(videoCourse, videoFolder);

    if (!videoCourse || !folder || !video) {
      return sendJson(res, 400, { error: 'Informe curso, unidade e video.' });
    }

    const originalName = cleanPathPart(path.basename(video.filename));
    if (path.extname(originalName).toLowerCase() !== '.mp4') {
      return sendJson(res, 400, { error: 'Envie apenas videos .mp4.' });
    }

    await fs.mkdir(filesDir, { recursive: true });
    const folderPath = safeJoin(filesDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    const finalName = `${videoTitle || path.basename(originalName, path.extname(originalName))}.mp4`;
    const destination = await uniqueFilePath(folderPath, finalName);
    await fs.writeFile(destination, video.content);
    const relativePath = cleanRelativePath(path.relative(filesDir, destination));
    const lesson = await ensureLessonForFile(relativePath, { description, links: [] });
    if (lesson && description) {
      await dbExec(`UPDATE lessons SET description = ${sqlValue(description)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${lesson.id};`);
    }

    sendJson(res, 200, {
      ok: true,
      message: 'Video enviado.',
      saved: path.basename(destination),
      listing: await listDirectory(folder)
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || 'Falha ao enviar video.'
    });
  }
}

function normalizeLinks(value) {
  const links = Array.isArray(value) ? value : [];

  return links
    .map((link) => ({
      title: String(link?.title || '').trim().slice(0, 200),
      url: String(link?.url || '').trim()
    }))
    .filter((link) => {
      if (!link.url) return false;
      try {
        const parsed = new URL(link.url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    })
    .slice(0, 50);
}

async function handleMediaMetadata(req, res) {
  try {
    const body = await readRawBody(req, 1024 * 128);
    const data = JSON.parse(body.toString('utf8') || '{}');
    const filePath = cleanRelativePath(data.path);

    if (!filePath || path.extname(filePath).toLowerCase() !== '.mp4') {
      return sendJson(res, 400, { error: 'Informe um video valido.' });
    }

    const absolute = safeJoin(filesDir, filePath);
    const stat = await fs.stat(absolute);
    if (!stat.isFile()) {
      return sendJson(res, 404, { error: 'Video nao encontrado.' });
    }

    const metadata = await readMediaMetadata();
    const now = new Date().toISOString();
    const description = String(data.description || '').trim().slice(0, 8000);
    const links = normalizeLinks(data.links);

    if (!description && !links.length) {
      delete metadata.files[filePath];
    } else {
      metadata.files[filePath] = {
        description,
        links,
        updatedAt: now
      };
    }

    await writeMediaMetadata(metadata);
    const lesson = await ensureLessonForFile(filePath, { description, links });
    if (lesson) {
      await dbExec(`UPDATE lessons SET description = ${sqlValue(description)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${lesson.id};`);
      await dbExec(`DELETE FROM resources WHERE type = 'link' AND scope = 'lesson' AND lesson_id = ${lesson.id};`);
      await syncLessonLinks(lesson.id, lesson.course_id, links);
    }

    sendJson(res, 200, {
      ok: true,
      message: 'Detalhes do video salvos.',
      path: filePath,
      metadata: metadata.files[filePath] || null,
      listing: await listDirectory(path.dirname(filePath).replace(/^\.$/, ''))
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: 'JSON invalido.' });
      return;
    }
    sendJson(res, 500, {
      error: error.message || 'Falha ao salvar detalhes do video.'
    });
  }
}

async function handleCreateNode(req, res) {
  try {
    const body = await readBody(req);
    const form = new URLSearchParams(body);
    const courseName = form.get('nodeCourse');
    const parentFolder = cleanRelativePath(form.get('nodeParentFolder'));
    const title = cleanPathPart(form.get('nodeTitle'));
    const description = String(form.get('nodeDescription') || '').trim().slice(0, 8000);
    const parentPath = buildCoursePath(courseName, parentFolder);
    const nodePath = cleanRelativePath(path.join(parentPath, title));

    if (!courseName || !title) {
      return sendJson(res, 400, { error: 'Informe curso e nome da unidade.' });
    }

    await fs.mkdir(safeJoin(filesDir, nodePath), { recursive: true });
    const { course, node: parent } = await ensureNodeForPath(parentPath);
    let node = await dbOne(`SELECT * FROM nodes WHERE path = ${sqlValue(nodePath)}`);
    if (node) {
      await dbExec(`
        UPDATE nodes
        SET description = ${sqlValue(description)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${node.id};
      `);
    } else {
      await dbExec(`
        INSERT INTO nodes (course_id, parent_id, title, description, path)
        VALUES (${course.id}, ${parent ? parent.id : 'NULL'}, ${sqlValue(title)}, ${sqlValue(description)}, ${sqlValue(nodePath)});
      `);
    }

    sendJson(res, 200, {
      ok: true,
      message: 'Unidade cadastrada.',
      listing: await listDirectory(parentPath)
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Falha ao cadastrar unidade.' });
  }
}

async function handleNodeMetadata(req, res) {
  try {
    const body = await readRawBody(req, 1024 * 64);
    const data = JSON.parse(body.toString('utf8') || '{}');
    const nodePath = cleanRelativePath(data.path);
    const description = String(data.description || '').trim().slice(0, 8000);

    if (!nodePath) {
      return sendJson(res, 400, { error: 'Informe a unidade.' });
    }

    const { node } = await ensureNodeForPath(nodePath);
    if (!node) {
      return sendJson(res, 404, { error: 'Unidade nao encontrada.' });
    }

    await dbExec(`
      UPDATE nodes
      SET description = ${sqlValue(description)},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${node.id};
    `);

    sendJson(res, 200, {
      ok: true,
      message: 'Descricao salva.',
      listing: await listDirectory(nodePath)
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: 'JSON invalido.' });
      return;
    }
    sendJson(res, 500, { error: error.message || 'Falha ao salvar unidade.' });
  }
}

async function handleResourceLink(req, res) {
  try {
    const body = await readBody(req);
    const form = new URLSearchParams(body);
    const courseName = form.get('resourceCourse');
    const folder = buildCoursePath(courseName, form.get('resourceFolder'));
    const scopeRaw = form.get('resourceScope') || 'node';
    const scope = scopeRaw === 'course' || scopeRaw === 'lesson' ? scopeRaw : 'node';
    const title = String(form.get('resourceTitle') || '').trim().slice(0, 200);
    const description = String(form.get('resourceDescription') || '').trim().slice(0, 4000);
    const url = String(form.get('resourceUrl') || '').trim();
    const lessonPath = cleanRelativePath(form.get('resourceLessonPath'));

    if (!courseName || !url) {
      return sendJson(res, 400, { error: 'Informe curso e URL.' });
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return sendJson(res, 400, { error: 'Informe uma URL http ou https.' });
      }
    } catch {
      return sendJson(res, 400, { error: 'Informe uma URL valida.' });
    }

    const { course, node } = await ensureNodeForPath(folder);
    if (!course) {
      return sendJson(res, 400, { error: 'Informe um curso valido.' });
    }
    let lesson = null;
    if (scope === 'lesson') {
      if (!lessonPath) return sendJson(res, 400, { error: 'Informe a aula do link.' });
      lesson = await ensureLessonForFile(lessonPath);
    }

    await dbExec(`
      INSERT INTO resources (course_id, node_id, lesson_id, type, scope, title, description, url)
      VALUES (
        ${course.id},
        ${scope === 'course' ? 'NULL' : node ? node.id : 'NULL'},
        ${lesson ? lesson.id : 'NULL'},
        'link',
        ${sqlValue(scope)},
        ${sqlValue(title || url)},
        ${sqlValue(description)},
        ${sqlValue(url)}
      );
    `);

    sendJson(res, 200, {
      ok: true,
      message: 'Link adicionado.',
      listing: await listDirectory(folder)
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Falha ao adicionar link.' });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') {
    const file = path.join(rootDir, 'public', 'index.html');
    send(res, 200, await fs.readFile(file), { 'content-type': mimeTypes.get('.html') });
    return;
  }

  if (pathname === '/api/files') {
    await fs.mkdir(filesDir, { recursive: true });
    sendJson(res, 200, { listing: await listDirectory(url.searchParams.get('dir') || '') });
    return;
  }

  if (pathname === '/api/courses') {
    sendJson(res, 200, { courses: await listCourses() });
    return;
  }

  if (pathname.startsWith('/files/')) {
    const relative = pathname.slice('/files/'.length);
    const file = safeJoin(filesDir, cleanRelativePath(relative));
    const stat = await fs.stat(file);
    if (!stat.isFile()) {
      return send(res, 404, 'Arquivo nao encontrado.');
    }
    const ext = path.extname(file).toLowerCase();
    const contentType = mimeTypes.get(ext) || 'application/octet-stream';
    const range = req.headers.range;
    if (range && /^(audio|video)\//.test(contentType)) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start <= end && end < stat.size) {
          res.writeHead(206, {
            'content-type': contentType,
            'accept-ranges': 'bytes',
            'content-range': `bytes ${start}-${end}/${stat.size}`,
            'content-length': end - start + 1
          });
          createReadStream(file, { start, end }).pipe(res);
          return;
        }
      }
    }
    res.writeHead(200, {
      'content-type': contentType,
      'accept-ranges': /^(audio|video)\//.test(contentType) ? 'bytes' : 'none',
      'content-length': stat.size
    });
    createReadStream(file).pipe(res);
    return;
  }

  if (pathname.startsWith('/public/')) {
    const file = safeJoin(path.join(rootDir, 'public'), pathname.slice('/public/'.length));
    const stat = await fs.stat(file);
    if (!stat.isFile()) {
      return send(res, 404, 'Arquivo nao encontrado.');
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'content-type': mimeTypes.get(ext) || 'application/octet-stream' });
    createReadStream(file).pipe(res);
    return;
  }

  send(res, 404, 'Pagina nao encontrada.');
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/download') {
      await handleDownload(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/upload-pdfs') {
      await handlePdfUpload(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/upload-audios') {
      await handleAudioUpload(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/upload-video') {
      await handleVideoUpload(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/courses') {
      await handleCreateCourse(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/nodes') {
      await handleCreateNode(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/node-metadata') {
      await handleNodeMetadata(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/resource-links') {
      await handleResourceLink(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/media-metadata') {
      await handleMediaMetadata(req, res);
      return;
    }

    if (req.method === 'GET') {
      await serveStatic(req, res);
      return;
    }

    send(res, 405, 'Metodo nao permitido.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      send(res, 404, 'Arquivo nao encontrado.');
    } else {
      send(res, 500, error.message || 'Erro interno.');
    }
  }
});

await initDatabase();
server.listen(port, host, () => {
  console.log(`Servidor em http://${host}:${port}`);
});
