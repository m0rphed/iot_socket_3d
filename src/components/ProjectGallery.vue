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
          aria-label="Предыдущий проект"
        >
          <ChevronLeft :size="20" />
        </button>

        <button 
          class="nav-arrow nav-arrow-right" 
          @click="nextProject"
          :disabled="currentIndex === projects.length - 1"
          aria-label="Следующий проект"
        >
          <ChevronRight :size="20" />
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
                      <Download :size="18" />
                      <span>Загрузить</span>
                    </button>
                  </div>
                </div>
                
                <div class="project-info">
                  <h3>{{ project.name }}</h3>
                  <div class="project-stats">
                    <div class="stat-item">
                      <Home :size="14" />
                      <span>{{ project.stats.rooms }}</span>
                    </div>
                    <div class="stat-item">
                      <Zap :size="14" />
                      <span>{{ project.stats.devices }}</span>
                    </div>
                    <div class="stat-item">
                      <Activity :size="14" />
                      <span>{{ project.stats.power }} Вт</span>
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
            :aria-label="`Перейти к проекту ${index + 1}`"
          ></button>
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
/* ===== БАЗОВЫЕ СТИЛИ ===== */
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
  text-align: center;
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
  min-height: 0;
  padding: 0 60px;
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

/* ===== СЛАЙДЕР ===== */
.slider-container {
  width: 100%;
  max-width: 700px;
  position: relative;
  margin: 0 auto;
}

.slider-wrapper {
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  position: relative;
  width: 100%;
}

.slider-track {
  display: flex;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.project-slide {
  min-width: 100%;
  width: 100%;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ===== КАРТОЧКА ПРОЕКТА ===== */
.project-card {
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 500px;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
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
  inset: 0;
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
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.load-project-btn:hover {
  background: #2c5aa0;
  transform: translateY(-2px);
}

/* ===== ИНФОРМАЦИЯ О ПРОЕКТЕ ===== */
.project-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.project-info h3 {
  color: #f7fafc;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.3;
  flex-shrink: 0;
}

.project-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  justify-content: center;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #a0aec0;
  font-size: 0.8rem;
  background: rgba(49, 130, 206, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(49, 130, 206, 0.2);
}

.project-description {
  color: #a0aec0;
  font-size: 0.8rem;
  line-height: 1.4;
  text-align: center;
  flex: 1;
  display: flex;
  align-items: flex-start;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

/* ===== НАВИГАЦИЯ ===== */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(15, 20, 25, 0.9);
  border: 1px solid rgba(49, 130, 206, 0.3);
  color: #f7fafc;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.nav-arrow:hover:not(:disabled) {
  background: rgba(49, 130, 206, 0.9);
  border-color: #4299e1;
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 6px 20px rgba(49, 130, 206, 0.4);
}

.nav-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: translateY(-50%);
  background: rgba(15, 20, 25, 0.5);
}

.nav-arrow-left {
  left: -22px;
}

.nav-arrow-right {
  right: -22px;
}

/* ===== ИНДИКАТОРЫ ===== */
.slider-indicators {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.indicator {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  border: none;
  background: rgba(45, 55, 72, 0.8);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, #3182ce, #4299e1);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.indicator.active::before {
  width: 100%;
}

.indicator:hover:not(.active) {
  background: rgba(74, 85, 104, 0.8);
}

.indicator:hover:not(.active)::before {
  width: 30%;
}

/* ===== ИНФОРМАЦИЯ О ТЕКУЩЕМ ПРОЕКТЕ ===== */
.current-project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid #2d3748;
}

.project-counter {
  color: #a0aec0;
  font-size: 0.8rem;
}

.project-title {
  color: #f7fafc;
  font-weight: 500;
  font-size: 0.9rem;
}

/* ===== АДАПТИВНОСТЬ ===== */

/* Планшеты */
@media (max-width: 768px) {
  .project-gallery {
    padding: 16px;
  }
  
  .gallery-header {
    margin-bottom: 16px;
  }
  
  .gallery-header h2 {
    font-size: 1.25rem;
  }
  
  .gallery-header p {
    font-size: 0.8rem;
  }
  
  .gallery-container {
    padding: 0 50px;
  }
  
  .slider-container {
    max-width: 100%;
  }
  
  .project-card {
    height: 400px;
  }
  
  .project-image {
    height: 200px;
  }
  
  .project-info {
    padding: 16px;
  }
  
  .project-info h3 {
    font-size: 1.125rem;
    margin-bottom: 10px;
  }
  
  .project-stats {
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .stat-item {
    font-size: 0.75rem;
    padding: 3px 6px;
  }
  
  .project-description {
    font-size: 0.75rem;
    -webkit-line-clamp: 2;
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
  
  .slider-indicators {
    gap: 10px;
    margin-top: 16px;
  }
  
  .indicator {
    width: 28px;
    height: 3px;
  }
  
  .load-project-btn {
    padding: 10px 16px;
    font-size: 0.8rem;
    gap: 6px;
  }
  
  .current-project-info {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    margin-top: 16px;
    padding: 12px 0;
  }
}

/* Мобильные */
@media (max-width: 480px) {
  .project-gallery {
    padding: 12px;
  }
  
  .gallery-header {
    margin-bottom: 12px;
  }
  
  .gallery-header h2 {
    font-size: 1.125rem;
  }
  
  .gallery-header p {
    font-size: 0.75rem;
  }
  
  .gallery-container {
    padding: 0 40px;
  }
  
  .project-card {
    height: 350px;
  }
  
  .project-image {
    height: 160px;
  }
  
  .project-info {
    padding: 12px;
  }
  
  .project-info h3 {
    font-size: 1rem;
    margin-bottom: 8px;
  }
  
  .project-stats {
    gap: 6px;
    margin-bottom: 8px;
  }
  
  .stat-item {
    font-size: 0.7rem;
    padding: 2px 4px;
  }
  
  .project-description {
    font-size: 0.7rem;
    -webkit-line-clamp: 3;
  }
  
  .nav-arrow {
    width: 36px;
    height: 36px;
  }
  
  .nav-arrow-left {
    left: -18px;
  }
  
  .nav-arrow-right {
    right: -18px;
  }
  
  .slider-indicators {
    margin-top: 12px;
    gap: 8px;
  }
  
  .indicator {
    width: 24px;
    height: 3px;
  }
  
  .load-project-btn {
    padding: 8px 12px;
    font-size: 0.75rem;
    gap: 4px;
  }
  
  .current-project-info {
    margin-top: 12px;
    padding: 8px 0;
    gap: 6px;
  }
  
  .project-counter {
    font-size: 0.75rem;
  }
  
  .project-title {
    font-size: 0.8rem;
  }
}

/* Очень маленькие экраны */
@media (max-width: 360px) {
  .project-gallery {
    padding: 8px;
  }
  
  .gallery-header {
    margin-bottom: 8px;
  }
  
  .gallery-container {
    padding: 0 35px;
  }
  
  .project-card {
    height: 320px;
  }
  
  .project-image {
    height: 140px;
  }
  
  .project-info {
    padding: 10px;
  }
  
  .project-info h3 {
    font-size: 0.95rem;
    margin-bottom: 6px;
  }
  
  .project-stats {
    gap: 4px;
    margin-bottom: 6px;
  }
  
  .stat-item {
    font-size: 0.65rem;
    padding: 2px 3px;
  }
  
  .project-description {
    font-size: 0.65rem;
    -webkit-line-clamp: 2;
  }
  
  .nav-arrow {
    width: 32px;
    height: 32px;
  }
  
  .nav-arrow-left {
    left: -16px;
  }
  
  .nav-arrow-right {
    right: -16px;
  }
  
  .slider-indicators {
    gap: 6px;
  }
  
  .indicator {
    width: 20px;
    height: 2px;
  }
  
  .load-project-btn {
    padding: 6px 10px;
    font-size: 0.7rem;
  }
}
</style> 