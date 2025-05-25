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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.monitoring-header {
  text-align: center;
  margin-bottom: 30px;
}

.monitoring-header h2 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.monitoring-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 5px;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9rem;
  font-weight: 500;
}

.devices-table-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.no-devices {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.no-devices-icon {
  margin-bottom: 15px;
  opacity: 0.5;
}

.no-devices h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.devices-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.devices-table th,
.devices-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.devices-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.devices-table tr:hover {
  background: rgba(52, 152, 219, 0.05);
}

.device-active {
  background: rgba(76, 217, 100, 0.1);
}

.device-name {
  font-weight: 500;
  color: #2c3e50;
}

.device-type {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.status-indicator {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-on {
  background: rgba(76, 217, 100, 0.2);
  color: #27ae60;
}

.status-off {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

.device-power {
  font-weight: 500;
  color: #e67e22;
}

/* Адаптивность - 3 контрольные точки согласно требованиям */

/* Контрольная точка 1200px - большие экраны */
@media (max-width: 1200px) {
  .iot-monitoring {
    max-width: 1000px;
  }
  
  .stats-summary {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

/* Контрольная точка 800px - планшеты */
@media (max-width: 800px) {
  .iot-monitoring {
    padding: 15px;
  }
  
  .monitoring-header h2 {
    font-size: 1.5rem;
  }
  
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 2rem;
  }
  
  .devices-table {
    font-size: 0.9rem;
  }
  
  .devices-table th,
  .devices-table td {
    padding: 10px 12px;
  }
}

/* Контрольная точка 550px - мобильные устройства */
@media (max-width: 550px) {
  .iot-monitoring {
    padding: 5px;
    margin: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .monitoring-header h2 {
    font-size: 1.2rem;
  }
  
  .monitoring-header p {
    font-size: 0.9rem;
    padding: 0 5px;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .stat-card {
    padding: 10px;
  }
  
  .stat-value {
    font-size: 1.6rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
  
  .devices-table-container {
    padding: 10px;
    overflow-x: auto;
  }
  
  .devices-table {
    font-size: 0.75rem;
    min-width: 300px;
  }
  
  .devices-table th,
  .devices-table td {
    padding: 6px 8px;
  }
  
  .devices-table th {
    font-size: 0.7rem;
  }
  
  .status-indicator {
    padding: 2px 6px;
    font-size: 0.65rem;
  }
  
  .no-devices {
    padding: 20px 10px;
  }
}
</style> 