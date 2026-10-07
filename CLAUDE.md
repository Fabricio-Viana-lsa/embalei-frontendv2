# CLAUDE.md

Instruções para o Claude Code neste repositório.

## Vídeo de novidade — `/pr-to-video`

**Nunca gere vídeo sem ler antes o que está versionado em [`.kb/video/`](.kb/video/).** As
skills `/pr-to-video` e `/hyperframes` trazem um preset genérico; o que vale aqui é o que está
neste repositório, e ele **sobrescreve o preset em tudo que divergir**.

Leia, nesta ordem, antes de escrever uma linha de roteiro ou de frame:

1. [`.kb/video/PROMPT-ROTEIRO.md`](.kb/video/PROMPT-ROTEIRO.md) — o pedido original do usuário,
   salvo verbatim, sobre como o roteiro deve soar. **Em caso de divergência, este manda.**
2. [`.kb/video/BRIEF.template.md`](.kb/video/BRIEF.template.md) — a forma operacional: persona,
   bordões, o que narrar e o que não narrar, assets e o tom deste sistema.
3. [`.kb/video/recipe/`](.kb/video/recipe/) — `recipe.json` (nome da recipe e id da voz),
   `frame.md` (design system já remixado sobre os tokens deste app) e os dois skeletons, que são
   exemplo de saída e não gabarito.

### Três coisas que se erram sempre

- **O Fausto é só voz.** Ele **não aparece em tela** — decisão de 17/09/2026. As quatro poses em
  `.kb/video/personagem/` estão versionadas para uso futuro e **não** devem ser copiadas para
  `assets/`; o palco não reserva coluna para ele e o canvas inteiro é conteúdo.
- **Tipografia não se remixa.** Lato e JetBrains Mono vêm empacotadas em
  `.kb/video/recipe/fonts/`. Trocar a família sem trocar os arquivos quebra o render offline —
  só as **cores** seguem este app.
- **A voz depende de segredo local.** `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` vivem no
  `.env.local` da raiz, que é ignorado pelo git e nunca deve ser versionado. Carregue com
  `set -a; . .env.local; set +a` antes de rodar `.kb/video/voz-elevenlabs.mjs`.
