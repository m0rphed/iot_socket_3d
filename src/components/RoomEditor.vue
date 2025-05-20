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
        <button @click="addRoom">
          Добавить комнату
        </button>
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
      </div>
      
      <!-- Кнопка Debug доступна всегда -->
      <div class="debug-control">
        <button @click="debugMode = !debugMode" :class="{ active: debugMode }">
          Debug
        </button>
      </div>
    </div>
    
    <!-- Панель управления выделенными объектами -->
    <div v-if="currentMode === 'object' && isSelectMode && selectionManager.selectedObjects.length > 0" class="selection-panel">
      <div class="selection-info">
        <span class="selection-count">Выделено объектов: {{ selectedObjectsCount }}</span>
        <div class="selection-types">
          <span v-if="getSelectedTypeCount('socket') > 0">Розетки: {{ getSelectedTypeCount('socket') }}</span>
          <span v-if="getSelectedTypeCount('door') > 0">Двери: {{ getSelectedTypeCount('door') }}</span>
        </div>
      </div>
      <button @click="deleteSelectedObjects()" class="delete-button">
        Удалить выделенные объекты
      </button>
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
import { Socket } from '../core/objects/Socket'
import { Door } from '../core/objects/Door'
import { DebugHelper } from '../core/utils/DebugHelper'

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

const selectionManager = new SelectionManager()
const sceneManager = new SceneManager()

// Связываем менеджеры между собой
selectionManager.setSceneManager(sceneManager)

const init = () => {
  if (!container.value) return

  // Создание сцены
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)
  
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

  // Добавление начальной комнаты
  addRoom()

  animate()
}

const addRoom = () => {
  // Создаём стены
  const wallMeshes: THREE.Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const wallGeom = new THREE.BoxGeometry(4, wallHeight.value, WALL_PARAMS.thickness)
    const wallMat = new THREE.MeshStandardMaterial({ color: WALL_PARAMS.color, transparent: true, opacity: WALL_PARAMS.opacity })
    const wallMesh = new THREE.Mesh(wallGeom, wallMat)
    wallMeshes.push(wallMesh)
  }
  
  // Позиционируем стены с установкой правильного направления нормали внутрь комнаты
  positionWallsWithInwardNormals(wallMeshes, 4, 4, wallHeight.value)

  // Создаём объекты Wall
  const walls = wallMeshes.map(mesh => new Wall(mesh))

  // Создаём пол
  const floorGeom = new THREE.BoxGeometry(4, 0.1, 4)
  const floorMat = new THREE.MeshStandardMaterial({ color: FLOOR_PARAMS.color, transparent: true, opacity: FLOOR_PARAMS.opacity })
  const floorMesh = new THREE.Mesh(floorGeom, floorMat)
  floorMesh.position.set(0, -0.05, 0)
  const floor = new Floor(floorMesh)

  // Группа для комнаты
  const group = new THREE.Group()
  walls.forEach(w => group.add(w.mesh))
  group.add(floor.mesh)

  // Создаём Room
  const room = new RoomClass(group, walls, floor)
  scene.add(group)
  rooms.push(room)
  sceneManager.add(room)
}

/**
 * Устанавливает позиции и повороты стен так, чтобы нормали были направлены внутрь комнаты
 * @param walls Массив мешей стен
 * @param width Ширина комнаты
 * @param height Глубина комнаты
 * @param wallHeight Высота стен
 */
const positionWallsWithInwardNormals = (
  walls: THREE.Mesh[],
  width: number,
  height: number,
  wallHeight: number
) => {
  if (walls.length !== 4) {
    console.error('Ожидается 4 стены для позиционирования')
    return
  }

  // Передняя стена
  walls[0].position.set(0, wallHeight / 2, -height / 2)
  walls[0].rotation.y = 0 // Нормаль уже смотрит внутрь

  // Правая стена (нормаль внутрь = поворот -90 градусов)
  walls[1].position.set(width / 2, wallHeight / 2, 0)
  walls[1].rotation.y = -Math.PI / 2 // Поворот на -90 градусов для направления нормали внутрь

  // Задняя стена
  walls[2].position.set(0, wallHeight / 2, height / 2)
  walls[2].rotation.y = Math.PI // Поворот на 180 градусов для направления нормали внутрь

  // Левая стена (нормаль внутрь = поворот 90 градусов)
  walls[3].position.set(-width / 2, wallHeight / 2, 0)
  walls[3].rotation.y = Math.PI / 2 // Поворот на 90 градусов для направления нормали внутрь
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

  if (currentMode.value === 'room') {
    handleRoomModeClick(event)
  } else if (currentMode.value === 'object') {
    handleObjectModeClick(event)
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

// Обработчик клика в режиме комнат
const handleRoomModeClick = (event: MouseEvent) => {
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

// Обработчик клика в режиме объектов
const handleObjectModeClick = (event: MouseEvent) => {
  // Проверяем, является ли объект стеной или объектом на стене
  const wall = event.target as THREE.Mesh
  const room = rooms.find(room => 
    room.getWalls().some(w => w.mesh === wall)
  )
  
  if (room) {
    // Находим конкретную Wall, соответствующую THREE.Mesh
    const wallObj = room.getWalls().find(w => w.mesh === wall)
    if (!wallObj) return

    // Проверяем, не является ли объект частью существующего объекта на стене
    const wallObject = room.getWallObjects().find(obj => obj.getObject() === event.target)
    
    if (wallObject) {
      // Начинаем перетаскивание существующего объекта
      selectedWallObject = wallObject
      selectedWallObject.startDrag(mouse)
      controls.enabled = false
    } else {
      // Добавляем новый объект на стену (только если не в режиме выделения)
      if (!isSelectMode.value) {
        if (selectedObjectType.value === 'socket') {
          room.addSocket(wallObj, 0.5)
        } else {
          room.addDoor(wallObj, 0.5)
        }
      }
    }
  }

  // Используем метод placeGhostObject при клике на ghost-объект
  if (sceneManager.getGhostWallObject()) {
    try {
      sceneManager.placeGhostObject()
    } catch (error) {
      console.error('Error placing ghost object:', error)
    }
  }
}

// --- МОДИФИЦИРОВАННЫЙ onMouseMove ---
const onMouseMove = (event: MouseEvent) => {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  // Hover-эффект для режима выделения объектов
  if (currentMode.value === 'object' && isSelectMode.value) {
    handleSelectionModeHover(event)
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
  const deltaX = mouse.x - dragStart.x
  const deltaY = mouse.y - dragStart.y

  // Преобразование движения мыши в изменение размера
  const worldDelta = new THREE.Vector3(deltaX, 0, deltaY)
  worldDelta.applyQuaternion(camera.quaternion)
  worldDelta.y = 0

  // Определяем, какой маркер выбран и как изменять размеры
  const markerPosition = selectedMarker!.position
  const newWidth = Math.max(2, initialSize.width + (markerPosition.x > 0 ? worldDelta.x : -worldDelta.x) * 2)
  const newHeight = Math.max(2, initialSize.height + (markerPosition.z > 0 ? worldDelta.z : -worldDelta.z) * 2)

  // Округление до ближайшей сетки
  const gridSize = 0.5
  const roundedWidth = Math.round(newWidth / gridSize) * gridSize
  const roundedHeight = Math.round(newHeight / gridSize) * gridSize

  selectedRoom!.setSize(roundedWidth, roundedHeight)
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
}

const animate = () => {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

const setMode = (mode: 'room' | 'object') => {
  if (currentMode.value !== mode) {
    selectionManager.clear()
    isSelectMode.value = false
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
  const selectedObjects = [...selectionManager.selectedObjects] // Создаем копию массива
  selectedObjects.forEach(obj => {
    const room = rooms.find(room => room.getWallObjects().includes(obj))
    if (room) {
      room.removeWallObject(obj)
    }
  })
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

onMounted(() => {
  init()
  window.addEventListener('resize', () => {
    if (!container.value) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  })
})

onUnmounted(() => {
  if (container.value) {
    container.value.removeEventListener('mousedown', onMouseDown)
    container.value.removeEventListener('mousemove', onMouseMove)
    container.value.removeEventListener('mouseup', onMouseUp)
    container.value.removeChild(renderer.domElement)
  }
  
  // Очищаем сцену и менеджеры
  sceneManager.clear()
  selectionManager.clear()
  if (debugHelper) debugHelper.removeAllDebugMarkers()
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
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.main-modes {
  display: flex;
  gap: 10px;
}

.main-modes button {
  flex: 1;
  font-weight: bold;
}

.mode-controls {
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
}

.submodes {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.submodes button {
  flex: 1;
}

button {
  margin: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #e0e0e0;
  cursor: pointer;
  transition: background 0.3s, transform 0.1s;
}

button:hover {
  background: #d0d0d0;
}

button:active {
  transform: scale(0.98);
}

button.active {
  background: #2196f3;
  color: white;
}

.wall-height-control {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.object-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input[type="range"] {
  width: 150px;
}

.selection-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.selection-info {
  margin-bottom: 10px;
}

.selection-count {
  font-weight: bold;
  font-size: 1.1em;
}

.selection-types {
  margin-top: 5px;
  display: flex;
  gap: 10px;
}

.delete-button {
  margin-top: 10px;
  background: #ff4444;
  color: white;
  font-weight: bold;
  padding: 10px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.delete-button:hover {
  background: #ff2222;
}

.debug-control {
  margin-top: 10px;
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
}
</style> 