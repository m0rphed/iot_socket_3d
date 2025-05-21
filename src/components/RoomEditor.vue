<template>
  <div class="room-editor">
    <div ref="container" class="editor-container"></div>
    <div class="editor-controls">
      <!-- Основные режимы -->
      <div class="main-modes">
        <button @click="setMode('room')" :class="{ active: currentMode === 'room' }">
          Режим комнат
        </button>
        <button @click="setMode('object')" :class="{ active: currentMode === 'object' }">
          Режим объектов
        </button>
      </div>
      
      <!-- Настройки для режима комнат -->
      <div v-if="currentMode === 'room'" class="mode-controls">
        <div class="wall-height-control">
          <label>Высота стен:</label>
          <input 
            type="range" 
            v-model="wallHeight" 
            min="2" 
            max="4" 
            step="0.1"
            @input="updateWallHeight"
          >
          <span>{{ wallHeight }}м</span>
        </div>
        
        <!-- Если не в режиме создания, показываем кнопку начала создания -->
        <button v-if="!isCreatingRoom" @click="startRoomCreation" class="action-button">
          Начать создание комнаты
        </button>
        
        <!-- Если в режиме создания, показываем инструкции и кнопку отмены -->
        <div v-else class="creation-instructions">
          <div class="creation-step">
            <span v-if="!roomStartPoint">1. Выберите первую точку комнаты</span>
            <span v-else>2. Выберите вторую точку комнаты</span>
          </div>
          <button @click="cancelRoomCreation" class="cancel-button">
            Отменить создание
          </button>
        </div>
      </div>
      
      <!-- Настройки для режима объектов -->
      <div v-if="currentMode === 'object'" class="mode-controls">
        <!-- Подрежимы для режима объектов -->
        <div class="submodes">
          <button @click="setSelectMode(false)" :class="{ active: !isSelectMode }">
            Добавление объектов
          </button>
          <button @click="setSelectMode(true)" :class="{ active: isSelectMode }">
            Выделение объектов
          </button>
        </div>
        
        <!-- Типы объектов, доступно только если не в режиме выделения -->
        <div v-if="!isSelectMode" class="object-controls">
          <button @click="setObjectType('socket')" :class="{ active: selectedObjectType === 'socket' }">
            Добавить розетку
          </button>
          <button @click="setObjectType('door')" :class="{ active: selectedObjectType === 'door' }">
            Добавить дверь
          </button>
        </div>
        
        <!-- Кнопка удаления, доступна только в режиме выделения и если есть выделенные объекты -->
        <div v-if="isSelectMode" class="action-controls">
          <button 
            @click="deleteSelectedObjects()" 
            :disabled="selectedObjectsCount === 0"
            :class="{ 'disabled': selectedObjectsCount === 0, 'delete-button': true }">
            Удалить
          </button>
        </div>
      </div>
      
      <!-- Кнопки Debug, IoT дашборд и новые кнопки сохранения/загрузки -->
      <div class="control-buttons">
        <button @click="debugMode = !debugMode" :class="{ active: debugMode }">
          Debug
        </button>
        
        <button @click="showIoTDashboard = !showIoTDashboard" :class="{ active: showIoTDashboard }">
          Панель IoT
        </button>
        
        <div class="save-load-buttons">
          <button @click="toggleSaveMenu()" :class="{ active: showSaveMenu }">
            Сохранить
          </button>
          <button @click="toggleLoadMenu()" :class="{ active: showLoadMenu }">
            Загрузить
          </button>
        </div>
      </div>
    </div>
    
    <!-- Меню сохранения -->
    <div v-if="showSaveMenu" class="save-menu">
      <div class="menu-header">
        <h3>Сохранить проект</h3>
        <button class="close-btn" @click="showSaveMenu = false">×</button>
      </div>
      
      <div class="menu-content">
        <div class="input-group">
          <label for="projectName">Название проекта:</label>
          <input type="text" id="projectName" v-model="saveProjectName" placeholder="Мой проект">
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
    <div v-if="showLoadMenu" class="load-menu">
      <div class="menu-header">
        <h3>Загрузить проект</h3>
        <button class="close-btn" @click="showLoadMenu = false">×</button>
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
    
    <!-- Панель управления выделенными объектами -->
    <div v-if="currentMode === 'object' && isSelectMode && selectedObjectsCount > 0" class="selection-panel">
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
    
    <!-- IoT Дашборд -->
    <div v-if="showIoTDashboard" class="iot-dashboard">
      <div class="dashboard-header">
        <h2>Панель управления IoT-устройствами</h2>
        <button class="close-btn" @click="showIoTDashboard = false">×</button>
      </div>
      
      <div class="dashboard-content">
        <div class="dashboard-summary">
          <div class="summary-item">
            <span class="summary-value">{{ getTotalSocketsCount() }}</span>
            <span class="summary-label">Всего устройств</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">{{ getActiveSocketsCount() }}</span>
            <span class="summary-label">Активных</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">{{ getTotalPowerConsumption() }} Вт</span>
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
          <div v-if="getFilteredSockets().length === 0" class="no-devices">
            <p>Нет устройств, соответствующих фильтрам</p>
          </div>
          
          <div 
            v-for="socket in getFilteredSockets()" 
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
              <button class="device-toggle-btn" @click="toggleDeviceFromDashboard(socket)">
                {{ socket.getIsOn() ? 'Выкл' : 'Вкл' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Room as RoomClass } from '../core/objects/Room'
import { Wall } from '../core/objects/Wall'
import { Floor } from '../core/objects/Floor'
import { SceneManager } from '../core/managers/SceneManager'
import type { WallObjectType } from '../core/objects/WallObject'
import { WallObject } from '../core/objects/WallObject'
import { WALL_PARAMS, FLOOR_PARAMS, MARKER_PARAMS, DEBUG_PARAMS } from '../params/config'
import { SelectionManager } from '../core/managers/SelectionManager'
import { Socket, SocketDeviceType } from '../core/objects/Socket'
import { Door } from '../core/objects/Door'
import { DebugHelper } from '../core/utils/DebugHelper'
import { RoomFactory } from '../core/factories/RoomFactory'
import { RoomPreview } from '../core/preview/RoomPreview'

const container = ref<HTMLElement | null>(null)
const currentMode = ref<'room' | 'object'>('room')
const wallHeight = ref(2.5)
const selectedObjectType = ref<WallObjectType>('socket')
const debugMode = ref(false)
const isSelectMode = ref(false)
const selectedObjectsCount = ref(0)
let selectionMethod: 'raycast' | 'boundingBox' = 'boundingBox'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let gridHelper: THREE.GridHelper
let rooms: RoomClass[] = []
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let selectedRoom: RoomClass | null = null
let selectedMarker: THREE.Mesh | null = null
let selectedWallObject: WallObject | null = null
let isDragging = false
let isResizing = false
let dragStart = new THREE.Vector2()
let initialSize = { width: 0, height: 0 }
let debugSphere: THREE.Mesh | null = null
let debugHelper: DebugHelper
let roomPreview: RoomPreview

const selectionManager = new SelectionManager()
const sceneManager = new SceneManager()

// Связываем менеджеры между собой
selectionManager.setSceneManager(sceneManager)

// Добавляем новые переменные состояния для режима создания комнаты
const isCreatingRoom = ref(false)
const roomStartPoint = ref<THREE.Vector3 | null>(null)

// Добавляем структуру для хранения свойств выделенной розетки
const selectedSocketProperties = ref({
  name: '',
  deviceType: SocketDeviceType.POWER,
  isOn: false,
  powerConsumption: 0
})

// Типы устройств для розеток (для выпадающего списка)
const socketDeviceTypes = [
  { value: SocketDeviceType.POWER, label: 'Электропитание' },
  { value: SocketDeviceType.LIGHT, label: 'Освещение' },
  { value: SocketDeviceType.CLIMATE, label: 'Климат-контроль' },
  { value: SocketDeviceType.SECURITY, label: 'Безопасность' },
  { value: SocketDeviceType.MEDIA, label: 'Медиа-устройство' }
]

// Добавляем состояние для IoT-дашборда
const showIoTDashboard = ref(false)
const iotDashboardFilter = ref({
  deviceType: 'all',
  state: 'all'
})

// Добавляем состояние для меню сохранения/загрузки
const showSaveMenu = ref(false)
const showLoadMenu = ref(false)
const saveProjectName = ref('Мой проект')
const savedProjects = ref<{ name: string, date: number }[]>([])
const importFileInput = ref<HTMLInputElement | null>(null)

const init = () => {
  if (!container.value) return

  // Создание сцены
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)
  
  // Инициализируем предпросмотр комнаты
  roomPreview = new RoomPreview(scene)
  
  // Устанавливаем сцену в SceneManager
  sceneManager.setScene(scene)
  
  // Устанавливаем колбэк для обновления счетчика выделенных объектов
  selectionManager.setOnSelectionChangeCallback(updateSelectedObjectsCount)
  
  // Инициализируем DebugHelper
  debugHelper = new DebugHelper(scene)

  // Настройка камеры
  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(5, 5, 5)
  camera.lookAt(0, 0, 0)

  // Настройка рендерера
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  // Добавление сетки
  gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000)
  scene.add(gridHelper)

  // Настройка контролов
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // Добавление освещения
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  // Инициализация рейкастера
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // Добавление обработчиков событий
  container.value.addEventListener('mousedown', onMouseDown)
  container.value.addEventListener('mousemove', onMouseMove)
  container.value.addEventListener('mouseup', onMouseUp)

  animate()
}

const addInnerRoomObject = (type: WallObjectType, wall: Wall, pos: number, room: RoomClass) => {
  if (type === 'socket') {
    return room.addSocket(wall, pos)
  } else {
    return room.addDoor(wall, pos)
  }
}

// --- МОДИФИЦИРОВАННЫЙ onMouseDown ---
const onMouseDown = (event: MouseEvent) => {
  const rect = container.value?.getBoundingClientRect()
  if (!rect) return
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // Режим выделения объектов работает только в режиме объектов
  if (currentMode.value === 'object' && isSelectMode.value) {
    handleSelectionModeClick(event)
    return
  }

  // Режим комнат
  if (currentMode.value === 'room') {
    handleRoomModeClick(event)
    return
  }
  
  // Режим объектов
  if (currentMode.value === 'object') {
    handleObjectModeClick(event)
    return
  }
}

// Обработчик клика в режиме выделения
const handleSelectionModeClick = (event: MouseEvent) => {
  let foundWallObject: WallObject | null = null
  if (selectionMethod === 'raycast') {
    foundWallObject = selectionManager.selectObjectByRaycast(
      mouse, 
      camera, 
      selectionManager.getAllWallObjectGroups(), 
      raycaster
    )
  } else if (selectionMethod === 'boundingBox') {
    const allWallObjects = rooms.flatMap(room => room.getWallObjects())
    foundWallObject = selectionManager.selectObjectByBoundingBox(
      event, 
      camera, 
      allWallObjects, 
      container.value
    )
  }
  
  if (foundWallObject) {
    if (foundWallObject.isSelected) {
      selectionManager.deselect(foundWallObject)
    } else {
      selectionManager.select(foundWallObject)
    }
    updateSelectedObjectsCount()
  } else {
    selectionManager.clear()
    updateSelectedObjectsCount()
  }
}

// Модифицируем функцию startRoomCreation
const startRoomCreation = () => {
  // Проверяем, что мы в режиме комнат
  if (currentMode.value !== 'room') return;
  
  // Включаем режим создания комнаты
  isCreatingRoom.value = true;
  
  // Меняем курсор, чтобы пользователь видел, что он в режиме создания комнаты
  if (container.value) {
    container.value.style.cursor = 'crosshair';
  }
}

const getGridPointFromMouse = (): THREE.Vector3 | null => {
  if (!container.value) return null;
  
  // Создаем плоскость на уровне сетки
  const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  
  // Используем рейкастер для определения точки пересечения с плоскостью
  raycaster.setFromCamera(mouse, camera);
  
  // Временная переменная для хранения точки пересечения
  const intersection = new THREE.Vector3();
  
  // Проверяем пересечение луча с плоскостью
  if (raycaster.ray.intersectPlane(gridPlane, intersection)) {
    // Привязка к сетке (снаппинг)
    const gridSize = 0.5; // размер ячейки сетки
    intersection.x = Math.round(intersection.x / gridSize) * gridSize;
    intersection.z = Math.round(intersection.z / gridSize) * gridSize;
    
    return intersection;
  }
  
  return null;
}

// Модифицируем обработчик handleRoomModeClick
const handleRoomModeClick = (event: MouseEvent) => {
  // Если мы в режиме создания комнаты
  if (isCreatingRoom.value) {
    const gridPoint = getGridPointFromMouse();
    
    if (!gridPoint) return;
    
    // Если это первый клик, сохраняем начальную точку
    if (!roomStartPoint.value) {
      roomStartPoint.value = gridPoint.clone();
      return;
    }
    
    // Если это второй клик, проверяем размер комнаты
    if (!roomPreview.isSizeValid(roomStartPoint.value, gridPoint, 1)) {
      console.warn('Размер комнаты слишком мал, минимальный размер 1x1');
      return;
    }
    
    try {
      // Используем RoomFactory для создания комнаты по двум точкам
      const room = RoomFactory.createRoomFromPoints(
        roomStartPoint.value,
        gridPoint,
        wallHeight.value
      );
      
      // Добавляем комнату в сцену и другие коллекции
      scene.add(room.getObject());
      rooms.push(room);
      sceneManager.add(room);
      
      // Сбрасываем режим создания комнаты
      isCreatingRoom.value = false;
      roomStartPoint.value = null;
      roomPreview.remove();
      
      // Возвращаем курсор в нормальное состояние
      if (container.value) {
        container.value.style.cursor = 'default';
      }
    } catch (error) {
      console.error('Ошибка при создании комнаты:', error);
      cancelRoomCreation();
    }
    
    return;
  }
  
  // Стандартная обработка для режима комнат (изменение размера, перемещение)
  // Проверяем, является ли объект маркером изменения размера
  const marker = event.target as THREE.Mesh
  const room = rooms.find(room => room.getResizeMarkers().includes(marker))
  
  if (room) {
    selectedRoom = room
    selectedMarker = marker
    isResizing = true
    initialSize = room.getSize()
    controls.enabled = false
  } else {
    // Если это не маркер, проверяем, является ли объект частью комнаты
    const roomObject = event.target as THREE.Object3D
    selectedRoom = rooms.find(room => room.getObject() === roomObject) || null
    if (selectedRoom) {
      isDragging = true
      dragStart.set(mouse.x, mouse.y)
      controls.enabled = false
    }
  }
}

// Модифицируем функцию handleRoomModeHover для отображения предпросмотра при создании комнаты
const handleRoomModeHover = (event: MouseEvent) => {
  if (isCreatingRoom.value) {
    const gridPoint = getGridPointFromMouse();
    
    if (!gridPoint) {
      // Если не удалось получить точку на сетке, скрываем предпросмотр
      roomPreview.remove();
      return;
    }
    
    // Если есть начальная точка, обновляем предпросмотр
    if (roomStartPoint.value) {
      // Используем класс RoomPreview напрямую
      roomPreview.update(roomStartPoint.value, gridPoint);
      
      // Проверяем размер комнаты и меняем стиль курсора соответственно
      if (container.value) {
        const isValidSize = roomPreview.isSizeValid(roomStartPoint.value, gridPoint, 1);
        container.value.style.cursor = isValidSize ? 'crosshair' : 'not-allowed';
      }
    }
  }
}

// Добавляем обработку наведения для режима комнат
const onMouseMove = (event: MouseEvent) => {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  // Режим выделения объектов
  if (currentMode.value === 'object' && isSelectMode.value) {
    handleSelectionModeHover(event)
    return
  }
  
  // Режим комнат - добавляем обработку наведения
  if (currentMode.value === 'room' && isCreatingRoom.value) {
    handleRoomModeHover(event)
    return
  }

  if (isDragging && selectedRoom) {
    handleRoomDrag()
  } else if (isResizing && selectedRoom && selectedMarker) {
    handleRoomResize()
  } else if (selectedWallObject) {
    selectedWallObject.updateDrag(mouse, camera)
  } else if (currentMode.value === 'object' && !isSelectMode.value) {
    handleObjectModeHover()
  }
}

// Обработчик перетаскивания комнаты
const handleRoomDrag = () => {
  const deltaX = mouse.x - dragStart.x
  const deltaY = mouse.y - dragStart.y

  // Преобразование движения мыши в движение в пространстве сцены
  const worldDelta = new THREE.Vector3(deltaX, 0, deltaY)
  worldDelta.applyQuaternion(camera.quaternion)
  worldDelta.y = 0

  // Округление до ближайшей сетки
  const gridSize = 0.5
  const newX = Math.round((selectedRoom!.getObject().position.x + worldDelta.x) / gridSize) * gridSize
  const newZ = Math.round((selectedRoom!.getObject().position.z + worldDelta.z) / gridSize) * gridSize

  selectedRoom!.setPosition(newX, newZ)
  dragStart.set(mouse.x, mouse.y)
}

// Обработчик изменения размера комнаты
const handleRoomResize = () => {
  if (!selectedRoom || !selectedMarker) return;
  
  const deltaX = mouse.x - dragStart.x;
  const deltaY = mouse.y - dragStart.y;

  // Преобразование движения мыши в изменение размера в мировых координатах
  const worldDelta = new THREE.Vector3(deltaX, 0, deltaY);
  worldDelta.applyQuaternion(camera.quaternion);
  worldDelta.y = 0; // Оставляем только изменения по горизонтали
  
  // Получаем информацию о том, какой угол был выбран
  const corner = selectedMarker.userData.corner || { x: Math.sign(selectedMarker.position.x), z: Math.sign(selectedMarker.position.z) };
  
  // Логируем для отладки
  console.log('Corner info:', corner, 'Delta:', worldDelta);
  
  // Вычисляем новые размеры в зависимости от выбранного угла
  // Если тянем за правый край (corner.x > 0), увеличиваем ширину при движении вправо
  // Если тянем за левый край (corner.x < 0), увеличиваем ширину при движении влево
  // То же самое для верхнего/нижнего края по z
  const xMultiplier = corner.x; // 1 для правой стороны, -1 для левой
  const zMultiplier = corner.z; // 1 для верхней стороны, -1 для нижней
  
  // Проецируем мировое смещение на локальные оси комнаты
  // Для упрощения считаем, что комната всегда выровнена по осям мира
  const localDeltaX = worldDelta.x * xMultiplier; // Положительное значение означает увеличение размера
  const localDeltaZ = worldDelta.z * zMultiplier; // Положительное значение означает увеличение размера
  
  // Вычисляем новые размеры
  const newWidth = Math.max(1, initialSize.width + localDeltaX * 2); // Умножаем на 2, так как изменяем в одну сторону
  const newHeight = Math.max(1, initialSize.height + localDeltaZ * 2);
  
  // Округляем до ближайшей сетки для лучшего выравнивания
  const gridSize = 0.5;
  const roundedWidth = Math.round(newWidth / gridSize) * gridSize;
  const roundedHeight = Math.round(newHeight / gridSize) * gridSize;
  
  // Устанавливаем новые размеры комнаты
  selectedRoom.setSize(roundedWidth, roundedHeight);
  
  // Обновляем драг-старт для более плавного изменения
  // dragStart.set(mouse.x, mouse.y);
}

// Обработчик наведения в режиме объектов
const handleObjectModeHover = () => {
  // Используем метод из SceneManager
  raycaster.setFromCamera(mouse, camera)
  const { wall: foundWall, room: foundRoom, intersectPoint, localX } = sceneManager.findWallByRaycaster(raycaster)
  
  // Визуализация точки пересечения raycast со стеной
  if (intersectPoint) {
    if (!debugSphere) {
      const sphereGeom = new THREE.SphereGeometry(0.05, 12, 12)
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      debugSphere = new THREE.Mesh(sphereGeom, sphereMat)
      scene.add(debugSphere)
    }
    debugSphere.position.copy(intersectPoint)
    debugSphere.visible = true
  } else if (debugSphere) {
    debugSphere.visible = false
  }
  
  if (foundWall) {
    // Snapping к сетке и границам
    let pos = Math.max(0.05, Math.min(0.95, Math.round(localX * 10) / 10))
    
    // Используем методы из SceneManager для работы с ghost-объектами
    if (!sceneManager.getGhostWallObject() || 
        sceneManager.getGhostWallObject()?.getType() !== selectedObjectType.value || 
        sceneManager.getGhostWall() !== foundWall) {
      // Создаем новый ghost-объект
      sceneManager.createGhostObject(foundWall, selectedObjectType.value, pos)
    } else {
      // Обновляем позицию существующего ghost-объекта
      sceneManager.updateGhostObjectPosition(pos)
    }
  } else {
    // Удаляем ghost-объект, если нет пересечения со стеной
    sceneManager.removeGhostObject()
  }
}

const onMouseUp = () => {
  isDragging = false
  isResizing = false
  
  if (selectedWallObject) {
    selectedWallObject.stopDrag()
    selectedWallObject = null
  }
  
  selectedRoom = null
  selectedMarker = null
  controls.enabled = true
  
  // Если пользователь отпустил кнопку мыши во время создания комнаты, не завершаем создание
  // (будем считать, что для создания нужны два клика)
}

const animate = () => {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

const setMode = (mode: 'room' | 'object') => {
  // Если меняется режим, сбрасываем выделение
  if (currentMode.value !== mode) {
    selectionManager.clear()
    isSelectMode.value = false // Сбрасываем режим выделения при смене основного режима
    
    // Сбрасываем режим создания комнаты
    if (isCreatingRoom.value) {
      cancelRoomCreation();
    }
  }
  
  currentMode.value = mode
  if (debugSphere) {
    scene.remove(debugSphere)
    debugSphere = null
  }
}

const setObjectType = (type: WallObjectType) => {
  if (isSelectMode.value) return;
  
  selectedObjectType.value = type
  if (debugSphere) {
    scene.remove(debugSphere)
    debugSphere = null
  }
}

const updateWallHeight = () => {
  rooms.forEach(room => room.setWallHeight(wallHeight.value))
  
  // Обновляем debug маркеры, если режим debug включен
  if (debugMode.value) {
    debugHelper.removeAllDebugMarkers()
    debugHelper.addDebugMarkersForRooms(rooms)
  }
}

watch(debugMode, (val) => {
  if (val) {
    debugHelper.addDebugMarkersForRooms(rooms)
  } else {
    debugHelper.removeAllDebugMarkers()
  }
})

const setSelectMode = (value: boolean) => {
  isSelectMode.value = value
  
  if (!value) {
    // При выходе из режима выделения сбрасываем все выделения
    selectionManager.clear()
    updateSelectedObjectsCount()
  }
  
  // В режиме выделения убираем ghost-объект
  sceneManager.removeGhostObject()
}

const deleteSelectedObjects = () => {
  // Проверяем, что есть выделенные объекты
  if (selectedObjectsCount.value === 0) return;

  const selectedObjects = [...selectionManager.selectedObjects] // Создаем копию массива
  selectedObjects.forEach(obj => {
    const room = rooms.find(room => room.getWallObjects().includes(obj))
    if (room) {
      room.removeWallObject(obj)
    }
  })
  // Очищаем выделение и обновляем счетчик
  selectionManager.clear()
  updateSelectedObjectsCount()
}

const getSelectedTypeCount = (type: WallObjectType) => {
  return selectionManager.selectedObjects.filter(obj => obj.getType() === type).length
}

// Обновляем счетчик выделенных объектов
const updateSelectedObjectsCount = () => {
  selectedObjectsCount.value = selectionManager.selectedObjects.length
}

// Добавим обновление количества выделенных объектов при изменении комнат
watch(() => rooms.length, () => {
  if (isSelectMode.value) {
    updateSelectedObjectsCount()
  }
})

// Обработчик клика в режиме объектов
const handleObjectModeClick = (event: MouseEvent) => {
  // Используем метод placeGhostObject при клике на ghost-объект
  if (sceneManager.getGhostWallObject()) {
    try {
      // Добавляем более подробное логирование
      console.log('Placing ghost object:', 
        sceneManager.getGhostWallObject()?.getType(), 
        sceneManager.getGhostWall()?.mesh.uuid,
        sceneManager.getGhostWallObject()?.getPosition()
      );
      
      sceneManager.placeGhostObject();
      return;
    } catch (error) {
      console.error('Error placing ghost object:', error);
    }
  }

  // Проверяем, является ли объект стеной или объектом на стене
  const mesh = event.target as THREE.Mesh;
  const room = rooms.find(room => 
    room.getWalls().some(w => w.mesh === mesh)
  );
  
  if (room) {
    // Находим конкретную Wall, соответствующую THREE.Mesh
    const wallObj = room.getWalls().find(w => w.mesh === mesh);
    if (!wallObj) return;

    // Проверяем, не является ли объект частью существующего объекта на стене
    const wallObject = room.getWallObjects().find(obj => obj.getObject() === event.target);
    
    if (wallObject) {
      // Начинаем перетаскивание существующего объекта
      selectedWallObject = wallObject;
      selectedWallObject.startDrag(mouse);
      controls.enabled = false;
    } else {
      // Добавляем новый объект на стену (только если не в режиме выделения)
      if (!isSelectMode.value) {
        // Используем raycaster для определения точки на стене
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(mesh, false);
        
        if (intersects.length > 0) {
          // Получаем локальные координаты точки на стене
          const localPoint = mesh.worldToLocal(intersects[0].point.clone());
          const wallSize = new THREE.Vector3();
          console.log(`localPoint: ${localPoint}`)
          mesh.geometry.computeBoundingBox();
          mesh.geometry.boundingBox?.getSize(wallSize);
          
          // Вычисляем позицию (0-1) на стене
          // почему localPoint.x / wallSize.x?
          // - потому что мы хотим получить позицию в процентах от ширины стены
          const position = (localPoint.x / wallSize.x) + 0.5;
          
          // Добавляем объект на стену
          if (selectedObjectType.value === 'socket') {
            // Расчёт zOffset для розетки
            const socketDepth = SOCKET_PARAMS.depth;
            room.addSocket(wallObj, position, false, socketDepth);
          } else if (selectedObjectType.value === 'door') {
            room.addDoor(wallObj, position);
          }
        }
      }
    }
  }
}

// Обработчик наведения в режиме выделения
const handleSelectionModeHover = (event: MouseEvent) => {
  let found: WallObject | null = null
  if (selectionMethod === 'raycast') {
    found = selectionManager.selectObjectByRaycast(
      mouse, 
      camera, 
      selectionManager.getAllWallObjectGroups(), 
      raycaster
    )
  } else if (selectionMethod === 'boundingBox') {
    const allWallObjects = rooms.flatMap(room => room.getWallObjects())
    found = selectionManager.selectObjectByBoundingBox(
      event, 
      camera, 
      allWallObjects, 
      container.value
    )
  }
  
  if (found) {
    selectionManager.hover(found)
  } else {
    selectionManager.unhoverCurrent()
  }
}

// Функция для отмены создания комнаты
const cancelRoomCreation = () => {
  isCreatingRoom.value = false;
  roomStartPoint.value = null;
  // Используем метод удаления напрямую
  roomPreview.remove();
  
  // Возвращаем курсор в нормальное состояние
  if (container.value) {
    container.value.style.cursor = 'default';
  }
}

// Обработчик нажатия клавиш
const onKeyDown = (event: KeyboardEvent) => {
  // Отмена создания комнаты по Escape
  if (event.key === 'Escape' && isCreatingRoom.value) {
    cancelRoomCreation();
  }
}

// Функция для получения выделенной розетки
const getSelectedSocket = (): Socket | null => {
  const selectedObjects = selectionManager.selectedObjects
  if (selectedObjects.length !== 1) return null
  
  const obj = selectedObjects[0]
  if (obj.getType() !== 'socket') return null
  
  return obj as Socket
}

// Обновить информацию о выделенной розетке
const updateSelectedSocketInfo = () => {
  const socket = getSelectedSocket()
  if (!socket) return
  
  selectedSocketProperties.value.name = socket.getName()
  selectedSocketProperties.value.deviceType = socket.getDeviceType()
  selectedSocketProperties.value.isOn = socket.getIsOn()
  selectedSocketProperties.value.powerConsumption = socket.getPowerConsumption()
}

// Обновить имя розетки
const updateSocketName = () => {
  const socket = getSelectedSocket()
  if (!socket) return
  
  socket.setName(selectedSocketProperties.value.name)
}

// Обновить тип устройства розетки
const updateSocketType = () => {
  const socket = getSelectedSocket()
  if (!socket) return
  
  socket.setDeviceType(selectedSocketProperties.value.deviceType)
}

// Переключить питание розетки
const toggleSocketPower = () => {
  const socket = getSelectedSocket()
  if (!socket) return
  
  if (selectedSocketProperties.value.isOn) {
    socket.turnOn()
  } else {
    socket.turnOff()
  }
}

// Обновить потребление энергии
const updateSocketPowerConsumption = () => {
  const socket = getSelectedSocket()
  if (!socket) return
  
  socket.setPowerConsumption(selectedSocketProperties.value.powerConsumption)
}

// Модифицируем селектор, чтобы обновлять свойства розетки при выделении
const originalOnSelectionChangeCallback = selectionManager.onSelectionChangeCallback
selectionManager.setOnSelectionChangeCallback(() => {
  // Сначала вызываем оригинальный колбэк для обновления счетчика
  if (originalOnSelectionChangeCallback) {
    originalOnSelectionChangeCallback()
  }
  
  // Затем обновляем информацию о выделенной розетке
  updateSelectedSocketInfo()
})

// Функция для получения всех розеток из всех комнат
const getAllSockets = (): Socket[] => {
  const sockets: Socket[] = []
  
  rooms.forEach(room => {
    const wallObjects = room.getWallObjects()
    wallObjects.forEach(obj => {
      if (obj.getType() === 'socket') {
        sockets.push(obj as Socket)
      }
    })
  })
  
  return sockets
}

// Функция для получения общего количества розеток
const getTotalSocketsCount = (): number => {
  return getAllSockets().length
}

// Функция для получения количества активных розеток
const getActiveSocketsCount = (): number => {
  return getAllSockets().filter(socket => socket.getIsOn()).length
}

// Функция для получения общего потребления энергии
const getTotalPowerConsumption = (): number => {
  return getAllSockets()
    .filter(socket => socket.getIsOn())
    .reduce((total, socket) => total + socket.getPowerConsumption(), 0)
}

// Функция для получения отфильтрованных розеток
const getFilteredSockets = (): Socket[] => {
  return getAllSockets().filter(socket => {
    // Фильтрация по типу устройства
    if (iotDashboardFilter.value.deviceType !== 'all' && 
        socket.getDeviceType() !== iotDashboardFilter.value.deviceType) {
      return false
    }
    
    // Фильтрация по состоянию
    if (iotDashboardFilter.value.state === 'on' && !socket.getIsOn()) {
      return false
    }
    
    if (iotDashboardFilter.value.state === 'off' && socket.getIsOn()) {
      return false
    }
    
    return true
  })
}

// Функция для получения метки типа устройства
const getDeviceTypeLabel = (deviceType: SocketDeviceType): string => {
  const type = socketDeviceTypes.find(t => t.value === deviceType)
  return type ? type.label : 'Неизвестно'
}

// Функция для переключения устройства из дашборда
const toggleDeviceFromDashboard = (socket: Socket): void => {
  socket.toggle()
}

// Функция для переключения меню сохранения
const toggleSaveMenu = () => {
  showSaveMenu.value = !showSaveMenu.value
  if (showSaveMenu.value) {
    showLoadMenu.value = false
  }
}

// Функция для переключения меню загрузки
const toggleLoadMenu = () => {
  showLoadMenu.value = !showLoadMenu.value
  if (showLoadMenu.value) {
    showSaveMenu.value = false
    loadSavedProjectsList()
  }
}

// Функция для сохранения проекта в localStorage
const saveToLocalStorage = () => {
  if (!saveProjectName.value.trim()) {
    alert('Пожалуйста, введите название проекта')
    return
  }
  
  try {
    // Сериализуем все комнаты
    const roomsData = rooms.map(room => room.toJSON())
    
    // Создаем объект с данными проекта
    const projectData = {
      name: saveProjectName.value,
      date: Date.now(),
      rooms: roomsData
    }
    
    // Сохраняем в localStorage
    localStorage.setItem(`roomEditor_${saveProjectName.value}`, JSON.stringify(projectData))
    
    alert('Проект успешно сохранен')
    showSaveMenu.value = false
  } catch (error) {
    console.error('Ошибка при сохранении проекта:', error)
    alert('Произошла ошибка при сохранении проекта')
  }
}

// Функция для экспорта проекта в файл
const exportToFile = () => {
  if (!saveProjectName.value.trim()) {
    alert('Пожалуйста, введите название проекта')
    return
  }
  
  try {
    // Сериализуем все комнаты
    const roomsData = rooms.map(room => room.toJSON())
    
    // Создаем объект с данными проекта
    const projectData = {
      name: saveProjectName.value,
      date: Date.now(),
      rooms: roomsData
    }
    
    // Создаем ссылку для скачивания
    const dataStr = JSON.stringify(projectData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    
    const exportName = `${saveProjectName.value.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportName)
    linkElement.click()
    
    showSaveMenu.value = false
  } catch (error) {
    console.error('Ошибка при экспорте проекта:', error)
    alert('Произошла ошибка при экспорте проекта')
  }
}

// Функция для загрузки списка сохраненных проектов
const loadSavedProjectsList = () => {
  const projects = []
  
  // Перебираем все ключи в localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    
    if (key && key.startsWith('roomEditor_')) {
      try {
        const projectData = JSON.parse(localStorage.getItem(key) || '{}')
        projects.push({
          name: projectData.name,
          date: projectData.date
        })
      } catch (error) {
        console.error('Ошибка при парсинге сохраненного проекта:', error)
      }
    }
  }
  
  // Сортируем проекты по дате (сначала новые)
  projects.sort((a, b) => b.date - a.date)
  
  savedProjects.value = projects
}

// Функция для загрузки проекта из localStorage
const loadFromLocalStorage = (projectName: string) => {
  try {
    const projectKey = `roomEditor_${projectName}`
    const projectDataJson = localStorage.getItem(projectKey)
    
    if (!projectDataJson) {
      alert('Проект не найден')
      return
    }
    
    const projectData = JSON.parse(projectDataJson)
    
    // Очищаем сцену
    clearScene()
    
    // Загружаем комнаты
    projectData.rooms.forEach((roomData: any) => {
      const room = RoomClass.fromJSON(scene, roomData)
      if (room) {
        rooms.push(room)
        sceneManager.add(room)
      }
    })
    
    showLoadMenu.value = false
    alert('Проект успешно загружен')
  } catch (error) {
    console.error('Ошибка при загрузке проекта:', error)
    alert('Произошла ошибка при загрузке проекта')
  }
}

// Функция для удаления проекта из localStorage
const deleteFromLocalStorage = (projectName: string) => {
  if (confirm(`Вы уверены, что хотите удалить проект "${projectName}"?`)) {
    localStorage.removeItem(`roomEditor_${projectName}`)
    loadSavedProjectsList()
  }
}

// Функция для форматирования даты
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Функция для очистки сцены
const clearScene = () => {
  // Удаляем все комнаты из сцены
  rooms.forEach(room => {
    scene.remove(room.getObject())
  })
  
  // Очищаем массив комнат
  rooms = []
  
  // Очищаем выделение
  selectionManager.clear()
  updateSelectedObjectsCount()
}

// Функция для активации выбора файла
const triggerFileInput = () => {
  if (importFileInput.value) {
    importFileInput.value.click()
  }
}

// Функция для обработки импорта из файла
const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const result = e.target?.result
      if (typeof result === 'string') {
        const projectData = JSON.parse(result)
        
        // Очищаем сцену
        clearScene()
        
        // Загружаем комнаты
        projectData.rooms.forEach((roomData: any) => {
          const room = RoomClass.fromJSON(scene, roomData)
          if (room) {
            rooms.push(room)
            sceneManager.add(room)
          }
        })
        
        showLoadMenu.value = false
        alert('Проект успешно импортирован')
      }
    } catch (error) {
      console.error('Ошибка при импорте проекта:', error)
      alert('Произошла ошибка при импорте проекта. Проверьте формат файла.')
    }
    
    // Сбрасываем значение input, чтобы можно было загрузить тот же файл повторно
    if (importFileInput.value) {
      importFileInput.value.value = ''
    }
  }
  
  reader.readAsText(file)
}

onMounted(() => {
  init()
  window.addEventListener('resize', () => {
    if (!container.value) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  })
  
  // Добавляем обработчик клавиатуры
  window.addEventListener('keydown', onKeyDown);
})

onUnmounted(() => {
  if (container.value) {
    container.value.removeEventListener('mousedown', onMouseDown)
    container.value.removeEventListener('mousemove', onMouseMove)
    container.value.removeEventListener('mouseup', onMouseUp)
    container.value.removeChild(renderer.domElement)
  }
  
  // Удаляем обработчик клавиатуры
  window.removeEventListener('keydown', onKeyDown);
  
  // Очищаем сцену и менеджеры
  sceneManager.clear()
  selectionManager.clear()
  if (debugHelper) debugHelper.removeAllDebugMarkers()
  
  // Удаляем предпросмотр комнаты
  if (roomPreview) roomPreview.remove();
})
</script>

<style scoped>
.room-editor {
  width: 100%;
  height: 100vh;
  position: relative;
}

.editor-container {
  width: 100%;
  height: 100%;
}

.editor-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(40, 44, 52, 0.85); /* Темный фон с прозрачностью */
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: #ffffff; /* Белый текст для контраста */
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.main-modes {
  display: flex;
  gap: 10px;
}

.main-modes button {
  flex: 1;
  font-weight: bold;
  background: #3a3f4b; /* Темно-серый фон */
  color: #ffffff; /* Белый текст */
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
  background: #3a3f4b; /* Темно-серый фон */
  color: #ffffff; /* Белый текст */
}

button {
  margin: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #3a3f4b; /* Темно-серый фон */
  color: #ffffff; /* Белый текст */
  cursor: pointer;
  transition: background 0.3s, transform 0.1s;
  font-weight: 500;
}

button:hover {
  background: #4a5064; /* Немного светлее при наведении */
}

button:active {
  transform: scale(0.98);
}

button.active {
  background: #2196f3; /* Яркий синий для активного состояния */
  color: white;
}

button:disabled,
button.disabled {
  background: #2a2e36; /* Более темный для отключенного состояния */
  color: #6c7280; /* Серый текст */
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
  color: #ffffff; /* Белый текст */
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
  accent-color: #2196f3; /* Подсветка слайдера */
}

.selection-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(40, 44, 52, 0.85); /* Темный фон с прозрачностью */
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 350px;
  color: #ffffff; /* Белый текст */
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
  color: #42a5f5; /* Более яркий синий */
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

/* Стили для IoT-дашборда */
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
.device-type-power {
  background: rgba(70, 70, 70, 0.3);
}

.device-type-light {
  background: rgba(255, 204, 0, 0.2);
}

.device-type-climate {
  background: rgba(0, 204, 255, 0.2);
}

.device-type-security {
  background: rgba(255, 50, 50, 0.2);
}

.device-type-media {
  background: rgba(153, 50, 204, 0.2);
}

.dashboard-control {
  margin-top: 10px;
}

/* Стили для сохранённых проектов */
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

/* Стиль для невидимого input для загрузки файла */
.hidden-file-input {
  display: none;
}

/* Стили предпросмотра комнаты */
.room-preview {
  pointer-events: none;
  opacity: 0.7;
}

.room-preview.valid {
  opacity: 0.7;
}

.room-preview.invalid {
  opacity: 0.7;
  color: #ff584f;
}

.debug-control {
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 10px;
}

/* Стили для кнопок Debug и IoT */
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
  background: #3a3f4b; /* Темно-серый фон */
}

/* Стили для меню сохранения/загрузки */
.save-menu,
.load-menu {
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
  background: #1976d2; /* Более темный синий */
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
</style> 