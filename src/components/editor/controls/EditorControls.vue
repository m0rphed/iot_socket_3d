<template>
  <div class="editor-controls">
    <!-- Основные режимы -->
    <div class="main-modes">
      <button @click="$emit('set-mode', 'room')" :class="{ active: currentMode === 'room' }">
        Режим комнат
      </button>
      <button @click="$emit('set-mode', 'object')" :class="{ active: currentMode === 'object' }">
        Режим объектов
      </button>
    </div>
    
    <!-- Настройки для режима комнат -->
    <div v-if="currentMode === 'room'" class="mode-controls">
      <div class="wall-height-control">
        <label>Высота стен:</label>
        <input 
          type="range" 
          v-model.number="wallHeight" 
          min="2" 
          max="4" 
          step="0.1"
          @input="$emit('update-wall-height', Number(wallHeight))"
        >
        <span>{{ wallHeight }}м</span>
      </div>
      
      <!-- Если не в режиме создания, показываем кнопку начала создания -->
      <button v-if="!isCreatingRoom" @click="$emit('start-room-creation')" class="action-button">
        Начать создание комнаты
      </button>
      
      <!-- Если в режиме создания, показываем инструкции и кнопку отмены -->
      <div v-else class="creation-instructions">
        <div class="creation-step">
          <span v-if="!roomStartPoint">1. Выберите первую точку комнаты</span>
          <span v-else>2. Выберите вторую точку комнаты</span>
        </div>
        <button @click="$emit('cancel-room-creation')" class="cancel-button">
          Отменить создание
        </button>
      </div>
    </div>
    
    <!-- Настройки для режима объектов -->
    <div v-if="currentMode === 'object'" class="mode-controls">
      <!-- Подрежимы для режима объектов -->
      <div class="submodes">
        <button @click="$emit('set-select-mode', false)" :class="{ active: !isSelectMode }">
          Добавление объектов
        </button>
        <button @click="$emit('set-select-mode', true)" :class="{ active: isSelectMode }">
          Выделение объектов
        </button>
      </div>
      
      <!-- Типы объектов, доступно только если не в режиме выделения -->
      <div v-if="!isSelectMode" class="object-controls">
        <button @click="$emit('set-object-type', 'socket')" :class="{ active: selectedObjectType === 'socket' }">
          Добавить розетку
        </button>
        <button @click="$emit('set-object-type', 'door')" :class="{ active: selectedObjectType === 'door' }">
          Добавить дверь
        </button>
      </div>
      
      <!-- Кнопка удаления, доступна только в режиме выделения и если есть выделенные объекты -->
      <div v-if="isSelectMode" class="action-controls">
        <button 
          @click="$emit('delete-selected-objects')" 
          :disabled="selectedObjectsCount === 0"
          :class="{ 'disabled': selectedObjectsCount === 0, 'delete-button': true }">
          Удалить
        </button>
      </div>
    </div>
    
    <!-- Кнопки Debug, IoT дашборд и новые кнопки сохранения/загрузки -->
    <div class="control-buttons">
      <button @click="$emit('toggle-debug')" :class="{ active: debugMode }">
        Debug
      </button>
      
      <button @click="$emit('toggle-iot-dashboard')" :class="{ active: showIoTDashboard }">
        Панель IoT
      </button>
      
      <div class="save-load-buttons">
        <button @click="$emit('toggle-save-menu')" :class="{ active: showSaveMenu }">
          Сохранить
        </button>
        <button @click="$emit('toggle-load-menu')" :class="{ active: showLoadMenu }">
          Загрузить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WallObjectType } from '../../../core/objects/WallObject'

// Определяем пропсы
const props = defineProps<{
  currentMode: 'room' | 'object',
  wallHeight: number,
  isCreatingRoom: boolean,
  roomStartPoint: THREE.Vector3 | null,
  isSelectMode: boolean,
  selectedObjectType: WallObjectType,
  selectedObjectsCount: number,
  debugMode: boolean,
  showIoTDashboard: boolean,
  showSaveMenu: boolean,
  showLoadMenu: boolean
}>()

// Определяем эмиты
const emit = defineEmits<{
  (e: 'set-mode', mode: 'room' | 'object'): void,
  (e: 'update-wall-height', value: number): void,
  (e: 'start-room-creation'): void,
  (e: 'cancel-room-creation'): void,
  (e: 'set-select-mode', value: boolean): void,
  (e: 'set-object-type', type: WallObjectType): void,
  (e: 'delete-selected-objects'): void,
  (e: 'toggle-debug'): void,
  (e: 'toggle-iot-dashboard'): void,
  (e: 'toggle-save-menu'): void,
  (e: 'toggle-load-menu'): void
}>()

// Локальная копия wallHeight для двусторонней привязки
const wallHeight = ref(props.wallHeight)

// Обновляем локальный wallHeight при изменении пропса
watch(() => props.wallHeight, (newVal) => {
  wallHeight.value = newVal
})
</script>

<style scoped>
.editor-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(40, 44, 52, 0.85);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.main-modes {
  display: flex;
  gap: 10px;
}

.main-modes button {
  flex: 1;
  font-weight: bold;
  background: #3a3f4b;
  color: #ffffff;
}

.mode-controls {
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.submodes {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.submodes button {
  flex: 1;
  background: #3a3f4b;
  color: #ffffff;
}

button {
  margin: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #3a3f4b;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.3s, transform 0.1s;
  font-weight: 500;
}

button:hover {
  background: #4a5064;
}

button:active {
  transform: scale(0.98);
}

button.active {
  background: #2196f3;
  color: white;
}

button:disabled,
button.disabled {
  background: #2a2e36;
  color: #6c7280;
  cursor: not-allowed;
  opacity: 0.7;
}

button:disabled:hover,
button.disabled:hover {
  background: #2a2e36;
  transform: none;
}

.wall-height-control {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
}

.wall-height-control span {
  color: #ffffff;
  font-weight: 500;
}

.object-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input[type="range"] {
  width: 150px;
  accent-color: #2196f3;
}

.delete-button {
  background: #ff3b30;
  color: white;
}

.delete-button:hover {
  background: #ff584f;
}

.action-controls {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.action-button {
  background: #4CAF50;
  color: white;
  font-weight: bold;
}

.action-button:hover {
  background: #45a049;
}

.cancel-button {
  background: #f44336;
  color: white;
  margin-left: 10px;
}

.cancel-button:hover {
  background: #d32f2f;
}

.creation-instructions {
  margin-top: 10px;
  padding: 10px;
  background: rgba(45, 50, 60, 0.7);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
}

.creation-step {
  font-weight: bold;
  color: #42a5f5;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.save-load-buttons {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.save-load-buttons button {
  flex: 1;
  background: #3a3f4b;
}
</style> 