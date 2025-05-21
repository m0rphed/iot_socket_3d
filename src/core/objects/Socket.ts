import { WallObject } from './WallObject'
import { Wall } from './Wall'
import * as THREE from 'three'
import { SOCKET_PARAMS, WALL_PARAMS } from '../../params/config'

// Типы устройств для розеток
export enum SocketDeviceType {
  POWER = 'power',
  LIGHT = 'light',
  CLIMATE = 'climate',
  SECURITY = 'security',
  MEDIA = 'media'
}

export class Socket extends WallObject {
  private isOn: boolean = false;
  private name: string = 'Розетка';
  private deviceType: SocketDeviceType = SocketDeviceType.POWER;
  private powerConsumption: number = 0; // Потребление энергии в ваттах
  private innerLight: THREE.PointLight | null = null;
  depth: number
  
  constructor(wall: Wall, position: number = 0.5, isGhost: boolean = false, socketDepth?: number) {
    // Вычисление zOffset для розетки
    const zOffset = Socket.calculateZOffset(wall, socketDepth || SOCKET_PARAMS.depth);
    // Стандартная высота розетки от пола
    const height = SOCKET_PARAMS.height;
    super('socket', wall, position, height, isGhost, zOffset);
    this.depth = socketDepth || SOCKET_PARAMS.depth;
    
    // Добавляем свет внутри розетки для индикации состояния
    this.innerLight = new THREE.PointLight(0x00ff00, 0, 0.5); // Изначально выключен (интенсивность 0)
    this.innerLight.position.set(0, 0, 0.05);
    this.getMesh().add(this.innerLight);
    
    // Генерируем случайное имя для розетки если это не ghost
    if (!isGhost) {
      this.name = `Розетка ${Math.floor(Math.random() * 1000)}`;
    }
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

  // Включить розетку
  public turnOn(): void {
    this.isOn = true;
    if (this.innerLight) {
      this.innerLight.intensity = 1;
    }
    this.updateAppearance();
  }
  
  // Выключить розетку
  public turnOff(): void {
    this.isOn = false;
    if (this.innerLight) {
      this.innerLight.intensity = 0;
    }
    this.updateAppearance();
  }
  
  // Переключить состояние
  public toggle(): void {
    if (this.isOn) {
      this.turnOff();
    } else {
      this.turnOn();
    }
  }
  
  // Установить имя
  public setName(name: string): void {
    this.name = name;
  }
  
  // Получить имя
  public getName(): string {
    return this.name;
  }
  
  // Установить тип устройства
  public setDeviceType(type: SocketDeviceType): void {
    this.deviceType = type;
    this.updateAppearance();
  }
  
  // Получить тип устройства
  public getDeviceType(): SocketDeviceType {
    return this.deviceType;
  }
  
  // Установить потребление энергии
  public setPowerConsumption(watts: number): void {
    this.powerConsumption = watts;
  }
  
  // Получить потребление энергии
  public getPowerConsumption(): number {
    return this.powerConsumption;
  }
  
  // Получить состояние
  public getIsOn(): boolean {
    return this.isOn;
  }
  
  // Обновить внешний вид в зависимости от состояния и типа
  private updateAppearance(): void {
    const mesh = this.getMesh();
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      const material = mesh.material;
      
      // Цвет в зависимости от типа устройства
      if (!this.isSelected) {
        switch (this.deviceType) {
          case SocketDeviceType.POWER:
            material.color.set(SOCKET_PARAMS.color); // Стандартный
            break;
          case SocketDeviceType.LIGHT:
            material.color.set(0xffcc00); // Желтый
            break;
          case SocketDeviceType.CLIMATE:
            material.color.set(0x00ccff); // Голубой
            break;
          case SocketDeviceType.SECURITY:
            material.color.set(0xff0000); // Красный
            break;
          case SocketDeviceType.MEDIA:
            material.color.set(0x9900cc); // Фиолетовый
            break;
        }
      }
      
      // Подсветка в зависимости от состояния вкл/выкл
      if (this.innerLight) {
        // Меняем цвет подсветки в зависимости от типа устройства
        switch (this.deviceType) {
          case SocketDeviceType.POWER:
            this.innerLight.color.set(0x00ff00); // Зеленый
            break;
          case SocketDeviceType.LIGHT:
            this.innerLight.color.set(0xffcc00); // Желтый
            break;
          case SocketDeviceType.CLIMATE:
            this.innerLight.color.set(0x00ccff); // Голубой
            break;
          case SocketDeviceType.SECURITY:
            this.innerLight.color.set(0xff0000); // Красный
            break;
          case SocketDeviceType.MEDIA:
            this.innerLight.color.set(0x9900cc); // Фиолетовый
            break;
        }
      }
    }
  }
  
  // Переопределяем метод select для сохранения IoT-функциональности
  public select(): void {
    super.select();
    if (this.innerLight) {
      this.innerLight.intensity = this.isOn ? 1 : 0;
    }
  }
  
  // Переопределяем метод deselect для сохранения IoT-функциональности
  public deselect(): void {
    super.deselect();
    this.updateAppearance();
  }
} 