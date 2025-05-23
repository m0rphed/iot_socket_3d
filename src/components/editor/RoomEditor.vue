<template>
  <div class="room-editor">
    <!-- Основной 3D редактор -->
    <ThreeCanvas
      ref="threeCanvas"
      :debugMode="debugMode"
      :wallHeight="wallHeight"
      :isCreatingRoom="isCreatingRoom"
      :isSelectMode="isSelectMode"
      :objectType="selectedObjectType"
      @room-created="handleRoomCreated"
      @room-selected="handleRoomSelected"
      @selection-changed="handleSelectionChanged"
      @mouse-event="handleMouseEvent"
      @set-cursor="handleSetCursor"
      @room-creation-finished="handleRoomCreationFinished"
      @update:roomStartPoint="updateRoomStartPoint"
      @object-added="handleObjectAdded"
    />
    
    <!-- Панель управления -->
    <EditorControls
      :currentMode="currentMode"
      :wallHeight="wallHeight"
      :isCreatingRoom="isCreatingRoom"
      :roomStartPoint="roomStartPoint"
      :isSelectMode="isSelectMode"
      :selectedObjectType="selectedObjectType"
      :selectedObjectsCount="selectedObjectsCount"
      :debugMode="debugMode"
      :showIoTDashboard="showIoTDashboard"
      :showSaveMenu="showSaveMenu"
      :showLoadMenu="showLoadMenu"
      @set-mode="setMode"
      @update-wall-height="updateWallHeight"
      @start-room-creation="startRoomCreation"
      @cancel-room-creation="cancelRoomCreation"
      @set-select-mode="setSelectMode"
      @set-object-type="setObjectType"
      @delete-selected-objects="deleteSelectedObjects"
      @toggle-debug="toggleDebug"
      @toggle-iot-dashboard="toggleIoTDashboard"
      @toggle-save-menu="toggleSaveMenu"
      @toggle-load-menu="toggleLoadMenu"
    />
    
    <!-- Панель выделенных объектов -->
    <SelectionPanel
      v-if="currentMode === 'object' && isSelectMode && selectedObjectsCount > 0"
      :selectedObjectsCount="selectedObjectsCount"
      :selectedSocketProperties="selectedSocketProperties"
      :getSelectedTypeCount="getSelectedTypeCount"
      @update-socket-name="updateSocketName"
      @update-socket-type="updateSocketType"
      @toggle-socket-power="toggleSocketPower"
      @update-socket-power-consumption="updateSocketPowerConsumption"
    />
    
    <!-- IoT Дашборд -->
    <IoTDashboard
      v-if="showIoTDashboard"
      ref="iotDashboardRef"
      :rooms="rooms"
      @close="showIoTDashboard = false"
    />
    
    <!-- Меню сохранения/загрузки -->
    <SaveLoadMenu
      v-if="showSaveMenu || showLoadMenu"
      :showSaveMenu="showSaveMenu"
      :showLoadMenu="showLoadMenu"
      :saveProjectName="saveProjectName"
      :savedProjects="savedProjects"
      :rooms="rooms"
      @toggle-save-menu="toggleSaveMenu"
      @toggle-load-menu="toggleLoadMenu"
      @update:saveProjectName="saveProjectName = $event"
      @load-project="loadProject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'
import { Room as RoomClass } from '../../core/objects/Room'
import type { WallObjectType } from '../../core/objects/WallObject'
import { useRoomCreation } from '../../composables/useRoomCreation'
import { useSelection } from '../../composables/useSelection'
import { useObjectPlacement } from '../../composables/useObjectPlacement'
import { useIoTDashboard } from '../../composables/useIoTDashboard'
import { useSaveLoad } from '../../composables/useSaveLoad'
import { SocketDeviceType } from '../../core/objects/Socket'

// Импорт компонентов
import ThreeCanvas from './ThreeCanvas.vue'
import EditorControls from './controls/EditorControls.vue'
import SelectionPanel from './panels/SelectionPanel.vue'
import IoTDashboard from './panels/IoTDashboard.vue'
import SaveLoadMenu from './modals/SaveLoadMenu.vue'

// Ссылка на ThreeCanvas для доступа к его методам
const threeCanvas = ref<InstanceType<typeof ThreeCanvas> | null>(null)
// Ссылка на IoT дашборд
const iotDashboardRef = ref<InstanceType<typeof IoTDashboard> | null>(null)

// Состояние редактора
const currentMode = ref<'room' | 'object'>('room')
const wallHeight = ref(2.5)
const debugMode = ref(false)

// Вычисляем комнаты из ThreeCanvas
const rooms = computed(() => threeCanvas.value?.rooms.value || [])

// Рефы для хранения состояний из composables
const isCreatingRoom = ref(false)
const roomStartPoint = ref<THREE.Vector3 | null>(null)
const isSelectMode = ref(false)
const selectedObjectsCount = ref(0)
const selectedSocketProperties = ref({
  name: '',
  deviceType: SocketDeviceType.POWER,
  isOn: false,
  powerConsumption: 0
})
const selectedObjectType = ref<WallObjectType>('socket')
const showIoTDashboard = ref(false)
const showSaveMenu = ref(false)
const showLoadMenu = ref(false)
const saveProjectName = ref('Мой проект')
const savedProjects = ref<{ name: string, date: number }[]>([])

// Переменные для хранения composables
let roomCreation: ReturnType<typeof useRoomCreation> | null = null
let selection: ReturnType<typeof useSelection> | null = null
let objectPlacement: ReturnType<typeof useObjectPlacement> | null = null
let iotDashboard: ReturnType<typeof useIoTDashboard> | null = null
let saveLoad: ReturnType<typeof useSaveLoad> | null = null

// Инициализация composables после монтирования компонента
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  
  // Даем время на инициализацию ThreeCanvas
  setTimeout(() => {
    if (!threeCanvas.value) {
      console.error('ThreeCanvas не инициализирован')
      return
    }
    
    // Получаем доступ к необходимым объектам через метод getSceneObjects
    const sceneObjects = threeCanvas.value.getSceneObjects()
    
    if (!sceneObjects || !sceneObjects.scene || !sceneObjects.raycaster || 
        !sceneObjects.camera || !sceneObjects.sceneManager || !sceneObjects.selectionManager) {
      console.error('Не удалось получить объекты сцены')
      return
    }
    
    // Инициализация composables с реальными объектами
    roomCreation = useRoomCreation(
      sceneObjects.scene, 
      sceneObjects.raycaster, 
      sceneObjects.camera
    )
    
    selection = useSelection(sceneObjects.selectionManager)
    
    objectPlacement = useObjectPlacement(
      sceneObjects.sceneManager, 
      sceneObjects.raycaster, 
      sceneObjects.camera
    )
    
    iotDashboard = useIoTDashboard()
    saveLoad = useSaveLoad(sceneObjects.scene)
    
    // Связываем состояния с рефами
    isCreatingRoom.value = roomCreation.isCreatingRoom.value
    roomStartPoint.value = roomCreation.roomStartPoint.value
    isSelectMode.value = selection.isSelectMode.value
    selectedObjectsCount.value = selection.selectedObjectsCount.value
    
    // Для типизированного свойства используем преобразование через unknown
    const socketProps = selection.selectedSocketProperties.value as unknown as {
      name: string,
      deviceType: SocketDeviceType,
      isOn: boolean,
      powerConsumption: number
    }
    
    selectedSocketProperties.value = socketProps
    selectedObjectType.value = objectPlacement.selectedObjectType.value
    showIoTDashboard.value = iotDashboard.showIoTDashboard.value
    showSaveMenu.value = saveLoad.showSaveMenu.value
    showLoadMenu.value = saveLoad.showLoadMenu.value
    saveProjectName.value = saveLoad.saveProjectName.value
    savedProjects.value = saveLoad.savedProjects.value
    
    // Слушаем изменения состояний с двусторонней синхронизацией
    watch(() => roomCreation!.isCreatingRoom.value, (val) => {
      console.log('Синхронизация isCreatingRoom из roomCreation:', val)
      isCreatingRoom.value = val
    })
    
    watch(() => isCreatingRoom.value, (val) => {
      if (roomCreation && roomCreation.isCreatingRoom.value !== val) {
        console.log('Синхронизация isCreatingRoom в roomCreation:', val)
        if (val) {
          roomCreation.startRoomCreation()
        } else {
          roomCreation.cancelRoomCreation()
        }
      }
    })
    
    watch(() => roomCreation!.roomStartPoint.value, (val) => {
      console.log('Синхронизация roomStartPoint из roomCreation:', val)
      roomStartPoint.value = val
    })
    
    watch(() => selection!.isSelectMode.value, (val) => {
      console.log('Синхронизация isSelectMode из selection:', val)
      isSelectMode.value = val
    })
    
    watch(() => isSelectMode.value, (val) => {
      if (selection && selection.isSelectMode.value !== val) {
        console.log('Синхронизация isSelectMode в selection:', val)
        selection.setSelectMode(val)
      }
    })
    
    watch(() => selection!.selectedObjectsCount.value, (val) => {
      console.log('Синхронизация selectedObjectsCount из selection:', val)
      selectedObjectsCount.value = val
    })
    
    // Для наблюдения за типизированными свойствами используем преобразование через unknown
    watch(() => selection!.selectedSocketProperties.value, (val) => {
      console.log('Синхронизация selectedSocketProperties из selection')
      const socketProps = val as unknown as {
        name: string,
        deviceType: SocketDeviceType,
        isOn: boolean,
        powerConsumption: number
      }
      selectedSocketProperties.value = socketProps
    })
    
    watch(() => objectPlacement!.selectedObjectType.value, (val) => {
      console.log('Синхронизация selectedObjectType из objectPlacement:', val)
      selectedObjectType.value = val
    })
    
    watch(() => selectedObjectType.value, (val) => {
      if (objectPlacement && objectPlacement.selectedObjectType.value !== val) {
        console.log('Синхронизация selectedObjectType в objectPlacement:', val)
        objectPlacement.setObjectType(val)
      }
    })
    
    watch(() => iotDashboard!.showIoTDashboard.value, (val) => {
      console.log('Синхронизация showIoTDashboard из iotDashboard:', val)
      showIoTDashboard.value = val
    })
    
    watch(() => showIoTDashboard.value, (val) => {
      if (iotDashboard && iotDashboard.showIoTDashboard.value !== val) {
        console.log('Синхронизация showIoTDashboard в iotDashboard:', val)
        iotDashboard.showIoTDashboard.value = val
      }
    })
    
    watch(() => saveLoad!.showSaveMenu.value, (val) => {
      console.log('Синхронизация showSaveMenu из saveLoad:', val)
      showSaveMenu.value = val
    })
    
    watch(() => showSaveMenu.value, (val) => {
      if (saveLoad && saveLoad.showSaveMenu.value !== val) {
        console.log('Синхронизация showSaveMenu в saveLoad:', val)
        saveLoad.showSaveMenu.value = val
      }
    })
    
    watch(() => saveLoad!.showLoadMenu.value, (val) => {
      console.log('Синхронизация showLoadMenu из saveLoad:', val)
      showLoadMenu.value = val
    })
    
    watch(() => showLoadMenu.value, (val) => {
      if (saveLoad && saveLoad.showLoadMenu.value !== val) {
        console.log('Синхронизация showLoadMenu в saveLoad:', val)
        saveLoad.showLoadMenu.value = val
      }
    })
    
    watch(() => saveLoad!.saveProjectName.value, (val) => {
      console.log('Синхронизация saveProjectName из saveLoad:', val)
      saveProjectName.value = val
    })
    
    watch(() => saveProjectName.value, (val) => {
      if (saveLoad && saveLoad.saveProjectName.value !== val) {
        console.log('Синхронизация saveProjectName в saveLoad:', val)
        saveLoad.saveProjectName.value = val
      }
    })
    
    watch(() => saveLoad!.savedProjects.value, (val) => {
      console.log('Синхронизация savedProjects из saveLoad')
      savedProjects.value = val
    })
    
    console.log('Composables успешно инициализированы')
  }, 1000) // Увеличиваем задержку для уверенности
})

// Методы для управления режимами
const setMode = (mode: 'room' | 'object') => {
  // Если меняется режим, сбрасываем выделение
  if (currentMode.value !== mode) {
    console.log('Переключение режима с', currentMode.value, 'на', mode)
    
    if (selection && selection.setSelectMode) {
      selection.setSelectMode(false)
      isSelectMode.value = false // Явно сбрасываем режим выделения
    }
    
    // Сбрасываем режим создания комнаты
    if (isCreatingRoom.value && roomCreation) {
      cancelRoomCreation()
    }
    
    // Сбрасываем состояние, связанное с объектами
    if (mode === 'room' && objectPlacement) {
      objectPlacement.selectedObjectType.value = 'socket'
      selectedObjectType.value = 'socket'
      
      // При переходе в режим комнат удаляем призрачный объект
      if (threeCanvas.value) {
        const sceneObjects = threeCanvas.value.getSceneObjects()
        if (sceneObjects && sceneObjects.sceneManager) {
          console.log('Удаляем ghost-объект при переходе в режим комнат')
          sceneObjects.sceneManager.removeGhostObject()
        }
      }
    }
  }
  
  currentMode.value = mode
}

// Обработчики событий из ThreeCanvas
const handleRoomCreated = (room: RoomClass) => {
  console.log('Room created:', room)
  // Обновляем компоненты, которые могут зависеть от комнат
  if (iotDashboard) {
    console.log('Обновляем IoT dashboard после создания комнаты')
    showIoTDashboard.value = true // Показываем дашборд при создании комнаты
    setTimeout(() => {
      showIoTDashboard.value = false // Скрываем через небольшой промежуток
    }, 1000)
  }
}

const handleRoomSelected = (room: RoomClass | null) => {
  console.log('Room selected:', room)
}

const handleSelectionChanged = (count: number) => {
  selectedObjectsCount.value = count
}

const handleMouseEvent = (event: {type: string, mouse: THREE.Vector2, event: MouseEvent}) => {
  // Можно добавить дополнительную обработку событий мыши, если нужно
}

const handleSetCursor = (style: string) => {
  if (threeCanvas.value && threeCanvas.value.$el) {
    (threeCanvas.value.$el as HTMLElement).style.cursor = style
  }
}

const handleRoomCreationFinished = () => {
  // Сбрасываем режим создания комнаты, не меняя общий режим редактора
  console.log('Получен сигнал о завершении создания комнаты')
  if (isCreatingRoom.value && roomCreation) {
    console.log('Сбрасываем режим создания комнаты, но остаемся в режиме комнат')
    cancelRoomCreation()
    // Важно: не переключаем currentMode здесь, чтобы остаться в режиме комнат
    console.log('Текущий режим после создания комнаты:', currentMode.value)
  }
}

const updateRoomStartPoint = (point: THREE.Vector3 | null) => {
  console.log('RoomEditor: обновление начальной точки комнаты:', point)
  roomStartPoint.value = point
}

// Методы для панели управления
const updateWallHeight = (height: number) => {
  console.log('Обновляем высоту стен:', height, typeof height)
  // Принудительно преобразуем к числу
  const numHeight = Number(height)
  wallHeight.value = numHeight
  rooms.value.forEach((room: any) => room.setWallHeight(numHeight))
}

const startRoomCreation = () => {
  if (!roomCreation) {
    console.error('roomCreation не инициализирован')
    return
  }
  
  console.log('Начинаем создание комнаты')
  const result = roomCreation.startRoomCreation()
  isCreatingRoom.value = true // Важно: явно устанавливаем состояние
  console.log('Результат начала создания комнаты:', result)
  
  if (result.cursorStyle && threeCanvas.value && threeCanvas.value.$el) {
    (threeCanvas.value.$el as HTMLElement).style.cursor = result.cursorStyle
    console.log('Курсор изменен на:', result.cursorStyle)
  }
}

const cancelRoomCreation = () => {
  if (!roomCreation) return
  const result = roomCreation.cancelRoomCreation()
  isCreatingRoom.value = false // Важно: явно устанавливаем состояние
  if (result.cursorStyle && threeCanvas.value && threeCanvas.value.$el) {
    (threeCanvas.value.$el as HTMLElement).style.cursor = result.cursorStyle
  }
}

const setSelectMode = (value: boolean) => {
  if (!selection) return
  console.log('Устанавливаем режим выделения:', value)
  selection.setSelectMode(value)
  isSelectMode.value = value // Явно устанавливаем в локальном состоянии
}

const setObjectType = (type: WallObjectType) => {
  if (!objectPlacement) return
  console.log('Устанавливаем тип объекта:', type)
  objectPlacement.setObjectType(type)
  selectedObjectType.value = type // Явно устанавливаем в локальном состоянии
}

const deleteSelectedObjects = () => {
  if (!selection) return
  console.log('Удаляем выделенные объекты, количество:', selectedObjectsCount.value)
  selection.deleteSelectedObjects(rooms.value)
  // Обновляем состояние после удаления
  selectedObjectsCount.value = 0
}

const toggleDebug = () => {
  debugMode.value = !debugMode.value
}

const toggleIoTDashboard = () => {
  if (!iotDashboard) return
  console.log('Переключаем видимость IoT дашборда')
  // Устанавливаем состояние явно в обоих местах
  iotDashboard.showIoTDashboard.value = !iotDashboard.showIoTDashboard.value
  showIoTDashboard.value = iotDashboard.showIoTDashboard.value
}

const toggleSaveMenu = () => {
  if (!saveLoad) return
  console.log('Переключаем видимость меню сохранения')
  saveLoad.toggleSaveMenu()
  // Обновляем локальное состояние
  showSaveMenu.value = saveLoad.showSaveMenu.value
  // Если открываем меню сохранения, закрываем меню загрузки
  if (showSaveMenu.value && showLoadMenu.value) {
    showLoadMenu.value = false
    saveLoad.showLoadMenu.value = false
  }
}

const toggleLoadMenu = () => {
  if (!saveLoad) return
  console.log('Переключаем видимость меню загрузки')
  saveLoad.toggleLoadMenu()
  // Обновляем локальное состояние
  showLoadMenu.value = saveLoad.showLoadMenu.value
  // Если открываем меню загрузки, закрываем меню сохранения
  if (showLoadMenu.value && showSaveMenu.value) {
    showSaveMenu.value = false
    saveLoad.showSaveMenu.value = false
  }
}

// Методы для обновления свойств выделенных объектов
const getSelectedTypeCount = (type: string) => {
  if (!selection) return 0
  console.log('Получаем количество выделенных объектов типа:', type)
  return selection.getSelectedTypeCount(type as WallObjectType)
}

const updateSocketName = () => {
  if (!selection) return
  console.log('Обновляем имя розетки')
  selection.updateSocketName()
  // Обновляем локальное состояние после изменения
  selectedSocketProperties.value = {
    ...selection.selectedSocketProperties.value as any
  }
}

const updateSocketType = () => {
  if (!selection) return
  console.log('Обновляем тип розетки')
  selection.updateSocketType()
  // Обновляем локальное состояние после изменения
  selectedSocketProperties.value = {
    ...selection.selectedSocketProperties.value as any
  }
}

const toggleSocketPower = () => {
  if (!selection) return
  console.log('Переключаем питание розетки')
  selection.toggleSocketPower()
  // Обновляем локальное состояние после изменения
  selectedSocketProperties.value = {
    ...selection.selectedSocketProperties.value as any
  }
}

const updateSocketPowerConsumption = () => {
  if (!selection) return
  console.log('Обновляем потребление энергии розетки')
  selection.updateSocketPowerConsumption()
  // Обновляем локальное состояние после изменения
  selectedSocketProperties.value = {
    ...selection.selectedSocketProperties.value as any
  }
}

// Методы для работы с проектами
const loadProject = (roomsData: any[]) => {
  // Очищаем текущую сцену
  if (threeCanvas.value) {
    threeCanvas.value.clearScene()
    
    // Загружаем новые комнаты
    roomsData.forEach(roomData => {
      threeCanvas.value?.createRoomFromData(roomData)
    })
  }
}

// Слушаем нажатия клавиш
const onKeyDown = (event: KeyboardEvent) => {
  // Отмена создания комнаты по Escape
  if (event.key === 'Escape' && isCreatingRoom.value && roomCreation) {
    cancelRoomCreation()
  }
}

const handleObjectAdded = (type: WallObjectType) => {
  console.log('Объект добавлен:', type)
  
  // Если добавлена розетка, показываем IoT дашборд
  if (type === 'socket' && iotDashboard) {
    console.log('Обновляем IoT dashboard после добавления розетки')
    // Активируем IoT дашборд на короткое время
    showIoTDashboard.value = true
    
    // Обновляем информацию в дашборде
    setTimeout(() => {
      if (iotDashboardRef.value) {
        console.log('Принудительно обновляем данные в IoT дашборде')
      }
      
      // Скрываем дашборд через небольшой промежуток времени
      setTimeout(() => {
        showIoTDashboard.value = false
      }, 1500)
    }, 100)
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.room-editor {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
  display: block;
}
</style> 