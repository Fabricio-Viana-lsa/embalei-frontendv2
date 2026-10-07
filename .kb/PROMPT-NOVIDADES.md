# 📣 Prompt — Gerar "Novidade" a partir do diff de uma PR mesclada — CI, não-interativo

> Roda numa GitHub Action depois do merge, sem humano no loop. Objetivo: transformar as
> mudanças **voltadas ao usuário** desta entrega num **guia curto de Novidade**, salvo como
> **rascunho** na Base de Conhecimento para revisão humana.
>
> Não invente nada: só documente o que dá para provar no diff e no código.

---

## 🎯 O que fazer

1. Leia `.kb-run/pr.json` — número, título, corpo, labels e autor da PR mesclada.
2. **Analise o diff** desta entrega: `git diff RANGE_DO_DIFF`.
3. Se o diff não deixar claro o efeito para quem usa o sistema, **abra os arquivos em volta**
   (`Read`, `Grep`) até entender o fluxo. O título da PR costuma ser pobre; o diff e o código
   são a fonte.
4. Decida se há **novidade relevante para o usuário**: nova tela, botão, recurso, melhoria
   perceptível, correção importante, mudança de e-mail/mensagem que a pessoa recebe.
   Refactor interno, teste, ajuste de build/infra, lint e mudança só de estilo **não** são
   novidade.
5. Escreva **um único arquivo** em `ARQUIVO_DE_SAIDA`. **Não** altere nenhum outro arquivo,
   e **não** comite nada.

### Se NÃO houver novidade de usuário
```json
{ "publish": false }
```

### Se houver novidade
```json
{
  "publish": true,
  "title": "Título curto e direto, na ótica do usuário",
  "excerpt": "Uma frase com o benefício (aparece no card/preview).",
  "content_html": "<p>...conteúdo em HTML...</p>"
}
```

- **`title`** — o que mudou para o usuário (ex.: "Filtro por loja na tela de solicitações").
  Nada de jargão de commit, nome de branch, nome de classe ou número de ticket.
- **`excerpt`** — 1 frase, foco no **benefício**.
- **`content_html`** — veja abaixo. **Não** defina categoria: o revisor escolhe ao publicar.

---

## ✍️ Formato do `content_html`

Foque no **usuário**: o que é, por que ajuda e como usar. Estrutura sugerida, curta:

```html
<div data-callout class="callout" data-variant="success"><div class="callout-title">✨ O que mudou</div><div class="callout-body"><p>Explicação curta do recurso e do benefício.</p></div></div>
<h3>Como usar</h3>
<ol><li>Passo 1…</li><li>Passo 2…</li></ol>
<div data-callout class="callout" data-variant="info"><div class="callout-title">📸 Print</div><div class="callout-body"><p>Adicione aqui uma captura de tela da funcionalidade (botão 🖼️ do editor ao revisar).</p></div></div>
```

Tags e atributos permitidos, e **nada além disso**:

`h2`, `h3`, `h4`, `p`, `strong`, `em`, `u`, `s`, `code`, `a`, `span`, `mark`, `ul`, `ol`,
`li`, `table`, `tbody`, `tr`, `th`, `td`, `pre` > `code`, `blockquote`,
`div[data-callout]` com `class="callout"` e `data-variant` em
`success` | `info` | `warning` | `danger`, contendo
`div.callout-title` e `div.callout-body`.

Proibido: `<script>`, `<svg>`, `<img>`, `<iframe>`, `style=`, `on*=`.

> **Sempre** inclua o callout **"📸 Print"** como placeholder — a imagem é adicionada por um
> humano ao revisar o rascunho. **Nunca** invente uma URL de imagem.

---

## 🔒 Regras

- **Não** pergunte nada; **não** trave esperando input.
- Escreva **só** `ARQUIVO_DE_SAIDA`. JSON válido (`JSON.parse` sem erro); sem cercas
  ```` ``` ````, sem texto ao redor; aspas de atributo escapadas (`class=\"callout\"`).
- Escape HTML dentro de `<code>`/`<pre>`: `<`→`&lt;`, `>`→`&gt;`, `&`→`&amp;`.
- Não escreva `title`, `excerpt` ou `content_html` a partir de suposição: se o diff não
  provar, não afirme.
- Data local (America/Sao_Paulo), se precisar citar no texto: `DATA_DE_HOJE`.
- Diff sem novidade de usuário → `{ "publish": false }`. Isso é resposta válida e comum.
