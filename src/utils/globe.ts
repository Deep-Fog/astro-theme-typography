import type { GlobeLabel, GlobeLabelVariant, GlobeMarker, ResolvedGlobeMarker } from '~/types/globe'

/**
 * cobe 把每个 marker 的可见性写成全局 `:root { --cobe-visible-{id} }`，
 * 同一页面里两个球若用了相同的 marker id 会互相覆盖，
 * 因此给每个组件实例分配一个前缀。
 */
let instanceCount = 0

/** 拆出交给 cobe 的 marker 与交给 Astro 渲染的标签 */
export function resolveMarkers(markers: GlobeMarker[]): {
  resolved: ResolvedGlobeMarker[]
  labels: GlobeLabel[]
} {
  const prefix = `g${(instanceCount += 1).toString(36)}`
  const resolved: ResolvedGlobeMarker[] = []
  const labels: GlobeLabel[] = []

  for (const marker of markers) {
    const anchor = marker.id ? `${prefix}-${marker.id}` : undefined

    resolved.push({
      location: marker.location,
      size: marker.size ?? 0.05,
      ...(marker.color ? { color: marker.color } : {}),
      ...(anchor ? { id: anchor } : {}),
    })

    if (anchor && marker.label) {
      labels.push({
        anchor,
        label: marker.label,
        detail: marker.detail,
        color: marker.labelColor,
        rotate: marker.labelRotate,
      })
    }
  }

  return { resolved, labels }
}

/**
 * 标签横向以锚点为中心，最宽的那个会向两侧各探出一半。
 * 这里按外观估算需要预留的空间，让组件自己吃下这段溢出，
 * 免得被祖先的滚动容器裁掉。字宽是按各外观的字号估的，宁可多留几像素。
 */
const LABEL_METRICS: Record<GlobeLabelVariant, { char: number, pad: number }> = {
  badge: { char: 5.8, pad: 16 },
  note: { char: 6.8, pad: 21 },
  pin: { char: 5.7, pad: 10 },
}

export function labelGutter(labels: GlobeLabel[], variant: GlobeLabelVariant): number {
  if (!labels.length)
    return 0
  const longest = labels.reduce((max, item) => Math.max(max, item.label.length), 0)
  const { char, pad } = LABEL_METRICS[variant]
  return Math.ceil((longest * char + pad) / 2) + 4
}

/**
 * 标签靠 CSS 锚点定位跟随光点：
 * cobe 在球体容器里放了一个 `anchor-name: --cobe-{anchor}` 的定位点，
 * 并在光点朝向镜头时把 `--cobe-visible-{anchor}` 设为一个无效值——
 * 于是 opacity / filter 在正面回落到初始值，转到背面变量消失后走 fallback 隐藏。
 */
export function labelStyle(item: GlobeLabel): string {
  const visible = `var(--cobe-visible-${item.anchor}, 0)`
  const style = [
    `position-anchor: --cobe-${item.anchor}`,
    `opacity: ${visible}`,
    `filter: blur(calc((1 - ${visible}) * 8px))`,
  ]

  if (item.color)
    style.push(`--cobe-label-color: ${item.color}`)
  if (item.rotate !== undefined)
    style.push(`--cobe-label-rotate: ${item.rotate}deg`)

  return style.join('; ')
}
