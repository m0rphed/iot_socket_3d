import * as THREE from 'three'
 
export interface HasOutline {
  outline: THREE.LineSegments
  showOutline(): void
  hideOutline(): void
} 