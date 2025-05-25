<template>
  <div class="project-gallery">
    <div class="gallery-header">
      <h2>📸 Галерея проектов</h2>
      <p>Готовые проекты планировок комнат с IoT устройствами</p>
    </div>

    <div class="gallery-container">
      <div v-if="projects.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Загрузка проектов...</p>
      </div>

      <div v-else class="slider-container">
        <!-- Навигационные стрелки -->
        <button 
          class="nav-arrow nav-arrow-left" 
          @click="previousProject"
          :disabled="currentIndex === 0"
        >
          <ChevronLeft :size="24" />
        </button>

        <button 
          class="nav-arrow nav-arrow-right" 
          @click="nextProject"
          :disabled="currentIndex === projects.length - 1"
        >
          <ChevronRight :size="24" />
        </button>

        <!-- Слайдер -->
        <div class="slider-wrapper">
          <div 
            class="slider-track" 
            :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
          >
            <div 
              v-for="(project, index) in projects" 
              :key="project.name"
              class="project-slide"
            >
              <div class="project-card">
                <div class="project-image">
                  <img 
                    :src="project.image" 
                    :alt="project.name"
                    @error="handleImageError"
                  />
                  <div class="project-overlay">
                    <button 
                      class="load-project-btn"
                      @click="loadProject(project)"
                    >
                      <Download :size="20" />
                      Загрузить проект
                    </button>
                  </div>
                </div>
                
                <div class="project-info">
                  <h3>{{ project.name }}</h3>
                  <div class="project-stats">
                    <div class="stat-item">
                      <Home :size="16" />
                      <span>{{ project.stats.rooms }} комнат</span>
                    </div>
                    <div class="stat-item">
                      <Zap :size="16" />
                      <span>{{ project.stats.devices }} устройств</span>
                    </div>
                    <div class="stat-item">
                      <Activity :size="16" />
                      <span>{{ project.stats.power }}Вт</span>
                    </div>
                  </div>
                  <p class="project-description">{{ project.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Индикаторы -->
        <div class="slider-indicators">
          <button
            v-for="(project, index) in projects"
            :key="`indicator-${index}`"
            class="indicator"
            :class="{ active: index === currentIndex }"
            @click="goToProject(index)"
          >
            <span class="sr-only">Проект {{ index + 1 }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Информация о текущем проекте -->
    <div v-if="projects.length > 0" class="current-project-info">
      <div class="project-counter">
        {{ currentIndex + 1 }} из {{ projects.length }}
      </div>
      <div class="project-title">
        {{ projects[currentIndex]?.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, Download, Home, Zap, Activity } from 'lucide-vue-next'

interface ProjectData {
  name: string
  image: string
  data: any
  description: string
  stats: {
    rooms: number
    devices: number
    power: number
  }
}

const projects = ref<ProjectData[]>([])
const currentIndex = ref(0)

// Эмиты для родительского компонента
const emit = defineEmits<{
  loadProject: [projectData: any]
}>()

// Функция для загрузки проектов из assets
const loadProjects = async () => {
  try {
    // Список проектов (можно расширить)
    const projectFiles = [
      { name: 'project1', title: 'Современная квартира', description: 'Стильная планировка с умным освещением и климат-контролем' },
      { name: 'project2', title: 'Офисное пространство', description: 'Эргономичный офис с системой безопасности и медиа-зоной' }
    ]

    const loadedProjects: ProjectData[] = []

    for (const projectFile of projectFiles) {
      try {
        // Динамический импорт JSON файла
        const jsonModule = await import(`../assets/projects/${projectFile.name}.json`)
        const projectData = jsonModule.default

        // Динамический импорт изображения
        const imageModule = await import(`../assets/projects/${projectFile.name}.png`)
        const imageSrc = imageModule.default

        // Подсчет статистики из данных проекта
        const stats = calculateProjectStats(projectData)

        loadedProjects.push({
          name: projectFile.title,
          image: imageSrc,
          data: projectData,
          description: projectFile.description,
          stats
        })
      } catch (error) {
        console.warn(`Не удалось загрузить проект ${projectFile.name}:`, error)
      }
    }

    projects.value = loadedProjects
  } catch (error) {
    console.error('Ошибка при загрузке проектов:', error)
  }
}

// Функция для подсчета статистики проекта
const calculateProjectStats = (projectData: any) => {
  let rooms = 0
  let devices = 0
  let power = 0

  if (projectData.rooms && Array.isArray(projectData.rooms)) {
    rooms = projectData.rooms.length

    projectData.rooms.forEach((room: any) => {
      if (room.wallObjects && Array.isArray(room.wallObjects)) {
        room.wallObjects.forEach((obj: any) => {
          if (obj.type === 'socket') {
            devices++
            if (obj.isOn && obj.powerConsumption) {
              power += obj.powerConsumption
            }
          }
        })
      }
    })
  }

  return { rooms, devices, power }
}

// Навигация по слайдеру
const nextProject = () => {
  if (currentIndex.value < projects.value.length - 1) {
    currentIndex.value++
  }
}

const previousProject = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const goToProject = (index: number) => {
  currentIndex.value = index
}

// Загрузка проекта
const loadProject = (project: ProjectData) => {
  emit('loadProject', project.data)
}

// Обработка ошибок загрузки изображений
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.project-gallery {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.gallery-header {
  text-align: center;
  margin-bottom: 30px;
}

.gallery-header h2 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.gallery-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.gallery-container {
  position: relative;
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #7f8c8d;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.slider-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.slider-wrapper {
  overflow: hidden;
  border-radius: 8px;
}

.slider-track {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.project-slide {
  min-width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
}

.project-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.project-image {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.project-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.project-card:hover .project-image img {
  transform: scale(1.05);
}

.project-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card:hover .project-overlay {
  opacity: 1;
}

.load-project-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s ease;
}

.load-project-btn:hover {
  background: #2980b9;
}

.project-info {
  padding: 20px;
}

.project-info h3 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.project-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.project-description {
  color: #7f8c8d;
  font-size: 0.95rem;
  line-height: 1.5;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-arrow:hover:not(:disabled) {
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.nav-arrow:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-arrow-left {
  left: 15px;
}

.nav-arrow-right {
  right: 15px;
}

.slider-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: #bdc3c7;
  cursor: pointer;
  transition: background 0.3s ease;
}

.indicator.active {
  background: #3498db;
}

.indicator:hover {
  background: #7f8c8d;
}

.indicator.active:hover {
  background: #2980b9;
}

.current-project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.project-counter {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.project-title {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1.1rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .project-gallery {
    padding: 15px;
  }
  
  .gallery-header h2 {
    font-size: 1.5rem;
  }
  
  .project-image {
    height: 200px;
  }
  
  .project-info {
    padding: 15px;
  }
  
  .project-stats {
    gap: 10px;
  }
  
  .nav-arrow {
    width: 40px;
    height: 40px;
  }
  
  .nav-arrow-left {
    left: 10px;
  }
  
  .nav-arrow-right {
    right: 10px;
  }
}

@media (max-width: 480px) {
  .project-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .current-project-info {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style> 