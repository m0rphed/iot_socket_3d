import { SceneObject } from './SceneObject'
import * as THREE from 'three'
import type { HasOutline } from './interfaces/HasOutline'

export class Floor extends SceneObject implements HasOutline {
  mesh: THREE.Mesh
  outline: THREE.LineSegments

  constructor(mesh: THREE.Mesh) {
    super(mesh)
    this.mesh = mesh
    // Контур для пола
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

  // Методы для работы с полом
} 