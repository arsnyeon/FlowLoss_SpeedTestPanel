<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useFormatter } from '@/composables/useFormatter'
import { useUserUsageRows } from '@/composables/useUserUsageRows'
import { useClipboard } from '@vueuse/core'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'logout'): void
}>()

const userStore = useUserStore()
const message = useMessage()
const { formatBytes } = useFormatter()
const actionMessage = ref('')
const actionBusy = ref(false)
const showPrev = ref(false)
const showRank = ref(false)
const { copy, copied: tokenCopied } = useClipboard()

const dosageText = computed(() => formatBytes(userStore.dosage))
const avatarUrl = computed(() => userStore.avatar || `https://q.qlogo.cn/headimg_dl?dst_uin=${userStore.uin || '10000'}&spec=640`)
const rankDataRef = computed(() => userStore.rankData)
const { rows } = useUserUsageRows(rankDataRef, showPrev, showRank)

async function kickOther() {
  if (actionBusy.value) return
  actionBusy.value = true
  actionMessage.value = ''
  const resp = await userStore.kickOtherDevices()
  actionMessage.value = resp.status === 0 ? '其他设备已下线' : (resp.msg || '操作失败，请稍后再试')
  actionBusy.value = false
}

function logout() {
  userStore.logout()
  emit('logout')
  emit('close')
}

function copyToken() {
  copy(userStore.token)
  message.success('AccessToken 复制成功')
}
</script>

<template>
  <div class="user-popover" role="dialog" aria-label="用户信息">
    <div class="user-card">
      <div class="avatar">
        <img :src="avatarUrl" alt="用户头像" />
      </div>
      <div class="user-main">
        <div class="user-name">{{ userStore.username || 'FlowLoss 用户' }}</div>
        <div class="user-meta">UIN: {{ userStore.uin || '-' }}</div>
      </div>
      <div class="card-actions">
        <button class="icon-close" type="button" aria-label="复制 AccessToken" @click="copyToken">
          <svg v-if="!tokenCopied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success)">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <button class="icon-close" type="button" aria-label="关闭用户浮层" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="summary-list">
      <div class="summary-row">
        <span>本机历史流量</span>
        <strong>{{ dosageText }}</strong>
      </div>
      <div class="summary-row">
        <span>登录状态</span>
        <strong>已连接</strong>
      </div>
    </div>

    <div class="usage-options" aria-label="用户统计显示选项">
      <label class="usage-check">
        <input v-model="showPrev" type="checkbox" />
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </span>
        上个统计周期
      </label>
      <label class="usage-check">
        <input v-model="showRank" type="checkbox" />
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </span>
        显示排名
      </label>
    </div>

    <div class="usage-box">
      <div class="usage-head">
        <span>周期</span>
        <span>总流量</span>
        <span>均速</span>
        <span>在线</span>
      </div>
      <div v-for="row in rows" :key="row.label" class="usage-row">
        <span>{{ row.label }}</span>
        <strong>{{ row.allUsed }}</strong>
        <strong>{{ row.averageSpeed }}</strong>
        <strong>{{ row.onlineTime }}</strong>
      </div>
    </div>

    <p v-if="actionMessage" class="action-message">{{ actionMessage }}</p>

    <div class="popover-actions">
      <button class="action-button" type="button" :disabled="actionBusy" @click="kickOther">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        下线其他设备
      </button>
      <button class="action-button is-danger" type="button" @click="logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 17l5-5-5-5M15 12H3M21 19V5" />
        </svg>
        退出登录
      </button>
    </div>
  </div>
</template>

<style scoped>
.user-popover {
  width: min(360px, calc(100vw - 24px));
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
}

.user-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 11px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-subtle);
}

.avatar {
  width: 46px;
  height: 46px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-card);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-main {
  min-width: 0;
}

.user-name {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.35;
}

.card-actions {
  display: flex;
  gap: 2px;
}

.icon-close {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.icon-close:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.icon-close svg {
  width: 14px;
  height: 14px;
}

.summary-list {
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 11px;
}

.summary-row + .summary-row {
  border-top: 1px solid var(--border-subtle);
}

.summary-row span {
  color: var(--text-secondary);
  font-size: 12px;
}

.summary-row strong {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.usage-check {
  min-width: 0;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.usage-check:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.usage-check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.usage-check span {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-card);
  color: transparent;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.usage-check svg {
  width: 11px;
  height: 11px;
}

.usage-check input:checked + span {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #fff;
}

.usage-check:has(input:checked) {
  border-color: rgba(59, 130, 246, 0.28);
  color: var(--color-accent);
  background: rgba(59, 130, 246, 0.06);
}

.usage-box {
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
}

.usage-head,
.usage-row {
  display: grid;
  grid-template-columns: 0.72fr 1.1fr 1fr 0.9fr;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
}

.usage-head {
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.usage-row + .usage-row {
  border-top: 1px solid var(--border-subtle);
}

.usage-row span,
.usage-row strong {
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-row span {
  color: var(--text-secondary);
}

.usage-row strong {
  color: var(--text-primary);
  font-weight: 650;
}

.action-message {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.popover-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.action-button {
  min-width: 0;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.action-button:hover {
  border-color: var(--text-muted);
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.action-button.is-danger {
  color: var(--color-danger);
  border-color: rgba(238, 0, 0, 0.22);
  background: rgba(238, 0, 0, 0.04);
}

.action-button.is-danger:hover {
  border-color: rgba(238, 0, 0, 0.34);
  background: rgba(238, 0, 0, 0.08);
}

@media (max-width: 420px) {
  .user-popover {
    width: calc(100vw - 20px);
  }

  .popover-actions {
    grid-template-columns: 1fr;
  }
}
</style>
