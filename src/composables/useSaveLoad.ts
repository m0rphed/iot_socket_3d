import { ref } from 'vue'
import type { RoomClass } from '../core/objects/Room'

export function useSaveLoad(scene: THREE.Scene) {
  const showSaveMenu = ref(false)
  const showLoadMenu = ref(false)
  const saveProjectName = ref('Мой проект')
  const savedProjects = ref<{ name: string, date: number }[]>([])
  const importFileInput = ref<HTMLInputElement | null>(null)
  
  // Переключение меню сохранения
  const toggleSaveMenu = () => {
    showSaveMenu.value = !showSaveMenu.value
    if (showSaveMenu.value) {
      showLoadMenu.value = false
    }
  }
  
  // Переключение меню загрузки
  const toggleLoadMenu = () => {
    showLoadMenu.value = !showLoadMenu.value
    if (showLoadMenu.value) {
      showSaveMenu.value = false
      loadSavedProjectsList()
    }
  }
  
  // Загрузка списка сохраненных проектов
  const loadSavedProjectsList = () => {
    const projects = []
    
    // Перебираем все ключи в localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith('roomEditor_')) {
        try {
          const projectData = JSON.parse(localStorage.getItem(key) || '{}')
          projects.push({
            name: projectData.name,
            date: projectData.date
          })
        } catch (error) {
          console.error('Ошибка при парсинге сохраненного проекта:', error)
        }
      }
    }
    
    // Сортируем проекты по дате (сначала новые)
    projects.sort((a, b) => b.date - a.date)
    
    savedProjects.value = projects
  }
  
  // Сохранение проекта в localStorage
  const saveToLocalStorage = (rooms: RoomClass[]) => {
    if (!saveProjectName.value.trim()) {
      alert('Пожалуйста, введите название проекта')
      return
    }
    
    try {
      // Сериализуем все комнаты
      const roomsData = rooms.map(room => room.toJSON())
      
      // Создаем объект с данными проекта
      const projectData = {
        name: saveProjectName.value,
        date: Date.now(),
        rooms: roomsData
      }
      
      // Сохраняем в localStorage
      localStorage.setItem(`roomEditor_${saveProjectName.value}`, JSON.stringify(projectData))
      
      alert('Проект успешно сохранен')
      showSaveMenu.value = false
    } catch (error) {
      console.error('Ошибка при сохранении проекта:', error)
      alert('Произошла ошибка при сохранении проекта')
    }
  }
  
  // Экспорт проекта в файл
  const exportToFile = (rooms: RoomClass[]) => {
    if (!saveProjectName.value.trim()) {
      alert('Пожалуйста, введите название проекта')
      return
    }
    
    try {
      // Сериализуем все комнаты
      const roomsData = rooms.map(room => room.toJSON())
      
      // Создаем объект с данными проекта
      const projectData = {
        name: saveProjectName.value,
        date: Date.now(),
        rooms: roomsData
      }
      
      // Создаем ссылку для скачивания
      const dataStr = JSON.stringify(projectData, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
      
      const exportName = `${saveProjectName.value.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportName)
      linkElement.click()
      
      showSaveMenu.value = false
    } catch (error) {
      console.error('Ошибка при экспорте проекта:', error)
      alert('Произошла ошибка при экспорте проекта')
    }
  }
  
  // Функция для загрузки проекта из localStorage
  const loadFromLocalStorage = (
    projectName: string, 
    handleLoadedRooms: (rooms: RoomClass[]) => void
  ) => {
    try {
      const projectKey = `roomEditor_${projectName}`
      const projectDataJson = localStorage.getItem(projectKey)
      
      if (!projectDataJson) {
        alert('Проект не найден')
        return
      }
      
      const projectData = JSON.parse(projectDataJson)
      const roomsToLoad: any[] = []
      
      // Загружаем комнаты через импортированную функцию создания комнат
      projectData.rooms.forEach((roomData: any) => {
        // Поскольку нам нужен класс Room, который мы импортируем через параметр,
        // мы просто передаем данные наружу
        roomsToLoad.push(roomData)
      })
      
      handleLoadedRooms(roomsToLoad)
      showLoadMenu.value = false
      alert('Проект успешно загружен')
    } catch (error) {
      console.error('Ошибка при загрузке проекта:', error)
      alert('Произошла ошибка при загрузке проекта')
    }
  }
  
  // Функция для удаления проекта из localStorage
  const deleteFromLocalStorage = (projectName: string) => {
    if (confirm(`Вы уверены, что хотите удалить проект "${projectName}"?`)) {
      localStorage.removeItem(`roomEditor_${projectName}`)
      loadSavedProjectsList()
    }
  }
  
  // Функция для активации выбора файла
  const triggerFileInput = () => {
    if (importFileInput.value) {
      importFileInput.value.click()
    }
  }
  
  // Функция для обработки импорта из файла
  const handleFileImport = (
    event: Event, 
    handleLoadedRooms: (rooms: RoomClass[]) => void
  ) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    
    if (!file) return
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result === 'string') {
          const projectData = JSON.parse(result)
          handleLoadedRooms(projectData.rooms)
          
          showLoadMenu.value = false
          alert('Проект успешно импортирован')
        }
      } catch (error) {
        console.error('Ошибка при импорте проекта:', error)
        alert('Произошла ошибка при импорте проекта. Проверьте формат файла.')
      }
      
      // Сбрасываем значение input, чтобы можно было загрузить тот же файл повторно
      if (importFileInput.value) {
        importFileInput.value.value = ''
      }
    }
    
    reader.readAsText(file)
  }
  
  // Функция для форматирования даты
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
  
  return {
    showSaveMenu,
    showLoadMenu,
    saveProjectName,
    savedProjects,
    importFileInput,
    toggleSaveMenu,
    toggleLoadMenu,
    loadSavedProjectsList,
    saveToLocalStorage,
    exportToFile,
    loadFromLocalStorage,
    deleteFromLocalStorage,
    triggerFileInput,
    handleFileImport,
    formatDate
  }
} 