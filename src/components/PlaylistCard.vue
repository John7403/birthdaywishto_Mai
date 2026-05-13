<template>
  <div class="playlist-card">
    <audio
      ref="audioRef"
      class="playlist-card__audio"
      preload="metadata"
      playsinline
      @play="onAudioPlay"
      @pause="onAudioPause"
      @ended="onAudioEnded"
    />

    <header class="playlist-card__hero">
      <div class="playlist-card__cover">
        <img
          class="playlist-card__cover-img"
          src="@/assets/images/Mai.png"
          :alt="coverAlt"
          loading="lazy"
          decoding="async"
          width="120"
          height="120"
        />
      </div>
      <div class="playlist-card__meta">
        <p class="playlist-card__kind">Playlist</p>
        <h2 class="playlist-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="playlist-card__subtitle">{{ subtitle }}</p>
        <p class="playlist-card__stats">
          <span class="playlist-card__stats-name">{{ ownerName }}</span>
          <span class="playlist-card__dot">·</span>
          <span>{{ tracks.length }} songs</span>
        </p>
      </div>
    </header>

    <div class="playlist-card__toolbar">
      <button
        type="button"
        class="playlist-card__play-all"
        :aria-label="playingId ? 'Pause' : 'Play'"
        @click="togglePlayCurrent"
      >
        <span v-if="!playingId || isPaused" class="playlist-card__play-icon" aria-hidden="true" />
        <span v-else class="playlist-card__pause-icon" aria-hidden="true">
          <span class="playlist-card__pause-bar" />
          <span class="playlist-card__pause-bar" />
        </span>
      </button>
    </div>

    <div class="playlist-card__table-wrap">
      <div class="playlist-card__thead" aria-hidden="true">
        <span class="playlist-card__th playlist-card__th--idx">#</span>
        <span class="playlist-card__th playlist-card__th--title">Title</span>
        <span class="playlist-card__th playlist-card__th--dur">
          <span class="playlist-card__clock" title="Duration">⏱</span>
        </span>
      </div>
      <ol class="playlist-card__list">
        <li
          v-for="(track, index) in tracks"
          :key="track.id"
          class="playlist-card__row"
          :class="{ 'playlist-card__row--active': playingId === track.id && !isPaused }"
        >
          <button
            type="button"
            class="playlist-card__row-btn"
            @click="selectTrack(track)"
          >
            <span class="playlist-card__idx">
              <span v-if="playingId !== track.id || isPaused" class="playlist-card__idx-num">{{ index + 1 }}</span>
              <span v-else class="playlist-card__eq" aria-hidden="true">
                <span /><span /><span />
              </span>
            </span>
            <span class="playlist-card__track-main">
              <span class="playlist-card__track-title">{{ track.title }}</span>
              <span class="playlist-card__track-artist">{{ track.artist }}</span>
            </span>
            <span class="playlist-card__dur">{{ track.duration || '—:—' }}</span>
          </button>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Your mix' },
  subtitle: { type: String, default: '' },
  ownerName: { type: String, default: 'You' },
  tracks: {
    type: Array,
    /** @type {import('vue').PropType<Array<{ id: string, title: string, artist: string, src: string, duration?: string }>>} */
    default: () => [],
  },
  coverAlt: { type: String, default: 'Mai' },
})

const emit = defineEmits(['playback'])

const audioRef = ref(null)
const playingId = ref(null)
const isPaused = ref(true)

const currentTrack = computed(() => props.tracks.find((t) => t.id === playingId.value) || null)

function onAudioPlay () {
  isPaused.value = false
  emit('playback', true)
}

function onAudioPause () {
  isPaused.value = true
  emit('playback', false)
}

function onAudioEnded () {
  playingId.value = null
  isPaused.value = true
  emit('playback', false)
}

async function selectTrack (track) {
  const el = audioRef.value
  if (!el) return

  if (playingId.value === track.id && !isPaused.value) {
    el.pause()
    return
  }

  if (playingId.value !== track.id) {
    el.src = track.src
    playingId.value = track.id
  }
  try {
    await el.play()
  } catch {
    /* autoplay / gesture policies */
  }
}

async function togglePlayCurrent () {
  const el = audioRef.value
  if (!el) return

  if (!currentTrack.value && props.tracks.length) {
    await selectTrack(props.tracks[0])
    return
  }

  if (!currentTrack.value) return

  if (isPaused.value) {
    try {
      await el.play()
    } catch {
      /* ignore */
    }
  } else {
    el.pause()
  }
}

onUnmounted(() => {
  const el = audioRef.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
  }
  emit('playback', false)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300;1,400&family=Raleway:wght@200;300;400;500&display=swap');

.playlist-card {
  --bg: #fdfcf8;
  --text: #7a6258;
  --text-muted: #a89088;
  --text-faint: #c4aaa0;
  --accent: #b89595;
  --accent-deep: #8a6a60;
  --row-hover: #f5ede8;
  --row-active: rgba(237, 224, 216, 0.65);
  --border: #ece5dd;
  --border-soft: #ddd0c8;
  font-family: 'Raleway', sans-serif;
  color: var(--text);
  background: var(--bg);
  border-radius: 16px;
  overflow: hidden;
  min-width: 0;
  border: 0.5px solid var(--border);
  box-shadow: 0 8px 28px rgba(180, 140, 120, 0.1);
}

.playlist-card__audio {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.playlist-card__hero {
  display: flex;
  gap: 1.25rem;
  padding: 1.5rem 1.25rem 1rem;
  background: linear-gradient(180deg, #f5ede9 0%, rgba(253, 252, 248, 0.96) 52%, var(--bg) 100%);
  align-items: flex-end;
}

.playlist-card__cover {
  flex-shrink: 0;
  width: clamp(5.5rem, 28vw, 7.5rem);
  height: clamp(5.5rem, 28vw, 7.5rem);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 22px rgba(180, 140, 120, 0.18);
  border: 0.5px solid var(--border-soft);
  background: var(--border-soft);
}

.playlist-card__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.playlist-card__meta {
  min-width: 0;
  padding-bottom: 0.15rem;
}

.playlist-card__kind {
  font-size: 10px;
  font-weight: 200;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 0.45rem;
}

.playlist-card__title {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 300;
  font-size: clamp(1.5rem, 4.5vw, 1.95rem);
  letter-spacing: 0.02em;
  line-height: 1.15;
  margin: 0;
  word-break: break-word;
  color: var(--text);
}

.playlist-card__subtitle {
  margin: 0.4rem 0 0;
  font-size: 0.82rem;
  font-weight: 300;
  color: var(--text-muted);
  line-height: 1.45;
}

.playlist-card__stats {
  margin: 0.65rem 0 0;
  font-size: 0.78rem;
  font-weight: 300;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.playlist-card__stats-name {
  color: var(--accent-deep);
  font-weight: 400;
}

.playlist-card__dot {
  margin: 0 0.35rem;
  opacity: 0.7;
}

.playlist-card__toolbar {
  padding: 0.5rem 1.25rem 0.75rem;
}

.playlist-card__play-all {
  width: 3.25rem;
  height: 3.25rem;
  border: 0.5px solid #dac4bc;
  border-radius: 50%;
  background: #f5ede9;
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(180, 140, 120, 0.15);
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}
.playlist-card__play-all:hover {
  transform: scale(1.05);
  background: #ede0d8;
  border-color: #c9b0b8;
}
.playlist-card__play-all:active {
  transform: scale(0.98);
}

.playlist-card__play-icon {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 0 8px 13px;
  border-color: transparent transparent transparent var(--accent-deep);
  margin-left: 3px;
}

.playlist-card__pause-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 14px;
}

.playlist-card__pause-bar {
  width: 4px;
  height: 14px;
  background: var(--accent-deep);
  border-radius: 1px;
}

.playlist-card__table-wrap {
  padding: 0 0.5rem 1rem;
}

.playlist-card__thead {
  display: grid;
  grid-template-columns: 2.25rem 1fr 3.25rem;
  gap: 0.5rem;
  padding: 0 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-soft);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.playlist-card__th--dur {
  text-align: right;
}

.playlist-card__clock {
  opacity: 0.85;
  font-size: 0.75rem;
}

.playlist-card__list {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0 0;
  max-height: min(42vh, 280px);
  overflow-y: auto;
}

.playlist-card__list::-webkit-scrollbar {
  width: 6px;
}
.playlist-card__list::-webkit-scrollbar-thumb {
  background: var(--border-soft);
  border-radius: 3px;
}
.playlist-card__list::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-card__row {
  border-radius: 6px;
}

.playlist-card__row:hover {
  background: var(--row-hover);
}

.playlist-card__row--active {
  background: var(--row-active);
}

.playlist-card__row-btn {
  width: 100%;
  display: grid;
  grid-template-columns: 2.25rem 1fr 3.25rem;
  gap: 0.5rem;
  align-items: center;
  padding: 0.55rem 0.75rem;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
}

.playlist-card__idx {
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.playlist-card__row--active .playlist-card__idx {
  color: var(--accent);
}

.playlist-card__eq {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 14px;
}
.playlist-card__eq span {
  width: 3px;
  height: 100%;
  background: var(--accent);
  border-radius: 1px;
  animation: eq 0.5s ease-in-out infinite alternate;
}
.playlist-card__eq span:nth-child(2) {
  animation-delay: 0.12s;
}
.playlist-card__eq span:nth-child(3) {
  animation-delay: 0.24s;
}

@keyframes eq {
  from { transform: scaleY(0.35); }
  to { transform: scaleY(1); }
}

.playlist-card__track-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.playlist-card__track-title {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-card__track-artist {
  font-size: 0.78rem;
  font-weight: 300;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-card__dur {
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  text-align: right;
}
</style>
