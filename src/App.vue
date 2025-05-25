<script setup lang="ts">
import { ref } from 'vue'
import { useIoTStore } from './stores/iot'
import RoomEditor from './components/RoomEditor.vue'
import IoTMonitoring from './components/IoTMonitoring.vue'
import ProjectGallery from './components/ProjectGallery.vue'
import SettingsForm from './components/SettingsForm.vue'
import { Home, Monitor, Image, Settings, Menu } from 'lucide-vue-next'

const iotStore = useIoTStore()

// Управление вкладками
const activeTab = ref('editor')
const sidebarOpen = ref(true)

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

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// Ссылка на компонент RoomEditor для загрузки проектов
const roomEditorRef = ref<InstanceType<typeof RoomEditor> | null>(null)

// Обработчик загрузки проекта из галереи
const handleLoadProjectFromGallery = (projectData: any) => {
  setActiveTab('editor')
  if (roomEditorRef.value && roomEditorRef.value.loadProjectData) {
    roomEditorRef.value.loadProjectData(projectData)
  }
}
</script>

<template>
  <div class="app">
    <!-- Боковое меню -->
    <aside class="sidebar" :class="{ collapsed: !sidebarOpen }">
      <div class="sidebar-header">
        <button class="menu-toggle" @click="toggleSidebar">
          <Menu :size="20" />
        </button>
        <span v-if="sidebarOpen" class="logo">🏠 IoT Dashboard</span>
      </div>
      
      <nav class="sidebar-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          :class="['nav-item', { active: activeTab === tab.id }]"
        >
          <component :is="tab.icon" :size="20" />
          <span v-if="sidebarOpen" class="nav-text">{{ tab.name }}</span>
        </button>
      </nav>
    </aside>

    <!-- Основной контент -->
    <div class="main-layout" :class="{ 'sidebar-collapsed': !sidebarOpen }">
      <!-- Хедер -->
      <header class="header">
        <h1>3D Редактор IoT комнат</h1>
        <p>Создавайте и редактируйте планировку комнат, размещайте IoT-устройства</p>
      </header>

      <!-- Контент -->
      <main class="content">
        <RoomEditor v-show="activeTab === 'editor'" ref="roomEditorRef" />
        <IoTMonitoring v-show="activeTab === 'monitoring'" />
        <ProjectGallery v-show="activeTab === 'gallery'" @loadProject="handleLoadProjectFromGallery" />
        <SettingsForm v-show="activeTab === 'settings'" />
      </main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #0f1419;
  color: #e2e8f0;
  overflow: hidden;
}

.app {
  display: flex;
  height: 100vh;
  background: #0f1419;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #1a202c;
  border-right: 1px solid #2d3748;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #2d3748;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
}

.menu-toggle {
  background: transparent;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-toggle:hover {
  background: #2d3748;
  color: #63b3ed;
}

.logo {
  font-weight: 600;
  color: #f7fafc;
  font-size: 0.9rem;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 8px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: none;
  background: transparent;
  color: #a0aec0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  margin-bottom: 4px;
  font-size: 0.875rem;
  text-align: left;
}

.nav-item:hover {
  background: #2d3748;
  color: #f7fafc;
}

.nav-item.active {
  background: #3182ce;
  color: white;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px 8px;
}

.nav-text {
  white-space: nowrap;
}

/* Main Layout */
.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.header {
  background: #1a202c;
  border-bottom: 1px solid #2d3748;
  padding: 16px 24px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f7fafc;
  margin-bottom: 4px;
}

.header p {
  font-size: 0.875rem;
  color: #a0aec0;
}

.content {
  flex: 1;
  background: #0f1419;
  overflow: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .main-layout {
    margin-left: 0;
  }
  
  .header {
    padding: 12px 16px;
  }
  
  .header h1 {
    font-size: 1.125rem;
  }
  
  .header p {
    display: none;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100%;
  }
  
  .header {
    padding: 8px 12px;
  }
  
  .header h1 {
    font-size: 1rem;
  }
}
</style>
