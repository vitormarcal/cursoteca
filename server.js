import { createReadStream, promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;
const filesDir = path.join(rootDir, 'arquivos');
const courseMetaPath = path.join(filesDir, '.courses.json');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.mp4', 'video/mp4']
]);

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body), {
    'content-type': 'application/json; charset=utf-8'
  });
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
      directories.push({
        name: entry.name,
        path: relative,
        modifiedAt: stat.mtime.toISOString()
      });
    } else if (entry.isFile() && entry.name !== 'baixar_aula.sh') {
      files.push({
        name: entry.name,
        path: relative,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString()
      });
    }
  }

  directories.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  files.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return {
    current: cleanRelative,
    parent: cleanRelative ? path.dirname(cleanRelative).replace(/^\.$/, '') : null,
    directories,
    files
  };
}

async function listCourses() {
  await fs.mkdir(filesDir, { recursive: true });
  const entries = await fs.readdir(filesDir, { withFileTypes: true });
  const metadata = await readCourseMetadata();

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => {
      const saved = metadata.courses[entry.name] || {};
      return {
        name: entry.name,
        description: saved.description || '',
        createdAt: saved.createdAt || null,
        updatedAt: saved.updatedAt || null
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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
    const name = /name="([^"]+)"/.exec(disposition)?.[1] || '';
    const filename = /filename="([^"]*)"/.exec(disposition)?.[1] || '';

    parts.push({ name, filename, content });
  }

  return parts;
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
    const args = [
      '-o',
      output,
      '--add-headers',
      'Referer:https://player.hotmart.com/',
      '--format',
      'best[height=1080]',
      url
    ];

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

    sendJson(res, 200, {
      ok: true,
      message: 'Curso cadastrado.',
      course: {
        name,
        description,
        createdAt: metadata.courses[name].createdAt,
        updatedAt: now
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
    res.writeHead(200, { 'content-type': mimeTypes.get(ext) || 'application/octet-stream' });
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

    if (req.method === 'POST' && req.url === '/api/courses') {
      await handleCreateCourse(req, res);
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

server.listen(port, host, () => {
  console.log(`Servidor em http://${host}:${port}`);
});
