<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const userStore = useUserStore()
const tokenInput = ref('')
const bindInput = ref('')
const tokenMessage = ref('')
const tokenMode = ref(false)
const bindInputRef = ref<HTMLInputElement | null>(null)

const canUseQr = computed(() => Boolean(userStore.loginQrImage))
const canUseToken = computed(() => !userStore.isCheckingStatus)
const qrUnavailableText = computed(() => {
  if (userStore.loginBusy || userStore.loginState === 'loading') return '二维码生成中'
  if (userStore.loginState === 'expired') return '二维码已过期'
  if (userStore.loginState === 'failed') return '二维码不可用'
  return '点击刷新二维码'
})

const statusText = computed(() => {
  if (userStore.loginState === 'binding') return userStore.loginError || '授权已确认，请完成 QQ 号码验证'
  if (userStore.loginState === 'expired') return '二维码超时，请刷新后重新扫码'
  if (userStore.loginState === 'failed') return userStore.loginError || '登录失败，请刷新二维码'
  if (userStore.loginState === 'success') return '登录成功'
  if (userStore.loginState === 'waiting') return `${userStore.loginMessage}${userStore.loginDots}`
  if (userStore.loginBusy || userStore.loginState === 'loading') return '正在连接登录服务'
  return userStore.loginMessage
})

watch(
  () => props.show,
  async (show) => {
    if (show) {
      tokenMode.value = false
      tokenMessage.value = ''
      bindInput.value = ''
      if (userStore.isLoggedIn) return
      await userStore.requestLoginQr(false)
    } else {
      userStore.stopLoginPolling()
    }
  },
)

watch(
  () => userStore.loginState,
  async (state) => {
    if (state === 'binding') {
      await nextTick()
      bindInputRef.value?.focus()
    }
    if (state === 'success') {
      emit('success')
      setTimeout(() => emit('close'), 320)
    }
  },
)

onBeforeUnmount(() => {
  userStore.stopLoginPolling()
})

async function refreshQr() {
  tokenMessage.value = ''
  if (userStore.loginBusy) return
  await userStore.requestLoginQr(true)
}

function toggleTokenMode() {
  tokenMode.value = !tokenMode.value
}

function openQQLogin() {
  if (!userStore.loginUrl) return
  window.open(userStore.loginUrl, '_blank', 'width=500,height=600')
}

async function submitToken() {
  const resp = await userStore.loginWithToken(tokenInput.value)
  if (resp.status === 0) {
    tokenMessage.value = '登录成功'
    tokenInput.value = ''
    emit('success')
    setTimeout(() => emit('close'), 260)
  } else {
    tokenMessage.value = resp.msg || 'AccessToken 过期或不可用'
  }
}

async function submitBind() {
  const resp = await userStore.bindQQ(bindInput.value)
  if (resp.status === 0) bindInput.value = ''
}

function closeModal() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="account-fade">
      <div v-if="show" class="account-modal-root" @click.self="closeModal">
        <div class="login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <button class="login-close" type="button" aria-label="关闭登录窗口" @click="closeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div class="login-head">
            <div class="login-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 id="login-title">用户登录</h2>
              <p>新用户登录后自动注册账号</p>
            </div>
          </div>

          <div class="login-body">
            <div class="qr-panel" :class="{ 'is-disabled': !canUseQr }" @click="refreshQr">
              <img v-if="canUseQr" :src="userStore.loginQrImage" alt="QQ 登录二维码" />
              <div v-else class="qr-placeholder">
                <svg v-if="userStore.loginBusy || userStore.loginState === 'loading'" class="fl-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M12 3a9 9 0 1 1-6.36 2.64" />
                </svg>
                <span>{{ qrUnavailableText }}</span>
              </div>
            </div>

            <div class="status-pill" :class="`state-${userStore.loginState}`">
              <span class="status-dot" />
              <span>{{ statusText }}</span>
            </div>

            <div v-if="userStore.loginState === 'binding'" class="bind-box">
              <label for="bind-qq">授权 QQ 号码</label>
              <div class="inline-form">
                <input
                  id="bind-qq"
                  ref="bindInputRef"
                  v-model="bindInput"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  placeholder="输入刚刚授权的 QQ"
                  @keydown.enter="submitBind"
                />
                <button type="button" :disabled="userStore.loginBusy" @click="submitBind">验证</button>
              </div>
            </div>

            <div class="quick-login-row">
              <button
                class="quick-action"
                type="button"
                :class="{ 'is-disabled': !userStore.loginUrl }"
                :disabled="!userStore.loginUrl"
                aria-label="QQ 账号快捷登录"
                @click="openQQLogin"
              >
                <svg viewBox="0 0 1024 1024" aria-hidden="true">
                  <path d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z" fill="currentColor" />
                </svg>
                QQ 快捷登录
              </button>
              <button
                class="quick-action"
                type="button"
                @click="toggleTokenMode"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Token 登录
              </button>
            </div>

            <Transition name="fade-slide">
              <div v-if="tokenMode" class="token-box">
                <label for="token-input">AccessToken</label>
                <div class="inline-form">
                  <input
                    id="token-input"
                    v-model="tokenInput"
                    type="password"
                    autocomplete="current-password"
                    placeholder="粘贴 AccessToken"
                    @keydown.enter="submitToken"
                  />
                  <button type="button" :disabled="!canUseToken" @click="submitToken">登录</button>
                </div>
                <p v-if="tokenMessage" class="form-message">{{ tokenMessage }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.account-modal-root {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(6px);
}

.login-dialog {
  position: relative;
  width: min(100%, 408px);
  max-height: min(720px, calc(100vh - 36px));
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
}

.login-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.login-close:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.login-close svg {
  width: 15px;
  height: 15px;
}

.login-head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 22px 22px 15px;
  border-bottom: 1px solid var(--border-subtle);
}

.login-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.login-icon svg {
  width: 20px;
  height: 20px;
}

.login-head h2 {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
}

.login-head p {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.login-body {
  padding: 18px 22px 16px;
}

.qr-panel {
  width: 186px;
  height: 186px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-subtle);
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.qr-panel:hover {
  border-color: var(--text-muted);
  background: var(--bg-card);
}

.qr-panel img {
  width: 168px;
  height: 168px;
  object-fit: contain;
  border-radius: 6px;
  background: #fff;
}

.qr-panel.is-disabled {
  cursor: pointer;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

.qr-placeholder svg {
  width: 22px;
  height: 22px;
}

.status-pill {
  width: fit-content;
  max-width: 100%;
  margin: 12px auto 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.3;
}

.status-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--text-muted);
}

.state-waiting .status-dot,
.state-loading .status-dot {
  background: var(--color-accent);
}

.state-binding .status-dot {
  background: var(--color-warning);
}

.state-success .status-dot {
  background: var(--color-success);
}

.state-expired .status-dot,
.state-failed .status-dot {
  background: var(--color-danger);
}

.quick-login-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-top: 15px;
}

.quick-action {
  min-width: 0;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.quick-action:hover {
  border-color: var(--text-muted);
  background: var(--bg-subtle);
}

.quick-action.is-disabled {
  pointer-events: none;
  color: var(--text-muted);
  background: var(--bg-subtle);
}

.quick-action svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.bind-box,
.token-box {
  margin-top: 13px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-subtle);
}

.bind-box label,
.token-box label {
  display: block;
  margin-bottom: 7px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.inline-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.inline-form input {
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.inline-form input:focus {
  border-color: var(--text-muted);
}

.inline-form button {
  height: 36px;
  padding: 0 13px;
  border: 1px solid var(--accent-primary);
  border-radius: 7px;
  background: var(--accent-primary);
  color: var(--accent-on-primary);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}

.inline-form button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.form-message {
  margin-top: 7px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.account-fade-enter-active,
.account-fade-leave-active {
  transition: opacity 0.18s ease;
}

.account-fade-enter-from,
.account-fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .account-modal-root {
    align-items: center;
    padding: 10px;
  }

  .login-dialog {
    width: 100%;
    max-height: calc(100vh - 20px);
    border-radius: 12px;
  }

  .login-head,
  .login-body {
    padding-left: 16px;
    padding-right: 16px;
  }

  .qr-panel {
    width: 170px;
    height: 170px;
  }

  .qr-panel img {
    width: 152px;
    height: 152px;
  }
}
</style>
