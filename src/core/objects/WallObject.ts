import * as THREE from 'three'
import { SOCKET_PARAMS, DOOR_PARAMS } from '../../params/config'
import { SceneObject } from './SceneObject'
import type { SelectableObject } from './SelectableObject'
import type { HasOutline } from './interfaces/HasOutline'
import { Wall } from './Wall'

export type WallObjectType = 'socket' | 'door'

export class WallObject extends SceneObject implements SelectableObject, HasOutline {
  public isSelected = false
  private group: THREE.Group
  private mesh: THREE.Mesh
  public outline: THREE.LineSegments
  private type: WallObjectType
  private wall: Wall
  private position: number // Позиция на стене (0-1)
  private height: number // Высота от пола
  private isDragging: boolean = false
  private dragStart: THREE.Vector2 = new THREE.Vector2()
  private isGhost: boolean
  private zOffset: number | undefined

  constructor(type: WallObjectType, wall: Wall, position: number = 0.5, height: number = 0.5, isGhost: boolean = false, zOffset?: number) {
    // Проверяем входные данные
    if (!wall || !wall.mesh) {
      console.error('Wall or wall.mesh is null in WallObject constructor');
      throw new Error('Cannot create WallObject: wall is invalid');
    }
    
    if (position < 0 || position > 1) {
      console.warn(`Invalid position value: ${position}, clamping to [0,1] range`);
      position = Math.max(0, Math.min(1, position));
    }
    
    if (height <= 0) {
      console.warn(`Invalid height value: ${height}, using default value`);
      height = type === 'socket' ? 0.5 : 2;
    }
    
    const group = new THREE.Group()
    super(group)
    this.group = group
    this.type = type
    this.wall = wall
    this.position = position
    this.height = height
    this.isGhost = isGhost
    this.zOffset = zOffset

    // Создание геометрии и материала по параметрам из config
    let geometry: THREE.BufferGeometry
    let material: THREE.Material

    if (type === 'socket') {
      geometry = new THREE.BoxGeometry(SOCKET_PARAMS.width, SOCKET_PARAMS.height, SOCKET_PARAMS.depth)
      material = new THREE.MeshStandardMaterial({ 
        color: SOCKET_PARAMS.color,
        roughness: SOCKET_PARAMS.roughness,
        metalness: SOCKET_PARAMS.metalness,
        transparent: isGhost || SOCKET_PARAMS.opacity < 1,
        opacity: isGhost ? SOCKET_PARAMS.ghostOpacity : SOCKET_PARAMS.opacity
      })
    } else {
      geometry = new THREE.BoxGeometry(DOOR_PARAMS.width, DOOR_PARAMS.height, DOOR_PARAMS.depth)
      material = new THREE.MeshStandardMaterial({ 
        color: DOOR_PARAMS.color,
        roughness: DOOR_PARAMS.roughness,
        metalness: DOOR_PARAMS.metalness,
        transparent: isGhost || DOOR_PARAMS.opacity < 1,
        opacity: isGhost ? DOOR_PARAMS.ghostOpacity : DOOR_PARAMS.opacity
      })
    }
    this.mesh = new THREE.Mesh(geometry, material)
    // Контур для объекта
    const edges = new THREE.EdgesGeometry(geometry)
    this.outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 }))
    this.mesh.add(this.outline)
    this.updatePosition()
    if (isGhost) {
      this.mesh.raycast = () => {} // Ghost-объект не ловит raycast
      // Отключаем raycast для всех детей (контуров)
      this.mesh.traverse(child => { child.raycast = () => {}; })
    }
    this.group.add(this.mesh)
  }

  private updatePosition() {
    // Проверяем, что wall и wall.mesh существуют
    if (!this.wall || !this.wall.mesh) {
      console.error('Wall or wall.mesh is null or undefined in WallObject.updatePosition');
      return;
    }
    
    // Получаем размеры стены
    const wallSize = new THREE.Vector3()
    this.wall.mesh.geometry.computeBoundingBox()
    this.wall.mesh.geometry.boundingBox?.getSize(wallSize)
    // Позиция вдоль стены
    let x = (this.position - 0.5) * wallSize.x
    let y = 0
    let z = 0
    // Корректная высота относительно пола
    if (this.type === 'door') {
      const doorHeight = 2
      y = (doorHeight / 2) - (wallSize.y / 2) // нижний край двери на полу
      z = 0 // дверь центрируется по толщине стены
    } else if (this.type === 'socket') {
      y = 0.25 - (wallSize.y / 2) // розетка на высоте 0.25м
      z = this.zOffset !== undefined ? this.zOffset : -0.06 // универсальное смещение
    }
    // Преобразуем локальные координаты в мировые
    const localPos = new THREE.Vector3(x, y, z)
    this.wall.mesh.localToWorld(localPos)
    this.mesh.position.copy(localPos)
    // Поворот совпадает с поворотом стены
    this.mesh.quaternion.copy(this.wall.mesh.getWorldQuaternion(new THREE.Quaternion()))
  }

  public getObject(): THREE.Group {
    return this.group
  }

  public getId(): string {
    return this.group.uuid
  }

  public getMesh(): THREE.Mesh {
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

  public getWall(): Wall {
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
    const isVertical = Math.abs(this.wall.mesh.rotation.y) === Math.PI / 2

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

  public select() {
    if (this.mesh.material instanceof THREE.MeshStandardMaterial) {
      if (this.mesh.userData.origColor === undefined) {
        this.mesh.userData.origColor = this.mesh.material.color.getHex()
      }
      this.mesh.material.color.set(0xffff00)
      this.mesh.material.emissive.set(0xffff00)
      this.mesh.material.emissiveIntensity = 1.0
    }
    this.isSelected = true
  }

  public deselect() {
    if (this.mesh.material instanceof THREE.MeshStandardMaterial) {
      if (this.mesh.userData.origColor !== undefined) {
        this.mesh.material.color.set(this.mesh.userData.origColor)
        delete this.mesh.userData.origColor
      }
      this.mesh.material.emissive.set(0x000000)
      this.mesh.material.emissiveIntensity = 1.0
    }
    this.isSelected = false
  }

  showOutline() {
    this.outline.visible = true
  }

  hideOutline() {
    this.outline.visible = false
  }
} 