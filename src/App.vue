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
      <SurprisePage v-if="surpriseVisible" />
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SurprisePage from './components/SurprisePage.vue'

const TARGET = new Date('2026-05-10T00:00:00-04:00')

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000

const daysLeft = ref(0)
const hoursLeft = ref(0)
const minutesLeft = ref(0)
const secondsLeft = ref(0)
const showSurprise = ref(false)
const surpriseVisible = ref(false)

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
.hms-sep  { font-size: clamp(1.5rem,6vw,2.25rem); color: #ccc; padding: 0 .1rem; transform: translateY(-.06em); }
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
