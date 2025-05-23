import { ref } from 'vue'
import * as THREE from 'three'
import { RoomFactory } from '../core/factories/RoomFactory'
import { RoomPreview } from '../core/preview/RoomPreview'
import type { RoomClass } from '../core/objects/Room'

export function useRoomCreation(scene: THREE.Scene, raycaster: THREE.Raycaster, camera: THREE.PerspectiveCamera) {
  const isCreatingRoom = ref(false)
  const roomStartPoint = ref<THREE.Vector3 | null>(null)
  const roomPreview = new RoomPreview(scene)
  
  // Запустить процесс создания комнаты
  const startRoomCreation = () => {
    console.log('startRoomCreation: устанавливаем isCreatingRoom = true')
    isCreatingRoom.value = true
    roomStartPoint.value = null
    return { cursorStyle: 'crosshair' }
  }
  
  // Отменить создание комнаты
  const cancelRoomCreation = () => {
    console.log('cancelRoomCreation: сбрасываем режим создания комнаты')
    isCreatingRoom.value = false
    roomStartPoint.value = null
    roomPreview.remove()
    return { cursorStyle: 'default' }
  }
  
  // Получить точку на сетке из координат мыши
  const getGridPointFromMouse = (mouse: THREE.Vector2): THREE.Vector3 | null => {
    console.log('Получение точки на сетке из мыши:', mouse)
    
    // Создаем плоскость на уровне сетки
    const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    
    // Используем рейкастер для определения точки пересечения с плоскостью
    raycaster.setFromCamera(mouse, camera)
    
    // Временная переменная для хранения точки пересечения
    const intersection = new THREE.Vector3()
    
    // Проверяем пересечение луча с плоскостью
    if (raycaster.ray.intersectPlane(gridPlane, intersection)) {
      // Привязка к сетке (снаппинг)
      const gridSize = 0.5 // размер ячейки сетки
      intersection.x = Math.round(intersection.x / gridSize) * gridSize
      intersection.z = Math.round(intersection.z / gridSize) * gridSize
      
      console.log('Найдена точка на сетке:', intersection)
      return intersection
    }
    
    console.log('Не удалось найти точку на сетке')
    return null
  }
  
  // Обработка наведения мыши при создании комнаты
  const handleRoomModeHover = (mouse: THREE.Vector2): { cursorStyle?: string } => {
    if (!isCreatingRoom.value) return {}
    
    const gridPoint = getGridPointFromMouse(mouse)
    
    if (!gridPoint) {
      roomPreview.remove()
      return {}
    }
    
    // Если есть начальная точка, обновляем предпросмотр
    if (roomStartPoint.value) {
      roomPreview.update(roomStartPoint.value, gridPoint)
      
      // Проверяем размер комнаты и меняем стиль курсора соответственно
      const isValidSize = roomPreview.isSizeValid(roomStartPoint.value, gridPoint, 1)
      return { cursorStyle: isValidSize ? 'crosshair' : 'not-allowed' }
    }
    
    return {}
  }
  
  // Создание комнаты при клике
  const handleRoomModeClick = (
    mouse: THREE.Vector2, 
    wallHeight: number
  ): { room?: RoomClass, cursorStyle?: string } => {
    // Если мы не в режиме создания комнаты
    if (!isCreatingRoom.value) {
      console.log('Не в режиме создания комнаты, текущее состояние isCreatingRoom =', isCreatingRoom.value)
      return {}
    }
    
    console.log('Обработка клика в режиме создания комнаты, высота стен:', wallHeight, 'состояние isCreatingRoom =', isCreatingRoom.value)
    
    const gridPoint = getGridPointFromMouse(mouse)
    if (!gridPoint) {
      console.log('Не найдена точка на сетке при клике')
      return {}
    }
    
    // Если это первый клик, сохраняем начальную точку
    if (!roomStartPoint.value) {
      console.log('Первый клик, сохраняем начальную точку:', gridPoint)
      roomStartPoint.value = gridPoint.clone()
      return { cursorStyle: 'crosshair' }
    }
    
    console.log('Второй клик, создаем комнату от', roomStartPoint.value, 'до', gridPoint)
    
    // Если это второй клик, проверяем размер комнаты
    if (!roomPreview.isSizeValid(roomStartPoint.value, gridPoint, 1)) {
      console.warn('Размер комнаты слишком мал, минимальный размер 1x1')
      return {}
    }
    
    try {
      // Используем RoomFactory для создания комнаты по двум точкам
      const room = RoomFactory.createRoomFromPoints(
        roomStartPoint.value,
        gridPoint,
        wallHeight
      )
      
      // Сбрасываем режим создания комнаты
      console.log('Комната создана успешно, сбрасываем режим создания комнаты')
      isCreatingRoom.value = false
      roomStartPoint.value = null
      roomPreview.remove()
      
      return { room, cursorStyle: 'default' }
    } catch (error) {
      console.error('Ошибка при создании комнаты:', error)
      cancelRoomCreation()
      return { cursorStyle: 'default' }
    }
  }
  
  return {
    isCreatingRoom,
    roomStartPoint,
    roomPreview,
    startRoomCreation,
    cancelRoomCreation,
    getGridPointFromMouse,
    handleRoomModeHover,
    handleRoomModeClick
  }
} 