<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { NButton, NCheckbox, NInput, NModal, NPagination, NSelect, useMessage } from 'naive-ui'
import { useNodesStore, type CustomNode, type CustomNodeMethod } from '@/stores/nodes'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'
import { copyText } from '@/utils/clipboard'
import {
  findCustomNodeDuplicate,
  getCustomNodeDuplicateMessage,
  normalizeNodeLabel,
  normalizeNodeUrl,
} from '@/utils/customNodes'
import {
  createCustomNodeProfile,
  downloadCustomNodeProfile,
  isCustomNodeProfileFilename,
  maskUin,
  parseCustomNodeProfileFile,
  type ParsedCustomNodeProfile,
} from '@/utils/customNodeProfiles'
import { validateSpeedNodeUrl, checkBlockList } from '@/utils/nodeConnectivity'

const nodesStore = useNodesStore()
const settings = useSettingsStore()
const userStore = useUserStore()
const message = useMessage()

const label = ref('')
const value = ref('')
const group = ref<string | null>(null)
const listFilterGroup = ref<string | null>(null)
const exportFilterGroup = ref<string | null>(null)
const listSearchKeyword = ref('')
const exportSearchKeyword = ref('')
const checking = ref(false)
const currentPage = ref(1)
const copiedNodeValue = ref('')
const openActionKey = ref('')
const openSharedByKey = ref('')
const showExportModal = ref(false)
const showEditModal = ref(false)
const showGroupModal = ref(false)
const selectedExportKeys = ref<string[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const importPreview = ref<ParsedCustomNodeProfile | null>(null)
const importAvatarFailed = ref(false)
const editingNode = ref<CustomNode | null>(null)
const newGroupName = ref('')
const editForm = ref({
  label: '',
  value: '',
  group: null as string | null,
  method: 'GET' as CustomNodeMethod,
  postData: '',
})
const pageSize = 5
let copiedTimer: number | null = null

function getNodeGroup(node: CustomNode) {
  return node.group || '默认'
}

function filterNodesByGroup(nodes: CustomNode[], groupName: string | null) {
  return groupName ? nodes.filter(node => getNodeGroup(node) === groupName) : nodes
}

function filterNodesByName(nodes: CustomNode[], keyword: string) {
  const text = keyword.trim().toLowerCase()
  return text ? nodes.filter(node => node.label.toLowerCase().includes(text)) : nodes
}

const filteredCustomNodes = computed(() => filterNodesByName(filterNodesByGroup(nodesStore.customNodes, listFilterGroup.value), listSearchKeyword.value))
const pagedCustomNodes = computed(() => filteredCustomNodes.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const exportableNodes = computed(() => filterNodesByName(filterNodesByGroup(nodesStore.customNodes, exportFilterGroup.value), exportSearchKeyword.value))
const selectedExportNodes = computed(() => {
  const keys = new Set(selectedExportKeys.value)
  return exportableNodes.value.filter(node => keys.has(getNodeKey(node)))
})
const groupOptions = computed(() => nodesStore.customNodeGroups.map(item => ({ label: item, value: item })))
const importAvatarUrl = computed(() => importPreview.value?.profile.user.avatar || '')
const importNickname = computed(() => importPreview.value?.profile.user.nickname || '匿名用户')
const importDisplayName = computed(() => {
  const uin = importPreview.value?.profile.user.uin || ''
  return uin ? `${importNickname.value}(${maskUin(uin)})` : importNickname.value
})
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'HEAD', value: 'HEAD' },
]

const emit = defineEmits<{
  (e: 'back'): void
}>()

const isHttpsPage = window.location.protocol === 'https:'
function isValidUrl(url: string): boolean {
  return /https?:\/\/([\w-]+\.)+[\w-]+(:[0-9]+)?(\/\S*)?/.test(url)
}

async function addNode() {
  if (!label.value) {
    message.warning('请输入节点名称')
    return
  }
  if (!isValidUrl(value.value)) {
    message.warning('请输入有效的节点链接（以 http:// 或 https:// 开头）')
    return
  }
  const duplicate = findCustomNodeDuplicate(nodesStore.customNodes, label.value, value.value)
  if (duplicate) {
    message.warning(getCustomNodeDuplicateMessage(duplicate))
    return
  }

  checking.value = true
  const url = normalizeNodeUrl(value.value)
  const blockResult = checkBlockList(url)
  if (!blockResult.status) {
    checking.value = false
    message.error(blockResult.info)
    return
  }
  const localResult = await validateSpeedNodeUrl(url)
  if (!localResult.status) {
    checking.value = false
    message.error(`节点连通性检测失败：${localResult.info}`)
    return
  }
  checking.value = false

  nodesStore.addCustomNode(normalizeNodeLabel(label.value), normalizeNodeUrl(value.value), 'GET', '', group.value || '')
  message.success('节点添加成功')
  label.value = ''
  value.value = ''
  group.value = null
}

function deleteNode(node: any) {
  nodesStore.removeCustomNode(node)
  openActionKey.value = ''
  openSharedByKey.value = ''
}

function openEditNode(node: CustomNode) {
  openActionKey.value = ''
  openSharedByKey.value = ''
  editingNode.value = node
  editForm.value = {
    label: node.label,
    value: node.value,
    group: node.group || null,
    method: node.method || 'GET',
    postData: node.postData || '',
  }
  showEditModal.value = true
}

function submitEditNode() {
  if (!editingNode.value) return
  if (!editForm.value.label.trim()) {
    message.warning('请输入节点名称')
    return
  }
  if (!isValidUrl(editForm.value.value)) {
    message.warning('请输入有效的节点链接（以 http:// 或 https:// 开头）')
    return
  }
  const duplicate = findCustomNodeDuplicate(
    nodesStore.customNodes.filter(node => node !== editingNode.value),
    editForm.value.label,
    editForm.value.value,
  )
  if (duplicate) {
    message.warning(getCustomNodeDuplicateMessage(duplicate))
    return
  }
  const ok = nodesStore.updateCustomNode(editingNode.value, {
    label: normalizeNodeLabel(editForm.value.label),
    value: normalizeNodeUrl(editForm.value.value),
    group: editForm.value.group || '',
    method: editForm.value.method,
    postData: editForm.value.method === 'POST' ? editForm.value.postData : '',
  })
  if (!ok) {
    message.error('节点不存在或已被删除')
    return
  }
  message.success('节点已更新')
  showEditModal.value = false
  editingNode.value = null
}

function addGroup() {
  if (!newGroupName.value.trim()) {
    message.warning('请输入节点组名称')
    return
  }
  const ok = nodesStore.addCustomNodeGroup(newGroupName.value)
  if (!ok) {
    message.warning('节点组已存在')
    return
  }
  message.success('节点组已添加')
  newGroupName.value = ''
}

function deleteGroup(name: string) {
  const ok = nodesStore.removeCustomNodeGroup(name)
  if (!ok) {
    message.warning('默认节点组不能删除')
    return
  }
  if (group.value === name) group.value = null
  if (editForm.value.group === name) editForm.value.group = null
  message.success('节点组已删除，相关节点已移到默认')
}

function updateListFilterGroup(value: string | null) {
  listFilterGroup.value = value
  currentPage.value = 1
}

function updateListSearchKeyword(value: string) {
  listSearchKeyword.value = value
  currentPage.value = 1
}

function updateExportFilterGroup(value: string | null) {
  exportFilterGroup.value = value
  selectedExportKeys.value = exportableNodes.value.map(getNodeKey)
}

function updateExportSearchKeyword(value: string) {
  exportSearchKeyword.value = value
  selectedExportKeys.value = exportableNodes.value.map(getNodeKey)
}

function getNodeKey(node: CustomNode) {
  return `${node.label}\n${node.value}`
}

function toggleActionMenu(node: CustomNode) {
  const key = getNodeKey(node)
  openSharedByKey.value = ''
  openActionKey.value = openActionKey.value === key ? '' : key
}

function toggleSharedBy(node: CustomNode) {
  const key = getNodeKey(node)
  openActionKey.value = ''
  openSharedByKey.value = openSharedByKey.value === key ? '' : key
}

function openExportModal() {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录后再导出节点')
    return
  }
  if (nodesStore.customNodes.length === 0) {
    message.warning('没有可导出的自定义节点')
    return
  }
  exportFilterGroup.value = null
  exportSearchKeyword.value = ''
  selectedExportKeys.value = nodesStore.customNodes.map(getNodeKey)
  showExportModal.value = true
}

function getCurrentUserProfile() {
  return {
    uin: userStore.uin,
    avatar: userStore.avatar,
    nickname: userStore.username || userStore.uin || '匿名用户',
  }
}

function createShareNode(node: CustomNode): CustomNode {
  const { group, sharedBy, ...shareNode } = node
  return shareNode
}

function shareNode(node: CustomNode) {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录后再分享节点')
    return
  }
  const profile = createCustomNodeProfile([createShareNode(node)], getCurrentUserProfile())
  downloadCustomNodeProfile(profile)
  openActionKey.value = ''
  openSharedByKey.value = ''
  message.success('已导出单节点分享文件')
}

function toggleExportNode(node: CustomNode, checked: boolean) {
  const key = getNodeKey(node)
  if (checked) {
    if (!selectedExportKeys.value.includes(key)) selectedExportKeys.value.push(key)
    return
  }
  selectedExportKeys.value = selectedExportKeys.value.filter(item => item !== key)
}

function toggleAllExportNodes(checked: boolean) {
  selectedExportKeys.value = checked ? exportableNodes.value.map(getNodeKey) : []
}

function confirmExport() {
  if (selectedExportNodes.value.length === 0) {
    message.warning('请选择要导出的节点')
    return
  }
  const profile = createCustomNodeProfile(selectedExportNodes.value, {
    ...getCurrentUserProfile(),
  })
  downloadCustomNodeProfile(profile)
  showExportModal.value = false
  message.success(`已导出 ${selectedExportNodes.value.length} 个节点`)
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!isCustomNodeProfileFilename(file.name)) {
    message.warning('仅支持导入 .conf 格式的节点配置文件')
    return
  }

  try {
    const raw = await file.text()
    const parsed = parseCustomNodeProfileFile(raw, nodesStore.customNodes)
    if (parsed.importableNodes.length === 0) {
      message.warning(parsed.skippedCount > 0 ? '配置里的节点已存在或无效' : '配置里没有可导入节点')
      return
    }
    importAvatarFailed.value = false
    importPreview.value = parsed
  } catch (error) {
    message.error(error instanceof Error ? error.message : '导入配置读取失败')
  }
}

function confirmImport() {
  if (!importPreview.value) return
  const nodes = importPreview.value.importableNodes
  nodesStore.addCustomNodes(nodes)
  message.success(`已导入 ${nodes.length} 个节点`)
  importPreview.value = null
}

async function copyLink(url: string) {
  const copied = await copyText(url)
  if (!copied) return
  openActionKey.value = ''
  openSharedByKey.value = ''
  copiedNodeValue.value = url
  if (copiedTimer !== null) window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    copiedNodeValue.value = ''
  }, 1300)
}

function closeActionMenuOnOutsidePointerDown(event: PointerEvent) {
  if (!openActionKey.value) return
  const target = event.target
  if (!(target instanceof Element) || !target.closest('.node-actions')) {
    openActionKey.value = ''
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeActionMenuOnOutsidePointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', closeActionMenuOnOutsidePointerDown)
  if (copiedTimer !== null) window.clearTimeout(copiedTimer)
})
</script>

<template>
  <div class="subpanel">
    <div class="subpanel-titlebar">
      <div>
        <h3>自定义节点</h3>
        <p>添加临时测速地址，数据只保存在当前浏览器。</p>
      </div>
      <div class="title-actions">
        <span class="subpanel-badge">{{ nodesStore.customNodes.length }} 个</span>
        <span class="node-tool-wrap">
          <button type="button" class="node-tool-button node-group-button" aria-label="节点组管理" @click="showGroupModal = true">
            <svg t="1783681351839" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9814" width="200" height="200">
              <path fill="currentColor" d="M454.656 171.008v113.664h114.688V171.008h-114.688z m0-57.344h114.688q23.552 0 39.936 16.896t16.384 40.448v113.664q0 23.552-16.384 39.936t-39.936 16.384h-114.688q-23.552 0-39.936-16.384t-16.384-39.936V171.008q0-23.552 16.384-40.448t39.936-16.896zM113.664 739.328v113.664h113.664v-113.664H113.664z m0-56.32h113.664q23.552 0 40.448 16.384t16.896 39.936v113.664q0 23.552-16.896 40.448t-40.448 16.896H113.664q-23.552 0-39.936-16.896t-16.384-40.448v-113.664q0-23.552 16.384-39.936t39.936-16.384z m340.992 56.32v113.664h114.688v-113.664h-114.688z m0-56.32h114.688q23.552 0 39.936 16.384t16.384 39.936v113.664q0 23.552-16.384 40.448t-39.936 16.896h-114.688q-23.552 0-39.936-16.896t-16.384-40.448v-113.664q0-23.552 16.384-39.936t39.936-16.384z m342.016 56.32v113.664h113.664v-113.664h-113.664z m0-56.32h113.664q23.552 0 39.936 16.384t16.384 39.936v113.664q0 23.552-16.384 40.448t-39.936 16.896h-113.664q-23.552 0-40.448-16.896t-16.896-40.448v-113.664q0-23.552 16.896-39.936t40.448-16.384z m-636.928 0q22.528-69.632 70.144-125.44t113.152-90.112 140.288-39.424v-143.36h57.344v143.36q74.752 5.12 140.288 39.424t113.152 90.112 70.144 125.44H803.84q-32.768-81.92-103.424-136.192t-159.744-62.464v198.656h-57.344v-198.656q-89.088 8.192-159.744 62.464T220.16 683.008H159.744z" p-id="9815"></path>
            </svg>
          </button>
          <span class="node-tool-popover" role="tooltip">节点组管理</span>
        </span>
        <span class="node-tool-wrap">
          <button type="button" class="node-tool-button" aria-label="导入节点配置" @click="triggerImport">
            <svg t="1783680485374" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3587" width="200" height="200">
              <path fill="currentColor" d="M926.4 637.7H299c-17.7 0-32-14.3-32-32s14.3-32 32-32h627.4c17.7 0 32 14.3 32 32s-14.3 32-32 32z" p-id="3588"></path>
              <path fill="currentColor" d="M529.6 872.2c-8.2 0-16.4-3.1-22.6-9.4L281.2 637c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l225.8 225.8c12.5 12.5 12.5 32.8 0 45.3-6.3 6.3-14.5 9.4-22.7 9.4z" p-id="3589"></path>
              <path fill="currentColor" d="M304.1 628.8c-8.2 0-16.4-3.1-22.6-9.4-12.5-12.5-12.5-32.8 0-45.3l225.8-225.8c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L326.7 619.4c-6.2 6.3-14.4 9.4-22.6 9.4z" p-id="3590"></path>
              <path fill="currentColor" d="M447.6 958.3H229.1c-89.3 0-162-72.7-162-162V228.2c0-89.3 72.7-162 162-162h568.1c89.3 0 162 72.7 162 162v208.1c0 17.7-14.3 32-32 32s-32-14.3-32-32V228.2c0-54-44-98-98-98H229.1c-54 0-98 44-98 98v568.1c0 54 44 98 98 98h218.5c17.7 0 32 14.3 32 32s-14.3 32-32 32z" p-id="3591"></path>
            </svg>
          </button>
          <span class="node-tool-popover" role="tooltip">导入节点配置</span>
        </span>
        <span class="node-tool-wrap">
          <button type="button" class="node-tool-button" aria-label="导出节点配置" @click="openExportModal">
            <svg t="1783680490565" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6212" width="200" height="200">
              <path fill="currentColor" d="M909.5 671.4h-625c-17.7 0-32-14.3-32-32s14.3-32 32-32h625c17.7 0 32 14.3 32 32s-14.3 32-32 32z" p-id="6213"></path>
              <path fill="currentColor" d="M904.8 662.7c-8.2 0-16.4-3.1-22.6-9.4l-225-225c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l225 225c12.5 12.5 12.5 32.8 0 45.3-6.3 6.3-14.5 9.4-22.7 9.4z" p-id="6214"></path>
              <path fill="currentColor" d="M679.5 905.2c-8.2 0-16.4-3.1-22.6-9.4-12.5-12.5-12.5-32.8 0-45.3l225-225c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-225 225c-6.3 6.3-14.5 9.4-22.7 9.4z" p-id="6215"></path>
              <path fill="currentColor" d="M448.2 958.3H229.7c-89.3 0-162-72.7-162-162V228.2c0-89.3 72.7-162 162-162h568.1c89.3 0 162 72.7 162 162v208.1c0 17.7-14.3 32-32 32s-32-14.3-32-32V228.2c0-54-44-98-98-98H229.7c-54 0-98 44-98 98v568.1c0 54 44 98 98 98h218.5c17.7 0 32 14.3 32 32s-14.3 32-32 32z" p-id="6216"></path>
            </svg>
          </button>
          <span class="node-tool-popover" role="tooltip">导出节点配置</span>
        </span>
        <input ref="fileInputRef" class="hidden-file-input" type="file" accept=".conf" @change="handleImportFile" />
      </div>
    </div>

    <div class="node-form">
      <NInput v-model:value="label" placeholder="节点名称" size="small" />
      <NInput v-model:value="value" placeholder="节点链接 (https://...)" size="small" :status="value && !isValidUrl(value) ? 'error' : undefined" />
      <NSelect v-model:value="group" class="custom-node-select compact" :options="groupOptions" placeholder="节点组（默认）" size="small" clearable />
      <div v-if="value && !isValidUrl(value)" class="validation-hint error">
        请输入有效的 URL（以 http:// 或 https:// 开头）
      </div>
      <div v-else-if="value && isValidUrl(value) && isHttpsPage && value.startsWith('http://')" class="validation-hint warning">
        当前页面为 HTTPS，HTTP 节点可能无法访问
      </div>
      <div class="action-row">
        <button type="button" class="panel-button panel-button-ghost" @click="emit('back')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回面板
        </button>
        <button
          type="button"
          class="panel-button panel-button-primary"
          :disabled="!isValidUrl(value) || !label || checking"
          @click="addNode"
        >
          <svg v-if="checking" class="fl-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ checking ? '检测中' : '添加节点' }}
        </button>
      </div>
    </div>

    <div class="notice-line">
      <span class="notice-icon">!</span>
      <span>HTTPS 页面无法请求 HTTP 链接；目标服务器需要允许跨域访问。</span>
    </div>

    <div class="notice-line warning">
      <svg class="warning-icon" viewBox="0 0 1098 1024" fill="#FB6547">
        <path d="M610.892409 345.817428C611.128433 343.63044 611.249529 341.409006 611.249529 339.159289 611.249529 305.277109 583.782594 277.810176 549.900416 277.810176 516.018238 277.810176 488.551303 305.277109 488.551303 339.159289 488.551303 339.229063 488.55142 339.298811 488.551654 339.368531L488.36115 339.368531 502.186723 631.80002C502.185201 631.957072 502.184441 632.114304 502.184441 632.271715 502.184441 658.624519 523.547611 679.98769 549.900416 679.98769 576.253221 679.98769 597.616391 658.624519 597.616391 632.271715 597.616391 631.837323 597.610587 631.404284 597.599053 630.972676L610.892409 345.817428ZM399.853166 140.941497C481.4487 1.632048 613.916208 1.930844 695.336733 140.941497L1060.013239 763.559921C1141.608773 902.869372 1076.938039 1015.801995 915.142835 1015.801995L180.047065 1015.801995C18.441814 1015.801995-46.243866 902.570576 35.176659 763.559921L399.853166 140.941497ZM549.900416 877.668165C583.782594 877.668165 611.249529 850.201231 611.249529 816.319053 611.249529 782.436871 583.782594 754.96994 549.900416 754.96994 516.018238 754.96994 488.551303 782.436871 488.551303 816.319053 488.551303 850.201231 516.018238 877.668165 549.900416 877.668165Z" />
      </svg>
      <span>请勿用于非法用途，使用本功能造成的一切后果由用户承担。</span>
    </div>

    <div class="node-list">
      <div v-if="nodesStore.customNodes.length > 0" class="node-filter-row">
        <NInput
          :value="listSearchKeyword"
          placeholder="搜索节点名称"
          size="small"
          clearable
          @update:value="updateListSearchKeyword"
        />
        <NSelect
          :value="listFilterGroup"
          class="custom-node-select compact"
          :options="groupOptions"
          placeholder="全部节点组"
          size="small"
          clearable
          @update:value="updateListFilterGroup"
        />
      </div>
      <div v-if="filteredCustomNodes.length > 0" class="custom-node-stack">
        <div
          v-for="(node, index) in pagedCustomNodes"
          :key="index"
          class="node-item"
        >
          <div class="node-info">
            <div class="node-title">{{ node.label }}</div>
            <div class="node-url" :title="node.value">{{ node.value }}</div>
            <div class="node-time">
              <span class="node-group">{{ node.group || '默认' }}</span>
              <button
                v-if="node.sharedBy"
                type="button"
                class="shared-by-avatar"
                :class="{ open: openSharedByKey === getNodeKey(node) }"
                aria-label="查看分享者"
                @click.stop="toggleSharedBy(node)"
              >
                <img v-if="node.sharedBy.avatar" :src="node.sharedBy.avatar" alt="" />
                <span v-else>{{ node.sharedBy.nickname.slice(0, 1) }}</span>
                <span class="shared-by-popover">
                  <span class="shared-by-popover-avatar">
                    <img v-if="node.sharedBy.avatar" :src="node.sharedBy.avatar" alt="" />
                    <span v-else>{{ node.sharedBy.nickname.slice(0, 1) }}</span>
                  </span>
                  <span>此节点由{{ node.sharedBy.nickname }}({{ node.sharedBy.uin }})分享</span>
                </span>
              </button>
              <span>{{ node.time }}</span>
            </div>
          </div>
          <div class="node-actions" :class="{ open: openActionKey === getNodeKey(node) }">
            <button
              type="button"
              class="node-icon-button node-menu-item edit"
              title="编辑"
              aria-label="编辑节点"
              @click.stop="openEditNode(node)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>
            <button
              type="button"
              class="node-icon-button node-menu-item share"
              title="分享"
              aria-label="分享节点"
              @click.stop="shareNode(node)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 13.51l6.83 3.98" />
                <path d="M15.41 6.51 8.59 10.49" />
              </svg>
            </button>
            <button
              type="button"
              class="node-icon-button node-menu-item copy"
              :class="{ copied: copiedNodeValue === node.value }"
              title="复制"
              :aria-label="copiedNodeValue === node.value ? '已复制节点链接' : '复制节点链接'"
              @click.stop="copyLink(node.value)"
            >
              <svg v-if="copiedNodeValue !== node.value" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              type="button"
              class="node-icon-button node-menu-item danger"
              title="删除"
              aria-label="删除节点"
              @click.stop="deleteNode(node)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button
              type="button"
              class="node-icon-button node-menu-toggle"
              :aria-label="openActionKey === getNodeKey(node) ? '关闭节点菜单' : '打开节点菜单'"
              @click.stop="toggleActionMenu(node)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.9" />
                <circle cx="12" cy="12" r="1.9" />
                <circle cx="19" cy="12" r="1.9" />
              </svg>
            </button>
          </div>
        </div>

        <NPagination
          v-if="filteredCustomNodes.length > pageSize"
          v-model:page="currentPage"
          :page-count="Math.ceil(filteredCustomNodes.length / pageSize)"
          size="small"
          class="justify-center mt-3"
        />
      </div>
      <div v-else-if="nodesStore.customNodes.length > 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 7h16M4 12h10M4 17h7" />
        </svg>
        <span>当前节点组没有节点</span>
      </div>
      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14" />
          <rect x="3" y="3" width="18" height="18" rx="4" />
        </svg>
        <span>没有自定义节点</span>
      </div>
    </div>

    <NModal v-model:show="showExportModal" preset="card" title="导出节点" style="width: min(460px, 92vw);" :mask-closable="false">
      <div class="export-panel">
        <NSelect
          :value="exportFilterGroup"
          class="custom-node-select"
          :options="groupOptions"
          placeholder="全部节点组"
          clearable
          @update:value="updateExportFilterGroup"
        />
        <NInput
          :value="exportSearchKeyword"
          placeholder="搜索节点名称"
          clearable
          @update:value="updateExportSearchKeyword"
        />
        <NCheckbox
          :checked="exportableNodes.length > 0 && selectedExportNodes.length === exportableNodes.length"
          :indeterminate="selectedExportNodes.length > 0 && selectedExportNodes.length < exportableNodes.length"
          :disabled="exportableNodes.length === 0"
          @update:checked="toggleAllExportNodes"
        >
          全选当前筛选
        </NCheckbox>
        <div class="export-node-list">
          <label v-for="node in exportableNodes" :key="getNodeKey(node)" class="export-node-item">
            <NCheckbox :checked="selectedExportKeys.includes(getNodeKey(node))" @update:checked="checked => toggleExportNode(node, checked)" />
            <span>
              <strong>{{ node.label }}</strong>
              <em>{{ node.group || '默认' }}</em>
              <small>{{ node.value }}</small>
            </span>
          </label>
          <div v-if="exportableNodes.length === 0" class="export-empty">当前节点组没有可导出的节点</div>
        </div>
        <div class="modal-actions">
          <NButton @click="showExportModal = false">取消</NButton>
          <NButton type="primary" @click="confirmExport">导出 {{ selectedExportNodes.length }} 个</NButton>
        </div>
      </div>
    </NModal>

    <NModal v-model:show="showEditModal" preset="card" title="编辑节点" style="width: min(460px, 92vw);" :mask-closable="false">
      <div class="edit-node-form">
        <NInput v-model:value="editForm.label" placeholder="节点名称" />
        <NInput v-model:value="editForm.value" placeholder="节点链接 (https://...)" :status="editForm.value && !isValidUrl(editForm.value) ? 'error' : undefined" />
        <NSelect v-model:value="editForm.group" class="custom-node-select" :options="groupOptions" placeholder="节点组（默认）" clearable />
        <NSelect v-model:value="editForm.method" class="custom-node-select" :options="methodOptions" />
        <NInput
          v-if="editForm.method === 'POST'"
          v-model:value="editForm.postData"
          type="textarea"
          placeholder="POST 参数，例如：a=1&b=2 或 JSON"
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
        <div class="modal-actions">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" @click="submitEditNode">保存</NButton>
        </div>
      </div>
    </NModal>

    <NModal v-model:show="showGroupModal" preset="card" title="节点组管理" style="width: min(420px, 92vw);" :mask-closable="false">
      <div class="group-panel">
        <div class="group-add-row">
          <NInput v-model:value="newGroupName" placeholder="新节点组名称" @keyup.enter="addGroup" />
          <NButton type="primary" @click="addGroup">添加</NButton>
        </div>
        <div class="group-list">
          <div v-for="item in nodesStore.customNodeGroups" :key="item" class="group-item">
            <span>{{ item }}</span>
            <NButton size="small" tertiary type="error" :disabled="item === '默认'" @click="deleteGroup(item)">删除</NButton>
          </div>
        </div>
        <div class="modal-actions single">
          <NButton @click="showGroupModal = false">完成</NButton>
        </div>
      </div>
    </NModal>

    <NModal :show="Boolean(importPreview)" preset="card" title="导入节点" style="width: min(420px, 92vw);" :mask-closable="false" @update:show="value => { if (!value) importPreview = null }">
      <div v-if="importPreview" class="import-confirm">
        <div class="share-avatar">
          <img v-if="importAvatarUrl && !importAvatarFailed" :src="importAvatarUrl" alt="" @error="importAvatarFailed = true" />
          <span v-else>{{ importNickname.slice(0, 1) }}</span>
        </div>
        <div class="import-title">{{ importDisplayName }} 分享了 {{ importPreview.importableNodes.length }} 个节点</div>
        <div class="import-subtitle">是否确定导入？</div>
        <div class="modal-actions">
          <NButton @click="importPreview = null">取消</NButton>
          <NButton type="primary" @click="confirmImport">确定导入</NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.subpanel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  overflow: visible;
}

.subpanel-titlebar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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

.subpanel-badge {
  flex: 0 0 auto;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 9px;
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.4;
}

.title-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.node-tool-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.node-tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.node-tool-button:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.node-tool-button svg {
  width: 14px;
  height: 14px;
}

.node-tool-popover {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  z-index: 30;
  display: inline-flex;
  align-items: center;
  width: max-content;
  max-width: min(220px, calc(100vw - 48px));
  padding: 8px 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 7px;
  background: #1f1f1f;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.node-tool-popover::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  z-index: -1;
  width: 9px;
  height: 9px;
  background: #1f1f1f;
  transform: translate(-50%, -50%) rotate(45deg);
}

.node-tool-wrap:hover .node-tool-popover,
.node-tool-wrap:focus-within .node-tool-popover {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.node-group-button svg {
  width: 16px;
  height: 16px;
}

.hidden-file-input {
  display: none;
}

.node-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 9px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-subtle);
}

.custom-node-select {
  --custom-select-height: 36px;
}

.custom-node-select.compact {
  --custom-select-height: 28px;
}

:deep(.custom-node-select .n-base-selection) {
  min-height: var(--custom-select-height) !important;
}

:deep(.custom-node-select .n-base-selection-label) {
  display: flex;
  align-items: center;
  min-height: var(--custom-select-height);
}

:deep(.custom-node-select .n-base-selection-placeholder),
:deep(.custom-node-select .n-base-selection-input),
:deep(.custom-node-select .n-base-selection-input__content) {
  display: flex;
  align-items: center;
  height: var(--custom-select-height);
  line-height: 1.2;
}

:deep(.custom-node-select .n-base-selection__border),
:deep(.custom-node-select .n-base-selection__state-border) {
  border-radius: 6px;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.export-panel {
  display: grid;
  gap: 12px;
}

.edit-node-form {
  display: grid;
  gap: 10px;
}


.export-node-list {
  display: grid;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
}

.node-filter-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.export-node-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-subtle);
}

.export-node-item span {
  min-width: 0;
}

.export-node-item strong,
.export-node-item em,
.export-node-item small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-node-item strong {
  color: var(--text-primary);
  font-size: 13px;
}

.export-node-item em {
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 11px;
  font-style: normal;
}

.export-node-item small {
  margin-top: 3px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 11px;
}

.export-empty {
  padding: 18px 10px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

.modal-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  width: 100%;
}

.modal-actions.single {
  grid-template-columns: minmax(0, 1fr);
}

.group-panel {
  display: grid;
  gap: 12px;
}

.group-add-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 9px;
}

.group-list {
  display: grid;
  gap: 8px;
  max-height: 280px;
  overflow: auto;
}

.group-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-subtle);
}

.group-item span {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-confirm {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

.import-confirm .modal-actions {
  margin-top: 4px;
  justify-self: stretch;
}

.share-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 20px;
  font-weight: 700;
}

.share-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.import-title {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 650;
}

.import-subtitle {
  color: var(--text-secondary);
  font-size: 13px;
}

.panel-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 0;
  height: 38px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.panel-button svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.panel-button-ghost {
  background: var(--bg-card);
  color: var(--text-secondary);
}

.panel-button-ghost:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.panel-button-primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--accent-on-primary);
}

.panel-button-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.panel-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.notice-line {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 12px;
  border: 1px solid rgba(245, 166, 35, 0.22);
  border-radius: 6px;
  background: rgba(245, 166, 35, 0.08);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f5a623;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.warning-icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}

.node-list {
  padding-top: 2px;
  padding-bottom: 24px;
  overflow: visible;
}

.custom-node-stack {
  display: grid;
  gap: 7px;
}

.node-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 50px 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
  overflow: visible;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.node-item:hover {
  border-color: var(--text-muted);
  background: var(--bg-subtle);
}

.node-info {
  min-width: 0;
  max-width: 100%;
  flex: 1;
  overflow: visible;
}

.node-title {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shared-by-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  overflow: visible;
  padding: 0;
  vertical-align: middle;
}

.shared-by-avatar img,
.shared-by-popover-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shared-by-avatar img {
  border-radius: 50%;
}

.shared-by-popover {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: max-content;
  max-width: min(280px, calc(100vw - 48px));
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.shared-by-popover::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  z-index: -1;
  width: 8px;
  height: 8px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  transform: translate(-50%, -50%) rotate(45deg);
}

.shared-by-avatar:hover .shared-by-popover,
.shared-by-avatar:focus-visible .shared-by-popover,
.shared-by-avatar.open .shared-by-popover {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.shared-by-popover-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 50%;
  background: var(--bg-subtle);
  color: var(--text-muted);
}

.node-url {
  margin-top: 4px;
  overflow: hidden;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-time {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  overflow: visible;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-group {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 42%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 1px 5px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-actions {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 34px;
  height: 34px;
  z-index: 1;
  transform: translateY(-50%);
}

.node-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.node-icon-button:hover {
  background: var(--bg-input-hover);
  color: var(--text-primary);
}

.node-icon-button.copied {
  color: var(--color-success);
}

.node-icon-button.danger {
  color: var(--color-danger);
}

.node-icon-button svg {
  width: 15px;
  height: 15px;
}

.node-menu-toggle {
  position: absolute;
  inset: 2px;
  z-index: 4;
  background: var(--bg-subtle);
}

.node-actions.open .node-menu-toggle {
  background: var(--accent-primary);
  color: var(--accent-on-primary);
  transform: rotate(90deg);
}

.node-menu-item {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 3;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-card);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
  opacity: 0;
  pointer-events: none;
  transform: translate(0, 0) scale(0.55);
  transition:
    transform 0.26s cubic-bezier(.18, .9, .22, 1.15),
    opacity 0.22s ease,
    background-color 0.15s ease,
    color 0.15s ease;
}

.node-menu-item.edit {
  transition-delay: 0s;
}

.node-menu-item.copy {
  transition-delay: 0.04s;
}

.node-menu-item.danger {
  transition-delay: 0.08s;
}

.node-menu-item.share {
  transition-delay: 0.02s;
}

.node-actions.open .node-menu-item {
  opacity: 1;
  pointer-events: auto;
}

.node-actions.open .node-menu-item.edit {
  transform: translate(-30px, -42px) scale(1);
  transition-delay: 0.02s;
}

.node-actions.open .node-menu-item.share {
  transform: translate(-52px, -16px) scale(1);
  transition-delay: 0.06s;
}

.node-actions.open .node-menu-item.copy {
  transform: translate(-52px, 18px) scale(1);
  transition-delay: 0.1s;
}

.node-actions.open .node-menu-item.danger {
  transform: translate(-30px, 44px) scale(1);
  transition-delay: 0.14s;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 104px;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.empty-state svg {
  width: 34px;
  height: 34px;
  color: var(--border);
}

.validation-hint {
  font-size: 12px;
  line-height: 1.4;
  padding: 0 2px;
}

.validation-hint.error {
  color: var(--color-danger);
}

.validation-hint.warning {
  color: #f5a623;
}

@media (max-width: 640px) {
  .subpanel-titlebar {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .title-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-row {
    grid-template-columns: 1fr;
  }

  .group-add-row {
    grid-template-columns: 1fr;
  }

  .node-item {
    padding-right: 48px;
  }

  .node-actions {
    right: 8px;
  }

  .node-title,
  .node-url,
  .node-time {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-time {
    overflow: visible;
  }

  .shared-by-popover {
    left: 0;
    transform: translateY(4px);
  }

  .shared-by-popover::before {
    left: 9px;
  }

  .shared-by-avatar:hover .shared-by-popover,
  .shared-by-avatar:focus-visible .shared-by-popover,
  .shared-by-avatar.open .shared-by-popover {
    transform: translateY(0);
  }

  .node-actions.open .node-menu-item.edit {
    transform: translate(-28px, -38px) scale(1);
  }

  .node-actions.open .node-menu-item.share {
    transform: translate(-47px, -14px) scale(1);
  }

  .node-actions.open .node-menu-item.copy {
    transform: translate(-47px, 17px) scale(1);
  }

  .node-actions.open .node-menu-item.danger {
    transform: translate(-28px, 40px) scale(1);
  }
}
</style>
