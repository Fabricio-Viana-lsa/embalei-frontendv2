#!/usr/bin/env sh
#
# Cria no upstream (lojasantoantonio/embalei-frontendv2) uma branch VAZIA com o
# mesmo nome da que está sendo enviada ao fork (AdrianoAS/embalei-frontendv2).
# Chamado pelo hook `.husky/pre-push`.
#
# Por que uma branch vazia: o fluxo do time é
#
#     fork -> branch homônima no upstream -> master do upstream
#
# A PR "fork -> branch do upstream" só mostra diferença se a branch do upstream
# existir e apontar para a master. Se ela apontasse para o commit do fork, a PR
# nasceria sem diff nenhum. Por isso a branch é criada a partir do commit atual
# da master do upstream — nenhum objeto é enviado, só a referência.
#
# Nunca bloqueia o push: qualquer falha aqui vira aviso e o push segue.
#
# Pré-requisito: o remote `upstream` tem de responder a `git ls-remote` nesta
# máquina. Ele estava por SSH (git@github.com:...) e não há chave configurada
# aqui — nesse estado o script saía calado, sem criar nada. Foi trocado para
# HTTPS:
#
#     git remote set-url upstream https://github.com/lojasantoantonio/embalei-frontendv2.git
#
# Confira com `git ls-remote --symref upstream HEAD` (tem de responder
# `ref: refs/heads/master`).
#
# Ajustes por variável de ambiente:
#   UPSTREAM_BASE_BRANCH   ramo base do upstream (padrão: master)
#   PULA_BRANCH_UPSTREAM=1 desliga o script nesta execução

set -u

REMOTE_NAME="${1:-}"
BASE_BRANCH="${UPSTREAM_BASE_BRANCH:-master}"
ZERO=0000000000000000000000000000000000000000

# Só age no push para o fork; push direto para o upstream não cria nada.
[ "$REMOTE_NAME" = "origin" ] || exit 0
[ "${PULA_BRANCH_UPSTREAM:-}" = "1" ] && exit 0
git remote get-url upstream >/dev/null 2>&1 || exit 0

base_sha=$(git ls-remote upstream "refs/heads/$BASE_BRANCH" 2>/dev/null | cut -f1)
if [ -z "$base_sha" ]; then
  echo "branch-upstream: não achei $BASE_BRANCH no upstream; nada a criar." >&2
  exit 0
fi

# O hook recebe uma linha por ref sendo enviada:
#   <ref local> <sha local> <ref remota> <sha remoto>
while read -r local_ref local_sha remote_ref remote_sha; do
  [ -n "${local_sha:-}" ] || continue
  [ "$local_sha" = "$ZERO" ] && continue          # deleção de branch

  branch=${remote_ref#refs/heads/}
  [ -n "$branch" ] || branch=${local_ref#refs/heads/}

  # `main` e `master` são pulados sempre, independentemente do que
  # UPSTREAM_BASE_BRANCH valha: nenhum dos dois é branch de trabalho aqui.
  case "$branch" in
    "" | HEAD | main | master | "$BASE_BRANCH") continue ;;
  esac

  if git ls-remote --exit-code --heads upstream "$branch" >/dev/null 2>&1; then
    echo "branch-upstream: '$branch' já existe no upstream." >&2
    continue
  fi

  # O push so consegue referenciar um objeto que exista LOCALMENTE. Num clone que
  # ainda nao buscou o upstream, o sha lido pelo ls-remote nao esta aqui e o push
  # morre com "fatal: bad object <sha>" — foi o que aconteceu em 6 dos 9 repos na
  # primeira execucao real deste hook. O fetch e best-effort: se falhar, o push
  # abaixo falha e o aviso sai, sem bloquear o push para o fork.
  git cat-file -e "${base_sha}^{commit}" 2>/dev/null \
    || git fetch --quiet upstream "$BASE_BRANCH" 2>/dev/null \
    || true

  # `-c core.hooksPath=/dev/null` evita que este mesmo hook rode de novo.
  if git -c core.hooksPath=/dev/null push -q upstream \
      "$base_sha:refs/heads/$branch" 2>/dev/null; then
    echo "branch-upstream: criada '$branch' no upstream a partir de $BASE_BRANCH." >&2
  else
    echo "branch-upstream: falhou ao criar '$branch' no upstream (push segue normal)." >&2
  fi
done

exit 0
