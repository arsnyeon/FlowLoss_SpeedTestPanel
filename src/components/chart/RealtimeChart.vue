<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import { useNetworkStore } from '@/stores/network'
import { useFormatter } from '@/composables/useFormatter'
import { formatDateTime } from '@/utils/date'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const settings = useSettingsStore()
const appStore = useAppStore()
const networkStore = useNetworkStore()
const { formatSpeed } = useFormatter()
const chartRef = ref()

const speedData = ref<[number, number][]>([[Date.now(), 0]])
const latencyData = ref<[number, number][]>([[Date.now(), 0]])

function formatChartTime(value: number) {
  return formatDateTime(new Date(value).toISOString())
}

function tooltipFormatter(params: any[]) {
  const rows = Array.isArray(params) ? params : []
  const speedPoint = rows.find(item => item.seriesName === '速率')
  const latencyPoint = rows.find(item => item.seriesName === '延迟')
  const timeValue = speedPoint?.data?.[0] ?? latencyPoint?.data?.[0] ?? Date.now()
  const speedValue = Number(speedPoint?.data?.[1]) || 0
  const latencyValue = Number(latencyPoint?.data?.[1]) || 0

  return `
    <div style="font-weight:600;margin-bottom:6px;color:inherit;">${formatChartTime(timeValue)}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:28px;line-height:1.8;">
      <span style="display:inline-flex;align-items:center;gap:7px;color:inherit;"><i style="width:8px;height:8px;border-radius:999px;background:#3B82F6;display:inline-block;"></i>速率</span>
      <strong style="font-weight:750;">${formatSpeed(speedValue)}</strong>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:28px;line-height:1.8;">
      <span style="display:inline-flex;align-items:center;gap:7px;color:inherit;"><i style="width:8px;height:8px;border-radius:999px;background:#50E3A4;display:inline-block;"></i>延迟</span>
      <strong style="font-weight:750;">${latencyValue > 0 ? Math.round(latencyValue) + ' ms' : '-'}</strong>
    </div>
  `
}

const option = computed(() => {
  const isDark = appStore.isDark
  const textMuted = isDark ? '#666666' : '#888888'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#111111' : '#FFFFFF',
      borderColor: isDark ? '#262626' : '#EAEAEA',
      borderWidth: 1,
      textStyle: { color: isDark ? '#EDEDED' : '#000000', fontSize: 12, fontFamily: 'Inter' },
      borderRadius: 6,
      padding: [8, 12],
      extraCssText: 'z-index: 40 !important; pointer-events: none; box-shadow: 0 4px 16px rgba(0,0,0,0.08);',
      formatter: tooltipFormatter,
    },
    legend: {
      data: [
        { name: '速率', icon: 'rect' },
        { name: '延迟', icon: 'rect' },
      ],
      bottom: 4,
      textStyle: { color: textMuted, fontSize: 11, fontFamily: 'Inter' },
      itemWidth: 10,
      itemHeight: 2,
      itemGap: 16,
    },
    grid: { left: 8, right: 8, top: 20, bottom: 28, containLabel: true },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          color: textMuted,
          fontSize: 10,
          fontFamily: 'Geist Mono',
          margin: 8,
          formatter: (value: number) => formatSpeed(value),
        },
        splitLine: { lineStyle: { color: gridColor, type: [4, 4] } },
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
      },
      {
        type: 'value',
        axisLabel: {
          color: textMuted,
          fontSize: 10,
          fontFamily: 'Geist Mono',
          margin: 8,
          formatter: (value: number) => value > 0 ? `${Math.round(value)}ms` : '0',
        },
        splitLine: { show: false },
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
      },
    ],
    series: [
      {
        name: '速率',
        type: 'line',
        smooth: 0.3,
        showSymbol: false,
        yAxisIndex: 0,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
        lineStyle: { color: '#3B82F6', width: 1.5 },
        itemStyle: { color: '#3B82F6' },
        data: speedData.value,
      },
      {
        name: '延迟',
        type: 'line',
        smooth: 0.3,
        showSymbol: false,
        yAxisIndex: 1,
        lineStyle: { color: '#50E3A4', width: 1.5 },
        itemStyle: { color: '#50E3A4' },
        data: latencyData.value,
      },
    ],
  }
})

function addDataPoint(speed: number, latency: number) {
  const now = Date.now()
  const latencyValue = latency || networkStore.localLatencyMs || networkStore.cloudflareLatencyMs || 0
  speedData.value.push([now, Number.isFinite(speed) ? speed : 0])
  latencyData.value.push([now, Number.isFinite(latencyValue) ? latencyValue : 0])

  if (speedData.value.length > 200) {
    speedData.value = speedData.value.slice(-100)
    latencyData.value = latencyData.value.slice(-100)
  }
}

function clearData() {
  speedData.value = [[Date.now(), 0]]
  latencyData.value = [[Date.now(), 0]]
}

defineExpose({ addDataPoint, clearData })
</script>

<template>
  <div class="fl-card mb-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 flex items-center justify-center" style="color: var(--text-secondary)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h3 class="text-[14px] font-semibold tracking-tight" style="color: var(--text-primary)">
          实时监控
        </h3>
        <span class="text-[11px]" style="color: var(--text-muted)">速率 / 延迟</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="fl-btn-ghost"
          :aria-label="settings.chartShow ? '关闭图表' : '开启图表'"
          @click="settings.chartShow = !settings.chartShow"
        >
          <svg v-if="settings.chartShow" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </button>
      </div>
    </div>

    <div v-show="settings.chartShow" class="h-[260px]">
      <VChart ref="chartRef" :option="option" autoresize />
    </div>
    <div
      v-show="!settings.chartShow"
      class="h-20 flex flex-col items-center justify-center gap-1 rounded-md"
      style="background: var(--bg-subtle)"
    >
      <svg class="w-4 h-4" style="color: var(--text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
      <span class="text-[12px]" style="color: var(--text-muted)">监控已关闭</span>
    </div>
  </div>
</template>
