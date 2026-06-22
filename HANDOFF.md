# Handoff do projeto

## Arquitetura atual

A Cursoteca usa Spring Boot, PostgreSQL e Nuxt. O ambiente de desenvolvimento é orquestrado por `docker/docker-compose.dev.yml`.

- `backend/`: API, persistência, armazenamento de assets e downloads com `yt-dlp`.
- `frontend/`: biblioteca, currículo, player e gerenciamento dos cursos.
- PostgreSQL: cursos, seções, aulas, recursos, downloads e estado de aprendizagem.
- Volume `backend-assets`: capas, vídeos, PDFs e áudios.

## Funcionalidades

- cadastro, listagem e detalhe de cursos com imagem de capa;
- seções hierárquicas com profundidade indefinida;
- upload manual de aulas MP4 e download assíncrono por URL;
- currículo recolhível com navegação anterior/próxima;
- índice lateral no desktop e expansível no mobile;
- última aula acessada, conclusão manual e ação “Continuar curso”;
- edição, movimentação e reordenação de aulas e seções;
- links, PDFs e áudios vinculados ao curso, seção ou aula;
- materiais agrupados por aula, seção, ancestrais e curso;
- área de estudo separada da rota administrativa `/courses/{slug}/manage`.

## Execução

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

Serviços padrão:

- frontend: `http://localhost:3000`;
- backend: `http://localhost:8080`;
- PostgreSQL: `localhost:55432`.

Fora do Docker, o backend requer Java 25, PostgreSQL, `yt-dlp` e `ffmpeg`. O frontend requer Node.js e instalação com `npm ci` dentro de `frontend/`.

## Endpoints principais

```text
GET    /api/courses
GET    /api/courses/{slug}
POST   /api/courses

GET    /api/courses/{courseId}/sections
POST   /api/courses/{courseId}/sections
PATCH  /api/courses/{courseId}/sections/{sectionId}
PUT    /api/courses/{courseId}/sections/order

GET    /api/courses/{courseId}/lessons
GET    /api/courses/{courseId}/lessons/{lessonId}
POST   /api/courses/{courseId}/lessons
PATCH  /api/courses/{courseId}/lessons/{lessonId}
PUT    /api/courses/{courseId}/lessons/order
POST   /api/courses/{courseId}/lessons/{lessonId}/access
PATCH  /api/courses/{courseId}/lessons/{lessonId}/completion

POST   /api/courses/{courseId}/resources/links
POST   /api/courses/{courseId}/resources/files

GET    /api/courses/{courseId}/lesson-downloads
GET    /api/courses/{courseId}/lesson-downloads/{jobId}
POST   /api/courses/{courseId}/lesson-downloads
```

## Assets e downloads

O diretório de assets é configurado por `CURSOTECA_ASSETS_DIR`. Os arquivos são servidos por `/assets/**`, sempre após validação de caminho.

Vídeos ficam em `courses/<slug>/lessons/`; capas e recursos usam diretórios próprios dentro do curso. Arquivos recebem nomes controlados pela aplicação para evitar colisões e travessia de diretório.

Downloads por URL usam seleção preferencial de AVC até 1080p, merge/remux para MP4, `faststart`, downloads fragmentados e `referer` específico para Vimeo ou Hotmart. O backend executa um download por vez. O executável pode ser alterado com `YT_DLP_EXECUTABLE`.

Jobs possuem os estados `QUEUED`, `RUNNING`, `COMPLETED` e `FAILED`. A aula é criada somente depois que o processo termina e o MP4 é validado. Jobs interrompidos durante execução são marcados como falha na inicialização seguinte; jobs ainda na fila são retomados.

## Validação

Backend:

```bash
cd backend
./gradlew test ktlintCheck
```

Frontend:

```bash
cd frontend
npm test -- --run
npm run lint
npm run build
```
