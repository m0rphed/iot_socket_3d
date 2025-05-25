<script setup lang="ts">
import RoomEditor from './components/RoomEditor.vue'
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>🏠 Система управления умным домом</h1>
      <p>Платформа для проектирования и управления IoT-устройствами в жилых помещениях</p>
    </header>

    <main class="app-main">
      <div class="dashboard-section">
        <div class="info-cards">
          <div class="info-card">
            <h3>📊 Статистика системы</h3>
            <div class="stats">
              <div class="stat-item">
                <span class="stat-value">5</span>
                <span class="stat-label">Комнат</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">23</span>
                <span class="stat-label">Устройств</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">1.2кВт</span>
                <span class="stat-label">Потребление</span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <h3>🎛️ Быстрое управление</h3>
            <div class="quick-controls">
              <button class="control-btn">💡 Весь свет</button>
              <button class="control-btn">🔥 Отопление</button>
              <button class="control-btn">🔒 Безопасность</button>
              <button class="control-btn">🌡️ Климат</button>
            </div>
          </div>

          <div class="info-card">
            <h3>📈 Активность</h3>
            <div class="activity-list">
              <div class="activity-item">
                <span class="activity-time">14:32</span>
                <span class="activity-text">Включена розетка в спальне</span>
              </div>
              <div class="activity-item">
                <span class="activity-time">13:45</span>
                <span class="activity-text">Изменена температура в гостиной</span>
              </div>
              <div class="activity-item">
                <span class="activity-time">12:18</span>
                <span class="activity-text">Выключено освещение на кухне</span>
              </div>
            </div>
          </div>
        </div>

        <div class="editor-section">
          <div class="section-header">
            <h2>🏗️ 3D Редактор планировки</h2>
            <p>Создавайте и редактируйте планировку комнат, размещайте IoT-устройства</p>
          </div>
          
          <!-- Встраиваемый 3D редактор -->
          <div class="editor-container">
            <RoomEditor />
          </div>
        </div>
      </div>

      <aside class="sidebar">
        <div class="widget">
          <h3>🌤️ Погода</h3>
          <div class="weather-info">
            <div class="weather-main">
              <span class="temperature">22°C</span>
              <span class="condition">Солнечно</span>
            </div>
            <div class="weather-details">
              <span>Влажность: 45%</span>
              <span>Ветер: 5 м/с</span>
            </div>
          </div>
        </div>

        <div class="widget">
          <h3>⚡ Энергопотребление</h3>
          <div class="energy-chart">
            <div class="energy-bar" style="height: 60%">
              <span class="energy-label">Кухня</span>
            </div>
            <div class="energy-bar" style="height: 40%">
              <span class="energy-label">Спальня</span>
            </div>
            <div class="energy-bar" style="height: 80%">
              <span class="energy-label">Гостиная</span>
            </div>
            <div class="energy-bar" style="height: 30%">
              <span class="energy-label">Ванная</span>
            </div>
          </div>
        </div>

        <div class="widget">
          <h3>🔔 Уведомления</h3>
          <div class="notifications">
            <div class="notification">
              <span class="notification-icon">⚠️</span>
              <span class="notification-text">Высокое потребление в гостиной</span>
            </div>
            <div class="notification">
              <span class="notification-icon">✅</span>
              <span class="notification-text">Система безопасности активна</span>
            </div>
            <div class="notification">
              <span class="notification-icon">🔋</span>
              <span class="notification-text">Батарея датчика: 15%</span>
            </div>
          </div>
        </div>
      </aside>
    </main>

    <footer class="app-footer">
      <p>&copy; 2025 Smart Home System. Разработано для демонстрации возможностей 3D редактора IoT.</p>
    </footer>
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
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Info cards */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-card h3 {
  color: #2c3e50;
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 5px;
}

.quick-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.control-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ecf0f1;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  color: #3498db;
  font-weight: 500;
  min-width: 60px;
}

.activity-text {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Editor section */
.editor-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 8px;
  font-weight: 600;
}

.section-header p {
  color: #7f8c8d;
  font-size: 1rem;
}

.editor-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 600px;
}

/* Sidebar */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.widget {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.widget h3 {
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.weather-info {
  text-align: center;
}

.weather-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 15px;
}

.temperature {
  font-size: 2.5rem;
  font-weight: bold;
  color: #f39c12;
}

.condition {
  color: #7f8c8d;
  font-size: 1rem;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9rem;
  color: #95a5a6;
}

.energy-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 120px;
  margin-top: 10px;
}

.energy-bar {
  width: 30px;
  background: linear-gradient(180deg, #e74c3c, #c0392b);
  border-radius: 4px 4px 0 0;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 5px;
}

.energy-label {
  color: white;
  font-size: 0.7rem;
  font-weight: 500;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.notifications {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: rgba(52, 152, 219, 0.1);
  border-left: 3px solid #3498db;
}

.notification-icon {
  font-size: 1.2rem;
}

.notification-text {
  font-size: 0.9rem;
  color: #2c3e50;
}

/* Footer */
.app-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* Responsive design */
@media (max-width: 1200px) {
  .app-main {
    grid-template-columns: 1fr;
    max-width: 100%;
  }
  
  .sidebar {
    grid-row: 1;
    flex-direction: row;
    overflow-x: auto;
  }
  
  .widget {
    min-width: 250px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 15px 20px;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-main {
    padding: 15px;
    gap: 15px;
  }
  
  .info-cards {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    flex-direction: column;
  }
  
  .widget {
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .app-header p {
    font-size: 1rem;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
  }
  
  .quick-controls {
    grid-template-columns: 1fr;
  }
}
</style>
