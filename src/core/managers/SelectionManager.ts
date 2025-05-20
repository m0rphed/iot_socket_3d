import type { SelectableObject } from '../objects/SelectableObject'
import * as THREE from 'three'
import { SceneManager } from './SceneManager'
import { WallObject } from '../objects/WallObject'

export class SelectionManager {
  selectedObjects: SelectableObject[] = []
  hoveredObject: SelectableObject | null = null
  private sceneManager: SceneManager | null = null

  constructor(sceneManager?: SceneManager) {
    this.sceneManager = sceneManager || null
  }

  setSceneManager(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }
  
  /**
   * Выделяет объект
   * @param obj Объект для выделения
   */
  select(obj: SelectableObject) {
    if (!this.selectedObjects.includes(obj)) {
      obj.select()
      this.selectedObjects.push(obj)
    }
  }
  
  /**
   * Снимает выделение с объекта
   * @param obj Объект, с которого нужно снять выделение
   */
  deselect(obj: SelectableObject) {
    const idx = this.selectedObjects.indexOf(obj)
    if (idx !== -1) {
      obj.deselect()
      this.selectedObjects.splice(idx, 1)
    }
  }
  
  /**
   * Снимает выделение со всех объектов
   */
  clear() {
    this.selectedObjects.forEach(obj => obj.deselect())
    this.selectedObjects = []
  }
  
  /**
   * Устанавливает hover-эффект на объект
   * @param obj Объект для hover-эффекта
   */
  hover(obj: SelectableObject) {
    // Если объект уже выделен или это тот же объект, что и раньше, ничего не делаем
    if (this.selectedObjects.includes(obj) || obj === this.hoveredObject) {
      return
    }
    
    // Если есть предыдущий hover-объект, снимаем с него hover
    if (this.hoveredObject) {
      this.unhover(this.hoveredObject)
    }
    
    // Устанавливаем hover на новый объект
    this.hoverEffect(obj)
    this.hoveredObject = obj
  }
  
  /**
   * Снимает hover-эффект с текущего объекта
   */
  unhoverCurrent() {
    if (this.hoveredObject) {
      this.unhover(this.hoveredObject)
      this.hoveredObject = null
    }
  }
  
  /**
   * Снимает hover-эффект с указанного объекта
   * @param obj Объект, с которого нужно снять hover-эффект
   */
  private unhover(obj: SelectableObject) {
    // Здесь можно добавить пользовательскую логику для снятия hover
    this.unhoverEffect(obj)
  }
  
  /**
   * Применяет hover-эффект к объекту (изменение цвета и т.д.)
   * @param obj Объект для применения эффекта
   */
  private hoverEffect(obj: SelectableObject) {
    // Получаем mesh объекта, если он доступен через интерфейс getMesh
    if ('getMesh' in obj) {
      const mesh = (obj as any).getMesh() as THREE.Mesh
      if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive.set(0x44aaff)
        mesh.material.emissiveIntensity = 0.7
      }
    }
  }
  
  /**
   * Снимает hover-эффект с объекта
   * @param obj Объект для снятия эффекта
   */
  private unhoverEffect(obj: SelectableObject) {
    // Получаем mesh объекта, если он доступен через интерфейс getMesh
    if ('getMesh' in obj) {
      const mesh = (obj as any).getMesh() as THREE.Mesh
      if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive.set(0x000000)
        mesh.material.emissiveIntensity = 1.0
      }
    }
  }
  
  /**
   * Поиск объекта под курсором мыши с использованием raycasting
   * @param mouse Координаты мыши
   * @param camera Камера
   * @param objects Массив объектов для проверки
   * @param raycaster Raycaster
   * @returns Найденный объект или null
   */
  findObjectByRaycast(
    mouse: THREE.Vector2, 
    camera: THREE.Camera, 
    objects: THREE.Object3D[], 
    raycaster: THREE.Raycaster
  ): SelectableObject | null {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(objects, true)
    
    if (intersects.length > 0) {
      // Получаем первый пересеченный объект
      const intersectedObject = intersects[0].object
      
      // Ищем родительский объект, который является SelectableObject
      let current: THREE.Object3D | null = intersectedObject
      while (current) {
        // Проверяем, есть ли этот объект в списке SelectableObject
        for (const obj of this.getAllSelectableObjects()) {
          if ('getObject' in obj && (obj as any).getObject() === current) {
            return obj
          }
        }
        current = current.parent
      }
    }
    
    return null
  }
  
  /**
   * Получает все объекты, которые могут быть выделены
   * @returns Массив всех объектов, которые могут быть выделены
   */
  getAllSelectableObjects(): SelectableObject[] {
    if (!this.sceneManager) return []
    
    // Получаем все объекты из SceneManager, которые могут быть выделены
    const selectableObjects: SelectableObject[] = []
    
    // Добавляем все WallObject из комнат
    this.sceneManager.objects.forEach(obj => {
      if ('getWallObjects' in obj) {
        const wallObjects = (obj as any).getWallObjects() as WallObject[]
        selectableObjects.push(...wallObjects)
      }
      
      // Проверяем, является ли сам объект SelectableObject
      if (this.isSelectableObject(obj)) {
        selectableObjects.push(obj as unknown as SelectableObject)
      }
    })
    
    return selectableObjects
  }
  
  /**
   * Проверяет, является ли объект SelectableObject
   * @param obj Объект для проверки
   * @returns true, если объект реализует интерфейс SelectableObject
   */
  private isSelectableObject(obj: any): boolean {
    return typeof obj.select === 'function' && typeof obj.deselect === 'function' && 'isSelected' in obj
  }
  
  /**
   * Поиск объекта под курсором мыши с использованием bounding box
   * @param mouseEvent Событие мыши
   * @param camera Камера
   * @param objects Массив объектов для проверки
   * @param container Контейнер рендерера
   * @returns Найденный объект или null
   */
  findObjectByBoundingBox(
    mouseEvent: MouseEvent, 
    camera: THREE.Camera, 
    objects: SelectableObject[],
    container: HTMLElement
  ): SelectableObject | null {
    const rect = container.getBoundingClientRect()
    
    for (const obj of objects) {
      // Получаем mesh объекта, если он доступен через интерфейс getMesh
      if (!('getMesh' in obj)) continue
      
      const mesh = (obj as any).getMesh() as THREE.Mesh
      if (!mesh) continue
      
      // Получаем bounding box объекта
      mesh.geometry.computeBoundingBox()
      const bbox = mesh.geometry.boundingBox
      if (!bbox) continue
      
      // Получаем углы bounding box
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
      
      // Переводим в мировые координаты
      points.forEach(p => mesh.localToWorld(p))
      
      // Проецируем в экранные координаты
      const screenPoints = points.map(p => {
        const projected = p.clone().project(camera)
        return {
          x: (projected.x + 1) / 2 * rect.width + rect.left,
          y: (-projected.y + 1) / 2 * rect.height + rect.top
        }
      })
      
      // Находим границы bounding box в экранных координатах
      const minX = Math.min(...screenPoints.map(p => p.x))
      const maxX = Math.max(...screenPoints.map(p => p.x))
      const minY = Math.min(...screenPoints.map(p => p.y))
      const maxY = Math.max(...screenPoints.map(p => p.y))
      
      // Проверяем, попадает ли курсор в bounding box
      if (
        mouseEvent.clientX >= minX && mouseEvent.clientX <= maxX &&
        mouseEvent.clientY >= minY && mouseEvent.clientY <= maxY
      ) {
        return obj
      }
    }
    
    return null
  }

  /**
   * Находит WallObject по объекту Three.js, проходя вверх по иерархии родителей
   * @param object Объект Three.js, для которого ищем соответствующий WallObject
   * @param wallObjects Массив доступных WallObject для поиска
   * @returns Найденный WallObject или null
   */
  findWallObjectByObject(object: THREE.Object3D, wallObjects: WallObject[]): WallObject | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      const found = wallObjects.find(w => w.getObject() === current);
      if (found) return found;
      current = current.parent;
    }
    return null;
  }

  /**
   * Находит объект с помощью raycasting
   * @param mouse Координаты мыши в нормализованном формате (-1 до 1)
   * @param camera Камера
   * @param objects Массив доступных объектов для проверки
   * @param raycaster Raycaster для выполнения проверки
   * @returns Найденный объект или null
   */
  selectObjectByRaycast(
    mouse: THREE.Vector2, 
    camera: THREE.Camera, 
    objects: THREE.Object3D[], 
    raycaster: THREE.Raycaster
  ): WallObject | null {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(objects, true)
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object
      // Если у нас есть массив доступных WallObject объектов, ищем среди них
      if (this.sceneManager) {
        const rooms = this.sceneManager.objects.filter(obj => 'getWallObjects' in obj && typeof (obj as any).getWallObjects === 'function')
        for (const room of rooms) {
          // Используем as any, так как TypeScript не знает о методе getWallObjects
          const wallObjects = (room as any).getWallObjects() as WallObject[]
          const wallObject = this.findWallObjectByObject(intersectedObject, wallObjects)
          if (wallObject) return wallObject
        }
      }
    }
    return null
  }

  /**
   * Находит объект с помощью проекции bounding box
   * @param mouseEvent Событие мыши
   * @param camera Камера
   * @param wallObjects Массив объектов для проверки
   * @param container Контейнер рендерера
   * @returns Найденный объект или null
   */
  selectObjectByBoundingBox(
    mouseEvent: MouseEvent, 
    camera: THREE.Camera, 
    wallObjects: WallObject[],
    container: HTMLElement
  ): WallObject | null {
    const rect = container.getBoundingClientRect()
    for (const wallObject of wallObjects) {
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

  /**
   * Получает все объекты для выделения из всех комнат
   * @returns Массив объектов Three.js для всех WallObject
   */
  getAllWallObjectGroups(): THREE.Object3D[] {
    if (!this.sceneManager) return []
    
    // Фильтруем объекты, которые имеют метод getWallObjects
    const rooms = this.sceneManager.objects.filter(obj => 
      'getWallObjects' in obj && typeof (obj as any).getWallObjects === 'function'
    )
    
    // Собираем все WallObject из всех комнат
    return rooms.flatMap(room => {
      const wallObjects = (room as any).getWallObjects() as WallObject[]
      return wallObjects.map(obj => obj.getObject())
    })
  }
} 