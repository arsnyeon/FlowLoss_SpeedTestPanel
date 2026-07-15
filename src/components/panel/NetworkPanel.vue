<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import NodeSelector from './NodeSelector.vue'
import ThreadSlider from './ThreadSlider.vue'
import ControlButton from './ControlButton.vue'
import Toolbar from './Toolbar.vue'
import SettingsPanel from './SettingsPanel.vue'
import CustomNodes from './CustomNodes.vue'
import UserPanel from './UserPanel.vue'
import { usePanelStore } from '@/stores/panel'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'
import { useFormatter } from '@/composables/useFormatter'

type PanelView = 'main' | 'settings' | 'nodes' | 'user'
const currentView = ref<PanelView>('main')
const panel = usePanelStore()
const settings = useSettingsStore()
const userStore = useUserStore()
const { formatBytes, formatBandwidth } = useFormatter()

const runningStatus = computed(() => {
  if (panel.isChecking) return '检测中'
  return panel.isRunning ? '运行中' : '待命'
})

const flowLimit = computed(() => settings.maxUse > 0 ? formatBytes(settings.maxUse) : '不限')
const speedLimit = computed(() => settings.maxSpeed > 0 ? formatBandwidth(settings.maxSpeed) : '不限')
const scheduleStatus = computed(() => settings.cronTab.status ? '已开启' : '未开启')
const rotationStatus = computed(() => settings.nodeRotation.enabled ? '已开启' : '未开启')
const groupModeStatus = computed(() => settings.groupMode ? '已开启' : '未开启')

const overviewItems = computed(() => [
  { label: '定时任务', value: scheduleStatus.value },
  { label: '节点联测', value: groupModeStatus.value },
  { label: '节点轮换', value: rotationStatus.value },
])
const overviewIndex = ref(0)
let overviewTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  overviewTimer = setInterval(() => {
    overviewIndex.value = (overviewIndex.value + 1) % overviewItems.value.length
  }, 5000)
})
onUnmounted(() => {
  if (overviewTimer) clearInterval(overviewTimer)
})

const emit = defineEmits<{
  (e: 'toggleRun'): void
  (e: 'openRankings'): void
  (e: 'openScreen'): void
  (e: 'setFlowMax'): void
  (e: 'setLimitMax'): void
}>()

function switchView(view: PanelView) {
  currentView.value = view
}

async function handleOpenUser() {
  await userStore.checkStatus()
  switchView('user')
}
</script>

<template>
  <div class="fl-card h-full">
    <!-- Header -->
    <div class="flex items-center justify-between" style="margin-bottom: 12px;">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 flex items-center justify-center" style="color: var(--text-secondary)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <h2 class="text-[14px] font-semibold tracking-tight" style="color: var(--text-primary)">
          控制台
        </h2>
      </div>
      <span class="text-[11px]" style="color: var(--text-muted)">Control</span>
    </div>

    <Transition name="fade-slide" mode="out-in">
      <div v-if="currentView === 'main'" key="main" class="space-y-5">
        <NodeSelector @edit-nodes="switchView('nodes')" />
        <ThreadSlider />
        <ControlButton class="!mt-3" @toggle="emit('toggleRun')" />
        <div style="border-top: 1px solid var(--border-subtle)" />
        <Toolbar
          @open-rankings="emit('openRankings')"
          @open-screen="emit('openScreen')"
          @open-user="handleOpenUser"
          @open-settings="switchView('settings')"
        />
        <div class="panel-overview">
          <div class="overview-head">
            <span>运行概览</span>
          </div>
          <div class="overview-grid">
            <div class="overview-item">
              <span>线程</span>
              <strong>{{ settings.threadNum }}</strong>
            </div>
            <div class="overview-item">
              <span>流量上限</span>
              <strong>{{ flowLimit }}</strong>
            </div>
            <div class="overview-item">
              <span>带宽上限</span>
              <strong>{{ speedLimit }}</strong>
            </div>
            <div class="overview-item overview-item--rotating">
              <Transition name="overview-fade" mode="out-in">
                <div :key="overviewIndex" class="overview-rotate-inner">
                  <span>{{ overviewItems[overviewIndex].label }}</span>
                  <strong>{{ overviewItems[overviewIndex].value }}</strong>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <SettingsPanel v-else-if="currentView === 'settings'" key="settings" @back="switchView('main')" />
      <CustomNodes v-else-if="currentView === 'nodes'" key="nodes" @back="switchView('main')" />
      <UserPanel v-else-if="currentView === 'user'" key="user" @back="switchView('main')" />
    </Transition>
  </div>
</template>

<style scoped>
.panel-overview {
  margin-top: 2px;
  padding: 10px 0;
  border: none;
  background: none;
}

.overview-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.overview-head::before,
.overview-head::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.overview-head span:first-child {
  color: var(--text-secondary);
  white-space: nowrap;
}

.overview-grid {
  display: flex;
  gap: 0;
}

.overview-item {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  text-align: center;
}

.overview-item + .overview-item {
  border-left: 1px solid var(--border-subtle);
}

.overview-item span {
  display: block;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.3;
}

.overview-item strong {
  display: block;
  margin-top: 2px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.overview-item--rotating {
  overflow: hidden;
}

.overview-rotate-inner {
  text-align: inherit;
}

.overview-rotate-inner span {
  display: block;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.3;
}

.overview-rotate-inner strong {
  display: block;
  margin-top: 2px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.25;
}

.overview-fade-enter-active,
.overview-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.overview-fade-enter-from {
  opacity: 0;
  transform: scale(0.85);
}

.overview-fade-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
