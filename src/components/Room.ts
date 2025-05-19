import * as THREE from 'three'
import type { WallObjectType } from './WallObject'
import { WallObject } from './WallObject'

export class Room {
  private group: THREE.Group
  private walls: THREE.Mesh[] = []
  private wallObjects: WallObject[] = []
  private resizeMarkers: THREE.Mesh[] = []
  private width: number
  private height: number
  private wallHeight: number
  private wallThickness: number = 0.1
  private wallNormals: boolean[] = [] // true если нормаль внутрь комнаты

  constructor(width: number = 4, height: number = 4, wallHeight: number = 2.5) {
    this.width = width
    this.height = height
    this.wallHeight = wallHeight
    this.group = new THREE.Group()
    this.createFloor()
    this.createWalls()
    this.createResizeMarkers()
  }

  private createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(this.width, this.height)
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.27
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

  private createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x986eba,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.27
    })
    // Передняя стена (WALL 0)
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, this.wallHeight, this.wallThickness),
      wallMaterial
    )
    frontWall.position.set(0, this.wallHeight / 2, -this.height / 2)
    frontWall.rotation.y = Math.PI
    this.walls.push(frontWall)
    this.group.add(frontWall)
    const frontEdges = new THREE.EdgesGeometry(frontWall.geometry)
    const frontLine = new THREE.LineSegments(frontEdges, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }))
    frontLine.position.copy(frontWall.position)
    frontLine.rotation.copy(frontWall.rotation)
    this.group.add(frontLine)
    // Задняя стена (WALL 1)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, this.wallHeight, this.wallThickness),
      wallMaterial
    )
    backWall.position.set(0, this.wallHeight / 2, this.height / 2)
    this.walls.push(backWall)
    this.group.add(backWall)
    const backEdges = new THREE.EdgesGeometry(backWall.geometry)
    const backLine = new THREE.LineSegments(backEdges, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }))
    backLine.position.copy(backWall.position)
    backLine.rotation.copy(backWall.rotation)
    this.group.add(backLine)
    // Левая стена (WALL 2)
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.height, this.wallHeight, this.wallThickness),
      wallMaterial
    )
    leftWall.position.set(-this.width / 2, this.wallHeight / 2, 0)
    leftWall.rotation.y = -Math.PI / 2
    this.walls.push(leftWall)
    this.group.add(leftWall)
    const leftEdges = new THREE.EdgesGeometry(leftWall.geometry)
    const leftLine = new THREE.LineSegments(leftEdges, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }))
    leftLine.position.copy(leftWall.position)
    leftLine.rotation.copy(leftWall.rotation)
    this.group.add(leftLine)
    // Правая стена (WALL 3)
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.height, this.wallHeight, this.wallThickness),
      wallMaterial
    )
    rightWall.position.set(this.width / 2, this.wallHeight / 2, 0)
    rightWall.rotation.y = Math.PI / 2
    this.walls.push(rightWall)
    this.group.add(rightWall)
    const rightEdges = new THREE.EdgesGeometry(rightWall.geometry)
    const rightLine = new THREE.LineSegments(rightEdges, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }))
    rightLine.position.copy(rightWall.position)
    rightLine.rotation.copy(rightWall.rotation)
    this.group.add(rightLine)
  }

  private createResizeMarkers() {
    const markerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x2196f3 })
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
    this.group.add(wallObject.getObject())
    return wallObject
  }
  public getWallObjects(): WallObject[] {
    return this.wallObjects
  }
  public removeWallObject(wallObject: WallObject) {
    const index = this.wallObjects.indexOf(wallObject)
    if (index !== -1) {
      this.group.remove(wallObject.getObject())
      this.wallObjects.splice(index, 1)
    }
  }
  public getWallNormals(): boolean[] {
    return this.wallNormals
  }
}
