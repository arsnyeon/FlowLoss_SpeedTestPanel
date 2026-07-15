export function useFormatter() {
  function format(
    num: number,
    units: string[],
    decimals: number[],
    divide: number,
    timeMode: boolean
  ): string {
    if (!num || num <= 0) return '-'
    let value = num
    let index = 0
    while (value >= divide) {
      if (index === units.length - 1) break
      value /= divide
      index++
      if (index >= 2 && timeMode) divide = 24
    }
    return value.toFixed(decimals[index]) + units[index]
  }

  function formatBytes(bytes: number): string {
    return format(bytes, ['B', 'KB', 'MB', 'GB', 'TB', 'PB'], [0, 0, 1, 2, 2, 2], 1024, false)
  }

  function formatSpeed(bytesPerSec: number): string {
    return format(bytesPerSec, ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s'], [0, 0, 1, 2, 2, 2], 1024, false)
  }

  function formatBandwidth(bitsPerSec: number): string {
    return format(bitsPerSec, ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps'], [0, 0, 0, 2, 2, 2], 1024, false)
  }

  function formatTime(seconds: number): string {
    return format(seconds, ['秒', '分钟', '小时', '天'], [0, 0, 0, 0], 60, true)
  }

  function formatRunTime(stamp: number): string {
    const hour = Math.floor(stamp / 3600)
    const min = Math.floor((stamp % 3600) / 60)
    const sec = stamp % 60
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    return (hour > 0 ? pad(hour) + 'h' : '') + (min > 0 ? pad(min) + 'm' : '') + pad(sec) + 's'
  }

  return { format, formatBytes, formatSpeed, formatBandwidth, formatTime, formatRunTime }
}
