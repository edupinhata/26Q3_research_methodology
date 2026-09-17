# Fluxo de trabalhos acadêmicos

Este fluxo separa o texto acadêmico integral da apresentação curta exibida no site. Existe uma única fonte para o conteúdo acadêmico; a segunda entrada contém somente a ficha pública de navegação:

```text
documents/<id>/work.md            # única fonte do trabalho acadêmico integral
src/content/works/<id>.md         # ficha/apresentação pública, sem duplicar o trabalho
```

As prévias em `.work-previews/<id>.pdf` e os PDFs públicos em `public/documents/works/<id>.pdf` são gerados automaticamente e não são versionados.

## Pré-requisitos

Na raiz do repositório:

```bash
npm ci
npx playwright install chromium
```

A geração usa o Chromium do Playwright já empregado pelos testes do projeto; não exige LaTeX, Typst ou um editor proprietário.

## 1. Registrar a entrega

A entrega deve existir primeiro em `src/data/deliverables.yml`, que permanece a fonte canônica de título, tipo, prazo e estado:

```yaml
- id: "resumo-3-ai-science-focus"
  title: "Resumo 3 — AI tools expand scientists' impact but contract science's focus"
  type: "summary"
  assessment: "A2"
  dueAt: "2026-10-11T23:59:00-03:00"
  status: "planned"
  restrictedSource: true
```

O identificador aceita letras minúsculas, números e hífens. Não use caminhos, espaços ou acentos.

`dueAt` exige data, hora com segundos e timezone explícito (`Z` ou deslocamento de até `±14:00`), exatamente como no exemplo. Valores parciais ou com sufixos são recusados.

## 2. Criar os arquivos editáveis

```bash
npm run work:new -- resumo-3-ai-science-focus
```

Opcionalmente, fixe a data editorial para uma execução reproduzível:

```bash
npm run work:new -- resumo-3-ai-science-focus --date 2026-09-16
```

O comando:

- recusa identificadores inseguros;
- recusa sobrescrever fontes existentes;
- prepara as duas fontes e a atualização canônica em arquivos temporários, restaurando o estado anterior se qualquer substituição falhar;
- consulta título, tipo e prazo em `deliverables.yml`;
- calcula `courseWeek` a partir de `course.startsOn` e `dueAt`;
- cria `documents/<id>/work.md`;
- cria `src/content/works/<id>.md` como draft;
- altera o estado canônico da entrega para `in-progress`.

## 3. Escrever

Escreva o trabalho integral em:

```text
documents/<id>/work.md
```

O modelo inicial contém:

- Resumo;
- Considerações críticas;
- Referências;
- Declaração de uso de inteligência artificial.

A página em `src/content/works/<id>.md` deve conter apenas uma apresentação pública breve. Não replique nela o texto integral nem os bastidores do processo.

## 4. Gerar e revisar o PDF

```bash
npm run work:pdf -- resumo-3-ai-science-focus
```

Uma prévia A4 privada será criada em:

```text
.work-previews/resumo-3-ai-science-focus.pdf
```

É permitido gerar a prévia durante o rascunho para revisar paginação e tipografia. Ela fica fora de `public/`, não é incluída no site e não altera estados.

Para regenerar os PDFs públicos de todos os trabalhos já finalizados:

```bash
npm run work:pdf -- --all
```

## 5. Finalizar

Depois de revisar o trabalho e a apresentação pública:

```bash
npm run work:finalize -- resumo-3-ai-science-focus
```

Ou com data editorial explícita:

```bash
npm run work:finalize -- resumo-3-ai-science-focus --date 2026-10-10
```

A finalização falha sem modificar os estados quando encontra:

- marcadores não preenchidos;
- linhas isoladas entre colchetes, tratadas de forma conservadora como placeholders;
- ausência das seções obrigatórias;
- apresentação pública vazia ou curta demais;
- entrega canônica inexistente;
- erro ao gerar o PDF.

Quando todas as verificações passam, o comando:

1. gera e verifica o PDF;
2. escreve o PDF validado em `public/documents/works/`;
3. adiciona o link do artefato e troca a página de `draft: true` para `draft: false`;
4. muda o estado da página e da entrega para `completed`;
5. registra a finalização no histórico de revisões.

A finalização é local: ela não cria commit, não envia alterações e não publica no GitHub Pages.

## 6. Verificar o site

```bash
npm run check
npm test
npm run work:pdf -- --all
npm run build
npm run verify:build
npm run test:e2e
```

O workflow do GitHub Pages limpa a pasta gerada e regenera somente PDFs cujas páginas e entregas canônicas estejam com estado `completed`, tenham o caminho esperado e passem pelas validações. Assim, rascunhos não entram no artefato público.

A finalização prepara PDF e metadados em arquivos temporários, verifica a assinatura e o tamanho do PDF e só então substitui os destinos. Se uma substituição falhar, os arquivos originais são restaurados.

Antes da publicação, a mesma política de detecção de credenciais é aplicada ao Markdown, ao corpo e a todo o frontmatter da ficha pública, e ao texto extraído do PDF. O scanner do build também extrai o conteúdo textual de PDFs comprimidos; não confia apenas nos bytes brutos do arquivo. Ele rejeita qualquer PDF fora de `documents/works/` e exige concordância entre artefato, rota, ficha e `deliverables.yml`.

## Política editorial

- Mantenha `draft: true` enquanto o trabalho não puder ser público.
- Não copie enunciados ou materiais restritos do Moodle.
- Verifique referências, autoria, privacidade e declaração de uso de IA.
- Não inclua cookies, tokens, URLs de sessão ou caminhos locais.
- O PDF é o artefato acadêmico integral; a página HTML é sua apresentação pública acessível e pesquisável.
