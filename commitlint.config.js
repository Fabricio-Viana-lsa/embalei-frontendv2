/**
 * Padrão de commits do repo. Ver `docs/padrao-de-commits.md`.
 *
 *   tipo(escopo): assunto
 *   <linha em branco>
 *   corpo explicando o quê e por quê
 *
 * Lido por dois gates: o hook `.husky/commit-msg` (commit local) e o workflow
 * `.github/workflows/commitlint.yml` (título + descrição do PR, que é o que o
 * squash merge grava no master).
 *
 * CommonJS porque o package.json deste repo NÃO tem `"type": "module"` — usar
 * `export default` aqui quebra o carregamento da config. (O app é Next 15 com
 * ESM nos fontes, mas o package.json não declara o campo, então tudo que o node
 * carrega por `.js` na raiz é CJS.)
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Escopo obrigatório, mas livre: normalmente a rota em `src/app/`
    // (`login`, `embalagem`) ou a camada tocada (components, lib, data, types,
    // styles, layout, system, manifest), mais ci/deps/build/docs.
    // Sem `scope-enum` de propósito — rota nova não deve exigir editar este
    // arquivo; o custo é que typo (`embalagens`) passa.
    'scope-empty': [2, 'never'],

    // Corpo obrigatório em todos os tipos. `body-min-length` existe para o
    // corpo dizer algo: sem ele, um "ok" satisfaz `body-empty`.
    'body-empty': [2, 'never'],
    'body-min-length': [2, 'always', 20],

    // Sobe de aviso (padrão do config-conventional) para erro: sem a linha em
    // branco o git trata tudo como assunto e o corpo desaparece do histórico.
    'body-leading-blank': [2, 'always'],

    // Desce de erro para aviso: o corpo do squash vem da descrição do PR, que é
    // markdown e estoura 100 colunas rotineiramente (links, parágrafos colados).
    // Como erro, isso reprovaria PR por cosmética.
    'body-max-line-length': [1, 'always', 100],
  },
};
