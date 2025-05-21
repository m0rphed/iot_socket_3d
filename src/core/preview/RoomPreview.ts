import * as THREE from 'three'
import { FLOOR_PARAMS } from '../../params/config'

/**
 * Класс для предпросмотра комнаты при создании
 */
export class RoomPreview {
  private previewMesh: THREE.Mesh | null = null;
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * Обновляет визуализацию предпросмотра комнаты
   * @param startPoint Первая точка комнаты
   * @param endPoint Вторая точка комнаты
   */
  update(startPoint: THREE.Vector3, endPoint: THREE.Vector3): void {
    // Вычисляем центр комнаты
    const centerX = (startPoint.x + endPoint.x) / 2;
    const centerZ = (startPoint.z + endPoint.z) / 2;
    
    // Вычисляем размеры комнаты
    const width = Math.abs(endPoint.x - startPoint.x);
    const depth = Math.abs(endPoint.z - startPoint.z);
    
    // Если предпросмотр уже существует, обновляем его
    if (this.previewMesh) {
      this.previewMesh.scale.set(width, 1, depth);
      this.previewMesh.position.set(centerX, 0, centerZ);
    } else {
      // Создаем новый предпросмотр
      this.createPreviewMesh(width, depth, new THREE.Vector3(centerX, 0, centerZ));
    }
  }
  
  /**
   * Создает сетку предпросмотра
   * @param width Ширина комнаты
   * @param depth Глубина комнаты
   * @param position Позиция центра комнаты
   */
  private createPreviewMesh(width: number, depth: number, position: THREE.Vector3): void {
    // Создаем геометрию и материал
    const previewGeom = new THREE.BoxGeometry(1, 0.05, 1);
    const previewMat = new THREE.MeshBasicMaterial({ 
      color: FLOOR_PARAMS.color, 
      transparent: true, 
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    // Создаем меш
    const previewMesh = new THREE.Mesh(previewGeom, previewMat);
    previewMesh.scale.set(width, 1, depth);
    previewMesh.position.copy(position);
    
    // Добавляем эффект "сетки" на предпросмотр
    const lineGeometry = new THREE.EdgesGeometry(previewMesh.geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(lineGeometry, lineMaterial);
    previewMesh.add(wireframe);
    
    // Добавляем в сцену
    this.scene.add(previewMesh);
    this.previewMesh = previewMesh;
  }
  
  /**
   * Удаляет предпросмотр со сцены
   */
  remove(): void {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      
      // Освобождаем ресурсы
      if (this.previewMesh.geometry) {
        this.previewMesh.geometry.dispose();
      }
      
      if (this.previewMesh.material instanceof THREE.Material) {
        this.previewMesh.material.dispose();
      }
      
      // Удаляем контур
      this.previewMesh.children.forEach(child => {
        if (child instanceof THREE.LineSegments) {
          if (child.geometry) child.geometry.dispose();
          if (child.material instanceof THREE.Material) child.material.dispose();
        }
      });
      
      this.previewMesh = null;
    }
  }
  
  /**
   * Проверяет, достаточно ли велик размер комнаты
   * @param startPoint Первая точка комнаты
   * @param endPoint Вторая точка комнаты
   * @param minSize Минимальный размер комнаты
   * @returns true, если размер достаточный
   */
  isSizeValid(startPoint: THREE.Vector3, endPoint: THREE.Vector3, minSize: number = 1): boolean {
    const width = Math.abs(endPoint.x - startPoint.x);
    const depth = Math.abs(endPoint.z - startPoint.z);
    
    return width >= minSize && depth >= minSize;
  }
} 