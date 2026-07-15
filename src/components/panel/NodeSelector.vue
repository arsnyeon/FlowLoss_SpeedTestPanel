<script setup lang="ts">
import { computed } from 'vue'
import { NSelect, NTooltip } from 'naive-ui'
import { useNodesStore } from '@/stores/nodes'
import { useSettingsStore } from '@/stores/settings'
import { useClipboard } from '@vueuse/core'
import { usePanelStore } from '@/stores/panel'

const nodesStore = useNodesStore()
const settings = useSettingsStore()
const panel = usePanelStore()
const { copy, copied } = useClipboard()

const selectOptions = computed(() => {
  if (settings.groupMode) {
    return Object.entries(nodesStore.groupedNodes)
      .map(([groupName, nodes]) => ({
        label: `${groupName} · ${nodes.filter(node => node.status).length} 个节点`,
        value: groupName,
        disabled: !nodes.some(node => node.status),
      }))
      .filter(option => !option.disabled)
  }
  const options: any[] = []
  for (const [groupName, nodes] of Object.entries(nodesStore.groupedNodes)) {
    if (nodes.length === 0) continue

    options.push({
      type: 'group',
      label: groupName,
      key: groupName,
      children: nodes.map(node => ({
        label: node.title,
        value: node.url,
        disabled: !node.status,
      })),
    })
  }
  return options
})

const selectedValue = computed({
  get: () => settings.groupMode ? settings.groupValue : settings.urlValue,
  set: (value: string) => {
    if (settings.groupMode) settings.groupValue = value
    else settings.urlValue = value
  },
})

const emit = defineEmits<{
  (e: 'editNodes'): void
}>()

function copyUrl() {
  if (!settings.groupMode && settings.urlValue) {
    copy(settings.urlValue)
  }
}
</script>

<template>
  <div>
    <div class="flex gap-2 min-w-0">
      <NSelect
        v-model:value="selectedValue"
        :options="selectOptions"
        :placeholder="settings.groupMode ? '选择节点组...' : '选择节点...'"
        :disabled="panel.isChecking"
        class="flex-1 min-w-0"
        size="medium"
      />
      <NTooltip trigger="hover">
        <template #trigger>
          <button class="fl-btn-ghost shrink-0" :disabled="settings.groupMode" @click="copyUrl" aria-label="复制链接">
            <svg v-if="!copied" class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg v-else class="w-[14px] h-[14px]" style="color: var(--color-success)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </template>
        {{ settings.groupMode ? '节点联测不提供单一链接' : copied ? '已复制' : '复制链接' }}
      </NTooltip>
      <NTooltip trigger="hover">
        <template #trigger>
          <button class="fl-btn-ghost shrink-0" @click="emit('editNodes')" aria-label="自定义节点">
            <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </template>
        自定义节点
      </NTooltip>
    </div>
  </div>
</template>
