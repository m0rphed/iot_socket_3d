<template>
  <div class="room-editor">
    <div ref="container" class="editor-container"></div>
    <div class="editor-controls">
      <button @click="setMode('room')" :class="{ active: currentMode === 'room' }">
        Редактирование комнат
      </button>
      <button @click="setMode('object')" :class="{ active: currentMode === 'object' }">
        Добавление объектов
      </button>
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
      <button v-if="currentMode === 'room'" @click="addRoom">
        Добавить комнату
      </button>
      <div v-if="currentMode === 'object'" class="object-controls">
        <button @click="setObjectType('socket')" :class="{ active: selectedObjectType === 'socket' }">
          Добавить розетку
        </button>
        <button @click="setObjectType('door')" :class="{ active: selectedObjectType === 'door' }">
          Добавить дверь
        </button>
        <button @click="setDeleteMode(!isDeleteMode)" :class="{ active: isDeleteMode }">
          {{ isDeleteMode ? 'Отменить удаление' : 'Удалить объект' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Room } from './Room'
import type { WallObjectType } from './WallObject'
import { WallObject } from './WallObject'

const container = ref<HTMLElement | null>(null)
const currentMode = ref<'room' | 'object'>('room')
const wallHeight = ref(2.5)
const selectedObjectType = ref<WallObjectType>('socket')
const isDeleteMode = ref(false)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let gridHelper: THREE.GridHelper
let rooms: Room[] = []
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let selectedRoom: Room | null = null
let selectedMarker: THREE.Mesh | null = null
let selectedWallObject: WallObject | null = null
let isDragging = false
let isResizing = false
let dragStart = new THREE.Vector2()
let initialSize = { width: 0, height: 0 }
let ghostWallObject: WallObject | null = null
let ghostWall: THREE.Mesh | null = null
let debugSphere: THREE.Mesh | null = null

const init = () => {
  if (!container.value) return

  // Создание сцены
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

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
  const room = new Room(4, 4, wallHeight.value)
  const roomObject = room.getObject()
  scene.add(roomObject)
  rooms.push(room)
}

const onMouseDown = (event: MouseEvent) => {
  const rect = container.value?.getBoundingClientRect()
  if (!rect) return

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object

    if (currentMode.value === 'room') {
      // Проверяем, является ли объект маркером изменения размера
      const marker = intersectedObject as THREE.Mesh
      const room = rooms.find(room => room.getResizeMarkers().includes(marker))
      
      if (room) {
        selectedRoom = room
        selectedMarker = marker
        isResizing = true
        initialSize = room.getSize()
        controls.enabled = false
      } else {
        // Если это не маркер, проверяем, является ли объект частью комнаты
        const roomObject = intersectedObject.parent
        selectedRoom = rooms.find(room => room.getObject() === roomObject) || null
        if (selectedRoom) {
          isDragging = true
          dragStart.set(mouse.x, mouse.y)
          controls.enabled = false
        }
      }
    } else if (currentMode.value === 'object') {
      // Проверяем, является ли объект стеной или объектом на стене
      const wall = intersectedObject as THREE.Mesh
      const room = rooms.find(room => room.getWalls().includes(wall))
      
      if (room) {
        // Проверяем, не является ли объект частью существующего объекта на стене
        const wallObject = room.getWallObjects().find(obj => obj.getObject() === intersectedObject)
        
        if (wallObject) {
          if (isDeleteMode.value) {
            // Удаляем объект
            room.removeWallObject(wallObject)
          } else {
            // Начинаем перетаскивание существующего объекта
            selectedWallObject = wallObject
            selectedWallObject.startDrag(mouse)
            controls.enabled = false
          }
        } else if (!isDeleteMode.value) {
          // Добавляем новый объект на стену
          const newWallObject = room.addWallObject(selectedObjectType.value, wall)
          
          // Если это дверь, размещаем её на уровне пола
          if (selectedObjectType.value === 'door') {
            newWallObject.setHeight(1) // Высота двери 2 метра, центр на высоте 1 метр
          }
        }
      }
    }
  }

  if (currentMode.value === 'object' && !isDeleteMode.value && ghostWallObject && ghostWall) {
    // Закрепляем объект на стене
    const room = rooms.find(r => r.getWalls().includes(ghostWall!))
    if (room) {
      const pos = ghostWallObject.getPosition()
      const height = ghostWallObject.getType() === 'door' ? 1 : 0.5
      room.addWallObject(selectedObjectType.value, ghostWall, pos, height)
    }
    scene.remove(ghostWallObject.getObject())
    ghostWallObject = null
    ghostWall = null
    return
  }
}

const onMouseMove = (event: MouseEvent) => {
  if (!container.value) return

  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  if (isDragging && selectedRoom) {
    const deltaX = mouse.x - dragStart.x
    const deltaY = mouse.y - dragStart.y

    // Преобразование движения мыши в движение в пространстве сцены
    const worldDelta = new THREE.Vector3(deltaX, 0, deltaY)
    worldDelta.applyQuaternion(camera.quaternion)
    worldDelta.y = 0

    // Округление до ближайшей сетки
    const gridSize = 0.5
    const newX = Math.round((selectedRoom.getObject().position.x + worldDelta.x) / gridSize) * gridSize
    const newZ = Math.round((selectedRoom.getObject().position.z + worldDelta.z) / gridSize) * gridSize

    selectedRoom.setPosition(newX, newZ)
    dragStart.set(mouse.x, mouse.y)
  } else if (isResizing && selectedRoom && selectedMarker) {
    const deltaX = mouse.x - dragStart.x
    const deltaY = mouse.y - dragStart.y

    // Преобразование движения мыши в изменение размера
    const worldDelta = new THREE.Vector3(deltaX, 0, deltaY)
    worldDelta.applyQuaternion(camera.quaternion)
    worldDelta.y = 0

    // Определяем, какой маркер выбран и как изменять размеры
    const markerPosition = selectedMarker.position
    const newWidth = Math.max(2, initialSize.width + (markerPosition.x > 0 ? worldDelta.x : -worldDelta.x) * 2)
    const newHeight = Math.max(2, initialSize.height + (markerPosition.z > 0 ? worldDelta.z : -worldDelta.z) * 2)

    // Округление до ближайшей сетки
    const gridSize = 0.5
    const roundedWidth = Math.round(newWidth / gridSize) * gridSize
    const roundedHeight = Math.round(newHeight / gridSize) * gridSize

    selectedRoom.setSize(roundedWidth, roundedHeight)
  } else if (selectedWallObject) {
    selectedWallObject.updateDrag(mouse, camera)
  } else if (currentMode.value === 'object' && !isDeleteMode.value) {
    raycaster.setFromCamera(mouse, camera)
    let foundWall: THREE.Mesh | null = null
    let foundRoom: Room | null = null
    let minDist = Infinity
    let intersectPoint: THREE.Vector3 | null = null
    let localX = 0.0
    for (const room of rooms) {
      for (const wall of room.getWalls()) {
        const intersects = raycaster.intersectObject(wall, false)
        if (intersects.length > 0 && intersects[0].distance < minDist) {
          foundWall = wall
          foundRoom = room
          minDist = intersects[0].distance
          intersectPoint = intersects[0].point.clone()
          // Универсальное позиционирование: получаем локальные координаты точки на стене
          const local = wall.worldToLocal(intersects[0].point.clone())
          // Получаем длину стены по X (всегда, т.к. для вертикальных стен есть rotation)
          const wallSize = new THREE.Vector3()
          wall.geometry.computeBoundingBox()
          wall.geometry.boundingBox?.getSize(wallSize)
          // Преобразуем локальный X в диапазон [0,1] вдоль стены
          localX = (local.x / wallSize.x) + 0.5
        }
      }
    }
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
    if (foundWall && foundRoom) {
      ghostWall = foundWall
      // Snapping к сетке и границам
      let pos = Math.max(0.05, Math.min(0.95, Math.round(localX * 10) / 10))
      // Создаём или обновляем ghost-объект
      if (!ghostWallObject || ghostWallObject.getType() !== selectedObjectType.value || ghostWallObject.getWall() !== foundWall) {
        if (ghostWallObject) scene.remove(ghostWallObject.getObject())
        ghostWallObject = new WallObject(selectedObjectType.value, foundWall, pos, selectedObjectType.value === 'door' ? 1 : 0.3, true)
        scene.add(ghostWallObject.getObject())
      } else {
        ghostWallObject.setPosition(pos)
      }
    } else {
      if (ghostWallObject) {
        scene.remove(ghostWallObject.getObject())
        ghostWallObject = null
        ghostWall = null
      }
    }
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
  currentMode.value = mode
  isDeleteMode.value = false
  if (ghostWallObject) {
    scene.remove(ghostWallObject.getObject())
    ghostWallObject = null
    ghostWall = null
  }
}

const setObjectType = (type: WallObjectType) => {
  selectedObjectType.value = type
  isDeleteMode.value = false
  if (ghostWallObject) {
    scene.remove(ghostWallObject.getObject())
    ghostWallObject = null
    ghostWall = null
  }
}

const setDeleteMode = (value: boolean) => {
  isDeleteMode.value = value
  if (ghostWallObject) {
    scene.remove(ghostWallObject.getObject())
    ghostWallObject = null
    ghostWall = null
  }
}

const updateWallHeight = () => {
  rooms.forEach(room => room.setWallHeight(wallHeight.value))
}

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
}

button {
  margin: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #e0e0e0;
  cursor: pointer;
  transition: background 0.3s;
}

button.active {
  background: #2196f3;
  color: white;
}

.wall-height-control {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.object-controls {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input[type="range"] {
  width: 150px;
}
</style> 