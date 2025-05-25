<template>
  <div class="settings-form">
    <div class="settings-header">
      <h2>⚙️ Настройки системы</h2>
      <p>Конфигурация параметров IoT системы управления</p>
    </div>

    <form @submit.prevent="handleSubmit" class="settings-form-container">
      <!-- Основные настройки -->
      <div class="form-section">
        <h3>Основные параметры</h3>
        
        <div class="form-group">
          <label for="systemName" class="required">Название системы</label>
          <input
            type="text"
            id="systemName"
            v-model="formData.systemName"
            :class="{ 'error': errors.systemName }"
            placeholder="Введите название системы"
            @blur="validateSystemName"
            @input="clearError('systemName')"
          />
          <span v-if="errors.systemName" class="error-message">{{ errors.systemName }}</span>
        </div>

        <div class="form-group">
          <label for="adminEmail" class="required">Email администратора</label>
          <input
            type="email"
            id="adminEmail"
            v-model="formData.adminEmail"
            :class="{ 'error': errors.adminEmail }"
            placeholder="admin@example.com"
            @blur="validateAdminEmail"
            @input="clearError('adminEmail')"
          />
          <span v-if="errors.adminEmail" class="error-message">{{ errors.adminEmail }}</span>
        </div>

        <div class="form-group">
          <label for="serverPort" class="required">Порт сервера</label>
          <input
            type="text"
            id="serverPort"
            v-model="formData.serverPort"
            :class="{ 'error': errors.serverPort }"
            placeholder="8080"
            @blur="validateServerPort"
            @input="clearError('serverPort')"
          />
          <span v-if="errors.serverPort" class="error-message">{{ errors.serverPort }}</span>
        </div>
      </div>

      <!-- Настройки безопасности -->
      <div class="form-section">
        <h3>Безопасность</h3>
        
        <div class="form-group">
          <label for="apiKey" class="required">API ключ</label>
          <input
            type="text"
            id="apiKey"
            v-model="formData.apiKey"
            :class="{ 'error': errors.apiKey }"
            placeholder="Введите API ключ (32 символа)"
            @blur="validateApiKey"
            @input="clearError('apiKey')"
          />
          <span v-if="errors.apiKey" class="error-message">{{ errors.apiKey }}</span>
        </div>

        <div class="form-group">
          <label for="devicePassword">Пароль устройств</label>
          <input
            type="password"
            id="devicePassword"
            v-model="formData.devicePassword"
            :class="{ 'error': errors.devicePassword }"
            placeholder="Минимум 8 символов"
            @blur="validateDevicePassword"
            @input="clearError('devicePassword')"
          />
          <span v-if="errors.devicePassword" class="error-message">{{ errors.devicePassword }}</span>
        </div>
      </div>

      <!-- Настройки мониторинга -->
      <div class="form-section">
        <h3>Мониторинг</h3>
        
        <div class="form-group">
          <label for="updateInterval">Интервал обновления (сек)</label>
          <select
            id="updateInterval"
            v-model="formData.updateInterval"
            :class="{ 'error': errors.updateInterval }"
          >
            <option value="5">5 секунд</option>
            <option value="10">10 секунд</option>
            <option value="30">30 секунд</option>
            <option value="60">1 минута</option>
          </select>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="formData.enableNotifications"
            />
            <span class="checkmark"></span>
            Включить уведомления
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="formData.enableLogging"
            />
            <span class="checkmark"></span>
            Включить логирование
          </label>
        </div>
      </div>

      <!-- Кнопки управления -->
      <div class="form-actions">
        <button type="button" @click="resetForm" class="btn-secondary">
          <RotateCcw :size="18" />
          Сбросить
        </button>
        <button type="submit" :disabled="!isFormValid" class="btn-primary">
          <Save :size="18" />
          Сохранить настройки
        </button>
      </div>
    </form>

    <!-- Модальное окно успеха -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content success" @click.stop>
        <div class="modal-header">
          <CheckCircle :size="48" class="success-icon" />
          <h3>Настройки сохранены!</h3>
        </div>
        <div class="modal-body">
          <p>Конфигурация системы успешно обновлена.</p>
          <p>Изменения вступят в силу после перезапуска системы.</p>
        </div>
        <div class="modal-actions">
          <button @click="closeSuccessModal" class="btn-primary">
            Понятно
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно ошибки -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-content error" @click.stop>
        <div class="modal-header">
          <XCircle :size="48" class="error-icon" />
          <h3>Ошибка сохранения</h3>
        </div>
        <div class="modal-body">
          <p>Не удалось сохранить настройки.</p>
          <p>{{ errorMessage }}</p>
        </div>
        <div class="modal-actions">
          <button @click="closeErrorModal" class="btn-secondary">
            Закрыть
          </button>
          <button @click="handleSubmit" class="btn-primary">
            Попробовать снова
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Save, RotateCcw, CheckCircle, XCircle } from 'lucide-vue-next'

// Данные формы
const formData = ref({
  systemName: '',
  adminEmail: '',
  serverPort: '8080',
  apiKey: '',
  devicePassword: '',
  updateInterval: '10',
  enableNotifications: true,
  enableLogging: false
})

// Ошибки валидации
const errors = ref<Record<string, string>>({})

// Состояние модальных окон
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')

// Регулярные выражения для валидации
const patterns = {
  systemName: /^[a-zA-Zа-яА-Я0-9\s]{3,50}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  port: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
  apiKey: /^[a-zA-Z0-9]{32}$/,
  password: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
}

// Функции валидации
const validateSystemName = () => {
  if (!formData.value.systemName.trim()) {
    errors.value.systemName = 'Название системы обязательно для заполнения'
    return false
  }
  if (!patterns.systemName.test(formData.value.systemName)) {
    errors.value.systemName = 'Название должно содержать 3-50 символов (буквы, цифры, пробелы)'
    return false
  }
  delete errors.value.systemName
  return true
}

const validateAdminEmail = () => {
  if (!formData.value.adminEmail.trim()) {
    errors.value.adminEmail = 'Email администратора обязателен для заполнения'
    return false
  }
  if (!patterns.email.test(formData.value.adminEmail)) {
    errors.value.adminEmail = 'Введите корректный email адрес'
    return false
  }
  delete errors.value.adminEmail
  return true
}

const validateServerPort = () => {
  if (!formData.value.serverPort.trim()) {
    errors.value.serverPort = 'Порт сервера обязателен для заполнения'
    return false
  }
  if (!patterns.port.test(formData.value.serverPort)) {
    errors.value.serverPort = 'Введите корректный номер порта (1-65535)'
    return false
  }
  delete errors.value.serverPort
  return true
}

const validateApiKey = () => {
  if (!formData.value.apiKey.trim()) {
    errors.value.apiKey = 'API ключ обязателен для заполнения'
    return false
  }
  if (!patterns.apiKey.test(formData.value.apiKey)) {
    errors.value.apiKey = 'API ключ должен содержать ровно 32 символа (буквы и цифры)'
    return false
  }
  delete errors.value.apiKey
  return true
}

const validateDevicePassword = () => {
  if (formData.value.devicePassword && !patterns.password.test(formData.value.devicePassword)) {
    errors.value.devicePassword = 'Пароль должен содержать минимум 8 символов, включая буквы и цифры'
    return false
  }
  delete errors.value.devicePassword
  return true
}

// Проверка валидности всей формы
const isFormValid = computed(() => {
  return validateSystemName() && 
         validateAdminEmail() && 
         validateServerPort() && 
         validateApiKey() && 
         validateDevicePassword() &&
         Object.keys(errors.value).length === 0
})

// Очистка ошибки для конкретного поля
const clearError = (field: string) => {
  delete errors.value[field]
}

// Сброс формы
const resetForm = () => {
  formData.value = {
    systemName: '',
    adminEmail: '',
    serverPort: '8080',
    apiKey: '',
    devicePassword: '',
    updateInterval: '10',
    enableNotifications: true,
    enableLogging: false
  }
  errors.value = {}
}

// Обработка отправки формы
const handleSubmit = () => {
  // Валидируем все поля
  const isValid = validateSystemName() && 
                  validateAdminEmail() && 
                  validateServerPort() && 
                  validateApiKey() && 
                  validateDevicePassword()

  if (!isValid) {
    return
  }

  // Симуляция отправки данных
  try {
    // Здесь был бы реальный API вызов
    console.log('Сохранение настроек:', formData.value)
    
    // Симуляция случайной ошибки (10% вероятность)
    if (Math.random() < 0.1) {
      throw new Error('Сервер временно недоступен')
    }
    
    // Успешное сохранение
    showSuccessModal.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Неизвестная ошибка'
    showErrorModal.value = true
  }
}

// Закрытие модальных окон
const closeSuccessModal = () => {
  showSuccessModal.value = false
}

const closeErrorModal = () => {
  showErrorModal.value = false
  errorMessage.value = ''
}
</script>

<style scoped>
.settings-form {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.settings-header {
  text-align: center;
  margin-bottom: 30px;
}

.settings-header h2 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.settings-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.settings-form-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.form-section h3 {
  color: #2c3e50;
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group label.required::after {
  content: ' *';
  color: #e74c3c;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input.error,
.form-group select.error {
  border-color: #e74c3c;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 5px;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0 !important;
  font-weight: normal !important;
}

.checkbox-label input[type="checkbox"] {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.checkmark {
  width: 20px;
  height: 20px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  margin-right: 10px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #3498db;
  border-color: #3498db;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  text-align: center;
  padding: 25px 20px 15px;
}

.modal-header h3 {
  margin: 10px 0 0 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.success-icon {
  color: #27ae60;
}

.error-icon {
  color: #e74c3c;
}

.modal-body {
  padding: 0 20px 20px;
  text-align: center;
  color: #7f8c8d;
  line-height: 1.5;
}

.modal-body p {
  margin: 8px 0;
}

.modal-actions {
  padding: 15px 20px 25px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.modal-actions .btn-primary,
.modal-actions .btn-secondary {
  padding: 10px 20px;
  font-size: 0.9rem;
}

/* Адаптивность - 3 контрольные точки согласно требованиям */

/* Контрольная точка 1200px - большие экраны */
@media (max-width: 1200px) {
  .settings-form {
    max-width: 700px;
  }
}

/* Контрольная точка 800px - планшеты */
@media (max-width: 800px) {
  .settings-form {
    padding: 15px;
    max-width: 100%;
  }
  
  .settings-header h2 {
    font-size: 1.5rem;
  }
  
  .form-section {
    padding: 15px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    justify-content: center;
  }
}

/* Контрольная точка 550px - мобильные устройства */
@media (max-width: 550px) {
  .settings-form {
    padding: 5px;
    margin: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .settings-header h2 {
    font-size: 1.2rem;
  }
  
  .settings-header p {
    font-size: 0.9rem;
    padding: 0 5px;
  }
  
  .form-section {
    padding: 10px;
    margin-bottom: 15px;
  }
  
  .form-section h3 {
    font-size: 1rem;
  }
  
  .form-group {
    margin-bottom: 12px;
  }
  
  .form-group input,
  .form-group select {
    font-size: 16px; /* Предотвращает зум на iOS */
    padding: 8px 10px;
  }
  
  .modal-content {
    margin: 10px;
    width: calc(100% - 20px);
    max-width: none;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 10px 15px;
    font-size: 0.85rem;
  }
  
  .form-actions {
    padding-top: 15px;
    gap: 10px;
  }
  
  .checkbox-label {
    font-size: 0.9rem;
  }
  
  .checkmark {
    width: 18px;
    height: 18px;
  }
}
</style> 