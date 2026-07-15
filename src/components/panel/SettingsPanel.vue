<script setup lang="ts">
import { computed } from 'vue'
import { NSwitch, NInputNumber, NSelect } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import { usePanelStore } from '@/stores/panel'
import { useNodesStore } from '@/stores/nodes'

const settings = useSettingsStore()
const panel = usePanelStore()
const nodesStore = useNodesStore()

const unitOptions = [
  { label: '秒', value: 's' },
  { label: '分钟', value: 'm' },
  { label: '小时', value: 'h' },
]

const cronModeOptions = [
  { label: '循环执行', value: 'interval' },
  { label: '仅时段运行', value: 'period' },
]

const hourOptions = Array.from({ length: 24 }, (_, i) => ({ label: String(i), value: i }))

const rotationNodeOptions = computed(() => {
  const options: any[] = []
  for (const [groupName, nodes] of Object.entries(nodesStore.groupedNodes)) {
    options.push({
      type: 'group',
      label: groupName,
      key: groupName,
      children: nodes.filter(n => n.status).map(node => ({
        label: node.title,
        value: node.url,
      })),
    })
  }
  return options
})

const selectedRotationUrls = computed({
  get: () => settings.nodeRotation.nodes.map(n => n.url),
  set: (urls: string[]) => {
    const existing = new Map(settings.nodeRotation.nodes.map(n => [n.url, n]))
    const allNodes = Object.values(nodesStore.groupedNodes).flat()
    settings.nodeRotation.nodes = urls.map(url => {
      if (existing.has(url)) return existing.get(url)!
      const found = allNodes.find(n => n.url === url)
      return { url, label: found?.title || url, trafficLimit: 100, maxRuns: 1 }
    })
  },
})

function removeRotationNode(index: number) {
  settings.nodeRotation.nodes.splice(index, 1)
}

function onGroupModeChange(enabled: boolean) {
  settings.groupMode = enabled
  if (enabled) {
    settings.nodeRotation.enabled = false
    const firstGroup = Object.entries(nodesStore.groupedNodes).find(([, nodes]) => nodes.some(node => node.status))?.[0]
    if (!settings.groupValue && firstGroup) settings.groupValue = firstGroup
  }
}

function onRotationModeChange(enabled: boolean) {
  settings.nodeRotation.enabled = enabled
  if (enabled) settings.groupMode = false
}

const emit = defineEmits<{
  (e: 'back'): void
}>()
</script>

<template>
  <div class="subpanel">
    <div class="subpanel-titlebar">
      <div>
        <h3>面板设置</h3>
        <p>控制后台运行、自动启动与定时测速行为。</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-card">
        <div>
          <span>后台运行</span>
          <small>页面切后台后保持任务</small>
        </div>
        <NSwitch v-model:value="settings.runBackground" :disabled="settings.cronTab.status" size="medium" />
      </div>
      <div class="setting-card">
        <div>
          <span>自动运行</span>
          <small>打开页面后自动开始</small>
        </div>
        <NSwitch v-model:value="settings.autoStart" size="medium" />
      </div>
      <div class="setting-card">
        <div>
          <span>定时任务</span>
          <small>按时间间隔循环测速</small>
        </div>
        <NSwitch v-model:value="settings.cronTab.status" :disabled="panel.isRunning && !settings.cronTab.status" size="medium" />
      </div>
      <div class="setting-card">
        <div>
          <span>节点联测</span>
          <small>节点组内多通道同时测速</small>
        </div>
        <NSwitch :value="settings.groupMode" :disabled="panel.isRunning" size="medium" @update:value="onGroupModeChange" />
      </div>
      <div class="setting-card">
        <div>
          <span>节点轮换</span>
          <small>多节点按流量自动切换</small>
        </div>
        <NSwitch :value="settings.nodeRotation.enabled" :disabled="panel.isRunning" size="medium" @update:value="onRotationModeChange" />
      </div>
      <div class="setting-card">
        <div>
          <span>强防缓存</span>
          <small>防止浏览器缓存导致速率不准</small>
        </div>
        <NSwitch v-model:value="settings.noCache" size="medium" />
      </div>
    </div>

    <div v-if="settings.cronTab.status" class="cron-box">
      <h4>定时任务配置</h4>
      <div class="cron-grid">
        <div class="cron-span-2">
          <label>任务模式</label>
          <NSelect
            v-model:value="settings.cronTab.mode"
            :options="cronModeOptions"
            :disabled="panel.isRunning"
            size="small"
          />
        </div>
        <template v-if="settings.cronTab.mode === 'interval'">
          <div>
            <label>执行间隔</label>
            <NInputNumber
              v-model:value="settings.cronTab.section"
              :min="1"
              :disabled="panel.isRunning"
              placeholder="间隔"
              size="small"
            />
          </div>
          <div>
            <label>时间单位</label>
            <NSelect
              v-model:value="settings.cronTab.unit"
              :options="unitOptions"
              :disabled="panel.isRunning"
              size="small"
            />
          </div>
        </template>
        <div class="cron-span-2">
          <label>运行时段</label>
          <div class="cron-range">
            <NSelect
              v-model:value="settings.cronTab.onset"
              :options="hourOptions"
              :disabled="panel.isRunning"
              size="small"
            />
            <span class="cron-range-sep">至</span>
            <NSelect
              v-model:value="settings.cronTab.over"
              :options="hourOptions"
              :disabled="panel.isRunning"
              size="small"
            />
            <span class="cron-range-unit">时</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="settings.nodeRotation.enabled" class="rotation-box">
      <h4>节点轮换配置</h4>
      <div class="rotation-select">
        <label>选择节点</label>
        <NSelect
          v-model:value="selectedRotationUrls"
          :options="rotationNodeOptions"
          multiple
          :disabled="panel.isRunning"
          placeholder="选择参与轮换的节点..."
          size="small"
        />
      </div>
      <div v-if="settings.nodeRotation.nodes.length" class="rotation-list">
        <div class="rotation-head">
          <span>节点</span>
          <span>流量限制(MB)</span>
          <span>运行次数</span>
          <span></span>
        </div>
        <div v-for="(node, idx) in settings.nodeRotation.nodes" :key="node.url" class="rotation-row">
          <span class="rotation-label">{{ node.label }}</span>
          <NInputNumber
            v-model:value="node.trafficLimit"
            :min="1"
            :disabled="panel.isRunning"
            size="tiny"
            placeholder="MB"
          />
          <NInputNumber
            v-model:value="node.maxRuns"
            :min="0"
            :disabled="panel.isRunning"
            size="tiny"
            placeholder="0=无限"
          />
          <button class="rotation-remove" :disabled="panel.isRunning" @click="removeRotationNode(idx)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <small class="rotation-hint">流量限制：每个节点跑满指定 MB 后切换下一个。运行次数：0 表示无限循环。</small>
    </div>

    <button class="panel-button panel-button-ghost" @click="emit('back')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      返回面板
    </button>
  </div>
</template>

<style scoped>
.subpanel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.subpanel-titlebar h3 {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0;
  line-height: 1.25;
}

.subpanel-titlebar p {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.setting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  min-height: 72px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-subtle);
}

.setting-card span {
  display: block;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
}

.setting-card small {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.35;
}

.cron-box {
  padding: 13px;
  border: 1px solid rgba(0, 112, 243, 0.16);
  border-radius: 10px;
  background: rgba(0, 112, 243, 0.04);
}

.cron-box h4 {
  margin-bottom: 10px;
  color: var(--color-info);
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0;
}

.cron-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.cron-grid label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.cron-span-2 {
  grid-column: 1 / -1;
}

.cron-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cron-range .n-select {
  flex: 1;
}

.cron-range-sep {
  color: var(--text-muted);
  font-size: 12px;
  flex-shrink: 0;
}

.cron-range-unit {
  color: var(--text-muted);
  font-size: 12px;
  flex-shrink: 0;
}

.panel-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.panel-button:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
  background: var(--bg-subtle);
}

.panel-button svg {
  width: 14px;
  height: 14px;
}

@media (max-width: 860px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .cron-grid {
    grid-template-columns: 1fr;
  }
}

.rotation-box {
  padding: 13px;
  border: 1px solid rgba(16, 185, 129, 0.18);
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.04);
}

.rotation-box h4 {
  margin-bottom: 10px;
  color: #059669;
  font-size: 13px;
  font-weight: 650;
}

.rotation-select {
  margin-bottom: 10px;
}

.rotation-select label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.rotation-list {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-card);
}

.rotation-head,
.rotation-row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(80px, 1fr) minmax(80px, 1fr) 28px;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
}

@media (max-width: 420px) {
  .rotation-head {
    grid-template-columns: 1fr 1fr;
    gap: 4px 8px;
  }

  .rotation-head span:first-child {
    grid-column: 1 / -1;
  }

  .rotation-head span:last-child {
    display: none;
  }

  .rotation-row {
    grid-template-columns: 1fr 1fr 28px;
    gap: 6px 8px;
  }

  .rotation-row .rotation-label {
    grid-column: 1 / -1;
  }
}

.rotation-head {
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 650;
}

.rotation-row + .rotation-row {
  border-top: 1px solid var(--border-subtle);
}

.rotation-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
}

.rotation-remove {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.rotation-remove:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.rotation-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rotation-remove svg {
  width: 13px;
  height: 13px;
}

.rotation-hint {
  display: block;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
}
</style>
