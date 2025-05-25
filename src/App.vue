<script setup lang="ts">
import RoomEditor from './components/RoomEditor.vue'
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>🏠 3D Редактор IoT комнат</h1>
      <p>Создавайте и редактируйте планировку комнат, размещайте IoT-устройства</p>
    </header>

    <main class="app-main">
      <div class="editor-section">
        <!-- Встраиваемый 3D редактор -->
        <RoomEditor />
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

/* Main content */
.app-main {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Editor section */
.editor-section {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    padding: 15px 20px;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-main {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .app-header p {
    font-size: 1rem;
  }
}
</style>
