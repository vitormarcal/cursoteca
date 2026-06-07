# Handoff do projeto

Este projeto é um servidor Node.js simples para organizar cursos locais, baixar vídeos de aula com `yt-dlp`, anexar PDFs e manter metadados em arquivos JSON no disco.

## Como rodar

```bash
npm start
```

Por padrão o servidor sobe em:

```text
http://127.0.0.1:3000
```

Também é possível trocar a porta:

```bash
PORT=3001 npm start
```

O servidor depende de `yt-dlp` disponível no `PATH` para baixar vídeos.

## Estrutura

```text
.
├── package.json
├── server.js
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── arquivos/
│   ├── .courses.json
│   ├── .media.json
│   └── <cursos e materiais>
└── .gitignore
```

`arquivos/` é ignorado pelo Git de propósito. Ele guarda os materiais baixados, PDFs anexados e metadados locais.

## Features

- Cadastrar cursos.
- Salvar uma descrição para cada curso.
- Navegar pelos materiais como diretórios.
- Baixar vídeos de aula com formulário web.
- Salvar vídeos em `arquivos/<curso>/<pasta-da-aula>/`.
- Anexar um ou mais PDFs por curso/aula.
- Evitar sobrescrever PDFs com nomes repetidos usando sufixos como `arquivo (2).pdf`.
- Adicionar descrição e links a vídeos `.mp4`.
- Mostrar descrição e links salvos diretamente na listagem.
- Servir materiais por `/files/...`.
- Bloquear acesso direto a arquivos internos do app fora de `arquivos/`.

## Decisões principais

### Node sem dependências

O app usa apenas módulos nativos do Node (`http`, `fs`, `path`, `child_process`). Isso evita instalar Express, Multer ou SQLite para um caso local e pequeno.

### JSON em vez de SQLite

Foi escolhido JSON em disco porque os dados são simples e locais:

- cursos têm nome e descrição;
- vídeos têm descrição e links;
- o uso esperado é single-user;
- os dados precisam ser fáceis de inspecionar e editar manualmente se necessário.

SQLite pode valer no futuro se houver busca avançada, filtros, tags, histórico, múltiplos usuários, concorrência ou relações mais complexas.

### `arquivos/` como raiz segura

Todos os materiais ficam dentro de `arquivos/`. A API limpa e resolve caminhos com `safeJoin()` e `cleanRelativePath()` para impedir travessia de diretório.

### Metadados ocultos

Os metadados ficam em arquivos ocultos dentro de `arquivos/`:

```text
arquivos/.courses.json
arquivos/.media.json
```

A listagem ignora entradas que começam com ponto, então esses arquivos não aparecem na UI.

## Formatos JSON

### Cursos

Arquivo:

```text
arquivos/.courses.json
```

Formato:

```json
{
  "version": 1,
  "courses": {
    "Nome do Curso": {
      "description": "Descrição do curso",
      "createdAt": "2026-06-07T00:00:00.000Z",
      "updatedAt": "2026-06-07T00:00:00.000Z"
    }
  }
}
```

Cursos existentes como diretórios aparecem mesmo sem metadados, com descrição vazia.

### Vídeos

Arquivo:

```text
arquivos/.media.json
```

Formato:

```json
{
  "version": 1,
  "files": {
    "Curso/Aula/video.mp4": {
      "description": "Descrição da aula",
      "links": [
        {
          "title": "Material complementar",
          "url": "https://example.com"
        }
      ],
      "updatedAt": "2026-06-07T00:00:00.000Z"
    }
  }
}
```

A chave é o caminho relativo do vídeo dentro de `arquivos/`.

## Endpoints

### `GET /`

Serve `public/index.html`.

### `GET /api/files?dir=<path>`

Lista diretórios e arquivos dentro de `arquivos/<path>`.

Resposta resumida:

```json
{
  "listing": {
    "current": "Curso/Aula",
    "parent": "Curso",
    "directories": [],
    "files": [
      {
        "name": "video.mp4",
        "path": "Curso/Aula/video.mp4",
        "size": 123,
        "modifiedAt": "...",
        "metadata": null
      }
    ]
  }
}
```

Para `.mp4`, `metadata` pode vir preenchido com descrição e links.

### `GET /api/courses`

Lista cursos. Os cursos são diretórios de primeiro nível em `arquivos/`, enriquecidos com `.courses.json`.

### `POST /api/courses`

Cria/atualiza um curso.

Content-Type:

```text
application/x-www-form-urlencoded
```

Campos:

- `courseName`
- `courseDescription`

### `POST /api/download`

Baixa vídeo com `yt-dlp`.

Campos:

- `course`
- `lessonFolder`
- `lessonName`
- `url`

O destino final é:

```text
arquivos/<course>/<lessonFolder>/<lessonName>.<ext>
```

O app hoje cobre duas formas de download com `yt-dlp`.

#### Download Hotmart e links gerais

Quando a URL nao e do Vimeo/Vimeocdn, o app usa o referer da Hotmart e tenta baixar
o melhor video ate 1080p com o melhor audio disponivel. Esse modo atende o fluxo
original de aulas embedadas/servidas pela Hotmart e tambem funciona como fallback
para URLs comuns aceitas pelo `yt-dlp`.

```bash
yt-dlp \
  -o "<destino>/<lessonName>.%(ext)s" \
  --referer "https://player.hotmart.com/" \
  -N 15 \
  --format "bv*[vcodec^=avc1][height<=1080]+ba/bv*[height<=1080]+ba/b[height<=1080]/best" \
  -S "codec:avc,res,ext:mp4:m4a" \
  --merge-output-format mp4 \
  --remux-video mp4 \
  --postprocessor-args "ffmpeg:-movflags +faststart" \
  "<url>"
```

#### Download Vimeo/Vimeocdn

Quando a URL e `player.vimeo.com`, `vimeo.com` ou `vimeocdn.com`, o app usa referer
do Vimeo. Isso cobre tanto a URL do player quanto manifests como
`vod-adaptive-*.vimeocdn.com/.../playlist.json`, que trazem video e audio separados
em segmentos DASH.

```bash
yt-dlp \
  -o "<destino>/<lessonName>.%(ext)s" \
  --referer "https://player.vimeo.com/" \
  -N 15 \
  --format "bv*[vcodec^=avc1][height<=1080]+ba/bv*[height<=1080]+ba/b[height<=1080]/best" \
  -S "codec:avc,res,ext:mp4:m4a" \
  --merge-output-format mp4 \
  --remux-video mp4 \
  --postprocessor-args "ffmpeg:-movflags +faststart" \
  "<url>"
```

Para URLs `https://player.vimeo.com/video/<id>`, o referer usado e a propria URL do
player. Para URLs diretas de manifesto/CDN do Vimeo, o referer usado e
`https://player.vimeo.com/`.

O merge/remux depende de `ffmpeg` disponivel no `PATH`. URLs assinadas do Vimeo
podem expirar; se um `playlist.json` antigo retornar `403`, gere/copie uma URL nova
da pagina/player original.

### `POST /api/upload-pdfs`

Upload multipart de PDFs.

Campos:

- `pdfCourse`
- `pdfFolder`
- `pdfFiles`

Aceita múltiplos PDFs.

### `POST /api/media-metadata`

Salva ou remove metadados de um vídeo.

Content-Type:

```text
application/json
```

Body:

```json
{
  "path": "Curso/Aula/video.mp4",
  "description": "Descrição",
  "links": [
    { "title": "Link", "url": "https://example.com" }
  ]
}
```

Se `description` estiver vazio e `links` for vazio, remove os metadados daquele vídeo.

## UI

A UI fica em `public/index.html`, com comportamento em `public/app.js` e estilo em `public/styles.css`.

Fluxos principais:

- Cadastrar curso no topo.
- Selecionar curso e pasta da aula para baixar vídeo.
- Selecionar curso e pasta para anexar PDFs.
- Navegar pela árvore em `Arquivos`.
- Abrir `Detalhes` em vídeos `.mp4` para editar descrição e links.

Ao navegar para uma pasta, os formulários tentam acompanhar o curso e a subpasta atual.

## Segurança e validação

- `safeJoin()` impede que caminhos escapem de `arquivos/`.
- `cleanPathPart()` remove caracteres problemáticos de nomes.
- Upload de PDF aceita apenas extensão `.pdf`.
- Metadados de vídeo só aceitam arquivos `.mp4` existentes.
- Links de vídeo aceitam apenas `http:` e `https:`.
- O parser multipart corrige nomes UTF-8 em uploads, inclusive nomes como `Módulo 1.pdf`.

## Git

`arquivos/` é ignorado:

```gitignore
arquivos/
```

Commits importantes:

```text
d94c9a9 Create Node lesson downloader
4534921 Add course organization
386f15a Persist course descriptions
e3102f9 Fix PDF filename encoding
c76ff98 Add video metadata links
```

## Próximas melhorias possíveis

- Editar descrição de curso depois de criado.
- Renomear curso/aula pela UI.
- Mover vídeos e PDFs entre cursos/aulas pela UI.
- Busca por título, descrição e links.
- Tags por vídeo.
- Preview de PDFs e player embutido para vídeos.
- Migrar para SQLite se metadados e consultas ficarem mais complexos.
