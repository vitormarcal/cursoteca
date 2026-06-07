const form = document.querySelector('#download-form');
const pdfForm = document.querySelector('#pdf-form');
const courseForm = document.querySelector('#course-form');
const nodeForm = document.querySelector('#node-form');
const resourceForm = document.querySelector('#resource-form');
const videoForm = document.querySelector('#video-form');
const submitButton = document.querySelector('#submit-button');
const pdfButton = document.querySelector('#pdf-button');
const courseButton = document.querySelector('#course-button');
const nodeButton = document.querySelector('#node-button');
const resourceButton = document.querySelector('#resource-button');
const videoButton = document.querySelector('#video-button');
const refreshButton = document.querySelector('#refresh-button');
const statusEl = document.querySelector('#status');
const pdfStatusEl = document.querySelector('#pdf-status');
const courseStatusEl = document.querySelector('#course-status');
const nodeStatusEl = document.querySelector('#node-status');
const resourceStatusEl = document.querySelector('#resource-status');
const videoStatusEl = document.querySelector('#video-status');
const fileList = document.querySelector('#file-list');
const breadcrumb = document.querySelector('#breadcrumb');
const courseDescriptionEl = document.querySelector('#course-description');
const courseSelect = document.querySelector('#course');
const pdfCourseSelect = document.querySelector('#pdfCourse');
const nodeCourseSelect = document.querySelector('#nodeCourse');
const resourceCourseSelect = document.querySelector('#resourceCourse');
const videoCourseSelect = document.querySelector('#videoCourse');
const lessonFolderInput = document.querySelector('#lessonFolder');
const pdfFolderInput = document.querySelector('#pdfFolder');
const nodeParentFolderInput = document.querySelector('#nodeParentFolder');
const resourceFolderInput = document.querySelector('#resourceFolder');
const videoFolderInput = document.querySelector('#videoFolder');
const pdfLessonPathInput = document.querySelector('#pdfLessonPath');
const resourceLessonPathInput = document.querySelector('#resourceLessonPath');
const pdfScopeSelect = document.querySelector('#pdfScope');
const resourceScopeSelect = document.querySelector('#resourceScope');
const pdfLessonLabel = document.querySelector('#pdf-lesson-label');
const resourceLessonLabel = document.querySelector('#resource-lesson-label');
const pageTitle = document.querySelector('#page-title');
const libraryHeading = document.querySelector('#library-heading');
const courseCount = document.querySelector('#course-count');
const mediaCount = document.querySelector('#media-count');
const nowPlaying = document.querySelector('#now-playing');
const libraryTab = document.querySelector('#library-tab');
const manageTab = document.querySelector('#manage-tab');
const openManage = document.querySelector('#open-manage');
const actionList = document.querySelector('#action-list');
const managedForms = [...document.querySelectorAll('.managed-form')];
const contextActions = document.querySelector('#context-actions');

let currentDir = '';
let courses = [];
let lastListing = null;
let selectedLesson = null;
let activeAction = '';
let playerOpen = false;

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
  return courseSelect.value || pdfCourseSelect.value || nodeCourseSelect.value || resourceCourseSelect.value || videoCourseSelect.value || courses[0]?.name || '';
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
  if (lastListing?.context?.node?.description) {
    courseDescriptionEl.textContent = lastListing.context.node.description;
    return;
  }
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
  for (const select of [courseSelect, pdfCourseSelect, nodeCourseSelect, resourceCourseSelect, videoCourseSelect]) {
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
    for (const select of [courseSelect, pdfCourseSelect, nodeCourseSelect, resourceCourseSelect, videoCourseSelect]) {
      setSelectValue(select, parts[0]);
    }
    const folder = parts.slice(1).join('/');
    lessonFolderInput.value = folder;
    pdfFolderInput.value = folder;
    nodeParentFolderInput.value = folder;
    resourceFolderInput.value = folder;
    videoFolderInput.value = folder;
    return;
  }
  const course = selectedCourse();
  for (const select of [courseSelect, pdfCourseSelect, nodeCourseSelect, resourceCourseSelect, videoCourseSelect]) {
    setSelectValue(select, course);
  }
  lessonFolderInput.value = '';
  pdfFolderInput.value = '';
  nodeParentFolderInput.value = '';
  resourceFolderInput.value = '';
  videoFolderInput.value = '';
}

function updateLessonTargets() {
  const label = selectedLesson ? cleanTitle(selectedLesson.name) : 'Nenhuma aula selecionada';
  pdfLessonPathInput.value = selectedLesson?.path || '';
  resourceLessonPathInput.value = selectedLesson?.path || '';
  pdfLessonLabel.textContent = pdfScopeSelect.value === 'lesson' ? label : '';
  resourceLessonLabel.textContent = resourceScopeSelect.value === 'lesson' ? label : '';
}

function currentPathParts() {
  return currentDir.split('/').filter(Boolean);
}

function currentCourseName() {
  return currentPathParts()[0] || selectedCourse();
}

function currentSectionPath() {
  return currentPathParts().slice(1).join('/');
}

function actionDefinitions() {
  const inLibraryRoot = !currentDir;
  const inCourseOrSection = Boolean(currentDir);
  const hasLesson = Boolean(selectedLesson);
  const actions = [];

  if (inLibraryRoot) {
    actions.push({
      id: 'course',
      formId: 'course-form',
      title: 'Criar curso',
      detail: 'Comece uma nova coleção de aulas.'
    });
    return actions;
  }

  actions.push({
    id: 'section',
    formId: 'node-form',
    title: 'Criar seção',
    detail: currentSectionPath() ? 'Adicionar uma subseção aqui.' : 'Adicionar etapa, módulo ou capítulo neste curso.'
  });

  if (inCourseOrSection) {
    actions.push({
      id: 'video',
      formId: 'video-form',
      title: 'Enviar aula',
      detail: 'Adicionar um vídeo MP4 nesta seção.'
    });
    actions.push({
      id: 'download',
      formId: 'download-form',
      title: 'Baixar aula',
      detail: 'Baixar uma aula por URL nesta seção.'
    });
    actions.push({
      id: 'pdf-node',
      formId: 'pdf-form',
      title: 'PDF da seção',
      detail: 'Material geral desta seção.'
    });
    actions.push({
      id: 'link-node',
      formId: 'resource-form',
      title: 'Link da seção',
      detail: 'Referência geral desta seção.'
    });
  }

  if (hasLesson) {
    actions.unshift({
      id: 'pdf-lesson',
      formId: 'pdf-form',
      title: 'PDF da aula',
      detail: cleanTitle(selectedLesson.name)
    });
    actions.unshift({
      id: 'link-lesson',
      formId: 'resource-form',
      title: 'Link da aula',
      detail: cleanTitle(selectedLesson.name)
    });
  }

  return actions;
}

function renderActionList(preferred = activeAction, forceOpen = false) {
  const actions = actionDefinitions();
  actionList.replaceChildren();
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-choice';
    button.dataset.action = action.id;

    const title = document.createElement('strong');
    title.textContent = action.title;

    const detail = document.createElement('span');
    detail.textContent = action.detail;

    button.append(title, detail);
    button.addEventListener('click', () => setActiveAction(action.id));
    actionList.append(button);
  }

  const next = actions.some((action) => action.id === preferred)
    ? preferred
    : (!currentDir || forceOpen ? actions[0]?.id : '');
  setActiveAction(next || '');
}

function configureAction(actionId) {
  const isLessonAction = actionId.endsWith('-lesson');
  const isNodeAction = actionId.endsWith('-node');

  if (actionId.startsWith('pdf-')) {
    pdfScopeSelect.value = isLessonAction ? 'lesson' : 'node';
    pdfForm.classList.toggle('locked-scope', isLessonAction || isNodeAction);
  } else {
    pdfForm.classList.remove('locked-scope');
  }

  if (actionId.startsWith('link-')) {
    resourceScopeSelect.value = isLessonAction ? 'lesson' : 'node';
    resourceForm.classList.toggle('locked-scope', isLessonAction || isNodeAction);
  } else {
    resourceForm.classList.remove('locked-scope');
  }

  updateLessonTargets();
}

function setActiveAction(actionId) {
  activeAction = actionId;
  const action = actionDefinitions().find((item) => item.id === actionId);
  for (const form of managedForms) {
    form.hidden = !action || form.id !== action.formId;
    form.classList.add('contextual-form');
  }
  for (const button of actionList.querySelectorAll('.action-choice')) {
    button.classList.toggle('active', button.dataset.action === actionId);
  }
  configureAction(actionId);
}

function openManagePanel() {
  manageTab.classList.add('active');
  libraryTab.classList.add('active');
  renderActionList(activeAction, true);
  contextActions.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeManagePanel() {
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
  selectedLesson = null;
  playerOpen = false;
  activeAction = currentDir ? '' : 'course';
  syncFormsWithDirectory();
  updateLessonTargets();
  renderActionList();
  renderBreadcrumb(currentDir);
  updateCourseDescription();
  nowPlaying.hidden = true;
  nowPlaying.replaceChildren();

  pageTitle.textContent = listingTitle();
  libraryHeading.textContent = currentDir ? 'Conteúdo desta seção' : 'Cursos em destaque';
  mediaCount.textContent = `${directories.length + files.length} ${directories.length + files.length === 1 ? 'item nesta pasta' : 'itens nesta pasta'}`;

  renderListingFiles(listing);
}

function renderListingFiles(listing) {
  const directories = listing.directories || [];
  const files = listing.files || [];
  fileList.replaceChildren();

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

  if (videos.length && !playerOpen) {
    fileList.append(createShelf('Aulas em video', videos.map(createVideoCard)));
  }

  if (pdfs.length && !playerOpen) {
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
  meta.textContent = directory.node?.description || course?.description || `Atualizado em ${formatDate(directory.modifiedAt)}`;

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
  selectedLesson = file;
  playerOpen = true;
  pdfScopeSelect.value = 'lesson';
  resourceScopeSelect.value = 'lesson';
  updateLessonTargets();
  renderActionList();

  const video = document.createElement('video');
  video.controls = true;
  video.src = fileHref(file.path);
  video.preload = 'metadata';

  const lessonMain = document.createElement('div');
  lessonMain.className = 'lesson-main';

  const stage = document.createElement('div');
  stage.className = 'lesson-stage';

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
  description.textContent = file.lesson?.description || file.metadata?.description || 'Sem descrição salva para esta aula.';

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

  const attachPdf = document.createElement('button');
  attachPdf.type = 'button';
  attachPdf.className = 'secondary-action';
  attachPdf.textContent = 'Anexar PDF';
  attachPdf.addEventListener('click', () => {
    openManagePanel();
    setActiveAction('pdf-lesson');
  });

  const attachLink = document.createElement('button');
  attachLink.type = 'button';
  attachLink.className = 'secondary-action';
  attachLink.textContent = 'Adicionar link';
  attachLink.addEventListener('click', () => {
    openManagePanel();
    setActiveAction('link-lesson');
  });

  actions.append(attachPdf, attachLink, edit, open);
  details.append(label, title, meta, description, renderLinks(file), actions);

  lessonMain.append(video, details);
  stage.append(lessonMain, createLessonSidebar(file));
  nowPlaying.append(stage);
  appendIfPresent(nowPlaying, renderResourceGroups(file));
  renderListingFiles(lastListing || { directories: [], files: [] });
  nowPlaying.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createLessonSidebar(activeFile) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'lesson-sidebar';

  const heading = document.createElement('div');
  heading.className = 'lesson-sidebar-heading';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'Aulas';

  const title = document.createElement('strong');
  title.textContent = listingTitle();

  heading.append(eyebrow, title);

  const list = document.createElement('div');
  list.className = 'lesson-list';

  const lessons = (lastListing?.files || []).filter(isVideo);
  lessons.forEach((lesson, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lesson-list-item';
    button.classList.toggle('active', lesson.path === activeFile.path);
    button.addEventListener('click', () => renderPlayer(lesson));

    const number = document.createElement('span');
    number.className = 'lesson-number';
    number.textContent = String(index + 1).padStart(2, '0');

    const text = document.createElement('strong');
    text.textContent = cleanTitle(lesson.name);

    const meta = document.createElement('span');
    const materialCount = lesson.resourceGroups?.lesson?.length || 0;
    meta.textContent = materialCount ? `${materialCount} material${materialCount === 1 ? '' : 'is'}` : formatDate(lesson.modifiedAt);

    button.append(number, text, meta);
    list.append(button);
  });

  sidebar.append(heading, list);
  return sidebar;
}

function renderResourceGroups(file) {
  const groups = file.resourceGroups || {};
  const wrapper = document.createElement('div');
  wrapper.className = 'resource-groups';

  const lessonResources = groups.lesson || [];
  const nodeResources = groups.node || [];
  const ancestorGroups = groups.ancestors || [];
  const courseResources = groups.course || [];

  appendIfPresent(wrapper, createResourceShelf('Materiais desta aula', lessonResources));
  appendIfPresent(wrapper, createResourceAccordion('Outras aulas desta seção', resourcesByOtherLessons(file)));
  appendIfPresent(wrapper, createResourceAccordion('Materiais de seções', [
    { title: listingTitle(), resources: nodeResources },
    ...ancestorGroups.map((group) => ({ title: group.node.title, resources: group.resources || [] })),
    { title: 'Curso', resources: courseResources }
  ]));

  return wrapper.children.length ? wrapper : null;
}

function appendIfPresent(parent, child) {
  if (child) parent.append(child);
}

function resourcesByOtherLessons(activeFile) {
  return (lastListing?.files || [])
    .filter((file) => isVideo(file) && file.path !== activeFile.path)
    .map((file) => ({
      title: cleanTitle(file.name),
      resources: file.resourceGroups?.lesson || []
    }));
}

function createResourceShelf(title, resources) {
  if (!resources.length) return null;

  const section = document.createElement('section');
  section.className = 'resource-shelf';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const list = document.createElement('div');
  list.className = 'resource-list';
  list.append(...resources.map(createResourceLink));

  section.append(heading, list);
  return section;
}

function createResourceAccordion(title, groups) {
  const visibleGroups = groups.filter((group) => group.resources.length);
  if (!visibleGroups.length) return null;

  const section = document.createElement('section');
  section.className = 'resource-shelf resource-accordion';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const list = document.createElement('div');
  list.className = 'accordion-list';
  for (const group of visibleGroups) {
    list.append(createResourceDisclosure(group.title, group.resources));
  }

  section.append(heading, list);
  return section;
}

function createResourceDisclosure(title, resources) {
  const details = document.createElement('details');
  details.className = 'resource-disclosure';

  const summary = document.createElement('summary');
  const label = document.createElement('strong');
  label.textContent = title;
  const count = document.createElement('span');
  count.textContent = `${resources.length} ${resources.length === 1 ? 'item' : 'itens'}`;
  summary.append(label, count);

  const list = document.createElement('div');
  list.className = 'resource-list';
  list.append(...resources.map(createResourceLink));

  details.append(summary, list);
  return details;
}

function createResourceLink(resource) {
  const link = document.createElement('a');
  link.className = 'resource-link';
  link.href = resource.type === 'file' ? fileHref(resource.path) : resource.url;
  link.target = '_blank';
  link.rel = 'noreferrer';

  const badge = document.createElement('span');
  badge.textContent = resource.type === 'file' ? 'PDF' : 'LINK';

  const title = document.createElement('strong');
  title.textContent = resource.title || resource.url || cleanTitle(resource.path || '');

  link.append(badge, title);
  return link;
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

nodeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  nodeButton.disabled = true;
  setStatus(nodeStatusEl, 'Criando...');
  try {
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(nodeForm))
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao criar unidade.');
    renderListing(data.listing || { current: currentDir, directories: [], files: [] });
    setStatus(nodeStatusEl, data.message || 'Unidade criada.');
    nodeForm.reset();
    syncFormsWithDirectory();
  } catch (error) {
    setStatus(nodeStatusEl, error.message, true);
  } finally {
    nodeButton.disabled = false;
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

videoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  videoButton.disabled = true;
  setStatus(videoStatusEl, 'Enviando...');
  try {
    const response = await fetch('/api/upload-video', {
      method: 'POST',
      body: new FormData(videoForm)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao enviar video.');
    renderListing(data.listing || { current: currentDir, directories: [], files: [] });
    setStatus(videoStatusEl, data.message || 'Video enviado.');
    videoForm.reset();
    syncFormsWithDirectory();
  } catch (error) {
    setStatus(videoStatusEl, error.message, true);
  } finally {
    videoButton.disabled = false;
  }
});

pdfForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pdfScopeSelect.value === 'lesson' && !pdfLessonPathInput.value) {
    setStatus(pdfStatusEl, 'Selecione uma aula antes de anexar para aula.', true);
    return;
  }
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

resourceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (resourceScopeSelect.value === 'lesson' && !resourceLessonPathInput.value) {
    setStatus(resourceStatusEl, 'Selecione uma aula antes de adicionar para aula.', true);
    return;
  }
  resourceButton.disabled = true;
  setStatus(resourceStatusEl, 'Adicionando...');
  try {
    const response = await fetch('/api/resource-links', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(resourceForm))
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao adicionar link.');
    renderListing(data.listing || { current: currentDir, directories: [], files: [] });
    setStatus(resourceStatusEl, data.message || 'Link adicionado.');
    resourceForm.reset();
    syncFormsWithDirectory();
  } catch (error) {
    setStatus(resourceStatusEl, error.message, true);
  } finally {
    resourceButton.disabled = false;
  }
});

refreshButton.addEventListener('click', () => {
  Promise.all([loadCourses(), loadDirectory()]).catch((error) => setStatus(statusEl, error.message, true));
});

openManage.addEventListener('click', openManagePanel);
manageTab.addEventListener('click', openManagePanel);
libraryTab.addEventListener('click', closeManagePanel);

courseSelect.addEventListener('change', () => {
  for (const select of [pdfCourseSelect, nodeCourseSelect, resourceCourseSelect, videoCourseSelect]) select.value = courseSelect.value;
  updateCourseDescription();
});

pdfCourseSelect.addEventListener('change', () => {
  for (const select of [courseSelect, nodeCourseSelect, resourceCourseSelect, videoCourseSelect]) select.value = pdfCourseSelect.value;
  updateCourseDescription();
});

nodeCourseSelect.addEventListener('change', () => {
  for (const select of [courseSelect, pdfCourseSelect, resourceCourseSelect, videoCourseSelect]) select.value = nodeCourseSelect.value;
  updateCourseDescription();
});

resourceCourseSelect.addEventListener('change', () => {
  for (const select of [courseSelect, pdfCourseSelect, nodeCourseSelect, videoCourseSelect]) select.value = resourceCourseSelect.value;
  updateCourseDescription();
});

videoCourseSelect.addEventListener('change', () => {
  for (const select of [courseSelect, pdfCourseSelect, nodeCourseSelect, resourceCourseSelect]) select.value = videoCourseSelect.value;
  updateCourseDescription();
});

pdfScopeSelect.addEventListener('change', updateLessonTargets);
resourceScopeSelect.addEventListener('change', updateLessonTargets);

Promise.all([loadCourses(), loadDirectory()]).catch((error) => setStatus(statusEl, error.message, true));
