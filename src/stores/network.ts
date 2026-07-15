import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  const localLatencyMs = ref(0)
  const cloudflareLatencyMs = ref(0)

  function setLocalLatency(ms: number | string) {
    localLatencyMs.value = typeof ms === 'number' && Number.isFinite(ms) ? ms : 0
  }

  function setCloudflareLatency(ms: number | string) {
    cloudflareLatencyMs.value = typeof ms === 'number' && Number.isFinite(ms) ? ms : 0
  }

  return { localLatencyMs, cloudflareLatencyMs, setLocalLatency, setCloudflareLatency }
})
