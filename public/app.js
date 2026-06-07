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
const pageTitle = document.querySelector('#page-title');
const libraryHeading = document.querySelector('#library-heading');
const courseCount = document.querySelector('#course-count');
const mediaCount = document.querySelector('#media-count');
const nowPlaying = document.querySelector('#now-playing');
const managePanel = document.querySelector('#manage-panel');
const libraryTab = document.querySelector('#library-tab');
const manageTab = document.querySelector('#manage-tab');
const openManage = document.querySelector('#open-manage');
const closeManage = document.querySelector('#close-manage');

let currentDir = '';
let courses = [];
let lastListing = null;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function setStatus(target, message, isError = false) {
  target.textContent = message;
  target.classList.toggle('error', isError);
}

function cleanTitle(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
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

function isPdf(file) {
  return file.name.toLowerCase().endsWith('.pdf');
}

function selectedCourse() {
  return courseSelect.value || pdfCourseSelect.value || courses[0]?.name || '';
}

function normalizeCourse(course) {
  if (typeof course === 'string') return { name: course, description: '' };
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
  courseCount.textContent = `${courses.length} ${courses.length === 1 ? 'curso' : 'cursos'}`;
}

function updateCourseDescription() {
  if (!currentDir) {
    courseDescriptionEl.textContent = '';
    return;
  }

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

function openManagePanel() {
  managePanel.classList.add('open');
  manageTab.classList.add('active');
  libraryTab.classList.remove('active');
}

function closeManagePanel() {
  managePanel.classList.remove('open');
  manageTab.classList.remove('active');
  libraryTab.classList.add('active');
}

function renderBreadcrumb(current) {
  breadcrumb.replaceChildren();
  const rootButton = createCrumb('Biblioteca', '');
  breadcrumb.append(rootButton);
  if (!current) return;

  let partial = '';
  for (const part of current.split('/')) {
    partial = partial ? `${partial}/${part}` : part;
    const separator = document.createElement('span');
    separator.className = 'separator';
    separator.textContent = '/';
    breadcrumb.append(separator, createCrumb(part, partial));
  }
}

function createCrumb(label, target) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'crumb';
  button.textContent = label;
  button.addEventListener('click', () => loadDirectory(target));
  return button;
}

function listingTitle() {
  if (!currentDir) return 'Sua biblioteca';
  const parts = currentDir.split('/').filter(Boolean);
  return parts.at(-1) || 'Sua biblioteca';
}

function renderListing(listing) {
  const directories = listing.directories || [];
  const files = listing.files || [];
  currentDir = listing.current || '';
  lastListing = listing;
  syncFormsWithDirectory();
  renderBreadcrumb(currentDir);
  updateCourseDescription();
  nowPlaying.hidden = true;
  nowPlaying.replaceChildren();
  fileList.replaceChildren();

  pageTitle.textContent = listingTitle();
  libraryHeading.textContent = currentDir ? 'Conteúdo desta seção' : 'Cursos em destaque';
  mediaCount.textContent = `${directories.length + files.length} ${directories.length + files.length === 1 ? 'item nesta pasta' : 'itens nesta pasta'}`;

  if (currentDir) {
    fileList.append(createBackCard(listing.parent || ''));
  }

  if (!directories.length && !files.length) {
    fileList.append(createEmptyState());
    return;
  }

  if (directories.length) {
    const shelf = createShelf(currentDir ? 'Pastas e módulos' : 'Cursos', directories.map(createDirectoryCard));
    fileList.append(shelf);
  }

  const videos = files.filter(isVideo);
  const pdfs = files.filter(isPdf);
  const otherFiles = files.filter((file) => !isVideo(file) && !isPdf(file));

  if (videos.length) {
    fileList.append(createShelf('Aulas em video', videos.map(createVideoCard)));
  }

  if (pdfs.length) {
    fileList.append(createShelf('Materiais', pdfs.map(createFileCard)));
  }

  if (otherFiles.length) {
    fileList.append(createShelf('Outros arquivos', otherFiles.map(createFileCard)));
  }
}

function createShelf(title, cards) {
  const section = document.createElement('section');
  section.className = 'shelf';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const row = document.createElement('div');
  row.className = 'media-row';
  row.append(...cards);

  section.append(heading, row);
  return section;
}

function createBackCard(parent) {
  const wrapper = document.createElement('section');
  wrapper.className = 'quick-row';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-card';
  button.textContent = '← Voltar';
  button.addEventListener('click', () => loadDirectory(parent));
  wrapper.append(button);
  return wrapper;
}

function createEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = '<strong>Nada por aqui ainda.</strong><span>Use Adicionar conteúdo para baixar aulas ou anexar PDFs nesta pasta.</span>';
  return empty;
}

function createDirectoryCard(directory) {
  const course = courseByName(directory.name);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'collection-card';
  button.addEventListener('click', () => loadDirectory(directory.path));

  const art = document.createElement('span');
  art.className = 'poster-art';
  art.textContent = initials(directory.name);

  const title = document.createElement('strong');
  title.textContent = directory.name;

  const meta = document.createElement('span');
  meta.textContent = course?.description || `Atualizado em ${formatDate(directory.modifiedAt)}`;

  button.append(art, title, meta);
  return button;
}

function createVideoCard(file) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-card';
  button.addEventListener('click', () => renderPlayer(file));

  const thumb = document.createElement('span');
  thumb.className = 'video-thumb';
  thumb.innerHTML = '<span>▶</span>';

  const title = document.createElement('strong');
  title.textContent = cleanTitle(file.name);

  const meta = document.createElement('span');
  meta.textContent = `${formatSize(file.size)} · ${formatDate(file.modifiedAt)}`;

  button.append(thumb, title, meta);
  return button;
}

function createFileCard(file) {
  const link = document.createElement('a');
  link.className = 'file-card';
  link.href = fileHref(file.path);
  link.target = '_blank';
  link.rel = 'noreferrer';

  const icon = document.createElement('span');
  icon.className = isPdf(file) ? 'file-icon pdf' : 'file-icon';
  icon.textContent = isPdf(file) ? 'PDF' : 'FILE';

  const title = document.createElement('strong');
  title.textContent = cleanTitle(file.name);

  const meta = document.createElement('span');
  meta.textContent = `${formatSize(file.size)} · ${formatDate(file.modifiedAt)}`;

  link.append(icon, title, meta);
  return link;
}

function initials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function renderPlayer(file) {
  nowPlaying.hidden = false;
  nowPlaying.replaceChildren();

  const video = document.createElement('video');
  video.controls = true;
  video.src = fileHref(file.path);
  video.preload = 'metadata';

  const details = document.createElement('div');
  details.className = 'player-details';

  const label = document.createElement('span');
  label.className = 'eyebrow';
  label.textContent = pathLabel(currentDir);

  const title = document.createElement('h2');
  title.textContent = cleanTitle(file.name);

  const meta = document.createElement('p');
  meta.className = 'muted-text';
  meta.textContent = `${formatSize(file.size)} · atualizado em ${formatDate(file.modifiedAt)}`;

  const description = document.createElement('p');
  description.className = 'video-description';
  description.textContent = file.metadata?.description || 'Sem descrição salva para esta aula.';

  const actions = document.createElement('div');
  actions.className = 'player-actions';

  const open = document.createElement('a');
  open.className = 'secondary-action';
  open.href = fileHref(file.path);
  open.target = '_blank';
  open.rel = 'noreferrer';
  open.textContent = 'Abrir arquivo';

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'secondary-action';
  edit.textContent = 'Editar detalhes';
  edit.addEventListener('click', () => {
    const existing = nowPlaying.querySelector('.metadata-form');
    if (existing) {
      existing.hidden = !existing.hidden;
      return;
    }
    details.append(createMetadataEditor(file));
  });

  actions.append(open, edit);
  details.append(label, title, meta, description, renderLinks(file), actions);
  nowPlaying.append(video, details);
  nowPlaying.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLinks(file) {
  const links = file.metadata?.links || [];
  const wrapper = document.createElement('div');
  wrapper.className = 'video-links';
  for (const link of links) {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.textContent = link.title || link.url;
    wrapper.append(anchor);
  }
  return wrapper;
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

function createMetadataEditor(file) {
  const editor = document.createElement('form');
  editor.className = 'metadata-form';

  const descriptionLabel = document.createElement('label');
  descriptionLabel.textContent = 'Descrição do video';

  const description = document.createElement('textarea');
  description.name = 'description';
  description.rows = 4;
  description.value = file.metadata?.description || '';

  const linksLabel = document.createElement('label');
  linksLabel.textContent = 'Links';

  const linksContainer = document.createElement('div');
  linksContainer.className = 'metadata-links';
  for (const link of file.metadata?.links || []) appendLinkRow(linksContainer, link);
  if (!linksContainer.children.length) appendLinkRow(linksContainer);

  const actions = document.createElement('div');
  actions.className = 'metadata-actions';

  const addLink = document.createElement('button');
  addLink.type = 'button';
  addLink.className = 'secondary-action';
  addLink.textContent = 'Adicionar link';
  addLink.addEventListener('click', () => appendLinkRow(linksContainer));

  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Salvar detalhes';

  const status = document.createElement('span');
  status.className = 'metadata-status';

  actions.append(addLink, save, status);
  editor.append(descriptionLabel, description, linksLabel, linksContainer, actions);

  editor.addEventListener('submit', async (event) => {
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
      if (!response.ok) throw new Error(data.error || 'Falha ao salvar detalhes.');
      renderListing(data.listing || lastListing || { current: currentDir, directories: [], files: [] });
      setStatus(statusEl, data.message || 'Detalhes salvos.');
    } catch (error) {
      status.textContent = error.message;
    } finally {
      save.disabled = false;
    }
  });

  return editor;
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
  setStatus(courseStatusEl, 'Criando...');
  try {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(courseForm))
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao cadastrar curso.');
    setCourses(data.courses || courses);
    renderCourseOptions(data.course?.name);
    renderListing(data.listing || { current: data.course?.name, directories: [], files: [] });
    setStatus(courseStatusEl, data.message || 'Curso cadastrado.');
    courseForm.reset();
    closeManagePanel();
  } catch (error) {
    setStatus(courseStatusEl, error.message, true);
  } finally {
    courseButton.disabled = false;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus(statusEl, 'Baixando...');
  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form))
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao baixar aula.');
    renderListing(data.listing || { current: currentDir, directories: [], files: [] });
    setStatus(statusEl, data.message || 'Download concluido.');
    form.reset();
    syncFormsWithDirectory();
  } catch (error) {
    setStatus(statusEl, error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

pdfForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  pdfButton.disabled = true;
  setStatus(pdfStatusEl, 'Adicionando...');
  try {
    const response = await fetch('/api/upload-pdfs', {
      method: 'POST',
      body: new FormData(pdfForm)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao adicionar PDFs.');
    renderListing(data.listing || { current: currentDir, directories: [], files: [] });
    setStatus(pdfStatusEl, data.message || 'PDFs adicionados.');
    pdfForm.reset();
    syncFormsWithDirectory();
  } catch (error) {
    setStatus(pdfStatusEl, error.message, true);
  } finally {
    pdfButton.disabled = false;
  }
});

refreshButton.addEventListener('click', () => {
  Promise.all([loadCourses(), loadDirectory()]).catch((error) => setStatus(statusEl, error.message, true));
});

openManage.addEventListener('click', openManagePanel);
manageTab.addEventListener('click', openManagePanel);
closeManage.addEventListener('click', closeManagePanel);
libraryTab.addEventListener('click', closeManagePanel);

courseSelect.addEventListener('change', () => {
  pdfCourseSelect.value = courseSelect.value;
  updateCourseDescription();
});

pdfCourseSelect.addEventListener('change', () => {
  courseSelect.value = pdfCourseSelect.value;
  updateCourseDescription();
});

Promise.all([loadCourses(), loadDirectory()]).catch((error) => setStatus(statusEl, error.message, true));
