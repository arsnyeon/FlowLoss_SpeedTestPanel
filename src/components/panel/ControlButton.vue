<script setup lang="ts">
import { computed } from 'vue'
import { usePanelStore } from '@/stores/panel'
import { useSettingsStore } from '@/stores/settings'

const panel = usePanelStore()
const settings = useSettingsStore()

const buttonText = computed(() => {
  if (panel.isChecking) return '检测中'
  return panel.isRunning ? '停止测速' : '开始测速'
})

const isDisabled = computed(() => {
  return panel.isChecking || (panel.isRunning && settings.cronTab.status) || settings.cronTab.tasks !== 0
})

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <button
    class="fl-btn-primary control-toggle-button w-full"
    :class="{ 'fl-btn-danger': panel.isRunning }"
    :disabled="isDisabled"
    @click="emit('toggle')"
  >
    <svg v-if="panel.isChecking" class="w-4 h-4 fl-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
    <svg v-else-if="!panel.isRunning" class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
    <svg v-else class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
    <span>{{ buttonText }}</span>
  </button>
</template>

<style scoped>
.control-toggle-button {
  border-color: var(--accent-primary);
  outline: none;
  box-shadow: none;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease,
    box-shadow 0.15s ease;
}

.control-toggle-button:hover:not(:disabled):not(.fl-btn-danger),
.control-toggle-button:focus-visible:not(:disabled):not(.fl-btn-danger) {
  border-color: var(--accent-primary-hover);
}

.control-toggle-button:focus-visible:not(:disabled):not(.fl-btn-danger) {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
}

.control-toggle-button.fl-btn-danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: #fff;
}

.control-toggle-button.fl-btn-danger:hover:not(:disabled),
.control-toggle-button.fl-btn-danger:focus-visible:not(:disabled) {
  background: #d60000;
  border-color: #d60000;
}

.control-toggle-button.fl-btn-danger:focus-visible:not(:disabled) {
  box-shadow: 0 0 0 3px rgba(238, 0, 0, 0.12);
}

.control-toggle-button:active:not(:disabled) {
  box-shadow: none;
}

.dark .control-toggle-button:focus-visible:not(:disabled):not(.fl-btn-danger) {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
}

.dark .control-toggle-button.fl-btn-danger:focus-visible:not(:disabled) {
  box-shadow: 0 0 0 3px rgba(238, 0, 0, 0.18);
}
</style>
