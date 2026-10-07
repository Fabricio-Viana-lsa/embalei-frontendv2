// Publica a série de guias de um módulo como RASCUNHOS na Base de Conhecimento.
//
// Entrada:  .kb-run/guia.json (escrito pelo modelo — ver .kb/PROMPT-GUIA-MODULO.md)
// Efeito:   um POST /api/news/draft por artigo, com capa embutida (coverSvg) e os
//           links #publicar:<slug> resolvidos para /artigo/<slug> — os slugs são
//           conhecidos antes de publicar, então nada fica para trocar à mão.
// Saída:    linhas em $GITHUB_OUTPUT — created (n), slugs (csv)
//
// Idempotente: reexecutar atualiza os mesmos rascunhos. Rascunho já publicado por
// humano é ignorado pela Base (skipped) e contado à parte.
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const ARQUIVO = process.env.GUIA_FILE || ".kb-run/guia.json";
const ESPERAS_MS = [10_000, 30_000];

function saida(chave, valor) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${chave}=${valor}\n`);
}

function exigir(nome) {
  const v = process.env[nome];
  if (!v) {
    console.error(`✖ ${nome} não configurado no repositório.`);
    process.exit(1);
  }
  return v;
}

const url = exigir("NEWS_PUBLISH_URL");
const token = exigir("NEWS_TOKEN");
const sistema = exigir("SISTEMA");

if (!existsSync(ARQUIVO)) {
  console.error(`✖ ${ARQUIVO} não existe — o modelo não gerou a série.`);
  process.exit(1);
}

let serie;
try {
  serie = JSON.parse(readFileSync(ARQUIVO, "utf8"));
} catch (e) {
  console.error(`✖ ${ARQUIVO} não é JSON válido: ${e.message}`);
  process.exit(1);
}

// ── Validação da série antes de tocar a Base ──
const artigos = Array.isArray(serie.artigos) ? serie.artigos : [];
const falhas = [];

if (artigos.length < 3) falhas.push(`série com ${artigos.length} artigos (mínimo: home + 2)`);
if (artigos.length > 9) falhas.push(`série com ${artigos.length} artigos (máximo: home + 8)`);

const homes = artigos.filter((a) => a.kind === "home");
if (homes.length !== 1) falhas.push(`${homes.length} artigos kind:home (deve ser exatamente 1)`);
if (artigos.length && artigos[artigos.length - 1]?.kind !== "home")
  falhas.push("a home deve ser o último item (é publicada por último)");

const slugs = new Set();
for (const a of artigos) {
  if (!a.slug || !/^[a-z0-9-]+$/.test(a.slug)) falhas.push(`slug inválido: ${JSON.stringify(a.slug)}`);
  else if (slugs.has(a.slug)) falhas.push(`slug repetido: ${a.slug}`);
  else slugs.add(a.slug);
  if (!a.title?.trim()) falhas.push(`artigo ${a.slug}: sem title`);
  if (!a.content_html?.trim()) falhas.push(`artigo ${a.slug}: sem content_html`);
}

for (const a of artigos) {
  for (const m of a.content_html?.matchAll(/#publicar:([a-z0-9-]+)/g) ?? []) {
    if (!slugs.has(m[1])) falhas.push(`artigo ${a.slug}: link para slug fora da série (${m[1]})`);
  }
}

if (falhas.length) {
  for (const f of falhas) console.error(`✖ ${f}`);
  console.error("✖ Série recusada — nada foi enviado para a Base.");
  process.exit(1);
}

// ── Publicação, na ordem do arquivo (subs primeiro, home por último) ──
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const criados = [];
let ignorados = 0;

for (const artigo of artigos) {
  const content_html = artigo.content_html.replace(
    /#publicar:([a-z0-9-]+)/g,
    (_, slug) => `/artigo/${slug}`,
  );

  const corpo = JSON.stringify({
    title: artigo.title,
    excerpt: artigo.excerpt ?? null,
    content_html,
    slug: artigo.slug,
    ...(artigo.cover_svg ? { coverSvg: artigo.cover_svg } : {}),
    githubLogin: process.env.RUN_ACTOR || null,
    sourceSystem: sistema,
  });

  let feito = false;
  for (let tentativa = 0; tentativa <= ESPERAS_MS.length && !feito; tentativa++) {
    if (tentativa > 0) {
      console.log(`Retentando em ${ESPERAS_MS[tentativa - 1] / 1000}s…`);
      await dormir(ESPERAS_MS[tentativa - 1]);
    }

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: corpo,
      });
    } catch (e) {
      console.error(`✖ ${artigo.slug}: rede — ${e.message}`);
      continue;
    }

    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      if (json.skipped) {
        console.log(`• ${artigo.slug}: já publicado por humano — não sobrescrito.`);
        ignorados++;
      } else {
        console.log(`✔ rascunho: ${artigo.slug} — ${artigo.title}`);
        criados.push(artigo.slug);
      }
      feito = true;
      break;
    }

    console.error(`✖ ${artigo.slug}: HTTP ${res.status} — ${json.error ?? ""}`);
    if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
  }

  if (!feito) {
    console.error(`✖ a Base não recebeu "${artigo.slug}". Série interrompida — reexecute para completar (é idempotente).`);
    process.exit(1);
  }
}

saida("created", String(criados.length));
saida("slugs", criados.join(","));
console.log(`✔ Série do módulo "${serie.modulo ?? "?"}": ${criados.length} rascunho(s), ${ignorados} ignorado(s).`);
