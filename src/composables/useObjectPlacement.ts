import * as THREE from 'three'
import { ref } from 'vue'
import type { WallObjectType } from '../core/objects/WallObject'
import type { SceneManager } from '../core/managers/SceneManager'
import type { WallObject } from '../core/objects/WallObject'

export function useObjectPlacement(
  sceneManager: SceneManager,
  raycaster: THREE.Raycaster,
  camera: THREE.PerspectiveCamera
) {
  const selectedObjectType = ref<WallObjectType>('socket')
  let debugSphere: THREE.Mesh | null = null
  let selectedWallObject: WallObject | null = null
  
  // Установить тип объекта для размещения
  const setObjectType = (type: WallObjectType) => {
    selectedObjectType.value = type
    if (debugSphere) {
      debugSphere.parent?.remove(debugSphere)
      debugSphere = null
    }
  }
  
  // Обработка наведения мыши в режиме объектов
  const handleObjectModeHover = (mouse: THREE.Vector2, scene: THREE.Scene) => {
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
  
  // Обработка клика в режиме объектов
  const handleObjectModeClick = (
    event: MouseEvent, 
    mouse: THREE.Vector2, 
    rooms: any[]
  ) => {
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
        return true
      } catch (error) {
        console.error('Error placing ghost object:', error)
        return false
      }
    }

    // Проверяем, является ли объект стеной или объектом на стене
    const mesh = event.target as THREE.Mesh
    const room = rooms.find(room => 
      room.getWalls().some(w => w.mesh === mesh)
    )
    
    if (room) {
      // Находим конкретную Wall, соответствующую THREE.Mesh
      const wallObj = room.getWalls().find(w => w.mesh === mesh)
      if (!wallObj) return false

      // Проверяем, не является ли объект частью существующего объекта на стене
      const wallObject = room.getWallObjects().find(obj => obj.getObject() === event.target)
      
      if (wallObject) {
        // Начинаем перетаскивание существующего объекта
        selectedWallObject = wallObject
        selectedWallObject.startDrag(mouse)
        return true
      } else {
        // Используем raycaster для определения точки на стене
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObject(mesh, false)
        
        if (intersects.length > 0) {
          // Получаем локальные координаты точки на стене
          const localPoint = mesh.worldToLocal(intersects[0].point.clone())
          const wallSize = new THREE.Vector3()
          mesh.geometry.computeBoundingBox()
          mesh.geometry.boundingBox?.getSize(wallSize)
          
          // Вычисляем позицию (0-1) на стене
          const position = (localPoint.x / wallSize.x) + 0.5
          
          // Добавляем объект на стену
          if (selectedObjectType.value === 'socket') {
            // Используем стандартную глубину для розетки
            room.addSocket(wallObj, position)
          } else if (selectedObjectType.value === 'door') {
            room.addDoor(wallObj, position)
          }
          
          return true
        }
      }
    }
    
    return false
  }
  
  // Обработчик отпускания кнопки мыши
  const handleMouseUp = () => {
    if (selectedWallObject) {
      selectedWallObject.stopDrag()
      selectedWallObject = null
      return true
    }
    return false
  }
  
  // Функция для очистки ресурсов
  const cleanup = (scene: THREE.Scene) => {
    if (debugSphere) {
      scene.remove(debugSphere)
      debugSphere = null
    }
    sceneManager.removeGhostObject()
  }
  
  return {
    selectedObjectType,
    setObjectType,
    handleObjectModeHover,
    handleObjectModeClick,
    handleMouseUp,
    cleanup
  }
} 