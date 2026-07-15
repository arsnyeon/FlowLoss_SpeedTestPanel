<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getAppRelease } from '@/api/public'

const STORAGE_KEY = 'app_release_version'
const NEW_BADGE_DURATION = 2500
const VERSION_BADGE_DURATION = 3000

const visible = ref(false)
const showNewBadge = ref(false)
const rotateBadge = ref(false)
const downloadUrl = ref('')
const currentVersion = ref('')
let badgeTimer = 0

const badgeText = computed(() => {
  if (showNewBadge.value) return 'NEW'
  if (!currentVersion.value) return ''
  return currentVersion.value.toLowerCase().startsWith('v')
    ? currentVersion.value
    : `v${currentVersion.value}`
})

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map(part => parseInt(part, 10) || 0)
  const pb = b.replace(/^v/i, '').split('.').map(part => parseInt(part, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

function isMobileUA(): boolean {
  return /Android/i.test(navigator.userAgent)
}

function stopBadgeRotation() {
  if (badgeTimer) window.clearTimeout(badgeTimer)
  badgeTimer = 0
}

function scheduleBadgeSwap() {
  stopBadgeRotation()
  if (!rotateBadge.value) return

  badgeTimer = window.setTimeout(() => {
    showNewBadge.value = !showNewBadge.value
    scheduleBadgeSwap()
  }, showNewBadge.value ? NEW_BADGE_DURATION : VERSION_BADGE_DURATION)
}

onMounted(async () => {
  if (!isMobileUA()) return

  try {
    const { appRelease } = await getAppRelease()
    if (appRelease && appRelease.downloadUrl) {
      downloadUrl.value = appRelease.downloadUrl
      currentVersion.value = appRelease.version
      visible.value = true

      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored || compareVersions(appRelease.version, stored) > 0) {
        showNewBadge.value = true
        rotateBadge.value = true
        scheduleBadgeSwap()
      }
    }
  } catch {
    // silent
  }
})

onBeforeUnmount(() => {
  stopBadgeRotation()
})

function handleClick() {
  if (downloadUrl.value) {
    if (currentVersion.value) {
      localStorage.setItem(STORAGE_KEY, currentVersion.value)
      rotateBadge.value = false
      stopBadgeRotation()
      showNewBadge.value = false
    }
    window.open(downloadUrl.value, '_blank')
  }
}
</script>

<template>
  <Transition name="fab-enter">
    <div v-if="visible" class="app-download-fab" @click="handleClick">
      <div v-if="badgeText" class="fab-badge">
        <Transition name="badge-swap" mode="out-in">
          <span :key="badgeText" class="fab-badge-text">{{ badgeText }}</span>
        </Transition>
      </div>
      <div class="fab-content">
        <svg class="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span class="fab-label">APP</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-download-fab {
  position: fixed;
  bottom: 24px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--accent-primary);
  color: var(--accent-on-primary);
  cursor: pointer;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
  animation: fab-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.dark .app-download-fab {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.app-download-fab:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.app-download-fab:active {
  transform: scale(0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.fab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.fab-icon {
  width: 20px;
  height: 20px;
}

.fab-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1;
}

.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 42px;
  height: 16px;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--color-danger);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 6px;
  letter-spacing: 0.03em;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(238, 0, 0, 0.3);
  animation: badge-bounce 2s ease-in-out infinite;
}

.fab-badge-text {
  display: block;
  white-space: nowrap;
}

.badge-swap-enter-active,
.badge-swap-leave-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), filter 0.22s ease;
}

.badge-swap-enter-from {
  opacity: 0;
  transform: translateY(-5px) scale(0.9);
  filter: blur(2px);
}

.badge-swap-leave-to {
  opacity: 0;
  transform: translateY(5px) scale(0.9);
  filter: blur(2px);
}

@keyframes fab-pulse {
  0%, 100% {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  50% {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 6px rgba(0, 0, 0, 0.06);
  }
}

.dark .app-download-fab {
  animation: fab-pulse-dark 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes fab-pulse-dark {
  0%, 100% {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  }
  50% {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 6px rgba(255, 255, 255, 0.06);
  }
}

@keyframes badge-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.fab-enter-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fab-enter-leave-active {
  transition: all 0.2s ease;
}

.fab-enter-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

.fab-enter-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@media (prefers-reduced-motion: reduce) {
  .badge-swap-enter-active,
  .badge-swap-leave-active {
    transition: none;
  }
}
</style>
