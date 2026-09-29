---
format: 1920x1080
duration: 42.5s
arc: feature-reveal
language: pt-BR
music: calm confident minimal underscore, warm and unhurried
---

> **Isto é um EXEMPLO de saída, não um gabarito a preencher literalmente.**
>
> O que este arquivo mostra é a **forma** de um `STORYBOARD.md` pronto: quanta coisa cabe num
> parágrafo de direção, quais campos cada frame carrega (`duration`, `transition_in`, `focal`,
> `roles`, `blueprint`, `blueprint_posture`) e o nível de detalhe que faz um frame ser
> desenhável sem adivinhação.
>
> Os seis frames abaixo são de uma execução real **de outro sistema** — a tela de motivos do
> Troca Fácil. Eles continuam aqui de propósito, porque frame vazio não ensina nada. **Não
> copie os frames**: nem o número deles, nem os títulos, nem os `blueprint`, nem as durações.
> A entrega é que decide quantos frames existem e o que cada um mostra.
>
> O único trecho já reescrito para o Embalei é o **Video direction** logo abaixo — esse sim é
> normativo: é a paleta e o inventário de telas deste repositório.

## Video direction

**Paleta (de `frame.md`, remixada sobre os tokens reais do `embalei-frontendv2` — nunca inventar).**
O vídeo é **claro**, como o app: `src/app/layout.tsx` fixa `class="light" data-theme="light"` e
não há um único bloco `prefers-color-scheme: dark` no `globals.css`. Ground `cream` = `#f6f6f7`
(o `--bg`). Superfície de cartão `tile` = `#ffffff` (o `--panel`; aqui branco puro **é** a
superfície real, ao contrário do que o preset editorial prega). Divisória `tile-strong` =
`#e6e7eb` (o `--line`). Tinta `ink` = `#11181c` (o `--ink`); tinta secundária `#51565d`
(`--ink-2`) para rótulo e cabeçalho, terciária `#889096` (`--ink-3`) para placeholder. Acento
único `coral` = **`#006fee`**, o `--brand` — é ele na marca do topo, no foco do campo de leitura
e em qualquer botão primário. **Um acento por frame, e ele é sempre esse azul.** Verde
`#17c964` e rosa `#f31260` são **status** em texto, chip e ícone — nunca superfície de cartão.
Tipos: **Lato** para display e corpo, e **JetBrains Mono** para chave da NF-e, código do pedido,
SKU e temperatura — mono ali é fidelidade, porque o app usa a classe `.mono` exatamente nesses
lugares. (A fonte do app é Inter; o vídeo fica em Lato porque são as woff2 empacotadas na
recipe.)

**A superfície escura é peça de tela, não tema.** Onde o frame precisar de uma superfície de
código ou terminal, use a ardósia do próprio app: `#0f172a` no corpo (é o fundo do toast e da
animação da etiqueta), `#0b1220` para a variante mais funda (a coluna do login) e `#1e293b` na
barra de título / faixa de status. A moldura em volta continua clara.

**A tela é real, não inventada.** São só duas rotas, e os painéis têm de reproduzi-las com os
rótulos literais:

- **Login / entrar na estação** (`src/app/page.tsx` + `src/components/login/`): coluna escura à
  esquerda com a marca Embalei e o mini-scanner animado; à direita o seletor de usuário, a data
  de nascimento com máscara `DD/MM/AA` e a grade de bancadas (`StationCard.tsx`), com as ocupadas
  mostrando quem está nelas.
- **Bancada** (`src/app/embalagem/page.tsx` + `src/components/embalagem/`): a `TopBar` com o
  quadrado `E` da marca, a trilha `<estação> / Embalagem / <pedido>`, os dois contadores rotulados
  **`pedidos`** e **`itens`** (com o `+N` verde pulsando a cada fecho), o nome do operador e os
  botões `Novo pedido` e `SAIR`. O campo de leitura (`ScanStrip`) e, enquanto nada está aberto,
  a ilustração de scanner sob **`Aguardando bipagem do pedido`** (`EmptyState`). Com o pedido
  aberto: os painéis **`Transportadora`** (+ `Entrega`), **`Temperatura no destino`**
  (`Mínima` / `Máxima` e a cidade) e **`Como colar a etiqueta`**, mais a lista de itens. A
  contagem de volumes alterna **`Bipando volumes` / `Faltam N de M`** para
  **`Volumes bipados` / `Bipe a NF-e para finalizar`**. O popup **`Observação do pedido`** abre
  quando o pedido tem observação. O fecho é o círculo verde com check (`PackSuccessOverlay`), e
  a exceção é a faixa **`JÁ EMBALADO`**, que diz quem embalou, em qual estação e quando —
  ou **`Pedido não encontrado`**.

**O que é invenção.** Este repositório é só a estação. A tela de produtividade que a supervisão
acompanha por operador e por bancada não existe aqui, e o ERP consultado em
`/api/modulos/embalei/estacoes` também não (o repo tem só o cliente, `src/lib/api.ts`). Se um
frame precisar mostrar o lado da supervisão, desenhe-o deliberadamente mais genérico que os
painéis da estação e registre em `Notes` que é suposição.

**Gramática de movimento.** Assentamento de cauda longa (`power3`) em tudo; nada de overshoot
como padrão. A única física com recuo é o gesto real do aparelho: o pulso do campo ao aceitar um
bipe e o `+N` que salta no contador do topo. Nenhuma peça entra antes de a narração chegar nela:
em `t=0` só existe o que a voz está dizendo naquele instante, e as revelações se espalham pela
metade final de cada frame. Durante uma sustentação vale, no máximo, jitter de baixa amplitude
(`sine-wave-loop`).

**Palco contínuo.** A bancada é um palco só: barra do topo fixa, campo de leitura abaixo dela,
painéis do pedido no corpo. Nenhum frame redesenha o palco — cada um herda a geometria do
anterior e muda o enquadramento, o estado ou o que está aceso.

**Enquadramentos:** pelo menos três distintos, nunca o mesmo dois seguidos.

**Ritmo.** Os frames densos são os de interação (bipe, contagem de volumes). Um frame no meio
tem de ser o respiro — uma peça parada no centro e só as marcações acendendo. Cada frame termina
lido e quieto.

**Lista negativa.** Sem barra de navegação de navegador, sem barra de rolagem, sem cursor de
sistema real, sem chrome de browser — a estação roda em tela cheia, como PWA. Sem tema escuro de
página: o app é claro e um frame escuro inteiro seria outra marca. Sem verde ou vermelho como
superfície: eles só existem como status. Sem código na tela, sem trecho de diff, sem nome de
arquivo — decisão do brief, público não-técnico. Sem bokeh, gradiente roxo-azul de "IA", sombra
pesada ou brilho: a elevação aqui é o fio de 1px do `--line` mais a sombra suave do `--shadow`.
E os dois modos de falha: **slideshow** (despejar tudo nos primeiros 25% e congelar) e
**protetor de tela** (tudo flutuando por conta própria) estão ambos fora.

**Faixa de legenda.** Os 17% de baixo do quadro são reservados à legenda. Todo conteúdo primário
fica acima disso; fundo e camadas ambientes podem ir de borda a borda.

## Frame 1 — Você desativa aqui

- duration: 6.374s
- transition_in: cut
- status: outline
- src: compositions/frames/01-desativa-aqui.html
- type: hook
- persuasion: Signposting (aqui → ali)
- beat: curiosity and recognition
- focal: a frase de abertura em duas linhas, tratada como sujeito — ocupa a faixa superior inteira
- roles: manchete = foreground subject · os dois painéis de fio = supporting · malha de fio ink@6% de borda a borda = background
- sfx: paper-settle-soft
- blueprint: kinetic-type-beats
- blueprint_posture: Adapt — mantenho a assinatura (a afirmação se constrói em batidas, cada uma com seu próprio movimento) e troco a batida final de pop tipográfico pelo desenho do segundo painel: a última batida é um elemento, não uma palavra

<fill in: this video's content for the "Você desativa aqui" beat — keep the layout role, replace the words.>

## Frame 2 — O botão que sempre recusava

- duration: 7.654s
- transition_in: crossfade
- status: outline
- src: compositions/frames/02-botao-recusa.html
- type: problem
- persuasion: Causal chain (clica → recusa → está preso ao histórico)
- beat: frustration and recognition
- focal: a faixa de recusa — o fato que justifica a feature inteira
- roles: painel de Motivos em close = foreground subject · cursor e botão excluir = supporting · malha de fio = background
- sfx: soft-ui-click, muted-blocked-tap
- blueprint: cursor-ui-demo
- blueprint_posture: Adapt — mantenho a assinatura (o cursor conduz uma interface reconstruída e a tela muda de estado), e mudo o desfecho: o clique **não** avança um fluxo, ele bate numa recusa. O estado que muda é um erro.

<fill in: this video's content for the "O botão que sempre recusava" beat — keep the layout role, replace the words.>

## Frame 3 — Coluna Status, switch Ativo

- duration: 6.322s
- transition_in: cut
- status: outline
- src: compositions/frames/03-coluna-status.html
- type: change
- persuasion: Frame-then-fill (nomeia as duas peças, depois as preenche)
- beat: clarity and orientation
- focal: a coluna Status nascendo na tabela, e o switch aceso no cartão de cadastro
- roles: painel de Motivos = foreground subject · cartão "Novo motivo" = foreground subject no segundo tempo · painel desfocado atrás do cartão = supporting
- sfx: soft-pop, switch-click
- blueprint: grid-card-assemble
- blueprint_posture: Adapt — mantenho a assinatura (itens se auto-montam em cascata escalonada e sustentam) e aplico a cascata a **uma coluna nova dentro de uma tabela que já existe**, em vez de a uma grade nascendo do zero

<fill in: this video's content for the "Coluna Status, switch Ativo" beat — keep the layout role, replace the words.>

## Frame 4 — Vira o switch

- duration: 10.005s
- transition_in: crossfade
- status: outline
- src: compositions/frames/04-vira-o-switch.html
- type: mechanism
- persuasion: Worked example (um motivo real desativado de ponta a ponta)
- beat: comprehension and aha
- focal: o acoplamento — o switch de um lado e a lista do outro se movendo na mesma batida
- roles: os dois painéis = foreground subject em pé de igualdade · manchete curta no topo = supporting · malha de fio = background
- sfx: switch-click, soft-whoosh
- blueprint: panel-edit-live-sync
- blueprint_posture: Reproduce — é exatamente esta forma: um controle manipulado num painel e a superfície acoplada atualizando na mesma batida, com a câmera sustentando o par sem nunca perder os dois de vista

<fill in: this video's content for the "Vira o switch" beat — keep the layout role, replace the words.>

## Frame 5 — O que sai e o que fica

- duration: 7.471s
- transition_in: push-slide LEFT
- status: outline
- src: compositions/frames/05-sai-e-fica.html
- type: impact
- persuasion: Contrast (o que muda contra o que permanece)
- beat: confidence and relief
- focal: a linha desativada fixa no centro, com três marcações acendendo em volta
- roles: linha âncora = foreground subject · três marcações de fio = supporting · cream limpo = background
- sfx: line-draw-tick
- blueprint: fixed-anchor-cycle
- blueprint_posture: Reproduce — a assinatura é literal aqui: um elemento entra uma vez e **nunca mais se move**, enquanto a região em volta cicla por estados discretos; a imobilidade da âncora é a própria afirmação

<fill in: this video's content for the "O que sai e o que fica" beat — keep the layout role, replace the words.>

## Frame 6 — Feito por

- duration: 4.65s
- transition_in: crossfade
- status: outline
- src: compositions/frames/06-feito-por.html
- type: credits
- persuasion: Callback (volta à promessa da abertura)
- beat: resolve
- focal: o avatar real de `assets/AdrianoAS.png` — a única imagem de verdade do vídeo
- roles: avatar e nome = foreground subject · eco da abertura = supporting · cream limpo = background
- sfx: paper-settle-soft
- blueprint: titlecard-reveal
- blueprint_posture: Adapt — mantenho a assinatura (um cartão limpo revelado por **um** movimento contido e depois sustentado) e acrescento só o desenho do anel do avatar, porque é um fecho de crédito e não um título

<fill in: this video's content for the "Feito por" beat — keep the layout role, replace the words.>
