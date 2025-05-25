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
  padding: 24px;
  width: 100%;
  height: 100%;
  background: #0f1419;
  display: flex;
  flex-direction: column;
}

.gallery-header {
  margin-bottom: 24px;
}

.gallery-header h2 {
  color: #f7fafc;
  font-size: 1.5rem;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.gallery-header p {
  color: #a0aec0;
  font-size: 0.875rem;
  font-weight: 400;
}

.gallery-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #a0aec0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2d3748;
  border-top: 3px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.slider-container {
  width: 100%;
  max-width: 800px;
  position: relative;
}

.slider-wrapper {
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.slider-track {
  display: flex;
  transition: transform 0.5s ease;
}

.project-slide {
  min-width: 100%;
  flex-shrink: 0;
}

.project-card {
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: #3182ce;
}

.project-image {
  position: relative;
  height: 300px;
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
  background: #3182ce;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.load-project-btn:hover {
  background: #2c5aa0;
  transform: translateY(-2px);
}

.project-info {
  padding: 24px;
}

.project-info h3 {
  color: #f7fafc;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.project-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a0aec0;
  font-size: 0.875rem;
}

.project-description {
  color: #a0aec0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(26, 32, 44, 0.9);
  border: 1px solid #2d3748;
  color: #f7fafc;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.nav-arrow:hover:not(:disabled) {
  background: #3182ce;
  border-color: #3182ce;
  transform: translateY(-50%) scale(1.1);
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-arrow-left {
  left: -24px;
}

.nav-arrow-right {
  right: -24px;
}

.slider-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: #2d3748;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator.active {
  background: #3182ce;
  transform: scale(1.2);
}

.indicator:hover {
  background: #4a5568;
}

.current-project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px 0;
  border-top: 1px solid #2d3748;
}

.project-counter {
  color: #a0aec0;
  font-size: 0.875rem;
}

.project-title {
  color: #f7fafc;
  font-weight: 500;
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

@media (max-width: 768px) {
  .project-gallery {
    padding: 16px;
  }
  
  .project-image {
    height: 200px;
  }
  
  .project-info {
    padding: 16px;
  }
  
  .project-stats {
    gap: 12px;
  }
  
  .nav-arrow {
    width: 40px;
    height: 40px;
  }
  
  .nav-arrow-left {
    left: -20px;
  }
  
  .nav-arrow-right {
    right: -20px;
  }
  
  .current-project-info {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .nav-arrow {
    position: static;
    transform: none;
    margin: 0 8px;
  }
  
  .slider-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .nav-controls {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
}
</style> 