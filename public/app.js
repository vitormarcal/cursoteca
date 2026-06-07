const form = document.querySelector('#download-form');
const pdfForm = document.querySelector('#pdf-form');
const courseForm = document.querySelector('#course-form');
const submitButton = document.querySelector('#submit-button');
const pdfButton = document.querySelector('#pdf-button');
const courseButton = document.querySelector('#course-button');
const refreshButton = document.querySelector('#refresh-button');
const statusEl = document.querySelector('#status');
const pdfStatusEl = document.querySelector('#pdf-status');
const courseStatusEl = document.querySelector('#course-status');
const fileList = document.querySelector('#file-list');
const breadcrumb = document.querySelector('#breadcrumb');
const courseDescriptionEl = document.querySelector('#course-description');
const courseSelect = document.querySelector('#course');
const pdfCourseSelect = document.querySelector('#pdfCourse');
const lessonFolderInput = document.querySelector('#lessonFolder');
const pdfFolderInput = document.querySelector('#pdfFolder');

let currentDir = '';
let courses = [];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function setPdfStatus(message, isError = false) {
  pdfStatusEl.textContent = message;
  pdfStatusEl.classList.toggle('error', isError);
}

function setCourseStatus(message, isError = false) {
  courseStatusEl.textContent = message;
  courseStatusEl.classList.toggle('error', isError);
}

function pathLabel(value) {
  return value || 'arquivos';
}

function fileHref(filePath) {
  return `/files/${filePath.split('/').map(encodeURIComponent).join('/')}`;
}

function isVideo(file) {
  return file.name.toLowerCase().endsWith('.mp4');
}

function linkRowsToLinks(container) {
  return [...container.querySelectorAll('.metadata-link-row')]
    .map((row) => ({
      title: row.querySelector('[name="linkTitle"]').value,
      url: row.querySelector('[name="linkUrl"]').value
    }))
    .filter((link) => link.title.trim() || link.url.trim());
}

function appendLinkRow(container, link = {}) {
  const row = document.createElement('div');
  row.className = 'metadata-link-row';

  const title = document.createElement('input');
  title.name = 'linkTitle';
  title.type = 'text';
  title.placeholder = 'Nome do link';
  title.value = link.title || '';

  const url = document.createElement('input');
  url.name = 'linkUrl';
  url.type = 'url';
  url.placeholder = 'https://...';
  url.value = link.url || '';

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'icon-action';
  remove.textContent = 'Remover';
  remove.addEventListener('click', () => row.remove());

  row.append(title, url, remove);
  container.append(row);
}

function renderVideoDetails(file, parent) {
  const metadata = file.metadata || {};
  const description = metadata.description || '';
  const links = metadata.links || [];

  if (description) {
    const text = document.createElement('p');
    text.className = 'video-description';
    text.textContent = description;
    parent.append(text);
  }

  if (links.length) {
    const list = document.createElement('div');
    list.className = 'video-links';
    for (const link of links) {
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      anchor.textContent = link.title || link.url;
      list.append(anchor);
    }
    parent.append(list);
  }
}

function createMetadataEditor(file) {
  const form = document.createElement('form');
  form.className = 'metadata-form';
  form.hidden = true;

  const descriptionLabel = document.createElement('label');
  descriptionLabel.textContent = 'Descrição do vídeo';

  const description = document.createElement('textarea');
  description.name = 'description';
  description.rows = 4;
  description.value = file.metadata?.description || '';

  const linksLabel = document.createElement('label');
  linksLabel.textContent = 'Links';

  const linksContainer = document.createElement('div');
  linksContainer.className = 'metadata-links';
  for (const link of file.metadata?.links || []) {
    appendLinkRow(linksContainer, link);
  }
  if (!linksContainer.children.length) {
    appendLinkRow(linksContainer);
  }

  const actions = document.createElement('div');
  actions.className = 'metadata-actions';

  const addLink = document.createElement('button');
  addLink.type = 'button';
  addLink.className = 'secondary compact';
  addLink.textContent = 'Adicionar link';
  addLink.addEventListener('click', () => appendLinkRow(linksContainer));

  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'compact';
  save.textContent = 'Salvar detalhes';

  const status = document.createElement('span');
  status.className = 'metadata-status';

  actions.append(addLink, save, status);
  form.append(descriptionLabel, description, linksLabel, linksContainer, actions);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    save.disabled = true;
    status.textContent = 'Salvando...';

    try {
      const response = await fetch('/api/media-metadata', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          path: file.path,
          description: description.value,
          links: linkRowsToLinks(linksContainer)
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar detalhes.');
      }

      renderListing(data.listing || { current: currentDir, directories: [], files: [] });
      setStatus(data.message || 'Detalhes salvos.');
    } catch (error) {
      status.textContent = error.message;
    } finally {
      save.disabled = false;
    }
  });

  return form;
}

function selectedCourse() {
  return courseSelect.value || pdfCourseSelect.value || courses[0]?.name || '';
}

function normalizeCourse(course) {
  if (typeof course === 'string') {
    return { name: course, description: '' };
  }
  return {
    name: course?.name || '',
    description: course?.description || '',
    createdAt: course?.createdAt || null,
    updatedAt: course?.updatedAt || null
  };
}

function courseExists(name) {
  return courses.some((course) => course.name === name);
}

function courseByName(name) {
  return courses.find((course) => course.name === name);
}

function setCourses(nextCourses) {
  courses = (nextCourses || [])
    .map(normalizeCourse)
    .filter((course) => course.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function updateCourseDescription() {
  const topLevel = currentDir.split('/').filter(Boolean)[0];
  const course = courseByName(topLevel || selectedCourse());
  courseDescriptionEl.textContent = course?.description || '';
}

function setSelectValue(select, value) {
  if (value && !courseExists(value)) {
    courses.push({ name: value, description: '' });
    courses.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    renderCourseOptions(value);
    return;
  }

  select.value = value || courses[0]?.name || '';
}

function renderCourseOptions(preferred = selectedCourse()) {
  for (const select of [courseSelect, pdfCourseSelect]) {
    select.replaceChildren();

    if (!courses.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Cadastre um curso';
      select.append(option);
      select.disabled = true;
      continue;
    }

    select.disabled = false;
    for (const course of courses) {
      const option = document.createElement('option');
      option.value = course.name;
      option.textContent = course.name;
      select.append(option);
    }
    select.value = preferred && courseExists(preferred) ? preferred : courses[0].name;
  }
  updateCourseDescription();
}

function syncFormsWithDirectory() {
  const parts = currentDir.split('/').filter(Boolean);

  if (parts.length) {
    setSelectValue(courseSelect, parts[0]);
    setSelectValue(pdfCourseSelect, parts[0]);
    lessonFolderInput.value = parts.slice(1).join('/');
    pdfFolderInput.value = parts.slice(1).join('/');
    return;
  }

  const course = selectedCourse();
  setSelectValue(courseSelect, course);
  setSelectValue(pdfCourseSelect, course);
  lessonFolderInput.value = '';
  pdfFolderInput.value = '';
}

function renderBreadcrumb(current) {
  breadcrumb.replaceChildren();

  const rootButton = document.createElement('button');
  rootButton.type = 'button';
  rootButton.className = 'crumb';
  rootButton.textContent = 'arquivos';
  rootButton.addEventListener('click', () => loadDirectory(''));
  breadcrumb.append(rootButton);

  if (!current) return;

  let partial = '';
  for (const part of current.split('/')) {
    partial = partial ? `${partial}/${part}` : part;
    const target = partial;
    const separator = document.createElement('span');
    separator.className = 'separator';
    separator.textContent = '/';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'crumb';
    button.textContent = part;
    button.addEventListener('click', () => loadDirectory(target));

    breadcrumb.append(separator, button);
  }
}

function renderListing(listing) {
  const directories = listing.directories || [];
  const files = listing.files || [];
  currentDir = listing.current || '';
  syncFormsWithDirectory();
  renderBreadcrumb(currentDir);
  updateCourseDescription();
  fileList.replaceChildren();

  if (currentDir) {
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'directory-row';
    up.textContent = 'Voltar';
    up.addEventListener('click', () => loadDirectory(listing.parent || ''));
    fileList.append(up);
  }

  if (!directories.length && !files.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Esta pasta esta vazia.';
    fileList.append(empty);
    return;
  }

  for (const directory of directories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'directory-row';
    button.textContent = directory.name;
    button.addEventListener('click', () => loadDirectory(directory.path));
    fileList.append(button);
  }

  for (const file of files) {
    const row = document.createElement('article');
    row.className = 'file-row';

    const main = document.createElement('div');
    const link = document.createElement('a');
    link.className = 'file-name';
    link.href = fileHref(file.path);
    link.textContent = file.name;
    link.target = '_blank';
    link.rel = 'noreferrer';

    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.textContent = `${pathLabel(currentDir)} · ${formatSize(file.size)}`;

    main.append(link, meta);

    if (isVideo(file)) {
      renderVideoDetails(file, main);
      const editor = createMetadataEditor(file);
      const details = document.createElement('button');
      details.type = 'button';
      details.className = 'secondary compact';
      details.textContent = 'Detalhes';
      details.addEventListener('click', () => {
        editor.hidden = !editor.hidden;
      });
      row.append(main, details);
      fileList.append(row, editor);
      continue;
    }

    row.append(main);
    fileList.append(row);
  }
}

async function loadDirectory(dir = currentDir) {
  const response = await fetch(`/api/files?dir=${encodeURIComponent(dir)}`);
  const data = await response.json();
  renderListing(data.listing || { current: dir, directories: [], files: [] });
}

async function loadCourses(preferred) {
  const response = await fetch('/api/courses');
  const data = await response.json();
  setCourses(data.courses);
  renderCourseOptions(preferred);
  syncFormsWithDirectory();
}

courseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  courseButton.disabled = true;
  setCourseStatus('Criando...');

  try {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(courseForm))
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao cadastrar curso.');
    }

    setCourses(data.courses || courses);
    renderCourseOptions(data.course?.name);
    renderListing(data.listing || { current: data.course?.name, directories: [], files: [] });
    setCourseStatus(data.message || 'Curso cadastrado.');
    courseForm.reset();
  } catch (error) {
    setCourseStatus(error.message, true);
  } finally {
    courseButton.disabled = false;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus('Baixando...');

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form))
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao baixar aula.');
    }

    renderListing(data.listing || { current: currentDir, directories: [], files: [] });
    setStatus(data.message || 'Download concluido.');
    form.reset();
    syncFormsWithDirectory();
    lessonFolderInput.focus();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

pdfForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  pdfButton.disabled = true;
  setPdfStatus('Adicionando...');

  try {
    const response = await fetch('/api/upload-pdfs', {
      method: 'POST',
      body: new FormData(pdfForm)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao adicionar PDFs.');
    }

    renderListing(data.listing || { current: currentDir, directories: [], files: [] });
    setPdfStatus(data.message || 'PDFs adicionados.');
    pdfForm.reset();
    syncFormsWithDirectory();
  } catch (error) {
    setPdfStatus(error.message, true);
  } finally {
    pdfButton.disabled = false;
  }
});

refreshButton.addEventListener('click', () => {
  loadDirectory().catch((error) => setStatus(error.message, true));
});

courseSelect.addEventListener('change', () => {
  pdfCourseSelect.value = courseSelect.value;
  updateCourseDescription();
});

pdfCourseSelect.addEventListener('change', () => {
  courseSelect.value = pdfCourseSelect.value;
  updateCourseDescription();
});

Promise.all([loadCourses(), loadDirectory()]).catch((error) => setStatus(error.message, true));
