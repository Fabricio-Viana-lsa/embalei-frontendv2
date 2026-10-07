// Config do ESLint deste repo. Consumida por `npm run lint` e pelo job de lint
// do `.github/workflows/CI.yml`.
//
// Duas escolhas que nao sao obvias:
//
// 1. `FlatCompat`. O `eslint-config-next` da linha 15 ainda e config no formato
//    antigo (`.eslintrc`) — o pacote nao tem campo `exports` e entrega
//    `core-web-vitals.js` / `typescript.js` como objetos, nao como arrays de
//    flat config. O ESLint 9 so le flat config, entao a ponte e obrigatoria.
//    (No Next 16 isso muda e o import passa a ser direto.)
//
// 2. Extensao `.mjs`. O package.json nao tem `"type": "module"`; com `.js` o
//    node carregaria como CJS e o `import` quebraria.
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
})

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      // Prototipos de handoff: .jsx e .html soltos, fora do tsconfig e fora do
      // build. Nao sao codigo da aplicacao.
      'design_handoff_embalei/**',
      // Scripts do pipeline da Base sao ESM soltos, sem tsconfig, e chegam aqui
      // por copia — lintar so geraria ruido a cada atualizacao da pasta.
      '.kb/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default eslintConfig
