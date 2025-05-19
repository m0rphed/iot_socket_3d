import * as THREE from 'three'

export type WallObjectType = 'socket' | 'door'

export class WallObject {
  private mesh: THREE.Mesh
  private type: WallObjectType
  private wall: THREE.Mesh
  private position: number // Позиция на стене (0-1)
  private height: number // Высота от пола
  private isDragging: boolean = false
  private dragStart: THREE.Vector2 = new THREE.Vector2()
  private isGhost: boolean

  constructor(type: WallObjectType, wall: THREE.Mesh, position: number = 0.5, height: number = 0.5, isGhost: boolean = false) {
    this.type = type
    this.wall = wall
    this.position = position
    this.height = height
    this.isGhost = isGhost

    // Создание геометрии в зависимости от типа объекта
    let geometry: THREE.BufferGeometry
    let material: THREE.Material

    if (type === 'socket') {
      geometry = new THREE.BoxGeometry(0.1, 0.1, 0.05)
      material = new THREE.MeshStandardMaterial({ 
        color: 0x2196f3,
        roughness: 0.5,
        metalness: 0.8,
        transparent: isGhost,
        opacity: isGhost ? 0.5 : 1.0
      })
    } else {
      geometry = new THREE.BoxGeometry(0.8, 2, 0.25)
      material = new THREE.MeshStandardMaterial({ 
        color: 0xffac59,
        roughness: 0.7,
        metalness: 0.2,
        transparent: isGhost,
        opacity: isGhost ? 0.5 : 1.0
      })
    }
    this.mesh = new THREE.Mesh(geometry, material)
    // Контур для объекта
    const edges = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 }))
    this.mesh.add(line)
    this.updatePosition()
    if (isGhost) {
      this.mesh.raycast = () => {} // Ghost-объект не ловит raycast
      // Отключаем raycast для всех детей (контуров)
      this.mesh.traverse(child => { child.raycast = () => {}; })
    }
  }

  private updatePosition() {
    // Получаем размеры стены
    const wallSize = new THREE.Vector3()
    this.wall.geometry.computeBoundingBox()
    this.wall.geometry.boundingBox?.getSize(wallSize)
    // Позиция вдоль стены
    let x = (this.position - 0.5) * wallSize.x
    let y = 0
    let z = 0
    // Корректная высота относительно пола
    if (this.type === 'door') {
      const doorHeight = 2
      y = (doorHeight / 2) - (wallSize.y / 2) // нижний край двери на полу
      z = 0.13
    } else if (this.type === 'socket') {
      y = 0.25 - (wallSize.y / 2) // розетка на высоте 0.25м
      z = 0.06
    }
    // Преобразуем локальные координаты в мировые
    const localPos = new THREE.Vector3(x, y, z)
    this.wall.localToWorld(localPos)
    this.mesh.position.copy(localPos)
    // Поворот совпадает с поворотом стены
    this.mesh.quaternion.copy(this.wall.getWorldQuaternion(new THREE.Quaternion()))
  }

  public getObject(): THREE.Mesh {
    return this.mesh
  }

  public setPosition(position: number) {
    this.position = Math.max(0, Math.min(1, position))
    this.updatePosition()
  }

  public setHeight(height: number) {
    this.height = height
    this.updatePosition()
  }

  public getType(): WallObjectType {
    return this.type
  }

  public getPosition(): number {
    return this.position
  }

  public getHeight(): number {
    return this.height
  }

  public getWall(): THREE.Mesh {
    return this.wall
  }

  public startDrag(mouse: THREE.Vector2) {
    this.isDragging = true
    this.dragStart.copy(mouse)
  }

  public stopDrag() {
    this.isDragging = false
  }

  public isDraggingNow(): boolean {
    return this.isDragging
  }

  public updateDrag(mouse: THREE.Vector2, camera: THREE.Camera) {
    if (!this.isDragging) return

    const deltaX = mouse.x - this.dragStart.x
    const deltaY = mouse.y - this.dragStart.y

    // Преобразование движения мыши в движение по стене
    const worldDelta = new THREE.Vector3(deltaX, 0, deltaY)
    worldDelta.applyQuaternion(camera.quaternion)
    worldDelta.y = 0

    // Определяем, на какой стене находится объект
    const isVertical = Math.abs(this.wall.rotation.y) === Math.PI / 2

    // Вычисляем новую позицию
    let newPosition = this.position
    if (isVertical) {
      newPosition += worldDelta.z / 2
    } else {
      newPosition += worldDelta.x / 2
    }

    // Округление до ближайшей сетки
    const gridSize = 0.1
    newPosition = Math.round(newPosition / gridSize) * gridSize

    this.setPosition(newPosition)
    this.dragStart.copy(mouse)
  }

  public setGhost(isGhost: boolean) {
    this.isGhost = isGhost
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.transparent = isGhost
      this.mesh.material.opacity = isGhost ? 0.5 : 1.0
    }
    if (isGhost) {
      this.mesh.raycast = () => {}
    } else {
      this.mesh.raycast = THREE.Mesh.prototype.raycast
    }
  }
} 