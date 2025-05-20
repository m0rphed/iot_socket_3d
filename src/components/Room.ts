import * as THREE from 'three'
import type { WallObjectType } from './WallObject'
import { WallObject } from './WallObject'
import { WALL_PARAMS, FLOOR_PARAMS, MARKER_PARAMS } from '../params/config'

export class Room {
  private group: THREE.Group
  private objectsGroup: THREE.Group // Группа для всех пользовательских объектов
  private walls: THREE.Mesh[] = []
  private wallObjects: WallObject[] = []
  private resizeMarkers: THREE.Mesh[] = []
  private width: number
  private height: number
  private wallHeight: number
  private wallThickness: number = WALL_PARAMS.thickness
  private wallNormals: boolean[] = [] // true если нормаль внутрь комнаты
  private wallEdgeLines: THREE.LineSegments[] = []

  constructor(width: number = 4, height: number = 4, wallHeight: number = 2.5) {
    this.width = width
    this.height = height
    this.wallHeight = wallHeight
    this.group = new THREE.Group()
    this.objectsGroup = new THREE.Group()
    this.group.add(this.objectsGroup)
    this.createFloor()
    this.createWalls()
    this.createResizeMarkers()
  }

  private createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(this.width, this.height)
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: FLOOR_PARAMS.color,
      roughness: FLOOR_PARAMS.roughness,
      metalness: FLOOR_PARAMS.metalness,
      side: THREE.DoubleSide,
      transparent: FLOOR_PARAMS.opacity < 1,
      opacity: FLOOR_PARAMS.opacity
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    this.group.add(floor)
    // Контур пола
    const floorEdges = new THREE.EdgesGeometry(floorGeometry)
    const floorLine = new THREE.LineSegments(floorEdges, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }))
    floorLine.rotation.x = -Math.PI / 2
    floorLine.position.y = 0.01
    this.group.add(floorLine)
  }

  private createWallWithEdges(
    geometry: THREE.BoxGeometry,
    material: THREE.Material,
    position: THREE.Vector3,
    rotationY: number
  ): THREE.Mesh {
    const wall = new THREE.Mesh(geometry, material)
    wall.position.copy(position)
    wall.rotation.y = rotationY
    this.walls.push(wall)
    this.group.add(wall)
    // Контур
    const edges = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }))
    line.position.copy(position)
    line.rotation.y = rotationY
    this.group.add(line)
    this.wallEdgeLines.push(line)
    return wall
  }

  private removeAllWallEdgeLines() {
    this.wallEdgeLines.forEach(line => {
      this.group.remove(line)
      if (line.geometry) line.geometry.dispose()
      if (line.material && line.material instanceof THREE.Material) line.material.dispose()
    })
    this.wallEdgeLines = []
  }

  private createWalls() {
    this.removeAllWallEdgeLines()
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: WALL_PARAMS.color,
      roughness: WALL_PARAMS.roughness,
      metalness: WALL_PARAMS.metalness,
      transparent: WALL_PARAMS.opacity < 1,
      opacity: WALL_PARAMS.opacity
    })
    // Передняя стена (WALL 0)
    this.createWallWithEdges(
      new THREE.BoxGeometry(this.width, this.wallHeight, this.wallThickness),
      wallMaterial,
      new THREE.Vector3(0, this.wallHeight / 2, -this.height / 2),
      Math.PI
    )
    // Задняя стена (WALL 1)
    this.createWallWithEdges(
      new THREE.BoxGeometry(this.width, this.wallHeight, this.wallThickness),
      wallMaterial,
      new THREE.Vector3(0, this.wallHeight / 2, this.height / 2),
      0
    )
    // Левая стена (WALL 2)
    this.createWallWithEdges(
      new THREE.BoxGeometry(this.height, this.wallHeight, this.wallThickness),
      wallMaterial,
      new THREE.Vector3(-this.width / 2, this.wallHeight / 2, 0),
      -Math.PI / 2
    )
    // Правая стена (WALL 3)
    this.createWallWithEdges(
      new THREE.BoxGeometry(this.height, this.wallHeight, this.wallThickness),
      wallMaterial,
      new THREE.Vector3(this.width / 2, this.wallHeight / 2, 0),
      Math.PI / 2
    )
  }

  private createResizeMarkers() {
    const markerGeometry = new THREE.BoxGeometry(MARKER_PARAMS.size, MARKER_PARAMS.size, MARKER_PARAMS.size)
    const markerMaterial = new THREE.MeshBasicMaterial({ color: MARKER_PARAMS.color })
    // Удаляем старые маркеры
    this.resizeMarkers.forEach(marker => {
      this.group.remove(marker)
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
      this.group.add(marker)
    })
  }

  public getObject(): THREE.Object3D {
    return this.group
  }
  public getResizeMarkers(): THREE.Mesh[] {
    return this.resizeMarkers
  }
  public getWalls(): THREE.Mesh[] {
    return this.walls
  }
  public setPosition(x: number, z: number) {
    this.group.position.set(x, 0, z)
  }
  public setSize(width: number, height: number) {
    this.width = width
    this.height = height
    // Удаляем старые стены
    this.walls.forEach(wall => {
      this.group.remove(wall)
      wall.geometry.dispose()
      if (wall.material instanceof THREE.Material) wall.material.dispose()
    })
    this.walls = []
    this.createWalls()
    this.createResizeMarkers()
    // TODO: обновить объекты на стенах
  }
  public setWallHeight(height: number) {
    this.wallHeight = height
    this.setSize(this.width, this.height)
  }
  public getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height }
  }
  public addWallObject(type: WallObjectType, wall: THREE.Mesh, position: number = 0.5, height: number = 0.5): WallObject {
    const wallObject = new WallObject(type, wall, position, height)
    this.wallObjects.push(wallObject)
    this.objectsGroup.add(wallObject.getObject())
    return wallObject
  }
  public getWallObjects(): WallObject[] {
    return this.wallObjects
  }
  public removeWallObject(wallObject: WallObject) {
    const index = this.wallObjects.indexOf(wallObject)
    if (index !== -1) {
      this.objectsGroup.remove(wallObject.getObject())
      // Освобождаем память для всех дочерних объектов группы
      wallObject.getObject().traverse(obj => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          if (obj.geometry) obj.geometry.dispose()
          const mat = obj.material
          if (Array.isArray(mat)) {
            mat.forEach(m => m && typeof m.dispose === 'function' && m.dispose())
          } else if (mat && typeof mat.dispose === 'function') {
            mat.dispose()
          }
        }
      })
      this.wallObjects.splice(index, 1)
    }
  }
  public getWallNormals(): boolean[] {
    return this.wallNormals
  }
}
 