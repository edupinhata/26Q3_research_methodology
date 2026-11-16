# Resumo 5 — Towards end-to-end automation of AI research

## Resumo

Dados os avanços em inteligência artificial e seu uso em tarefas específicas de pesquisa, os autores propuseram uma pipeline para realizar automaticamente uma pesquisa de ponta a ponta: desde a concepção da ideia, passando pela implementação e avaliação experimental, até a escrita do artigo. Eles chamaram essa pipeline de AI Scientist.
Um dos desafios foi verificar a qualidade dos artigos gerados. Para isso, desenvolveram o Automated Reviewer, um revisor automatizado que emula a revisão por pares, atribuindo notas, identificando pontos fortes e limitações e recomendando a aceitação ou rejeição do artigo.
O Automated Reviewer foi utilizado para comparar configurações do AI Scientist, avaliando como o desempenho varia conforme os recursos computacionais utilizados e a capacidade do modelo fundacional. Modelos mais capazes e maiores orçamentos computacionais estiveram associados a melhores avaliações dos artigos. Isso sugere que a pipeline poderá produzir resultados melhores conforme essas condições evoluírem, mas não garante melhorias futuras.
Para avaliar o AI Scientist por meio de revisão humana, os autores submeteram artigos gerados a um workshop da International Conference on Learning Representations (ICLR), com aprovação ética e consentimento dos organizadores. Os revisores sabiam que algumas submissões eram geradas por IA, mas não quais. Para evitar estabelecer um precedente de publicação automatizada antes da definição de normas pela comunidade científica, todos os artigos seriam retirados após a revisão, independentemente dos resultados.
O AI Scientist consiste em diferentes fases que organizam a produção de um artigo:
Geração de ideias: proposição, verificação da originalidade, atribuição de notas e registro em um acervo.
Experimentação: na versão template-free, investigação preliminar, ajuste de hiperparâmetros, execução da pesquisa e estudos de ablação.
Escrita: organização dos resultados e figuras, redação das seções, incorporação de referências e revisão do manuscrito. Depois, ocorre a avaliação pelo Automated Reviewer.
Para investigar possível contaminação pelo treinamento do modelo, o revisor foi avaliado em artigos de 2017–2024, potencialmente presentes nesse treinamento, e de 2025, posteriores ao corte de conhecimento considerado. A acurácia balanceada, que dá igual peso às taxas de acerto entre aceitos e rejeitados, caiu de 69% para 66%. Isso sugere, mas não comprova, contaminação. Os autores argumentam que seu efeito seria limitado, pois o desempenho permaneceu comparável à referência humana, embora essa comparação envolva conjuntos distintos de artigos.
Por fim, três manuscritos foram submetidos, após seleção humana dos resultados mais promissores. Um atingiu o nível de aceitação do workshop e, segundo os organizadores, provavelmente seria aceito se não fosse retirado. Nenhum atingiu, na avaliação interna dos autores, o padrão da conferência principal, mais exigente que o workshop.
As falhas observadas incluíram ideias ingênuas ou pouco desenvolvidas, implementações incorretas, falta de rigor metodológico, erros experimentais e alucinações. Portanto, apesar de representar um avanço na automação da pesquisa, o sistema ainda não produz ciência de alta qualidade de maneira confiável e consistente.

## Referências

Lu et al. Towards end-to-end automation of AI research. Nature, 651, 914–919, 2026.

Ghareeb et al. A multi-agent system for automating scientific discovery. Nature, 655, 497–505, 2026.

Miao et al. Reimagining research papers as interactive and reliable AI agents. Nature, 658, 1272–1280, 2026.

## Declaração de uso de inteligência artificial

Utilizei o ChatGPT para esclarecer conceitos do artigo, revisar meu resumo inicial e elaborar uma versão de até 500 palavras. A ferramenta auxiliou na organização do texto e na revisão da linguagem. A seleção da versão utilizada e a responsabilidade pelo conteúdo final são minhas.
