# Discovery de UX/UI — navegação de cursos

## Objetivo

Transformar a Cursoteca de uma interface funcional de cadastro em uma experiência clara para consumir cursos, encontrar aulas e continuar os estudos sem perder contexto.

Este documento é um discovery heurístico baseado na interface e nos fluxos existentes. Ele ainda não substitui entrevistas, observação de uso ou dados de analytics.

## Premissas

- A mesma pessoa administra a biblioteca e consome os cursos.
- O uso principal é assistir aulas em sequência e consultar materiais relacionados.
- Desktop é relevante para administração e vídeo; mobile precisa ser plenamente utilizável para consumo.
- Cursos podem ter várias camadas de seções e dezenas de aulas.

## Trabalhos principais do usuário

1. Encontrar rapidamente o curso que quer estudar.
2. Retomar de onde parou.
3. Entender onde está dentro da estrutura do curso.
4. Ir para a aula anterior, próxima aula ou outra aula sem voltar à página do curso.
5. Acessar materiais da aula sem competir visualmente com o vídeo.
6. Administrar conteúdo sem poluir o fluxo de estudo.

## Diagnóstico atual

### Crítico

1. **Consumo e administração disputam a mesma tela.** A página do curso exibe conteúdo ao lado de cinco formulários: download, upload, seção, link e arquivo. A ação primária, abrir uma aula, perde hierarquia.
2. **A aula é um destino sem continuidade.** Não há índice do curso, aula anterior/próxima nem ação de continuar. Para trocar de aula, é necessário voltar e reconstruir o contexto.
3. **Não existe retomada ou conclusão.** A aplicação não registra aula concluída nem último acesso. A biblioteca não responde “qual foi minha última aula?”.

### Alta prioridade

4. **A árvore do curso não escala bem.** Seções aninhadas são cartões dentro de cartões, sempre expandidos. Em cursos longos, isso gera muito scroll e pouca visão global.
5. **Hierarquia visual insuficiente.** Seção, subseção e aula têm diferenças discretas; profundidade depende sobretudo de recuo e bordas.
6. **Breadcrumb sem navegação.** O contexto da aula é texto, não permite voltar ao curso ou filtrar a seção atual.
7. **A biblioteca informa pouco.** Cards mostram capa, título e descrição, mas não última atividade ou ação “Continuar”.

### Média prioridade

8. Estados de foco e interação são pouco visíveis; cards e links dependem principalmente de texto e borda.
9. No mobile, o layout empilha corretamente, mas os formulários administrativos tornam a página muito longa antes de qualquer gestão intencional.
10. Downloads são apresentados junto ao conteúdo permanente, embora sejam um estado operacional temporário.

## Arquitetura de informação proposta

Separar explicitamente dois modos:

- **Estudar:** biblioteca, visão geral do curso, player, índice, materiais e conclusão de aulas.
- **Gerenciar:** criar seção/aula, baixar por URL, anexar materiais e acompanhar downloads.

Rotas sugeridas:

```text
/
└── Biblioteca
    └── /courses/:slug
        ├── Visão geral + currículo + Continuar
        ├── /lessons/:id
        │   └── Player + índice + anterior/próxima + materiais
        └── /manage
            ├── Conteúdo
            ├── Adicionar aula
            ├── Materiais
            └── Downloads
```

Não é necessário implementar todas as rotas imediatamente. Um botão “Gerenciar curso” abrindo uma área ou drawer separado já elimina a maior parte da competição visual.

## Experiência recomendada

### Biblioteca

- Cabeçalho com “Minha biblioteca” e busca quando houver volume suficiente.
- Card inteiro clicável, com capa consistente, título, descrição curta e metadados.
- Quando houver acesso anterior: última atividade e botão contextual “Continuar”.
- Ordenação inicial por último acesso; opção por nome ou data depois.

### Visão geral do curso

- Hero compacto: capa, título, descrição e ação primária “Começar” ou “Continuar curso”.
- Currículo como acordeão: seções recolhíveis, contagem de aulas e duração futura.
- Aula como linha clicável; o botão “Abrir aula” é redundante quando toda a linha tem affordance clara.
- Administração atrás de “Gerenciar curso”, não em uma coluna permanente.
- Downloads ativos em um indicador global/toast ou painel de gerenciamento.

### Página da aula

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│ Topbar: Cursoteca / curso                         Gerenciar   │
├────────────────┬─────────────────────────────────────────────┤
│ Índice         │ Breadcrumb                                  │
│ ▾ Módulo 1     │ Título da aula                              │
│   ✓ Aula 1     │ ┌─────────────────────────────────────────┐ │
│   ▶ Aula 2     │ │                 vídeo                   │ │
│   ○ Aula 3     │ └─────────────────────────────────────────┘ │
│ ▸ Módulo 2     │ [← Anterior]                     [Próxima →] │
│                │ Descrição | Materiais                        │
└────────────────┴─────────────────────────────────────────────┘
```

- Sidebar fixa/recolhível com a árvore do curso e aula ativa destacada.
- Breadcrumb clicável e título acima do player.
- Navegação anterior/próxima imediatamente abaixo do vídeo.
- Descrição e materiais em seções ou abas simples; formulários apenas no modo de gerenciamento.
- No mobile, a sidebar vira drawer aberto por “Conteúdo do curso”; anterior/próxima permanecem visíveis.
- Atalhos opcionais: `[` anterior, `]` próxima, sem interferir nos controles do vídeo.

## Direção visual

A base neutra e o verde atual podem ser mantidos, mas precisam de um sistema mais deliberado:

- Superfícies: fundo neutro, cards brancos e player como foco de maior contraste.
- Escala de espaçamento consistente de 4, 8, 12, 16, 24, 32 e 48 px.
- Raios, bordas e sombras definidos como tokens, evitando que tudo tenha o mesmo peso.
- Tipografia com largura de leitura limitada para descrições e hierarquia mais forte entre curso, módulo e aula.
- Estados completos para hover, foco visível, ativo, concluído, bloqueado, carregando e erro.
- Ícones apenas quando reforçarem significado: play, concluído, módulo, arquivo e download.
- Alvos interativos mínimos de 44 px no mobile e contraste conforme WCAG AA.

“Bonito” deve surgir da hierarquia, ritmo e consistência; não de decoração que aumente o ruído.

## MVP recomendado

### Fase 1 — navegação, sem nova persistência

1. Separar ações administrativas em uma área “Gerenciar curso”.
2. Criar um componente único de currículo/árvore, reutilizado na visão do curso e na aula.
3. Carregar seções e aulas na página da aula.
4. Calcular anterior/próxima pela ordem atual de seções e posições.
5. Adicionar sidebar desktop, drawer mobile e destaque da aula ativa.
6. Tornar linhas de aula inteiramente clicáveis e seções recolhíveis.
7. Aplicar tokens visuais, foco, hover e estados responsivos.

Essa fase resolve a principal dor de navegação com as APIs atuais.

### Fase 2 — conclusão e retomada

1. Registrar a última aula acessada em cada curso.
2. Permitir marcar e desmarcar uma aula como concluída.
3. Adicionar “Continuar curso” na biblioteca e visão geral.
4. Ordenar a biblioteca pelo acesso mais recente, mantendo cursos nunca acessados por data de cadastro.

Critérios de aceite:

- Abrir uma aula torna essa aula o destino de “Continuar curso”.
- A ação de conclusão pode ser desfeita e aparece no currículo.
- Cursos acessados recentemente aparecem antes dos nunca acessados.
- Cursos nunca acessados mantêm a ordenação por data de cadastro.

### Fase 3 — escala e refinamento

- Busca por curso e por aula.
- Reordenação e edição no modo gerencial.
- Duração de vídeos e estimativa por seção.
- Filtros de concluídas/pendentes.
- Atalhos de teclado e preferências de player.

## Critérios de aceite da Fase 1

- É possível trocar de aula sem voltar à visão geral do curso.
- A aula atual permanece visível e destacada no índice.
- Anterior/próxima respeitam a ordem apresentada no currículo, inclusive entre seções.
- O currículo funciona com pelo menos três níveis de seção sem perder legibilidade.
- No mobile, o player aparece antes do currículo expandido e o índice abre em drawer.
- Nenhum formulário administrativo aparece no fluxo padrão de estudo.
- Toda ação interativa é acessível por teclado e apresenta foco visível.
- Loading, vazio e erro existem para currículo e aula sem deslocamentos abruptos relevantes.

## Como validar com usuários

Antes da Fase 2, executar cinco sessões curtas com tarefas objetivas:

1. “Abra um curso e encontre a terceira aula do segundo módulo.”
2. “Durante uma aula, vá para a próxima sem voltar à página anterior.”
3. “Encontre um PDF associado à aula atual.”
4. “Volte ao curso que você estava estudando e continue de onde parou.”
5. “Adicione uma nova aula sem confundir essa ação com o fluxo de assistir.”

Medir sucesso da tarefa, tempo, erros de navegação e pontos em que a pessoa hesita. A meta inicial é 100% de conclusão nas três primeiras tarefas sem orientação e no máximo um retorno de rota por tarefa.

## Decisão recomendada

Após a Fase 1, implementar conclusão e retomada. “Continuar de onde parei” é central para uma biblioteca de cursos e, neste aplicativo single-user, pode ser persistido diretamente no backend.
