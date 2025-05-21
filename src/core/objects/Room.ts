import { SceneObject } from './SceneObject'
import { Wall } from './Wall'
import { Floor } from './Floor'
import * as THREE from 'three'
import { WallObject } from './WallObject'
import { Socket } from './Socket'
import { Door } from './Door'
import { WALL_PARAMS, FLOOR_PARAMS, MARKER_PARAMS, SOCKET_PARAMS } from '../../params/config'

export class Room extends SceneObject {
  walls: Wall[]
  floor: Floor
  wallObjects: WallObject[] = []
  resizeMarkers: THREE.Mesh[] = []
  width: number = 4
  height: number = 4
  wallHeight: number = 2.5

  constructor(group: THREE.Group, walls: Wall[], floor: Floor) {
    super(group)
    this.walls = walls
    this.floor = floor
    this.createResizeMarkers()
  }

  getObject() {
    return this.object3D
  }

  getSize() {
    return { width: this.width, height: this.height }
  }

  setSize(width: number, height: number) {
    // Проверка валидности входных данных
    if (!isFinite(width) || width <= 0 || !isFinite(height) || height <= 0) {
      console.error(`Invalid room dimensions: width=${width}, height=${height}`);
      return;
    }
    
    const oldWidth = this.width;
    const oldHeight = this.height;
    this.width = width;
    this.height = height;
    
    // Обновляем геометрии стен
    for (let i = 0; i < this.walls.length; i++) {
      const wall = this.walls[i];
      const thickness = wall.getThickness();
      
      // Определяем ориентацию стены по её повороту
      const rotY = Math.round(wall.mesh.rotation.y * 2 / Math.PI) * Math.PI / 2;
      const isVertical = Math.abs(rotY) === Math.PI / 2;
      
      let wallWidth, wallDepth;
      
      if (isVertical) {
        // Для стен, повернутых на 90 градусов (левая/правая)
        wallWidth = this.height;  // Ширина равна глубине комнаты
        wallDepth = thickness;
        
        // Устанавливаем позицию для левой/правой стены
        if (rotY > 0) { // Правая стена
          wall.mesh.position.set(this.width / 2, this.wallHeight / 2, 0);
        } else { // Левая стена
          wall.mesh.position.set(-this.width / 2, this.wallHeight / 2, 0);
        }
      } else {
        // Для стен без поворота или повернутых на 180 градусов (фронтальная/задняя)
        wallWidth = this.width;   // Ширина равна ширине комнаты
        wallDepth = thickness;
        
        // Устанавливаем позицию для передней/задней стены
        if (Math.abs(rotY) < 0.01) { // Передняя стена
          wall.mesh.position.set(0, this.wallHeight / 2, -this.height / 2);
        } else { // Задняя стена
          wall.mesh.position.set(0, this.wallHeight / 2, this.height / 2);
        }
      }
      
      // Создаем новую геометрию
      wall.mesh.geometry.dispose();
      wall.mesh.geometry = new THREE.BoxGeometry(wallWidth, this.wallHeight, wallDepth);
      
      // Используем новый метод для обновления контура
      wall.outline = this.updateOutline(wall.mesh, wall.outline);
      
      // Добавляем обратно в группу комнаты, если не была добавлена
      if (!this.object3D.children.includes(wall.mesh)) {
        this.object3D.add(wall.mesh);
      }
    }
    
    // Обновляем пол
    this.floor.mesh.geometry.dispose();
    this.floor.mesh.geometry = new THREE.BoxGeometry(this.width, 0.1, this.height);
    this.floor.mesh.position.set(0, -0.05, 0);
    
    // Обновляем контур пола с использованием нашего метода
    this.floor.outline = this.updateOutline(this.floor.mesh, this.floor.outline);
    
    // Обновляем маркеры изменения размера
    this.createResizeMarkers();
    
    // Обновляем объекты на стенах
    // Сохраняем объекты, которые нужно обновить
    const wallObjectsToUpdate = [...this.wallObjects];
    
    // Временно очищаем массив wallObjects, чтобы addWallObject не добавлял дублирующие объекты
    this.wallObjects = [];
    
    // Проходим по всем объектам и пересоздаем их для новых размеров стен
    wallObjectsToUpdate.forEach(wallObject => {
      const wall = wallObject.getWall();
      const position = wallObject.getPosition();
      const type = wallObject.getType();
      
      // Удаляем старый объект из сцены
      this.object3D.remove(wallObject.getObject());
      
      // Создаем новый объект с теми же параметрами
      if (type === 'socket') {
        this.addSocket(wall, position);
      } else if (type === 'door') {
        this.addDoor(wall, position);
      }
    });
  }

  setWallHeight(height: number) {
    // Проверка валидности входных данных
    if (!isFinite(height) || height <= 0) {
      console.error(`Invalid wall height: ${height}`);
      return;
    }
    
    this.wallHeight = height;
    
    // Обновляем геометрии стен
    this.walls.forEach((wall, index) => {
      // Получаем текущие размеры стены
      const currentSize = new THREE.Vector3();
      wall.mesh.geometry.computeBoundingBox();
      wall.mesh.geometry.boundingBox?.getSize(currentSize);
      
      const thickness = wall.getThickness();
      
      // Создаем новую геометрию, сохраняя ширину и глубину, но меняя высоту
      wall.mesh.geometry.dispose();
      
      // Определяем ориентацию стены по её повороту
      const rotY = Math.round(wall.mesh.rotation.y * 2 / Math.PI) * Math.PI / 2;
      const isVertical = Math.abs(rotY) === Math.PI / 2;
      
      let wallWidth, wallDepth;
      
      if (isVertical) {
        // Для стен, повернутых на 90 градусов (левая/правая)
        wallWidth = this.height;  // Ширина равна глубине комнаты
        wallDepth = thickness;
      } else {
        // Для стен без поворота или повернутых на 180 градусов (фронтальная/задняя)
        wallWidth = this.width;   // Ширина равна ширине комнаты
        wallDepth = thickness;
      }
      
      // Создаем новую геометрию
      wall.mesh.geometry = new THREE.BoxGeometry(wallWidth, this.wallHeight, wallDepth);
      
      // Обновляем позицию стены (центрируем по Y)
      const position = wall.mesh.position.clone();
      position.y = this.wallHeight / 2;
      wall.mesh.position.copy(position);
      
      // Используем новый метод для обновления контура
      wall.outline = this.updateOutline(wall.mesh, wall.outline);
    });
    
    // Обновляем объекты на стенах при необходимости
    // Например, объекты типа "дверь" могут зависеть от высоты стены
    this.wallObjects.forEach(wallObject => {
      // Перепозиционируем объекты при необходимости
      if (wallObject.getType() === 'door') {
        // Для дверей может потребоваться обновление высоты
        wallObject.setHeight(wallObject.getHeight());
      }
    });
  }

  setPosition(x: number, z: number) {
    this.object3D.position.set(x, 0, z)
  }

  getResizeMarkers() {
    return this.resizeMarkers
  }

  addWallObject(obj: WallObject) {
    this.wallObjects.push(obj)
    this.object3D.add(obj.getObject())
    // Устанавливаем родительский объект для корректного позиционирования
    obj.setParentObject(this.object3D)
    return obj
  }

  removeWallObject(obj: WallObject) {
    this.wallObjects = this.wallObjects.filter(o => o !== obj)
    this.object3D.remove(obj.getObject())
  }

  getWallObjects(): WallObject[] {
    return this.wallObjects
  }

  getWalls(): Wall[] {
    return this.walls
  }

  addSocket(wall: Wall, position: number = 0.5, isGhost: boolean = false, socketDepth?: number): Socket {
    const socket = new Socket(wall, position, isGhost, socketDepth || SOCKET_PARAMS.depth)
    return this.addWallObject(socket) as Socket
  }

  addDoor(wall: Wall, position: number = 0.5, isGhost: boolean = false): Door {
    const door = new Door(wall, position, isGhost)
    return this.addWallObject(door) as Door
  }

  // Методы для управления комнатой: setSize, setPosition, ...
  select() {}
  deselect() {}

  private createResizeMarkers() {
    const markerGeometry = new THREE.BoxGeometry(MARKER_PARAMS.size, MARKER_PARAMS.size, MARKER_PARAMS.size)
    const markerMaterial = new THREE.MeshBasicMaterial({ color: MARKER_PARAMS.color })
    
    // Удаляем старые маркеры
    this.resizeMarkers.forEach(marker => {
      this.object3D.remove(marker)
      marker.geometry.dispose()
      if (marker.material instanceof THREE.Material) {
        marker.material.dispose()
      }
    })
    this.resizeMarkers = []
    
    // Новые маркеры по углам
    const positions = [
      { x: this.width / 2, z: this.height / 2 },
      { x: -this.width / 2, z: this.height / 2 },
      { x: this.width / 2, z: -this.height / 2 },
      { x: -this.width / 2, z: -this.height / 2 }
    ]
    
    positions.forEach(pos => {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(pos.x, 0.1, pos.z)
      this.resizeMarkers.push(marker)
      this.object3D.add(marker)
    })
  }

  // Метод для сериализации комнаты в JSON
  public toJSON(): any {
    // Собираем данные о стенах
    const wallsData = this.walls.map(wall => {
      // Конвертируем позицию и поворот стены в простые объекты
      const position = wall.mesh.position.clone();
      const rotation = new THREE.Euler().setFromQuaternion(wall.mesh.quaternion);
      
      // Используем измерения напрямую из mesh
      const size = new THREE.Vector3();
      wall.mesh.geometry.computeBoundingBox();
      wall.mesh.geometry.boundingBox?.getSize(size);
      
      return {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
        width: size.x,
        height: size.y,
        depth: size.z
      };
    });
    
    // Собираем данные об объектах на стенах
    const wallObjectsData = this.wallObjects.map(obj => {
      // Базовые свойства для всех объектов на стенах
      const baseData = {
        type: obj.getType(),
        position: obj.getPosition(),
        wallIndex: this.walls.findIndex(wall => wall === obj.getWall())
      };
      
      // Дополнительные свойства для розеток
      if (obj.getType() === 'socket') {
        const socket = obj as Socket;
        return {
          ...baseData,
          name: socket.getName(),
          deviceType: socket.getDeviceType(),
          isOn: socket.getIsOn(),
          powerConsumption: socket.getPowerConsumption()
        };
      }
      
      return baseData;
    });
    
    // Возвращаем полный объект с данными комнаты
    return {
      width: this.width,
      height: this.height,
      wallHeight: this.wallHeight,
      position: {
        x: this.object3D.position.x,
        y: this.object3D.position.y,
        z: this.object3D.position.z
      },
      walls: wallsData,
      wallObjects: wallObjectsData
    };
  }
  
  // Статический метод для создания комнаты из JSON
  public static fromJSON(scene: THREE.Scene, data: any): Room | null {
    try {
      // Создаем группу для комнаты
      const group = new THREE.Group();
      group.position.set(data.position.x, data.position.y, data.position.z);
      
      // Создаем стены
      const walls: Wall[] = [];
      data.walls.forEach((wallData: any) => {
        // Создаем геометрию и материал стены
        const wallGeom = new THREE.BoxGeometry(
          wallData.width, 
          wallData.height, 
          wallData.depth
        );
        const wallMat = new THREE.MeshStandardMaterial({ 
          color: WALL_PARAMS.color,
          roughness: WALL_PARAMS.roughness,
          metalness: WALL_PARAMS.metalness,
          transparent: WALL_PARAMS.opacity < 1,
          opacity: WALL_PARAMS.opacity
        });
        const wallMesh = new THREE.Mesh(wallGeom, wallMat);
        
        // Устанавливаем позицию и поворот
        wallMesh.position.set(
          wallData.position.x,
          wallData.position.y,
          wallData.position.z
        );
        wallMesh.rotation.set(
          wallData.rotation.x,
          wallData.rotation.y,
          wallData.rotation.z
        );
        
        // Создаем контур для стены
        const edges = new THREE.EdgesGeometry(wallGeom);
        const outline = new THREE.LineSegments(
          edges, 
          new THREE.LineBasicMaterial({ color: 0x111111 })
        );
        wallMesh.add(outline);
        
        // Создаем объект Wall и добавляем в группу
        const wall = new Wall(wallMesh);
        wall.outline = outline;
        walls.push(wall);
        group.add(wallMesh);
      });
      
      // Создаем пол
      const floorGeom = new THREE.BoxGeometry(data.width, 0.1, data.height);
      const floorMat = new THREE.MeshStandardMaterial({
        color: FLOOR_PARAMS.color,
        roughness: FLOOR_PARAMS.roughness,
        metalness: FLOOR_PARAMS.metalness,
        transparent: FLOOR_PARAMS.opacity < 1,
        opacity: FLOOR_PARAMS.opacity
      });
      const floorMesh = new THREE.Mesh(floorGeom, floorMat);
      floorMesh.position.set(0, -0.05, 0);
      
      // Добавляем контур для пола
      const floorEdges = new THREE.EdgesGeometry(floorGeom);
      const floorOutline = new THREE.LineSegments(
        floorEdges, 
        new THREE.LineBasicMaterial({ color: 0x111111 })
      );
      floorMesh.add(floorOutline);
      
      // Создаем объект Floor и добавляем в группу
      const floor = new Floor(floorMesh);
      floor.outline = floorOutline;
      group.add(floorMesh);
      
      // Создаем комнату
      const room = new Room(group, walls, floor);
      room.width = data.width;
      room.height = data.height;
      room.wallHeight = data.wallHeight;
      
      // Добавляем комнату в сцену
      scene.add(group);
      
      // Восстанавливаем объекты на стенах
      data.wallObjects.forEach((objData: any) => {
        if (objData.wallIndex >= 0 && objData.wallIndex < walls.length) {
          const wall = walls[objData.wallIndex];
          
          if (objData.type === 'socket') {
            // Создаем розетку
            const socket = room.addSocket(wall, objData.position);
            
            // Устанавливаем свойства розетки
            socket.setName(objData.name || 'Розетка');
            if (objData.deviceType) {
              socket.setDeviceType(objData.deviceType);
            }
            socket.setPowerConsumption(objData.powerConsumption || 0);
            
            // Устанавливаем состояние вкл/выкл
            if (objData.isOn) {
              socket.turnOn();
            } else {
              socket.turnOff();
            }
          } else if (objData.type === 'door') {
            // Создаем дверь
            room.addDoor(wall, objData.position);
          }
        }
      });
      
      return room;
    } catch (error) {
      console.error('Ошибка при восстановлении комнаты из JSON:', error);
      return null;
    }
  }

  // Добавляем новый вспомогательный метод для безопасного обновления контура
  private updateOutline(mesh: THREE.Mesh, existingOutline: THREE.LineSegments | null): THREE.LineSegments {
    // Полностью удаляем старый контур, если он существует
    if (existingOutline) {
      // Удаляем контур из сетки
      if (mesh.children.includes(existingOutline)) {
        mesh.remove(existingOutline);
      }
      
      // Освобождаем ресурсы
      if (existingOutline.geometry) {
        existingOutline.geometry.dispose();
      }
      
      if (existingOutline.material) {
        if (Array.isArray(existingOutline.material)) {
          existingOutline.material.forEach(mat => mat.dispose());
        } else {
          existingOutline.material.dispose();
        }
      }
    }
    
    // Перестраховка: удаляем все возможные контуры, которые могли быть добавлены ранее
    // и остаться в дочерних элементах
    mesh.children.forEach(child => {
      if (child instanceof THREE.LineSegments) {
        // Дополнительно проверяем, является ли это контуром
        if (child.geometry instanceof THREE.EdgesGeometry) {
          mesh.remove(child);
          child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      }
    });
    
    // Создаем новый контур
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const outline = new THREE.LineSegments(
      edges, 
      new THREE.LineBasicMaterial({ color: 0x111111 })
    );
    
    // Добавляем новый контур к сетке
    mesh.add(outline);
    
    return outline;
  }
} 