// Ajusta a janela de cada frame à narração e mantém o desenho na tela até o fim
// dela.
//
// Por que existe: quando a voz é regerada depois dos frames prontos (troca de
// voz, de persona ou de ajuste de entrega), a fala fica mais longa que o frame.
// Esticar só a raiz não basta — os elementos `class="clip"` continuam com a
// janela antiga, somem quando ela acaba e o vídeo mostra TELA PRETA enquanto o
// narrador ainda fala. Este script estica a raiz e leva junto todo clip que ia
// até o fim do frame.
//
// A janela é `max(voz, montado)`: encurtar abaixo do montado cortaria a
// animação no meio. O STORYBOARD é reescrito junto porque o assemble valida que
// os dois batem.
//
// Uso:
//   node .kb/video/esticar-frames.mjs --hyperframes <PROJECT_DIR> [--base <DIR>]
//
//   --base  projeto de onde ler a duração ORIGINAL de cada frame. Necessário
//           quando este projeto já foi esticado antes, senão o "montado" lido
//           seria a esticada anterior e os clips nunca voltariam ao lugar.
//
// Plano e decisões: base-conhecimento/docs/plano-video-novidades.md
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d;
};

const proj = resolve(flag("hyperframes", "."));
const base = resolve(flag("base", proj));
const dirFrames = join(proj, "compositions", "frames");
const r3 = (n) => Number(n.toFixed(3));

const meta = JSON.parse(readFileSync(join(proj, "audio_meta.json"), "utf8"));
const voz = Object.fromEntries(meta.voices.map((v) => [v.frame, v.duration_s]));

const raiz = (html) => Number(html.match(/data-duration="([^"]+)"/)[1]);

/**
 * Faz os clips do frame cobrirem a janela inteira.
 *
 * Os frames desta recipe guardam o desenho em um ou dois clips que abrem em
 * `data-start="0"` — o fundo e o palco. Eles são recipiente, não batida: se a
 * janela deles acabar antes da raiz, o que restar do frame é TELA PRETA com a
 * narração correndo por cima (medido com `ffmpeg blackdetect`: oito trechos de
 * até 3,5s na PR #88 antes desta correção).
 *
 * É a forma do vídeo feito à mão, a referência: lá todo clip termina exatamente
 * na raiz. Clip que começa depois do zero é batida deliberada e não se mexe.
 */
function esticarClips(html, nova) {
  let tocados = 0;
  const saida = html.replace(/<[a-zA-Z][^>]*>/g, (tag) => {
    if (!/class="[^"]*\bclip\b/.test(tag)) return tag;
    const ini = tag.match(/data-start="([\d.]+)"/);
    const dur = tag.match(/data-duration="([\d.]+)"/);
    if (!ini || !dur || Number(ini[1]) !== 0) return tag;
    if (Number(dur[1]) === nova) return tag;
    tocados++;
    return tag.replace(/data-duration="[\d.]+"/, `data-duration="${nova}"`);
  });
  return { html: saida, tocados };
}

const arquivos = readdirSync(dirFrames).sort();
const novas = [];

arquivos.forEach((f, i) => {
  const alvo = join(dirFrames, f);
  let html = readFileSync(alvo, "utf8");
  const montado = raiz(readFileSync(join(base, "compositions", "frames", f), "utf8"));
  const fala = voz[i + 1] ?? 0;
  const nova = r3(Math.max(montado, fala));
  novas.push(nova);

  // A primeira data-duration do arquivo é a da raiz: o contrato do frame exige
  // que o elemento raiz seja o primeiro dentro do <template>.
  html = html.replace(/data-duration="[^"]+"/, `data-duration="${nova}"`);
  const { html: comClips, tocados } = esticarClips(html, nova);
  writeFileSync(alvo, comClips);

  const janela = nova > montado ? `esticado +${r3(nova - montado)}s` : "janela igual";
  const nota = `${janela} · ${tocados} clip(s) ajustado(s)`;
  console.log(`${f.padEnd(30)} montado ${montado.toFixed(3)}  voz ${fala.toFixed(3)}  ->  ${nova.toFixed(3)}  ${nota}`);
});

const total = r3(novas.reduce((a, b) => a + b, 0));

const sbPath = join(proj, "STORYBOARD.md");
let sb = readFileSync(sbPath, "utf8");
let k = 0;
sb = sb.replace(/^- duration: [\d.]+s/gm, () => `- duration: ${novas[k++]}s`);
if (k !== novas.length) {
  console.error(`✗ STORYBOARD tem ${k} frame(s) e o projeto tem ${novas.length}`);
  process.exit(1);
}
sb = sb.replace(/^duration: .*$/m, `duration: ${Math.round(total)}s`);
writeFileSync(sbPath, sb);

const briefPath = join(proj, "BRIEF.md");
writeFileSync(
  briefPath,
  readFileSync(briefPath, "utf8").replace(/^length: .*$/m, `length: ${Math.round(total)}s`),
);

console.log(`\n✔ total ${total}s · narração ${r3(meta.voices.reduce((a, v) => a + v.duration_s, 0))}s`);
