<template>
  <!-- Меню сохранения -->
  <div v-if="showSaveMenu" class="modal-menu save-menu">
    <div class="menu-header">
      <h3>Сохранить проект</h3>
      <button class="close-btn" @click="$emit('toggle-save-menu')">×</button>
    </div>
    
    <div class="menu-content">
      <div class="input-group">
        <label for="projectName">Название проекта:</label>
        <input 
          type="text" 
          id="projectName" 
          :value="saveProjectName" 
          @input="$emit('update:saveProjectName', ($event.target as HTMLInputElement).value)" 
          placeholder="Мой проект"
        >
      </div>
      
      <div class="button-group">
        <button @click="saveToLocalStorage()" class="primary-btn">
          Сохранить в браузере
        </button>
        <button @click="exportToFile()" class="secondary-btn">
          Экспорт в файл
        </button>
      </div>
    </div>
  </div>
  
  <!-- Меню загрузки -->
  <div v-if="showLoadMenu" class="modal-menu load-menu">
    <div class="menu-header">
      <h3>Загрузить проект</h3>
      <button class="close-btn" @click="$emit('toggle-load-menu')">×</button>
    </div>
    
    <div class="menu-content">
      <div v-if="savedProjects.length > 0">
        <h4>Сохраненные проекты:</h4>
        <div class="saved-projects-list">
          <div 
            v-for="project in savedProjects" 
            :key="project.name" 
            class="saved-project"
          >
            <div class="project-info">
              <span class="project-name">{{ project.name }}</span>
              <span class="project-date">{{ formatDate(project.date) }}</span>
            </div>
            <div class="project-actions">
              <button @click="loadFromLocalStorage(project.name)" class="action-btn">
                Загрузить
              </button>
              <button @click="deleteFromLocalStorage(project.name)" class="action-btn delete">
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-saved-projects">
        <p>Нет сохраненных проектов</p>
      </div>
      
      <div class="import-section">
        <h4>Импорт из файла:</h4>
        <input 
          type="file" 
          id="importFile" 
          ref="importFileInput"
          accept=".json"
          @change="handleFileImport"
          style="display:none"
        >
        <button @click="triggerFileInput()" class="secondary-btn">
          Выбрать файл для импорта
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSaveLoad } from '../../../composables/useSaveLoad'

// Определяем пропсы
const props = defineProps<{
  showSaveMenu: boolean,
  showLoadMenu: boolean,
  saveProjectName: string,
  savedProjects: { name: string, date: number }[],
  rooms: any[]
}>()

// Определяем эмиты
const emit = defineEmits<{
  (e: 'toggle-save-menu'): void,
  (e: 'toggle-load-menu'): void,
  (e: 'update:saveProjectName', value: string): void,
  (e: 'load-project', roomsData: any[]): void
}>()

// Используем composable для работы с сохранением/загрузкой
const { 
  importFileInput, 
  formatDate, 
  saveToLocalStorage: saveToLocalStorageOriginal,
  exportToFile: exportToFileOriginal,
  loadFromLocalStorage: loadFromLocalStorageOriginal,
  deleteFromLocalStorage,
  triggerFileInput,
  handleFileImport: handleFileImportOriginal
} = useSaveLoad(null) // передаем null, так как сцена будет управляться в родительском компоненте

// Перенаправляем вызов на родительскую функцию с правильным биндингом комнат
const saveToLocalStorage = () => {
  saveToLocalStorageOriginal(props.rooms)
  emit('toggle-save-menu')
}

const exportToFile = () => {
  exportToFileOriginal(props.rooms)
  emit('toggle-save-menu')
}

const loadFromLocalStorage = (projectName: string) => {
  loadFromLocalStorageOriginal(projectName, (roomsData) => {
    emit('load-project', roomsData)
  })
  emit('toggle-load-menu')
}

const handleFileImport = (event: Event) => {
  handleFileImportOriginal(event, (roomsData) => {
    emit('load-project', roomsData)
  })
  emit('toggle-load-menu')
}
</script>

<style scoped>
.modal-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: rgba(40, 44, 52, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.menu-header {
  padding: 15px;
  background: #1976d2;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: #ffffff;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 5px;
}

.menu-content {
  padding: 20px;
  color: #ffffff;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #e0e0e0;
}

.input-group input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 1rem;
  background: #2a2e36;
  color: #ffffff;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.primary-btn,
.secondary-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
  font-weight: 500;
}

.primary-btn {
  background: #2196f3;
  color: white;
  flex: 1;
}

.primary-btn:hover {
  background: #1976d2;
}

.secondary-btn {
  background: #3a3f4b;
  color: #ffffff;
  flex: 1;
}

.secondary-btn:hover {
  background: #4a5064;
}

.saved-projects-list {
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(35, 39, 45, 0.7);
}

.saved-project {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.saved-project:last-child {
  border-bottom: none;
}

.project-info {
  display: flex;
  flex-direction: column;
}

.project-name {
  font-weight: 500;
  margin-bottom: 3px;
  color: #ffffff;
}

.project-date {
  font-size: 0.8rem;
  color: #b0b0b0;
}

.project-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  background: #3a3f4b;
  color: #ffffff;
}

.action-btn:hover {
  background: #4a5064;
}

.action-btn.delete {
  color: #ff584f;
}

.action-btn.delete:hover {
  background: rgba(255, 70, 70, 0.2);
}

.no-saved-projects {
  text-align: center;
  color: #a0a0a0;
  padding: 20px 0;
}

.import-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.import-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
}
</style> 