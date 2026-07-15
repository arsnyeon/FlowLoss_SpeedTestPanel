<script setup lang="ts">
const emit = defineEmits<{
  (e: 'openRankings'): void
  (e: 'openScreen'): void
  (e: 'openUser'): void
  (e: 'openSettings'): void
}>()

const actions = [
  { key: 'rankings', label: '排行榜', event: 'openRankings', path: 'M18 20V10M12 20V4M6 20v-6' },
  { key: 'screen', label: '息屏', event: 'openScreen', path: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3' },
  { key: 'user', label: '用户', event: 'openUser', path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', isCircle: true },
  { key: 'settings', label: '设置', event: 'openSettings', path: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
] as const

function handleClick(event: string) {
  switch (event) {
    case 'openRankings': emit('openRankings'); break
    case 'openScreen': emit('openScreen'); break
    case 'openUser': emit('openUser'); break
    case 'openSettings': emit('openSettings'); break
  }
}
</script>

<template>
  <div class="grid grid-cols-4 gap-1.5">
    <button
      v-for="action in actions"
      :key="action.key"
      class="tool-btn"
      @click="handleClick(action.event)"
    >
      <svg class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path :d="action.path" />
      </svg>
      <span class="text-[11px] font-medium">{{ action.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.tool-btn:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}
</style>
