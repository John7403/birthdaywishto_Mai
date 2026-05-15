<template>
  <teleport to="body">
  <!-- Modal Overlay -->
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click="closeModal"></div>
  </Transition>

  <!-- Modal Container -->
  <Transition name="modal-slide">
    <div v-if="show" class="modal-container">
      <div class="notes-card" @click.stop>
        <header class="notes-header">
          <h1 class="notes-title">Mai's Notes</h1>
          <div class="header-actions">
            <button class="add-btn" @click="addNote">
              <span class="add-icon">+</span>
              New Note
            </button>
            <button class="close-btn" @click="closeModal" title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Loading indicator -->
        <div v-if="loading" class="loading-bar">
          <div class="loading-bar__inner"></div>
        </div>

        <div class="notes-grid">
          <div
            v-for="note in notes"
            :key="note.id"
            class="note-card"
            :style="{ backgroundColor: note.color }"
          >
            <!-- View Mode -->
            <template v-if="!note.editing">
              <div class="note-body">
                <p class="note-text" :class="{ empty: !note.text }">
                  {{ note.text || 'Empty note...' }}
                </p>
              </div>
              <div class="note-footer">
                <span class="note-date">{{ formatDate(note.createdAt) }}</span>
                <div class="note-actions">
                  <button class="icon-btn edit-btn" @click="startEdit(note)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="icon-btn color-btn" @click="toggleColorPicker(note)" title="Change color">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/>
                      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/>
                      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/>
                      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                    </svg>
                  </button>
                  <button class="icon-btn delete-btn" @click="deleteNote(note.id)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Color Picker -->
              <transition name="fade">
                <div v-if="note.showColorPicker" class="color-picker">
                  <button
                    v-for="color in colors"
                    :key="color"
                    class="color-swatch"
                    :style="{ backgroundColor: color }"
                    :class="{ active: note.color === color }"
                    @click="changeColor(note, color)"
                  />
                </div>
              </transition>
            </template>

            <!-- Edit Mode -->
            <template v-else>
              <textarea
                class="note-textarea"
                v-model="note.draftText"
                placeholder="Write your note..."
                ref="textarea"
                @keydown.esc="cancelEdit(note)"
              />
              <div class="edit-actions">
                <button class="save-btn" @click="saveNote(note)">Save</button>
                <button class="cancel-btn" @click="cancelEdit(note)">Cancel</button>
              </div>
            </template>
          </div>

          <!-- Empty placeholder cards -->
          <div
            v-for="n in emptySlots"
            :key="'empty-' + n"
            class="note-card note-card--empty"
          >
            <button class="empty-add-btn" @click="addNote">
              <span>+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  </teleport>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'NoteCard',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      loading: false,
      notes: [
        {
          id: 'default-1',
          text: 'Happy Birthday yaw Tsawm ka✨. Myit da ni galaw myu ni galoi ma byin wa u ga. Yawng na matu ma chye ju dum ai yaw galoi ma supportive byin ya majaw. Wishing you all the best on your special day and always! 🎉🎂',
          color: '#FDF5F0',
          editing: false,
          draftText: '',
          showColorPicker: false,
          createdAt: new Date(),
          isDefault: true,
        },
        {
          id: 'default-2',
          text: 'Song Request ma mai ai...',
          color: '#FDEAE0',
          editing: false,
          draftText: '',
          showColorPicker: false,
          createdAt: new Date(),
          isDefault: true,
        },
        {
          id: 'default-3',
          text: 'Notes ma mai mat ai',
          color: '#E8DFF5',
          editing: false,
          draftText: '',
          showColorPicker: false,
          createdAt: new Date(),
          isDefault: true,
        },
        {
          id: 'default-4',
          text: 'Nre nkai gaw hkum ka!!!',
          color: '#FDEAE0',
          editing: false,
          draftText: '',
          showColorPicker: false,
          createdAt: new Date(),
          isDefault: true,
        },
      ],
      colors: [
        '#FDF5F0',
        '#FDEAE0',
        '#FDD9C7',
        '#FEE4B5',
        '#E8DFF5',
        '#E0F3E8',
        '#F0E8E0',
        '#F5DDD5',
        '#F9D5CC',
        '#E8E0E8',
      ],
      nextTempId: 100,
      gridSize: 6,
    }
  },
  computed: {
    emptySlots() {
      const filled = this.notes.length
      return filled < this.gridSize ? this.gridSize - filled : 0
    },
  },
  async mounted() {
    this.loading = true
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error && data) {
        const dbNotes = data.map(n => ({
          id: n.id,
          text: n.text,
          color: n.color,
          editing: false,
          draftText: '',
          showColorPicker: false,
          createdAt: new Date(n.created_at),
          isDefault: false,
        }))
        // Append DB notes after the 4 hardcoded defaults
        this.notes = [...this.notes, ...dbNotes]
      }
    } catch (e) {
      console.error('Failed to load notes:', e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    addNote() {
      const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)]
      const newNote = {
        id: 'temp-' + this.nextTempId++,
        text: '',
        color: randomColor,
        editing: true,
        draftText: '',
        showColorPicker: false,
        createdAt: new Date(),
        isDefault: false,
        isNew: true,
      }
      this.notes.push(newNote)
      this.$nextTick(() => {
        const textareas = this.$refs.textarea
        if (textareas) {
          const el = Array.isArray(textareas) ? textareas[textareas.length - 1] : textareas
          el?.focus()
        }
      })
    },
    startEdit(note) {
      this.closeAllPickers()
      note.draftText = note.text
      note.editing = true
      this.$nextTick(() => {
        const textareas = this.$refs.textarea
        if (textareas) {
          const el = Array.isArray(textareas) ? textareas[0] : textareas
          el?.focus()
        }
      })
    },
    async saveNote(note) {
      const text = note.draftText.trim()
      note.text = text
      note.editing = false
      note.draftText = ''

      // Don't save default notes to DB
      if (note.isDefault) return

      try {
        if (note.isNew) {
          // Insert new note into Supabase
          const { data, error } = await supabase
            .from('notes')
            .insert([{ text, color: note.color }])
            .select()
            .single()

          if (!error && data) {
            note.id = data.id   // replace temp id with real DB id
            note.isNew = false
          }
        } else {
          // Update existing note in Supabase
          await supabase
            .from('notes')
            .update({ text, color: note.color })
            .eq('id', note.id)
        }
      } catch (e) {
        console.error('Failed to save note:', e)
      }
    },
    cancelEdit(note) {
      if (note.isNew) {
        this.notes = this.notes.filter(n => n.id !== note.id)
        return
      }
      note.editing = false
      note.draftText = ''
    },
    async deleteNote(id) {
      const note = this.notes.find(n => n.id === id)
      // Only delete from DB if it's a real saved note
      if (note && !note.isDefault && !note.isNew) {
        try {
          await supabase.from('notes').delete().eq('id', id)
        } catch (e) {
          console.error('Failed to delete note:', e)
        }
      }
      this.notes = this.notes.filter(n => n.id !== id)
    },
    toggleColorPicker(note) {
      const current = note.showColorPicker
      this.closeAllPickers()
      note.showColorPicker = !current
    },
    closeAllPickers() {
      this.notes.forEach(n => (n.showColorPicker = false))
    },
    async changeColor(note, color) {
      note.color = color
      note.showColorPicker = false

      // Only update DB for saved (non-default, non-new) notes
      if (!note.isDefault && !note.isNew) {
        try {
          await supabase.from('notes').update({ color }).eq('id', note.id)
        } catch (e) {
          console.error('Failed to update color:', e)
        }
      }
    },
    formatDate(date) {
      return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.notes-card {
  font-family: 'Nunito', sans-serif;
  min-height: 100%;
  max-width: 860px;
  background: #fdfcf8;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(165, 100, 140, 0.12);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

/* Loading bar */
.loading-bar {
  width: 100%;
  height: 3px;
  background: rgba(168, 144, 136, 0.15);
  border-radius: 99px;
  margin-bottom: 24px;
  overflow: hidden;
}
.loading-bar__inner {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, transparent, #a89088, transparent);
  border-radius: 99px;
  animation: shimmer 1.2s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { transform: translateX(-150%); }
  100% { transform: translateX(400%); }
}

/* Header */
.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notes-title {
  font-size: 2rem;
  font-weight: 800;
  color: #7a6258;
  letter-spacing: -0.5px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #a89088;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-family: 'Nunito', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.add-btn:hover {
  background: #917a6f;
  transform: translateY(-1px);
}

.add-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.close-btn {
  background: rgba(168, 144, 136, 0.12);
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a89088;
  transition: background 0.15s, color 0.15s;
  padding: 8px;
}

.close-btn svg {
  width: 100%;
  height: 100%;
}

.close-btn:hover {
  background: rgba(168, 144, 136, 0.22);
  color: #7a6258;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
}

.modal-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal-container .notes-card {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
}

/* Modal transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}

/* Grid */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 960px;
}

/* Card */
.note-card {
  position: relative;
  border-radius: 20px;
  padding: 22px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.note-card:hover {
  transform: translateY(-4px) rotate(0.4deg);
  box-shadow: 0 10px 28px rgba(0,0,0,0.1);
}

.note-card--empty {
  background: rgba(168, 144, 136, 0.06) !important;
  border: 2.5px dashed rgba(168, 144, 136, 0.2);
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-card--empty:hover {
  transform: translateY(-2px);
  border-color: rgba(168, 144, 136, 0.35);
  background: rgba(168, 144, 136, 0.1) !important;
}

/* Note body */
.note-body {
  flex: 1;
}

.note-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b5447;
  line-height: 1.6;
  white-space: pre-wrap;
}

.note-text.empty {
  color: #c4aaa0;
  font-style: italic;
  font-weight: 500;
}

/* Footer */
.note-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.note-date {
  font-size: 0.75rem;
  font-weight: 700;
  color: #a89088;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.note-card:hover .note-actions {
  opacity: 1;
}

.icon-btn {
  background: rgba(168, 144, 136, 0.12);
  border: none;
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a89088;
  transition: background 0.15s, color 0.15s;
  padding: 6px;
}

.icon-btn svg {
  width: 100%;
  height: 100%;
}

.icon-btn:hover {
  background: rgba(168, 144, 136, 0.22);
  color: #7a6258;
}

.delete-btn:hover {
  background: rgba(220,38,38,0.15);
  color: rgb(185,28,28);
}

/* Color picker */
.color-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: #fdfcf8;
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 160px;
  box-shadow: 0 8px 24px rgba(122, 98, 88, 0.15);
  z-index: 10;
}

.color-swatch {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.color-swatch:hover {
  transform: scale(1.2);
}

.color-swatch.active {
  border-color: #a89088;
  transform: scale(1.15);
}

/* Textarea (edit mode) */
.note-textarea {
  width: 100%;
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Nunito', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b5447;
  line-height: 1.6;
  min-height: 100px;
}

.note-textarea::placeholder {
  color: #c4aaa0;
  font-style: italic;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.save-btn,
.cancel-btn {
  padding: 6px 14px;
  border-radius: 10px;
  border: none;
  font-family: 'Nunito', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

.save-btn {
  background: rgba(168, 144, 136, 0.15);
  color: #7a6258;
}

.save-btn:hover {
  background: rgba(168, 144, 136, 0.25);
}

.cancel-btn {
  background: transparent;
  color: #a89088;
}

.cancel-btn:hover {
  color: #7a6258;
}

/* Empty add button */
.empty-add-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 2rem;
  color: rgba(168, 144, 136, 0.25);
  line-height: 1;
  transition: color 0.15s, transform 0.15s;
}

.empty-add-btn:hover {
  color: rgba(168, 144, 136, 0.45);
  transform: scale(1.2);
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* Responsive */
@media (max-width: 768px) {
  .notes-card { padding: 24px 16px; }
  .notes-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}

@media (max-width: 480px) {
  .notes-grid { grid-template-columns: 1fr; }
}
</style>
