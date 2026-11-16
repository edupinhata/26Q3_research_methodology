# Resumo 4 — General scales unlock AI evaluation

## Resumo

Transcrição do documento original fornecido, preservado em resumo.pdf.

                             Universidade Federal do ABC
Programa de Pós-graduação em Ciência da Computação
CCM-002: Metodologia de Pesquisa em Ciência da Computação
Quadrimestre: 2026.3
Resumo 4: General scales unlock AI evaluation with
explanatory and predictive power
Eduardo Pinhata
eduardo.pinhata@aluno.ufabc.edu.br
Santo André, novembro 2026
1     Identificação do documento
• Tı́tulo do documento: General scales unlock AI evaluation with explanatory and predictive power
[3]
• Nome completo do autor principal: Lexin Zhou
• Área de pesquisa do autor principal: Inteligência Artificial
• Número de citações do documento (no Google Scholar): 74
• Índice-h do autor principal (no Google Scholar, se tiver cadastrado): 6
2     Liste duas perguntas que o documento tenta responder
• As rubricas criadas para o método de avaliação podem ser distiguidas por humanos, de modo que
seja possı́vel entender o que elas representam?
• O método criado possibilita prever o desempenho de um modelo em questões inéditas?
3     Liste duas publicações importantes que citaram o documento
• Measuring what Matters: Construct Validity in Large Language Model Benchmarks [1]
• Large Language Model Psychometrics: A Systematic Review of Evaluation, Validation, and Enhan-
cement [2]
4     Resumo (limite máximo de 500 palavras)
Entender e antecipar o desempenho de modelos de inteligência artificial é necessário para seu uso
seguro e efetivo. Entretanto, taxas médias de acerto em benchmarks oferecem informações limitadas sobre
as capacidades dos modelos e seu desempenho em questões inéditas. Abordagens como análise fatorial
e Teoria de Resposta ao Item também apresentam limitações: segundo os autores, seus parâmetros
dependem dos sistemas e itens utilizados na avaliação.
O artigo propõe escalas gerais para descrever as demandas das questões e as capacidades dos modelos
em dimensões comparáveis. A metodologia utiliza 18 rubricas, denominadas coletivamente DeLeAn,
abrangendo capacidades cognitivas, conhecimentos, atipicidade e volume. Uma variável adicional repre-
senta a dificuldade de acertar por adivinhação.
O GPT-4o aplicou essas rubricas às questões de 63 tarefas provenientes de 20 benchmarks. A bateria
resultante, ADeLe, contém 16.108 questões e 289.944 anotações nas 18 escalas. O estudo avaliou 15
modelos de linguagem e investigou quatro perguntas:
1. Humanos conseguem distinguir os nı́veis e as dimensões das rubricas? Os resultados
indicam que sim. O ı́ndice médio de concordância entre avaliadores humanos foi 0,83. Após um pro-
cedimento Delphi para estabelecer consenso humano, a concordância desse consenso com o GPT-4o foi
0,86. Esses resultados sustentam uma interpretação compartilhada das rubricas, mas não garantem a
correção das anotações nem demonstram sua calibração populacional.
2. Os benchmarks apresentam sensibilidade e especificidade adequadas? Sensibilidade sig-
nifica cobrir nı́veis suficientemente elevados e variados da capacidade pretendida; especificidade significa
exigir pouco de capacidades alheias ao objetivo do teste. Segundo os critérios adotados, nenhum ben-
chmark analisado apresentou simultaneamente alta sensibilidade e especificidade. Reunir benchmarks
amplia a cobertura, mas uma média geral continua misturando capacidades diferentes.
3. É possı́vel compreender capacidades e sua evolução sem saturação? Os autores re-
lacionam os acertos dos modelos aos nı́veis de demanda, ajustando curvas caracterı́sticas. A área sob
cada curva fornece uma estimativa de capacidade. Os perfis resultantes revelam diferenças associadas
ao tamanho e ao treinamento dos modelos. Como as escalas podem ser estendidas, não possuem o teto
de 100% das taxas de acerto; porém, estimativas além da faixa observada dependem de extrapolação.
4. É possı́vel prever o desempenho em questões inéditas? Preditores chamados assessors
utilizam as demandas anotadas para estimar a probabilidade de acerto. O preditor baseado em deman-
das apresentou resultados competitivos dentro da distribuição e superiores aos comparadores estudados
quando tarefas ou benchmarks inteiros ficaram fora do treinamento.
A metodologia oferece uma avaliação mais explicativa e preditiva. Suas limitações incluem cober-
tura incompleta de capacidades, restrição a tarefas textuais, poucas questões de demanda muito alta e
dependência da qualidade das anotações e da correção automática. O avanço da IA exigirá ampliar as
escalas preservando a compatibilidade com os nı́veis existentes.
5    Uso de Inteligência Artificial
Utilizei o ChatGPT para esclarecer conceitos do artigo, revisar meu resumo inicial e elaborar uma
versão de até 500 palavras. A ferramenta auxiliou na organização do texto, na revisão da linguagem e
na complementação de pontos sobre a metodologia e os resultados. A seleção da versão utilizada e a
responsabilidade pelo conteúdo final são minhas.
Referências
[1] Andrew M. Bean, Ryan Othniel Kearns, Angelika Romanou, Franziska Sofia Hafner, Harry Mayne,
Jan Batzner, Negar Foroutan Eghlidi, Chris Schmitz, Karolina Korgul, Hunar Batra, Oishi Deb,
Emma Beharry, Cornelius Emde, Thomas Foster, Anna Gausen, Marı́a Grandury, Sophia Han, Va-
lentin Hofmann, Lujain Ibrahim, Hazel Kim, Hannah Rose Kirk, Fangru Lin, Gabrielle Liu, Lennart
Luettgau, Jabez Magomere, Jonathan Rystrø m, Anna Sotnikova, Yushi Yang, Yilun Zhao, Adel
Bibi, Antoine Bosselut, Ronald Clark, Arman Cohan, Jakob Foerster, Yarin Gal, Scott Hale, De-
borah Raji, Christopher Summerfield, Philip Torr, Cozmin Ududec, Luc Rocher, and Adam Mahdi.
Measuring what matters: Construct validity in large language model benchmarks. In D. Belgrave,
C. Zhang, H. Lin, R. Pascanu, P. Koniusz, M. Ghassemi, and N. Chen, editors, Advances in Neural
Information Processing Systems, volume 38, Main Conference. Curran Associates, Inc., 2025.
[2] Haoran Ye, Jing Jin, Yuhang Xie, Xin Zhang, and Guojie Song. Large language model psychometrics:
A systematic review of evaluation, validation, and enhancement, 2026.
[3] Lexin Zhou, Lorenzo Pacchiardi, Fernando Martı́nez-Plumed, Katherine M. Collins, Yael Moros-
Daval, Seraphina Zhang, Qinlin Zhao, Yitian Huang, Luning Sun, Jonathan E. Prunty, Zongqian
Li, Pablo Sánchez-Garcı́a, Kexin Jiang-Chen, Pablo A. M. Casares, Jiyun Zu, John Burden, Behzad
Mehrbakhsh, David Stillwell, Manuel Cebrian, Jindong Wang, Peter Henderson, Sherry Tongshuang
Wu, Patrick C. Kyllonen, Lucy Cheke, Xing Xie, and José Hernández-Orallo. General scales unlock
AI evaluation with explanatory and predictive power. Nature, 652(8108):58–67, April 2026.


## Referências

Zhou et al. General scales unlock AI evaluation with explanatory and predictive power. Nature, 652, 58–67, 2026.

## Declaração de uso de inteligência artificial

Utilizei o ChatGPT para esclarecer conceitos do artigo, revisar meu resumo inicial e elaborar uma versão de até 500 palavras. A ferramenta auxiliou na organização do texto e na revisão da linguagem. A seleção da versão utilizada e a responsabilidade pelo conteúdo final são minhas.
