# Padrão de commits

Todo commit deste repo tem **título e corpo**:

```
fix(embalagem): impede bipe duplicado do mesmo volume

O leitor repetia a leitura quando o operador segurava o gatilho e o volume
entrava duas vezes na contagem do pedido.
```

Três partes, todas obrigatórias:

| Parte | Regra |
|---|---|
| `tipo` | um da lista abaixo, minúsculo |
| `(escopo)` | **obrigatório** — a rota, a camada, ou `ci` / `deps` / `build` / `docs` |
| `assunto` | imperativo, minúsculo, sem ponto final, até 100 caracteres com o resto do título |
| linha em branco | **obrigatória** entre título e corpo |
| corpo | **obrigatório**, mínimo 20 caracteres — o quê mudou e **por quê** |

## Tipos

| Tipo | Quando |
|---|---|
| `feat` | tela, fluxo ou comportamento novo para o operador |
| `fix` | corrige comportamento errado |
| `refactor` | reescreve sem mudar comportamento |
| `perf` | melhora desempenho (render, bundle, requisição ao ERP) |
| `test` | só testes — **hoje não há nenhum no repo** (ver "Onde isso é cobrado") |
| `docs` | só documentação |
| `chore` | manutenção que não é nenhuma das acima (dependências, scripts, config) |
| `ci` | workflows, hooks |
| `build` | next.config, tsconfig, postcss/tailwind, empacotamento |
| `style` | formatação sem efeito em comportamento — **não** é mudança de CSS/tema |
| `revert` | reverte um commit anterior |

> Mudança visual (`src/app/globals.css`, tokens, tema HeroUI) é `feat` ou `fix` conforme o
> efeito, não `style`. `style` é só formatação de código.

## Escopo

Rota em [`src/app/`](../src/app/), em kebab-case. São **duas**, e a lista é curta porque o app
é curto — a estação de embalagem tem uma tela de entrada e uma tela de trabalho:

`login` (a rota `/`, em [`src/app/page.tsx`](../src/app/page.tsx)) · `embalagem` (a rota
`/embalagem`, em [`src/app/embalagem/page.tsx`](../src/app/embalagem/page.tsx))

Ou a camada tocada, quando a mudança não é de uma rota só:

`components` ([`src/components/`](../src/components/)) · `lib` ([`src/lib/`](../src/lib/), o
cliente do ERP) · `data` ([`src/data/`](../src/data/)) · `types`
([`src/types.ts`](../src/types.ts)) · `styles` ([`src/app/globals.css`](../src/app/globals.css))
· `layout` ([`src/app/layout.tsx`](../src/app/layout.tsx)) · `system`
([`src/components/system/`](../src/components/system/)) · `manifest`
([`src/app/manifest.ts`](../src/app/manifest.ts), o PWA)

Fora do `src/`: `ci`, `deps`, `build`, `docs`.

A lista **não é validada** (não existe `scope-enum` em
[`commitlint.config.js`](../commitlint.config.js)), para que rota nova não exija editar config.
O preço é que typo passa: `embalagens` é aceito no lugar de `embalagem`. Confira antes de
commitar.

## Como escrever o corpo

O corpo responde **por quê**, não repete o diff. Ruim: "alterado o componente do card de
temperatura". Bom: "a previsão vinha em branco para pedido sem CEP de destino porque o
`TempCard` lia a temperatura antes de a transportadora responder".

Três formas de passar o corpo:

```bash
# 1. Editor (melhor para corpo de várias linhas)
git commit

# 2. Dois -m: o segundo vira o corpo
git commit -m "feat(embalagem): mostra a observação do pedido ao bipar a nota" \
           -m "O operador só descobria a observação depois de fechar o pedido, quando já era tarde."

# 3. Heredoc
git commit -F - <<'MSG'
feat(embalagem): mostra a observação do pedido ao bipar a nota

O operador só descobria a observação depois de fechar o pedido, quando já era tarde.
MSG
```

Mais exemplos, do que o repositório realmente faz:

```
fix(login): aceita data de nascimento digitada sem as barras

O coletor de código de barras da bancada entrega os dígitos secos e a máscara
DD/MM/AA rejeitava a entrada inteira.
```

```
perf(components): adia a montagem do teclado de embalagens

O EmbalagemKeyboard carregava o catálogo inteiro no primeiro render e travava
o tablet da estação por quase um segundo.
```

```
chore(deps): fixa @heroui/react no lockfile

As duas dependências do HeroUI estão declaradas como "latest" e um install
livre trocava a versão sem ninguém pedir.
```

## Breaking change

`!` depois do escopo, e o rodapé `BREAKING CHANGE:` explicando a migração:

```
feat(lib)!: exige NEXT_PUBLIC_API_URL no build

O cliente do ERP deixa de cair no host padrão quando a variável não existe.

BREAKING CHANGE: builds sem NEXT_PUBLIC_API_URL agora falham em vez de apontar para o host de desenvolvimento.
```

## Onde isso é cobrado

Duas vezes, com a mesma config ([`commitlint.config.js`](../commitlint.config.js)):

1. **No teu commit** — hook [`.husky/commit-msg`](../.husky/commit-msg) roda `commitlint --edit`.
   Só funciona depois de `npm install` (o `prepare` instala os hooks). Quem clona e não instala
   **não tem gate nenhum na máquina**.
2. **No PR** — [`.github/workflows/commitlint.yml`](../.github/workflows/commitlint.yml) monta
   `título do PR` + linha em branco + `descrição do PR` e passa pelo commitlint. É o único gate
   **garantido**.

O gate 2 existe porque o repo faz **squash merge**: o commit que entra no master é o título do
PR com a descrição do PR como corpo — nenhum dos dois passou pelo hook local.

Consequência prática: **a descrição do PR não pode ficar vazia**, e ela deve ser o corpo do
commit, não um checklist. O job reroda sozinho quando o título ou a descrição é editado.

### 3. No PR — [`CI.yml`](../.github/workflows/CI.yml): lint, typecheck e build

Três jobs, os três medidos neste repositório antes de entrarem no workflow:

| job | comando | resultado medido |
|---|---|---|
| `lint` | `npm run lint` | 0 erros, 0 avisos |
| `typecheck` | `npx tsc --noEmit` | 0 erros |
| `build` | `npm run build` | 6/6 rotas geradas |

O **ESLint não funcionava neste repositório** até a adoção deste padrão. O script `lint` existia
no [`package.json`](../package.json) e era `next lint`, mas `eslint` e `eslint-config-next` não
estavam instalados e não havia arquivo de config: rodando sem TTY — que é o caso de um `run:` no
GitHub Actions — o comando saía com código 1 em ~1s sem lintar uma linha.

O que mudou: `eslint` 9, `eslint-config-next` e `@eslint/eslintrc` entraram como devDependencies,
[`eslint.config.mjs`](../eslint.config.mjs) foi escrito em flat config, e o script virou `eslint`
puro — o `next lint` está depreciado no Next 15.5 e foi removido no 16.

Dois detalhes da config que não são óbvios:

- **`FlatCompat`.** O `eslint-config-next` da linha 15 ainda é config no formato antigo (o pacote
  não tem campo `exports` e entrega objetos, não arrays de flat config). O ESLint 9 só lê flat
  config, então a ponte é obrigatória. No Next 16 isso muda e o import passa a ser direto.
- **`design_handoff_embalei/` é ignorado** — protótipos `.jsx`/`.html` soltos, já fora do
  [`tsconfig.json`](../tsconfig.json) e fora do build. Sem esse ignore o lint estoura em código
  que ninguém compila.

O `build` roda **sem nenhum segredo**: as 4 rotas deste app são estáticas (`○` no relatório do
Next) e o cliente do ERP só é chamado em tempo de execução, no navegador.

Não há job de `test`: não existe runner nem um único arquivo `.test`/`.spec` no repositório.
Quando houver, o job entra ali.

Os **commits intermediários** do PR também são lintados, mas só como **aviso**
(`continue-on-error`), porque no squash eles não chegam ao master — e porque os 7 commits que já
existem no repositório são anteriores a este padrão.

> Depende de uma configuração no GitHub: em *Settings → General → Pull Requests*, o default do
> squash commit message precisa ser **"Pull request title and description"**. Se estiver como
> "…and commit details", o corpo validado no PR não é o que entra no master. É por repositório —
> **ainda não foi feito neste**.

## Pegadinhas

- **`commitlint.config.js` é CommonJS.** O `package.json` **não** tem `"type": "module"`, então a
  config usa `module.exports`. Trocar por `export default` quebra o carregamento — e é o erro
  fácil de cometer, porque o código do app em `src/` é todo ESM.
- **O hook só existe depois de `npm install`.** O `prepare` é que roda o `husky`. Depois de
  clonar, `npm install` antes do primeiro commit, senão a mensagem passa sem validação nenhuma.
- **Use `npm ci` / `npm install`, não `yarn`.** O lockfile versionado é o `package-lock.json`.
  Existe um `yarn.lock` no disco de quem desenvolveu antes, mas ele **não está rastreado** pelo
  git (aparece como `??` no `git status`) — é resíduo, não fonte de verdade. `@heroui/react` e
  `@heroui/styles` estão declarados como `"latest"`: só o lockfile segura a versão, e um install
  com o gerenciador errado troca o HeroUI sem ninguém pedir.
- **Linha de corpo começando com `#` desaparece.** Quando comitas pelo editor, o git remove
  linhas de comentário antes de salvar. Se precisas de markdown, indenta ou usa `-m`. Na
  descrição do PR isso não acontece (o workflow não usa `--edit`).
- **Limite de 100 colunas no corpo é só aviso.** Aparece como `⚠ … [body-max-line-length]` com
  `found 0 problems, 1 warnings` e **não** impede o commit. Só quebre a linha se quiser silenciá-lo.
- **Emenda também passa pelo hook.** `git commit --amend` revalida a mensagem inteira.
- **`--no-verify` pula o hook, não o PR.** `git commit --no-verify` serve para um WIP local, mas
  o gate do PR continua valendo — e é ele que decide o que entra no master.
- **Histórico antigo não foi reescrito.** Os 7 commits anteriores a este padrão são texto livre
  em português, sem tipo nem escopo ("removido o beep da embalagem", "ajustado a baseUrl"). Não
  são referência.
- **`tsconfig.tsbuildinfo` está versionado.** Rodar `next build` local reescreve o arquivo e ele
  entra no `git status`. Não o arraste para dentro de um commit de outra coisa — `git add`
  arquivo a arquivo, ou tira o artefato do índice num commit `build` próprio.
- **Não mexa no `next.config.mjs` ao arrumar lockfile.** O `turbopack.root` e o
  `outputFileTracingRoot` estão fixados ali de propósito: existem lockfiles em diretórios
  ancestrais desta máquina e sem isso o Next infere a raiz errada e quebra o
  `@import "@heroui/styles"`.

## O push também tem hook

[`.husky/pre-push`](../.husky/pre-push) chama
[`scripts/criar-branch-upstream.sh`](../scripts/criar-branch-upstream.sh): ao empurrar uma branch
para o fork (`origin`), ele cria no upstream (`lojasantoantonio/embalei-frontendv2`) uma branch
**vazia** com o mesmo nome, apontando para a master. É o que permite abrir a PR
`fork -> branch do upstream` com diff de verdade. `main` e `master` são pulados, e falha nunca
bloqueia o push.

O script depende de o remote `upstream` responder a `git ls-remote`. Ele estava por SSH nesta
máquina, sem chave configurada, e o hook morria calado. Foi trocado para HTTPS:

```bash
git remote set-url upstream https://github.com/lojasantoantonio/embalei-frontendv2.git
git ls-remote --symref upstream HEAD   # tem de responder: ref: refs/heads/master
```

## Quando o hook barra

O hook imprime o formato exigido junto do erro. Erros mais comuns:

| Erro do commitlint | O que fazer |
|---|---|
| `body may not be empty` | falta corpo (ou falta a linha em branco antes dele) |
| `body must not be shorter than 20 characters` | corpo existe mas não diz nada |
| `scope may not be empty` | falta `(escopo)` no título |
| `type must be one of [...]` | tipo inventado ou em maiúscula |
| `subject may not be empty` | falta `: ` ou o assunto depois dele |
| `header must not be longer than 100 characters` | título longo — encurta e joga o detalhe no corpo |

A mensagem não é perdida: corrija com `git commit --amend` (ou `git commit -F .git/COMMIT_EDITMSG`
para recuperar o texto que o hook rejeitou).
