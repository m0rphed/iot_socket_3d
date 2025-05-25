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
  padding: 24px;
  width: 100%;
  height: 100%;
  background: #0f1419;
  overflow-y: auto;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h2 {
  color: #f7fafc;
  font-size: 1.5rem;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.settings-header p {
  color: #a0aec0;
  font-size: 0.875rem;
  font-weight: 400;
}

.settings-form-container {
  max-width: 600px;
  margin: 0 auto;
}

.form-section {
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.form-section h3 {
  color: #f7fafc;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2d3748;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  color: #e2e8f0;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 6px;
}

.required::after {
  content: ' *';
  color: #f56565;
}

input[type="text"],
input[type="email"],
input[type="password"],
select {
  width: 100%;
  padding: 10px 12px;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 6px;
  color: #f7fafc;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
select:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

input.error,
select.error {
  border-color: #f56565;
  box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
}

.error-message {
  color: #f56565;
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 4px;
  margin-right: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #3182ce;
  border-color: #3182ce;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #2d3748;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #3182ce;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2c5aa0;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #4a5568;
  color: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #2d3748;
  color: #e2e8f0;
  border: 1px solid #4a5568;
}

.btn-secondary:hover {
  background: #4a5568;
  border-color: #718096;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.modal-header {
  text-align: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  color: #f7fafc;
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 8px;
}

.success-icon {
  color: #68d391;
}

.error-icon {
  color: #f56565;
}

.modal-body {
  text-align: center;
  margin-bottom: 20px;
}

.modal-body p {
  color: #a0aec0;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .settings-form {
    padding: 16px;
  }
  
  .form-section {
    padding: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
  
  .modal-content {
    margin: 16px;
    padding: 20px;
  }
}
</style> 