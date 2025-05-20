import { WallObject } from './WallObject'
import { Wall } from './Wall'
import * as THREE from 'three'
import { SOCKET_PARAMS, WALL_PARAMS } from '../../params/config'

export class Socket extends WallObject {
  depth: number
  
  constructor(wall: Wall, position: number = 0.5, isGhost: boolean = false, socketDepth?: number) {
    // Вычисление zOffset для розетки
    const zOffset = Socket.calculateZOffset(wall, socketDepth || SOCKET_PARAMS.depth);
    // Стандартная высота розетки от пола
    const height = SOCKET_PARAMS.height;
    super('socket', wall, position, height, isGhost, zOffset);
    this.depth = socketDepth || SOCKET_PARAMS.depth;
  }

  /**
   * Вычисляет смещение по Z (внутрь/наружу) для розетки на основе нормали стены
   * @param wall Стена, на которой размещается розетка
   * @param socketDepth (глубина) толщина корпуса розетки
   * @returns zOffset - смещение по Z
   */
  static calculateZOffset(wall: Wall, socketDepth: number): number {
    // Проверяем, что стена существует и имеет mesh
    if (!wall || !wall.mesh) {
      console.error('Wall or wall.mesh is null in Socket.calculateZOffset');
      return socketDepth / 2; // базовое смещение только на половину глубины розетки
    }
    
    // Получаем родительскую комнату
    const room = wall.mesh.parent;
    // По умолчанию смещаем внутрь
    if (!room) return WALL_PARAMS.thickness / 2 + socketDepth / 2;
    
    try {
      // Определяем, направлена ли нормаль стены внутрь комнаты
      const isInward = wall.isNormalPointingInward();
      // console.log(`Socket ${wall.uuid} - isInward: ${isInward}`);
      
      // Смещение на половину толщины стены + половина глубины розетки
      // (берутся половины длин = т.к. это и есть расстояние от центра объекта до его края)
      const offset = wall.getThickness() / 2 + socketDepth / 2;
      
      // Если нормаль направлена внутрь комнаты, смещаем розетку внутрь, иначе наружу
      return isInward ? offset : -offset;
    } catch (error) {
      console.error('Error calculating socket offset:', error);
      // Безопасное значение по умолчанию
      return wall.getThickness() / 2 + socketDepth / 2;
    }
  }
} 