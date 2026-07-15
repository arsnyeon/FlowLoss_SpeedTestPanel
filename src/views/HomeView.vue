<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { NSelect, useMessage } from 'naive-ui'
import { useNodesStore } from '@/stores/nodes'
import { usePanelStore } from '@/stores/panel'
import { useSettingsStore } from '@/stores/settings'
import { useSpeedRunner } from '@/composables/useSpeedRunner'
import { validateSpeedNodeUrl } from '@/utils/nodeConnectivity'
import NetworkPanel from '@/components/panel/NetworkPanel.vue'
import RealtimeChart from '@/components/chart/RealtimeChart.vue'
import ExitIpInfo from '@/components/ip/ExitIpInfo.vue'
import StatsRow from '@/components/panel/StatsRow.vue'
import RankingsModal from '@/components/rankings/RankingsModal.vue'
import ScreenSaver from '@/components/screensaver/ScreenSaver.vue'
import AppDownloadFab from '@/components/app/AppDownloadFab.vue'

const nodesStore = useNodesStore()
const panel = usePanelStore()
const settings = useSettingsStore()
const message = useMessage()

watch(() => panel.lastError, (err) => {
  if (err) message.error(err)
})

watch(() => panel.lastWarning, (warn) => {
  if (warn) {
    message.warning(warn, { duration: 0, closable: true })
    panel.lastWarning = ''
  }
})

watch(() => nodesStore.lastNodeSwitchReason, (reason) => {
  if (reason) {
    message.error(reason)
    nodesStore.lastNodeSwitchReason = ''
  }
})

const chartRef = ref<InstanceType<typeof RealtimeChart> | null>(null)
const rankingsOpen = ref(false)
const screenOpen = ref(false)
const limitDialog = ref<'flow' | 'speed' | null>(null)
const limitValue = ref<number | null>(null)
const limitUnit = ref('GB')
const limitUnitOptions = computed(() => (
  limitDialog.value === 'flow'
    ? [
        { label: 'MB', value: 'MB' },
        { label: 'GB', value: 'GB' },
        { label: 'TB', value: 'TB' },
      ]
    : [
        { label: 'Kbps', value: 'Kbps' },
        { label: 'Mbps', value: 'Mbps' },
        { label: 'Gbps', value: 'Gbps' },
      ]
))

const runner = useSpeedRunner()

const statusChipClass = computed(() => panel.isRunning ? 'fl-chip-success' : '')
const statusLabel = computed(() => {
  if (panel.isChecking) return '检测中'
  return panel.isRunning ? '运行中' : '待命'
})

function handleToggleRun() {
  void runner.tryStart()
}

function handleOpenRankings() {
  rankingsOpen.value = true
}

function handleOpenScreen() {
  screenOpen.value = true
}

function handleSetFlowMax() {
  limitDialog.value = 'flow'
  limitValue.value = null
  limitUnit.value = 'GB'
}

function handleSetLimitMax() {
  limitDialog.value = 'speed'
  limitValue.value = null
  limitUnit.value = 'Mbps'
}

function saveLimit() {
  const value = Math.max(0, Number(limitValue.value) || 0)
  if (limitDialog.value === 'flow') {
    const map: Record<string, number> = {
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
    }
    settings.maxUse = Math.floor(value * map[limitUnit.value])
  } else if (limitDialog.value === 'speed') {
    const map: Record<string, number> = {
      Kbps: 1024,
      Mbps: 1024 * 1024,
      Gbps: 1024 * 1024 * 1024,
    }
    settings.maxSpeed = Math.floor(value * map[limitUnit.value])
  }
  limitDialog.value = null
}

onMounted(() => {
  runner.init()
  runner.setChartTarget(chartRef.value)
  void nodesStore.fetchNodes().then(() => {
    if (settings.autoStart) void runner.tryStart()
  })
  window.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  runner.destroy()
  window.removeEventListener('paste', handlePaste)
})

function parseUrl(text: string): string {
  const match = text.match(/https?:\/\/([\w-]+\.)+[\w-]+(:[0-9]+)?(\/\S*)?/)
  return match ? match[0] : ''
}

async function handlePaste(e: ClipboardEvent) {
  const target = e.target as HTMLElement | null
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return
  const text = e.clipboardData?.getData('text') || ''
  const url = parseUrl(text)
  if (!url) return

  message.info('读取剪切板链接，正在检测可用性...')
  const result = await validateSpeedNodeUrl(url)
  if (result.status) {
    settings.urlValue = url
    message.success('链接可用，已设为当前测速节点')
  } else {
    message.error(`链接不可用：${result.info}`)
  }
}
</script>

<template>
  <div class="fl-shell pt-5 pb-14">
    <!-- Hero strip -->
    <section class="hero-strip">
      <div>
        <h1 class="text-[28px] font-semibold tracking-tight" style="color: var(--text-primary); letter-spacing: -0.03em">
          网络面板
        </h1>
        <p class="mt-1 text-[14px] home-tagline" style="color: var(--text-secondary)">
          <span>极简</span><span>极速</span><span>实时</span><span>压测</span>
        </p>
      </div>
      <div class="fl-chip status-pill" :class="statusChipClass">
        <span v-if="panel.isRunning" class="fl-pulse-dot" />
        <span v-else class="status-dot" />
        {{ statusLabel }}
      </div>
    </section>

    <!-- Bento grid -->
    <div class="home-bento">
      <div class="bento-panel min-w-0">
        <NetworkPanel
          @toggle-run="handleToggleRun"
          @open-rankings="handleOpenRankings"
          @open-screen="handleOpenScreen"
          @set-flow-max="handleSetFlowMax"
          @set-limit-max="handleSetLimitMax"
        />
      </div>

      <div class="bento-sidebar min-w-0">
        <StatsRow
          @set-flow-max="handleSetFlowMax"
          @set-limit-max="handleSetLimitMax"
        />
        <ExitIpInfo />
      </div>

      <div class="bento-chart min-w-0">
        <RealtimeChart ref="chartRef" />
      </div>
    </div>

    <RankingsModal :show="rankingsOpen" @close="rankingsOpen = false" />
    <ScreenSaver :show="screenOpen" @close="screenOpen = false" />

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="limitDialog" class="limit-backdrop" @click.self="limitDialog = null">
          <section class="limit-modal">
            <header>
              <h3>{{ limitDialog === 'flow' ? '设置流量上限' : '设置带宽上限' }}</h3>
              <button @click="limitDialog = null">×</button>
            </header>
            <div class="limit-body">
              <label>{{ limitDialog === 'flow' ? '流量数值' : '速率数值' }}</label>
              <input v-model.number="limitValue" type="number" min="0" placeholder="留空则无上限" />
              <label>单位</label>
              <NSelect
                v-model:value="limitUnit"
                :options="limitUnitOptions"
                class="limit-unit-select"
                size="medium"
              />
              <p v-if="limitDialog === 'speed'">浏览器限速只能限制平均速度，峰值可能仍有波动。</p>
            </div>
            <footer>
              <button class="ghost" @click="limitDialog = null">取消</button>
              <button class="primary" @click="saveLimit">保存</button>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>

    <AppDownloadFab />
  </div>
</template>

<style scoped>
.home-bento {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.bento-sidebar {
  display: contents;
}

.bento-sidebar > :last-child {
  order: 4;
}

.bento-chart {
  order: 3;
}

@media (min-width: 1024px) {
  .home-bento {
    grid-template-columns: 7fr 5fr;
  }

  .bento-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .bento-sidebar > :last-child {
    order: unset;
    flex: 1;
  }

  .bento-chart {
    grid-column: 1 / -1;
    order: unset;
  }
}

.home-tagline {
  display: flex;
  align-items: center;
  gap: 0;
}

.home-tagline span + span::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  margin: 0 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
  vertical-align: middle;
}

.status-pill {
  margin-top: 12px;
  min-height: 26px;
  padding: 5px 10px;
  border-radius: 7px;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  background: var(--bg-card);
  box-shadow: none;
}

.status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--text-muted);
}

@media (max-width: 520px) {
  .hero-strip {
    align-items: flex-start;
  }

  .status-pill {
    margin-top: 2px;
  }
}

.hero-strip {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-top: 3px;
  margin-bottom: 14px;
}

.limit-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.28);
}

.limit-modal {
  width: min(360px, 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
}

.limit-modal header,
.limit-modal footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
}

.limit-modal header {
  border-bottom: 1px solid var(--border);
}

.limit-modal h3 {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
}

.limit-modal header button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
}

.limit-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 16px;
}

.limit-body label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.limit-body input {
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  padding: 0 10px;
  outline: none;
}

.limit-unit-select {
  width: 100%;
}

.limit-body p {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.limit-modal footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border-subtle);
}

.limit-modal footer button {
  height: 34px;
  min-width: 76px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.limit-modal .ghost {
  background: var(--bg-card);
  color: var(--text-secondary);
}

.limit-modal .primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--accent-on-primary);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.16s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

</style>
