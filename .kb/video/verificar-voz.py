# Ouve as faixas de voz geradas e procura gagueira do sintetizador.
#
# Existe porque o defeito e invisivel para o resto do pipeline: com `stability`
# baixo a ElevenLabs as vezes devolve audio degenerado ("aqui eu falto, eu falto,
# eu falto"), e o alinhamento que acompanha a resposta continua descrevendo o
# TEXTO DE ENTRADA, nao o audio -- entao legenda, duracao, lint e check passam
# todos, e so quem assiste percebe.
#
# Uso (local, fora do CI; exige faster-whisper num venv):
#   python verificar-voz.py <PROJECT_DIR>
#
# O portao automatico e so a repeticao em sequencia. Whisper erra nome proprio
# ("Fausto" vira "falso"), entao a transcricao impressa serve de leitura humana,
# nunca de veredito sobre a fidelidade ao roteiro.
#
# Conserto quando acusa: node .kb/video/voz-elevenlabs.mjs ... --frames N
#
# Plano e decisoes: base-conhecimento/docs/plano-video-novidades.md
import re, sys, glob, os
from faster_whisper import WhisperModel

d = sys.argv[1]
m = WhisperModel("small", device="cpu", compute_type="int8")
ruim = []
for wav in sorted(glob.glob(os.path.join(d, "assets/voice/*.wav"))):
    segs, _ = m.transcribe(wav, language="pt", vad_filter=False, condition_on_previous_text=False)
    texto = " ".join(s.text.strip() for s in segs)
    pal = re.findall(r"\w+", texto.lower())
    rep = [pal[i] for i in range(len(pal) - 1) if pal[i] == pal[i + 1]]
    par = [f"{pal[i]} {pal[i+1]}" for i in range(len(pal) - 3)
           if (pal[i], pal[i+1]) == (pal[i+2], pal[i+3])]
    marca = "GAGUEIRA" if rep or par else "ok"
    if rep or par:
        ruim.append((os.path.basename(wav), rep + par))
    print(f"--- {os.path.basename(wav)} [{marca}]")
    print(f"    {texto}")
print()
print("FALHAS:", ruim if ruim else "nenhuma")
