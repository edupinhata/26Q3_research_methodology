# Site da Disciplina de Metodologia de Pesquisa — Plano de Implementação

> **Para o Hermes:** usar uma abordagem incremental, tarefa por tarefa, com validação visual e técnica antes de publicar.

**Objetivo:** criar um site público, organizado e visualmente atraente no GitHub Pages que funcione simultaneamente como painel pessoal da disciplina CCM-002, portfólio acadêmico e apresentação do trabalho desenvolvido ao longo do quadrimestre 2026.3.

**Arquitetura:** site estático orientado a conteúdo, construído com Astro e TypeScript. Textos autorais ficam em Markdown/MDX; eventos, entregas e metadados estruturados ficam em arquivos YAML. O build gera HTML estático e é publicado automaticamente pelo GitHub Actions no GitHub Pages, sem banco de dados ou backend.

**Stack recomendada:** Astro, TypeScript, Markdown/MDX, YAML, CSS com design tokens, Vitest, Playwright, axe-core e GitHub Actions.

---

## 1. Contexto confirmado

- Repositório: `edupinhata/26Q3_research_methodology`.
- Estado atual: repositório vazio, branch `main`, ainda sem commits.
- Publicação esperada: `https://edupinhata.github.io/26Q3_research_methodology/`.
- Disciplina: **CCM-002 — Metodologia de Pesquisa em Ciência da Computação**, UFABC, 2026.3.
- Professores: Carlos Alberto Kamienski e Jesús Pascual Mena-Chalco.
- Aulas presenciais:
  - segunda-feira, 16h–18h, sala L-408-2;
  - quarta-feira, 14h–16h, sala L-408-2.
- Período do calendário preliminar: 14/09/2026 a 16/12/2026.
- Objetivo central da disciplina: compreender, realizar e comunicar pesquisa científica em Computação, com ênfase em perguntas de pesquisa, leitura crítica, revisão de literatura, projetos e comunicação de resultados.
- Componentes obrigatórios de avaliação:
  - `A1`, participação, discussões e bancas — peso 1;
  - `A2`, resumos e survey/review — peso 2;
  - `A3`, pré-projeto — peso 3.
- Atividades obrigatórias: resumos, survey/review, pré-projeto e participação nas bancas.
- O Moodle informa explicitamente que toda entrega deve declarar como IA foi usada ou declarar que não foi usada.

### Entregas iniciais conhecidas

| Data | Categoria | Entrega |
|---|---|---|
| 20/09/2026 | Resumo 1 | Vídeo “How to Have a Bad Career in Research/Academia” |
| 27/09/2026 | Resumo 2 | S. Keshav, “How to Read a Paper” |
| 04/10/2026 | Survey/review | Proposta do artigo de revisão |
| 11/10/2026 | Resumo 3 | “AI tools expand scientists' impact but contract science's focus” |
| 18/10/2026 | Survey/review | Arquivo da apresentação de 19/10 |
| 25/10/2026 | Pré-projeto | Proposta do pré-projeto |
| 01/11/2026 | Resumo 4 | “General scales unlock AI evaluation with explanatory and predictive power” |
| 08/11/2026 | Resumo 5 | “Towards end-to-end automation of AI research” |
| 15/11/2026 | Resumo 6 | “Autonomous artificial intelligence, scientific research, and human values” |
| 22/11/2026 | Pré-projeto | Documento final |
| 30/11–09/12/2026 | Pré-projeto | Apresentações e bancas |
| 14/12 e 16/12/2026 | Pré-projeto | Reposição, se necessária |

> O calendário é preliminar. O Moodle continua sendo a fonte oficial; o site deve exibir a data da última conferência e não alegar sincronização automática.

---

## 2. Papel do site e público

### Público primário

1. **Eduardo:** acompanhar andamento, próximas entregas, anotações e artefatos.
2. **Visitantes do GitHub:** entender rapidamente a disciplina, o percurso e os resultados produzidos.
3. **Colegas e pesquisadores:** consultar notas, resenhas, referências e código reutilizável.

### Princípio editorial

A página deve parecer um **caderno de pesquisa público e curado**, e não uma cópia do Moodle ou um simples diretório de arquivos. Cada artefato deve ter contexto: propósito, data, status, o que foi aprendido, relação com a disciplina e links relevantes.

---

## 3. Arquitetura de informação

### Navegação principal

1. **Início** — apresentação, progresso, próxima entrega e destaques.
2. **Disciplina** — objetivos, temas, docentes, horários, avaliação e calendário.
3. **Timeline** — aulas, prazos, marcos e progresso cronológico.
4. **Trabalhos** — resumos, survey/review, pré-projeto, apresentações e eventuais provas.
5. **Anotações** — notas por aula e notas temáticas.
6. **Biblioteca** — artigos, vídeos, livros e leituras comentadas.
7. **Código** — experimentos, notebooks, scripts, dados e instruções de reprodução.
8. **Sobre** — autor, propósito do repositório, licença e declaração geral sobre uso de IA.

### Página inicial

- Hero curto: nome da disciplina, instituição, quadrimestre e propósito do repositório.
- Indicador do momento atual: semana da disciplina e progresso geral.
- Card “Próxima entrega”, calculado em build-time a partir dos dados.
- Três trilhas em destaque: aprender, produzir e refletir.
- Timeline compacta com os últimos e próximos eventos.
- Trabalhos recentes/destacados.
- Link claro para GitHub e para o Moodle, sendo o Moodle marcado como “acesso restrito”.

### Página de cada trabalho

- título, tipo, data e status;
- enunciado resumido com fonte, sem reproduzir material restrito;
- objetivo e critérios;
- artefato final para leitura/download;
- processo e decisões;
- principais aprendizados;
- referências;
- declaração específica de uso de IA;
- histórico de revisões.

### Página de cada anotação

- aula/data/tema;
- conceitos principais;
- perguntas abertas;
- conexões com o pré-projeto;
- referências e leituras posteriores;
- marcador “rascunho”, “revisado” ou “consolidado”.

---

## 4. Direção visual

### Conceito

**“Caderno de pesquisa contemporâneo”**: combinação de linguagem editorial/acadêmica com elementos de acompanhamento de projeto. O site deve comunicar rigor, evolução e autoria pessoal.

### Sistema visual

- Fundo claro levemente quente, blocos brancos e contraste alto.
- Verde-petróleo como cor principal e amarelo/ocre como acento; evitar copiar a identidade oficial da UFABC ou sugerir afiliação institucional oficial.
- Tipografia serifada para títulos e leitura longa; sans-serif para interface e metadados.
- Timeline vertical no desktop e cartões sequenciais no mobile.
- Etiquetas de status consistentes:
  - planejado;
  - em andamento;
  - concluído;
  - revisado;
  - prazo alterado.
- Progresso expresso também em texto, não apenas por cor.
- Ícones discretos para aula, entrega, leitura, código e apresentação.
- Suporte a impressão para trabalhos e anotações.
- Dark mode apenas depois do MVP, para não atrasar conteúdo e acessibilidade.

### Requisitos de experiência

- responsivo a partir de 320 px;
- navegação por teclado;
- foco visível;
- contraste WCAG AA;
- respeito a `prefers-reduced-motion`;
- landmarks e hierarquia semântica;
- datas legíveis em português e também disponíveis em `<time datetime="…">`;
- nenhuma informação comunicada exclusivamente por cor ou animação.

---

## 5. Modelo de conteúdo

### Collections do Astro

Criar schemas tipados para:

- `notes`: anotações de aula e temáticas;
- `works`: entregas, apresentações e avaliações;
- `library`: leituras e vídeos comentados;
- `projects`: código, experimentos e notebooks.

### Frontmatter mínimo de `works`

```yaml
title: "Resumo — How to Read a Paper"
description: "Leitura crítica do método de três passagens de S. Keshav."
type: "summary"
status: "in-progress"
publishedAt: 2026-09-21
dueAt: 2026-09-27T23:59:00-03:00
courseWeek: 2
tags: [leitura-critica, metodologia]
featured: true
artifact: "/documents/resumos/how-to-read-a-paper.pdf"
aiUsage: "A preencher na entrega"
draft: true
```

### Dados estruturados

- `src/data/course.yml`: dados estáveis da disciplina.
- `src/data/schedule.yml`: aulas, feriados e assuntos.
- `src/data/deliverables.yml`: prazos, status e links para trabalhos.
- `src/data/navigation.ts`: navegação centralizada.

### Convenções

- Slugs em português sem acentos, estáveis ao longo do curso.
- Datas ISO nos dados; formatação em `pt-BR` somente na interface.
- Uma única fonte para cada prazo, evitando duplicação entre Markdown e YAML.
- Itens futuros podem existir sem página publicada.
- `draft: true` impede publicação de conteúdo incompleto.
- Links Moodle devem ser marcados como restritos e nunca receber credenciais, cookies ou parâmetros de sessão.

---

## 6. Estrutura proposta de arquivos

```text
.
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml
│       └── quality.yml
├── .hermes/plans/
├── public/
│   ├── documents/
│   │   ├── presentations/
│   │   ├── reports/
│   │   └── summaries/
│   ├── images/
│   ├── favicon.svg
│   └── og-default.png
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   └── Footer.astro
│   │   ├── cards/
│   │   │   ├── ContentCard.astro
│   │   │   └── DeadlineCard.astro
│   │   ├── CourseProgress.astro
│   │   ├── StatusBadge.astro
│   │   ├── Timeline.astro
│   │   └── AiUsageNotice.astro
│   ├── content/
│   │   ├── notes/
│   │   ├── works/
│   │   ├── library/
│   │   └── projects/
│   ├── data/
│   │   ├── course.yml
│   │   ├── deliverables.yml
│   │   ├── schedule.yml
│   │   └── navigation.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ContentLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── disciplina.astro
│   │   ├── timeline.astro
│   │   ├── trabalhos/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── anotacoes/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── biblioteca/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── codigo/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── sobre.astro
│   │   └── 404.astro
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── print.css
│   ├── utils/
│   │   ├── dates.ts
│   │   ├── progress.ts
│   │   └── content.ts
│   └── content.config.ts
├── tests/
│   ├── unit/
│   │   ├── dates.test.ts
│   │   └── progress.test.ts
│   └── e2e/
│       ├── navigation.spec.ts
│       ├── accessibility.spec.ts
│       └── links.spec.ts
├── astro.config.mjs
├── package.json
├── playwright.config.ts
├── README.md
├── LICENSE
└── tsconfig.json
```

---

## 7. Plano incremental

### Fase 1 — Fundação e publicação mínima

#### Tarefa 1: inicializar o projeto Astro

**Arquivos:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `.gitignore`.

1. Criar um projeto Astro minimal com TypeScript estrito.
2. Configurar `site: "https://edupinhata.github.io"` e `base: "/26Q3_research_methodology"`.
3. Adicionar scripts `dev`, `build`, `preview`, `check`, `test` e `test:e2e`.
4. Rodar `npm install`, `npm run check` e `npm run build`.
5. Confirmar que links e assets usam o `base` corretamente.
6. Commit sugerido: `chore: initialize Astro site`.

#### Tarefa 2: criar design tokens e layout global

**Arquivos:** `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/print.css`, `src/layouts/BaseLayout.astro`, `src/components/layout/Header.astro`, `src/components/layout/Footer.astro`.

1. Definir cores, tipografia, espaçamento, largura de conteúdo, sombras, raios e estados de foco.
2. Criar skip link, cabeçalho responsivo, navegação e rodapé.
3. Incluir metadados SEO, canonical, Open Graph e idioma `pt-BR`.
4. Validar desktop, tablet, 320 px e teclado.
5. Commit sugerido: `feat: add accessible site layout`.

#### Tarefa 3: automatizar GitHub Pages

**Arquivos:** `.github/workflows/deploy-pages.yml`, `.github/workflows/quality.yml`.

1. Configurar build oficial do Astro para Pages.
2. Publicar somente após sucesso de `astro check`, testes e build.
3. Usar permissões mínimas e cancelar builds obsoletos.
4. Habilitar Pages com GitHub Actions no repositório.
5. Verificar a URL pública e assets em subdiretório.
6. Commit sugerido: `ci: deploy site to GitHub Pages`.

### Fase 2 — Conteúdo estruturado do curso

#### Tarefa 4: criar schemas e dados-base

**Arquivos:** `src/content.config.ts`, `src/data/course.yml`, `src/data/schedule.yml`, `src/data/deliverables.yml`, `src/utils/dates.ts`, `src/utils/progress.ts`.

1. Escrever primeiro testes unitários para seleção da próxima entrega, ordenação e progresso.
2. Executar os testes e confirmar falha inicial.
3. Criar schemas e utilitários mínimos.
4. Inserir calendário e prazos conhecidos do plano de ensino.
5. Executar testes, `astro check` e build.
6. Commit sugerido: `feat: model course schedule and deliverables`.

#### Tarefa 5: implementar a página inicial

**Arquivos:** `src/pages/index.astro`, `src/components/DeadlineCard.astro`, `src/components/CourseProgress.astro`, `src/components/cards/ContentCard.astro`.

1. Implementar hero, resumo do curso, próxima entrega e progresso.
2. Mostrar conteúdo recente apenas quando publicado.
3. Criar estados explícitos para “sem próxima entrega” e “disciplina concluída”.
4. Validar o comportamento antes, no dia e depois de um prazo por teste unitário.
5. Commit sugerido: `feat: build course portfolio homepage`.

#### Tarefa 6: implementar disciplina e timeline

**Arquivos:** `src/pages/disciplina.astro`, `src/pages/timeline.astro`, `src/components/Timeline.astro`, `src/components/StatusBadge.astro`.

1. Apresentar objetivos, tópicos, horário, local e sistema de avaliação.
2. Renderizar calendário completo em ordem cronológica.
3. Diferenciar aula, feriado, prazo, apresentação e reposição.
4. Exibir “última conferência no Moodle”.
5. Testar semântica da timeline e leitura mobile.
6. Commit sugerido: `feat: add course overview and timeline`.

### Fase 3 — Portfólio autoral

#### Tarefa 7: criar collections e templates editoriais

**Arquivos:** `src/layouts/ContentLayout.astro`, `src/components/AiUsageNotice.astro`, páginas dinâmicas e índices em `trabalhos`, `anotacoes`, `biblioteca` e `codigo`.

1. Definir schemas por collection e mensagens de erro claras.
2. Criar filtro por tipo, status e tag sem JavaScript quando possível.
3. Implementar páginas de detalhe com sumário, metadados e navegação anterior/próxima.
4. Renderizar declaração de uso de IA em trabalhos.
5. Impedir drafts no build de produção.
6. Commit sugerido: `feat: add typed academic content collections`.

#### Tarefa 8: adicionar conteúdo inicial real

**Arquivos:** Markdown/MDX sob `src/content/` e artefatos públicos sob `public/documents/`.

Ordem recomendada:

1. Página de boas-vindas e nota da aula de 14/09.
2. Trabalho do Resumo 1.
3. Registro do Resumo 2.
4. Biblioteca com Keshav e as quatro leituras de IA.
5. Página-mãe do survey/review.
6. Diário progressivo do pré-projeto.
7. Adicionar artefatos somente depois de revisão de privacidade, autoria e licença.
8. Commit por unidade coerente de conteúdo, por exemplo `content: add first critical summary`.

#### Tarefa 9: README como porta de entrada do GitHub

**Arquivos:** `README.md`, `LICENSE`.

1. Explicar propósito, disciplina, URL pública e estrutura.
2. Inserir screenshot do site e status do deployment.
3. Documentar instalação local e comandos.
4. Explicar política para materiais da disciplina e uso de IA.
5. Escolher licença separando, se necessário, código e textos autorais.
6. Commit sugerido: `docs: document course portfolio`.

### Fase 4 — Qualidade e acabamento

#### Tarefa 10: testes e acessibilidade

**Arquivos:** `tests/unit/*`, `tests/e2e/*`, `playwright.config.ts`.

1. Testar navegação principal, rotas geradas e links internos.
2. Executar axe nas páginas principais.
3. Testar viewport mobile e navegação por teclado.
4. Validar que não há draft ou segredo no build.
5. Testar PDF/print de um trabalho.
6. Commit sugerido: `test: add accessibility and navigation coverage`.

#### Tarefa 11: SEO e identidade de compartilhamento

**Arquivos:** `public/og-default.png`, `public/favicon.svg`, `src/layouts/BaseLayout.astro`, sitemap/RSS.

1. Criar favicon e imagem Open Graph originais.
2. Gerar sitemap.
3. Avaliar RSS para notas e trabalhos.
4. Adicionar JSON-LD `Course` na página da disciplina e `Article` em conteúdo autoral, sem dados enganosos.
5. Validar títulos, descrições, canonical e cards sociais.
6. Commit sugerido: `feat: improve discovery and social previews`.

---

## 8. Estratégia de testes e critérios de aceite

### Comandos de qualidade

```bash
npm run check
npm test
npm run build
npm run test:e2e
```

### Critérios funcionais

- [ ] O site abre corretamente na URL do GitHub Pages, incluindo CSS, imagens e navegação.
- [ ] A home informa propósito, progresso e próxima entrega em menos de uma tela.
- [ ] Todos os prazos conhecidos aparecem em ordem cronológica.
- [ ] Trabalhos, notas, biblioteca e código têm índice e rota individual.
- [ ] Conteúdo marcado como draft não aparece em produção.
- [ ] Cada trabalho publicado informa o uso ou não uso de IA.
- [ ] Links Moodle são identificados como acesso restrito.
- [ ] Não há segredos, cookies, tokens, dados pessoais indevidos ou URLs de sessão no repositório/build.

### Critérios de apresentação

- [ ] O projeto é compreensível para alguém que chega pelo perfil do GitHub.
- [ ] A experiência mobile é equivalente à desktop.
- [ ] Contraste, foco, landmarks e headings passam por axe sem violações críticas/sérias.
- [ ] Timeline continua legível sem animações e sem cores.
- [ ] Trabalhos e anotações têm visual de leitura e impressão adequado.

### Verificação antes de cada publicação

```bash
git grep -nEi 'MoodleSession|sesskey|JSESSIONID|token|password|secret' -- ':!package-lock.json'
npm run check
npm test
npm run build
npm run test:e2e
```

Revisar também a pasta gerada (`dist/`) por dados privados e links quebrados antes do primeiro deploy.

---

## 9. Segurança, direitos autorais e integridade acadêmica

- A sessão Moodle é credencial temporária e **nunca** deve ser salva no repositório, em `.env`, exemplos, logs, Actions ou conteúdo do site.
- O site não deve tentar consultar o Moodle durante o build público.
- Materiais restritos da disciplina devem ser referenciados por título e citação; não republicar slides, PDFs, templates ou enunciados integrais sem autorização.
- Priorizar conteúdo autoral: resumos, reflexões, resultados, código e artefatos próprios.
- Confirmar se cada trabalho pode ser público antes de publicar, especialmente enquanto a atividade ainda está aberta.
- Não publicar respostas de prova ou conteúdo que facilite violação de integridade acadêmica.
- Remover comentários, metadados de documentos e dados pessoais de terceiros antes do upload.
- Incluir uma nota clara de que este é um site pessoal de estudante, não uma página oficial da UFABC.
- Registrar uso de IA por artefato, de acordo com o plano de ensino.

---

## 10. Trade-offs e decisões recomendadas

### Astro em vez de Jekyll puro

**Vantagens:** collections tipadas, componentes reutilizáveis, excelente HTML estático, controle visual e boa experiência com Markdown.  
**Custo:** exige Node e workflow de build.  
**Recomendação:** usar Astro; o ganho de organização ao longo do quadrimestre compensa o setup inicial.

### Conteúdo manual em vez de sincronização com Moodle

**Vantagens:** evita expor credenciais, falhas por sessão expirada e publicação acidental de conteúdo restrito.  
**Custo:** prazos precisam ser atualizados manualmente.  
**Recomendação:** manter atualização manual com campo `lastCheckedAt` e lembrete visível de que o Moodle é a fonte oficial.

### CSS próprio em vez de framework pesado

**Vantagens:** identidade própria, bundle menor e aprendizado transparente.  
**Custo:** mais trabalho inicial de componentes.  
**Recomendação:** CSS com tokens; evitar React/Tailwind no MVP, salvo se surgir uma necessidade concreta.

### Busca

Não implementar no MVP. Quando houver aproximadamente 15–20 páginas, adicionar busca estática com Pagefind. Antes disso, tags, índices e boa navegação são suficientes.

---

## 11. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Site virar somente uma lista de links | Exigir contexto, aprendizado e status em cada artefato |
| Calendário divergir do Moodle | Exibir última conferência e tratar Moodle como fonte oficial |
| Vazamento de sessão/segredo | Não automatizar Moodle; executar varredura antes do build/deploy |
| Publicação indevida de material restrito | Publicar metadados/citações e apenas artefatos autorais autorizados |
| Base path quebrar assets no Pages | Configurar `base` desde o primeiro commit e testar o build em subpath |
| Manutenção consumir tempo da disciplina | Conteúdo em Markdown/YAML e MVP sem recursos supérfluos |
| Site parecer institucional | Identidade original e disclaimer pessoal explícito |
| Datas/timezone incorretos | ISO 8601 com `-03:00`, testes de fronteira e apresentação `pt-BR` |

---

## 12. Melhorias técnicas não bloqueantes

Pontos identificados durante revisões de código. Eles não impedem a conclusão das tarefas originais e devem ser avaliados quando a área relacionada voltar a ser modificada.

### Dados e validação

- [ ] Criar schemas Zod compartilhados para validar integralmente `course.yml`, `schedule.yml` e `deliverables.yml`.
- [ ] Verificar exatamente IDs, prazos, tipos, avaliações e intervalos dos dados-base.

### Utilitários de datas

- [ ] Testar igualdade exata com o instante do prazo.
- [ ] Testar uma data de referência inválida.
- [ ] Definir e testar o desempate entre entregas com o mesmo prazo.
- [ ] Testar `dueAt` inválido em `findNextDeliverable`.

### Calendário

- [ ] Antes da Tarefa 6, decidir se `schedule.yml` conterá somente marcos ou todas as aulas, feriados e assuntos.

### Conteúdo

- [ ] Antes da Tarefa 7, decidir se o projeto realmente usará MDX.
- [ ] Se aprovado, configurar a integração MDX e ampliar os loaders das collections.

---

## 13. Backlog posterior ao MVP

- Busca estática com Pagefind.
- Dark mode.
- Gráficos simples de distribuição das leituras e atividades.
- Página de referências em BibTeX/CSL-JSON.
- Integração com notebooks renderizados estaticamente.
- Feed RSS das novas notas/trabalhos.
- Visualização da evolução do pré-projeto por versões.
- Exportação de timeline para iCalendar gerado a partir de YAML, sem acessar o Moodle.

---

## 14. Definição do MVP

O MVP está pronto quando:

1. o GitHub Pages estiver publicado e estável;
2. a home apresentar claramente disciplina, autor, propósito, progresso e próxima entrega;
3. disciplina e timeline refletirem o plano de ensino atual;
4. houver templates funcionais para trabalhos, anotações, biblioteca e código;
5. pelo menos um conteúdo autoral real estiver publicado;
6. acessibilidade, build, links e ausência de segredos forem validados automaticamente;
7. o README direcionar visitantes do GitHub ao site.

A prioridade deve ser **conteúdo real e organização sustentável**, não animações ou funcionalidades complexas.