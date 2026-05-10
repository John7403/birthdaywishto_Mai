<template>
  <div class="countdown-page" role="timer" :aria-label="ariaLabel">
    <p class="countdown-page__label-top">ONLY</p>

    <div class="countdown-page__digits">
      <div
        v-for="(char, index) in digitChars"
        :key="index"
        class="digit-cell"
      >
        <span class="digit-cell__inner">{{ char }}</span>
      </div>
    </div>

    <p class="countdown-page__label-bottom">DAYS LEFT</p>

    <div class="countdown-page__hm">
      <span class="countdown-page__hm-value">{{ hoursPadded }}</span>
      <span class="countdown-page__hm-sep">:</span>
      <span class="countdown-page__hm-value">{{ minutesPadded }}</span>
      <span class="countdown-page__hm-sep">:</span>
      <span class="countdown-page__hm-value">{{ secondsPadded }}</span>
    </div>
    <p class="countdown-page__hm-label">HOURS · MINUTES · SECONDS</p>
    <p class="countdown-page__tz">{{ tzCaption }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const TARGET = new Date('2026-06-09T00:00:00-04:00')
const tzCaption = 'Your special day is coming soon'

const DAY_MS = 86400000
const HOUR_MS = 3600000
const MINUTE_MS = 60000

const daysLeft = ref(0)
const hoursLeft = ref(0)
const minutesLeft = ref(0)
const secondsLeft = ref(0)

let timerId = null

function tick() {
  const remainingMs = Math.max(0, TARGET.getTime() - Date.now())
  daysLeft.value = Math.floor(remainingMs / DAY_MS)
  hoursLeft.value = Math.floor(remainingMs / HOUR_MS)
  minutesLeft.value = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS)
  secondsLeft.value = Math.floor((remainingMs % MINUTE_MS) / 1000)
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
  const d = daysLeft.value
  const h = hoursLeft.value
  const m = minutesLeft.value
  const dayPart = d === 1 ? '1 day' : `${d} days`
  return `${dayPart}, ${h} hours, ${m} minutes remaining until June 9, 2026 Florida time`
})

onMounted(() => {
  tick()
  timerId = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;800&display=swap');

.countdown-page {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: #ffffff;
  box-sizing: border-box;
}

.countdown-page__label-top {
  margin: 0 0 1.25rem;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 1.25rem;
  font-weight: 400;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #999999;
}

.countdown-page__digits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  justify-content: center;
  align-items: center;
}

.digit-cell {
  --cell-w: clamp(4.5rem, 18vw, 7rem);
  --cell-h: clamp(5.25rem, 22vw, 8.25rem);
  width: var(--cell-w);
  height: var(--cell-h);
  background: #e5b7b7;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(
    10% 0%,
    90% 0%,
    100% 10%,
    100% 38%,
    90% 50%,
    100% 62%,
    100% 90%,
    90% 100%,
    10% 100%,
    0% 90%,
    0% 62%,
    10% 50%,
    0% 38%,
    0% 10%
  );
}

.digit-cell__inner {
  font-family: 'Roboto Slab', 'Rockwell', 'Courier New', serif;
  font-weight: 800;
  font-size: clamp(2.5rem, 12vw, 4.5rem);
  line-height: 1;
  color: #ffffff;
  user-select: none;
}

.countdown-page__label-bottom {
  margin: 1.25rem 0 0;
  font-family: 'Roboto Slab', 'Rockwell', 'Courier New', serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #cccccc;
}

.countdown-page__hm {
  margin: 1.75rem 0 0.35rem;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.35rem;
  font-family: 'Roboto Slab', 'Rockwell', 'Courier New', serif;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.countdown-page__hm-value {
  font-size: clamp(1.75rem, 8vw, 2.75rem);
  color: #b89595;
  min-width: 2.25ch;
  text-align: center;
}

.countdown-page__hm-sep {
  font-size: clamp(1.5rem, 6vw, 2.25rem);
  color: #cccccc;
  font-weight: 700;
  padding: 0 0.1rem;
  transform: translateY(-0.06em);
}

.countdown-page__hm-label {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #999999;
}

.countdown-page__tz {
  margin: 1.25rem 0 0;
  max-width: 22rem;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.7rem;
  font-weight: 400;
  line-height: 1.45;
  letter-spacing: 0.04em;
  color: #bbbbbb;
}
</style>