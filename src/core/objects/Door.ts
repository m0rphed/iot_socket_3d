import { WallObject } from './WallObject'
import { Wall } from './Wall'
import { DOOR_PARAMS } from '../../params/config'

export class Door extends WallObject {
  constructor(wall: Wall, position: number = 0.5, isGhost: boolean = false) {
    // Проверяем, что стена существует и имеет mesh
    if (!wall || !wall.mesh) {
      console.error('Wall or wall.mesh is null in Door constructor');
      throw new Error('Cannot create Door: wall is invalid');
    }
    
    try {
      // Центр двери на высоте 1 метр от пола
      const height = DOOR_PARAMS.height;
      // Дверь по центру стены (zOffset = 0)
      super('door', wall, position, height, isGhost);
    } catch (error) {
      console.error('Error creating Door:', error);
      throw new Error('Failed to create Door');
    }
  }
} 