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

function selectedCourse() {
  return courseSelect.value || pdfCourseSelect.value || courses[0] || '';
}

function setSelectValue(select, value) {
  if (value && !courses.includes(value)) {
    courses.push(value);
    courses.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    renderCourseOptions(value);
    return;
  }

  select.value = value || courses[0] || '';
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
      option.value = course;
      option.textContent = course;
      select.append(option);
    }
    select.value = preferred && courses.includes(preferred) ? preferred : courses[0];
  }
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
  courses = data.courses || [];
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

    courses = data.courses || courses;
    renderCourseOptions(data.course);
    renderListing(data.listing || { current: data.course, directories: [], files: [] });
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
});

pdfCourseSelect.addEventListener('change', () => {
  courseSelect.value = pdfCourseSelect.value;
});

Promise.all([loadCourses(), loadDirectory()]).catch((error) => setStatus(error.message, true));
