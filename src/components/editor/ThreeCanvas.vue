<template>
  <div ref="container" class="editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Room as RoomClass } from '../../core/objects/Room'
import { SceneManager } from '../../core/managers/SceneManager'
import { SelectionManager } from '../../core/managers/SelectionManager'
import { DebugHelper } from '../../core/utils/DebugHelper'
import { useRoomCreation } from '../../composables/useRoomCreation'
import { useObjectPlacement } from '../../composables/useObjectPlacement'
import { useSelection } from '../../composables/useSelection'
import type { WallObjectType } from '../../core/objects/WallObject'

// Определяем пропсы
const props = defineProps<{
  debugMode: boolean,
  wallHeight?: number,
  isCreatingRoom: boolean,
  isSelectMode: boolean,
  objectType: WallObjectType
}>()

// Определяем эмиты
const emit = defineEmits<{
  (e: 'room-created', room: RoomClass): void,
  (e: 'room-selected', room: RoomClass | null): void,
  (e: 'mouse-event', event: {type: string, mouse: THREE.Vector2, event: MouseEvent}): void,
  (e: 'selection-changed', count: number): void,
  (e: 'set-cursor', style: string): void,
  (e: 'room-creation-finished'): void,
  (e: 'update:roomStartPoint', point: THREE.Vector3 | null): void,
  (e: 'object-added', type: WallObjectType): void
}>()

// Refs
const container = ref<HTMLElement | null>(null)
const rooms = ref<RoomClass[]>([])

// THREE.js объекты
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let gridHelper: THREE.GridHelper
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// Менеджеры
let sceneManager: SceneManager
let selectionManager: SelectionManager
let debugHelper: DebugHelper

// Состояние взаимодействия
let isDragging = false
let isResizing = false
let dragStart = new THREE.Vector2()
let initialSize = { width: 0, height: 0 }
let selectedRoom: RoomClass | null = null
let selectedMarker: THREE.Mesh | null = null

// По умолчанию высота стены 2.5
const defaultWallHeight = 2.5

// Вычисляем фактическую высоту стены
const actualWallHeight = computed(() => props.wallHeight || defaultWallHeight)

// Инициализация трехмерной сцены
const init = () => {
  console.log('Начинаем инициализацию Three.js')
  if (!container.value) {
    console.error('Контейнер не найден, инициализация невозможна')
    return
  }
  
  console.log('Размеры контейнера:', container.value.clientWidth, container.value.clientHeight)

  try {
    // Создание сцены
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    console.log('Сцена создана')
    
    // Создаем менеджеры
    sceneManager = new SceneManager()
    selectionManager = new SelectionManager()
    console.log('Менеджеры созданы')
    
    // Инициализируем DebugHelper
    debugHelper = new DebugHelper(scene)
    
    // Связываем менеджеры между собой
    selectionManager.setSceneManager(sceneManager)
    sceneManager.setScene(scene)
    
    // Устанавливаем колбэк для обновления счетчика выделенных объектов
    selectionManager.setOnSelectionChangeCallback(() => {
      emit('selection-changed', selectionManager.selectedObjects.length)
    })

    // Настройка камеры
    camera = new THREE.PerspectiveCamera(
      75,
      container.value.clientWidth / container.value.clientHeight,
      0.1,
      1000
    )
    camera.position.set(5, 5, 5)
    camera.lookAt(0, 0, 0)
    console.log('Камера настроена')

    // Настройка рендерера
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.value.appendChild(renderer.domElement)
    console.log('Рендерер создан с размерами:', window.innerWidth, window.innerHeight)

    // Добавление сетки
    gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000)
    scene.add(gridHelper)

    // Настройка контролов
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    console.log('Контролы настроены')

    // Добавление освещения
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)
    console.log('Освещение добавлено')

    // Инициализация рейкастера и вектора мыши
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    // Запускаем анимационный цикл
    animate()
    console.log('Анимационный цикл запущен')
    
    // Инициализируем composables
    roomCreation = useRoomCreation(scene, raycaster, camera)
    objectPlacement = useObjectPlacement(sceneManager, raycaster, camera)
    selection = useSelection(selectionManager)
    console.log('Composables инициализированы')
    
    console.log('Инициализация Three.js успешно завершена')
  } catch (error) {
    console.error('Ошибка при инициализации Three.js:', error)
  }
}

// Composables
let roomCreation: ReturnType<typeof useRoomCreation>
let objectPlacement: ReturnType<typeof useObjectPlacement>
let selection: ReturnType<typeof useSelection>

// Обработчики событий мыши
const onMouseDown = (event: MouseEvent) => {
  if (!container.value) return
  
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  console.log('MouseDown событие:', { 
    x: mouse.x, 
    y: mouse.y, 
    isCreatingRoom: props.isCreatingRoom,
    internalIsCreatingRoom: roomCreation?.isCreatingRoom.value 
  })
  
  // Передаем событие наверх
  emit('mouse-event', { type: 'mousedown', mouse, event })
  
  // Обрабатываем создание комнаты
  if (props.isCreatingRoom) {
    console.log('Обрабатываем клик в режиме создания комнаты')
    // Синхронизируем состояние создания комнаты, если нужно
    if (roomCreation && !roomCreation.isCreatingRoom.value) {
      console.log('Восстанавливаем состояние создания комнаты в composable')
      roomCreation.startRoomCreation()
    }
    
    const wallHeightForRoom = actualWallHeight.value
    console.log('Высота стены:', wallHeightForRoom)
    
    const result = roomCreation.handleRoomModeClick(mouse, wallHeightForRoom)
    console.log('Результат клика в режиме комнаты:', result)
    
    if (result.room) {
      console.log('Комната создана, добавляем в сцену')
      // Добавляем комнату в сцену
      scene.add(result.room.getObject())
      rooms.value.push(result.room)
      sceneManager.add(result.room)
      emit('room-created', result.room)
      // Отправляем сигнал о завершении создания комнаты, не меняя режим
      emit('room-creation-finished')
      console.log('Отправлен сигнал о завершении создания комнаты, сохраняем текущий режим')
    }
    
    if (result.cursorStyle) {
      emit('set-cursor', result.cursorStyle)
    }
    
    return
  }
  
  // Обрабатываем выделение
  if (selection.isSelectMode.value) {
    selection.handleSelectionModeClick(
      event, 
      mouse, 
      camera, 
      raycaster, 
      container.value, 
      rooms.value.flatMap((room: RoomClass) => room.getWallObjects())
    )
    return
  }
  
  // Обрабатываем размещение объектов
  if (objectPlacement.selectedObjectType.value) {
    const result = objectPlacement.handleObjectModeClick(event, mouse, rooms.value)
    if (result) {
      controls.enabled = false
      return
    }
  }
  
  // Проверяем, является ли объект маркером изменения размера
  const target = event.target as unknown as THREE.Mesh
  const room = rooms.value.find((room: RoomClass) => room.getResizeMarkers().includes(target))
  
  if (room) {
    selectedRoom = room
    selectedMarker = target
    isResizing = true
    initialSize = room.getSize()
    controls.enabled = false
    emit('room-selected', room)
  } else {
    // Если это не маркер, проверяем, является ли объект частью комнаты
    const roomObject = event.target as unknown as THREE.Object3D
    const clickedRoom = rooms.value.find((r: RoomClass) => r.getObject() === roomObject) || null
    if (clickedRoom) {
      selectedRoom = clickedRoom
      isDragging = true
      dragStart.set(mouse.x, mouse.y)
      controls.enabled = false
      emit('room-selected', clickedRoom)
    } else {
      emit('room-selected', null)
    }
  }
}

const onMouseMove = (event: MouseEvent) => {
  if (!container.value) return
  
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  // Передаем событие наверх
  emit('mouse-event', { type: 'mousemove', mouse, event })
  
  // Обрабатываем наведение при создании комнаты
  if (props.isCreatingRoom) {
    console.log('Наведение в режиме создания комнаты, позиция:', { x: mouse.x, y: mouse.y })
    
    // Проверяем состояние в composable и синхронизируем если нужно
    if (roomCreation && !roomCreation.isCreatingRoom.value) {
      console.log('Восстанавливаем состояние создания комнаты в composable')
      roomCreation.startRoomCreation()
    }
    
    const result = roomCreation.handleRoomModeHover(mouse)
    
    if (result.cursorStyle) {
      console.log('Меняем стиль курсора на:', result.cursorStyle)
      emit('set-cursor', result.cursorStyle)
    }
    return
  }
  
  // Обрабатываем выделение в режиме выделения
  if (selection.isSelectMode.value) {
    selection.handleSelectionModeHover(
      event, 
      mouse, 
      camera, 
      raycaster, 
      container.value, 
      rooms.value.flatMap((room: RoomClass) => room.getWallObjects())
    )
    return
  }
  
  // Обрабатываем размещение объектов
  if (objectPlacement.selectedObjectType.value) {
    // Проверяем, что режим размещения объектов активен
    if (!props.isCreatingRoom) {
      objectPlacement.handleObjectModeHover(mouse, scene)
    } else {
      // Удаляем призрачный объект, если режим не активен
      sceneManager.removeGhostObject()
    }
    return
  }
  
  if (isDragging && selectedRoom) {
    handleRoomDrag()
  } else if (isResizing && selectedRoom && selectedMarker) {
    handleRoomResize()
  }
}

const onMouseUp = (event: MouseEvent) => {
  if (!container.value) return
  
  // Передаем событие наверх
  emit('mouse-event', { type: 'mouseup', mouse, event })
  
  // Сбрасываем состояние перетаскивания
  if (objectPlacement.handleMouseUp()) {
    controls.enabled = true
  }
  
  isDragging = false
  isResizing = false
  selectedRoom = null
  selectedMarker = null
  controls.enabled = true
}

// Обработчик перетаскивания комнаты
const handleRoomDrag = () => {
  if (!selectedRoom) return
  
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
}

// Обработчик изменения размера комнаты
const handleRoomResize = () => {
  if (!selectedRoom || !selectedMarker) return
  
  const deltaX = mouse.x - dragStart.x
  const deltaY = mouse.y - dragStart.y

  // Преобразование движения мыши в изменение размера в мировых координатах
  const worldDelta = new THREE.Vector3(deltaX, 0, deltaY)
  worldDelta.applyQuaternion(camera.quaternion)
  worldDelta.y = 0 // Оставляем только изменения по горизонтали
  
  // Получаем информацию о том, какой угол был выбран
  const corner = selectedMarker.userData.corner || { 
    x: selectedMarker.position.x > 0 ? 1 : -1, 
    z: selectedMarker.position.z > 0 ? 1 : -1 
  }
  
  // Вычисляем новые размеры в зависимости от выбранного угла
  const xMultiplier = corner.x // 1 для правой стороны, -1 для левой
  const zMultiplier = corner.z // 1 для верхней стороны, -1 для нижней
  
  // Проецируем мировое смещение на локальные оси комнаты
  const localDeltaX = worldDelta.x * xMultiplier // Положительное значение означает увеличение размера
  const localDeltaZ = worldDelta.z * zMultiplier // Положительное значение означает увеличение размера
  
  // Вычисляем новые размеры
  const newWidth = Math.max(1, initialSize.width + localDeltaX * 2) // Умножаем на 2, так как изменяем в одну сторону
  const newHeight = Math.max(1, initialSize.height + localDeltaZ * 2)
  
  // Округляем до ближайшей сетки для лучшего выравнивания
  const gridSize = 0.5
  const roundedWidth = Math.round(newWidth / gridSize) * gridSize
  const roundedHeight = Math.round(newHeight / gridSize) * gridSize
  
  // Устанавливаем новые размеры комнаты
  selectedRoom.setSize(roundedWidth, roundedHeight)
}

// Анимационный цикл
const animate = () => {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

// Очистка сцены
const clearScene = () => {
  // Удаляем все комнаты из сцены
  rooms.value.forEach((room: RoomClass) => {
    scene.remove(room.getObject())
  })
  
  // Очищаем массив комнат
  rooms.value = []
  
  // Очищаем выделение
  selectionManager.clear()
  
  // Очищаем ghost-объекты
  sceneManager.removeGhostObject()
}

// Создание комнаты из данных
const createRoomFromData = (roomData: any) => {
  const room = RoomClass.fromJSON(scene, roomData)
  if (room) {
    scene.add(room.getObject())
    rooms.value.push(room)
    sceneManager.add(room)
  }
  return room
}

// Смена режима отладки
watch(() => props.debugMode, (newValue) => {
  if (newValue) {
    debugHelper.addDebugMarkersForRooms(rooms.value)
  } else {
    debugHelper.removeAllDebugMarkers()
  }
})

// Наблюдение за изменением режима создания комнаты
watch(() => props.isCreatingRoom, (newValue) => {
  console.log('ThreeCanvas: изменился props.isCreatingRoom =', newValue)
  if (roomCreation) {
    if (newValue && !roomCreation.isCreatingRoom.value) {
      console.log('ThreeCanvas: запускаем режим создания комнаты в composable')
      roomCreation.startRoomCreation()
    } else if (!newValue && roomCreation.isCreatingRoom.value) {
      console.log('ThreeCanvas: отменяем режим создания комнаты в composable')
      roomCreation.cancelRoomCreation()
    }
  }
})

// Наблюдение за изменением режима выделения и типа объекта
watch(() => props.isSelectMode, (newValue) => {
  console.log('ThreeCanvas: изменился режим выделения =', newValue)
  if (selection && selection.isSelectMode.value !== newValue) {
    console.log('ThreeCanvas: устанавливаем режим выделения в composable =', newValue)
    selection.setSelectMode(newValue)
  }
})

watch(() => props.objectType, (newValue) => {
  console.log('ThreeCanvas: изменился тип объекта =', newValue)
  if (newValue && objectPlacement && objectPlacement.selectedObjectType.value !== newValue) {
    console.log('ThreeCanvas: устанавливаем тип объекта в composable =', newValue)
    objectPlacement.setObjectType(newValue)
  }
})

// Методы, которые будут доступны для родителя
defineExpose({
  rooms,
  clearScene,
  createRoomFromData,
  getSceneObjects: () => {
    return {
      scene,
      raycaster,
      camera,
      sceneManager,
      selectionManager
    }
  }
})

// Жизненный цикл компонента
onMounted(() => {
  init()
  
  // Добавляем обработчики событий
  container.value?.addEventListener('mousedown', onMouseDown)
  container.value?.addEventListener('mousemove', onMouseMove)
  container.value?.addEventListener('mouseup', onMouseUp)
  
  // Наблюдение за изменением точки начала комнаты
  watch(() => roomCreation?.roomStartPoint.value, (newValue) => {
    if (newValue) {
      console.log('ThreeCanvas: точка начала комнаты установлена:', newValue)
      emit('update:roomStartPoint', newValue)
    } else if (roomCreation && !roomCreation.isCreatingRoom.value) {
      console.log('ThreeCanvas: точка начала комнаты сброшена')
      emit('update:roomStartPoint', null)
    }
  }, { immediate: true })
  
  // Обработчик изменения размера окна
  const handleResize = () => {
    if (!camera || !renderer) return
    
    const width = window.innerWidth
    const height = window.innerHeight
    
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    console.log('Размер окна изменен на:', width, height)
  }
  
  window.addEventListener('resize', handleResize)
  
  // Вызываем handleResize сразу после создания рендерера
  handleResize()
  
  // Сохраняем функцию для удаления при размонтировании
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    container.value?.removeEventListener('mousedown', onMouseDown)
    container.value?.removeEventListener('mousemove', onMouseMove)
    container.value?.removeEventListener('mouseup', onMouseUp)
    
    // Очищаем THREE.js ресурсы
    renderer.dispose()
    scene.clear()
    
    // Очищаем менеджеры
    sceneManager.clear()
    selectionManager.clear()
    debugHelper.removeAllDebugMarkers()
    
    // Удаляем canvas
    if (container.value) {
      container.value.removeChild(renderer.domElement)
    }
  })
})

// Обработка клика в режиме объектов
const handleObjectModeClick = (
  event: MouseEvent, 
  mouse: THREE.Vector2, 
  rooms: any[]
) => {
  // Если режим создания комнаты активен, игнорируем размещение объектов
  if (props.isCreatingRoom) {
    console.log('Режим создания комнаты активен, игнорируем размещение объектов')
    return false
  }

  // Используем метод placeGhostObject при клике на ghost-объект
  if (sceneManager.getGhostWallObject()) {
    try {
      // Добавляем более подробное логирование
      console.log('Placing ghost object:', 
        sceneManager.getGhostWallObject()?.getType(), 
        sceneManager.getGhostWall()?.mesh.uuid,
        sceneManager.getGhostWallObject()?.getPosition()
      )
      
      // Сохраняем тип объекта до его размещения
      const objType = sceneManager.getGhostWallObject()?.getType() 
        ? sceneManager.getGhostWallObject()?.getType() as WallObjectType 
        : 'socket'
      
      const result = sceneManager.placeGhostObject()
      
      // Отправляем событие о добавлении объекта
      if (result) {
        console.log('Объект успешно добавлен, отправляем событие:', objType)
        emit('object-added', objType)
      }
      
      return true
    } catch (error) {
      console.error('Error placing ghost object:', error)
      return false
    }
  }
}
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}
</style> 