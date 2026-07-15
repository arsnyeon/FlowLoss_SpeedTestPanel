<script setup lang="ts">
import { NSlider } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <div class="space-y-3" style="padding-top: 4px">
    <div class="flex items-center justify-between">
      <label class="text-[12px] font-medium leading-none" style="color: var(--text-secondary)">
        并发线程
      </label>
      <div class="flex items-center gap-2">
        <span class="text-[10px] uppercase tracking-wider leading-none" style="color: var(--text-muted); letter-spacing: 0.08em">
          移动端建议 ≤ 10
        </span>
        <span class="font-mono text-[12px] font-semibold tabular-nums leading-none px-2.5 rounded inline-flex items-center justify-center" style="background: var(--bg-subtle); color: var(--text-primary); min-width: 32px; height: 24px; text-align: center">
          {{ settings.threadNum }}
        </span>
      </div>
    </div>
    <NSlider
      v-model:value="settings.threadNum"
      :min="1"
      :max="64"
      :step="1"
      :tooltip="false"
    />
  </div>
</template>
