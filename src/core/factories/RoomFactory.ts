import * as THREE from 'three'
import { Room } from '../objects/Room'
import { Wall } from '../objects/Wall'
import { Floor } from '../objects/Floor'
import { WALL_PARAMS, FLOOR_PARAMS } from '../../params/config'

/**
 * Фабрика для создания комнат
 * Отвечает за корректное создание комнат, стен и пола
 */
export class RoomFactory {
  /**
   * Создает комнату по двум точкам (углам)
   * @param startPoint Первая точка (угол комнаты)
   * @param endPoint Вторая точка (противоположный угол)
   * @param wallHeight Высота стен
   * @returns Созданная комната
   */
  static createRoomFromPoints(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    wallHeight: number
  ): Room {
    // Вычисляем центр комнаты
    const center = new THREE.Vector3(
      (startPoint.x + endPoint.x) / 2,
      0,
      (startPoint.z + endPoint.z) / 2
    );
    
    // Вычисляем размеры комнаты (всегда положительные)
    const width = Math.abs(endPoint.x - startPoint.x);
    const depth = Math.abs(endPoint.z - startPoint.z);
    
    // Создаем комнату с заданными параметрами
    return this.createRoom(center, width, depth, wallHeight);
  }
  
  /**
   * Создает комнату с заданными параметрами
   * @param center Центр комнаты
   * @param width Ширина комнаты
   * @param depth Глубина комнаты
   * @param wallHeight Высота стен
   * @returns Созданная комната
   */
  static createRoom(
    center: THREE.Vector3,
    width: number,
    depth: number,
    wallHeight: number
  ): Room {
    // Создаем группу для всех объектов комнаты
    const group = new THREE.Group();
    
    // Устанавливаем позицию группы в центр комнаты
    group.position.copy(center);
    
    // Создаем пол
    const floor = this.createFloor(width, depth);
    group.add(floor.mesh);
    
    // Создаем стены
    const walls = this.createWalls(width, depth, wallHeight);
    walls.forEach(wall => group.add(wall.mesh));
    
    // Создаем объект комнаты
    const room = new Room(group, walls, floor);
    
    // Устанавливаем правильные размеры для комнаты
    room.width = width;
    room.height = depth;
    
    return room;
  }
  
  /**
   * Создает пол с заданными размерами
   * @param width Ширина пола
   * @param depth Глубина пола
   * @returns Объект пола
   */
  private static createFloor(width: number, depth: number): Floor {
    const floorGeom = new THREE.BoxGeometry(width, 0.1, depth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: FLOOR_PARAMS.color,
      roughness: FLOOR_PARAMS.roughness,
      metalness: FLOOR_PARAMS.metalness,
      transparent: FLOOR_PARAMS.opacity < 1,
      opacity: FLOOR_PARAMS.opacity
    });
    
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.set(0, -0.05, 0); // Небольшое смещение вниз, чтобы избежать z-fighting
    
    return new Floor(floorMesh);
  }
  
  /**
   * Создает стены комнаты
   * @param width Ширина комнаты
   * @param depth Глубина комнаты
   * @param wallHeight Высота стен
   * @returns Массив созданных стен
   */
  private static createWalls(width: number, depth: number, wallHeight: number): Wall[] {
    const walls: Wall[] = [];
    const thickness = WALL_PARAMS.thickness;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    
    // Материал для стен
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: WALL_PARAMS.color,
      roughness: WALL_PARAMS.roughness,
      metalness: WALL_PARAMS.metalness,
      transparent: WALL_PARAMS.opacity < 1,
      opacity: WALL_PARAMS.opacity
    });
    
    // Передняя стена (Z-)
    const frontWallGeom = new THREE.BoxGeometry(width, wallHeight, thickness);
    const frontWallMesh = new THREE.Mesh(frontWallGeom, wallMaterial);
    frontWallMesh.position.set(0, wallHeight / 2, -halfDepth);
    frontWallMesh.rotation.y = 0; // Нормаль уже направлена внутрь
    walls.push(new Wall(frontWallMesh));
    
    // Правая стена (X+)
    const rightWallGeom = new THREE.BoxGeometry(depth, wallHeight, thickness);
    const rightWallMesh = new THREE.Mesh(rightWallGeom, wallMaterial);
    rightWallMesh.position.set(halfWidth, wallHeight / 2, 0);
    rightWallMesh.rotation.y = -Math.PI / 2; // Поворот для правильной ориентации
    walls.push(new Wall(rightWallMesh));
    
    // Задняя стена (Z+)
    const backWallGeom = new THREE.BoxGeometry(width, wallHeight, thickness);
    const backWallMesh = new THREE.Mesh(backWallGeom, wallMaterial);
    backWallMesh.position.set(0, wallHeight / 2, halfDepth);
    backWallMesh.rotation.y = Math.PI; // Поворот для правильной ориентации
    walls.push(new Wall(backWallMesh));
    
    // Левая стена (X-)
    const leftWallGeom = new THREE.BoxGeometry(depth, wallHeight, thickness);
    const leftWallMesh = new THREE.Mesh(leftWallGeom, wallMaterial);
    leftWallMesh.position.set(-halfWidth, wallHeight / 2, 0);
    leftWallMesh.rotation.y = Math.PI / 2; // Поворот для правильной ориентации
    walls.push(new Wall(leftWallMesh));
    
    // Добавляем контуры к стенам
    walls.forEach(wall => {
      const edges = new THREE.EdgesGeometry(wall.mesh.geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      wall.outline = line;
      wall.mesh.add(line);
    });
    
    return walls;
  }
} 