<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-auto" style="margin-top: 40px; border-top: 1px solid var(--border); background: var(--bg-body)">
    <div class="fl-shell footer-row">
      <div class="footer-left">
        <span>&copy; {{ year }}</span>
        <span class="font-medium" style="color: var(--text-secondary)">FlowLoss</span>
        <span class="fl-chip font-mono" style="padding: 2px 6px; font-size: 11px; line-height: 1">v1.0</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 30px;
  font-size: 12px;
  color: var(--text-muted);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
</style>
