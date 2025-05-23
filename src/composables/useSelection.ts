import { ref, computed } from 'vue'
import * as THREE from 'three'
import { SelectionManager } from '../core/managers/SelectionManager'
import type { WallObject } from '../core/objects/WallObject'
import type { Socket } from '../core/objects/Socket'
import type { WallObjectType } from '../core/objects/WallObject'

export function useSelection(selectionManager: SelectionManager) {
  const isSelectMode = ref(false)
  const selectedObjectsCount = ref(0)
  
  // Инициализируем объект с свойствами выделенной розетки
  const selectedSocketProperties = ref({
    name: '',
    deviceType: 0, // Будет установлено из SocketDeviceType
    isOn: false,
    powerConsumption: 0
  })
  
  // Включение/выключение режима выделения
  const setSelectMode = (value: boolean) => {
    isSelectMode.value = value
    
    if (!value) {
      // При выходе из режима выделения сбрасываем все выделения
      selectionManager.clear()
      updateSelectedObjectsCount()
    }
  }
  
  // Обновляем счетчик выделенных объектов
  const updateSelectedObjectsCount = () => {
    selectedObjectsCount.value = selectionManager.selectedObjects.length
    
    // Обновляем информацию о выделенной розетке
    updateSelectedSocketInfo()
  }
  
  // Получить количество выделенных объектов по типу
  const getSelectedTypeCount = (type: WallObjectType) => {
    return selectionManager.selectedObjects.filter(obj => obj.getType() === type).length
  }
  
  // Удалить выделенные объекты из комнат
  const deleteSelectedObjects = (rooms: any[]) => {
    // Проверяем, что есть выделенные объекты
    if (selectedObjectsCount.value === 0) return
    
    const selectedObjects = [...selectionManager.selectedObjects] // Создаем копию массива
    selectedObjects.forEach(obj => {
      const room = rooms.find(room => room.getWallObjects().includes(obj))
      if (room) {
        room.removeWallObject(obj)
      }
    })
    
    // Очищаем выделение и обновляем счетчик
    selectionManager.clear()
    updateSelectedObjectsCount()
  }
  
  // Обработчик клика в режиме выделения
  const handleSelectionModeClick = (
    event: MouseEvent, 
    mouse: THREE.Vector2,
    camera: THREE.PerspectiveCamera,
    raycaster: THREE.Raycaster,
    container: HTMLElement | null,
    allWallObjects: WallObject[]
  ) => {
    if (!isSelectMode.value) return
    
    let foundWallObject: WallObject | null = null
    const selectionMethod = 'boundingBox' // Можно сделать настраиваемым
    
    if (selectionMethod === 'raycast') {
      foundWallObject = selectionManager.selectObjectByRaycast(
        mouse, 
        camera, 
        selectionManager.getAllWallObjectGroups(), 
        raycaster
      )
    } else if (selectionMethod === 'boundingBox') {
      foundWallObject = selectionManager.selectObjectByBoundingBox(
        event, 
        camera, 
        allWallObjects, 
        container
      )
    }
    
    if (foundWallObject) {
      if (foundWallObject.isSelected) {
        selectionManager.deselect(foundWallObject)
      } else {
        selectionManager.select(foundWallObject)
      }
      updateSelectedObjectsCount()
    } else {
      selectionManager.clear()
      updateSelectedObjectsCount()
    }
  }
  
  // Обработчик наведения в режиме выделения
  const handleSelectionModeHover = (
    event: MouseEvent, 
    mouse: THREE.Vector2,
    camera: THREE.PerspectiveCamera,
    raycaster: THREE.Raycaster,
    container: HTMLElement | null,
    allWallObjects: WallObject[]
  ) => {
    if (!isSelectMode.value) return
    
    let found: WallObject | null = null
    const selectionMethod = 'boundingBox' // Можно сделать настраиваемым
    
    if (selectionMethod === 'raycast') {
      found = selectionManager.selectObjectByRaycast(
        mouse, 
        camera, 
        selectionManager.getAllWallObjectGroups(), 
        raycaster
      )
    } else if (selectionMethod === 'boundingBox') {
      found = selectionManager.selectObjectByBoundingBox(
        event, 
        camera, 
        allWallObjects, 
        container
      )
    }
    
    if (found) {
      selectionManager.hover(found)
    } else {
      selectionManager.unhoverCurrent()
    }
  }
  
  // Функция для получения выделенной розетки
  const getSelectedSocket = (): Socket | null => {
    const selectedObjects = selectionManager.selectedObjects
    if (selectedObjects.length !== 1) return null
    
    const obj = selectedObjects[0]
    if (obj.getType() !== 'socket') return null
    
    return obj as Socket
  }
  
  // Обновить информацию о выделенной розетке
  const updateSelectedSocketInfo = () => {
    const socket = getSelectedSocket()
    if (!socket) return
    
    selectedSocketProperties.value.name = socket.getName()
    selectedSocketProperties.value.deviceType = socket.getDeviceType()
    selectedSocketProperties.value.isOn = socket.getIsOn()
    selectedSocketProperties.value.powerConsumption = socket.getPowerConsumption()
  }
  
  // Обновить имя розетки
  const updateSocketName = () => {
    const socket = getSelectedSocket()
    if (!socket) return
    
    socket.setName(selectedSocketProperties.value.name)
  }
  
  // Обновить тип устройства розетки
  const updateSocketType = () => {
    const socket = getSelectedSocket()
    if (!socket) return
    
    socket.setDeviceType(selectedSocketProperties.value.deviceType)
  }
  
  // Переключить питание розетки
  const toggleSocketPower = () => {
    const socket = getSelectedSocket()
    if (!socket) return
    
    if (selectedSocketProperties.value.isOn) {
      socket.turnOn()
    } else {
      socket.turnOff()
    }
  }
  
  // Обновить потребление энергии
  const updateSocketPowerConsumption = () => {
    const socket = getSelectedSocket()
    if (!socket) return
    
    socket.setPowerConsumption(selectedSocketProperties.value.powerConsumption)
  }
  
  // Вычисляем, есть ли выделенная розетка
  const hasSelectedSocket = computed(() => {
    return getSelectedSocket() !== null
  })
  
  return {
    isSelectMode,
    selectedObjectsCount,
    selectedSocketProperties,
    setSelectMode,
    updateSelectedObjectsCount,
    getSelectedTypeCount,
    deleteSelectedObjects,
    handleSelectionModeClick,
    handleSelectionModeHover,
    getSelectedSocket,
    updateSocketName,
    updateSocketType,
    toggleSocketPower,
    updateSocketPowerConsumption,
    hasSelectedSocket
  }
} 