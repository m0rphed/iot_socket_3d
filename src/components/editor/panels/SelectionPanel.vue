<template>
  <div class="selection-panel">
    <div class="selection-info">
      <span class="selection-count">Выделено объектов: {{ selectedObjectsCount }}</span>
      <div class="selection-types">
        <span v-if="getSelectedTypeCount('socket') > 0">Розетки: {{ getSelectedTypeCount('socket') }}</span>
        <span v-if="getSelectedTypeCount('door') > 0">Двери: {{ getSelectedTypeCount('door') }}</span>
      </div>
    </div>
    
    <!-- Панель свойств для розеток (показывается только если выделена одна розетка) -->
    <div v-if="selectedObjectsCount === 1 && getSelectedTypeCount('socket') === 1" class="socket-properties">
      <h3>Свойства розетки</h3>
      <div class="property-group">
        <label for="socketName">Название:</label>
        <input 
          type="text" 
          id="socketName" 
          v-model="selectedSocketProperties.name" 
          @change="updateSocketName"
        />
      </div>
      
      <div class="property-group">
        <label for="socketType">Тип устройства:</label>
        <select 
          id="socketType" 
          v-model="selectedSocketProperties.deviceType"
          @change="updateSocketType"
        >
          <option v-for="type in socketDeviceTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>
      
      <div class="property-group">
        <label>Состояние:</label>
        <div class="toggle-switch">
          <input 
            type="checkbox" 
            id="socketPower" 
            v-model="selectedSocketProperties.isOn"
            @change="toggleSocketPower"
          />
          <label for="socketPower">{{ selectedSocketProperties.isOn ? 'Включено' : 'Выключено' }}</label>
        </div>
      </div>
      
      <div class="property-group">
        <label for="socketPowerConsumption">Потребление (Вт):</label>
        <input 
          type="number" 
          id="socketPowerConsumption" 
          v-model="selectedSocketProperties.powerConsumption" 
          @change="updateSocketPowerConsumption"
          min="0" 
          max="5000"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SocketDeviceType } from '../../../core/objects/Socket'

// Определяем пропсы
const props = defineProps<{
  selectedObjectsCount: number,
  selectedSocketProperties: {
    name: string,
    deviceType: SocketDeviceType,
    isOn: boolean,
    powerConsumption: number
  },
  getSelectedTypeCount: (type: string) => number
}>()

// Определяем эмиты
const emit = defineEmits<{
  (e: 'update-socket-name'): void,
  (e: 'update-socket-type'): void,
  (e: 'toggle-socket-power'): void,
  (e: 'update-socket-power-consumption'): void
}>()

// Типы устройств для розеток
const socketDeviceTypes = [
  { value: SocketDeviceType.POWER, label: 'Электропитание' },
  { value: SocketDeviceType.LIGHT, label: 'Освещение' },
  { value: SocketDeviceType.CLIMATE, label: 'Климат-контроль' },
  { value: SocketDeviceType.SECURITY, label: 'Безопасность' },
  { value: SocketDeviceType.MEDIA, label: 'Медиа-устройство' }
]

// Методы для обновления свойств розетки
const updateSocketName = () => {
  emit('update-socket-name')
}

const updateSocketType = () => {
  emit('update-socket-type')
}

const toggleSocketPower = () => {
  emit('toggle-socket-power')
}

const updateSocketPowerConsumption = () => {
  emit('update-socket-power-consumption')
}
</script>

<style scoped>
.selection-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(40, 44, 52, 0.85);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 350px;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.selection-info {
  margin-bottom: 10px;
}

.selection-count {
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
  color: #ffffff;
}

.selection-types {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selection-types span {
  background: #3a3f4b;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #ffffff;
}

/* Стили для панели свойств */
.socket-properties {
  margin-top: 10px;
  padding: 10px;
  background: rgba(45, 50, 60, 0.8);
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.socket-properties h3 {
  color: #ffffff;
}

.property-group {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.property-group label {
  flex: 0 0 120px;
  font-size: 0.9rem;
  color: #e0e0e0;
}

.property-group input[type="text"],
.property-group input[type="number"],
.property-group select {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #555;
  background: #2a2e36;
  color: #ffffff;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Стили для переключателя */
.toggle-switch {
  position: relative;
  display: inline-block;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: relative;
  display: inline-block;
  padding-left: 50px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch label:before {
  content: '';
  position: absolute;
  left: 0;
  top: -2px;
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  transition: 0.3s;
}

.toggle-switch label:after {
  content: '';
  position: absolute;
  left: 3px;
  top: 1px;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + label:before {
  background: #4cd964;
}

.toggle-switch input:checked + label:after {
  left: 23px;
}
</style> 