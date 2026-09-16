# CCM-002 — Metodologia de Pesquisa em Ciência da Computação

Site público e portfólio acadêmico da disciplina **CCM-002 — Metodologia de Pesquisa em Ciência da Computação**, cursada na UFABC durante o quadrimestre 2026.3.

O projeto funciona como um caderno de pesquisa contemporâneo: reúne informações da disciplina, calendário, prazos, trabalhos, anotações e aprendizados de forma organizada, acessível e adequada para consulta pública.

> Este é um site pessoal de estudante, não uma página oficial da UFABC. O Moodle permanece como fonte oficial dos prazos e materiais restritos.

## Site publicado

A publicação pelo GitHub Pages está configurada para:

[https://edupinhata.github.io/26Q3_research_methodology/](https://edupinhata.github.io/26Q3_research_methodology/)

O deploy ocorre automaticamente após alterações na branch `main`, desde que os testes, a verificação de tipos, o build e os testes de acessibilidade sejam aprovados.

## Funcionalidades atuais

- página inicial com apresentação da disciplina, próxima entrega e progresso;
- página da disciplina com objetivos, tópicos, docentes, horários, local e sistema de avaliação;
- timeline cronológica com aulas, feriados, prazos, apresentações e reposições;
- identificação da última conferência manual dos dados no Moodle;
- conteúdo estruturado em YAML;
- collections tipadas para trabalhos, anotações, biblioteca e projetos;
- layout responsivo a partir de 320 px;
- navegação por teclado, foco visível e landmarks semânticos;
- datas formatadas em português sem deslocamento indevido de dia por timezone;
- publicação estática automatizada no GitHub Pages.

As collections editoriais ainda estão preparadas, mas podem permanecer vazias até que os primeiros conteúdos autorais sejam revisados e publicados.

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
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Os comandos verificam, respectivamente:

1. regras de domínio, datas, progresso e dados estruturados;
2. tipos TypeScript e componentes Astro;
3. geração das páginas estáticas em `dist/`;
4. navegação real, base path, viewport de 320 px e acessibilidade automatizada;
5. vulnerabilidades conhecidas nas dependências npm.

O Playwright inicia e encerra automaticamente um servidor de preview durante os testes E2E.

## Testar o build de produção

Gere e sirva localmente o mesmo tipo de artefato estático utilizado no deploy:

```bash
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
- datas devem usar o formato ISO;
- conteúdos incompletos devem permanecer com `draft: true`.

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
3. gera o build estático;
4. executa os testes E2E e de acessibilidade;
5. publica `dist/` no GitHub Pages somente após todos os gates passarem.

Nenhuma credencial de deploy precisa ser adicionada ao repositório: o GitHub Pages utiliza permissões temporárias do próprio workflow.

## Repositório

[github.com/edupinhata/26Q3_research_methodology](https://github.com/edupinhata/26Q3_research_methodology)
