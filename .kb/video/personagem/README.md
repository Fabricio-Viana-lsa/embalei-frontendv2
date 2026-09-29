# Fausto em tela — DESLIGADO por ora

> **Decisão de 17/09/2026: o Fausto não aparece em tela.** Os vídeos de novidade passam a ser
> narração sobre as telas desenhadas — a voz dele continua igual, a presença no quadro não.
> **Nada deste arquivo deve ser executado hoje.**
>
> As quatro poses seguem versionadas aqui de propósito, para quando o personagem em tela for
> pedido de volta. O resto do documento é o passo a passo dessa reativação: marcação, geometria,
> custo de palco e regras de lado.

As quatro poses oficiais do Fausto, avatar interno da empresa.

Quando a presença em tela voltar, copie estes arquivos para `assets/` do projeto HyperFrames
logo depois do `hyperframes init`
(o init recusa diretório não vazio, então nunca antes). A recipe `embalei-novidade` não os
leva junto — `recipe.mjs use` só copia o `frame.md`.

```bash
cp .kb/video/personagem/fausto-*.png "$PROJECT_DIR/assets/"
```

## As quatro poses

| Arquivo | Pose | Quando usar |
| ------- | ---- | ----------- |
| `fausto-acena.png` | mão levantada, acenando | a **apresentação** — "Aqui é o Fausto, sempre no rádio" |
| `fausto-radio.png` | rádio na mão, junto ao rosto | a **virada** — "Presta atenção no rádio que agora mudou" |
| `fausto-apresenta.png` | braço aberto, apresentando | **neutro**, todos os frames de explicação |
| `fausto-polegar.png` | polegar para cima, rádio na mão baixa | o **fecho** — "Se precisar de alguém com visão de águia, é só me gritar" |

As três poses expressivas casam com os três bordões (ver
[`../PROMPT-ROTEIRO.md`](../PROMPT-ROTEIRO.md)). Nos frames do meio ele fica em `apresenta`,
porque ali a pessoa está aprendendo a operar a tela e o personagem não deve competir com isso.

## Marcação — copie, não recalcule

PNG RGBA `724×1330`, recorte limpo, sem fundo. Exibido a `403×740` (a proporção bate exata:
0,5444 contra 0,5446).

```html
<div class="clip" id="fausto-wrap"
     style="left:28px;"                     <!-- ou right:28px -->
     data-start="0"
     data-duration="<duração cheia do frame>"
     data-track-index="2">
  <img id="fausto" src="assets/fausto-apresenta.png" alt="Fausto">
</div>
```

```css
#fausto-wrap{ position:absolute; bottom:0; width:403px; height:740px; }
#fausto{ display:block; width:100%; height:100%;
         object-fit:contain; object-position:bottom;
         filter:drop-shadow(0 18px 40px rgba(0,0,0,.55)); }
```

- **Camada própria**, `class="clip"`, `data-start="0"`, `data-duration` igual à duração cheia do
  frame. Ele existe do primeiro ao último quadro; nunca entra no meio, nunca sai.
- Ocupa `y 340 → 1080` num canvas 1080. É **foreground**, desenhado por cima do palco, e é a
  única coisa autorizada a cruzar a faixa de legenda (`y ≥ 897`).
- **Entrada só no primeiro frame:** deslize de 40px do lado dele + fade, 0.8s, `power3.out`,
  começando em `t=0`. Nos demais ele já está lá em `t=0` e **não se move**.
- Num frame com modal ou desfoque de fundo, ele fica **fora** do grupo desfocado.

## O custo dele no palco — a parte que dá retrabalho

**Ele come 431px de largura** (403 + 28 de margem), mais ~40px de folga para a sombra
projetada. Num canvas 1920, sobram ~1449px de conteúdo.

Consequências medidas na PR #86, onde o palco teve de ser refeito duas vezes:

- Cartão de tela cheia: **1000px**, não 1180.
- Painel secundário (a tela do cliente): **300px**, não 484.
- **Nenhum pixel de conteúdo primário passa de `x = 1449`** quando ele está à direita, nem fica
  abaixo de `x = 471` quando está à esquerda.
- Não dá para enfiar o Fausto numa geometria de vídeo feito antes dele — o palco tem de nascer
  já reservando a coluna.

## Regras de lado

- **Ele troca de lado no máximo uma vez por vídeo.** No #86: esquerda no frame 01 (a
  apresentação), direita do 02 ao 07.
- **Nunca troca de lado num corte casado.** Se dois frames compartilham o enquadramento na
  emenda, ele fica do mesmo lado nos dois — senão o personagem teleporta.

## Histórico da decisão

Em 16/09/2026 o personagem aparecia em tela em todos os frames, e o `BRIEF.template.md` divergia
disso: o que ele restringe — frames do meio e crédito — sempre valeu para a **voz**, nunca para
a presença no quadro.

Em 17/09/2026 a presença em tela foi **desligada**, a pedido do usuário. Hoje o BRIEF e este
arquivo não divergem mais: o Fausto é só voz, e a marcação acima é o caminho de volta.
