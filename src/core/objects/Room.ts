import { SceneObject } from './SceneObject'
import { Wall } from './Wall'
import { Floor } from './Floor'
import * as THREE from 'three'
import { WallObject } from './WallObject'
import { Socket } from './Socket'
import { Door } from './Door'
import { WALL_PARAMS, MARKER_PARAMS } from '../../params/config'

export class Room extends SceneObject {
  walls: Wall[]
  floor: Floor
  wallObjects: WallObject[] = []
  resizeMarkers: THREE.Mesh[] = []
  width: number = 4
  height: number = 4
  wallHeight: number = 2.5

  constructor(group: THREE.Group, walls: Wall[], floor: Floor) {
    super(group)
    this.walls = walls
    this.floor = floor
    this.createResizeMarkers()
  }

  getObject() {
    return this.object3D
  }

  getSize() {
    return { width: this.width, height: this.height }
  }

  setSize(width: number, height: number) {
    // Проверка валидности входных данных
    if (!isFinite(width) || width <= 0 || !isFinite(height) || height <= 0) {
      console.error(`Invalid room dimensions: width=${width}, height=${height}`);
      return;
    }
    
    const oldWidth = this.width
    const oldHeight = this.height
    this.width = width
    this.height = height
    
    // Удаляем старые стены из группы
    this.walls.forEach(wall => {
      this.object3D.remove(wall.mesh)
      wall.mesh.geometry.dispose()
      if (wall.mesh.material instanceof THREE.Material) {
        wall.mesh.material.dispose()
      }
    })
    
    // Создаём новые стены
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: WALL_PARAMS.color,
      roughness: WALL_PARAMS.roughness,
      metalness: WALL_PARAMS.metalness,
      transparent: WALL_PARAMS.opacity < 1,
      opacity: WALL_PARAMS.opacity
    })
    
    // Обновляем геометрии стен
    const frontWall = this.walls[0]
    frontWall.mesh.geometry = new THREE.BoxGeometry(this.width, this.wallHeight, frontWall.getThickness())
    frontWall.mesh.position.set(0, this.wallHeight / 2, -this.height / 2)
    
    const backWall = this.walls[1]
    backWall.mesh.geometry = new THREE.BoxGeometry(this.width, this.wallHeight, backWall.getThickness())
    backWall.mesh.position.set(0, this.wallHeight / 2, this.height / 2)
    
    const leftWall = this.walls[2]
    leftWall.mesh.geometry = new THREE.BoxGeometry(this.height, this.wallHeight, leftWall.getThickness())
    leftWall.mesh.position.set(-this.width / 2, this.wallHeight / 2, 0)
    
    const rightWall = this.walls[3]
    rightWall.mesh.geometry = new THREE.BoxGeometry(this.height, this.wallHeight, rightWall.getThickness())
    rightWall.mesh.position.set(this.width / 2, this.wallHeight / 2, 0)
    
    // Обновляем контуры для всех стен
    this.walls.forEach(wall => {
      // Удаляем старый контур
      wall.mesh.remove(wall.outline)
      
      // Создаём новый контур
      const edges = new THREE.EdgesGeometry(wall.mesh.geometry)
      wall.outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x111111 }))
      wall.mesh.add(wall.outline)
    })
    
    // Обновляем пол
    this.floor.mesh.geometry.dispose()
    this.floor.mesh.geometry = new THREE.BoxGeometry(this.width, 0.1, this.height)
    this.floor.mesh.position.set(0, -0.05, 0)
    
    // Обновляем контур пола
    if (this.floor.outline) {
      this.floor.mesh.remove(this.floor.outline)
    }
    const floorEdges = new THREE.EdgesGeometry(this.floor.mesh.geometry)
    this.floor.outline = new THREE.LineSegments(floorEdges, new THREE.LineBasicMaterial({ color: 0x111111 }))
    this.floor.mesh.add(this.floor.outline)
    
    // Обновляем маркеры изменения размера
    this.createResizeMarkers()
    
    // Обновляем объекты на стенах
    // Сохраняем объекты, которые нужно обновить
    const wallObjectsToUpdate = [...this.wallObjects]
    
    // Временно очищаем массив wallObjects, чтобы addWallObject не добавлял дублирующие объекты
    this.wallObjects = []
    
    // Проходим по всем объектам и пересоздаем их для новых размеров стен
    wallObjectsToUpdate.forEach(wallObject => {
      const wall = wallObject.getWall()
      const position = wallObject.getPosition()
      const type = wallObject.getType()
      
      // Удаляем старый объект из сцены
      this.object3D.remove(wallObject.getObject())
      
      // Создаем новый объект с теми же параметрами
      if (type === 'socket') {
        this.addSocket(wall, position)
      } else if (type === 'door') {
        this.addDoor(wall, position)
      }
    })
  }

  setWallHeight(height: number) {
    // Проверка валидности входных данных
    if (!isFinite(height) || height <= 0) {
      console.error(`Invalid wall height: ${height}`);
      return;
    }
    
    this.wallHeight = height
    
    // Обновляем геометрии стен
    this.walls.forEach((wall, index) => {
      const thickness = wall.getThickness()
      
      // Создаем новую геометрию с обновленной высотой
      wall.mesh.geometry.dispose()
      
      // Определяем, какая это стена (фронтальная/задняя или левая/правая)
      if (index === 0 || index === 1) {
        // Фронтальная или задняя стена (ширина = this.width)
        wall.mesh.geometry = new THREE.BoxGeometry(this.width, this.wallHeight, thickness)
      } else {
        // Левая или правая стена (ширина = this.height)
        wall.mesh.geometry = new THREE.BoxGeometry(this.height, this.wallHeight, thickness)
      }
      
      // Обновляем позицию стены (центрируем по Y)
      const position = wall.mesh.position.clone()
      position.y = this.wallHeight / 2
      wall.mesh.position.copy(position)
      
      // Обновляем контур
      wall.mesh.remove(wall.outline)
      const edges = new THREE.EdgesGeometry(wall.mesh.geometry)
      wall.outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x111111 }))
      wall.mesh.add(wall.outline)
    })
    
    // Обновляем объекты на стенах при необходимости
    // Например, объекты типа "дверь" могут зависеть от высоты стены
    this.wallObjects.forEach(wallObject => {
      // Перепозиционируем объекты при необходимости
      if (wallObject.getType() === 'door') {
        // Для дверей может потребоваться обновление высоты
        wallObject.setHeight(wallObject.getHeight())
      }
    })
  }

  setPosition(x: number, z: number) {
    this.object3D.position.set(x, 0, z)
  }

  getResizeMarkers() {
    return this.resizeMarkers
  }

  addWallObject(obj: WallObject) {
    this.wallObjects.push(obj)
    this.object3D.add(obj.getObject())
    return obj
  }

  removeWallObject(obj: WallObject) {
    this.wallObjects = this.wallObjects.filter(o => o !== obj)
    this.object3D.remove(obj.getObject())
  }

  getWallObjects(): WallObject[] {
    return this.wallObjects
  }

  getWalls(): Wall[] {
    return this.walls
  }

  addSocket(wall: Wall, position: number = 0.5, isGhost: boolean = false): Socket {
    const socket = new Socket(wall, position, isGhost)
    return this.addWallObject(socket) as Socket
  }

  addDoor(wall: Wall, position: number = 0.5, isGhost: boolean = false): Door {
    const door = new Door(wall, position, isGhost)
    return this.addWallObject(door) as Door
  }

  // Методы для управления комнатой: setSize, setPosition, ...
  select() {}
  deselect() {}

  private createResizeMarkers() {
    const markerGeometry = new THREE.BoxGeometry(MARKER_PARAMS.size, MARKER_PARAMS.size, MARKER_PARAMS.size)
    const markerMaterial = new THREE.MeshBasicMaterial({ color: MARKER_PARAMS.color })
    
    // Удаляем старые маркеры
    this.resizeMarkers.forEach(marker => {
      this.object3D.remove(marker)
      marker.geometry.dispose()
      if (marker.material instanceof THREE.Material) {
        marker.material.dispose()
      }
    })
    this.resizeMarkers = []
    
    // Новые маркеры по углам
    const positions = [
      { x: this.width / 2, z: this.height / 2 },
      { x: -this.width / 2, z: this.height / 2 },
      { x: this.width / 2, z: -this.height / 2 },
      { x: -this.width / 2, z: -this.height / 2 }
    ]
    
    positions.forEach(pos => {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(pos.x, 0.1, pos.z)
      this.resizeMarkers.push(marker)
      this.object3D.add(marker)
    })
  }
} 