<script setup lang="ts">
import { ref } from 'vue'
import { usePanelStore } from '@/stores/panel'

const panel = usePanelStore()
const predictOpen = ref(false)

const emit = defineEmits<{
  (e: 'setFlowMax'): void
  (e: 'setLimitMax'): void
}>()

function handleResetTraffic() {
  panel.resetTraffic()
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Total Traffic -->
    <div class="fl-stat" @click="emit('setFlowMax')">
      <div class="flex items-center justify-between mb-3">
        <span class="text-[11px] font-medium uppercase tracking-wider" style="color: var(--text-muted); letter-spacing: 0.05em">
          总流量
        </span>
        <svg class="w-3.5 h-3.5" style="color: var(--text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      </div>
      <div class="font-mono text-[22px] font-semibold tabular-nums truncate" style="color: var(--text-primary); letter-spacing: -0.03em">
        {{ panel.show.allUsed || '--' }}
      </div>
      <div class="stat-footer mt-1">
        <span>累计下载</span>
        <button
          class="reset-traffic-btn"
          type="button"
          aria-label="重置总流量"
          title="重置总流量"
          :disabled="panel.bytesUsed <= 0"
          @click.stop="handleResetTraffic"
        >
          重置
        </button>
      </div>
    </div>

    <!-- Speed -->
    <div
      class="fl-stat speed-stat"
      tabindex="0"
      @mouseenter="predictOpen = true"
      @mouseleave="predictOpen = false"
      @focus="predictOpen = true"
      @blur="predictOpen = false"
      @click="predictOpen = !predictOpen"
    >
      <div class="flex items-center justify-between mb-3">
        <span class="text-[11px] font-medium uppercase tracking-wider" style="color: var(--text-muted); letter-spacing: 0.05em">
          {{ panel.isRunning ? '实时速度' : '平均速度' }}
        </span>
        <svg class="w-3.5 h-3.5" style="color: var(--text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <div class="font-mono text-[22px] font-semibold tabular-nums truncate" :style="{ color: panel.isRunning ? 'var(--color-accent)' : 'var(--text-primary)', letterSpacing: '-0.03em' }">
        {{ panel.show.speed || '--' }}
      </div>
      <div class="mt-1 flex items-center gap-1 text-[11px]" style="color: var(--text-muted)">
        <span v-if="panel.isRunning" class="fl-pulse-dot" style="width: 6px; height: 6px" />
        {{ panel.isRunning ? '正在监测' : '已停止' }}
      </div>

      <Transition name="predict-pop">
        <div v-if="predictOpen" class="predict-panel" @click.stop>
          <div class="predict-head">
            <span>用量预测</span>
            <small>按当前速度估算</small>
          </div>
          <div class="predict-grid">
            <span>每分钟</span>
            <strong>{{ panel.predict.min }}</strong>
            <span>每小时</span>
            <strong>{{ panel.predict.hour }}</strong>
            <span>每天</span>
            <strong>{{ panel.predict.day }}</strong>
            <span>每月</span>
            <strong>{{ panel.predict.mon }}</strong>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Bandwidth -->
    <div class="fl-stat" @click="emit('setLimitMax')">
      <div class="flex items-center justify-between mb-3">
        <span class="text-[11px] font-medium uppercase tracking-wider" style="color: var(--text-muted); letter-spacing: 0.05em">
          带宽
        </span>
        <svg class="w-3.5 h-3.5" style="color: var(--text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </div>
      <div class="font-mono text-[22px] font-semibold tabular-nums truncate" style="color: var(--text-primary); letter-spacing: -0.03em">
        {{ panel.show.speedBit || '--' }}
      </div>
      <div class="mt-1 text-[11px]" style="color: var(--text-muted)">
        峰值吞吐
      </div>
    </div>

    <!-- Runtime -->
    <div class="fl-stat">
      <div class="flex items-center justify-between mb-3">
        <span class="text-[11px] font-medium uppercase tracking-wider" style="color: var(--text-muted); letter-spacing: 0.05em">
          运行时长
        </span>
        <svg class="w-3.5 h-3.5" style="color: var(--text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div class="font-mono text-[22px] font-semibold tabular-nums truncate" style="color: var(--text-primary); letter-spacing: -0.03em">
        {{ panel.runTimeShow || '00:00' }}
      </div>
      <div class="mt-1 text-[11px]" style="color: var(--text-muted)">
        本次会话
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-muted);
  font-size: 11px;
}


.reset-traffic-btn {
  min-width: 38px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 650;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, opacity 0.16s ease;
}

.reset-traffic-btn:hover:not(:disabled),
.reset-traffic-btn:focus-visible {
  border-color: var(--text-muted);
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.reset-traffic-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.reset-traffic-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.speed-stat {
  position: relative;
  cursor: pointer;
  outline: none;
}

.speed-stat:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.predict-panel {
  position: absolute;
  left: 50%;
  top: calc(100% + 10px);
  z-index: 30;
  width: min(240px, calc(100vw - 36px));
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
  transform: translateX(-50%);
}

.predict-panel::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  width: 10px;
  height: 10px;
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  background: var(--bg-card);
  transform: translateX(-50%) rotate(45deg);
}

.predict-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
}

.predict-head span {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 750;
}

.predict-head small {
  color: var(--text-muted);
  font-size: 10px;
}

.predict-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7px 14px;
  align-items: center;
}

.predict-grid span {
  color: var(--text-muted);
  font-size: 11px;
}

.predict-grid strong {
  min-width: 0;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 750;
  text-align: right;
  overflow-wrap: anywhere;
}

.predict-pop-enter-active,
.predict-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.predict-pop-enter-from,
.predict-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

@media (max-width: 520px) {
  .predict-panel {
    left: auto;
    right: 0;
    transform: none;
  }

  .predict-panel::before {
    left: auto;
    right: 28px;
    transform: rotate(45deg);
  }

  .predict-pop-enter-from,
  .predict-pop-leave-to {
    transform: translateY(-4px);
  }
}
</style>
