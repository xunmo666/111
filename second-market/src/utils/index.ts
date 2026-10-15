// ========== 工具函数 ==========

/** 订单号生成 */
export function genOrderNo(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const prefix = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${rand}`
}

/** 格式化金额 */
export function fmtMoney(n: number): string {
  return `¥${n.toLocaleString()}`
}

/** 格式化日期 */
export function fmtDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}
