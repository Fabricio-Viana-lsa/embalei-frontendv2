# Diretriz de roteiro — prompt de origem

Este é o pedido original do usuário, salvo **verbatim**, sobre como os roteiros de vídeo de
novidade devem ser escritos. Ele é a fonte da seção "Persona da narração" do
[`BRIEF.template.md`](./BRIEF.template.md), que é a forma operacional da mesma coisa — a que a
skill lê a cada PR.

**Use este arquivo como base ao gerar o roteiro de qualquer vídeo novo.** Quando os dois
divergirem, este aqui manda: o `BRIEF.template.md` é a destilação, este é a intenção.

Registrado em 16/09/2026, depois do vídeo da PR #86, cujo primeiro roteiro foi reprovado
justamente por soar como documentação lida em voz alta.

> **Emenda de 17/09/2026 — o Fausto é só voz.** O personagem **não aparece em tela**: o vídeo é
> a narração dele sobre as telas desenhadas. Tudo o que este arquivo diz sobre a persona, os
> bordões e o jeito de falar continua valendo integralmente; só a presença no quadro saiu.
>
> Isto não contradiz o pedido abaixo, que fala em "fará a narração em áudio enquanto são
> exibidas imagens, vídeos e demonstrações" — a presença em tela foi uma decisão posterior, de
> 16/09/2026, e agora foi revertida. As poses seguem versionadas em
> [`personagem/`](./personagem/) para quando forem pedidas de volta.

---

## O pedido, como foi escrito

> Tenho o seguinte cenário:
>
> Estamos automatizando a criação e atualização da nossa Base de Conhecimento a partir das
> informações e comentários presentes no código das Pull Requests (PRs).
>
> Como parte desse processo, criamos uma skill responsável por gerar um roteiro de
> apresentação da release. Esse conteúdo será apresentado pelo Fausto, avatar interno da
> empresa, que fará a narração em áudio enquanto são exibidas imagens, vídeos e demonstrações
> da funcionalidade atualizada.
>
> O problema é que os textos gerados atualmente estão ficando muito mecânicos, travados e com
> aparência de documentação sendo simplesmente lida em voz alta.
>
> Quero que você revise a forma como esses roteiros são gerados seguindo estas diretrizes:
>
> - O texto deve ser escrito para ser falado, e não para ser lido como documentação técnica.
> - A comunicação do Fausto deve ser fluida, natural, leve e didática, como alguém da empresa
>   explicando rapidamente para outro colaborador o que mudou no sistema e como utilizar a
>   novidade.
> - Evite frases excessivamente formais, estruturas repetitivas, listas narradas e linguagem
>   robótica.
> - Não transforme o roteiro em algo longo. A apresentação deve ser objetiva e proporcional ao
>   tamanho da atualização.
> - Não se afaste das informações originais extraídas da PR. O objetivo é melhorar a
>   comunicação, não inventar funcionalidades, benefícios, regras ou comportamentos que não
>   estejam documentados.
> - Informações técnicas devem ser traduzidas para uma linguagem mais próxima do usuário sempre
>   que isso não alterar o significado da implementação.
> - Priorize uma sequência natural de comunicação, por exemplo: contextualizar rapidamente a
>   novidade → explicar o que mudou → demonstrar como funciona → destacar algum ponto de
>   atenção, quando existir → encerrar.
> - Quando houver imagens ou vídeos acompanhando a narração, o texto deve conversar naturalmente
>   com esses elementos, evitando descrever de forma redundante aquilo que já estará evidente na
>   tela.
> - Os bordões e expressões características do Fausto devem obrigatoriamente ser preservados,
>   pois fazem parte da identidade interna do personagem e da comunicação da empresa.
> - Não deixe todos os roteiros com exatamente a mesma estrutura ou as mesmas frases de abertura
>   e encerramento. O Fausto deve manter sua personalidade, mas a fala precisa parecer natural e
>   adequada a cada release.
>
> **Resultado esperado**
>
> O roteiro final deve transmitir a sensação de que o Fausto está apresentando uma novidade para
> o time, e não lendo uma especificação técnica.
>
> A pessoa que assistir deve conseguir entender rapidamente: O que mudou? Por que isso importa
> para ela? Como funciona na prática? Existe algum cuidado ou nova orientação que ela precisa
> seguir?
>
> Mantenha fidelidade absoluta às informações da PR, mas dê liberdade para reorganizar e
> reescrever o conteúdo para tornar a narração mais humana, dinâmica e agradável.

---

## Uma tensão que o pedido cria, e como ela foi resolvida

Duas diretrizes se contradizem na letra:

- "Os bordões e expressões características do Fausto devem **obrigatoriamente ser preservados**"
- "Não deixe todos os roteiros com **exatamente a mesma estrutura ou as mesmas frases de
  abertura e encerramento**"

**Resolução adotada:** os **três bordões ficam literais e intocados** — são a assinatura pela
qual o time reconhece o personagem. O que não pode se repetir é **tudo ao redor deles**: o
gancho que vem depois da apresentação, o ponto da frase onde a virada cai, a fórmula do
crédito. Assim a identidade sobrevive sem o vídeo virar jingle numa plateia que assiste toda
semana.

Os três, literais:

1. **Apresentação:** "Aqui é o Fausto, sempre no rádio."
2. **Virada:** "Presta atenção no rádio que agora mudou."
3. **Assinatura de fecho:** "Se precisar de alguém com visão de águia, é só me gritar."

Teto de três por vídeo. O quarto vira tique.

---

## Consequências operacionais medidas na PR #86

Coisas que só aparecem quando a diretriz é aplicada de verdade, e que custam retrabalho se
forem esquecidas:

- **Roteiro natural fica mais CURTO, não mais longo.** 175 palavras em 68,9s contra 164 em
  70,5s do roteiro mecânico — e com as pausas caindo em lugares melhores.
- **Trocar o roteiro obriga a conferir o TEXTO EM TELA.** No #86 a manchete do frame 1 e o eco
  do frame 7 citavam a narração antiga e ficaram órfãos. Todo frame que escreve em tela uma
  frase da voz tem de ser revisto junto.
- **Re-ritmo usa as pistas medidas, nunca janela estimada.** Extrair o onset de cada
  palavra-chave de `audio_meta.json` e passar a folha de pistas ao worker do frame. A voz
  clonada não respeita 2,2 palavras/s: no #86 variou de 2,08 a 3,17 entre linhas.
- **A tela segue a fala, não o conforto.** "Estorno, Troca e Devolvido" é dito rápido: as duas
  últimas seções caem a 0,43s uma da outra. Espaçar por estética quebra a sincronia que a
  diretriz pede ("conversar com esses elementos").
- **Ponto de atenção só existe se a PR documentar um.** A diretriz pede o beat "quando
  existir" — não inventar cuidado para preencher a estrutura.
