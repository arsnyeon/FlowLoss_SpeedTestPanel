<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useNetworkStore } from '@/stores/network'
import { useUserStore } from '@/stores/user'

const { copy, copied } = useClipboard()
const networkStore = useNetworkStore()
const userStore = useUserStore()

interface IpData {
  ip: string
  address: string
  countryCode?: string
}

const localIp = ref<IpData | null>(null)
const cloudflareIp = ref<IpData | null>(null)
const localLatency = ref<{ ms: number | string; level: 'good' | 'ok' | 'bad' | '' }>({ ms: '-', level: '' })
const cloudflareLatency = ref<{ ms: number | string; level: 'good' | 'ok' | 'bad' | '' }>({ ms: '-', level: '' })
const loading = ref(true)
const isVisible = ref(true)

let timers: number[] = []
let apiFailed = false

function getLevel(ms: number): 'good' | 'ok' | 'bad' {
  if (ms <= 30) return 'good'
  if (ms >= 100) return 'bad'
  return 'ok'
}

function formatAddress(info: any, ip: string) {
  const parts = Array.isArray(info?.regions_short)
    ? [...info.regions_short]
    : Array.isArray(info?.regions)
      ? [...info.regions]
      : []

  if (info?.country?.code && info.country.code !== 'CN' && info.country.name) {
    parts.unshift(info.country.name)
  }
  if (info?.as) {
    parts.push(info.as.info || info.as.name)
  }
  if (info?.type) {
    parts.push(info.type)
  }

  const address = parts.filter(Boolean).join(' ')
  return {
    ip,
    address: address || ip,
    countryCode: info?.country?.code,
  }
}

async function cachedQuery(ip: string) {
  const cacheKey = 'cache_ip'
  const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}')
  const cached = cache[ip]
  const now = Date.now() / 1000

  if (cached && now - cached.time <= 60 * 60 * 24) {
    return cached
  }

  if (apiFailed) throw new Error('api unavailable')

  let info
  try {
    const resp = await userStore.apiRequest(`ip?ip=${encodeURIComponent(ip)}`)
    info = resp?.data || resp || {}
  } catch {
    apiFailed = true
    throw new Error('api unavailable')
  }
  cache[ip] = { ...info, time: now }
  localStorage.setItem(cacheKey, JSON.stringify(cache))
  return info
}

async function watchLocalIp() {
  if (isVisible.value && !apiFailed) {
    try {
      const resp = await userStore.apiRequest('ip')
      const info = resp?.data || resp || {}
      if (info.ip) {
        const cacheKey = 'cache_ip'
        const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}')
        cache[info.ip] = { ...info, time: Date.now() / 1000 }
        localStorage.setItem(cacheKey, JSON.stringify(cache))
        localIp.value = formatAddress(info, info.ip)
        loading.value = false
      }
    } catch {
      apiFailed = true
    }
  }
  timers.push(window.setTimeout(watchLocalIp, 60000))
}

async function watchCloudflare() {
  if (isVisible.value) {
    try {
      const start = Date.now()
      const response = await fetch('https://cp.cloudflare.com/cdn-cgi/trace', { referrerPolicy: 'no-referrer' })
      const lay = Date.now() - start
      const resp = await response.text()
      const match = resp.match(/ip=([0-9a-f.:]+)/)
      if (match) {
        const info = await cachedQuery(match[1])
        cloudflareIp.value = formatAddress(info, match[1])
        cloudflareLatency.value = { ms: lay, level: getLevel(lay) }
        networkStore.setCloudflareLatency(lay)
      }
    } catch {
      cloudflareLatency.value = { ms: '-', level: '' }
      networkStore.setCloudflareLatency(0)
    }
  }
  timers.push(window.setTimeout(watchCloudflare, 1000))
}

async function getCNLatency() {
  if (isVisible.value) {
    try {
      const start = Date.now()
      await fetch('https://connectivitycheck.platform.hicloud.com/generate_204', {
        method: 'HEAD', cache: 'no-store', mode: 'no-cors', referrerPolicy: 'no-referrer',
      })
      const ms = Date.now() - start
      localLatency.value = { ms, level: getLevel(ms) }
      networkStore.setLocalLatency(ms)
    } catch {
      localLatency.value = { ms: '-', level: '' }
      networkStore.setLocalLatency(0)
    }
  }
  timers.push(window.setTimeout(getCNLatency, 1000))
}

function onVisibilityChange() {
  isVisible.value = document.visibilityState === 'visible'
}

function copyIp(ip: string) {
  copy(ip)
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  watchLocalIp()
  watchCloudflare()
  getCNLatency()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  timers.forEach(t => clearTimeout(t))
})
</script>

<template>
  <div class="fl-card flex-1">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 flex items-center justify-center" style="color: var(--text-secondary)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <h3 class="text-[14px] font-semibold tracking-tight" style="color: var(--text-primary)">
          出口地址
        </h3>
      </div>
      <span v-if="copied" class="text-[11px]" style="color: var(--color-success)">已复制</span>
    </div>

    <div v-if="loading" class="flex items-center gap-2 py-2">
      <div
        class="w-3 h-3 rounded-full fl-spin"
        style="border: 1.5px solid var(--border); border-top-color: var(--text-primary)"
      />
      <span class="text-[12px]" style="color: var(--text-muted)">正在检测...</span>
    </div>

    <TransitionGroup v-else name="ip-row-fade" tag="div" class="ip-list">
      <div
        v-if="localIp && localIp.countryCode === 'CN'"
        key="local"
        class="ip-row"
        :data-ip="localIp.ip"
        @click="copyIp(localIp.ip)"
      >
        <div class="ip-main">
          <span class="ip-label">
            国内
          </span>
          <span class="ip-address" :title="localIp.ip">{{ localIp.address }}</span>
        </div>
        <span class="ip-latency" :class="`latency-${localLatency.level || 'none'}`">
          {{ localLatency.ms }} ms
        </span>
      </div>

      <div
        v-if="cloudflareIp && cloudflareIp.countryCode !== 'CN'"
        key="foreign"
        class="ip-row"
        :data-ip="cloudflareIp.ip"
        @click="copyIp(cloudflareIp.ip)"
      >
        <div class="ip-main">
          <span class="ip-label">
            国外
          </span>
          <span class="ip-address" :title="cloudflareIp.ip">{{ cloudflareIp.address }}</span>
        </div>
        <span class="ip-latency" :class="`latency-${cloudflareLatency.level || 'none'}`">
          {{ cloudflareLatency.ms }} ms
        </span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ip-list {
  position: relative;
  display: grid;
  gap: 6px;
  margin-top: 4px;
}

.ip-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  padding: 7px 10px;
  border: 0;
  border-radius: 7px;
  background: var(--bg-subtle);
  cursor: pointer;
  transition: background 0.15s ease;
}

.ip-row:hover {
  background: var(--bg-input-hover);
}

.ip-row::after {
  content: attr(data-ip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  z-index: 30;
  width: max-content;
  max-width: min(240px, calc(100vw - 36px));
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 750;
  line-height: 1.35;
  letter-spacing: -0.01em;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-align: center;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%) translateY(5px);
  transition: opacity 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.ip-row::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: calc(100% + 5px);
  z-index: 31;
  width: 10px;
  height: 10px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%) rotate(45deg);
  transition: opacity 0.16s ease;
}

.ip-row:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.ip-row:hover::before {
  opacity: 1;
}

.ip-row-fade-enter-active,
.ip-row-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.ip-row-fade-enter-from,
.ip-row-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.ip-row-fade-leave-active {
  position: absolute;
}

.ip-row-fade-move {
  transition: transform 0.18s ease;
}

.ip-main {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex: 1;
}

.ip-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 18px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 750;
}

.ip-address {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-latency {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 22px;
  flex: 0 0 auto;
  border-radius: 6px;
  background: var(--bg-subtle);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.latency-good {
  background: rgba(80, 227, 164, 0.12);
  color: #16a34a;
}

.latency-ok {
  background: rgba(245, 166, 35, 0.14);
  color: #d97706;
}

.latency-bad {
  background: rgba(238, 0, 0, 0.08);
  color: #dc2626;
}

.latency-none {
  color: var(--text-muted);
}

@media (max-width: 520px) {
  .ip-row {
    align-items: center;
    flex-direction: row;
    gap: 8px;
  }

  .ip-latency {
    align-self: center;
  }

  .ip-row::after {
    left: auto;
    right: 0;
    padding-inline: 11px;
    transform: translateY(5px);
  }

  .ip-row:hover::after {
    transform: translateY(0);
  }

  .ip-row::before {
    left: auto;
    right: 28px;
  }
}
</style>
