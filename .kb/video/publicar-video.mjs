// Sobe o vídeo da novidade para o S3 da Base de Conhecimento e o anexa ao
// artigo que a esteira de texto já criou.
//
// Entrada (ambiente):
//   VIDEO_FILE        caminho do mp4 renderizado
//   POSTER_FILE       caminho do jpg extraído do mp4 (opcional)
//   NOVIDADE_SLUG     slug do artigo que recebe o vídeo
//   KB_PRESIGN_URL    https://<dominio>/api/news/media/presign
//   NEWS_PUBLISH_URL  https://<dominio>/api/news/draft
//   NEWS_TOKEN        segredo compartilhado com a Base
//   DRY_RUN           "true" = mede tudo, não sobe nada, não toca na Base
//
// Saída: linhas em $GITHUB_OUTPUT — uploaded, video_url, duration
//
// Os bytes vão do runner direto para o S3 por URL assinada: não passam pela
// função SSR do Amplify, que tem teto de payload. Ver, na Base,
// docs/plano-video-novidades.md.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, statSync } from "node:fs";

const ESPERAS_MS = [10_000, 30_000];

function saida(chave, valor) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${chave}=${valor}\n`);
  }
}

function exigir(nome) {
  const v = process.env[nome];
  if (!v) {
    console.error(`✖ ${nome} não configurado.`);
    process.exit(1);
  }
  return v;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Duração em segundos, inteira, lida do próprio arquivo. */
function duracaoSegundos(arquivo) {
  const saidaFfprobe = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      arquivo,
    ],
    { encoding: "utf8" },
  );
  const n = Math.round(Number(saidaFfprobe.trim()));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Pede a URL assinada e sobe o arquivo. Devolve a URL pública.
 *
 * Os cabeçalhos vêm do presign e são repetidos no PUT sem alteração: eles
 * entram na assinatura, e qualquer divergência vira 403 do S3.
 */
async function subir(arquivo, contentType, { presignUrl, token, slug }) {
  const bytes = readFileSync(arquivo);

  const res = await fetch(presignUrl, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ slug, contentType, sizeBytes: bytes.length }),
  });
  const assinatura = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`presign HTTP ${res.status} — ${assinatura.error ?? ""}`);
  }

  const put = await fetch(assinatura.uploadUrl, {
    method: "PUT",
    headers: assinatura.headers,
    body: bytes,
  });
  if (!put.ok) {
    throw new Error(`PUT no S3 HTTP ${put.status} — ${(await put.text()).slice(0, 200)}`);
  }

  console.log(`✔ ${arquivo} → ${assinatura.publicUrl}`);
  return assinatura.publicUrl;
}

// ── execução ──────────────────────────────────────────────────────────────────

const video = exigir("VIDEO_FILE");
if (!existsSync(video)) {
  console.error(`✖ ${video} não existe — o render não produziu vídeo.`);
  saida("uploaded", "false");
  process.exit(1);
}

const poster = process.env.POSTER_FILE;
const temPoster = poster && existsSync(poster);
const duracao = duracaoSegundos(video);

console.log(
  `Vídeo: ${video} (${(statSync(video).size / 1024 / 1024).toFixed(1)} MB, ${duracao ?? "?"}s)`,
);
if (duracao) saida("duration", String(duracao));

if (process.env.DRY_RUN === "true") {
  console.log("DRY_RUN — nada foi enviado ao S3 nem à Base.");
  saida("uploaded", "false");
  process.exit(0);
}

const presignUrl = exigir("KB_PRESIGN_URL");
const publishUrl = exigir("NEWS_PUBLISH_URL");
const token = exigir("NEWS_TOKEN");
const slug = exigir("NOVIDADE_SLUG");

let videoUrl;
let posterUrl = null;
try {
  videoUrl = await subir(video, "video/mp4", { presignUrl, token, slug });
  if (temPoster) {
    posterUrl = await subir(poster, "image/jpeg", { presignUrl, token, slug });
  }
} catch (e) {
  console.error(`✖ upload falhou: ${e.message}`);
  saida("uploaded", "false");
  process.exit(1);
}

// Anexa ao artigo. Só os campos de vídeo: a Base reconhece isto como modo
// vídeo e não toca em texto, autoria nem status — inclusive em artigo que um
// humano já publicou enquanto o vídeo renderizava.
const corpo = JSON.stringify({
  slug,
  videoUrl,
  videoPosterUrl: posterUrl,
  videoDurationS: duracao,
});

for (let tentativa = 0; tentativa <= ESPERAS_MS.length; tentativa++) {
  if (tentativa > 0) {
    const espera = ESPERAS_MS[tentativa - 1];
    console.log(`Retentando em ${espera / 1000}s…`);
    await dormir(espera);
  }

  let res;
  try {
    res = await fetch(publishUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: corpo,
    });
  } catch (e) {
    console.error(`✖ tentativa ${tentativa + 1}: rede — ${e.message}`);
    continue;
  }

  const json = await res.json().catch(() => ({}));

  if (res.ok) {
    console.log(`✔ Vídeo anexado ao artigo ${json.slug ?? slug}.`);
    saida("uploaded", "true");
    saida("video_url", videoUrl);
    process.exit(0);
  }

  console.error(`✖ tentativa ${tentativa + 1}: HTTP ${res.status} — ${json.error ?? ""}`);

  // 4xx que não seja 429 é erro de contrato ou de token: retentar não resolve.
  if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
}

console.error("✖ o vídeo subiu para o S3 mas a Base não o anexou ao artigo.");
saida("uploaded", "false");
process.exit(1);
