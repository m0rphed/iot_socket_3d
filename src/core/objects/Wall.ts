import { SceneObject } from './SceneObject'
import * as THREE from 'three'
import type { HasOutline } from './interfaces/HasOutline'
import { WALL_PARAMS } from '../../params/config'

export class Wall extends SceneObject implements HasOutline {
  mesh: THREE.Mesh
  outline: THREE.LineSegments
  thickness: number

  constructor(mesh: THREE.Mesh, thickness: number = WALL_PARAMS.thickness) {
    super(mesh)
    this.mesh = mesh
    this.thickness = thickness
    // Создаём контур
    const edges = new THREE.EdgesGeometry(mesh.geometry)
    this.outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x111111 }))
    this.mesh.add(this.outline)
  }

  getSize() {
    const size = new THREE.Vector3()
    this.mesh.geometry.computeBoundingBox()
    this.mesh.geometry.boundingBox?.getSize(size)
    return size
  }

  getWorldPosition(target: THREE.Vector3) {
    return this.mesh.getWorldPosition(target)
  }

  getWorldQuaternion(target: THREE.Quaternion) {
    return this.mesh.getWorldQuaternion(target)
  }

  /**
   * Возвращает нормаль стены в мировых координатах
   * @returns {THREE.Vector3} Нормаль стены в мировых координатах
   */
  getWorldNormal(): THREE.Vector3 {
    // В локальных координатах нормаль стены всегда направлена по оси Z
    const localNormal = new THREE.Vector3(0, 0, 1)
    // Преобразуем локальную нормаль в мировые координаты
    const worldNormal = localNormal.clone().applyQuaternion(
      this.getWorldQuaternion(new THREE.Quaternion())
    ).normalize()
    
    return worldNormal
  }

  /**
   * Проверяет, направлена ли нормаль стены внутрь комнаты
   * @returns {boolean} true, если нормаль направлена внутрь комнаты
   */
  isNormalPointingInward(): boolean {
    try {
      // Нормаль стены
      const worldNormal = this.getWorldNormal()
      
      // Получаем родительскую комнату (центр комнаты)
      const room = this.mesh.parent
      if (!room) {
        console.warn('Wall has no parent room in isNormalPointingInward')
        return false
      }
      
      // Центр комнаты
      const roomCenter = new THREE.Vector3()
      room.getWorldPosition(roomCenter)
      
      // Центр стены
      const wallCenter = new THREE.Vector3()
      this.getWorldPosition(wallCenter)
      
      // Вектор от центра комнаты к центру стены
      const toWall = wallCenter.clone().sub(roomCenter).normalize()
      
      // Скалярное произведение. Если < 0, нормаль направлена внутрь комнаты
      const dot = worldNormal.dot(toWall)
      
      // Для отладки можно добавить логирование
      if (Math.abs(dot) < 0.1) {
        console.warn('Wall normal is almost perpendicular to room center vector, may cause issues', {
          wallId: this.uuid,
          dot,
          normal: worldNormal,
          toWall
        })
      }
      
      return dot < 0
    } catch (error) {
      console.error('Error in isNormalPointingInward:', error)
      // По умолчанию предполагаем, что нормаль направлена наружу
      return false
    }
  }

  add(obj: THREE.Object3D) {
    this.mesh.add(obj)
  }

  remove(obj: THREE.Object3D) {
    this.mesh.remove(obj)
  }

  showOutline() {
    this.outline.visible = true
  }

  hideOutline() {
    this.outline.visible = false
  }

  select() {}
  deselect() {}
  
  getThickness() {
    return this.thickness
  }

  setThickness(thickness: number) {
    this.thickness = thickness
    // TODO: обновить геометрию меша
    // При необходимости здесь можно обновить геометрию меша
  }

  // Методы для работы со стеной (например, getLength и т.д.)
} 