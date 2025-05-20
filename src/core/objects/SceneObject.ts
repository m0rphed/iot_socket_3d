import * as THREE from 'three'

export abstract class SceneObject {
  uuid: string
  object3D: THREE.Object3D

  constructor(object3D: THREE.Object3D) {
    this.uuid = object3D.uuid
    this.object3D = object3D
  }

  abstract select(): void
  abstract deselect(): void
}