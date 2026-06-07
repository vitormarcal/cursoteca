# Handoff do projeto

Este projeto é um servidor Node.js simples para organizar cursos locais, baixar vídeos de aula com `yt-dlp`, anexar PDFs, links e descrições, mantendo a organização relacional em SQLite e os arquivos físicos no disco.

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

Dependências externas esperadas no `PATH`:

- `sqlite3`: usado pelo servidor para criar e consultar `arquivos/cursoteca.sqlite`.
- `yt-dlp`: usado para baixar vídeos.
- `ffmpeg`: usado pelo `yt-dlp` para merge/remux de vídeo e áudio quando necessário.

O app não tem dependências npm além do Node. A integração com SQLite usa o CLI `sqlite3` via `child_process.execFile()`, evitando pacote nativo npm.

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
│   ├── cursoteca.sqlite
│   └── <cursos e materiais>
└── .gitignore
```

`arquivos/` é ignorado pelo Git de propósito. Ele guarda os materiais baixados, PDFs anexados, o banco SQLite e metadados locais legados.

## Features

- Cadastrar cursos.
- Salvar uma descrição para cada curso.
- Navegar pelos materiais como uma árvore de cursos e unidades.
- Criar unidades hierárquicas genéricas, como Etapa, Módulo, Capítulo ou Submódulo.
- Permitir profundidade indefinida de unidades.
- Baixar vídeos de aula com formulário web.
- Enviar vídeos `.mp4` manualmente pela interface.
- Salvar vídeos em `arquivos/<curso>/<pasta-da-aula>/`.
- Anexar um ou mais PDFs por curso, unidade ou aula específica.
- Adicionar links por curso, unidade ou aula específica.
- Separar recursos no player entre materiais da aula, da unidade, de ancestrais e do curso.
- Evitar sobrescrever PDFs com nomes repetidos usando sufixos como `arquivo (2).pdf`.
- Adicionar descrição e links a vídeos `.mp4`.
- Mostrar descrição e links salvos diretamente na listagem.
- Servir materiais por `/files/...`.
- Bloquear acesso direto a arquivos internos do app fora de `arquivos/`.

## Decisões principais

### Node sem dependências npm

O app usa apenas módulos nativos do Node (`http`, `fs`, `path`, `child_process`). Isso evita instalar Express, Multer ou pacotes nativos de SQLite.

### SQLite para a organização

O app agora usa SQLite porque a organização deixou de ser apenas uma listagem de pastas. A estrutura precisa representar relações:

- curso contém uma árvore de unidades;
- unidade pode ter pai e filhos indefinidamente;
- aula pertence a uma unidade;
- recurso pode pertencer ao curso, a uma unidade ou a uma aula;
- cada nó pode ter descrição, arquivos e links.

Os arquivos continuam no disco em `arquivos/<curso>/...`. O SQLite guarda os vínculos e metadados, não o conteúdo binário dos vídeos/PDFs.

### JSON legado

Os arquivos abaixo continuam existindo por compatibilidade com telas/fluxos antigos:

```text
arquivos/.courses.json
arquivos/.media.json
```

O servidor não migra arquivos antigos automaticamente para o SQLite. O banco é preenchido apenas por ações explícitas da interface, como criar curso, criar unidade, baixar/enviar vídeo, anexar PDF ou adicionar link.

Diretórios e arquivos que existam no disco, mas não tenham registro correspondente no SQLite, são ignorados pela listagem da biblioteca. Isso permite manter backups ou arquivos antigos em `arquivos/` sem misturá-los ao fluxo novo.

### `arquivos/` como raiz segura

Todos os materiais ficam dentro de `arquivos/`. A API limpa e resolve caminhos com `safeJoin()` e `cleanRelativePath()` para impedir travessia de diretório.

### Banco e metadados ocultos

O banco principal fica em:

```text
arquivos/cursoteca.sqlite
```

Metadados legados ficam em arquivos ocultos dentro de `arquivos/`:

```text
arquivos/.courses.json
arquivos/.media.json
```

A listagem ignora entradas que começam com ponto e também ignora `cursoteca.sqlite`, então esses arquivos internos não aparecem na UI.

## Solução de hierarquia e materiais

O problema original era que alguns cursos, especialmente o curso de francês, têm mais níveis do que `Curso -> Módulo -> Aula`.

Exemplo:

```text
Curso de Francês
└── Etapa 1 - Fundação
    ├── Módulo 01
    │   ├── Aula 01
    │   ├── Aula 02
    │   └── Material geral do módulo
    └── Módulo 02
```

A solução não fixa nomes como "Etapa" e "Módulo" no schema. Em vez disso:

- todo nível intermediário é um `node`;
- `node.type_label` guarda o rótulo exibido, como Etapa, Módulo, Capítulo ou Unidade;
- `nodes.parent_id` permite profundidade indefinida;
- aulas ficam em `lessons`;
- PDFs e links ficam em `resources`;
- `resources.scope` define se o recurso é do curso, da unidade ou da aula.

Com isso, a UI consegue abrir uma aula e consultar os recursos com contexto:

- recursos com `scope=lesson` e `lesson_id` da aula aparecem em `Material desta aula`;
- recursos com `scope=node` e `node_id` da unidade da aula aparecem em `Outros materiais desta unidade`;
- recursos de nós ancestrais aparecem como materiais da etapa/unidade superior;
- recursos com `scope=course` aparecem como materiais gerais do curso.

Arquivos existentes não são sincronizados para esse modelo durante a listagem. Para registrar materiais no SQLite, use a interface e envie novamente cada vídeo/PDF/link com o escopo correto. Arquivos sem registro no banco ficam ocultos na biblioteca.

## Modelo SQLite

### `courses`

Representa cursos de primeiro nível:

```text
id
name
description
path
created_at
updated_at
```

### `nodes`

Representa qualquer unidade intermediária da árvore: Etapa, Módulo, Capítulo, Submódulo, Semana etc.

```text
id
course_id
parent_id nullable
type_label
title
description
path
position
created_at
updated_at
```

Exemplo conceitual:

```text
Curso de Francês
└── Etapa 1 - Fundação
    └── Módulo 01
        └── Submódulo A
```

Internamente, todos esses níveis são `nodes`; `type_label` define o nome apresentado na UI.

### `lessons`

Representa aulas em vídeo:

```text
id
course_id
node_id nullable
title
description
video_path
source_url
position
created_at
updated_at
```

### `resources`

Representa PDFs e links:

```text
id
course_id
node_id nullable
lesson_id nullable
type        -- file | link
scope       -- course | node | lesson
title
description
file_path nullable
url nullable
mime_type nullable
position
created_at
updated_at
```

Regras de escopo:

- `scope = course`: recurso geral do curso.
- `scope = node`: recurso da unidade atual, como módulo ou etapa.
- `scope = lesson`: recurso específico de uma aula.

## Formatos JSON legados

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
    "context": {
      "course": {
        "id": 1,
        "name": "Curso",
        "description": "Descrição do curso"
      },
      "node": {
        "id": 10,
        "typeLabel": "Módulo",
        "title": "Módulo 01",
        "description": "Descrição da unidade"
      }
    },
    "directories": [],
    "files": [
      {
        "name": "video.mp4",
        "path": "Curso/Aula/video.mp4",
        "size": 123,
        "modifiedAt": "...",
        "metadata": null,
        "lesson": {
          "id": 20,
          "title": "video",
          "description": ""
        },
        "resourceGroups": {
          "lesson": [],
          "node": [],
          "course": [],
          "ancestors": []
        }
      }
    ]
  }
}
```

Para `.mp4`, `lesson` e `resourceGroups` podem vir preenchidos. O frontend usa `resourceGroups` para separar:

- materiais desta aula;
- outros materiais desta unidade;
- materiais de unidades ancestrais;
- materiais do curso.

Para `.pdf`, o item pode trazer `resource`, indicando a qual escopo o arquivo foi vinculado.

### `GET /api/courses`

Lista cursos cadastrados em `courses` no SQLite. Diretórios antigos em `arquivos/` não são importados automaticamente.

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

Depois do download, o servidor registra o vídeo como uma `lesson` no SQLite, vinculada à unidade correspondente a `<lessonFolder>`.

### `POST /api/upload-video`

Upload multipart de uma aula em vídeo.

Campos:

- `videoCourse`
- `videoFolder`
- `videoTitle`
- `videoDescription`
- `videoFile`

Aceita apenas `.mp4`.

Destino físico:

```text
arquivos/<videoCourse>/<videoFolder>/<videoTitle-ou-nome-original>.mp4
```

Vínculo lógico:

- cria/usa o curso informado;
- cria/usa os nós correspondentes a `videoFolder`;
- cria uma `lesson` vinculada ao vídeo salvo.

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
- `pdfScope`: `course`, `node` ou `lesson`; padrão `node`
- `pdfLessonPath`: caminho relativo do `.mp4` quando `pdfScope=lesson`
- `pdfFiles`

Aceita múltiplos PDFs.

Destino físico:

```text
arquivos/<pdfCourse>/<pdfFolder>/<nome-do-pdf>.pdf
```

Vínculo lógico:

- `pdfScope=course`: aparece como material geral do curso.
- `pdfScope=node`: aparece como material da unidade/pasta atual.
- `pdfScope=lesson`: aparece em `Material desta aula` no player da aula indicada por `pdfLessonPath`.

### `POST /api/nodes`

Cria ou atualiza uma unidade hierárquica.

Content-Type:

```text
application/x-www-form-urlencoded
```

Campos:

- `nodeCourse`
- `nodeParentFolder`
- `nodeType`
- `nodeTitle`
- `nodeDescription`

Exemplo:

```text
nodeCourse=Curso de Francês Mairo Vergara
nodeParentFolder=Etapa 1 - Fundação
nodeType=Módulo
nodeTitle=Módulo 01
```

Isso cria:

```text
arquivos/Curso de Francês Mairo Vergara/Etapa 1 - Fundação/Módulo 01/
```

E grava o nó correspondente em `nodes`.

### `POST /api/resource-links`

Adiciona um link como recurso de curso, unidade ou aula.

Content-Type:

```text
application/x-www-form-urlencoded
```

Campos:

- `resourceCourse`
- `resourceFolder`
- `resourceScope`: `course`, `node` ou `lesson`; padrão `node`
- `resourceLessonPath`: caminho relativo do `.mp4` quando `resourceScope=lesson`
- `resourceTitle`
- `resourceUrl`
- `resourceDescription`

### `POST /api/node-metadata`

Salva descrição e tipo de uma unidade existente.

Content-Type:

```text
application/json
```

Body:

```json
{
  "path": "Curso/Etapa/Módulo",
  "typeLabel": "Módulo",
  "description": "Descrição da unidade"
}
```

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

Se `description` estiver vazio e `links` for vazio, remove os metadados legados daquele vídeo. A descrição e os links também são sincronizados para `lessons` e `resources` no SQLite.

## UI

A UI fica em `public/index.html`, com comportamento em `public/app.js` e estilo em `public/styles.css`.

Fluxos principais:

- Cadastrar curso.
- Criar unidades dentro de curso ou de outra unidade.
- Selecionar curso e pasta da aula para baixar vídeo.
- Selecionar curso e unidade para enviar vídeo `.mp4`.
- Selecionar curso, pasta e escopo para anexar PDFs.
- Selecionar curso, pasta e escopo para adicionar links.
- Navegar pela árvore em `Arquivos`.
- Abrir `Detalhes` em vídeos `.mp4` para editar descrição e links.

Ao navegar para uma pasta, os formulários tentam acompanhar o curso e a subpasta atual.

Ao abrir um vídeo, a UI preenche automaticamente `Arquivo da aula` nos formulários de PDF e link. Isso facilita anexar um recurso com escopo `Aula específica`.

No player, os recursos aparecem em blocos separados:

- `Material desta aula`: PDFs/links vinculados diretamente à aula.
- `Outros materiais desta unidade`: PDFs/links vinculados ao módulo/unidade atual.
- `Materiais de <tipo>: <título>`: recursos de etapas ou unidades ancestrais.
- `Materiais do curso`: recursos gerais do curso.

## Segurança e validação

- `safeJoin()` impede que caminhos escapem de `arquivos/`.
- `cleanPathPart()` remove caracteres problemáticos de nomes.
- Upload de PDF aceita apenas extensão `.pdf`.
- Metadados de vídeo só aceitam arquivos `.mp4` existentes.
- Links aceitam apenas `http:` e `https:`.
- O parser multipart corrige nomes UTF-8 em uploads, inclusive nomes como `Módulo 1.pdf`.
- O banco `cursoteca.sqlite` é filtrado da listagem pública.

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
- Editar descrição de unidade pela UI com formulário dedicado.
- Renomear curso/aula pela UI.
- Mover vídeos, PDFs e links entre cursos/unidades/aulas pela UI.
- Busca por título, descrição e links.
- Tags por vídeo.
- Preview de PDFs e player embutido para vídeos.
- Ordenação manual de cursos, unidades, aulas e recursos.
- Exportar/importar o banco e validar arquivos órfãos no disco.
