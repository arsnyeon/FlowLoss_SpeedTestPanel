<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import LoginModal from '@/components/user/LoginModal.vue'
import UserPopover from '@/components/user/UserPopover.vue'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)
const themeMenuOpen = ref(false)
const showLoginModal = ref(false)
const showUserPopover = ref(false)
const checkingUser = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const navItems = [
  { id: 0, label: '首页', path: '/' },
  { id: 1, label: '关于', path: '/about' },
]

function navigate(path: string) {
  void router.push(path)
  mobileMenuOpen.value = false
}

async function handleUserClick() {
  if (checkingUser.value) return
  checkingUser.value = true
  showUserPopover.value = false
  try {
    await userStore.checkStatus()
    if (userStore.isLoggedIn) {
      showUserPopover.value = true
      showLoginModal.value = false
    } else {
      showLoginModal.value = true
    }
  } finally {
    checkingUser.value = false
    mobileMenuOpen.value = false
  }
}

function handleLoginSuccess() {
  showLoginModal.value = false
  showUserPopover.value = true
  void userStore.checkStatus()
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (showUserPopover.value && !(target && userMenuRef.value?.contains(target))) {
    showUserPopover.value = false
  }
  if (themeMenuOpen.value) {
    const wrap = document.querySelector('.theme-menu-wrap')
    if (!(target && wrap?.contains(target))) themeMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  void userStore.checkStatus()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <div class="site-header-space">
    <header
      class="fixed top-0 left-0 right-0 z-50"
      style="background: var(--bg-body); border-bottom: 1px solid var(--border)"
    >
      <div class="fl-shell h-[56px] flex items-center">
        <div class="brand-link" @click="navigate('/')" aria-label="FlowLoss 首页">
          <span class="brand-logo-slot" aria-hidden="true">
            <img src="/favicon.png" alt="" class="brand-logo-img" />
          </span>
          <span class="brand-wordmark" aria-label="FlowLoss">FlowLoss</span>
        </div>

        <nav class="hidden md:flex items-center h-full flex-1 min-w-0">
          <a
            v-for="item in navItems"
            :key="item.id"
            class="nav-item"
            :class="{ 'is-active': route.path === item.path }"
            @click="navigate(item.path)"
          >
            {{ item.label }}
          </a>
        </nav>

        <div class="flex-1 md:hidden" />

        <div class="flex items-center gap-1.5 shrink-0">
          <div class="theme-menu-wrap">
            <button
              class="fl-btn-ghost"
              @click="themeMenuOpen = !themeMenuOpen"
              aria-label="切换主题"
            >
              <svg v-if="appStore.themeMode === 'light'" class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              <svg v-else-if="appStore.themeMode === 'dark'" class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <svg v-else class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18" />
                <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" opacity="0.15" />
              </svg>
            </button>
            <Transition name="menu-fade">
              <div v-if="themeMenuOpen" class="theme-menu" @click="themeMenuOpen = false">
                <button :class="{ active: appStore.themeMode === 'light' }" @click="appStore.setThemeMode('light')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                  日间模式
                </button>
                <button :class="{ active: appStore.themeMode === 'dark' }" @click="appStore.setThemeMode('dark')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  夜间模式
                </button>
                <button :class="{ active: appStore.themeMode === 'auto' }" @click="appStore.setThemeMode('auto')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v18" />
                    <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" opacity="0.15" />
                  </svg>
                  跟随系统
                </button>
              </div>
            </Transition>
          </div>

          <div ref="userMenuRef" class="user-entry">
            <button
              class="user-trigger"
              :class="{ 'is-open': showUserPopover, 'is-loading': checkingUser }"
              @click="handleUserClick"
              aria-label="用户"
              :aria-expanded="showUserPopover"
            >
              <img
                v-if="userStore.isLoggedIn"
                :src="userStore.avatar || `https://q.qlogo.cn/headimg_dl?dst_uin=${userStore.uin}&spec=640`"
                class="w-full h-full object-cover"
                alt="avatar"
              />
              <div v-else class="user-trigger-empty">
                <svg v-if="!checkingUser" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <svg v-else class="w-3.5 h-3.5 fl-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                  <path d="M12 3a9 9 0 1 1-6.36 2.64" />
                </svg>
              </div>
            </button>

            <Transition name="account-pop">
              <div v-if="showUserPopover" class="user-popover-wrap">
                <UserPopover
                  @close="showUserPopover = false"
                  @logout="showUserPopover = false"
                />
              </div>
            </Transition>
          </div>

          <button
            class="fl-btn-ghost mobile-menu-trigger"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Menu"
          >
            <svg v-if="!mobileMenuOpen" class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
            <svg v-else class="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <Transition name="fade-slide">
        <div
          v-if="mobileMenuOpen"
          class="md:hidden"
          style="background: var(--bg-body); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border)"
        >
          <nav class="fl-shell py-3 flex flex-col gap-0.5">
            <a
              v-for="item in navItems"
              :key="item.id"
              class="px-3 py-3 rounded-md text-[14px] font-medium transition-colors cursor-pointer"
              :style="{
                color: route.path === item.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: route.path === item.path ? 'var(--bg-subtle)' : 'transparent',
              }"
              @click="navigate(item.path)"
            >
              {{ item.label }}
            </a>
          </nav>
        </div>
      </Transition>
    </header>
    <LoginModal
      :show="showLoginModal"
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<style scoped>
.site-header-space {
  height: 56px;
  flex: 0 0 56px;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 100%;
  margin-right: 34px;
  cursor: pointer;
  user-select: none;
  flex: 0 0 auto;
}

.brand-logo-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.brand-logo-img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.brand-wordmark {
  position: relative;
  display: inline-block;
  color: #63728d;
  font-family: "Audiowide", Bahnschrift, "Arial Narrow", "Segoe UI", Arial, sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: 0;
  text-transform: uppercase;
}

.nav-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 2px;
  margin: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s ease;
}

.nav-item:hover,
.nav-item.is-active {
  color: var(--text-primary);
}

.nav-item.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px 2px 0 0;
}

.mobile-menu-trigger {
  display: none;
}

.user-entry {
  position: relative;
}

.user-trigger {
  width: 32px;
  height: 32px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-input);
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.user-trigger:hover,
.user-trigger.is-open {
  border-color: var(--text-muted);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}

.dark .user-trigger:hover,
.dark .user-trigger.is-open {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.07);
}

.user-trigger-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.user-popover-wrap {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 70;
}

.account-pop-enter-active,
.account-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  transform-origin: top right;
}

.account-pop-enter-from,
.account-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

@media (max-width: 767px) {
  .mobile-menu-trigger {
    display: inline-flex;
  }
}

@media (max-width: 520px) {
  .brand-link {
    gap: 8px;
    margin-right: 12px;
  }

  .brand-logo-slot {
    width: 26px;
    height: 26px;
    border-radius: 7px;
  }

  .brand-wordmark {
    font-size: 16px;
  }

  .user-trigger {
    width: 28px;
    height: 28px;
  }

  .user-popover-wrap {
    position: fixed;
    top: 66px;
    right: 10px;
    left: 10px;
    display: flex;
    justify-content: flex-end;
  }
}

.theme-menu-wrap {
  position: relative;
}

.theme-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 200;
  min-width: 130px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.theme-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.theme-menu button:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.theme-menu button.active {
  color: var(--color-accent);
  font-weight: 600;
}

.theme-menu button svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
