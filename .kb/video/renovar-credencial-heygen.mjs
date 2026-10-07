// Renova a credencial da HeyGen do CI e a regrava no segredo do GitHub.
//
// Por que isto existe: o segredo HEYGEN_CREDENTIALS é uma SESSÃO, não uma chave
// permanente. O runner renova o token durante a execução e descarta o arquivo
// renovado junto com a máquina — o que está guardado no GitHub vai envelhecendo.
// Quando vence, o job de vídeo morre no primeiro passo.
//
// Uso:
//   node .kb/video/renovar-credencial-heygen.mjs              # renova e grava
//   node .kb/video/renovar-credencial-heygen.mjs --check      # só relata, não grava
//   node .kb/video/renovar-credencial-heygen.mjs --dry-run    # renova local, não grava
//
// Opções:
//   --dir <caminho>   cofre da conta do CI        (padrão ~/.heygen-ci)
//   --repo <owner/nome>  repositório do segredo   (padrão lojasantoantonio/embalei-frontendv2)
//   --dias <n>        em --check, falha se vencer em menos de n dias (padrão 5)
//
// Requisitos: `npx hyperframes` e `gh` autenticado com permissão de admin no repo.
//
// Plano e decisões: base-conhecimento/docs/plano-video-novidades.md (decisões 10-12)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    dir: { type: "string" },
    repo: { type: "string", default: "lojasantoantonio/embalei-frontendv2" },
    dias: { type: "string", default: "5" },
    check: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

const COFRE = args.dir || join(homedir(), ".heygen-ci");
const ARQUIVO = join(COFRE, "credentials");
const SEGREDO = "HEYGEN_CREDENTIALS";
const COFRE_PESSOAL = join(homedir(), ".heygen", "credentials");

function morrer(mensagem, dica) {
  console.error(`✖ ${mensagem}`);
  if (dica) console.error(`  ${dica}`);
  process.exit(1);
}

/** Lê o arquivo e devolve conta e vencimento, ou morre explicando. */
function ler(caminho) {
  if (!existsSync(caminho)) return null;
  let cred;
  try {
    cred = JSON.parse(readFileSync(caminho, "utf8"));
  } catch (e) {
    morrer(`${caminho} não é JSON válido: ${e.message}`);
  }
  const vence = cred?.oauth?.expires_at ? new Date(cred.oauth.expires_at) : null;
  return {
    conta: cred?.user?.email ?? null,
    vence,
    diasRestantes: vence ? (vence.getTime() - Date.now()) / 86_400_000 : null,
    temRefresh: Boolean(cred?.oauth?.refresh_token),
  };
}

function formatar(info) {
  if (!info) return "—";
  const dias = info.diasRestantes;
  const quando = info.vence ? info.vence.toISOString().slice(0, 16).replace("T", " ") : "?";
  const restante =
    dias === null ? "sem data" : dias < 0 ? "VENCIDA" : `${dias.toFixed(1)} dia(s)`;
  return `${info.conta ?? "conta desconhecida"} · vence ${quando} UTC · ${restante}`;
}

// ── 1. o cofre do CI existe? ──────────────────────────────────────────────────

const antes = ler(ARQUIVO);
if (!antes) {
  morrer(
    `não há credencial do CI em ${ARQUIVO}`,
    `Faça o login da conta do CI primeiro:\n    HEYGEN_CONFIG_DIR=${COFRE} npx hyperframes auth login`,
  );
}

console.log(`Cofre do CI: ${COFRE}`);
console.log(`  antes:  ${formatar(antes)}`);

// Guarda contra o erro mais provável: ter logado com a conta pessoal no cofre do
// CI. Os dois arquivos com a mesma conta significam que a separação de contas —
// a decisão 11 — não está valendo, e uma rotação de token derruba os dois lados.
const pessoal = ler(COFRE_PESSOAL);
if (pessoal?.conta && antes.conta && pessoal.conta === antes.conta) {
  morrer(
    `o cofre do CI está logado na MESMA conta do cofre pessoal (${antes.conta})`,
    "A conta do CI tem de ser separada, senão a rotação de token no runner derruba a sua sessão.\n" +
      `  Refaça:  HEYGEN_CONFIG_DIR=${COFRE} npx hyperframes auth logout && HEYGEN_CONFIG_DIR=${COFRE} npx hyperframes auth login`,
  );
}

// ── 2. modo --check: só relata ────────────────────────────────────────────────

if (args.check) {
  const limite = Number(args.dias);
  const dias = antes.diasRestantes ?? -1;
  if (dias < limite) {
    console.error(
      `✖ credencial vence em menos de ${limite} dia(s) — renove com:\n` +
        `    node .kb/video/renovar-credencial-heygen.mjs`,
    );
    process.exit(1);
  }
  console.log(`✔ credencial válida por mais de ${limite} dia(s); nada a fazer.`);
  process.exit(0);
}

// ── 3. renova o token no cofre do CI ──────────────────────────────────────────

if (!antes.temRefresh) {
  morrer(
    "a credencial não tem refresh_token — não há o que renovar",
    `Refaça o login:  HEYGEN_CONFIG_DIR=${COFRE} npx hyperframes auth login`,
  );
}

try {
  execFileSync("npx", ["--yes", "hyperframes", "auth", "refresh"], {
    env: { ...process.env, HEYGEN_CONFIG_DIR: COFRE },
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
} catch (e) {
  const saida = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
  morrer(
    `a renovação falhou: ${saida.split("\n")[0] || e.message}`,
    "Refresh token provavelmente expirado ou já rotacionado. Refaça o login:\n" +
      `    HEYGEN_CONFIG_DIR=${COFRE} npx hyperframes auth login`,
  );
}

const depois = ler(ARQUIVO);
console.log(`  depois: ${formatar(depois)}`);

if (depois?.vence && antes?.vence && depois.vence <= antes.vence) {
  console.log(
    "• O vencimento não avançou. Pode ser que o token ainda estivesse novo; " +
      "se o job continuar falhando na autenticação, refaça o login.",
  );
}

// ── 4. grava no segredo do GitHub ─────────────────────────────────────────────

if (args["dry-run"]) {
  console.log(`\nDRY-RUN — o segredo ${SEGREDO} em ${args.repo} NÃO foi alterado.`);
  process.exit(0);
}

try {
  execFileSync("gh", ["secret", "set", SEGREDO, "--repo", args.repo], {
    input: readFileSync(ARQUIVO),
    stdio: ["pipe", "inherit", "inherit"],
  });
} catch (e) {
  morrer(
    `não consegui gravar o segredo ${SEGREDO} em ${args.repo}: ${e.message}`,
    "Confira `gh auth status` e se a sua conta tem permissão de admin no repositório.",
  );
}

console.log(`\n✔ segredo ${SEGREDO} atualizado em ${args.repo}.`);
console.log(`  Próxima renovação sugerida: até ${depois?.vence?.toISOString().slice(0, 10) ?? "?"}.`);
