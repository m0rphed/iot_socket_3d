import { WallObject } from './WallObject'
import { Wall } from './Wall'
import * as THREE from 'three'
import { DOOR_PARAMS } from '../../params/config'

export class Door extends WallObject {
  constructor(wall: Wall, position: number = 0.5, isGhost: boolean = false) {
    // Центр двери на высоте 1 метр от пола
    const height = DOOR_PARAMS.height;
    // Дверь по центру стены (zOffset = 0)
    super('door', wall, position, height, isGhost);
  }
} 