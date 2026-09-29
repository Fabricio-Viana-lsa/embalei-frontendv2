// Gera a narração do vídeo com uma voz da ElevenLabs, com os tempos por
// palavra vindos do próprio sintetizador.
//
// Substitui apenas o passo de VOZ do motor de áudio da skill. Existe porque a
// rota ElevenLabs embutida devolve `words: null` e delega os tempos ao
// whisper.cpp — que não vem instalado, falha em silêncio (`Captions skipped`) e,
// num runner efêmero, custaria compilar e baixar o modelo a cada execução.
// O endpoint `/with-timestamps` resolve isso na mesma chamada do áudio, e os
// tempos são exatos em vez de estimados por transcrição.
//
// O que ele NÃO faz: BGM e SFX continuam com o motor da skill
// (`audio.mjs fetch-sfx`), que este script preserva ao reescrever os metadados.
//
// Uso:
//   ELEVENLABS_API_KEY=... node .kb/video/voz-elevenlabs.mjs \
//     --hyperframes <PROJECT_DIR> --voice <voice_id>
//
// Opções:
//   --hyperframes <dir>  raiz do projeto HyperFrames (padrão: .)
//   --script <arq>       padrão <dir>/SCRIPT.md
//   --out <arq>          padrão <dir>/audio_meta.json
//   --voice <id>         obrigatório — voz da ElevenLabs
//   --model <id>         padrão eleven_multilingual_v2
//   --stability <0..1>   menor = entrega mais solta e expressiva
//   --style <0..1>       exagera o jeito de falar da voz de origem
//   --similarity <0..1>  fidelidade ao timbre do clone (padrão 0.85 com os acima)
//   --sem-contexto       não manda as linhas vizinhas como contexto de prosódia
//   --frames <1,3>       regera só esses frames; os demais ficam como estão
//
// Atenção: mexer em --stability/--style muda a DURAÇÃO da fala, não só o tom
// (medido: a mesma frase foi de 5,99s para 8,27s). Remeça o `data-duration` de
// cada frame depois de gerar.
//
// Saída: assets/voice/NN.wav + audio_engine_meta.json + audio_meta.json,
// nos mesmos formatos que captions.mjs e assemble-index.mjs já consomem.
//
// Plano e decisões: base-conhecimento/docs/plano-video-novidades.md
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const API = "https://api.elevenlabs.io/v1/text-to-speech";
const ESPERAS_MS = [2_000, 8_000];

const argv = process.argv.slice(2);
const flag = (nome, padrao = null) => {
  const i = argv.indexOf(`--${nome}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : padrao;
};
const pad2 = (n) => String(n).padStart(2, "0");

function morrer(mensagem) {
  console.error(`✗ voz-elevenlabs: ${mensagem}`);
  process.exit(1);
}

// SCRIPT.md → [{ frame, text }]. Mesma leitura do adaptador da skill: o
// cabeçalho `## … (Frame N)` abre a linha, as linhas `**chave:**` são metadados,
// e o bloco indentado é a fala — a única coisa que vai para o sintetizador.
function lerScript(md) {
  const saida = [];
  let atual = null;
  const fechar = () => {
    if (atual && atual.text.trim()) saida.push({ frame: atual.frame, text: atual.text.trim() });
    atual = null;
  };
  for (const linha of md.split(/\r?\n/)) {
    const h = linha.match(/^#{2,3}\s+.*?\(frame\s+(\d+)\)/i);
    if (h) {
      fechar();
      atual = { frame: Number(h[1]), text: "" };
      continue;
    }
    if (!atual) continue;
    if (/^\s*\*\*/.test(linha)) continue;
    const m = linha.match(/^(?: {4,}|\t)(.+)$/);
    if (m) atual.text += (atual.text ? " " : "") + m[1].trim();
  }
  fechar();
  return saida;
}

/**
 * Alinhamento por caractere → palavras.
 *
 * A ElevenLabs devolve um tempo de início e de fim para CADA caractere,
 * inclusive espaços. Uma palavra começa no primeiro caractere não-espaço e
 * termina no último — a pontuação fica colada nela, como o motor da skill
 * também faz, senão a legenda quebraria "WhatsApp." em duas peças.
 */
function palavras(alinhamento) {
  const { characters: cs, character_start_times_seconds: ini, character_end_times_seconds: fim } =
    alinhamento;
  const out = [];
  let atual = null;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (/\s/.test(c)) {
      if (atual) out.push(atual);
      atual = null;
      continue;
    }
    if (!atual) atual = { text: c, start: ini[i], end: fim[i] };
    else {
      atual.text += c;
      atual.end = fim[i];
    }
  }
  if (atual) out.push(atual);
  return out.map((p, i) => ({
    id: `w${i}`,
    text: p.text,
    start: Number(p.start.toFixed(3)),
    end: Number(p.end.toFixed(3)),
  }));
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Sintetiza uma linha. Devolve { mp3: Buffer, words }.
 *
 * `anterior`/`proximo` são o texto das linhas vizinhas: a ElevenLabs não os
 * pronuncia, usa só para encadear a entonação — sem eles cada linha sai como se
 * fosse a única frase do vídeo, e a narração fica picotada nas emendas.
 */
async function sintetizar({ texto, voz, modelo, chave, anterior, proximo, ajustes }) {
  const corpo = JSON.stringify({
    text: texto,
    model_id: modelo,
    output_format: "mp3_44100_128",
    ...(anterior ? { previous_text: anterior } : {}),
    ...(proximo ? { next_text: proximo } : {}),
    ...(ajustes ? { voice_settings: ajustes } : {}),
  });

  for (let tentativa = 0; tentativa <= ESPERAS_MS.length; tentativa++) {
    if (tentativa > 0) await dormir(ESPERAS_MS[tentativa - 1]);

    let res;
    try {
      res = await fetch(`${API}/${voz}/with-timestamps`, {
        method: "POST",
        headers: { "xi-api-key": chave, "content-type": "application/json" },
        body: corpo,
      });
    } catch (e) {
      console.error(`  rede: ${e.message}`);
      continue;
    }

    if (res.ok) {
      const j = await res.json();
      if (!j.audio_base64 || !j.alignment) throw new Error("resposta sem áudio ou alinhamento");
      return { mp3: Buffer.from(j.audio_base64, "base64"), words: palavras(j.alignment) };
    }

    const detalhe = (await res.text()).slice(0, 200);
    console.error(`  HTTP ${res.status}: ${detalhe}`);
    // 4xx que não seja 429 é erro de contrato, de voz ou de chave: não adianta insistir.
    if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
  }
  throw new Error("síntese falhou");
}

function duracaoSegundos(arquivo) {
  const s = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", arquivo],
    { encoding: "utf8" },
  );
  return Number(Number(s.trim()).toFixed(3));
}

/** Metadados no formato do motor (id-keyed) → formato da skill (frame-keyed). */
function paraMetaDaSkill(neutro) {
  return {
    bgm: neutro.bgm
      ? {
          path: neutro.bgm.path,
          volume: neutro.bgm.volume,
          query: neutro.bgm.query ?? null,
          duration_s: neutro.bgm.duration_s ?? null,
        }
      : null,
    bgm_pending: !!neutro.bgm_pending,
    voices: (neutro.voices ?? []).map((v) => ({
      frame: Number(v.id),
      path: v.path,
      duration_s: v.duration_s,
      words: (v.words ?? []).map((w) => ({ id: w.id, text: w.text, start: w.start, end: w.end })),
    })),
    sfx: (neutro.sfx ?? []).map((s) => ({
      frame: Number(s.id),
      file: s.file,
      offset_s: s.offset_s ?? 0,
      duration_s: s.duration_s ?? 1,
      volume: s.volume ?? 0.35,
    })),
  };
}

// ── execução ──────────────────────────────────────────────────────────────────

const chave = process.env.ELEVENLABS_API_KEY;
if (!chave) morrer("ELEVENLABS_API_KEY não definida.");

const proj = resolve(flag("hyperframes", "."));
const scriptPath = resolve(flag("script", join(proj, "SCRIPT.md")));
const outPath = resolve(flag("out", join(proj, "audio_meta.json")));
const neutroPath = join(dirname(outPath), "audio_engine_meta.json");
const voz = flag("voice");
const modelo = flag("model", "eleven_multilingual_v2");
const semContexto = argv.includes("--sem-contexto");
// Regerar uma linha só: a síntese com stability baixo às vezes gagueja
// ("eu falto, eu falto, eu falto") e o conserto é refazer aquela linha, não o
// vídeo inteiro — as outras já foram ouvidas e aprovadas.
const soFrames = flag("frames")
  ? new Set(flag("frames").split(",").map((n) => Number(n.trim())))
  : null;

// Só manda voice_settings se o chamador pediu algum ajuste; sem isso a conta
// aplica o padrão da voz, que é o que gerou os vídeos já aprovados.
const num = (nome) => (flag(nome) === null ? null : Number(flag(nome)));
const ajustes =
  num("stability") === null && num("style") === null && num("similarity") === null
    ? null
    : {
        stability: num("stability") ?? 0.5,
        similarity_boost: num("similarity") ?? 0.85,
        style: num("style") ?? 0,
        use_speaker_boost: true,
      };

if (!voz) morrer("--voice é obrigatório.");
if (!existsSync(scriptPath)) morrer(`SCRIPT.md não encontrado em ${scriptPath}`);

const linhas = lerScript(readFileSync(scriptPath, "utf8"));
if (!linhas.length) morrer("nenhuma fala encontrada no SCRIPT.md");

console.log(`Voz ${voz} · modelo ${modelo} · ${linhas.length} linha(s)`);

const dirVoz = join(proj, "assets", "voice");
mkdirSync(dirVoz, { recursive: true });

// Quando só algumas linhas são regeradas, as demais vêm do meta anterior.
const anteriorMeta = existsSync(neutroPath) ? JSON.parse(readFileSync(neutroPath, "utf8")) : {};
const vozAnterior = new Map((anteriorMeta.voices ?? []).map((v) => [v.id, v]));

const vozes = [];
for (const [i, { frame, text }] of linhas.entries()) {
  const id = pad2(frame);
  const rel = `assets/voice/${id}.wav`;
  const wav = join(proj, rel);
  const mp3Tmp = join(dirVoz, `.${id}.mp3`);

  if (soFrames && !soFrames.has(frame)) {
    const guardada = vozAnterior.get(id);
    if (!guardada) morrer(`--frames pulou o frame ${id}, mas não há voz anterior dele em ${neutroPath}`);
    vozes.push(guardada);
    console.log(`  ${id}: mantida (${guardada.duration_s}s)`);
    continue;
  }

  let r;
  try {
    r = await sintetizar({
      texto: text,
      voz,
      modelo,
      chave,
      anterior: semContexto ? null : (linhas[i - 1]?.text ?? null),
      proximo: semContexto ? null : (linhas[i + 1]?.text ?? null),
      ajustes,
    });
  } catch (e) {
    morrer(`linha ${id}: ${e.message}`);
  }

  writeFileSync(mp3Tmp, r.mp3);
  // 44,1 kHz mono é o que o restante do pipeline espera (o motor da skill
  // transcodifica igual), e o ffprobe da montagem lê a duração daqui.
  execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", mp3Tmp, "-ar", "44100", "-ac", "1", wav]);
  rmSync(mp3Tmp, { force: true });

  const dur = duracaoSegundos(wav);
  vozes.push({ id, path: rel, duration_s: dur, words: r.words });
  console.log(`  ${id}: ${dur}s · ${r.words.length} palavra(s) · ${text.slice(0, 48)}…`);
}

// Preserva o que o motor da skill já tenha escrito (SFX, BGM) — este script
// manda só na voz.
const neutro = existsSync(neutroPath) ? JSON.parse(readFileSync(neutroPath, "utf8")) : {};
const atualizado = {
  ...neutro,
  tts_provider: "elevenlabs",
  voice_id: voz,
  voice_settings: ajustes,
  voices: vozes,
  total_duration_s: Number(vozes.reduce((s, v) => s + v.duration_s, 0).toFixed(3)),
};
writeFileSync(neutroPath, JSON.stringify(atualizado, null, 2));
writeFileSync(outPath, JSON.stringify(paraMetaDaSkill(atualizado), null, 2));

console.log(`✔ ${vozes.length} faixa(s) · ${atualizado.total_duration_s}s de narração`);
console.log(`  ${neutroPath}`);
console.log(`  ${outPath}`);
