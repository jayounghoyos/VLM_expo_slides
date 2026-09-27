---
theme: default
title: Del Píxel a la Palabra
titleTemplate: '%s'
author: jayounghoyos
info: |
  Del Píxel a la Palabra: una introducción animada a los modelos de visión y
  lenguaje (VLM). Inteligencia Artificial, EAFIT.
routeAlias: title
layout: scene
colorSchema: dark
aspectRatio: 16/9
canvasWidth: 980
routerMode: hash
mdc: true
selectable: false
# LEFT is the deck's current: every ordinary boundary uses it, and pressing
# left genuinely reverses. UP (rise-up) is reserved for chapter openers.
transition: cut-left | cut-right
# Google's font CDN is resolved by the BROWSER at runtime, which is how an
# "offline" deck fails in a classroom. Fonts are npm packages (styles/index.ts).
fonts:
  provider: none
  sans: 'Instrument Sans Variable'
  mono: 'Geist Mono Variable'
drawings:
  persist: false
---

<Scene name="title" />

<!--
APERTURA (30 s). Deja que el título termine solo antes de hablar.

"Hoy les voy a mostrar cómo un modelo de lenguaje aprendió a ver. Fíjense en
lo que acaba de pasar: una foto se volvió cuadritos, los cuadritos se volvieron
tokens, y salieron palabras. Esa es toda la charla."
-->

---
layout: scene
routeAlias: hook
clicks: 2
---

<Scene name="hook" />

<!--
GANCHO (1 min). La misma pregunta, dos veces.

Click 1: "Le pregunto a un LLM normal. No puede: para él la imagen no existe,
solo recibe texto."
Click 2: "Le pregunto a un VLM. Responde, y bien." Deja leer el remate:
"Un LLM leyó todo internet, pero nunca vio una taza. ¿Cómo le damos ojos?"
-->

---
layout: scene
routeAlias: ch-see
transition: rise-up
---

<Scene name="chapter" v="see" />

<!-- TRANSICIÓN (10 s). "Primero: ¿cómo ve una máquina?" -->

---
layout: scene
routeAlias: patches
clicks: 3
---

<Scene name="patches" />

<!--
PARCHES / ViT (1 min 15 s). LA idea base de toda la charla.

Click 1: "Cortamos la imagen de 224 píxeles en cuadritos de 16. Salen 196."
Click 2: "Y los ponemos en fila. Una imagen es una frase de 196 palabras."
Click 3: "Cada parche lleva su posición y se vuelve un vector de números. Desde
aquí el transformer es exactamente el mismo de ChatGPT."
-->

---
layout: scene
routeAlias: clip
clicks: 3
---

<Scene name="clip" />

<!--
CLIP (1 min 30 s). Cómo se aprende a ver sin etiquetas.

Click 1: "Muestras imágenes y textos. El entrenamiento acerca cada imagen a
SU texto y la aleja de los demás. La diagonal es lo que queremos."
Click 2: "400 millones de pares sacados de internet. Nadie etiquetó nada a mano."
Click 3: "Y el premio: le das una foto nueva, la comparas con frases, y gana
la correcta. 76,2 % en ImageNet sin ver una sola de sus etiquetas."
-->

---
layout: scene
routeAlias: ch-bridge
transition: rise-up
---

<Scene name="chapter" v="bridge" />

<!-- TRANSICIÓN (10 s). "Ya tenemos ojos. Ahora hay que conectarlos al cerebro." -->

---
layout: scene
routeAlias: projector
clicks: 3
transition: arrive
---

<Scene name="projector" />

<!--
EL PROYECTOR / LLaVA (1 min 15 s). La diapositiva central. Ve lento.

Click 1: "El codificador de visión produce vectores. Un MLP chiquito los
traduce al espacio de palabras del LLM."
Click 2: "Se pegan antes de tu pregunta. Una sola frase: 576 tokens de imagen
y luego tus palabras."
Click 3: "Y el LLM responde como siempre. Para él, la imagen es un idioma nuevo."
-->

---
layout: scene
routeAlias: bridges
clicks: 3
---

<Scene name="bridges" />

<!--
TRES PUENTES (1 min). Si vas tarde, sáltala: es la segunda en la lista de corte.

Click 1: "El proyector: todo entra. Es lo que usa LLaVA, y la mayoría hoy."
Click 2: "El Q-Former: 32 consultas leen la imagen y solo ellas entran."
Click 3: "Flamingo: el LLM congelado mira la imagen desde adentro, en cada capa,
con atención cruzada."
-->

---
layout: scene
routeAlias: answer
clicks: 3
---

<Scene name="answer" />

<!--
CÓMO RESPONDE (1 min 15 s).

Click 1: "La palabra 'tazas' mira toda la imagen, y el peso cae donde están
las tazas. Así 'encuentra' cosas: no dibuja cajas, atiende."
Click 2: "La respuesta sale palabra por palabra, y cada una vuelve a entrar."
Click 3: "La máscara: imagen y pregunta se ven completas; la respuesta solo
mira hacia atrás. Mismo transformer, otras reglas."
-->

---
layout: scene
routeAlias: training
clicks: 2
---

<Scene name="training" />

<!--
ENTRENAMIENTO (1 min).

Click 1: "Etapa 1: todo congelado menos el proyector. Pares imagen-texto,
unas horas. Solo aprende a traducir."
Click 2: "Etapa 2: se descongela el LLM y aprende a seguir instrucciones.
Dato curioso: esas conversaciones las escribió GPT-4 leyendo solo texto."
El ojo nunca se entrena.
-->

---
layout: scene
routeAlias: token-budget
clicks: 3
---

<Scene name="tokenBudget" />

<!--
PRESUPUESTO DE TOKENS (1 min). Primera en la lista de corte.

Click 1: "Más resolución, más tokens: 576."
Click 2: "El doble de lado son cuatro veces los tokens. Y la atención cuesta
el cuadrado."
Click 3: "El truco de SmolVLM: dobla cada bloque de 4 × 4 en un token. 16
veces menos. Un modelo de 256 millones que le gana a uno 300 veces más grande."
-->

---
layout: scene
routeAlias: ch-next
transition: rise-up
---

<Scene name="chapter" v="next" />

<!-- TRANSICIÓN (10 s). "Antes de seguir: no todo es tan bonito." -->

---
layout: scene
routeAlias: limits
clicks: 3
---

<Scene name="limits" />

<!--
LÍMITES (1 min). Aquí salen las mejores preguntas.

Click 1: "Alucina: si hay tazas, 'debe' haber un tenedor."
Click 2: "No distingue: una foto y su espejo son casi iguales para CLIP."
Click 3: "No cuenta: siete tazas, dice cinco. En estas preguntas un humano
acierta casi siempre."
Aclara: los ejemplos son ilustrativos; los fallos son los de los papers.
-->

---
layout: scene
routeAlias: ch-act
transition: rise-up
---

<Scene name="chapter" v="act" />

<!--
TRANSICIÓN (10 s). "Todo lo que vimos termina en palabras. ¿Y si la respuesta
fuera un movimiento?"
-->

---
layout: scene
routeAlias: vla-same
clicks: 3
transition: arrive
---

<Scene name="sameModel" />

<!--
MISMO MODELO (1 min). La bisagra de la charla. Que reconozcan la máquina.

Llegada: "¿Se acuerdan? Es exactamente el mismo diagrama de antes."
Click 1: "Cambio una sola cosa a la entrada: en vez de una pregunta, una orden."
Click 2: "Y a la salida... siguen siendo tokens. Pero ya no son palabras."
Click 3: "Cada token es un número: cuánto moverse en x, y, z, cuánto girar, y
la pinza. Para el modelo, una acción es una frase más."
-->

---
layout: scene
routeAlias: action-tokens
clicks: 3
---

<Scene name="actionTokens" />

<!--
UN MOVIMIENTO EN TOKENS (1 min 15 s). El cómo, sin fórmulas.

Click 1: "Una articulación moviéndose es una curva continua."
Click 2: "La muestreamos y cada valor cae en uno de 256 cajones. Cada cajón,
un token." (OpenVLA pone los cajones entre los percentiles 1 y 99 de los datos.)
Click 3: "¿Y de dónde salen esos tokens? Se toman las 256 palabras que el LLM
casi nunca usa y se les da un significado nuevo. El LLM ahora tiene palabras
para moverse."
Si preguntan: los modelos nuevos (π0, SmolVLA) no usan cajones, generan la
trayectoria continua con un "experto de acción".
-->

---
layout: scene
routeAlias: vla-loop
clicks: 3
---

<Scene name="vlaLoop" />

<!--
EL CICLO (1 min 15 s). Puente directo al demo.

Llegada: "Esto no pasa una vez: la cámara ve, el modelo decide, el brazo se
mueve, y la cámara ve el resultado."
Click 1: deja correr el brazo. "OpenVLA hace esto unas seis veces por segundo."
Click 2: "¿Y por qué partir de un VLM? Porque hereda lo que aprendió de la
web. En RT-2 le preguntan qué sirve de martillo improvisado, y elige la
piedra. Nadie le enseñó eso con datos de robot."
Click 3: "RT-2, OpenVLA, SmolVLA: todos son un VLM por dentro. Un VLA es un
VLM que aprendió a mover en vez de hablar." Y pasas al demo.
-->

---
layout: split
routeAlias: demo-mujoco
ratio: 1fr 1fr
clicks: 1
---

::left::

# {{ $t('demo.title') }}

<p class="demo__lead">{{ $t('demo.lead') }}</p>

<div v-click="1" class="demo__watch">
  <div class="demo__item"><span class="demo__n">01</span><span>{{ $t('demo.watch1') }}</span></div>
  <div class="demo__item"><span class="demo__n">02</span><span>{{ $t('demo.watch2') }}</span></div>
  <div class="demo__item"><span class="demo__n">03</span><span>{{ $t('demo.watch3') }}</span></div>
</div>

<div class="demo__switch"><kbd>Alt</kbd> + <kbd>Tab</kbd> <span>{{ $t('demo.switch') }}</span></div>

::right::

<div class="demo__stage">
  <div class="demo__brand">Mu<span>JoCo</span></div>
  <div class="demo__meta">{{ $t('demo.meta') }}</div>

```bash
# TODO: el comando real del demo
python demo.py \
  --model HuggingFaceTB/SmolVLM2-2.2B-Instruct \
  --scene scenes/mesa.xml
```

</div>

<!--
DEMO EN MUJOCO (2 min 30 s). Placeholder: edita el texto en locales/*.yml y el
comando aquí arriba.

1. Click: muestra qué mirar.
2. Alt+Tab a la app de MuJoCo. Deja que el demo hable; narra poco.
3. Vuelve con Alt+Tab y avanza.

Si falla: una vez más, y si no, sigue. "Por esto existe la diapositiva de límites."
-->

---
layout: scene
routeAlias: thanks
---

<div class="thanks">
  <div class="thanks__words">
    <h1 class="thanks__big"><span>Gracias</span><span class="c-gen">Thank you</span></h1>
    <p class="thanks__q">{{ $t('thanks.questions') }}</p>
    <p class="thanks__contact t-mono">github.com/jayounghoyos</p>
  </div>
  <QrCard url="https://github.com/jayounghoyos/VLM_expo_slides" :label="$t('thanks.qr')" sub="github.com/jayounghoyos/VLM_expo_slides" :size="230" />
</div>

<!--
CIERRE. "Gracias." Y punto. Deja esta diapositiva durante las preguntas.
El QR lleva al repo: github.com/jayounghoyos/VLM_expo_slides.
-->

---
layout: viz
routeAlias: references
---

# {{ $t('refs.title') }}

<div class="viz-fill">
  <References />
</div>

<!-- REFERENCIAS. No se presenta; está para quien descargue las diapositivas. -->
