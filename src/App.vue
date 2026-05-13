<template>
  <div class="app-root">

    <Transition name="fade-out" @after-leave="surpriseVisible = true">
      <div v-if="!showSurprise" class="countdown-page" role="timer" :aria-label="ariaLabel">
        <p class="label-top">ONLY</p>

        <div class="digits-row">
          <div v-for="(char, i) in digitChars" :key="i" class="digit-tile">
            <span class="digit-tile__char">{{ char }}</span>
          </div>
        </div>

        <p class="label-days">DAYS LEFT</p>

        <div class="hms-row">
          <span class="hms-val">{{ hoursPadded }}</span>
          <span class="hms-sep">:</span>
          <span class="hms-val">{{ minutesPadded }}</span>
          <span class="hms-sep">:</span>
          <span class="hms-val">{{ secondsPadded }}</span>
        </div>
        <p class="hms-label">HOURS · MINUTES · SECONDS</p>
        <p class="tz-note">Your special day is coming soon ✨</p>
      </div>
    </Transition>

    <Transition name="fade-in">
      <SurprisePage
        ref="surprisePageRef"
        v-if="surpriseVisible"
        @note="activePanel = 'note'"
        @memories="activePanel = 'memories'"
        @songs="activePanel = 'songs'"
      />
    </Transition>

    <Teleport to="body">
      <div v-if="activePanel" class="app-panel-overlay" role="dialog" aria-modal="true" @click.self="activePanel = null">
        <div class="app-panel" :class="{ 'app-panel--playlist': activePanel === 'songs' }">
          <button type="button" class="app-panel__close" aria-label="Close" @click="activePanel = null">✕</button>
          <template v-if="activePanel === 'note'">
            <h2 class="app-panel__title">A note for you</h2>
            <p class="app-panel__body">Edit this text in <code>App.vue</code> — or replace this panel with your own letter.</p>
          </template>
          <template v-else-if="activePanel === 'memories'">
            <MemoriesCard/>
          </template>
          <template v-else-if="activePanel === 'songs'">
            <PlaylistCard
              title="For you"
              subtitle="Tap any songs Mai wants to play. Mai can request for more songs by simply writing it in the note and uplaod it."
              owner-name="Mai Li San"
              :tracks="playlistTracks"
              @playback="onPlaylistPlayback"
            />
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import SurprisePage from './components/SurprisePage.vue'
import PlaylistCard from './components/PlaylistCard.vue'
import MemoriesCard from './components/MemoriesCard.vue'

/** Songs shown in the Spotify-style panel — place files in `public/music/`. */
const playlistTracks = [
  { id: '1', title: 'About You', artist: 'The 1975', src: '/music/aboutYou.mp3' },
  { id: '2', title: 'Hkap Lada', artist: 'Brang Tawng Li', src: '/music/hkaplada.mp3' },
  { id: '3', title: 'Lover Rock', artist: 'TV Girl', src: '/music/Lovers_Rock.mp3'},
  { id: '4', title: 'Harvey', artist: 'Her\'s', src: '/music/Harvey.mp3'},
  { id: '5', title: 'blue', artist: 'Yung Kai', src: '/music/blue.mp3'},
  { id: '6', title: 'For Sleeping', artist: 'Gabriel', src: '/music/For_sleeping.mp3'}
]

const surprisePageRef = ref(null)

const TARGET = new Date('2026-06-09T00:00:00-04:00')

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000

const daysLeft = ref(0)
const hoursLeft = ref(0)
const minutesLeft = ref(0)
const secondsLeft = ref(0)
const showSurprise = ref(false)
const surpriseVisible = ref(false)
/** 'note' | 'memories' | 'songs' | null — opened from birthday page buttons */
const activePanel = ref(null)

let timerId = null

function tick () {
  const ms = Math.max(0, TARGET.getTime() - Date.now())
  daysLeft.value = Math.floor(ms / DAY_MS)
  hoursLeft.value = Math.floor((ms % DAY_MS) / HOUR_MS)
  minutesLeft.value = Math.floor((ms % HOUR_MS) / MINUTE_MS)
  secondsLeft.value = Math.floor((ms % MINUTE_MS) / 1000)

  if (ms === 0 && !showSurprise.value) {
    triggerSurprise()
  }
}

const digitChars = computed(() => {
  const n = daysLeft.value
  const s = n <= 99 ? String(n).padStart(2, '0') : String(n)
  return s.split('')
})
const hoursPadded = computed(() => String(hoursLeft.value).padStart(2, '0'))
const minutesPadded = computed(() => String(minutesLeft.value).padStart(2, '0'))
const secondsPadded = computed(() => String(secondsLeft.value).padStart(2, '0'))
const ariaLabel = computed(() => {
  const d = daysLeft.value === 1 ? '1 day' : `${daysLeft.value} days`
  return `${d}, ${hoursLeft.value} hours, ${minutesLeft.value} minutes remaining`
})

function triggerSurprise () {
  clearInterval(timerId)
  showSurprise.value = true
}

function onPlaylistPlayback (playing) {
  if (playing) {
    surprisePageRef.value?.pauseBackgroundMusic?.()
  } else {
    surprisePageRef.value?.resumeBackgroundMusic?.()
  }
}

watch(activePanel, (next, prev) => {
  if (prev === 'songs' && next !== 'songs') {
    surprisePageRef.value?.resumeBackgroundMusic?.()
  }
})

const DEV_PREVIEW_SURPRISE = false

onMounted(() => {
  if (DEV_PREVIEW_SURPRISE) {
    surpriseVisible.value = true
    return
  }
  tick()
  timerId = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.app-root {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.countdown-page {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 2rem 1rem;
  background: #fff;
}
.label-top {
  font-family: system-ui, sans-serif; font-size: 1.25rem;
  font-weight: 400; letter-spacing: .35em; text-transform: uppercase;
  color: #999; margin-bottom: 1.25rem;
}
.digits-row { display: flex; flex-wrap: wrap; gap: .65rem; justify-content: center; }
.digit-tile {
  --w: clamp(4.5rem,18vw,7rem); --h: clamp(5.25rem,22vw,8.25rem);
  width: var(--w); height: var(--h);
  background: #e5b7b7;
  display: flex; align-items: center; justify-content: center;
  clip-path: polygon(10% 0%,90% 0%,100% 10%,100% 38%,90% 50%,100% 62%,100% 90%,90% 100%,10% 100%,0% 90%,0% 62%,10% 50%,0% 38%,0% 10%);
}
.digit-tile__char {
  font-family: 'Roboto Slab','Rockwell','Courier New',serif;
  font-weight: 800; font-size: clamp(2.5rem,12vw,4.5rem);
  color: #fff; user-select: none; line-height: 1;
}
.label-days {
  font-family: 'Roboto Slab',serif; font-size: clamp(1rem,2.5vw,1.25rem);
  font-weight: 700; letter-spacing: .28em; text-transform: uppercase;
  color: #ccc; margin-top: 1.25rem;
}
.hms-row {
  margin-top: 1.75rem; display: flex; align-items: baseline; gap: .35rem;
  font-family: 'Roboto Slab',serif; font-weight: 800;
  font-variant-numeric: tabular-nums; line-height: 1;
}
.hms-val  { font-size: clamp(1.75rem,8vw,2.75rem); color: #b89595; min-width: 2.25ch; text-align: center; }
.hms-sep  { font-size: clamp(1.5rem,6vw,2.25rem); color: #ccc; padding: 0 .1rem; transform: translateY(-.07em); }
.hms-label { font-family: system-ui,sans-serif; font-size: .65rem; font-weight: 600; letter-spacing: .22em; color: #999; margin-top: .35rem; }
.tz-note   { font-family: system-ui,sans-serif; font-size: .75rem; color: #bbb; margin-top: 1.25rem; letter-spacing: .04em; }

.fade-out-leave-active  { transition: opacity .9s ease, transform .9s ease; position: absolute; inset: 0; }
.fade-out-leave-to      { opacity: 0; transform: scale(1.06); }
</style>

<!-- Parent <Transition> applies these classes to SurprisePage's root element -->
<style>
.fade-in-enter-active { transition: opacity 1.2s ease; }
.fade-in-enter-from { opacity: 0; }
</style>

<style>
.app-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(60, 45, 40, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.app-panel {
  position: relative;
  max-width: 420px;
  width: 100%;
  background: #fdfcf8;
  border-radius: 20px;
  padding: 2rem 1.75rem 1.5rem;
  border: 1px solid #ece5dd;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
}

.app-panel--playlist {
  max-width: min(440px, 100%);
  padding: 0.85rem 0.85rem 1rem;
}
.app-panel__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f0ebe6;
  color: #7a6258;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.app-panel__close:hover {
  background: #e5ddd6;
}
.app-panel__title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.35rem;
  font-weight: 400;
  color: #5c4a42;
  margin-bottom: 0.75rem;
}
.app-panel__body {
  font-family: system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #6a5a52;
}
.app-panel__body code {
  font-size: 0.85em;
}
</style>
