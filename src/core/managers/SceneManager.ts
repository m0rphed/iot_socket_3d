import { SceneObject } from '../objects/SceneObject'
import { Wall } from '../objects/Wall'
import { Room } from '../objects/Room'
import { WallObject } from '../objects/WallObject'
import { Socket } from '../objects/Socket'
import { Door } from '../objects/Door'
import * as THREE from 'three'

export class SceneManager {
  objects: SceneObject[] = []
  private ghostWallObject: WallObject | null = null
  private ghostWall: Wall | null = null
  private scene: THREE.Scene | null = null

  constructor(scene?: THREE.Scene) {
    this.scene = scene || null
  }

  setScene(scene: THREE.Scene) {
    this.scene = scene
  }

  add(obj: SceneObject) {
    this.objects.push(obj)
  }

  remove(obj: SceneObject) {
    this.objects = this.objects.filter(o => o !== obj)
  }

  findByUuid(uuid: string): SceneObject | undefined {
    return this.objects.find(o => o.uuid === uuid)
  }

  /**
   * Находит стену и комнату, в которую попадает луч
   * @param raycaster THREE.Raycaster
   * @returns Объект с найденной стеной, комнатой, точкой пересечения и локальной позицией X
   */
  findWallByRaycaster(raycaster: THREE.Raycaster): { 
    wall: Wall | null, 
    room: Room | null, 
    intersectPoint: THREE.Vector3 | null,
    localX: number
  } {
    let foundWall: Wall | null = null
    let foundRoom: Room | null = null
    let minDist = Infinity
    let intersectPoint: THREE.Vector3 | null = null
    let localX = 0.5 // Позиция по умолчанию - середина стены
    
    // Ищем все комнаты в сцене
    const rooms = this.objects.filter(obj => obj instanceof Room) as Room[]
    
    for (const room of rooms) {
      for (const wall of room.getWalls()) {
        const intersects = raycaster.intersectObject(wall.mesh, false)
        if (intersects.length > 0 && intersects[0].distance < minDist) {
          foundWall = wall
          foundRoom = room
          minDist = intersects[0].distance
          intersectPoint = intersects[0].point.clone()
          
          // Вычисляем локальную позицию X
          const local = wall.mesh.worldToLocal(intersects[0].point.clone())
          const wallSize = new THREE.Vector3()
          wall.mesh.geometry.computeBoundingBox()
          wall.mesh.geometry.boundingBox?.getSize(wallSize)
          localX = (local.x / wallSize.x) + 0.5
        }
      }
    }
    
    return { wall: foundWall, room: foundRoom, intersectPoint, localX }
  }

  /**
   * Создает призрачный объект на стене
   * @param wall Стена
   * @param type Тип объекта (socket/door)
   * @param position Позиция на стене (0-1)
   * @returns Созданный призрачный объект
   */
  createGhostObject(wall: Wall, type: 'socket' | 'door', position: number): WallObject {
    // Удаляем старый ghost-объект, если он существует
    this.removeGhostObject()
    
    // Проверяем, что стена существует и имеет mesh
    if (!wall || !wall.mesh) {
      console.error('Wall or wall.mesh is null in createGhostObject');
      throw new Error('Невозможно создать объект: стена не существует или повреждена');
    }
    
    // Создаем новый ghost-объект
    try {
      if (type === 'socket') {
        this.ghostWallObject = new Socket(wall, position, true)
      } else {
        this.ghostWallObject = new Door(wall, position, true)
      }
      this.ghostWall = wall
      
      // Добавляем на сцену, если сцена установлена
      if (this.scene && this.ghostWallObject) {
        this.scene.add(this.ghostWallObject.getObject())
      }
      
      return this.ghostWallObject
    } catch (error) {
      console.error('Error creating ghost object:', error);
      throw new Error('Не удалось создать ghost-объект');
    }
  }

  /**
   * Обновляет позицию призрачного объекта
   * @param position Новая позиция (0-1)
   */
  updateGhostObjectPosition(position: number) {
    if (this.ghostWallObject) {
      this.ghostWallObject.setPosition(position)
    }
  }

  /**
   * Удаляет призрачный объект со сцены
   */
  removeGhostObject() {
    if (this.ghostWallObject && this.scene) {
      this.scene.remove(this.ghostWallObject.getObject())
      this.ghostWallObject = null
      this.ghostWall = null
    }
  }

  /**
   * Закрепляет призрачный объект на стене (создает реальный объект)
   * @returns Созданный реальный объект или null, если ghost-объект не существует
   */
  placeGhostObject(): WallObject | null {
    if (!this.ghostWallObject || !this.ghostWall) {
      console.error('Ghost object or ghost wall is null in placeGhostObject');
      return null
    }
    
    // Находим комнату, которой принадлежит стена
    const rooms = this.objects.filter(obj => obj instanceof Room) as Room[]
    const room = rooms.find(r => r.getWalls().includes(this.ghostWall!))
    
    if (!room) {
      console.error('Could not find room for the ghost wall');
      return null
    }
    
    const type = this.ghostWallObject.getType()
    const position = this.ghostWallObject.getPosition()
    
    // Важно: сохраняем ссылку на стену перед удалением ghost-объекта
    const wall = this.ghostWall
    
    // Удаляем ghost-объект
    this.removeGhostObject()
    
    // Создаем реальный объект, используя сохраненную ссылку на стену
    if (type === 'socket') {
      return room.addSocket(wall, position)
    } else {
      return room.addDoor(wall, position)
    }
  }

  getGhostWallObject(): WallObject | null {
    return this.ghostWallObject
  }

  getGhostWall(): Wall | null {
    return this.ghostWall
  }

  clear() {
    this.objects = []
    this.removeGhostObject()
  }
} 