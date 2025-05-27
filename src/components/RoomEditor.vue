<template>
  <div class="room-editor-window" :class="{ fullscreen: isFullscreen, minimized: isMinimized }">
    <!-- Заголовок окна -->
    <div class="window-header">
      <div class="window-title">
        <h3>3D-планировщик комнат и устройств</h3>
      </div>
      <div class="window-controls">
        <button class="minimize-btn" @click="isMinimized = !isMinimized" :title="isMinimized ? 'Развернуть' : 'Свернуть'">
          {{ isMinimized ? '🔺' : '🔻' }}
        </button>
        <button class="fullscreen-btn" @click="isFullscreen = !isFullscreen" :title="isFullscreen ? 'Оконный режим' : 'Полноэкранный режим'">
          {{ isFullscreen ? '🗗' : '🗖' }}
        </button>
      </div>
    </div>

    <!-- Основное содержимое окна -->
    <div class="window-content" :class="{ minimized: isMinimized, fullscreen: isFullscreen }">
      <div class="room-editor">
        <div ref="container" class="editor-container"></div>
        
        <!-- Компактная панель управления -->
        <div class="editor-controls-compact">
          <!-- Основные режимы -->
          <div class="main-modes">
            <button @click="setMode('room')" :class="{ active: currentMode === 'room' }" class="mode-btn">
              🏠 Комнаты
            </button>
            <button @click="setMode('object')" :class="{ active: currentMode === 'object' }" class="mode-btn">
              🔌 Объекты
            </button>
          </div>
          
          <!-- Дополнительные кнопки -->
          <div class="control-buttons-compact">
            <button @click="debugMode = !debugMode" :class="{ active: debugMode }" :title="'Debug режим'">
              🔧
            </button>
            <button @click="showIoTDashboard = !showIoTDashboard" :class="{ active: showIoTDashboard }" :title="'IoT панель'">
              📱
            </button>
            <button @click="toggleSaveMenu()" :class="{ active: showSaveMenu }" :title="'Сохранить'">
              💾
            </button>
            <button @click="toggleLoadMenu()" :class="{ active: showLoadMenu }" :title="'Загрузить'">
              📂
            </button>
          </div>
        </div>

        <!-- Настройки для режима комнат (компактные) -->
        <div v-if="currentMode === 'room' && !isMinimized" class="mode-controls-compact">
          <div class="wall-height-control-compact">
            <label>Высота:</label>
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
          <button v-if="!isCreatingRoom" @click="startRoomCreation" class="action-button-compact">
            ➕ Создать комнату
          </button>
          
          <!-- Если в режиме создания, показываем инструкции и кнопку отмены -->
          <div v-else class="creation-instructions-compact">
            <span v-if="!roomStartPoint" class="creation-step">1. Выберите первую точку</span>
            <span v-else class="creation-step">2. Выберите вторую точку</span>
            <button @click="cancelRoomCreation" class="cancel-button-compact">❌</button>
          </div>
        </div>
        
        <!-- Настройки для режима объектов (компактные) -->
        <div v-if="currentMode === 'object' && !isMinimized" class="mode-controls-compact">
          <!-- Подрежимы для режима объектов -->
          <div class="submodes-compact">
            <button @click="setSelectMode(false)" :class="{ active: !isSelectMode }" class="submode-btn">
              ➕ Добавить
            </button>
            <button @click="setSelectMode(true)" :class="{ active: isSelectMode }" class="submode-btn">
              👆 Выбрать
            </button>
          </div>
          
          <!-- Типы объектов, доступно только если не в режиме выделения -->
          <div v-if="!isSelectMode" class="object-controls-compact">
            <button @click="setObjectType('socket')" :class="{ active: selectedObjectType === 'socket' }" class="object-btn">
              🔌 Розетка
            </button>
            <button @click="setObjectType('door')" :class="{ active: selectedObjectType === 'door' }" class="object-btn">
              🚪 Дверь
            </button>
          </div>
          
          <!-- Кнопка удаления, доступна только в режиме выделения и если есть выделенные объекты -->
          <div v-if="isSelectMode" class="action-controls-compact">
            <button 
              @click="deleteSelectedObjects()" 
              :disabled="selectedObjectsCount === 0"
              :class="{ 'disabled': selectedObjectsCount === 0, 'delete-button-compact': true }">
              🗑️ Удалить ({{ selectedObjectsCount }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Меню сохранения (позиционированное относительно окна) -->
    <div v-if="showSaveMenu" class="save-menu-compact">
      <div class="menu-header-compact">
        <h4>Сохранить проект</h4>
        <button class="close-btn-compact" @click="showSaveMenu = false">×</button>
      </div>
      
      <div class="menu-content-compact">
        <div class="input-group-compact">
          <label for="projectName">Название:</label>
          <input type="text" id="projectName" v-model="saveProjectName" placeholder="Мой проект">
        </div>
        
        <div class="button-group-compact">
          <button @click="saveToLocalStorage()" class="primary-btn-compact">
            💾 В браузер
          </button>
          <button @click="exportToFile()" class="secondary-btn-compact">
            📥 В файл
          </button>
        </div>
      </div>
    </div>

    <!-- Меню загрузки (позиционированное относительно окна) -->
    <div v-if="showLoadMenu" class="load-menu-compact">
      <div class="menu-header-compact">
        <h4>Загрузить проект</h4>
        <button class="close-btn-compact" @click="showLoadMenu = false">×</button>
      </div>
      
      <div class="menu-content-compact">
        <div v-if="savedProjects.length > 0">
          <div class="saved-projects-list-compact">
            <div 
              v-for="project in savedProjects" 
              :key="project.name" 
              class="saved-project-compact"
            >
              <div class="project-info-compact">
                <span class="project-name">{{ project.name }}</span>
                <span class="project-date">{{ formatDate(project.date) }}</span>
              </div>
              <div class="project-actions-compact">
                <button @click="loadFromLocalStorage(project.name)" class="action-btn-compact">
                  📂
                </button>
                <button @click="deleteFromLocalStorage(project.name)" class="action-btn-compact delete">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="no-saved-projects-compact">
          <p>Нет сохраненных проектов</p>
        </div>
        
        <div class="import-section-compact">
          <input 
            type="file" 
            id="importFile" 
            ref="importFileInput"
            accept=".json"
            @change="handleFileImport"
            style="display:none"
          >
          <button @click="triggerFileInput()" class="secondary-btn-compact">
            📁 Импорт файла
          </button>
        </div>
      </div>
    </div>

    <!-- Панель управления выделенными объектами (встроенная) -->
    <div v-if="currentMode === 'object' && isSelectMode && selectedObjectsCount > 0 && !isMinimized" class="selection-panel-compact">
      <div class="selection-info-compact">
        <span class="selection-count">Выделено: {{ selectedObjectsCount }}</span>
      </div>
      
      <!-- Панель свойств для розеток (показывается только если выделена одна розетка) -->
      <div v-if="selectedObjectsCount === 1 && getSelectedTypeCount('socket') === 1" class="socket-properties-compact">
        <div class="property-row">
          <label>Название:</label>
          <input 
            type="text" 
            v-model="selectedSocketProperties.name" 
            @change="updateSocketName"
            class="property-input"
          />
        </div>
        
        <div class="property-row">
          <label>Тип:</label>
          <select 
            v-model="selectedSocketProperties.deviceType"
            @change="updateSocketType"
            class="property-select"
          >
            <option v-for="type in socketDeviceTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>
        
        <div class="property-row">
          <label>Состояние:</label>
          <div class="toggle-switch-compact">
            <input 
              type="checkbox" 
              id="socketPowerCompact" 
              v-model="selectedSocketProperties.isOn"
              @change="toggleSocketPower"
            />
            <label for="socketPowerCompact">{{ selectedSocketProperties.isOn ? 'Вкл' : 'Выкл' }}</label>
          </div>
        </div>
        
        <div class="property-row">
          <label>Потребление:</label>
          <input 
            type="number" 
            v-model="selectedSocketProperties.powerConsumption" 
            @change="updateSocketPowerConsumption"
            min="0" 
            max="5000"
            class="property-input"
          />
          <span class="unit">Вт</span>
        </div>
      </div>
    </div>

    <!-- Мобильный overlay для IoT панели -->
    <div v-if="showIoTDashboard && !isMinimized" class="iot-dashboard-overlay" @click="showIoTDashboard = false"></div>

    <!-- IoT Дашборд (компактный, встроенный) -->
    <div v-if="showIoTDashboard && !isMinimized" class="iot-dashboard-compact">
      <div class="dashboard-header-compact">
        <h4>IoT Панель</h4>
        <button class="close-btn-compact" @click="showIoTDashboard = false">×</button>
      </div>
      
      <div class="dashboard-content-compact">
        <div class="dashboard-summary-compact">
          <div class="summary-item-compact">
            <span class="summary-value-compact">{{ getTotalSocketsCount() }}</span>
            <span class="summary-label-compact">Всего</span>
          </div>
          <div class="summary-item-compact">
            <span class="summary-value-compact">{{ getActiveSocketsCount() }}</span>
            <span class="summary-label-compact">Активно</span>
          </div>
          <div class="summary-item-compact">
            <span class="summary-value-compact">{{ getTotalPowerConsumption() }}</span>
            <span class="summary-label-compact">Вт</span>
          </div>
        </div>
        
        <div class="device-list-compact">
          <div v-if="getFilteredSockets().length === 0" class="no-devices-compact">
            <p>Нет устройств</p>
          </div>
          
          <div 
            v-for="socket in getFilteredSockets()" 
            :key="socket.getId()" 
            class="device-item-compact"
            :class="{ 'device-active': socket.getIsOn() }"
          >
            <div class="device-info-compact">
              <span class="device-name-compact">{{ socket.getName() }}</span>
              <span class="device-status-compact">{{ socket.getIsOn() ? 'Вкл' : 'Выкл' }}</span>
            </div>
            <button class="device-toggle-btn-compact" @click="toggleDeviceFromDashboard(socket)">
              {{ socket.getIsOn() ? '⏸️' : '▶️' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, defineExpose } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Room as RoomClass } from '../core/objects/Room'
// import { Wall } from '../core/objects/Wall'
import { SceneManager } from '../core/managers/SceneManager'
import type { WallObjectType } from '../core/objects/WallObject'
import { WallObject } from '../core/objects/WallObject'
import { SOCKET_PARAMS } from '../params/config'
import { SelectionManager } from '../core/managers/SelectionManager'
import { Socket, SocketDeviceType } from '../core/objects/Socket'
import { DebugHelper } from '../core/utils/DebugHelper'
import { RoomFactory } from '../core/factories/RoomFactory'
import { RoomPreview } from '../core/preview/RoomPreview'
import { useIoTStore, type IoTDevice } from '../stores/iot'

// Инициализируем Pinia store
const iotStore = useIoTStore()

const container = ref<HTMLElement | null>(null)
const currentMode = ref<'room' | 'object'>('room')
const wallHeight = ref(2.5)
const selectedObjectType = ref<WallObjectType>('socket')
const debugMode = ref(false)
const isSelectMode = ref(false)
const selectedObjectsCount = ref(0)
const isMinimized = ref(false)
const isFullscreen = ref(false)
let selectionMethod: 'raycast' | 'boundingBox' = 'raycast'

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
    if (container.value) {
      foundWallObject = selectionManager.selectObjectByBoundingBox(
        event, 
        camera, 
        allWallObjects, 
        container.value
      )
    }
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
  if (!event.target) return
  
  const marker = event.target as unknown as THREE.Mesh
  const room = rooms.find(room => room.getResizeMarkers().includes(marker))
  
  if (room) {
    selectedRoom = room
    selectedMarker = marker
    isResizing = true
    initialSize = room.getSize()
    controls.enabled = false
  } else {
    // Если это не маркер, проверяем, является ли объект частью комнаты
    const roomObject = event.target as unknown as THREE.Object3D
    selectedRoom = rooms.find(room => room.getObject() === roomObject) || null
    if (selectedRoom) {
      isDragging = true
      dragStart.set(mouse.x, mouse.y)
      controls.enabled = false
    }
  }
}

// Модифицируем функцию handleRoomModeHover для отображения предпросмотра при создании комнаты
const handleRoomModeHover = (_event: MouseEvent) => {
  if (isCreatingRoom.value) {
    const gridPoint = getGridPointFromMouse()
    
    if (!gridPoint) {
      // Если не удалось получить точку на сетке, скрываем предпросмотр
      roomPreview.remove()
      return
    }
    
    // Если есть начальная точка, обновляем предпросмотр
    if (roomStartPoint.value) {
      // Используем класс RoomPreview напрямую
      roomPreview.update(roomStartPoint.value, gridPoint)
      
      // Проверяем размер комнаты и меняем стиль курсора соответственно
      if (container.value) {
        const isValidSize = roomPreview.isSizeValid(roomStartPoint.value, gridPoint, 1)
        container.value.style.cursor = isValidSize ? 'crosshair' : 'not-allowed'
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
  const { wall: foundWall, intersectPoint, localX } = sceneManager.findWallByRaycaster(raycaster)
  
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
  if (selectedObjectsCount.value === 0) return

  const selectedObjects = [...selectionManager.selectedObjects] // Создаем копию массива
  selectedObjects.forEach(obj => {
    const wallObj = obj as unknown as WallObject
    const room = rooms.find(room => room.getWallObjects().includes(wallObj))
    if (room) {
      room.removeWallObject(wallObj)
    }
  })
  // Очищаем выделение и обновляем счетчик
  selectionManager.clear()
  updateSelectedObjectsCount()
  
  // Обновляем интерфейсы после удаления объектов
  forceUpdateAllInterfaces()
}

const getSelectedTypeCount = (type: WallObjectType) => {
  return selectionManager.selectedObjects.filter(obj => (obj as unknown as WallObject).getType() === type).length
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
      )
      
      sceneManager.placeGhostObject()
      // Обновляем интерфейсы после размещения объекта
      forceUpdateAllInterfaces()
      return
    } catch (error) {
      console.error('Error placing ghost object:', error)
    }
  }

  // Проверяем, является ли объект стеной или объектом на стене
  if (!event.target) return
  
  const mesh = event.target as unknown as THREE.Mesh
  const room = rooms.find(room => 
    room.getWalls().some(w => w.mesh === mesh)
  )
  
  if (room) {
    // Находим конкретную Wall, соответствующую THREE.Mesh
    const wallObj = room.getWalls().find(w => w.mesh === mesh)
    if (!wallObj) return

    // Проверяем, не является ли объект частью существующего объекта на стене
    const wallObject = room.getWallObjects().find(obj => obj.getObject() === (event.target as unknown as THREE.Group))
    
    if (wallObject) {
      // Начинаем перетаскивание существующего объекта
      selectedWallObject = wallObject
      selectedWallObject.startDrag(mouse)
      controls.enabled = false
    } else {
      // Добавляем новый объект на стену (только если не в режиме выделения)
      if (!isSelectMode.value) {
        // Используем raycaster для определения точки на стене
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObject(mesh, false)
        
        if (intersects.length > 0) {
          // Получаем локальные координаты точки на стене
          const localPoint = mesh.worldToLocal(intersects[0].point.clone())
          const wallSize = new THREE.Vector3()
          console.log(`localPoint: ${localPoint}`)
          mesh.geometry.computeBoundingBox()
          mesh.geometry.boundingBox?.getSize(wallSize)
          
          // Вычисляем позицию (0-1) на стене
          // почему localPoint.x / wallSize.x?
          // - потому что мы хотим получить позицию в процентах от ширины стены
          const position = (localPoint.x / wallSize.x) + 0.5
          
          // Добавляем объект на стену
          if (selectedObjectType.value === 'socket') {
            // Расчёт zOffset для розетки
            const socketDepth = SOCKET_PARAMS.depth
            room.addSocket(wallObj, position, false, socketDepth)
            // Обновляем интерфейсы после добавления розетки
            forceUpdateAllInterfaces()
          } else if (selectedObjectType.value === 'door') {
            room.addDoor(wallObj, position)
            // Обновляем интерфейсы после добавления двери
            forceUpdateAllInterfaces()
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
    if (container.value) {
      found = selectionManager.selectObjectByBoundingBox(
        event, 
        camera, 
        allWallObjects, 
        container.value
      )
    }
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
  
  const obj = selectedObjects[0] as unknown as WallObject
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
  // Принудительно обновляем интерфейсы для синхронизации
  forceUpdateAllInterfaces()
}

// Обновить тип устройства розетки
const updateSocketType = () => {
  const socket = getSelectedSocket()
  if (!socket) return
  
  socket.setDeviceType(selectedSocketProperties.value.deviceType)
  // Принудительно обновляем интерфейсы для синхронизации
  forceUpdateAllInterfaces()
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
  
  // Принудительно обновляем все связанные интерфейсы
  forceUpdateAllInterfaces()
}

// Обновить потребление энергии
const updateSocketPowerConsumption = () => {
  const socket = getSelectedSocket()
  if (!socket) return
  
  socket.setPowerConsumption(selectedSocketProperties.value.powerConsumption)
  // Принудительно обновляем интерфейсы для синхронизации
  forceUpdateAllInterfaces()
}

// Модифицируем селектор, чтобы обновлять свойства розетки при выделении
selectionManager.setOnSelectionChangeCallback(() => {
  // Обновляем счетчик выделенных объектов
  updateSelectedObjectsCount()
  
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

// // Функция для получения метки типа устройства
// const getDeviceTypeLabel = (deviceType: SocketDeviceType): string => {
//   const type = socketDeviceTypes.find(t => t.value === deviceType)
//   return type ? type.label : 'Неизвестно'
// }

// Функция для переключения устройства из дашборда
const toggleDeviceFromDashboard = (socket: Socket): void => {
  socket.toggle()
  
  // Принудительно обновляем все связанные интерфейсы
  forceUpdateAllInterfaces()
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
    
    // Принудительно обновляем все интерфейсы после загрузки
    forceUpdateAllInterfaces()
    
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
  
  // Сбрасываем свойства выделенной розетки
  selectedSocketProperties.value = {
    name: '',
    deviceType: SocketDeviceType.POWER,
    isOn: false,
    powerConsumption: 0
  }
  
  // Принудительно обновляем все интерфейсы после очистки
  forceUpdateAllInterfaces()
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
        
        // Принудительно обновляем все интерфейсы после импорта
        forceUpdateAllInterfaces()
        
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

// Функция для преобразования Socket в IoTDevice для Pinia store
const convertSocketsToIoTDevices = (): IoTDevice[] => {
  return getAllSockets().map(socket => ({
    id: socket.getId(),
    name: socket.getName(),
    type: 'socket',
    isOn: socket.getIsOn(),
    powerConsumption: socket.getPowerConsumption(),
    deviceType: socket.getDeviceType()
  }))
}

// Новая функция для принудительного обновления всех интерфейсов
const forceUpdateAllInterfaces = () => {
  console.log('🔄 Принудительное обновление всех интерфейсов...')
  
  try {
    // Обновляем информацию о выделенной розетке в панели выделения
    updateSelectedSocketInfo()
    
    // Принудительно обновляем счетчики выделенных объектов
    updateSelectedObjectsCount()
    
    // Обновляем Pinia store с текущими устройствами
    const devices = convertSocketsToIoTDevices()
    iotStore.updateDevices(devices)
    
    // Принудительно обновляем Vue реактивность для дашборда
    // Это заставит пересчитать все геттеры статистики
    const currentFilter = iotDashboardFilter.value
    iotDashboardFilter.value = { ...currentFilter }
    
    // Добавляем небольшую задержку для обеспечения обновления Vue reactivity
    nextTick(() => {
      console.log('✅ Интерфейсы обновлены успешно')
      
      // Логгируем текущую статистику для отладки
      const totalSockets = getTotalSocketsCount()
      const activeSockets = getActiveSocketsCount()
      const totalPower = getTotalPowerConsumption()
      
      console.log(`📊 Статистика: ${totalSockets} розеток, ${activeSockets} активных, ${totalPower}Вт потребление`)
      console.log(`📡 Pinia store обновлен: ${devices.length} устройств`)
    })
  } catch (error) {
    console.error('❌ Ошибка при обновлении интерфейсов:', error)
  }
}

// Функция для загрузки данных проекта (для использования из галереи)
const loadProjectData = (projectData: any) => {
  try {
    // Очищаем сцену
    clearScene()
    
    // Загружаем комнаты из данных проекта
    if (projectData.rooms && Array.isArray(projectData.rooms)) {
      projectData.rooms.forEach((roomData: any) => {
        const room = RoomClass.fromJSON(scene, roomData)
        if (room) {
          rooms.push(room)
          sceneManager.add(room)
        }
      })
    }
    
    // Принудительно обновляем все интерфейсы после загрузки
    forceUpdateAllInterfaces()
    
    console.log('✅ Проект из галереи успешно загружен')
  } catch (error) {
    console.error('❌ Ошибка при загрузке проекта из галереи:', error)
  }
}

// Экспортируем методы для использования в родительском компоненте
defineExpose({
  loadProjectData
})
</script>

<style scoped>
.room-editor-window {
  width: 100%;
  height: 100%;
  position: relative;
  background: #0f1419;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.room-editor-window.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
}

.window-header {
  background: #1a202c;
  color: #f7fafc;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2d3748;
}

.window-title h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.window-controls {
  display: flex;
  gap: 4px;
}

.minimize-btn,
.fullscreen-btn {
  background: #2d3748;
  border: 1px solid #4a5568;
  color: #e2e8f0;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.minimize-btn:hover,
.fullscreen-btn:hover {
  background: #4a5568;
  color: #f7fafc;
  border-color: #3182ce;
}

.window-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #0f1419;
}

.window-content.minimized {
  display: none;
}

.window-content.fullscreen {
  height: calc(100vh - 48px);
}

.room-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #0f1419;
}

.editor-container {
  width: 100%;
  flex: 1;
  min-height: 200px;
  background: #1a202c;
  border-radius: 8px;
  border: 1px solid #2d3748;
  margin-bottom: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}

.editor-controls-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-modes {
  display: flex;
  gap: 4px;
}

.mode-btn {
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0;
  background: #2d3748;
  color: #e2e8f0;
  border: 1px solid #4a5568;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.mode-btn:hover {
  background: #4a5568;
  color: #f7fafc;
  border-color: #3182ce;
}

.mode-btn.active {
  background: #3182ce;
  color: white;
  border-color: #3182ce;
}

.control-buttons-compact {
  display: flex;
  gap: 4px;
}

.control-buttons-compact button {
  padding: 6px 8px;
  font-size: 0.75rem;
  margin: 0;
  min-width: 28px;
  background: #2d3748;
  color: #e2e8f0;
  border: 1px solid #4a5568;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.control-buttons-compact button:hover {
  background: #4a5568;
  color: #f7fafc;
  border-color: #3182ce;
}

.control-buttons-compact button.active {
  background: #3182ce;
  color: white;
  border-color: #3182ce;
}

.mode-controls-compact {
  padding: 8px 12px;
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.wall-height-control-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-size: 0.75rem;
}

.wall-height-control-compact input[type="range"] {
  width: 80px;
  accent-color: #3182ce;
}

.action-button-compact,
.cancel-button-compact {
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button-compact {
  background: #3182ce;
  color: white;
  border-color: #3182ce;
}

.action-button-compact:hover {
  background: #2c5aa0;
}

.cancel-button-compact {
  background: #e53e3e;
  color: white;
  border-color: #e53e3e;
}

.cancel-button-compact:hover {
  background: #c53030;
}

.creation-instructions-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a0aec0;
  font-size: 0.75rem;
}

.submodes-compact,
.object-controls-compact,
.action-controls-compact {
  display: flex;
  gap: 4px;
}

.submode-btn,
.object-btn {
  padding: 4px 8px;
  font-size: 0.75rem;
  background: #2d3748;
  color: #e2e8f0;
  border: 1px solid #4a5568;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submode-btn:hover,
.object-btn:hover {
  background: #4a5568;
  border-color: #3182ce;
}

.submode-btn.active,
.object-btn.active {
  background: #3182ce;
  color: white;
  border-color: #3182ce;
}

.delete-button-compact {
  background: #e53e3e;
  color: white;
  border: 1px solid #e53e3e;
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-button-compact:hover:not(.disabled) {
  background: #c53030;
}

.delete-button-compact.disabled {
  background: #4a5568;
  color: #a0aec0;
  border-color: #4a5568;
  cursor: not-allowed;
}

.save-menu-compact,
.load-menu-compact {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 300px;
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.menu-header-compact {
  padding: 12px 16px;
  border-bottom: 1px solid #2d3748;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-header-compact h4 {
  margin: 0;
  color: #f7fafc;
  font-size: 0.875rem;
  font-weight: 600;
}

.close-btn-compact {
  background: none;
  border: none;
  color: #a0aec0;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn-compact:hover {
  color: #f7fafc;
}

.menu-content-compact {
  padding: 16px;
}

.input-group-compact {
  margin-bottom: 12px;
}

.input-group-compact label {
  display: block;
  color: #e2e8f0;
  font-size: 0.75rem;
  margin-bottom: 4px;
}

.input-group-compact input {
  width: 100%;
  padding: 6px 8px;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 4px;
  color: #f7fafc;
  font-size: 0.75rem;
}

.button-group-compact {
  display: flex;
  gap: 8px;
}

.primary-btn-compact,
.secondary-btn-compact {
  flex: 1;
  padding: 6px 12px;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn-compact {
  background: #3182ce;
  color: white;
  border: 1px solid #3182ce;
}

.primary-btn-compact:hover {
  background: #2c5aa0;
}

.secondary-btn-compact {
  background: #2d3748;
  color: #e2e8f0;
  border: 1px solid #4a5568;
}

.secondary-btn-compact:hover {
  background: #4a5568;
}

.saved-projects-list-compact {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.saved-project-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 4px;
  margin-bottom: 4px;
}

.project-info-compact {
  flex: 1;
}

.project-name {
  display: block;
  color: #f7fafc;
  font-size: 0.75rem;
  font-weight: 500;
}

.project-date {
  display: block;
  color: #a0aec0;
  font-size: 0.625rem;
}

.project-actions-compact {
  display: flex;
  gap: 4px;
}

.action-btn-compact {
  padding: 4px 6px;
  background: #4a5568;
  border: 1px solid #718096;
  color: #e2e8f0;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.625rem;
  transition: all 0.2s ease;
}

.action-btn-compact:hover {
  background: #718096;
}

.action-btn-compact.delete:hover {
  background: #e53e3e;
  border-color: #e53e3e;
}

.no-saved-projects-compact {
  text-align: center;
  color: #a0aec0;
  font-size: 0.75rem;
  padding: 20px;
}

.import-section-compact {
  border-top: 1px solid #2d3748;
  padding-top: 12px;
}

.selection-panel-compact {
  position: absolute;
  top: 120px;
  left: 16px;
  width: 300px;
  max-width: calc(100vw - 32px);
  background: rgba(26, 32, 44, 0.95);
  border: 1px solid #3182ce;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(49, 130, 206, 0.2);
  backdrop-filter: blur(10px);
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.selection-info-compact {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(49, 130, 206, 0.3);
}

.selection-count {
  color: #63b3ed;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.selection-count::before {
  content: '✓';
  background: #3182ce;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.socket-properties-compact {
  border-top: 1px solid rgba(49, 130, 206, 0.3);
  padding-top: 12px;
}

.property-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.property-row label {
  color: #e2e8f0;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-input,
.property-select {
  width: 100%;
  padding: 8px 12px;
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #4a5568;
  border-radius: 6px;
  color: #f7fafc;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.property-input:focus,
.property-select:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
  background: rgba(45, 55, 72, 1);
}

.property-select {
  cursor: pointer;
}

.property-select option {
  background: #2d3748;
  color: #f7fafc;
  padding: 8px;
}

.toggle-switch-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #4a5568;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toggle-switch-compact:hover {
  background: rgba(45, 55, 72, 1);
  border-color: #3182ce;
}

.toggle-switch-compact input[type="checkbox"] {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #4a5568;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.toggle-switch-compact input[type="checkbox"]:checked {
  background: #3182ce;
  border-color: #3182ce;
}

.toggle-switch-compact input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}

.toggle-switch-compact label {
  color: #f7fafc;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin: 0;
  text-transform: none;
  letter-spacing: normal;
}

/* Адаптивные стили для панели выделения */
@media (max-width: 768px) {
  .selection-panel-compact {
    position: fixed;
    top: auto;
    bottom: 16px;
    left: 16px;
    right: 16px;
    width: auto;
    max-width: none;
    z-index: 1500;
  }
  
  .property-row {
    margin-bottom: 10px;
  }
  
  .property-input,
  .property-select {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .selection-panel-compact {
    bottom: 12px;
    left: 12px;
    right: 12px;
    padding: 12px;
  }
  
  .selection-count {
    font-size: 0.8rem;
  }
  
  .property-row {
    margin-bottom: 8px;
  }
  
  .property-row label {
    font-size: 0.75rem;
  }
  
  .property-input,
  .property-select {
    padding: 8px 10px;
    font-size: 0.8rem;
  }
  
  .toggle-switch-compact {
    padding: 6px 10px;
  }
  
  .toggle-switch-compact input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
  
  .toggle-switch-compact label {
    font-size: 0.8rem;
  }
}

/* IoT Dashboard Styles */
.iot-dashboard-compact {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 320px;
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  border: 1px solid #3182ce;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(49, 130, 206, 0.2);
  z-index: 1000;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.dashboard-header-compact {
  padding: 16px 20px;
  background: linear-gradient(90deg, #3182ce 0%, #4299e1 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard-header-compact h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-header-compact h4::before {
  content: '📱';
  font-size: 1.2rem;
}

.dashboard-content-compact {
  padding: 20px;
}

.dashboard-summary-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.summary-item-compact {
  background: rgba(49, 130, 206, 0.1);
  border: 1px solid rgba(49, 130, 206, 0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.summary-item-compact:hover {
  background: rgba(49, 130, 206, 0.2);
  border-color: #3182ce;
  transform: translateY(-2px);
}

.summary-value-compact {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #63b3ed;
  margin-bottom: 4px;
  text-shadow: 0 0 10px rgba(99, 179, 237, 0.3);
}

.summary-label-compact {
  display: block;
  font-size: 0.75rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.device-list-compact {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3182ce #2d3748;
}

.device-list-compact::-webkit-scrollbar {
  width: 6px;
}

.device-list-compact::-webkit-scrollbar-track {
  background: #2d3748;
  border-radius: 3px;
}

.device-list-compact::-webkit-scrollbar-thumb {
  background: #3182ce;
  border-radius: 3px;
}

.device-list-compact::-webkit-scrollbar-thumb:hover {
  background: #4299e1;
}

.no-devices-compact {
  text-align: center;
  padding: 30px 20px;
  color: #a0aec0;
  background: rgba(160, 174, 192, 0.05);
  border-radius: 8px;
  border: 2px dashed rgba(160, 174, 192, 0.2);
}

.no-devices-compact p {
  margin: 0;
  font-size: 0.875rem;
  font-style: italic;
}

.device-item-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.device-item-compact::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #718096;
  transition: all 0.3s ease;
}

.device-item-compact:hover {
  background: #4a5568;
  border-color: #3182ce;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.device-item-compact.device-active {
  background: rgba(72, 187, 120, 0.1);
  border-color: #48bb78;
}

.device-item-compact.device-active::before {
  background: linear-gradient(180deg, #48bb78 0%, #68d391 100%);
  box-shadow: 0 0 10px rgba(72, 187, 120, 0.5);
}

.device-info-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-name-compact {
  color: #f7fafc;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.device-name-compact::before {
  content: '🔌';
  font-size: 0.875rem;
}

.device-status-compact {
  color: #a0aec0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.device-active .device-status-compact {
  color: #68d391;
}

.device-toggle-btn-compact {
  background: linear-gradient(135deg, #4a5568 0%, #718096 100%);
  border: 1px solid #718096;
  color: #f7fafc;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.device-toggle-btn-compact:hover {
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  border-color: #3182ce;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(49, 130, 206, 0.3);
}

.device-active .device-toggle-btn-compact {
  background: linear-gradient(135deg, #48bb78 0%, #68d391 100%);
  border-color: #48bb78;
}

.device-active .device-toggle-btn-compact:hover {
  background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
  border-color: #38a169;
}

@media (max-width: 768px) {
  .iot-dashboard-compact {
    position: fixed !important;
    bottom: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    top: auto !important;
    width: calc(100vw - 32px) !important;
    max-width: 380px !important;
    max-height: 70vh !important;
    overflow-y: auto !important;
    z-index: 1500 !important;
    margin: 0 !important;
    /* backdrop-filter: none !important; */
  }
  
  .dashboard-content-compact {
    padding: 16px !important;
  }
  
  .dashboard-summary-compact {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important;
    margin-bottom: 16px !important;
  }
  
  .summary-item-compact {
    padding: 8px !important;
  }
  
  .summary-value-compact {
    font-size: 1.25rem !important;
  }
  
  .summary-label-compact {
    font-size: 0.7rem !important;
  }
  
  .device-list-compact {
    max-height: 150px !important;
  }
  
  .device-item-compact {
    padding: 10px 12px !important;
    margin-bottom: 6px !important;
  }
  
  .device-name-compact {
    font-size: 0.8rem !important;
  }
  
  .device-status-compact {
    font-size: 0.7rem !important;
  }
  
  .device-toggle-btn-compact {
    width: 32px !important;
    height: 32px !important;
    font-size: 0.9rem !important;
  }
  
  .iot-dashboard-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background-color: rgba(0, 0, 0, 0.4) !important;
    z-index: 1400 !important;
    cursor: pointer !important;
    display: block !important;
  }
}

@media (max-width: 480px) {
  .iot-dashboard-compact {
    bottom: 16px !important;
    width: calc(100vw - 24px) !important;
    max-height: 65vh !important;
  }
  
  .dashboard-header-compact {
    padding: 12px 16px !important;
  }
  
  .dashboard-header-compact h4 {
    font-size: 0.9rem !important;
  }
  
  .dashboard-content-compact {
    padding: 12px !important;
  }
  
  .dashboard-summary-compact {
    gap: 6px !important;
    margin-bottom: 12px !important;
  }
  
  .summary-item-compact {
    padding: 6px !important;
  }
  
  .summary-value-compact {
    font-size: 1.1rem !important;
  }
  
  .summary-label-compact {
    font-size: 0.65rem !important;
  }
  
  .device-list-compact {
    max-height: 120px !important;
  }
  
  .device-item-compact {
    padding: 8px 10px !important;
    margin-bottom: 4px !important;
  }
  
  .device-name-compact {
    font-size: 0.75rem !important;
  }
  
  .device-status-compact {
    font-size: 0.65rem !important;
  }
  
  .device-toggle-btn-compact {
    width: 28px !important;
    height: 28px !important;
    font-size: 0.8rem !important;
  }
}

/* Мобильный overlay для IoT панели */
.iot-dashboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  cursor: pointer;
}

/* Мобильный overlay для IoT панели */
.iot-dashboard-overlay {
  display: none; /* Скрыт по умолчанию на desktop */
}

@media (max-width: 768px) {
  .iot-dashboard-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background-color: rgba(0, 0, 0, 0.6) !important;
    z-index: 1400 !important;
    cursor: pointer !important;
    display: block !important;
  }
}
</style> 