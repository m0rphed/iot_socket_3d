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
      <button @click="debugMode = !debugMode" :class="{ active: debugMode }">
        Debug
      </button>
      <button @click="isSelectMode = !isSelectMode" :class="{ active: isSelectMode }">
        Выделить объекты
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

const container = ref<HTMLElement | null>(null)
const currentMode = ref<'room' | 'object'>('room')
const wallHeight = ref(2.5)
const selectedObjectType = ref<WallObjectType>('socket')
const isDeleteMode = ref(false)
const debugMode = ref(false)
const isSelectMode = ref(true)
let selectionMethod: 'raycast' | 'boundingBox' = 'boundingBox' // можно переключать для теста

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
let debugSceneObjects: THREE.Object3D[] = []

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
  // Позиционируем стены (пример, можно доработать)
  wallMeshes[0].position.set(0, wallHeight.value / 2, -2)
  wallMeshes[1].position.set(2, wallHeight.value / 2, 0)
  wallMeshes[1].rotation.y = Math.PI / 2
  wallMeshes[2].position.set(0, wallHeight.value / 2, 2)
  wallMeshes[2].rotation.y = Math.PI
  wallMeshes[3].position.set(-2, wallHeight.value / 2, 0)
  wallMeshes[3].rotation.y = -Math.PI / 2

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

const addInnerRoomObject = (type: WallObjectType, wall: Wall, pos: number, room: RoomClass) => {
  if (type === 'socket') {
    return room.addSocket(wall, pos)
  } else {
    return room.addDoor(wall, pos)
  }
}

// Функция поиска WallObject по parent-цепочке
function findWallObjectByObject(object: THREE.Object3D, wallObjects: WallObject[]): WallObject | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    const found = wallObjects.find(w => w.getObject() === current);
    if (found) return found;
    current = current.parent;
  }
  return null;
}

const getAllWallObjectGroups = () => rooms.flatMap(room => room.getWallObjects().map(obj => obj.getObject()))

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ВЫДЕЛЕНИЯ ---

function selectWallObjectRaycast(mouse: THREE.Vector2, camera: THREE.Camera): WallObject | null {
  const allWallObjectGroups = getAllWallObjectGroups()
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(allWallObjectGroups, true)
  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object
    for (const room of rooms) {
      const wallObject = findWallObjectByObject(intersectedObject, room.getWallObjects())
      if (wallObject) return wallObject
    }
  }
  return null
}

function selectWallObjectBoundingBox(mouseEvent: MouseEvent, camera: THREE.Camera): WallObject | null {
  // Получаем все wallObject'ы
  const allWallObjects = rooms.flatMap(room => room.getWallObjects())
  if (!container.value) return null
  const rect = container.value.getBoundingClientRect()
  // mouseEvent.clientX/Y — абсолютные координаты мыши
  for (const wallObject of allWallObjects) {
    const mesh = wallObject.getMesh()
    // Получаем 8 углов bounding box в world
    mesh.geometry.computeBoundingBox()
    const bbox = mesh.geometry.boundingBox
    if (!bbox) continue
    const points = [
      new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
      new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
      new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
      new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
      new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z),
    ]
    // Переводим в world
    points.forEach(p => mesh.localToWorld(p))
    // Проецируем в экранные координаты
    const screenPoints = points.map(p => {
      const projected = p.clone().project(camera)
      return {
        x: (projected.x + 1) / 2 * rect.width + rect.left,
        y: (-projected.y + 1) / 2 * rect.height + rect.top
      }
    })
    // Находим screen-space bounding box
    const minX = Math.min(...screenPoints.map(p => p.x))
    const maxX = Math.max(...screenPoints.map(p => p.x))
    const minY = Math.min(...screenPoints.map(p => p.y))
    const maxY = Math.max(...screenPoints.map(p => p.y))
    // Проверяем попадание мыши
    if (
      mouseEvent.clientX >= minX && mouseEvent.clientX <= maxX &&
      mouseEvent.clientY >= minY && mouseEvent.clientY <= maxY
    ) {
      return wallObject
    }
  }
  return null
}

// --- МОДИФИЦИРОВАННЫЙ onMouseDown ---
const onMouseDown = (event: MouseEvent) => {
  const rect = container.value?.getBoundingClientRect()
  if (!rect) return
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  if (isSelectMode.value) {
    let foundWallObject: WallObject | null = null
    if (selectionMethod === 'raycast') {
      foundWallObject = selectWallObjectRaycast(mouse, camera)
    } else if (selectionMethod === 'boundingBox') {
      const allWallObjects = rooms.flatMap(room => room.getWallObjects())
      foundWallObject = selectionManager.findObjectByBoundingBox(event, camera, allWallObjects, container.value) as WallObject
    }
    
    if (foundWallObject) {
      if (foundWallObject.isSelected) {
        selectionManager.deselect(foundWallObject)
      } else {
        selectionManager.select(foundWallObject)
      }
    } else {
      selectionManager.clear()
    }
    return
  }

  if (currentMode.value === 'room') {
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
  } else if (currentMode.value === 'object') {
    // Новый режим удаления
    if (isDeleteMode.value) {
      // Найти комнату, которой принадлежит объект
      for (const room of rooms) {
        const wallObject = findWallObjectByObject(event.target as THREE.Object3D, room.getWallObjects())
        if (wallObject) {
          // Визуально выделить объект (например, временно изменить цвет)
          const mesh = wallObject.getMesh()
          const origColor = mesh.material instanceof THREE.MeshStandardMaterial ? mesh.material.color.getHex() : null
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.color.set(0xff4444)
            setTimeout(() => {
              mesh.material.color.set(origColor)
              // Удалить объект
              room.removeWallObject(wallObject)
            }, 180)
          } else {
            // Просто удалить, если не удалось подсветить
            room.removeWallObject(wallObject)
          }
          break
        }
      }
      return
    }
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
        if (selectedObjectType.value === 'socket') {
          room.addSocket(wallObj, 0.5)
        } else {
          room.addDoor(wallObj, 0.5)
        }
      }
    }
  }

  // Используем метод placeGhostObject при клике на ghost-объект
  if (currentMode.value === 'object' && !isDeleteMode.value && sceneManager.getGhostWallObject()) {
    try {
      sceneManager.placeGhostObject()
    } catch (error) {
      console.error('Error placing ghost object:', error)
    }
    return
  }
}

// --- МОДИФИЦИРОВАННЫЙ onMouseMove (hover для selectMode) ---
const onMouseMove = (event: MouseEvent) => {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  if (isSelectMode.value) {
    let found: WallObject | null = null
    if (selectionMethod === 'raycast') {
      const allWallObjectGroups = getAllWallObjectGroups()
      found = selectWallObjectRaycast(mouse, camera)
    } else if (selectionMethod === 'boundingBox') {
      const allWallObjects = rooms.flatMap(room => room.getWallObjects())
      found = selectionManager.findObjectByBoundingBox(event, camera, allWallObjects, container.value) as WallObject
    }
    
    if (found) {
      selectionManager.hover(found)
    } else {
      selectionManager.unhoverCurrent()
    }
    return
  }

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
    // Используем новый метод из SceneManager
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
  if (debugSphere) {
    scene.remove(debugSphere)
    debugSphere = null
  }
}

const setObjectType = (type: WallObjectType) => {
  selectedObjectType.value = type
  isDeleteMode.value = false
  if (debugSphere) {
    scene.remove(debugSphere)
    debugSphere = null
  }
}

const setDeleteMode = (value: boolean) => {
  isDeleteMode.value = value
  if (debugSphere) {
    scene.remove(debugSphere)
    debugSphere = null
  }
}

const updateWallHeight = () => {
  rooms.forEach(room => room.setWallHeight(wallHeight.value))
  
  // Обновляем debug маркеры, если режим debug включен
  if (debugMode.value) {
    removeAllDebugMarkers()
    addAllDebugMarkers()
  }
}

function addAllDebugMarkers() {
  debugSceneObjects = []
  rooms.forEach(room => {
    // Красная сфера в центре комнаты
    const roomCenter = new THREE.Vector3()
    room.getObject().getWorldPosition(roomCenter)
    const roomSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    roomSphere.position.copy(roomCenter)
    roomSphere.userData.isDebug = true
    scene.add(roomSphere)
    debugSceneObjects.push(roomSphere)
    // Для каждой стены
    room.getWalls().forEach((wall, idx) => {
      // Подпись
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 32
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = '24px Arial'
      ctx.fillStyle = 'black'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('WALL ' + idx, canvas.width / 2, canvas.height / 2)
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(0.7, 0.18, 1)
      const wallCenter = new THREE.Vector3()
      wall.getWorldPosition(wallCenter)

      // Смещение подписи вдоль нормали стены, чтобы она была поверх
      const worldNormal = wall.getWorldNormal()
      sprite.position.copy(wallCenter.add(worldNormal.clone().multiplyScalar(0.12)))
      sprite.position.y += 0.4
      sprite.userData.isDebug = true
      scene.add(sprite)
      debugSceneObjects.push(sprite)

      // Стрелка нормали
      const arrowStart = wallCenter.clone().add(new THREE.Vector3(0, 0.08, 0))
      const arrowGeom = new THREE.BufferGeometry().setFromPoints([
        arrowStart,
        arrowStart.clone().add(worldNormal.clone().multiplyScalar(0.5))
      ])
      const arrowMat = new THREE.LineBasicMaterial({ color: 0x00ff00 })
      const arrow = new THREE.Line(arrowGeom, arrowMat)
      arrow.userData.isDebug = true
      scene.add(arrow)
      debugSceneObjects.push(arrow)
      // Локальные оси и жёлтая сфера (дочерние объекты стены)
      addDebugAxesToWall(wall)
    })
  })
}

function addDebugAxesToWall(wall: Wall) {
  // Жёлтая сфера в локальных координатах стены
  const sphereGeometry = new THREE.SphereGeometry(0.07, 12, 12)
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(0, 0, 0)
  sphere.userData.isDebug = true
  wall.mesh.add(sphere)
  // Оси
  const axisLength = 0.5
  // X - красный
  const xGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(axisLength, 0, 0)
  ])
  const xMat = new THREE.LineBasicMaterial({ color: 0xff0000 })
  const xLine = new THREE.Line(xGeom, xMat)
  xLine.userData.isDebug = true
  wall.mesh.add(xLine)
  // Y - зелёный
  const yGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, axisLength, 0)
  ])
  const yMat = new THREE.LineBasicMaterial({ color: 0x00ff00 })
  const yLine = new THREE.Line(yGeom, yMat)
  yLine.userData.isDebug = true
  wall.mesh.add(yLine)
  // Z - синий
  const zGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, axisLength)
  ])
  const zMat = new THREE.LineBasicMaterial({ color: 0x0000ff })
  const zLine = new THREE.Line(zGeom, zMat)
  zLine.userData.isDebug = true
  wall.mesh.add(zLine)
}

function removeAllDebugMarkers() {
  // Удалить из сцены все объекты
  debugSceneObjects.forEach(obj => {
    if (obj.parent) obj.parent.remove(obj)
    scene.remove(obj)
  })
  debugSceneObjects = []
  // Удалить все дочерние debug-объекты у стен
  rooms.forEach(room => {
    room.getWalls().forEach(wall => {
      const toRemove: THREE.Object3D[] = []
      wall.mesh.children.forEach(child => {
        if (child.userData && child.userData.isDebug) toRemove.push(child)
      })
      toRemove.forEach(child => wall.mesh.remove(child))
    })
  })
}

watch(debugMode, (val) => {
  if (val) {
    removeAllDebugMarkers()
    addAllDebugMarkers()
  } else {
    removeAllDebugMarkers()
  }
})

watch(isSelectMode, (val) => {
  if (val) {
    // Убрать ghost-объект при входе в режим выделения
    sceneManager.removeGhostObject()
  } else {
    // Снять hover/выделение при выходе из режима
    selectionManager.unhoverCurrent()
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