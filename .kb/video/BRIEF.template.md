---
workflow: pr-to-video
flow: automation
storyboard: yes
message: "{{MESSAGE}}"
pr: {{PR_URL}}
destination: knowledge-base-article
aspect: 1920x1080
language: pt-BR
audience: non-technical
length: {{LENGTH}}
angle: feature-reveal
---

## Intent

Explicar a quem **usa** o Embalei — o operador de embalagem na bancada do centro de
distribuição, não desenvolvedores — o que mudou nesta entrega e o que isso muda na prática do
turno dele: o que ele bipa, o que a tela passa a mostrar antes de ele fechar o pedido, e o que
a supervisão enxerga no contador do topo.

Quem assiste está de pé, com o leitor na mão, num tablet preso na estação. O vídeo tem de caber
entre dois pedidos.

Tom: direto, de gente que trabalha na estação. Nada de jargão de código na narração.

## Persona da narração

> **Fonte desta seção:** [`PROMPT-ROTEIRO.md`](./PROMPT-ROTEIRO.md), que guarda o pedido
> original do usuário verbatim. O que está aqui é a forma operacional dele. **Leia os dois
> antes de escrever qualquer roteiro** — quando divergirem, o `PROMPT-ROTEIRO.md` manda.

Quem narra é o **Fausto** — voz clonada, personagem fixo de todos os vídeos de novidade. Gente
da casa que fala pelo rádio, não locutor de comercial. **Por ora ele é só voz e não aparece em
tela**; ver [Assets](#assets).

### A regra que manda em todas as outras

**O roteiro é escrito para ser FALADO, não para ser lido.** O Fausto está mostrando uma
novidade para um colega, de pé, em dois minutos de corredor — não está lendo a
especificação em voz alta. Se uma frase só faz sentido no papel, ela está errada.

O teste, antes de gravar: **leia a linha em voz alta.** Se você tropeçar, se precisar de
fôlego no meio, ou se soar como alguém lendo um manual, reescreve.

**Sintomas de roteiro mecânico** — se aparecer, reescreve:

| Sintoma | Exemplo ruim | Como o Fausto falaria |
| ------- | ------------ | --------------------- |
| Voz passiva de documentação | "O campo de leitura permanece inativo enquanto o pedido não for localizado." | "Enquanto o pedido não abre, não adianta bipar." |
| Lista narrada | "A barra do topo exibe três informações: estação, operador e os contadores de pedidos e itens." | "E lá em cima fica o que interessa: tua bancada, teu nome e quanto já saiu no turno." |
| Fragmento sem verbo | "Ao bipar a chave da nota." | "Bipa a nota que o pedido abre sozinho." |
| Substantivo abstrato | "para facilitar a visualização da previsão de temperatura no destino" | "pra você já ver o frio que vai pegar lá na entrega" |
| Descrever o óbvio da tela | "Na tela aparece um círculo verde com um check." | (não fala — a tela já mostra; ele comenta o que ela NÃO mostra) |

**Traduza o técnico, sem mudar o que é.** `NF-e` vira "a nota". Chave estrangeira
vira "já tem volume bipado". O nome do endpoint não é dito. Mas se a tradução muda o
comportamento, ela está errada — prefira ser fiel a ser bonito.

### Os três bordões — preservados, nunca repetidos do mesmo jeito

As três marcas do personagem são **obrigatórias e literais**. É por elas que o time
reconhece o Fausto:

1. **Apresentação:** "Aqui é o Fausto, sempre no rádio."
2. **Virada:** "Presta atenção no rádio que agora mudou."
3. **Assinatura de fecho:** "Se precisar de alguém com visão de águia, é só me gritar."

**O que NÃO pode ficar igual entre um vídeo e outro é tudo ao redor deles.** É um vídeo por
PR, para a mesma plateia, toda semana — se a segunda frase de todo vídeo for sempre a mesma
construção, vira jingle e o conteúdo some. Varie:

- **o que vem depois da apresentação** — uma pergunta ("Sabe aquela lista que…?"), uma
  constatação, um "olha só isso";
- **onde a virada cai** — nem sempre abrindo a linha da mudança; às vezes ela emenda no fim
  da linha do problema;
- **como o crédito é dito** — "Feito por X", "Esse foi o X", "Quem fez isso foi o X";
- **o gancho de abertura**, que muda com o tipo de entrega (tela nova, correção, ajuste).

Três bordões por vídeo é o **teto**. O quarto vira tique.

### A sequência natural

Contextualiza rápido → o que mudou → como funciona na prática → ponto de atenção, se
houver → fecha. **Ponto de atenção só existe se a PR documentar um.** Não invente cuidado
para ter o beat.

### Proporcional à entrega

**Roteiro curto.** O tamanho acompanha o tamanho da mudança: um ajuste de uma tela não vira
90 segundos. Corte antes de esticar. Vídeo que termina com o desenho parado esperando a voz
é roteiro longo demais; vídeo que atropela é roteiro escrito sem medir.

### Conversar com a tela, não duplicá-la

A narração roda junto com a tela sendo desenhada. **Não descreva o que já está evidente.**
Quando a tela mostra o botão, a voz fala do que o botão resolve. Use dêixis — "aquele
identificador ali", "repara que as três seções ficam" — que amarra a fala à imagem sem
repeti-la.

### Fidelidade absoluta à PR

Reorganizar, reescrever, encurtar e traduzir: liberdade total. **Inventar funcionalidade,
benefício, regra ou comportamento que a PR não documenta: nunca.** Quando algo for
inferência e não fato da PR, registre em `Notes` do `STORYBOARD.md`.

**Onde o personagem não entra:**

- **Na explicação do meio.** Ali a pessoa está aprendendo a operar a tela; bordão no meio de
  "bipe a NF-e para finalizar" atrapalha o que ela veio aprender. A *voz* dele vira só narração
  ali.
- **Dentro do crédito.** O crédito é de gente real, dito com o nome real, e vem *antes* do
  bordão de fecho — nunca dissolvido nele. O Fausto apresenta o trabalho; não o assina.
- **Gíria de rádio que a operação não decodifica** (QAP, câmbio, código Q). O registro é o
  dele; o vocabulário tem de ser o de quem trabalha na loja.

## Assets

**O Fausto NÃO entra em tela.** Decisão de 17/09/2026: o vídeo é narração sobre as telas
desenhadas, sem o personagem no quadro. Na prática isso quer dizer três coisas: não copie
nenhuma pose para `assets/`, não reserve coluna nenhuma no palco — o canvas inteiro é conteúdo —
e nenhum frame ganha camada de personagem.

As quatro poses continuam versionadas em [`personagem/`](./personagem/) de propósito, para
quando a presença em tela for pedida de volta. A marcação, a geometria e o custo de palco estão
em [`personagem/README.md`](./personagem/README.md), que enquanto esta decisão valer é
**referência futura, não instrução de execução**.

Fora isso, nenhum material do usuário. Sem prints das telas reais — as telas são desenhadas em HTML a
partir do código deste repositório, então ficam parecidas com o produto, não idênticas.

## Customizations

**Estilo do app real, não o preset da rota.** A recipe `embalei-novidade` traz o `frame.md` já
remixado sobre os tokens de marca do `embalei-frontendv2`, que é um app de tema **CLARO** —
`src/app/layout.tsx` fixa `class="light" data-theme="light"` e não existe um único bloco
`prefers-color-scheme: dark` no `globals.css`. Ground `#f6f6f7` (`--bg`), superfície de cartão
`#ffffff` (`--panel`), divisória `#e6e7eb` (`--line`), tinta `#11181c` (`--ink`), e acento
único **azul `#006fee`** (`--brand`, que o app mapeia para `--accent`, `--focus` e `--link`).
Todos saem do bloco `:root` de `src/app/globals.css`. Não regerar o `frame.md` nem remixar
tokens de novo.

**A superfície escura existe e é do app.** `#0f172a` é o fundo do toast e da animação da
etiqueta, `#0b1220` é a base da coluna escura do login e `#1e293b` é o passo mais claro dessa
animação — é essa a ardósia usada como superfície de código/terminal. Não é tema escuro: é peça
de tela, e a moldura em volta continua clara.

**Um acento por frame, e ele é sempre o azul.** `#17c964` (success) e `#f31260` (danger) são cor
de **status** em texto, chip e ícone — nunca de superfície. Pintar cartão com eles foge do app.

**As cores seguem o app; a tipografia é a da casa.** O Embalei renderiza **Inter** no corpo
inteiro (400 a 800) e JetBrains Mono no SKU, na chave da NF-e e na temperatura. O vídeo continua
em **Lato** + JetBrains Mono, porque são essas as woff2 empacotadas em
[`recipe/fonts/`](./recipe/fonts/) — trocar a família sem trocar os arquivos quebra o render
offline. A metade mono bate por sorte: o app realmente põe identificador em JetBrains Mono, então
mono ali é fidelidade.

Legendas em pt-BR sincronizadas por palavra — o vídeo é embutido em artigo da Base de
Conhecimento, onde muita gente assiste sem som. E a estação trabalha com barulho de esteira em
volta: aqui legenda não é conveniência, é o canal principal.

## Notes

- **Zero beats de diff.** O público é não-técnico; a rota normalmente crava 2–4 trechos de
  diff reais na tela. Aqui os beats de código viram beats de tela. A PR é fonte de verdade
  dos fatos, nunca conteúdo de tela.
- **Os painéis reproduzem a tela real**, lida deste repositório, não um mock livre: mesmos
  títulos, mesmos rótulos, mesmos botões. São só **duas rotas**, e cabem inteiras na cabeça:
  `src/app/page.tsx` + `src/components/login/**` (entrar na estação: seletor de usuário, data de
  nascimento com máscara DD/MM/AA e a grade de bancadas) e `src/app/embalagem/page.tsx` +
  `src/components/embalagem/**` (a bancada: a barra do topo com `pedidos` e `itens`, o campo de
  leitura, os painéis `Transportadora`, `Temperatura no destino` e `Como colar a etiqueta`, a
  contagem `Bipando volumes` / `Volumes bipados`, o popup `Observação do pedido` e o círculo
  verde do fecho). Os rótulos são esses, literais — não os reescreva no desenho.
- **Onde começa a invenção.** Este repositório é SÓ a estação. A tela de produtividade que a
  supervisão acompanha por operador e por bancada **não vive aqui**, e o ERP que responde em
  `/api/modulos/embalei/estacoes` também não (o repo só tem o cliente, em `src/lib/api.ts`).
  Se a PR mexer em algo que só aparece do lado da supervisão, desenhe o mínimo necessário,
  deliberadamente mais genérico que os painéis da estação, e registre em `Notes` do
  `STORYBOARD.md` que aquele painel é suposição.
- **Não narrar jargão**: nada de nome de arquivo, nome de componente, "App Router", "HeroUI",
  "PWA", "endpoint". A razão da feature em português de quem embala.
- Uma frase-âncora curta abre o vídeo, no formato "você bipa X aqui, a tela te mostra Y antes
  de fechar".
- Créditos de contribuidores: no máximo os que aparecem na PR, com nome real; sem handles na
  narração.
- **A persona custa tempo.** As três frases do Fausto somam de 7 a 19 segundos de narração,
  conforme o tamanho do vídeo (medido: PR #36 41,4s → 60,3s; PR #88 65,7s → 72,9s). Conte
  esse tempo ao planejar os frames, ou o vídeo fecha com o desenho parado esperando a voz.
- **Toda troca de voz ou de ajuste de entrega exige remedir `data-duration`.** A mesma
  frase varia até ±20% entre execuções — para mais e para menos. A janela de cada frame é
  `max(duração da voz, duração montada)`: encurtar abaixo do montado corta a animação, e o
  STORYBOARD tem de bater com o HTML ou o assemble reclama.
- **Esticar frame sem esticar os clips dá tela preta.** Os clips (`data-start="0"`) são o
  recipiente do desenho; se a janela deles acabar antes da raiz, o resto do frame fica preto
  com a narração correndo por cima. `esticar-frames.mjs` cuida dos dois, e a conferência é
  `ffmpeg -vf blackdetect` no render — o `lint` e o `check` não veem esse defeito. Só o fade
  de abertura e ~0,3s nas emendas entre frames podem aparecer.
- **`stability` abaixo de 0,5 gagueja.** Com `--stability 0.3` a apresentação do Fausto saiu
  "aqui eu falto, eu falto, eu falto" — e o alinhamento devolvido pela API continuou perfeito,
  porque ele descreve o texto de entrada, não o áudio. Ou seja: nada no pipeline percebe.
  Use `--stability 0.5 --style 0.3`, e ouça o resultado (ou rode `verificar-voz.py`) antes de
  publicar. Se uma linha sair torta, `--frames N` regera só ela.
