<script setup lang="ts">
import { ref } from 'vue'
import { useIoTStore } from './stores/iot'
import RoomEditor from './components/RoomEditor.vue'
import IoTMonitoring from './components/IoTMonitoring.vue'
import ProjectGallery from './components/ProjectGallery.vue'
import SettingsForm from './components/SettingsForm.vue'
import { Home, Monitor, Image, Settings } from 'lucide-vue-next'

const iotStore = useIoTStore()

// Управление вкладками
const activeTab = ref('editor')

const tabs = [
  { id: 'editor', name: '3D Редактор', icon: Home },
  { id: 'monitoring', name: 'Мониторинг', icon: Monitor },
  { id: 'gallery', name: 'Галерея', icon: Image },
  { id: 'settings', name: 'Настройки', icon: Settings }
]

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  iotStore.setCurrentTab(tabId)
}

// Ссылка на компонент RoomEditor для загрузки проектов
const roomEditorRef = ref<InstanceType<typeof RoomEditor> | null>(null)

// Обработчик загрузки проекта из галереи
const handleLoadProjectFromGallery = (projectData: any) => {
  // Переключаемся на вкладку редактора
  setActiveTab('editor')
  
  // Загружаем проект в редактор
  if (roomEditorRef.value && roomEditorRef.value.loadProjectData) {
    roomEditorRef.value.loadProjectData(projectData)
  } else {
    console.warn('RoomEditor не готов для загрузки проекта')
  }
}
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>🏠 3D Редактор IoT комнат</h1>
      <p>Создавайте и редактируйте планировку комнат, размещайте IoT-устройства</p>
    </header>

    <!-- Навигация по вкладкам -->
    <nav class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="setActiveTab(tab.id)"
        :class="['tab-button', { active: activeTab === tab.id }]"
      >
        <component :is="tab.icon" :size="20" />
        <span>{{ tab.name }}</span>
      </button>
    </nav>

    <main class="app-main">
      <!-- Вкладка 3D Редактор -->
      <div v-show="activeTab === 'editor'" class="tab-content">
        <RoomEditor ref="roomEditorRef" />
      </div>

      <!-- Вкладка Мониторинг -->
      <div v-show="activeTab === 'monitoring'" class="tab-content">
        <IoTMonitoring />
      </div>

      <!-- Вкладка Галерея -->
      <div v-show="activeTab === 'gallery'" class="tab-content">
        <ProjectGallery @loadProject="handleLoadProjectFromGallery" />
      </div>

      <!-- Вкладка Настройки -->
      <div v-show="activeTab === 'settings'" class="tab-content">
        <SettingsForm />
      </div>
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 40px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
}

.app-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 600;
  word-wrap: break-word;
}

.app-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  word-wrap: break-word;
}

/* Tab Navigation */
.tab-navigation {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 0 20px;
  display: flex;
  justify-content: center;
  gap: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 25px;
  border: none;
  background: transparent;
  color: #7f8c8d;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-button:hover {
  color: #2c3e50;
  background: rgba(52, 152, 219, 0.05);
}

.tab-button.active {
  color: #2c3e50;
  border-bottom-color: #3498db;
  background: rgba(52, 152, 219, 0.1);
}

.tab-button span {
  font-weight: 500;
}

/* Main content */
.app-main {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.tab-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 600px;
  overflow-x: hidden;
}

.tab-content[style*="display: none"] {
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Responsive design - 3 контрольные точки согласно требованиям */

/* Контрольная точка 1200px - большие экраны */
@media (max-width: 1200px) {
  .app-header h1 {
    font-size: 2.2rem;
  }
  
  .tab-content {
    max-width: 1000px;
  }
}

/* Контрольная точка 800px - планшеты */
@media (max-width: 800px) {
  .app-header {
    padding: 15px 20px;
  }
  
  .app-header h1 {
    font-size: 1.8rem;
  }
  
  .app-header p {
    font-size: 1rem;
  }
  
  .tab-navigation {
    padding: 0 10px;
    overflow-x: auto;
    justify-content: flex-start;
  }
  
  .tab-button {
    padding: 12px 20px;
    font-size: 0.9rem;
    white-space: nowrap;
    min-width: 120px;
  }
  
  .app-main {
    padding: 15px;
  }
  
  .tab-content {
    max-width: 100%;
  }
}

/* Контрольная точка 550px - мобильные устройства */
@media (max-width: 550px) {
  .app-header {
    padding: 12px 10px;
  }
  
  .app-header h1 {
    font-size: 1.3rem;
    margin-bottom: 8px;
    line-height: 1.2;
  }
  
  .app-header p {
    font-size: 0.85rem;
    padding: 0 5px;
  }
  
  .tab-navigation {
    padding: 0 5px;
    justify-content: flex-start;
  }
  
  .tab-button {
    padding: 12px 8px;
    font-size: 0.75rem;
    min-width: 60px;
    flex-direction: column;
    gap: 4px;
  }
  
  .tab-button span {
    display: none;
  }
  
  .app-main {
    padding: 10px 5px;
  }
  
  .tab-content {
    width: 100%;
    max-width: 100%;
    padding: 0;
  }
}
</style>
