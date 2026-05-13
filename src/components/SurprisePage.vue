<template>
  <div class="birthday-page" @click="spawnFlower">

    <audio
      ref="bgAudio"
      class="bg-music"
      playsinline
      preload="auto"
      :src="BACKGROUND_MUSIC_SRC"
      aria-hidden="true"
      @ended="onBackgroundMusicEnded"
    />

    <!-- Note Modal -->
    <NoteCard :show="showNoteModal" @close="showNoteModal = false" />

    <div class="sakura-layer">
      <div
        v-for="p in petals"
        :key="'p' + p.id"
        class="sakura-petal"
        :style="{
          left: p.x + '%',
          animationDuration: p.dur + 's',
          animationDelay: p.delay + 's',
          '--sway': p.sway + 'px',
          '--rot': p.rot + 'deg',
          '--scale': p.scale,
          '--hue': p.hue,
          '--opacity': p.opacity,
        }"
      >
        <svg :width="p.size" :height="p.size" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(15,15)">
            <ellipse
              v-for="n in 5"
              :key="'o' + n"
              :transform="`rotate(${n * 72}) translate(0,-8)`"
              rx="4.5"
              ry="8.5"
              :fill="`hsl(${p.hue}, 88%, 87%)`"
            />
            <ellipse
              v-for="n in 5"
              :key="'i' + n"
              :transform="`rotate(${n * 72 + 36}) translate(0,-5.5)`"
              rx="2.8"
              ry="5.5"
              :fill="`hsl(${p.hue + 12}, 90%, 93%)`"
              opacity="0.7"
            />
            <circle r="2.8" :fill="`hsl(${p.hue + 20}, 95%, 97%)`" />
          </g>
        </svg>
      </div>

      <div
        v-for="l in leaves"
        :key="'l' + l.id"
        class="leaf"
        :style="{
          left: l.x + '%',
          animationDuration: l.dur + 's',
          animationDelay: l.delay + 's',
          '--sway': l.sway + 'px',
          '--rot': l.rot + 'deg',
          '--scale': l.scale,
        }"
      >
        <svg :width="l.size" :height="l.size" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 4 C32 10, 36 28, 20 46 C4 28, 8 10, 20 4Z"
            :fill="l.color"
            opacity="0.78"
          />
          <line x1="20" y1="6" x2="20" y2="44" :stroke="l.veinColor" stroke-width="0.9" opacity="0.45" />
          <line x1="20" y1="18" x2="12" y2="26" :stroke="l.veinColor" stroke-width="0.6" opacity="0.35" />
          <line x1="20" y1="24" x2="28" y2="32" :stroke="l.veinColor" stroke-width="0.6" opacity="0.35" />
        </svg>
      </div>
    </div>

    <TransitionGroup name="flower" tag="div" class="flower-layer">
      <div
        v-for="f in flowers"
        :key="f.id"
        class="flower-burst"
        :style="{ left: f.x + 'px', top: f.y + 'px', '--rot': f.rot + 'deg', '--delay': f.delay + 'ms' }"
      >
        <svg :width="f.size" :height="f.size" :viewBox="`0 0 ${f.size} ${f.size}`" xmlns="http://www.w3.org/2000/svg">
          <g :transform="`translate(${f.size / 2},${f.size / 2})`">
            <ellipse
              v-for="n in 5"
              :key="'fo' + n"
              :transform="`rotate(${n * 72}) translate(0, -${f.size * 0.23})`"
              :rx="f.size * 0.12"
              :ry="f.size * 0.22"
              :fill="`hsl(${f.hue}, 82%, 83%)`"
              opacity="0.92"
            />
            <ellipse
              v-for="n in 5"
              :key="'fi' + n"
              :transform="`rotate(${n * 72 + 36}) translate(0, -${f.size * 0.15})`"
              :rx="f.size * 0.07"
              :ry="f.size * 0.13"
              :fill="`hsl(${f.hue + 15}, 88%, 92%)`"
              opacity="0.7"
            />
            <circle :r="f.size * 0.09" :fill="`hsl(${f.hue + 25}, 92%, 97%)`" />
          </g>
        </svg>
        <svg class="sprig" :width="f.size * 0.6" :height="f.size * 0.38" viewBox="0 0 48 26">
          <path d="M10 22 C6 14, 14 8, 18 16" fill="#9ecf9e" opacity="0.88" />
          <path d="M38 22 C42 14, 34 8, 30 16" fill="#85bf85" opacity="0.88" />
        </svg>
      </div>
    </TransitionGroup>

    <div class="card" @click.stop>
      <p class="eyebrow">TODAY IS YOUR SPECIAL DAY!</p>

      <div class="cake-wrap" @click.stop="spawnFlowerNear">
        <div class="cake-glow"></div>
        <img class="cake-img" src="/cake.png" alt="Birthday cake" />
      </div>

      <h1 class="name">{{ displayName }}</h1>
      <p class="hint">click anywhere to see flowers bloom...</p>

      <div class="rule"></div>

      <div class="actions">
        <button type="button" class="btn" @click.stop="showNoteModal = true">Note</button>
        <button type="button" class="btn btn--primary" @click.stop="emit('memories')">Memories</button>
        <button type="button" class="btn" @click.stop="emit('songs')">Songs</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import NoteCard from './NoteCard.vue'

const emit = defineEmits(['memories', 'songs'])

/** File in `public/music/` — change filename to swap track */
const BACKGROUND_MUSIC_SRC = '/music/aboutYou.mp3'

/** Edit this line for the headline */
const displayName = 'Happy Birthday Mai Li San✨'

const bgAudio = ref(null)

const showNoteModal = ref(false)

/** After the background track finishes naturally, do not auto-play it again this session */
let backgroundMusicFinished = false

function onBackgroundMusicEnded () {
  backgroundMusicFinished = true
}

function tryPlayBackground () {
  const el = bgAudio.value
  if (!el || backgroundMusicFinished) return Promise.resolve()
  el.volume = 0.7
  return el.play()
}

let removeUnlockListener = null

function attachUnlockOnGesture () {
  const handler = () => {
    tryPlayBackground().then(() => {
      const el = bgAudio.value
      if (el && !el.paused && removeUnlockListener) {
        removeUnlockListener()
        removeUnlockListener = null
      }
    }).catch(() => {})
  }
  document.addEventListener('pointerdown', handler, { capture: true })
  removeUnlockListener = () => document.removeEventListener('pointerdown', handler, { capture: true })
}

/** True while the Songs panel track is playing — blocks bg resume on tab focus */
let panelTrackIsPlaying = false

function pauseBackgroundMusic () {
  const el = bgAudio.value
  if (el) el.pause()
  panelTrackIsPlaying = true
}

function resumeBackgroundMusic () {
  panelTrackIsPlaying = false
  tryPlayBackground().catch(() => {})
}

function onVisibilityChange () {
  const el = bgAudio.value
  if (!el) return
  if (document.hidden) {
    el.pause()
  } else if (!panelTrackIsPlaying) {
    tryPlayBackground().catch(() => {})
  }
}

const flowers = ref([])
const petals = ref([])
const leaves = ref([])
const nextId = ref(0)

function initPetals () {
  const list = []
  for (let i = 0; i < 45; i++) {
    list.push({
      id: i,
      x: Math.random() * 105,
      size: 16 + Math.random() * 20,
      dur: 8 + Math.random() * 9,
      delay: -(Math.random() * 16),
      sway: 55 + Math.random() * 90,
      rot: Math.random() * 360,
      scale: 0.55 + Math.random() * 0.85,
      hue: 335 + Math.random() * 30,
      opacity: 0.55 + Math.random() * 0.38,
    })
  }
  petals.value = list
}

function initLeaves () {
  const palettes = [
    ['#6db86d', '#3d7a3d'],
    ['#90c878', '#558855'],
    ['#aad89a', '#5a9a5a'],
    ['#c2e8a0', '#72b860'],
    ['#78c878', '#447844'],
  ]
  const list = []
  for (let i = 0; i < 18; i++) {
    const [color, veinColor] = palettes[Math.floor(Math.random() * palettes.length)]
    list.push({
      id: i,
      x: Math.random() * 105,
      size: 24 + Math.random() * 22,
      dur: 10 + Math.random() * 10,
      delay: -(Math.random() * 18),
      sway: 45 + Math.random() * 80,
      rot: Math.random() * 360,
      scale: 0.65 + Math.random() * 0.75,
      color,
      veinColor,
    })
  }
  leaves.value = list
}

function spawnFlower (e) {
  const count = Math.floor(Math.random() * 3) + 3
  for (let i = 0; i < count; i++) {
    const x = e.clientX + (Math.random() - 0.5) * 60
    const y = e.clientY + (Math.random() - 0.5) * 60
    addFlower(x, y, i * 55)
  }
}

function spawnFlowerNear (e) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const r = 75 + Math.random() * 60
    const x = e.clientX + Math.cos(angle) * r
    const y = e.clientY + Math.sin(angle) * r
    addFlower(x, y, i * 65)
  }
}

function addFlower (x, y, delay = 0) {
  const hues = [340, 355, 308, 270, 198, 152, 44]
  const hue = hues[Math.floor(Math.random() * hues.length)]
  const size = 52 + Math.random() * 44
  const id = nextId.value++
  const rot = (Math.random() - 0.5) * 75

  flowers.value.push({ id, x: x - size / 2, y: y - size / 2, hue, size, rot, delay })

  setTimeout(() => {
    flowers.value = flowers.value.filter(f => f.id !== id)
  }, 1700 + delay)
}

onMounted(async () => {
  initPetals()
  initLeaves()
  await nextTick()
  tryPlayBackground().catch(() => {
    attachUnlockOnGesture()
  })
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (removeUnlockListener) removeUnlockListener()
  panelTrackIsPlaying = false
  const el = bgAudio.value
  if (el) {
    el.pause()
    el.currentTime = 0
  }
})

defineExpose({
  pauseBackgroundMusic,
  resumeBackgroundMusic,
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300;1,400&family=Raleway:wght@200;300;400&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.birthday-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: #fdfcf8;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: crosshair;
  font-family: 'Raleway', sans-serif;
}

.bg-music {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.sakura-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.sakura-petal,
.leaf {
  position: absolute;
  top: -70px;
  animation: petalFall linear infinite;
  will-change: transform, opacity;
}

@keyframes petalFall {
  0% {
    top: -70px;
    transform: scale(var(--scale)) rotate(0deg) translateX(0px);
    opacity: 0;
  }
  6%  { opacity: var(--opacity, 0.7); }
  82% { opacity: var(--opacity, 0.7); }
  100% {
    top: 108vh;
    transform: scale(var(--scale)) rotate(calc(var(--rot) + 380deg)) translateX(var(--sway));
    opacity: 0;
  }
}

.flower-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
}

.flower-burst {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sprig { margin-top: -12px; }

.flower-enter-active {
  animation: bloomIn 0.52s cubic-bezier(0.22, 1.55, 0.36, 1) var(--delay, 0ms) both;
}
.flower-leave-active {
  animation: floatUp 1.05s ease-in forwards;
}

@keyframes bloomIn {
  from { opacity: 0; transform: scale(0) rotate(calc(var(--rot) - 55deg)); }
  to   { opacity: 1; transform: scale(1) rotate(var(--rot)); }
}

@keyframes floatUp {
  0%   { opacity: 1; transform: scale(1) rotate(var(--rot)) translateY(0); }
  100% { opacity: 0; transform: scale(0.4) rotate(calc(var(--rot) + 28deg)) translateY(-110px); }
}

.card {
  position: relative;
  z-index: 2;
  background: rgba(253, 252, 249, 0.84);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: 32px;
  border: 0.5px solid #ece5dd;
  padding: 4rem 3.5rem 2.8rem;
  max-width: 620px;
  width: 92%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: default;
}

.eyebrow {
  font-family: 'Raleway', sans-serif;
  font-weight: 200;
  font-size: 10px;
  letter-spacing: 0.34em;
  color: #c4aaa0;
  margin-bottom: 2.4rem;
}

.cake-wrap {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 2.2rem;
}

.cake-img {
  width: 270px;
  height: 270px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  transform-origin: center 85%;
  transition:
    transform 0.5s cubic-bezier(0.34, 1.8, 0.64, 1),
    filter 0.5s ease;
  filter: drop-shadow(0 10px 22px rgba(180,140,120,0.16));
}

.cake-wrap:hover .cake-img {
  transform: scale(1.28) translateY(-16px) rotate(-2.5deg);
  filter: drop-shadow(0 28px 40px rgba(200,140,130,0.3));
}

.cake-glow {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 34px;
  background: radial-gradient(ellipse, rgba(225,185,165,0.22) 0%, transparent 70%);
  border-radius: 50%;
  transition: width 0.5s ease, height 0.5s ease, background 0.5s ease;
  z-index: 0;
}

.cake-wrap:hover .cake-glow {
  width: 220px;
  height: 50px;
  background: radial-gradient(ellipse, rgba(230,160,160,0.32) 0%, transparent 70%);
}

.name {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 300;
  font-size: 38px;
  color: #7a6258;
  letter-spacing: 0.01em;
  line-height: 1.2;
  margin-bottom: 0.6rem;
}

.hint {
  font-family: 'Raleway', sans-serif;
  font-weight: 200;
  font-size: 11px;
  color: #c4aaa0;
  letter-spacing: 0.16em;
  margin-bottom: 2.2rem;
}

.rule {
  width: 40px;
  height: 0.5px;
  background: #ddd0c8;
  margin-bottom: 2.2rem;
}

.actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn {
  font-family: 'Raleway', sans-serif;
  font-weight: 300;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #a89088;
  background: transparent;
  border: 0.5px solid #ddd0c8;
  border-radius: 40px;
  padding: 13px 0;
  flex: 1;
  cursor: pointer;
  transition: background 0.22s, border-color 0.22s, color 0.22s;
}

.btn:hover {
  background: #f5ede8;
  border-color: #c9b0b8;
  color: #7a6258;
}

.btn--primary {
  background: #f5ede9;
  border-color: #dac4bc;
  color: #8a6a60;
}

.btn--primary:hover {
  background: #ede0d8;
}
</style>
