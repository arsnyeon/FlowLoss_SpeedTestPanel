<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useFormatter } from '@/composables/useFormatter'
import { useUserUsageRows } from '@/composables/useUserUsageRows'

const userStore = useUserStore()
const { formatBytes } = useFormatter()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const dosageText = computed(() => formatBytes(userStore.dosage))
const actionMessage = ref('')
const showPrev = ref(false)
const showRank = ref(false)
const rankDataRef = computed(() => userStore.rankData)
const { rows } = useUserUsageRows(rankDataRef, showPrev, showRank)

async function kickOther() {
  if (!userStore.isLoggedIn) {
    actionMessage.value = '请先登录账号'
    return
  }
  const resp = await userStore.kickOtherDevices()
  if (resp.status === 0) {
    actionMessage.value = '其他设备已下线'
  } else {
    actionMessage.value = '未知错误，请稍后再试'
  }
}
</script>

<template>
  <div class="subpanel">
    <div class="profile-card">
      <div class="avatar-ring">
        <img
          v-if="userStore.isLoggedIn && (userStore.avatar || userStore.uin)"
          :src="userStore.avatar || `https://q.qlogo.cn/headimg_dl?dst_uin=${userStore.uin}&spec=640`"
          alt="avatar"
        />
        <div v-else class="avatar-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>
      <div>
        <div class="profile-name">{{ userStore.username || '未登录用户' }}</div>
        <div class="profile-meta">UIN: {{ userStore.uin || '-' }}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-row">
        <span>本机历史流量</span>
        <strong>{{ dosageText }}</strong>
      </div>
      <div class="info-row">
        <span>用户昵称</span>
        <strong>{{ userStore.username || '-' }}</strong>
      </div>
    </div>

    <div v-if="rows.length" class="usage-table">
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

    <div v-if="actionMessage" class="action-message">{{ actionMessage }}</div>

    <div class="action-row">
      <button class="panel-button panel-button-ghost" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回面板
      </button>
      <button class="panel-button panel-button-warning" @click="kickOther">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        下线其他设备
      </button>
    </div>
  </div>
</template>

<style scoped>
.subpanel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--bg-subtle), var(--bg-card));
}

.avatar-ring {
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  border-radius: 50%;
  padding: 3px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg-input);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  color: var(--text-muted);
}

.avatar-placeholder svg {
  width: 24px;
  height: 24px;
}

.profile-name {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0;
  line-height: 1.35;
}

.profile-meta {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-card);
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  padding: 11px 13px;
}

.info-row + .info-row {
  border-top: 1px solid var(--border-subtle);
}

.info-row span {
  color: var(--text-secondary);
  font-size: 12px;
}

.info-row strong {
  min-width: 0;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 650;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-table {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
}

.usage-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-card);
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

.usage-head,
.usage-row {
  display: grid;
  grid-template-columns: 0.8fr 1.1fr 1fr 1fr;
  gap: 8px;
  align-items: center;
  padding: 9px 11px;
}

.usage-head {
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 650;
}

.usage-row + .usage-row {
  border-top: 1px solid var(--border-subtle);
}

.usage-row span,
.usage-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.action-message {
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 12px;
}

.usage-row span {
  color: var(--text-secondary);
}

.usage-row strong {
  color: var(--text-primary);
  font-weight: 650;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.panel-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 0;
  height: 38px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
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
  background: var(--bg-subtle);
}

.panel-button-warning {
  background: rgba(245, 166, 35, 0.1);
  border-color: rgba(245, 166, 35, 0.26);
  color: #9a640d;
}

.panel-button-warning:hover {
  background: rgba(245, 166, 35, 0.16);
  border-color: rgba(245, 166, 35, 0.38);
}

.dark .panel-button-warning {
  color: #f5a623;
}

@media (max-width: 520px) {
  .action-row {
    grid-template-columns: 1fr;
  }
}
</style>
