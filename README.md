# CCM-002 — Metodologia de Pesquisa em Ciência da Computação

[![Deploy do GitHub Pages](https://github.com/edupinhata/26Q3_research_methodology/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/edupinhata/26Q3_research_methodology/actions/workflows/deploy-pages.yml)

Site público e portfólio acadêmico da disciplina **CCM-002 — Metodologia de Pesquisa em Ciência da Computação**, cursada na UFABC durante o quadrimestre 2026.3.

O projeto funciona como um caderno de pesquisa contemporâneo: reúne informações da disciplina, calendário, prazos, trabalhos, anotações e aprendizados de forma organizada, acessível e adequada para consulta pública.

> Este é um site pessoal de estudante, não uma página oficial da UFABC. O Moodle permanece como fonte oficial dos prazos e materiais restritos.

## Sumário

- [Site publicado](#site-publicado)
- [Funcionalidades atuais](#funcionalidades-atuais)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Executar em desenvolvimento](#executar-em-desenvolvimento)
- [Testes e verificações](#testes-e-verificações)
- [Testar o build de produção](#testar-o-build-de-produção)
- [Estrutura principal](#estrutura-principal)
- [Atualização de conteúdo](#atualização-de-conteúdo)
  - [Uso do fluxo de `works`](#uso-do-fluxo-de-works)
- [Segurança, privacidade e integridade acadêmica](#segurança-privacidade-e-integridade-acadêmica)
- [Publicação](#publicação)
- [Licença](#licença)
- [Repositório](#repositório)

## Site publicado

A publicação pelo GitHub Pages está configurada para:

[https://edupinhata.github.io/26Q3_research_methodology/](https://edupinhata.github.io/26Q3_research_methodology/)

O deploy ocorre automaticamente após alterações na branch `main`, desde que os testes, a verificação de tipos, o build e os testes de acessibilidade sejam aprovados.

[![Captura da página inicial do portfólio CCM-002](public/images/site-preview.png)](https://edupinhata.github.io/26Q3_research_methodology/)

A captura é gerada a partir do build de produção e funciona como atalho para o site publicado.

## Funcionalidades atuais

- página inicial com apresentação da disciplina, próxima entrega e progresso;
- página da disciplina com objetivos, tópicos, docentes, horários, local e sistema de avaliação;
- timeline cronológica com aulas, feriados, prazos, apresentações e reposições;
- identificação da última conferência manual dos dados no Moodle;
- conteúdo estruturado em YAML;
- conteúdo autoral inicial: boas-vindas, registro da primeira aula, diários dos trabalhos e biblioteca comentada;
- collections tipadas para trabalhos, anotações, biblioteca e projetos;
- filtros e páginas individuais com sumário, metadados, histórico de revisões e declaração de uso de IA;
- layout responsivo a partir de 320 px;
- navegação por teclado, foco visível e landmarks semânticos;
- datas formatadas em português sem deslocamento indevido de dia por timezone;
- sitemap, feed RSS, favicon e imagem de compartilhamento próprios;
- metadados Open Graph, Twitter Card e dados estruturados `Course`/`Article`;
- impressão A4 validada em navegador para trabalhos autorais;
- publicação estática automatizada no GitHub Pages.

Os conteúdos publicados formam o primeiro recorte público do caderno. Itens incompletos ou ainda não revisados devem permanecer com `draft: true` e não são gerados no build de produção.

## Tecnologias

- [Astro](https://astro.build/) 7;
- TypeScript em modo estrito;
- Markdown e YAML para conteúdo e dados;
- Vitest para testes unitários;
- Playwright e axe-core para testes de navegação, responsividade e acessibilidade;
- GitHub Actions e GitHub Pages para integração e publicação contínuas.

O projeto é inteiramente estático: não utiliza backend, banco de dados ou variáveis de ambiente para execução local.

## Pré-requisitos

- Node.js `22.12.0` ou superior;
- npm `9.6.5` ou superior;
- Git.

Versões instaladas podem ser verificadas com:

```bash
node --version
npm --version
git --version
```

## Instalação

No Git Bash ou em outro terminal compatível, entre na raiz do repositório e instale exatamente as dependências registradas no lockfile:

```bash
cd /c/Users/edupi/repos/26Q3_research_methodology
npm ci
```

Em outra máquina, substitua o caminho acima pelo diretório onde o repositório foi clonado.

## Executar em desenvolvimento

Na raiz do projeto:

```bash
npm run dev
```

Abra no navegador:

- início: [http://localhost:4321/26Q3_research_methodology/](http://localhost:4321/26Q3_research_methodology/);
- disciplina: [http://localhost:4321/26Q3_research_methodology/disciplina/](http://localhost:4321/26Q3_research_methodology/disciplina/);
- timeline: [http://localhost:4321/26Q3_research_methodology/timeline/](http://localhost:4321/26Q3_research_methodology/timeline/).

O caminho `/26Q3_research_methodology/` faz parte da configuração do GitHub Pages e deve ser preservado nos testes locais.

Para encerrar o servidor, pressione `Ctrl+C` no terminal em que ele está sendo executado.

## Testes e verificações

Execute os gates de qualidade a partir da raiz do projeto:

```bash
npm test
npm run check
npm run work:pdf -- --all
npm run build
npm run verify:build
npm run test:e2e
npm audit --audit-level=high
```

Para regenerar deterministicamente a imagem Open Graph após uma mudança de identidade visual:

```bash
npm run generate:og
```

Os comandos verificam, respectivamente:

1. regras de domínio, datas, progresso e dados estruturados;
2. tipos TypeScript e componentes Astro;
3. limpeza e regeneração dos PDFs públicos exclusivamente a partir de entregas canônicas concluídas;
4. geração das páginas estáticas em `dist/`;
5. exclusão de drafts, PDFs não autorizados, formatos públicos não classificados e padrões conhecidos de credenciais, inclusive no texto extraído de PDFs;
6. navegação real, base path, viewport de 320 px e acessibilidade automatizada;
7. vulnerabilidades conhecidas nas dependências npm.

O Playwright inicia e encerra automaticamente um servidor de preview durante os testes E2E.

## Testar o build de produção

Gere e sirva localmente o mesmo tipo de artefato estático utilizado no deploy:

```bash
npm run work:pdf -- --all
npm run build
npm run preview
```

Depois, acesse:

[http://localhost:4321/26Q3_research_methodology/](http://localhost:4321/26Q3_research_methodology/)

Para encerrar o preview, pressione `Ctrl+C`.

## Estrutura principal

```text
src/
├── components/       # componentes visuais e de layout
├── content/          # trabalhos, anotações, biblioteca e projetos autorais
├── data/             # informações da disciplina, calendário e entregas em YAML
├── layouts/          # estruturas compartilhadas de página
├── pages/            # rotas estáticas do site
├── styles/           # tokens e estilos globais, responsivos e de impressão
└── utils/            # regras de datas, progresso, página inicial e timeline

tests/
├── unit/             # testes unitários e contratos dos dados
└── e2e/              # navegação, responsividade e acessibilidade
```

## Atualização de conteúdo

- dados estáveis da disciplina ficam em `src/data/course.yml`;
- aulas, feriados e marcos ficam em `src/data/schedule.yml`;
- prazos e estados das entregas ficam em `src/data/deliverables.yml`;
- conteúdo autoral fica sob `src/content/`;
- cada trabalho fica agrupado em `src/content/works/<id>/`, com `index.md` para a apresentação e `work.md` para o texto integral;
- prévias privadas ficam em `.work-previews/`, e PDFs finalizados são gerados em `public/documents/works/`; nenhum deles é versionado;
- datas devem usar o formato ISO;
- conteúdos incompletos devem permanecer com `draft: true`.

### Uso do fluxo de `works`

O fluxo mantém responsabilidades separadas:

- `src/data/deliverables.yml`: metadados e estado canônicos da entrega;
- `src/content/works/<id>/work.md`: única fonte do texto acadêmico integral;
- `src/content/works/<id>/index.md`: apresentação pública curta e metadados da página;
- `.work-previews/<id>.pdf`: prévia A4 privada e não versionada;
- `public/documents/works/<id>.pdf`: artefato público gerado somente para trabalhos finalizados.

Execute todos os comandos abaixo na raiz do repositório.

| Comando npm | Finalidade | Resultado principal |
| --- | --- | --- |
| `npm run work:new -- <id>` | Criar transacionalmente as fontes editáveis de uma entrega já cadastrada | `src/content/works/<id>/{index.md,work.md}` |
| `npm run work:pdf -- <id>` | Gerar uma prévia privada durante a escrita | `.work-previews/<id>.pdf` |
| `npm run work:finalize -- <id>` | Validar, finalizar os metadados e gerar o PDF público | `public/documents/works/<id>.pdf` |
| `npm run work:pdf -- --all` | Limpar e regenerar os PDFs públicos canonicamente autorizados | PDFs dos trabalhos com estados concordantes e concluídos |

#### 1. Registrar a entrega canônica

Adicione a entrega a `src/data/deliverables.yml`. O `id` deve conter apenas letras minúsculas, números e hífens; `dueAt` deve ser um timestamp ISO completo, com segundos e timezone explícito.

#### 2. Criar as fontes editáveis

```bash
npm run work:new -- <id-da-entrega>
```

Para tornar a data editorial reproduzível, use `--date AAAA-MM-DD`:

```bash
npm run work:new -- <id-da-entrega> --date 2026-09-16
```

Também é possível informar o identificador como `--id <id-da-entrega>`.

#### 3. Escrever e revisar

Escreva o trabalho integral em `src/content/works/<id>/work.md`. Em `src/content/works/<id>/index.md`, mantenha somente uma apresentação concisa; diários, planos e bastidores pertencem a `src/content/notes/`. O loader da coleção aceita apenas `index.md`: `work.md` não recebe rota própria nem é listado como uma segunda publicação.

Durante a escrita, gere quantas prévias privadas forem necessárias:

```bash
npm run work:pdf -- <id-da-entrega>
```

Esse comando não publica o trabalho nem altera seu estado.

#### 4. Finalizar

Depois de revisar texto, referências, declaração de uso de IA, apresentação e metadados públicos:

```bash
npm run work:finalize -- <id-da-entrega>
```

Uma data editorial explícita também pode ser informada:

```bash
npm run work:finalize -- <id-da-entrega> --date 2026-10-10
```

A finalização falha de forma segura diante de placeholders, seções insuficientes, caminhos privados, possíveis credenciais, entrega canônica inexistente ou PDF inválido. PDF e metadados são preparados em staging antes de alterar os destinos. Se uma substituição falhar, os arquivos já instalados são removidos e os originais são restaurados; uma falha posterior ao limpar backups é reportada, mas não desfaz substituições concluídas.

#### 5. Regenerar e verificar antes de publicar

```bash
npm run work:pdf -- --all
npm run build
npm run verify:build
```

`work:pdf -- --all` remove PDFs antigos e regenera somente os artefatos cujos estados em `deliverables.yml` e na página pública estejam concluídos e concordantes. O procedimento completo, as garantias e os casos de falha estão em [`docs/ACADEMIC_WORKFLOW.md`](docs/ACADEMIC_WORKFLOW.md).

O calendário é mantido manualmente. Ao atualizar um prazo, confira o Moodle e atualize também `lastCheckedAt` em `src/data/course.yml`.

## Segurança, privacidade e integridade acadêmica

- não armazene cookies, tokens, senhas, parâmetros de sessão ou credenciais do Moodle;
- não publique materiais restritos da disciplina sem autorização;
- prefira citações, metadados e conteúdo autoral em vez de copiar enunciados ou documentos integrais;
- revise documentos e imagens para remover dados pessoais e metadados indevidos;
- cada trabalho publicado deve declarar como inteligência artificial foi utilizada, ou declarar que não foi utilizada;
- confirme que um artefato pode ser público antes de adicioná-lo ao site.

## Publicação

O workflow `.github/workflows/deploy-pages.yml` é executado em pushes para `main`. Ele:

1. instala dependências com `npm ci`;
2. executa Astro Check e os testes unitários;
3. limpa e regenera os PDFs públicos com `npm run work:pdf -- --all`;
4. gera o build estático;
5. bloqueia drafts publicados, PDFs não autorizados, formatos desconhecidos e padrões conhecidos de credenciais no artefato;
6. executa os testes E2E e de acessibilidade;
7. publica `dist/` no GitHub Pages somente após todos os gates passarem.

O scanner é uma defesa automatizada em profundidade, não substitui a revisão humana de documentos, imagens e metadados antes da publicação.

Nenhuma credencial de deploy precisa ser adicionada ao repositório: o GitHub Pages utiliza permissões temporárias do próprio workflow.

## Licença

O código-fonte e a documentação técnica estão disponíveis sob a **MIT License**. Textos, anotações, resumos, imagens e demais artefatos acadêmicos autorais permanecem com **todos os direitos reservados**, salvo indicação explícita em um arquivo específico.

Obras de terceiros aparecem somente como referências, metadados ou links e continuam sujeitas aos direitos de seus respectivos autores. Consulte [`LICENSE`](LICENSE) para os termos completos.

## Repositório

[github.com/edupinhata/26Q3_research_methodology](https://github.com/edupinhata/26Q3_research_methodology)
