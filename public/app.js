const form = document.querySelector('#download-form');
const pdfForm = document.querySelector('#pdf-form');
const submitButton = document.querySelector('#submit-button');
const pdfButton = document.querySelector('#pdf-button');
const refreshButton = document.querySelector('#refresh-button');
const statusEl = document.querySelector('#status');
const pdfStatusEl = document.querySelector('#pdf-status');
const fileList = document.querySelector('#file-list');
const breadcrumb = document.querySelector('#breadcrumb');
const folderInput = document.querySelector('#folder');
const pdfFolderInput = document.querySelector('#pdfFolder');

let currentDir = '';

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

function pathLabel(value) {
  return value || 'arquivos';
}

function fileHref(filePath) {
  return `/files/${filePath.split('/').map(encodeURIComponent).join('/')}`;
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
  folderInput.value = currentDir;
  pdfFolderInput.value = currentDir;
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
    folderInput.value = currentDir;
    folderInput.focus();
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
    pdfFolderInput.value = currentDir;
  } catch (error) {
    setPdfStatus(error.message, true);
  } finally {
    pdfButton.disabled = false;
  }
});

refreshButton.addEventListener('click', () => {
  loadDirectory().catch((error) => setStatus(error.message, true));
});

loadDirectory().catch((error) => setStatus(error.message, true));
