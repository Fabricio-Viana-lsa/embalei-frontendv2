// Envia o rascunho de Novidade para a Base de Conhecimento.
//
// Entrada:  .kb-run/novidade.json  (escrito pelo modelo)
// Saída:    linhas em $GITHUB_OUTPUT — created, slug, skipped
//
// Duas retentativas antes de desistir: instância fria e oscilação de rede não
// deveriam pintar a PR de vermelho, mas falha persistente tem de aparecer.
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const ARQUIVO = process.env.NOVIDADE_FILE || ".kb-run/novidade.json";
const ESPERAS_MS = [10_000, 30_000];

function saida(chave, valor) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${chave}=${valor}\n`);
  }
}

function exigir(nome) {
  const v = process.env[nome];
  if (!v) {
    console.error(`✖ ${nome} não configurado no repositório.`);
    process.exit(1);
  }
  return v;
}

if (!existsSync(ARQUIVO)) {
  console.log(`Sem ${ARQUIVO} — o modelo não gerou novidade.`);
  saida("created", "false");
  saida("skipped", "sem-arquivo");
  process.exit(0);
}

let dados;
try {
  dados = JSON.parse(readFileSync(ARQUIVO, "utf8"));
} catch (e) {
  console.error(`✖ ${ARQUIVO} não é JSON válido: ${e.message}`);
  process.exit(1);
}

if (!dados.publish) {
  console.log("publish=false — esta entrega não tem novidade voltada ao usuário.");
  saida("created", "false");
  saida("skipped", "sem-novidade");
  process.exit(0);
}

if (!dados.title || !dados.content_html) {
  console.error("✖ novidade sem title ou content_html.");
  process.exit(1);
}

const url = exigir("NEWS_PUBLISH_URL");
const token = exigir("NEWS_TOKEN");
const corpo = JSON.stringify({
  title: dados.title,
  excerpt: dados.excerpt ?? null,
  content_html: dados.content_html,
  slug: exigir("NOVIDADE_SLUG"),
  githubLogin: process.env.PR_AUTHOR || null,
  sourceSystem: exigir("SISTEMA"),
  sourcePrUrl: process.env.PR_URL || null,
});

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

for (let tentativa = 0; tentativa <= ESPERAS_MS.length; tentativa++) {
  if (tentativa > 0) {
    const espera = ESPERAS_MS[tentativa - 1];
    console.log(`Retentando em ${espera / 1000}s…`);
    await dormir(espera);
  }

  let res;
  try {
    res = await fetch(url, {
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
    if (json.skipped) {
      console.log(`• Ignorado pela Base: ${json.reason}`);
      saida("created", "false");
      saida("skipped", "ja-publicado");
    } else {
      console.log(`✔ Rascunho salvo: ${json.slug}`);
      saida("created", "true");
      saida("slug", json.slug ?? "");
    }
    process.exit(0);
  }

  console.error(`✖ tentativa ${tentativa + 1}: HTTP ${res.status} — ${json.error ?? ""}`);

  // 4xx que não seja 429 é erro de contrato ou de token: retentar não resolve.
  if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
}

console.error("✖ a Base não recebeu o rascunho. O artigo NÃO foi criado.");
process.exit(1);
