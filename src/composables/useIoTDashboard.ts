import { ref, computed } from 'vue'
import type { Socket } from '../core/objects/Socket'
import { SocketDeviceType } from '../core/objects/Socket'

export function useIoTDashboard() {
  const showIoTDashboard = ref(false)
  
  // Фильтры для дашборда
  const iotDashboardFilter = ref({
    deviceType: 'all',
    state: 'all'
  })
  
  // Определение типов устройств
  const socketDeviceTypes = [
    { value: SocketDeviceType.POWER, label: 'Электропитание' },
    { value: SocketDeviceType.LIGHT, label: 'Освещение' },
    { value: SocketDeviceType.CLIMATE, label: 'Климат-контроль' },
    { value: SocketDeviceType.SECURITY, label: 'Безопасность' },
    { value: SocketDeviceType.MEDIA, label: 'Медиа-устройство' }
  ]
  
  // Функция для получения всех розеток из всех комнат
  const getAllSockets = (rooms: any[]): Socket[] => {
    const sockets: Socket[] = []
    
    rooms.forEach(room => {
      const wallObjects = room.getWallObjects()
      wallObjects.forEach(obj => {
        if (obj.getType() === 'socket') {
          sockets.push(obj as Socket)
        }
      })
    })
    
    return sockets
  }
  
  // Функция для получения отфильтрованных розеток
  const getFilteredSockets = (rooms: any[]): Socket[] => {
    return getAllSockets(rooms).filter(socket => {
      // Фильтрация по типу устройства
      if (iotDashboardFilter.value.deviceType !== 'all' && 
          socket.getDeviceType().toString() !== iotDashboardFilter.value.deviceType) {
        return false
      }
      
      // Фильтрация по состоянию
      if (iotDashboardFilter.value.state === 'on' && !socket.getIsOn()) {
        return false
      }
      
      if (iotDashboardFilter.value.state === 'off' && socket.getIsOn()) {
        return false
      }
      
      return true
    })
  }
  
  // Функция для получения метки типа устройства
  const getDeviceTypeLabel = (deviceType: SocketDeviceType): string => {
    const type = socketDeviceTypes.find(t => t.value === deviceType)
    return type ? type.label : 'Неизвестно'
  }
  
  // Функция для переключения устройства из дашборда
  const toggleDeviceFromDashboard = (socket: Socket): void => {
    socket.toggle()
  }
  
  // Функция для получения общего количества розеток
  const getTotalSocketsCount = (rooms: any[]): number => {
    return getAllSockets(rooms).length
  }
  
  // Функция для получения количества активных розеток
  const getActiveSocketsCount = (rooms: any[]): number => {
    return getAllSockets(rooms).filter(socket => socket.getIsOn()).length
  }
  
  // Функция для получения общего потребления энергии
  const getTotalPowerConsumption = (rooms: any[]): number => {
    return getAllSockets(rooms)
      .filter(socket => socket.getIsOn())
      .reduce((total, socket) => total + socket.getPowerConsumption(), 0)
  }
  
  return {
    showIoTDashboard,
    iotDashboardFilter,
    socketDeviceTypes,
    getAllSockets,
    getFilteredSockets,
    getDeviceTypeLabel,
    toggleDeviceFromDashboard,
    getTotalSocketsCount,
    getActiveSocketsCount,
    getTotalPowerConsumption
  }
} 