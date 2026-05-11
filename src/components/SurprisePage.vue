<template>
  <div class="surprise-page" :style="surprisePageBgStyle" @click="handlePageClick">

    <canvas ref="flowerCanvas" class="canvas-layer canvas--flowers" aria-hidden="true"></canvas>
    <canvas ref="particleCanvas" class="canvas-layer canvas--particles" aria-hidden="true"></canvas>

    <div class="floaters" aria-hidden="true">
      <span v-for="f in floaters" :key="f.id" class="floater" :style="f.style">{{ f.emoji }}</span>
    </div>

    <div class="flowers" aria-hidden="true">
      <div v-for="fl in flowers" :key="fl.id" class="flower" :style="fl.style">
        <div class="flower__petals">
          <div v-for="p in 8" :key="p" class="flower__petal" :style="{ '--i': p, '--hue': fl.hue }"></div>
        </div>
        <div class="flower__center"></div>
      </div>
    </div>

    <div class="glass-card" role="main" :class="{ 'card--visible': cardVisible }">

      <h1 class="birthday-heading" aria-label="Happy Birthday">
        <span v-for="(letter, i) in birthdayLetters" :key="i"
              class="birthday-heading__letter"
              :style="{ animationDelay: `${i * 0.07}s` }">{{ letter }}</span>
      </h1>

      <div class="divider"></div>

      <p class="typed-message" aria-live="polite">{{ displayedMessage }}<span class="cursor" :class="{ 'cursor--hidden': typingDone }">|</span></p>

      <div class="btn-row">
        <button class="btn btn--primary" @click.stop="openGallery" aria-label="Open photo memories">
          📸 Our Memories
        </button>
        <button class="btn btn--secondary" @click.stop="toggleMusic" :aria-label="musicPlaying ? 'Pause music' : 'Play music'">
          {{ musicPlaying ? '🔇 Pause' : '🎵 Play Music' }}
        </button>
      </div>

      <p class="click-hint" v-if="!galleryOpen">Click anywhere for more magic ✨</p>
    </div>

    <Transition name="gallery-pop">
      <div v-if="galleryOpen" class="gallery-overlay" role="dialog" aria-modal="true" aria-label="Photo memories" @click.self="galleryOpen = false">
        <div class="gallery-modal">
          <button class="gallery-close" @click="galleryOpen = false" aria-label="Close gallery">✕</button>
          <h2 class="gallery-title">Our Beautiful Moments 💕</h2>
          <div class="gallery-grid">
            <div v-for="photo in photos" :key="photo.id" class="gallery-item"
                 :style="{ background: photo.gradient }"
                 @mouseenter="photo.hovered = true"
                 @mouseleave="photo.hovered = false">
              <div class="gallery-item__label">{{ photo.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <audio ref="audioEl" loop preload="auto">
      <!-- <source src="/music/birthday-song.mp3" type="audio/mpeg" /> -->
    </audio>

  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'

const BIRTHDAY_MSG = `Wishing you a day as beautiful as your smile,\nas warm as your heart, and as magical as you make every moment feel.\nHappy Birthday, my love. 🌸`

/** Matches BirthdaySurprise.vue “rose daylight” look; pick another key or `custom` to override */
const SURPRISE_BACKGROUND_KEY = 'rose-daylight'
const CUSTOM_SURPRISE_BACKGROUND = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%)'

const SURPRISE_BACKGROUNDS = {
  'rose-daylight': `linear-gradient(135deg,
    #ffe0ec 0%,
    #ffc2d9 20%,
    #ffaacf 40%,
    #ff8ec2 55%,
    #f472b6 70%,
    #ec4899 85%,
    #db2777 100%)`,
  'purple-dream': `linear-gradient(135deg,
    #1a0533 0%,
    #2d0b4e 20%,
    #4a0e6e 40%,
    #6b1f8c 55%,
    #9b2d8f 70%,
    #c44d8d 85%,
    #e8729f 100%)`,
  'sunset-blush': 'linear-gradient(145deg, #2d1b4e 0%, #7c2d12 35%, #ea580c 55%, #f472b6 78%, #fda4af 100%)',
  'ocean-glow': 'linear-gradient(160deg, #020617 0%, #0c4a6e 40%, #0369a1 65%, #38bdf8 90%, #7dd3fc 100%)',
  'emerald-night': 'linear-gradient(135deg, #022c22 0%, #064e3b 35%, #047857 65%, #34d399 100%)',
  'champagne-rose': 'linear-gradient(135deg, #1c1917 0%, #44403c 25%, #9f1239 55%, #fda4af 85%, #ffe4e6 100%)',
  'midnight-stars': 'linear-gradient(180deg, #020617 0%, #0f172a 45%, #1e1b4b 75%, #312e81 100%)',
  'custom': null,
}

const surprisePageBgStyle = computed(() => {
  const key = SURPRISE_BACKGROUND_KEY in SURPRISE_BACKGROUNDS ? SURPRISE_BACKGROUND_KEY : 'rose-daylight'
  const bg =
    key === 'custom'
      ? CUSTOM_SURPRISE_BACKGROUND
      : (SURPRISE_BACKGROUNDS[key] ?? SURPRISE_BACKGROUNDS['rose-daylight'])
  return { background: bg }
})

const HEADING_TEXT = 'Happy Birthday Mai! 🎂'
/** `split('')` breaks emoji into broken surrogate halves — iterate code points instead */
const birthdayLetters = Array.from(HEADING_TEXT).map(c => (c === ' ' ? '\u00A0' : c))

const cardVisible = ref(false)
const galleryOpen = ref(false)
const musicPlaying = ref(false)
const audioEl = ref(null)
const flowerCanvas = ref(null)
const particleCanvas = ref(null)

const displayedMessage = ref('')
const typingDone = ref(false)

function startTyping () {
  let i = 0
  typingDone.value = false
  displayedMessage.value = ''
  const chars = Array.from(BIRTHDAY_MSG)
  const id = setInterval(() => {
    if (i < chars.length) {
      displayedMessage.value += chars[i++]
    } else {
      clearInterval(id)
      typingDone.value = true
    }
  }, 38)
}

const FLOATER_EMOJIS = ['💕', '✨', '🌸', '💫', '🌷', '🎀', '💖', '⭐', '🌺', '🦋', '🌼', '💝']
const floaters = ref([])

function spawnFloaters () {
  floaters.value = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    emoji: FLOATER_EMOJIS[i % FLOATER_EMOJIS.length],
    style: {
      left: `${Math.random() * 100}%`,
      animationDuration: `${4 + Math.random() * 8}s`,
      animationDelay: `${Math.random() * 5}s`,
      fontSize: `${0.9 + Math.random() * 1.6}rem`,
      opacity: 0.75 + Math.random() * 0.25,
    },
  }))
}

const flowers = ref([])

function spawnFlowers () {
  flowers.value = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    hue: 300 + Math.round(Math.random() * 80),
    style: {
      left: `${5 + Math.random() * 90}%`,
      top: `${5 + Math.random() * 85}%`,
      animationDelay: `${i * 0.35}s`,
      '--scale': 0.5 + Math.random() * 0.9,
    },
  }))
}

const photos = ref([
  { id: 1, label: 'First day together 🌅', gradient: 'linear-gradient(135deg,#f9c6c6,#f0a0c8)', hovered: false },
  { id: 2, label: 'Beach trip 🏖️', gradient: 'linear-gradient(135deg,#c6e0f9,#a0c8f0)', hovered: false },
  { id: 3, label: 'Birthday last year 🎂', gradient: 'linear-gradient(135deg,#f9f0c6,#f0d8a0)', hovered: false },
  { id: 4, label: 'Park picnic 🌿', gradient: 'linear-gradient(135deg,#c6f9d4,#a0f0bc)', hovered: false },
  { id: 5, label: 'Stargazing night 🌙', gradient: 'linear-gradient(135deg,#d4c6f9,#c0a0f0)', hovered: false },
  { id: 6, label: 'New Year\'s Eve 🎆', gradient: 'linear-gradient(135deg,#f9c6e8,#f0a0d4)', hovered: false },
])

let flCtx, flAnim, flPetals = []

const PETAL_COLORS = [
  'hsla(340,90%,78%,',
  'hsla(320,70%,82%,',
  'hsla(350,80%,88%,',
  'hsla(300,60%,85%,',
  'hsla(355,100%,93%,',
  'hsla(330,85%,75%,',
]

function makePetal (x, y, burst = false) {
  const angle = Math.random() * Math.PI * 2
  const speed = burst ? 2 + Math.random() * 5 : 0.4 + Math.random() * 1.2
  return {
    x, y,
    vx: Math.cos(angle) * speed * (burst ? 1 : 0.3) + (Math.random() - 0.5) * 0.6,
    vy: burst ? Math.sin(angle) * speed : 0.8 + Math.random() * 1.4,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.06,
    sway: Math.random() * 0.03,
    swayOffset: Math.random() * Math.PI * 2,
    size: burst ? 6 + Math.random() * 10 : 8 + Math.random() * 14,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    alpha: 0.7 + Math.random() * 0.3,
    decay: burst ? 0.018 + Math.random() * 0.012 : 0,
    age: 0,
  }
}

function drawPetal (ctx, p) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)
  ctx.globalAlpha = Math.max(0, p.alpha)
  ctx.beginPath()
  ctx.ellipse(0, 0, p.size * 0.45, p.size, 0, 0, Math.PI * 2)
  ctx.fillStyle = p.color + p.alpha + ')'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, -p.size * 0.8)
  ctx.lineTo(0, p.size * 0.8)
  ctx.strokeStyle = p.color + (p.alpha * 0.25) + ')'
  ctx.lineWidth = 0.7
  ctx.stroke()
  ctx.restore()
}

function launchFlowers () {
  const canvas = flowerCanvas.value
  if (!canvas) return
  flCtx = canvas.getContext('2d')
  resizeCanvas(canvas)

  for (let i = 0; i < 55; i++) {
    const p = makePetal(Math.random() * canvas.width, Math.random() * canvas.height)
    p.age = Math.random() * 200
    flPetals.push(p)
  }

  const spawnTimer = setInterval(() => {
    if (document.hidden) return
    for (let i = 0; i < 3; i++) {
      flPetals.push(makePetal(Math.random() * canvas.width, -20))
    }
  }, 600)

  function drawFL () {
    flCtx.clearRect(0, 0, canvas.width, canvas.height)

    flPetals.forEach(p => {
      p.age++
      p.x += p.vx + Math.sin(p.age * p.sway + p.swayOffset) * 0.5
      p.y += p.vy
      p.rotation += p.rotSpeed
      if (p.decay) p.alpha -= p.decay
      drawPetal(flCtx, p)
    })

    flPetals = flPetals.filter(p =>
      p.y < canvas.height + 30 && p.x > -30 && p.x < canvas.width + 30 && p.alpha > 0,
    )

    flAnim = requestAnimationFrame(drawFL)
  }
  drawFL()

  onUnmounted(() => { clearInterval(spawnTimer); cancelAnimationFrame(flAnim) })
}

let ptCtx, ptAnim, ptList = []

function launchParticles () {
  const canvas = particleCanvas.value
  if (!canvas) return
  ptCtx = canvas.getContext('2d')
  resizeCanvas(canvas)

  ptList = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 1 + Math.random() * 3,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -(0.3 + Math.random() * 0.5),
    alpha: 0.2 + Math.random() * 0.6,
    hue: 300 + Math.random() * 80,
  }))

  function drawPT () {
    ptCtx.clearRect(0, 0, canvas.width, canvas.height)
    ptList.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
      ptCtx.beginPath()
      ptCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ptCtx.fillStyle = `hsla(${p.hue},80%,75%,${p.alpha})`
      ptCtx.fill()
    })
    ptAnim = requestAnimationFrame(drawPT)
  }
  drawPT()
  onUnmounted(() => cancelAnimationFrame(ptAnim))
}

function resizeCanvas (canvas) {
  canvas.width = canvas.offsetWidth || window.innerWidth
  canvas.height = canvas.offsetHeight || window.innerHeight
}

function toggleMusic () {
  const audio = audioEl.value
  if (!audio) return
  if (musicPlaying.value) {
    audio.pause()
    musicPlaying.value = false
  } else {
    audio.play().catch(() => {})
    musicPlaying.value = true
  }
}

function tryAutoplayMusic () {
  const audio = audioEl.value
  if (!audio) return
  audio.play().then(() => { musicPlaying.value = true }).catch(() => {})
}

function handlePageClick (e) {
  if (galleryOpen.value) return
  if (!flCtx) return
  const rect = flowerCanvas.value.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  for (let i = 0; i < 22; i++) {
    flPetals.push(makePetal(cx, cy, true))
  }
}

function openGallery () { galleryOpen.value = true }

onMounted(async () => {
  await nextTick()
  spawnFloaters()
  spawnFlowers()
  launchFlowers()
  launchParticles()
  tryAutoplayMusic()
  setTimeout(() => {
    cardVisible.value = true
    setTimeout(startTyping, 900)
  }, 400)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Cormorant+Garamond:wght@300;400;600&display=swap');

.surprise-page {
  position: relative; width: 100%; min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  cursor: crosshair;
}

.canvas-layer {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}
.canvas--flowers { z-index: 1; }
.canvas--particles { z-index: 2; }

.floaters { position: absolute; inset: 0; z-index: 3; pointer-events: none; overflow: hidden; }
.floater {
  position: absolute;
  bottom: -2rem;
  animation: floatUp linear infinite;
  will-change: transform;
}
@keyframes floatUp {
  0%   { transform: translateY(0)   rotate(0deg);   opacity: 1; }
  80%  { opacity: .8; }
  100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
}

.flowers { position: absolute; inset: 0; z-index: 4; pointer-events: none; overflow: hidden; }

.flower {
  position: absolute;
  transform: scale(0) translate(-50%, -50%);
  transform-origin: center;
  animation: bloomIn .9s cubic-bezier(.34,1.56,.64,1) forwards;
  --scale: 1;
}
@keyframes bloomIn {
  to { transform: scale(var(--scale)) translate(-50%,-50%); }
}

.flower__petals {
  position: relative; width: 60px; height: 60px;
}
.flower__petal {
  position: absolute; width: 100%; height: 100%;
  transform: rotate(calc(var(--i) * 45deg));
}
.flower__petal::before {
  content: '';
  position: absolute; top: 0; left: 50%;
  transform: translateX(-50%);
  width: 22px; height: 28px;
  background: radial-gradient(ellipse at 50% 30%,
    hsl(var(--hue),80%,75%) 0%,
    hsl(var(--hue),70%,55%) 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  opacity: .88;
}
.flower__center {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 16px; height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8a0 0%, #f0c060 100%);
  box-shadow: 0 0 6px 3px rgba(255,240,100,.5);
  z-index: 1;
}

.glass-card {
  position: relative; z-index: 10;
  background: rgba(255,255,255,.45);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255,255,255,.65);
  border-radius: 28px;
  padding: clamp(2rem,6vw,3.5rem) clamp(1.5rem,6vw,3.5rem);
  max-width: min(700px, 92vw);
  width: 100%;
  text-align: center;
  box-shadow:
    0 8px 32px rgba(0,0,0,.35),
    inset 0 1px 0 rgba(255,255,255,.25);
  opacity: 0;
  transform: translateY(40px) scale(.96);
  transition: opacity .8s ease, transform .8s cubic-bezier(.34,1.2,.64,1);
}
.glass-card.card--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.birthday-heading {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 7vw, 3.6rem);
  font-weight: 900;
  line-height: 1.15;
  color: #7c0049;
  text-shadow: 0 2px 24px rgba(255,100,160,.4), 0 0 60px rgba(220,50,120,.2);
  letter-spacing: .03em;
}
.birthday-heading__letter {
  display: inline-block;
  animation: letterBounce .6s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes letterBounce {
  0%   { opacity: 0; transform: translateY(-30px) rotate(-8deg) scale(.7); }
  100% { opacity: 1; transform: translateY(0)     rotate(0deg)  scale(1); }
}

.divider {
  width: 80px; height: 2px; margin: 1.25rem auto;
  background: linear-gradient(90deg, transparent, rgba(255,200,220,.7), transparent);
}

.typed-message {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 300;
  color: #6b1a3a;
  line-height: 1.75;
  white-space: pre-line;
  min-height: 5em;
  text-align: left;
}
.cursor {
  display: inline-block;
  width: 2px; height: 1.1em;
  background: rgba(255,200,220,.9);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink .8s step-end infinite;
}
.cursor--hidden { opacity: 0; }
@keyframes blink { 50% { opacity: 0; } }

.btn-row {
  display: flex; flex-wrap: wrap; gap: .75rem;
  justify-content: center; margin-top: 1.75rem;
}
.btn {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.05rem; font-weight: 600;
  padding: .7rem 1.6rem;
  border-radius: 50px; cursor: pointer; border: none;
  transition: transform .2s, box-shadow .2s, opacity .2s;
  letter-spacing: .04em;
}
.btn:hover   { transform: translateY(-2px) scale(1.04); }
.btn:active  { transform: scale(.97); }
.btn--primary {
  background: linear-gradient(135deg, #f9a8d4, #e879a0, #c026d3);
  color: #fff;
  box-shadow: 0 4px 20px rgba(200,30,180,.45);
}
.btn--secondary {
  background: rgba(255,255,255,.55);
  color: #7c0049;
  border: 1px solid rgba(200,50,100,.3);
  box-shadow: 0 2px 12px rgba(0,0,0,.1);
}

.click-hint {
  font-family: system-ui, sans-serif;
  font-size: .72rem; color: rgba(120,0,60,.45);
  margin-top: 1.5rem; letter-spacing: .06em;
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }

.gallery-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(100,0,40,.55);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.gallery-modal {
  background: rgba(255,230,240,.90);
  border: 1px solid rgba(255,255,255,.5);
  border-radius: 24px;
  padding: 2rem;
  max-width: 720px; width: 100%;
  max-height: 90vh; overflow-y: auto;
  position: relative;
  box-shadow: 0 16px 60px rgba(0,0,0,.3);
}
.gallery-close {
  position: absolute; top: 1rem; right: 1.25rem;
  background: rgba(200,50,100,.15); border: none;
  color: #7c0049; font-size: 1.1rem; width: 32px; height: 32px;
  border-radius: 50%; cursor: pointer; line-height: 1;
  transition: background .2s;
}
.gallery-close:hover { background: rgba(200,50,100,.28); }
.gallery-title {
  font-family: 'Playfair Display',serif;
  font-size: 1.5rem; color: #7c0049; text-align: center;
  margin-bottom: 1.5rem;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
.gallery-item {
  border-radius: 16px; aspect-ratio: 1;
  display: flex; align-items: flex-end;
  overflow: hidden; position: relative;
  cursor: pointer;
  transition: transform .25s, box-shadow .25s;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
}
.gallery-item:hover { transform: scale(1.04); box-shadow: 0 8px 28px rgba(0,0,0,.5); }
.gallery-item__label {
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(4px);
  color: #fff; font-size: .75rem; padding: .5rem .75rem;
  width: 100%; font-family: system-ui, sans-serif;
}

.gallery-pop-enter-active { transition: opacity .3s ease, transform .35s cubic-bezier(.34,1.4,.64,1); }
.gallery-pop-leave-active { transition: opacity .25s ease, transform .25s ease; }
.gallery-pop-enter-from, .gallery-pop-leave-to { opacity: 0; transform: scale(.92); }

@media (max-width: 480px) {
  .birthday-heading { letter-spacing: 0; }
  .btn-row { flex-direction: column; align-items: stretch; }
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
