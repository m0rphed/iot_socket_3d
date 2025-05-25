<script setup lang="ts">
import { ref } from 'vue'
import { useIoTStore } from './stores/iot'
import RoomEditor from './components/RoomEditor.vue'
import IoTMonitoring from './components/IoTMonitoring.vue'
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
        <RoomEditor />
      </div>

      <!-- Вкладка Мониторинг -->
      <div v-show="activeTab === 'monitoring'" class="tab-content">
        <IoTMonitoring />
      </div>

      <!-- Вкладка Галерея -->
      <div v-show="activeTab === 'gallery'" class="tab-content">
        <div class="gallery-placeholder">
          <Image :size="64" class="placeholder-icon" />
          <h2>Галерея проектов</h2>
          <p>Здесь будет слайдер с проектами</p>
        </div>
      </div>

      <!-- Вкладка Настройки -->
      <div v-show="activeTab === 'settings'" class="tab-content">
        <div class="settings-placeholder">
          <Settings :size="64" class="placeholder-icon" />
          <h2>Настройки системы</h2>
          <p>Здесь будет форма с валидацией</p>
        </div>
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

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 40px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.app-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.app-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
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
}

.tab-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 600px;
  position: relative;
}

.tab-content[style*="display: none"] {
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Placeholder styles */
.gallery-placeholder,
.settings-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 60px 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 500px;
}

.placeholder-icon {
  margin-bottom: 20px;
  opacity: 0.5;
  color: #7f8c8d;
}

.gallery-placeholder h2,
.settings-placeholder h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.gallery-placeholder p,
.settings-placeholder p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    padding: 15px 20px;
  }
  
  .app-header h1 {
    font-size: 2rem;
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
  }
  
  .app-main {
    padding: 15px;
  }
  
  .gallery-placeholder,
  .settings-placeholder {
    padding: 40px 20px;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .app-header p {
    font-size: 1rem;
  }
  
  .tab-button span {
    display: none;
  }
  
  .tab-button {
    padding: 12px 15px;
  }
}
</style>
