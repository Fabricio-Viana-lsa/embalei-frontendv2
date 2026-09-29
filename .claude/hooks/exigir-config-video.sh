#!/usr/bin/env bash
# UserPromptSubmit hook — amarra as skills de vídeo ao que está versionado em
# `.kb/video/`.
#
# O problema que ele resolve: `/pr-to-video` e `/hyperframes` trazem um preset
# genérico. Sem nada que force o contrário, elas rodam por cima dele e o vídeo
# sai com outra persona, outra paleta e outra tipografia — ignorando a recipe
# congelada deste repositório. A regra também está no `CLAUDE.md`, mas lá ela
# depende de alguém lembrar de ler; aqui ela é injetada no contexto sempre que o
# assunto aparece.
#
# Faz duas coisas que o `CLAUDE.md` não faz:
#   1. dispara sozinho, no momento certo;
#   2. CONFERE o estado real (a pasta existe? o .env.local tem as duas chaves?)
#      e avisa antes de a geração começar, em vez de falhar no meio.
#
# Contrato: recebe o payload do prompt como JSON no stdin; o campo `.prompt` tem
# o texto. Saída em JSON no stdout vira contexto adicional. NUNCA bloqueia: sai 0
# em qualquer cenário, inclusive sem `jq` e sem `.kb/video`.
set -uo pipefail

raiz="${CLAUDE_PROJECT_DIR:-$(pwd)}"
kb="$raiz/.kb/video"

# Sem a pasta não há o que exigir — repositório sem pipeline de vídeo.
[ -d "$kb" ] || exit 0

# Sem jq não dá para ler o prompt. Silêncio é melhor que ruído em todo prompt.
command -v jq >/dev/null 2>&1 || exit 0

prompt=$(cat | jq -r '.prompt // empty' 2>/dev/null) || exit 0
[ -n "$prompt" ] || exit 0

# Gatilho deliberadamente estreito: as skills de vídeo pelo nome, mais as formas
# como se pede isso em português. Amplo demais viraria ruído em todo prompt.
if ! printf '%s' "$prompt" | grep -qiE \
  'pr-to-video|hyperframes|general-video|motion-graphics|faceless-explainer|music-to-video|(gerar|criar|fazer|montar|refazer|regerar).{0,24}v[ií]deo|v[ií]deo.{0,16}(da|de) novidade|roteiro.{0,16}v[ií]deo|storyboard'
then
  exit 0
fi

# ---------------------------------------------------------------------------
# Estado real, conferido agora — é o que justifica ser hook e não documentação.
# ---------------------------------------------------------------------------
avisos=""

for f in PROMPT-ROTEIRO.md BRIEF.template.md recipe/recipe.json recipe/frame.md; do
  [ -f "$kb/$f" ] || avisos="${avisos}
- FALTA \`.kb/video/$f\` — a configuração deste repositório está incompleta."
done

env_local="$raiz/.env.local"
if [ ! -f "$env_local" ]; then
  avisos="${avisos}
- NÃO existe \`.env.local\` na raiz. A narração vai falhar: \`voz-elevenlabs.mjs\` morre com \"ELEVENLABS_API_KEY não definida\"."
else
  for chave in ELEVENLABS_API_KEY ELEVENLABS_VOICE_ID; do
    grep -qE "^${chave}=.+" "$env_local" 2>/dev/null \
      || avisos="${avisos}
- \`.env.local\` existe mas \`${chave}\` está vazia ou ausente."
  done
fi

recipe_nome="(recipe.json ilegível)"
if [ -f "$kb/recipe/recipe.json" ]; then
  recipe_nome=$(jq -r '.name // "(sem nome)"' "$kb/recipe/recipe.json" 2>/dev/null || echo "(recipe.json inválido)")
fi

bloco_avisos=""
[ -n "$avisos" ] && bloco_avisos="

**Problemas detectados agora, antes de começar:**${avisos}"

# ---------------------------------------------------------------------------
# O texto injetado. jq -Rs escapa tudo — não montar JSON à mão.
# ---------------------------------------------------------------------------
contexto=$(cat <<EOF
<configuracao-de-video-obrigatoria>
Este repositório tem configuração de vídeo versionada em \`.kb/video/\`, e ela
**sobrescreve o preset da skill em tudo que divergir**. Não gere roteiro, frame,
storyboard nem narração antes de ler, nesta ordem:

1. \`.kb/video/PROMPT-ROTEIRO.md\` — o pedido original do usuário, verbatim.
   **Em caso de divergência com qualquer outra fonte, este manda.**
2. \`.kb/video/BRIEF.template.md\` — a forma operacional: persona, bordões, o que
   narrar e o que não narrar, assets e tom deste sistema.
3. \`.kb/video/recipe/\` — \`recipe.json\` (recipe \`${recipe_nome}\`, com o id da voz),
   \`frame.md\` (design system já remixado sobre os tokens deste app) e os dois
   skeletons, que são exemplo de saída e não gabarito a preencher.

Três regras que se erram sempre:

- **O Fausto é só voz.** Não aparece em tela (decisão de 17/09/2026). As poses em
  \`.kb/video/personagem/\` estão versionadas para uso futuro e não devem ir para
  \`assets/\`; o palco não reserva coluna e o canvas inteiro é conteúdo.
- **Tipografia não se remixa.** Lato e JetBrains Mono vêm empacotadas em
  \`.kb/video/recipe/fonts/\`; trocar a família sem trocar os arquivos quebra o
  render offline. Só as cores seguem este app.
- **A voz depende de segredo local.** \`ELEVENLABS_API_KEY\` e \`ELEVENLABS_VOICE_ID\`
  no \`.env.local\` da raiz (ignorado pelo git). Carregue com
  \`set -a; . .env.local; set +a\` antes de rodar \`.kb/video/voz-elevenlabs.mjs\`.${bloco_avisos}
</configuracao-de-video-obrigatoria>
EOF
)

jq -n --arg ctx "$contexto" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$ctx}}'

exit 0
