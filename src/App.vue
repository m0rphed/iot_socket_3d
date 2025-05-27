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
  
  // На мобильных устройствах закрываем меню после выбора вкладки
  if (window.innerWidth <= 768) {
    sidebarOpen.value = false
  }
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
    <!-- Overlay для мобильных устройств -->
    <div 
      v-if="sidebarOpen" 
      class="mobile-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- Боковое меню -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen, 'sidebar-closed': !sidebarOpen }">
      <div class="sidebar-header">
        <button class="menu-toggle" @click="toggleSidebar">
          <Menu :size="20" />
        </button>
        <span v-if="sidebarOpen" class="logo">🏠 Меню управления</span>
      </div>
      
      <nav class="sidebar-nav" v-show="sidebarOpen">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          :class="['nav-item', { active: activeTab === tab.id }]"
        >
          <component :is="tab.icon" :size="20" />
          <span class="nav-text">{{ tab.name }}</span>
        </button>
      </nav>
    </aside>

    <!-- Основной контент -->
    <div class="main-layout" :class="{ 'sidebar-open': sidebarOpen }">
      <!-- Хедер с кнопкой меню для мобильных -->
      <header class="header">
        <div class="header-content">
          <button class="mobile-menu-toggle" @click="toggleSidebar">
            <Menu :size="20" />
          </button>
          <div class="header-text">
            <h1>Управление smart розетками</h1>
            <p>Управляйте домом с помощью 3D-редактора, контролируйте ⚡ устройств</p>
          </div>
        </div>
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
  position: relative;
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #1a202c;
  border-right: 1px solid #2d3748;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1000;
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
  flex-shrink: 0;
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
  overflow: hidden;
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
  min-height: 60px;
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  width: 100%;
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.mobile-menu-toggle:hover {
  background: #2d3748;
  color: #63b3ed;
}

.header-text {
  flex: 1;
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

/* Desktop - collapsed sidebar */
@media (min-width: 769px) {
  .sidebar.sidebar-closed {
    width: 60px;
  }
  
  .sidebar.sidebar-closed .logo {
    display: none;
  }
  
  .sidebar.sidebar-closed .nav-item {
    justify-content: center;
    padding: 12px 8px;
  }
  
  .sidebar.sidebar-closed .nav-text {
    display: none;
  }
}

/* Tablet and Mobile */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
  }
  
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
  
  .sidebar.sidebar-closed {
    width: 240px;
    transform: translateX(-100%);
  }
  
  .mobile-overlay {
    display: block;
  }
  
  .main-layout {
    margin-left: 0;
    width: 100%;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .header-content {
    padding: 12px 16px;
  }
  
  .header h1 {
    font-size: 1.125rem;
  }
  
  .header p {
    display: none;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .sidebar {
    width: 280px;
  }
  
  .header-content {
    padding: 8px 12px;
  }
  
  .header h1 {
    font-size: 1rem;
  }
}

/* Very small screens */
@media (max-width: 360px) {
  .sidebar {
    width: 100vw;
  }
}
</style>
