<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found fl-shell">
    <div class="not-found-inner">
      <h1>404</h1>
      <p class="not-found-desc">抱歉，你访问的页面不存在</p>
      <p class="not-found-hint">页面可能已被移除，或者链接地址有误</p>
      <button class="fl-btn-primary not-found-btn" @click="router.push('/')">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
}

.not-found-inner {
  text-align: center;
}

.not-found-inner h1 {
  font-size: 64px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  line-height: 1;
}

.not-found-desc {
  margin-top: 14px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.not-found-hint {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.not-found-btn {
  margin-top: 28px;
  height: 38px;
  padding: 0 20px;
  font-size: 13px;
  gap: 6px;
}
</style>
