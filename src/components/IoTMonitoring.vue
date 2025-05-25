<template>
  <div class="iot-monitoring">
    <div class="monitoring-header">
      <h2>📊 Мониторинг IoT устройств</h2>
      <p>Текущее состояние всех устройств в 3D сцене</p>
    </div>

    <div class="stats-summary">
      <div class="stat-card">
        <div class="stat-value">{{ iotStore.getTotalDevices() }}</div>
        <div class="stat-label">Всего устройств</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ iotStore.getActiveDevices() }}</div>
        <div class="stat-label">Активных</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ iotStore.getTotalPowerConsumption() }}Вт</div>
        <div class="stat-label">Потребление</div>
      </div>
    </div>

    <div class="devices-table-container">
      <div v-if="iotStore.devices.length === 0" class="no-devices">
        <Monitor :size="48" class="no-devices-icon" />
        <h3>Нет устройств</h3>
        <p>Перейдите в 3D редактор и добавьте розетки в сцену</p>
      </div>

      <table v-else class="devices-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Тип устройства</th>
            <th>Состояние</th>
            <th>Потребление</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="device in iotStore.devices" 
            :key="device.id"
            :class="{ 'device-active': device.isOn }"
          >
            <td class="device-name">{{ device.name }}</td>
            <td class="device-type">{{ getDeviceTypeLabel(device.deviceType) }}</td>
            <td class="device-status">
              <span :class="['status-indicator', device.isOn ? 'status-on' : 'status-off']">
                {{ device.isOn ? 'Включено' : 'Выключено' }}
              </span>
            </td>
            <td class="device-power">{{ device.isOn ? device.powerConsumption : 0 }}Вт</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIoTStore } from '../stores/iot'
import { Monitor } from 'lucide-vue-next'

const iotStore = useIoTStore()

const getDeviceTypeLabel = (deviceType: string): string => {
  const types: Record<string, string> = {
    'power': 'Электропитание',
    'light': 'Освещение',
    'climate': 'Климат-контроль',
    'security': 'Безопасность',
    'media': 'Медиа-устройство'
  }
  return types[deviceType] || 'Неизвестно'
}
</script>

<style scoped>
.iot-monitoring {
  padding: 24px;
  width: 100%;
  height: 100%;
  background: #0f1419;
}

.monitoring-header {
  margin-bottom: 24px;
}

.monitoring-header h2 {
  color: #f7fafc;
  font-size: 1.5rem;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.monitoring-header p {
  color: #a0aec0;
  font-size: 0.875rem;
  font-weight: 400;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  border-color: #3182ce;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #3182ce;
  margin-bottom: 4px;
  letter-spacing: -0.025em;
}

.stat-label {
  color: #a0aec0;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.devices-table-container {
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.no-devices {
  text-align: center;
  padding: 48px 24px;
  color: #a0aec0;
}

.no-devices-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-devices h3 {
  margin-bottom: 8px;
  color: #f7fafc;
  font-weight: 600;
}

.devices-table {
  width: 100%;
  border-collapse: collapse;
}

.devices-table th,
.devices-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #2d3748;
}

.devices-table th {
  background: #0f1419;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #2d3748;
}

.devices-table tbody tr:hover {
  background: #2d3748;
}

.devices-table tbody tr:last-child td {
  border-bottom: none;
}

.device-active {
  background: rgba(49, 130, 206, 0.1);
}

.device-name {
  font-weight: 500;
  color: #f7fafc;
}

.device-type {
  color: #a0aec0;
}

.status-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-on {
  background: rgba(72, 187, 120, 0.2);
  color: #68d391;
}

.status-off {
  background: rgba(245, 101, 101, 0.2);
  color: #fc8181;
}

.device-power {
  font-weight: 500;
  color: #f7fafc;
}

@media (max-width: 768px) {
  .iot-monitoring {
    padding: 16px;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .devices-table-container {
    overflow-x: auto;
  }
  
  .devices-table {
    min-width: 500px;
  }
}
</style> 