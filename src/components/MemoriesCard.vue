<template>
  <div class="photo-card" :class="{ 'is-expanded': isOpen }">
    <!-- Card Header -->
    <div class="card-header" @click="toggleCard">
      <div class="header-left">
        <div class="icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
        <div>
          <h2 class="card-title">Mai's Gallery</h2>
          <p class="card-subtitle">{{ photos.length }} photo{{ photos.length !== 1 ? 's' : '' }} stored</p>
        </div>
      </div>
      <div class="chevron" :class="{ rotated: isOpen }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>

    <!-- Card Body -->
    <transition name="slide">
      <div v-if="isOpen" class="card-body">

        <!-- Upload Zone -->
        <div
          class="upload-zone"
          :class="{ 'drag-over': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleFileChange"
            style="display: none"
          />
          <div class="upload-content">
            <div class="upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p class="upload-text">
              <span v-if="uploading">Uploading...</span>
              <span v-else>Drop photos here or <span class="upload-link">browse</span></span>
            </p>
            <p class="upload-hint">PNG, JPG, WEBP, GIF up to 10MB</p>
          </div>
        </div>

        <!-- Upload progress indicator -->
        <div v-if="uploading" class="upload-progress">
          <div class="upload-progress__bar"></div>
        </div>

        <!-- Photo Grid (scrollable) -->
        <div class="photo-grid-wrapper">
          <div class="photo-grid">
            <div
              v-for="(photo, index) in photos"
              :key="photo.id"
              class="photo-item"
              @mouseenter="hoveredIndex = index"
              @mouseleave="hoveredIndex = null"
            >
              <img :src="photo.src" :alt="photo.name" loading="lazy" />
              <div class="photo-overlay" :class="{ visible: hoveredIndex === index }">
                <button class="overlay-btn delete-btn" @click.stop="removePhoto(photo.id)" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
                <button class="overlay-btn view-btn" @click.stop="viewPhoto(photo)" title="View">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Scroll fade hint -->
          <div v-if="photos.length > gridThreshold" class="scroll-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M6 9l6 6 6-6"/>
            </svg>
            scroll for more
          </div>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          <button class="add-btn" @click="triggerFileInput" :disabled="uploading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Photos
          </button>
          <button class="clear-btn" @click="clearUserPhotos" v-if="userPhotos.length > 0">
            Clear Mine
          </button>
        </div>
      </div>
    </transition>

    <!-- Lightbox -->
    <transition name="fade">
      <div v-if="lightboxPhoto" class="lightbox" @click.self="lightboxPhoto = null">
        <button class="lightbox-close" @click="lightboxPhoto = null">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <img :src="lightboxPhoto.src" :alt="lightboxPhoto.name" class="lightbox-img" />
        <p class="lightbox-name">{{ lightboxPhoto.name }}</p>
      </div>
    </transition>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'MemoriesCard',
  data() {
    return {
      isOpen: true,
      isDragging: false,
      hoveredIndex: null,
      lightboxPhoto: null,
      uploading: false,
      gridThreshold: 9,
      // Default hardcoded photos — always shown first
      defaultPhotos: [
        {
          id: 'default-1',
          name: 'Birthday Girl',
          src: require('@/assets/memories/Birthday_Girl.jpeg'),
          isDefault: true,
        },
        {
          id: 'default-2',
          name: 'Nabai Kaw',
          src: require('@/assets/memories/Nabai_kaw.jpeg'),
          isDefault: true,
        },
        {
          id: 'default-3',
          name: 'Tsawm Ka',
          src: require('@/assets/memories/Tsawm_ka.jpeg'),
          isDefault: true,
        },
        {
          id: 'default-4',
          name: 'Peinguin',
          src: require('@/assets/images/peinguin.jpeg'),
          isDefault: true,
        },
      ],
      // User-uploaded photos fetched from Supabase
      userPhotos: [],
      nextId: 100,
    }
  },
  computed: {
    // Combine defaults + user photos for display
    photos() {
      return [...this.defaultPhotos, ...this.userPhotos]
    },
  },
  async mounted() {
    try {
      const { data, error } = await supabase.storage
        .from('Photos')
        .list('', { sortBy: { column: 'created_at', order: 'asc' } })

      if (!error && data && data.length > 0) {
        this.userPhotos = data.map((file) => ({
          id: this.nextId++,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/^\d+-/, ''), // strip timestamp prefix
          src: supabase.storage.from('Photos').getPublicUrl(file.name).data.publicUrl,
          fileName: file.name,
          isDefault: false,
        }))
      }
    } catch (e) {
      console.error('Failed to load photos from Supabase:', e)
    }
  },
  methods: {
    toggleCard() {
      this.isOpen = !this.isOpen
    },
    triggerFileInput() {
      if (!this.uploading) this.$refs.fileInput.click()
    },
    handleFileChange(e) {
      this.processFiles(Array.from(e.target.files))
      e.target.value = ''
    },
    handleDrop(e) {
      this.isDragging = false
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
      this.processFiles(files)
    },
    async processFiles(files) {
  if (files.length === 0) return
  this.uploading = true

  for (const file of files) {
    try {
      const fileName = `${Date.now()}-${file.name}`
      console.log('Uploading:', fileName)

      const { data, error } = await supabase.storage
        .from('Photos')
        .upload(fileName, file)

      console.log('Upload result:', data, error)

      if (error) {
        alert('Upload failed: ' + error.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('Photos')
        .getPublicUrl(fileName)

      console.log('Public URL:', urlData.publicUrl)

      this.userPhotos.push({
        id: this.nextId++,
        name: file.name.replace(/\.[^/.]+$/, ''),
        src: urlData.publicUrl,
        fileName,
        isDefault: false,
      })

    } catch (e) {
      console.error('Failed to upload photo:', e)
      alert('Upload error: ' + e.message)
    }
  }

  this.uploading = false
},
    async removePhoto(id) {
      // Check if it's a default photo — just remove from view
      const defaultPhoto = this.defaultPhotos.find(p => p.id === id)
      if (defaultPhoto) {
        this.defaultPhotos = this.defaultPhotos.filter(p => p.id !== id)
        return
      }

      // Otherwise remove from Supabase storage + local state
      const photo = this.userPhotos.find(p => p.id === id)
      if (!photo) return

      try {
        await supabase.storage.from('Photos').remove([photo.fileName])
      } catch (e) {
        console.error('Failed to delete from Supabase:', e)
      }

      this.userPhotos = this.userPhotos.filter(p => p.id !== id)
    },
    viewPhoto(photo) {
      this.lightboxPhoto = photo
    },
    async clearUserPhotos() {
      if (!confirm('Remove all your uploaded photos? Default photos will stay.')) return

      try {
        const fileNames = this.userPhotos.map(p => p.fileName)
        if (fileNames.length > 0) {
          await supabase.storage.from('Photos').remove(fileNames)
        }
      } catch (e) {
        console.error('Failed to clear photos:', e)
      }

      this.userPhotos = []
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500&display=swap');

* { box-sizing: border-box; }

/* ── Card shell ─────────────────────────────────────── */
.photo-card {
  font-family: 'DM Sans', sans-serif;
  background: #ffffff;
  border: 1px solid #f2d9e4;
  border-radius: 20px;
  width: 100%;
  max-width: 860px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(165, 100, 140, 0.12);
  transition: box-shadow 0.3s ease;
}

.photo-card.is-expanded {
  box-shadow: 0 28px 80px rgba(165, 100, 140, 0.18);
}

/* ── Header ─────────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s;
}

.is-expanded .card-header { border-bottom-color: #f4dae5; }

.header-left { display: flex; align-items: center; gap: 12px; }

.icon-wrap {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffd7eb, #ffc4dc);
  display: flex; align-items: center; justify-content: center;
  color: #6a2c4f; flex-shrink: 0;
}
.icon-wrap svg { width: 20px; height: 20px; }

.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  color: #3d1f36;
  margin: 0 0 2px;
}
.card-subtitle { font-size: 12px; color: #8f697f; margin: 0; font-weight: 400; }

.chevron svg { width: 20px; height: 20px; color: #b98aa4; transition: transform 0.35s cubic-bezier(.4,0,.2,1); }
.chevron.rotated svg { transform: rotate(180deg); }

/* ── Body ───────────────────────────────────────────── */
.card-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 16px; }

/* ── Upload zone ────────────────────────────────────── */
.upload-zone {
  border: 1.5px dashed #f2d9e4;
  border-radius: 14px;
  padding: clamp(14px, 3vw, 24px) 18px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #fff7fb;
}
.upload-zone:hover,
.upload-zone.drag-over {
  border-color: #f6b4d1;
  background: rgba(246, 180, 209, 0.15);
}
.upload-icon { width: 40px; height: 40px; margin: 0 auto 8px; color: #d46f96; }
.upload-icon svg { width: 100%; height: 100%; }
.upload-text { font-size: 13px; color: #755468; margin: 0 0 3px; }
.upload-link { color: #c8568d; font-weight: 500; }
.upload-hint { font-size: 11px; color: #b1849a; margin: 0; }

/* Upload progress bar */
.upload-progress {
  width: 100%;
  height: 3px;
  background: rgba(212, 111, 150, 0.15);
  border-radius: 99px;
  overflow: hidden;
}
.upload-progress__bar {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, transparent, #d46f96, transparent);
  border-radius: 99px;
  animation: shimmer 1.2s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { transform: translateX(-150%); }
  100% { transform: translateX(400%); }
}

/* ── Photo grid wrapper — SCROLLABLE ────────────────── */
.photo-grid-wrapper {
  position: relative;
  height: 320px;        /* fixed height instead of max-height */
  min-height: 220px;
  overflow-y: scroll;   /* scroll instead of auto — always shows scrollbar */
  overflow-x: hidden;
  border-radius: 10px;
  scrollbar-width: thin;
  scrollbar-color: #f2d9e4 transparent;
  -webkit-overflow-scrolling: touch; /* smooth scroll on iOS */
}
.photo-grid-wrapper::-webkit-scrollbar { width: 5px; }
.photo-grid-wrapper::-webkit-scrollbar-track { background: transparent; }
.photo-grid-wrapper::-webkit-scrollbar-thumb { background: #f2d9e4; border-radius: 99px; }

.photo-grid-wrapper::after {
  content: '';
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: block;
  height: 36px;
  background: linear-gradient(transparent, rgba(255,255,255,0.92));
  pointer-events: none;
}

/* ── Photo grid ─────────────────────────────────────── */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(80px, 18vw, 130px), 1fr));
  gap: 8px;
  padding-bottom: 2px;
}

.photo-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: #fff7fb;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(230, 195, 213, 0.5);
}
.photo-item img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: transform 0.4s ease;
}
.photo-item:hover img { transform: scale(1.06); }

.photo-overlay {
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  opacity: 0; transition: opacity 0.25s ease;
  backdrop-filter: blur(4px);
}
.photo-overlay.visible { opacity: 1; }

.overlay-btn {
  width: 32px; height: 32px;
  border-radius: 50%; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s, background 0.2s;
}
.overlay-btn svg { width: 14px; height: 14px; }
.delete-btn { background: rgba(231,118,150,0.95); color: #fff; }
.delete-btn:hover { background: #e9689d; transform: scale(1.1); }
.view-btn { background: rgba(255,194,221,0.95); color: #52254d; }
.view-btn:hover { background: #f9c0d5; transform: scale(1.1); }

.scroll-hint {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  font-size: 10px; color: #b98aa4; letter-spacing: 0.06em;
  padding: 6px 0 2px;
  animation: nudge 1.6s ease-in-out infinite;
}
@keyframes nudge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(2px); }
}

/* ── Footer ─────────────────────────────────────────── */
.card-footer {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
}

.add-btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 18px;
  background: linear-gradient(135deg, #ffd7eb, #ffe7f2);
  color: #5b2d52; border: none; border-radius: 12px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.01em;
  transition: all 0.25s ease;
  min-width: 0;
}
.add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.add-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
.add-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(212,111,150,0.2); }
.add-btn:active { transform: translateY(0); }

.clear-btn {
  padding: 11px 16px;
  background: transparent; color: #8f697f;
  border: 1px solid #f2d9e4; border-radius: 12px;
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.clear-btn:hover { color: #c0467d; border-color: rgba(192,70,125,0.4); }

/* ── Lightbox ───────────────────────────────────────── */
.lightbox {
  position: fixed; inset: 0;
  background: rgba(255,255,255,0.96);
  z-index: 9999;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 20px; backdrop-filter: blur(8px);
}
.lightbox-img {
  max-width: 90vw; max-height: 80vh;
  object-fit: contain; border-radius: 12px;
  box-shadow: 0 40px 120px rgba(165,100,140,0.18);
}
.lightbox-name { color: #8f697f; font-size: 13px; margin: 14px 0 0; }
.lightbox-close {
  position: absolute; top: 20px; right: 20px;
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(255,255,255,0.7); border: none;
  color: #5f3a52; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.lightbox-close:hover { background: rgba(255,255,255,0.95); }
.lightbox-close svg { width: 17px; height: 17px; }

/* ── Transitions ────────────────────────────────────── */
.slide-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.slide-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); max-height: 0; }
.slide-enter-to, .slide-leave-from { opacity: 1; transform: translateY(0); max-height: 2000px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive tweaks ──────────────────────────────── */
@media (max-width: 400px) {
  .card-body { padding: 14px; gap: 12px; }
  .card-header { padding: 14px; }
}
</style>
