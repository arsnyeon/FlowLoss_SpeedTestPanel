import { computed, type Ref } from 'vue'
import { useFormatter } from '@/composables/useFormatter'

type UsageMetric = [number?, number?] | number[] | undefined

interface UsageItem {
  allUsed?: UsageMetric
  averageSpeed?: UsageMetric
  onlineTime?: UsageMetric
}

interface UsageRankData {
  now?: Record<number, UsageItem>
  prev?: Record<number, UsageItem>
}

export function useUserUsageRows(rankData: Ref<UsageRankData | null>, showPrev: Ref<boolean>, showRank: Ref<boolean>) {
  const { format, formatBytes, formatBandwidth } = useFormatter()

  const rows = computed(() => {
    const source = showPrev.value ? rankData.value?.prev : rankData.value?.now
    if (!source) return []

    const labels = showPrev.value
      ? ['上小时', '昨天', '上月', '去年']
      : ['本小时', '今天', '本月', '今年']

    return [3, 2, 1, 0].map((key, index) => {
      const item = source[key] || {}
      return {
        label: labels[index],
        allUsed: showRank.value
          ? formatRank(item.allUsed?.[0])
          : formatBytes(Number(item.allUsed?.[1]) || 0),
        averageSpeed: showRank.value
          ? formatRank(item.averageSpeed?.[0])
          : formatBandwidth((Number(item.averageSpeed?.[1]) || 0) * 8),
        onlineTime: showRank.value
          ? formatRank(item.onlineTime?.[0])
          : format(Number(item.onlineTime?.[1]) || 0, ['秒', '分钟', '小时', '天'], [0, 0, 0, 0], 60, true),
      }
    })
  })

  function formatRank(value: unknown) {
    const rank = Number(value) || 0
    return rank > 0 ? `#${rank}` : '-'
  }

  return { rows }
}
