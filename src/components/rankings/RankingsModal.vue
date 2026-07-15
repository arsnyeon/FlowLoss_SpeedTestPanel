<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useFormatter } from '@/composables/useFormatter'

type SortKey = 'allUsed' | 'averageSpeed' | 'onlineTime'

interface RankingItem {
  rank: number
  uin: string
  avatar: string
  data: string
  short: string
  addr: string
  isp: string
}

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const userStore = useUserStore()
const { format, formatBytes, formatBandwidth } = useFormatter()

const loading = ref(false)
const error = ref('')
const list = ref<RankingItem[]>([])
const grade = ref(3)
const isPast = ref(false)
const sortedBy = ref<SortKey>('allUsed')
const rankListEl = ref<HTMLElement | null>(null)

const gradeOptions = [
  { label: '小时', value: 3 },
  { label: '日榜', value: 2 },
  { label: '月榜', value: 1 },
  { label: '年榜', value: 0 },
]

const sortTitle = computed(() => {
  if (sortedBy.value === 'averageSpeed') return '平均速度'
  if (sortedBy.value === 'onlineTime') return '在线时长'
  return '总流量'
})

const periodLabel = computed(() => isPast.value ? '上个统计周期' : '当前统计周期')

function formatValue(value: number) {
  if (sortedBy.value === 'averageSpeed') return formatBandwidth(value * 8)
  if (sortedBy.value === 'onlineTime') return format(value, ['秒', '分钟', '小时', '天'], [0, 0, 0, 0], 60, true)
  return formatBytes(value)
}

function ispClass(isp: string) {
  if (isp.includes('移动')) return 'isp-mobile'
  if (isp.includes('联通')) return 'isp-unicom'
  if (isp.includes('电信')) return 'isp-telecom'
  if (isp.includes('广电')) return 'isp-broadcast'
  return 'isp-default'
}

async function fetchRankings() {
  loading.value = true
  error.value = ''
  try {
    const query = new URLSearchParams({
      grade: String(grade.value),
      isPast: String(isPast.value),
      sorted_by: sortedBy.value,
    })
    const resp = await userStore.apiRequest(`speed/leaderboard?${query.toString()}`)
    const data = Array.isArray(resp?.data) ? resp.data : []
    list.value = data.map((item: any, index: number) => ({
      rank: index + 1,
      uin: item.uin || '匿名',
      avatar: item.headimg || '',
      data: formatValue(Number(item.data) || 0),
      short: item.short || '',
      addr: item.addr || '',
      isp: item.isp || '',
    }))
  } catch {
    error.value = '无法获取榜单信息，可能是后端服务器异常'
    list.value = []
  } finally {
    loading.value = false
  }
}

function nextSort() {
  if (sortedBy.value === 'allUsed') sortedBy.value = 'averageSpeed'
  else if (sortedBy.value === 'averageSpeed') sortedBy.value = 'onlineTime'
  else sortedBy.value = 'allUsed'
}

watch(() => props.show, show => {
  if (show) {
    void fetchRankings()
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch([grade, isPast, sortedBy], () => {
  if (props.show) {
    void fetchRankings()
    rankListEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

onMounted(() => {
  if (props.show) void fetchRankings()
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
        <section class="ranking-modal">
          <header class="modal-head">
            <div>
              <h2>排行榜</h2>
              <p>{{ periodLabel }} · 按 {{ sortTitle }} 排序</p>
            </div>
            <button class="icon-button" aria-label="关闭" @click="emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="filter-panel">
            <div class="filter-controls">
              <div class="filter-group">
                <span class="filter-label">榜单</span>
                <div class="segmented" aria-label="排行榜周期">
                  <button
                    v-for="item in gradeOptions"
                    :key="item.value"
                    :class="{ active: grade === item.value }"
                    type="button"
                    @click="grade = item.value"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>
              <label class="period-check">
                <input v-model="isPast" type="checkbox" />
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12.5l4.2 4.2L19 7" />
                  </svg>
                </span>
                上个统计周期
              </label>
              <div class="filter-group sort-group">
                <span class="filter-label">排序</span>
                <button class="sort-button" type="button" @click="nextSort">
                  <strong>{{ sortTitle }}</strong>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M7 7h10M9 12h6M11 17h2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div ref="rankListEl" class="rank-list">
            <div v-if="loading" class="modal-state">正在获取榜单...</div>
            <div v-else-if="error" class="modal-state error">{{ error }}</div>
            <article v-for="item in list" :key="item.rank + item.uin" class="rank-row">
              <span class="rank-no" :class="`rank-${item.rank}`">{{ item.rank }}</span>
              <img class="rank-avatar" :src="item.avatar" alt="" />
              <div class="rank-user">
                <strong>{{ item.uin }}</strong>
                <span>
                  <em :class="ispClass(item.isp)">{{ item.short || item.isp || '未知线路' }}</em>
                  {{ item.addr }}
                </span>
              </div>
              <div class="rank-data">{{ item.data }}</div>
            </article>
            <div v-if="!loading && !error && list.length === 0" class="modal-state">暂无榜单数据</div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.28);
}

.ranking-modal {
  display: flex;
  flex-direction: column;
  width: min(860px, 100%);
  max-height: min(760px, 90vh);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
  background: transparent;
}

.modal-head h2 {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
}

.modal-head p {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
}

.icon-button svg {
  width: 15px;
  height: 15px;
}

.filter-panel {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: transparent;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.filter-label {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;
}

.sort-group {
  margin-left: auto;
}

.segmented {
  display: inline-flex;
  min-width: 296px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #f3f4f6;
}

.segmented button,
.sort-button {
  min-height: 24px;
  border-radius: 4px;
  border: 0;
  padding: 0 12px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.segmented button {
  flex: 1;
  min-width: 58px;
}

.segmented button.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.08);
}

.sort-button {
  border: 1px solid var(--border);
  background: var(--bg-card);
}

.sort-button:hover,
.segmented button:hover {
  color: var(--text-primary);
}

.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

.sort-button svg {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

.sort-button strong {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 750;
}

.period-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 4px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  user-select: none;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.period-check:hover {
  color: var(--text-primary);
}

.period-check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.period-check span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-card);
  color: transparent;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.period-check svg {
  width: 12px;
  height: 12px;
}

.period-check input:checked + span {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #fff;
}

.period-check:has(input:checked) {
  color: var(--color-accent);
}

.period-check:has(input:focus-visible) {
  outline: 2px solid rgba(79, 70, 229, 0.24);
  outline-offset: 2px;
}

.rank-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 14px 22px;
  scrollbar-width: thin;
}

.rank-row {
  display: grid;
  grid-template-columns: 42px 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 10px 10px;
  border-radius: 8px;
  transition: background 0.16s ease;
}

.rank-row:hover {
  background: var(--bg-subtle);
}

.rank-no {
  display: block;
  justify-self: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
}

.rank-no.rank-1 {
  color: #ef4444;
}

.rank-no.rank-2 {
  color: #f0ad00;
}

.rank-no.rank-3 {
  color: #7c5cff;
}

.rank-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--border);
  object-fit: cover;
  background: var(--bg-subtle);
}

.rank-user {
  min-width: 0;
}

.rank-user strong {
  display: block;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-user span {
  display: block;
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-user em {
  margin-right: 6px;
  font-style: normal;
  font-weight: 650;
}

.isp-mobile { color: #16a34a; }
.isp-unicom { color: #dc2626; }
.isp-telecom { color: #2563eb; }
.isp-broadcast { color: #ca8a04; }
.isp-default { color: var(--text-secondary); }

.rank-uin {
  color: var(--text-muted);
  font-style: normal;
  font-weight: 500;
}

.rank-data {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.modal-state {
  padding: 44px 20px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.modal-state.error {
  color: var(--color-danger);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.16s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .modal-backdrop {
    align-items: flex-start;
    padding: 46px 14px 14px;
  }

  .ranking-modal {
    max-height: calc(100dvh - 100px);
    border-radius: 13px;
  }

  .modal-head {
    padding: 16px 18px 14px;
  }

  .filter-panel {
    padding: 10px 18px 12px;
  }

  .filter-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .filter-group {
    min-width: 0;
  }

  .filter-label {
    display: none;
  }

  .filter-group:first-child {
    grid-column: 1 / -1;
  }

  .segmented {
    width: 100%;
    min-width: 0;
    padding: 3px;
    border-radius: 10px;
  }

  .segmented button {
    flex: 1;
    min-width: 0;
    min-height: 35px;
    padding: 0 8px;
  }

  .period-check {
    width: auto;
    min-height: 32px;
    padding: 0 2px;
    white-space: nowrap;
  }

  .sort-group {
    justify-content: flex-end;
    margin-left: 0;
  }

  .sort-button {
    min-width: 104px;
    min-height: 34px;
    justify-content: center;
  }

  .rank-row {
    grid-template-columns: 24px 32px minmax(0, 1fr) auto;
    gap: 8px;
    min-height: 48px;
    padding: 8px;
  }

  .rank-data {
    font-size: 12px;
  }

  .rank-avatar {
    width: 32px;
    height: 32px;
  }

  .rank-user strong {
    font-size: 12px;
  }

  .rank-user span {
    font-size: 11px;
  }
}
</style>
