<template>
  <div class="iot-dashboard">
    <div class="dashboard-header">
      <h2>Панель управления IoT-устройствами</h2>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    
    <div class="dashboard-content">
      <div class="dashboard-summary">
        <div class="summary-item">
          <span class="summary-value">{{ getTotalSocketsCountLocal() }}</span>
          <span class="summary-label">Всего устройств</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ getActiveSocketsCountLocal() }}</span>
          <span class="summary-label">Активных</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ getTotalPowerConsumptionLocal() }} Вт</span>
          <span class="summary-label">Общее потребление</span>
        </div>
      </div>
      
      <div class="dashboard-filters">
        <div class="filter-item">
          <label for="deviceTypeFilter">Фильтр по типу:</label>
          <select id="deviceTypeFilter" v-model="iotDashboardFilter.deviceType">
            <option value="all">Все типы</option>
            <option v-for="type in socketDeviceTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>Состояние:</label>
          <div class="filter-buttons">
            <button 
              @click="iotDashboardFilter.state = 'all'" 
              :class="{ active: iotDashboardFilter.state === 'all' }"
            >
              Все
            </button>
            <button 
              @click="iotDashboardFilter.state = 'on'" 
              :class="{ active: iotDashboardFilter.state === 'on' }"
            >
              Вкл
            </button>
            <button 
              @click="iotDashboardFilter.state = 'off'" 
              :class="{ active: iotDashboardFilter.state === 'off' }"
            >
              Выкл
            </button>
          </div>
        </div>
      </div>
      
      <div class="device-list">
        <div v-if="getFilteredSocketsLocal().length === 0" class="no-devices">
          <p>Нет устройств, соответствующих фильтрам</p>
        </div>
        
        <div 
          v-for="socket in getFilteredSocketsLocal()" 
          :key="socket.getId()" 
          class="device-item"
          :class="{ 'device-active': socket.getIsOn() }"
        >
          <div class="device-icon" :class="'device-type-' + socket.getDeviceType()">
            <div class="device-status-indicator" :class="{ 'on': socket.getIsOn() }"></div>
          </div>
          <div class="device-info">
            <div class="device-name">{{ socket.getName() }}</div>
            <div class="device-details">
              <span class="device-type">{{ getDeviceTypeLabel(socket.getDeviceType()) }}</span>
              <span class="device-consumption">{{ socket.getPowerConsumption() }} Вт</span>
            </div>
          </div>
          <div class="device-controls">
            <button class="device-toggle-btn" @click="updateDeviceState(socket)">
              {{ socket.getIsOn() ? 'Выкл' : 'Вкл' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIoTDashboard } from '../../../composables/useIoTDashboard'

// Определяем пропсы
const props = defineProps<{
  rooms: any[]
}>()

// Определяем эмиты
const emit = defineEmits<{
  (e: 'close'): void
}>()

// Используем composable для IoT дашборда
const {
  iotDashboardFilter,
  socketDeviceTypes,
  getFilteredSockets,
  getDeviceTypeLabel,
  toggleDeviceFromDashboard,
  getTotalSocketsCount,
  getActiveSocketsCount,
  getTotalPowerConsumption
} = useIoTDashboard()

// Привязываем функции к комнатам из пропсов
const getFilteredSocketsLocal = () => getFilteredSockets(props.rooms)
const getTotalSocketsCountLocal = () => getTotalSocketsCount(props.rooms)
const getActiveSocketsCountLocal = () => getActiveSocketsCount(props.rooms)
const getTotalPowerConsumptionLocal = () => getTotalPowerConsumption(props.rooms)

// Метод для принудительного обновления состояния розеток
const updateDeviceState = (socket: any) => {
  console.log('Переключаем устройство из дашборда:', socket.getName())
  toggleDeviceFromDashboard(socket)
  // Принудительно обновляем представление
  setTimeout(() => {
    // Повторно получаем данные
    getFilteredSocketsLocal()
    getTotalSocketsCountLocal()
    getActiveSocketsCountLocal()
    getTotalPowerConsumptionLocal()
  }, 100)
}

// Экспортируем метод для внешнего доступа
defineExpose({
  getFilteredSocketsLocal,
  getTotalSocketsCountLocal,
  getActiveSocketsCountLocal,
  getTotalPowerConsumptionLocal,
  updateDeviceState
})
</script>

<style scoped>
.iot-dashboard {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  background: rgba(40, 44, 52, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.dashboard-header {
  padding: 15px;
  background: #1976d2;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h2 {
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

.dashboard-content {
  padding: 15px;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
  color: #ffffff;
}

.dashboard-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42a5f5;
}

.summary-label {
  font-size: 0.8rem;
  color: #e0e0e0;
  margin-top: 5px;
}

.dashboard-filters {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item label {
  font-size: 0.9rem;
  color: #e0e0e0;
}

.filter-item select {
  padding: 5px 8px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 150px;
  background: #2a2e36;
  color: #ffffff;
}

.filter-buttons {
  display: flex;
  gap: 5px;
}

.filter-buttons button {
  padding: 5px 10px;
  font-size: 0.8rem;
  margin: 0;
  background: #3a3f4b;
  color: #ffffff;
}

.filter-buttons button:hover {
  background: #4a5064;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-devices {
  padding: 20px 0;
  text-align: center;
  color: #a0a0a0;
}

.device-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(45, 50, 60, 0.7);
  border-radius: 8px;
  gap: 12px;
}

.device-active {
  background: rgba(76, 217, 100, 0.15);
  border-left: 3px solid #4cd964;
}

.device-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3a3f4b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.device-status-indicator {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #555;
  border: 2px solid #2a2e36;
}

.device-status-indicator.on {
  background: #4cd964;
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: 500;
  margin-bottom: 3px;
  color: #ffffff;
}

.device-details {
  font-size: 0.8rem;
  color: #b0b0b0;
  display: flex;
  gap: 10px;
}

.device-controls {
  display: flex;
  gap: 5px;
}

.device-toggle-btn {
  padding: 5px 10px;
  font-size: 0.8rem;
  margin: 0;
  background: #3a3f4b;
  color: #ffffff;
}

.device-toggle-btn:hover {
  background: #4a5064;
}

/* Стили для разных типов устройств */
.device-type-0 {
  background: rgba(70, 70, 70, 0.3);
}

.device-type-1 {
  background: rgba(255, 204, 0, 0.2);
}

.device-type-2 {
  background: rgba(0, 204, 255, 0.2);
}

.device-type-3 {
  background: rgba(255, 50, 50, 0.2);
}

.device-type-4 {
  background: rgba(153, 50, 204, 0.2);
}
</style> 