import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface IoTDevice {
  id: string
  name: string
  type: string
  isOn: boolean
  powerConsumption: number
  deviceType: string
}

export const useIoTStore = defineStore('iot', () => {
  const devices = ref<IoTDevice[]>([])
  const currentTab = ref('editor')

  const updateDevices = (newDevices: IoTDevice[]) => {
    devices.value = newDevices
  }

  const setCurrentTab = (tab: string) => {
    currentTab.value = tab
  }

  const getTotalDevices = () => devices.value.length
  const getActiveDevices = () => devices.value.filter(device => device.isOn).length
  const getTotalPowerConsumption = () => 
    devices.value
      .filter(device => device.isOn)
      .reduce((total, device) => total + device.powerConsumption, 0)

  return {
    devices,
    currentTab,
    updateDevices,
    setCurrentTab,
    getTotalDevices,
    getActiveDevices,
    getTotalPowerConsumption
  }
}) 