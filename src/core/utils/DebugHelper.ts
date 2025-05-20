import * as THREE from 'three'
import { Room } from '../objects/Room'
import { Wall } from '../objects/Wall'
import { DEBUG_PARAMS } from '../../params/config'

/**
 * Класс для отладочной визуализации
 */
export class DebugHelper {
  private scene: THREE.Scene
  private debugObjects: THREE.Object3D[] = []
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }
  
  /**
   * Добавляет отладочные маркеры для всех комнат
   * @param rooms Массив комнат
   */
  addDebugMarkersForRooms(rooms: Room[]) {
    this.removeAllDebugMarkers()
    
    rooms.forEach(room => {
      // Красная сфера в центре комнаты
      const roomCenter = new THREE.Vector3()
      room.getObject().getWorldPosition(roomCenter)
      const roomSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      )
      roomSphere.position.copy(roomCenter)
      roomSphere.userData.isDebug = true
      this.scene.add(roomSphere)
      this.debugObjects.push(roomSphere)
      
      // Для каждой стены добавляем отладочную информацию
      room.getWalls().forEach((wall, idx) => this.addDebugMarkersForWall(wall, idx))
    })
  }
  
  /**
   * Добавляет отладочные маркеры для стены
   * @param wall Стена
   * @param index Индекс стены
   */
  private addDebugMarkersForWall(wall: Wall, index: number) {
    // Подпись стены
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = '24px Arial'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('WALL ' + index, canvas.width / 2, canvas.height / 2)
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(0.7, 0.18, 1)
    const wallCenter = new THREE.Vector3()
    wall.getWorldPosition(wallCenter)

    // Смещение подписи вдоль нормали стены, чтобы она была поверх
    const worldNormal = wall.getWorldNormal()
    sprite.position.copy(wallCenter.add(worldNormal.clone().multiplyScalar(0.12)))
    sprite.position.y += 0.4
    sprite.userData.isDebug = true
    this.scene.add(sprite)
    this.debugObjects.push(sprite)

    // Стрелка нормали
    const arrowStart = wallCenter.clone().add(new THREE.Vector3(0, 0.08, 0))
    const arrowGeom = new THREE.BufferGeometry().setFromPoints([
      arrowStart,
      arrowStart.clone().add(worldNormal.clone().multiplyScalar(0.5))
    ])
    const arrowMat = new THREE.LineBasicMaterial({ color: 0x00ff00 })
    const arrow = new THREE.Line(arrowGeom, arrowMat)
    arrow.userData.isDebug = true
    this.scene.add(arrow)
    this.debugObjects.push(arrow)
    
    // Добавляем локальные оси к стене
    this.addDebugAxesToWall(wall)
  }
  
  /**
   * Добавляет отладочные оси к стене
   * @param wall Стена
   */
  private addDebugAxesToWall(wall: Wall) {
    // Жёлтая сфера в локальных координатах стены
    const sphereGeometry = new THREE.SphereGeometry(0.07, 12, 12)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(0, 0, 0)
    sphere.userData.isDebug = true
    wall.mesh.add(sphere)
    
    // Оси
    const axisLength = 0.5
    // X - красный
    const xGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(axisLength, 0, 0)
    ])
    const xMat = new THREE.LineBasicMaterial({ color: 0xff0000 })
    const xLine = new THREE.Line(xGeom, xMat)
    xLine.userData.isDebug = true
    wall.mesh.add(xLine)
    
    // Y - зелёный
    const yGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisLength, 0)
    ])
    const yMat = new THREE.LineBasicMaterial({ color: 0x00ff00 })
    const yLine = new THREE.Line(yGeom, yMat)
    yLine.userData.isDebug = true
    wall.mesh.add(yLine)
    
    // Z - синий
    const zGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, axisLength)
    ])
    const zMat = new THREE.LineBasicMaterial({ color: 0x0000ff })
    const zLine = new THREE.Line(zGeom, zMat)
    zLine.userData.isDebug = true
    wall.mesh.add(zLine)
  }
  
  /**
   * Удаляет все отладочные маркеры
   */
  removeAllDebugMarkers() {
    // Удалить из сцены все объекты
    this.debugObjects.forEach(obj => {
      if (obj.parent) obj.parent.remove(obj)
      this.scene.remove(obj)
    })
    this.debugObjects = []
    
    // Поиск и удаление всех дочерних debug-объектов в сцене
    const toRemove: {parent: THREE.Object3D, child: THREE.Object3D}[] = []
    this.scene.traverse(object => {
      if (object.children) {
        object.children.forEach(child => {
          if (child.userData && child.userData.isDebug) {
            toRemove.push({parent: object, child})
          }
        })
      }
    })
    
    toRemove.forEach(({parent, child}) => {
      parent.remove(child)
    })
  }
} 