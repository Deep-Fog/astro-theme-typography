import type { COBEOptions, Globe } from 'cobe'
import type { GlobeAppearance, GlobeConfig, RGB } from '~/types/globe'
import createGlobe from 'cobe'

/** 拖拽跟手程度：每像素对应的弧度 */
const DRAG_SENSITIVITY = 0.005
/** 拖拽跟随的阻尼系数 */
const DRAG_DAMPING = 0.12
/** 纬度可拖拽到的上下限 */
const THETA_LIMIT = 1.1
/** 明暗切换时配色过渡的时长（毫秒） */
const THEME_DURATION = 420
/** 画布像素密度上限，避免高分屏上开销过大 */
const MAX_DPR = 2

interface Instance {
  root: HTMLElement
  stage: HTMLElement
  canvas: HTMLCanvasElement
  config: GlobeConfig
  globe: Globe | null
  raf: number
  /** 画布 CSS 宽度，0 表示尚未测量 */
  width: number
  visible: boolean
  phi: number
  dragging: boolean
  /** 拖拽产生的经纬度偏移：target 为目标值，另一个是平滑跟随的当前值 */
  dragX: number
  dragTargetX: number
  dragY: number
  dragTargetY: number
  pointerId: number | null
  pointerStartX: number
  pointerStartY: number
  dragBaseX: number
  dragBaseY: number
  /** 当前呈现的配色，明暗切换时从它插值到目标配色 */
  current: GlobeAppearance
  themeFrom: GlobeAppearance | null
  themeStart: number
  resizeObserver: ResizeObserver | null
  intersectionObserver: IntersectionObserver | null
  abort: AbortController
}

const instances = new Map<HTMLElement, Instance>()
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function mix(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function mixRGB(from: RGB, to: RGB, t: number): RGB {
  return [mix(from[0], to[0], t), mix(from[1], to[1], t), mix(from[2], to[2], t)]
}

function mixAppearance(from: GlobeAppearance, to: GlobeAppearance, t: number): GlobeAppearance {
  return {
    dark: mix(from.dark, to.dark, t),
    diffuse: mix(from.diffuse, to.diffuse, t),
    mapBrightness: mix(from.mapBrightness, to.mapBrightness, t),
    mapBaseBrightness: mix(from.mapBaseBrightness, to.mapBaseBrightness, t),
    baseColor: mixRGB(from.baseColor, to.baseColor, t),
    markerColor: mixRGB(from.markerColor, to.markerColor, t),
    glowColor: mixRGB(from.glowColor, to.glowColor, t),
  }
}

/** 当前主题对应的目标配色，返回的是配置里的原对象，可用引用比较判断是否需要过渡 */
function appearanceOf(config: GlobeConfig): GlobeAppearance {
  return isDarkTheme() ? config.dark : config.light
}

function parseConfig(raw: string): GlobeConfig | null {
  try {
    return JSON.parse(raw) as GlobeConfig
  }
  catch {
    console.warn('[Globe] 配置解析失败', raw)
    return null
  }
}

function createInstance(root: HTMLElement): void {
  if (instances.has(root))
    return

  const stage = root.querySelector<HTMLElement>('.cobe-globe__stage')
  const canvas = root.querySelector<HTMLCanvasElement>('.cobe-globe__canvas')
  const raw = root.dataset.cobeGlobe
  if (!stage || !canvas || !raw)
    return

  const config = parseConfig(raw)
  if (!config)
    return

  const instance: Instance = {
    root,
    stage,
    canvas,
    config,
    globe: null,
    raf: 0,
    width: 0,
    visible: false,
    phi: config.phi,
    dragging: false,
    dragX: 0,
    dragTargetX: 0,
    dragY: 0,
    dragTargetY: 0,
    pointerId: null,
    pointerStartX: 0,
    pointerStartY: 0,
    dragBaseX: 0,
    dragBaseY: 0,
    current: appearanceOf(config),
    themeFrom: null,
    themeStart: 0,
    resizeObserver: null,
    intersectionObserver: null,
    abort: new AbortController(),
  }
  instances.set(root, instance)

  instance.resizeObserver = new ResizeObserver((entries) => {
    resize(instance, entries[entries.length - 1]?.contentRect.width)
  })
  instance.resizeObserver.observe(stage)

  instance.intersectionObserver = new IntersectionObserver(
    (entries) => {
      instance.visible = entries[entries.length - 1]?.isIntersecting ?? false
      if (!instance.visible) {
        stop(instance)
        return
      }
      // 进入视口后才真正申请 WebGL 上下文，浏览器同时可用的上下文数量有限
      if (!instance.globe && instance.width)
        mountGlobe(instance)
      wake(instance)
    },
    { rootMargin: '128px' },
  )
  instance.intersectionObserver.observe(stage)

  bindContextRecovery(instance)
  bindLabels(instance)
  if (config.interactive)
    bindPointer(instance)

  resize(instance, stage.clientWidth)
}

function resize(instance: Instance, rawWidth?: number): void {
  const width = Math.round(rawWidth ?? 0)
  if (!width || width === instance.width)
    return

  instance.width = width
  if (instance.globe)
    instance.globe.update({ width, height: width })
  // 尚未进入视口时只记录尺寸，等 IntersectionObserver 触发再挂载
  else if (instance.visible)
    mountGlobe(instance)

  wake(instance)
}

function mountGlobe(instance: Instance): void {
  const { config, canvas } = instance
  const appearance = appearanceOf(config)
  instance.current = appearance

  // 上下文创建失败时 cobe 不会写入画布尺寸，以此判断是否真的渲染成功
  canvas.width = 0

  const options: COBEOptions = {
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, MAX_DPR),
    width: instance.width,
    height: instance.width,
    phi: instance.phi,
    theta: config.theta,
    dark: appearance.dark,
    diffuse: appearance.diffuse,
    mapSamples: config.mapSamples,
    mapBrightness: appearance.mapBrightness,
    mapBaseBrightness: appearance.mapBaseBrightness,
    baseColor: appearance.baseColor,
    markerColor: appearance.markerColor,
    glowColor: appearance.glowColor,
    scale: config.scale,
    offset: config.offset,
    opacity: config.opacity,
    markers: config.markers,
    arcs: config.arcs,
    arcWidth: config.arcWidth,
    arcHeight: config.arcHeight,
    markerElevation: config.markerElevation,
  }
  if (config.arcColor)
    options.arcColor = config.arcColor

  const globe = createGlobe(canvas, options)

  if (!canvas.width) {
    globe.destroy()
    instance.root.dataset.unsupported = ''
    return
  }

  instance.globe = globe
  // 延后一帧再揭幕，让 opacity 过渡真正跑起来
  requestAnimationFrame(() => {
    if (instance.globe)
      instance.root.dataset.ready = ''
  })
}

/** 显存紧张或 GPU 重置时浏览器会回收上下文，恢复后重建地球 */
function bindContextRecovery(instance: Instance): void {
  const { canvas } = instance
  const { signal } = instance.abort

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    stop(instance)
    instance.globe = null
    delete instance.root.dataset.ready
  }, { signal })

  canvas.addEventListener('webglcontextrestored', () => {
    if (!instance.width || !instance.visible)
      return
    mountGlobe(instance)
    wake(instance)
  }, { signal })
}

/** 标签是普通 DOM，点击展开 detail；同一个球上一次只展开一个 */
function bindLabels(instance: Instance): void {
  const { stage } = instance
  const { signal } = instance.abort

  stage.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.cobe-globe__label')
    if (!target || !target.hasAttribute('aria-expanded'))
      return

    const expand = target.getAttribute('aria-expanded') !== 'true'
    stage.querySelectorAll<HTMLElement>('.cobe-globe__label[aria-expanded]').forEach((label) => {
      label.setAttribute('aria-expanded', 'false')
    })
    if (expand)
      target.setAttribute('aria-expanded', 'true')
  }, { signal })
}

function bindPointer(instance: Instance): void {
  const { canvas } = instance
  const { signal } = instance.abort

  canvas.addEventListener('pointerdown', (event) => {
    if (instance.pointerId !== null)
      return
    instance.pointerId = event.pointerId
    instance.dragging = true
    instance.pointerStartX = event.clientX
    instance.pointerStartY = event.clientY
    instance.dragBaseX = instance.dragTargetX
    instance.dragBaseY = instance.dragTargetY
    instance.root.dataset.dragging = ''
    canvas.setPointerCapture(event.pointerId)
    wake(instance)
  }, { signal })

  canvas.addEventListener('pointermove', (event) => {
    if (instance.pointerId !== event.pointerId)
      return
    instance.dragTargetX = instance.dragBaseX + (event.clientX - instance.pointerStartX) * DRAG_SENSITIVITY
    // 触摸设备的纵向手势保留给页面滚动
    if (event.pointerType !== 'touch') {
      const next = instance.dragBaseY + (event.clientY - instance.pointerStartY) * DRAG_SENSITIVITY
      // 约束最终纬度而非偏移量，否则初始 theta 非 0 时上下行程会不一样长
      const theta = instance.config.theta
      instance.dragTargetY = clamp(next, -THETA_LIMIT - theta, THETA_LIMIT - theta)
    }
    wake(instance)
  }, { signal })

  const release = (event: PointerEvent): void => {
    if (instance.pointerId !== event.pointerId)
      return
    instance.pointerId = null
    instance.dragging = false
    delete instance.root.dataset.dragging
    wake(instance)
  }

  canvas.addEventListener('pointerup', release, { signal })
  canvas.addEventListener('pointercancel', release, { signal })
}

function wake(instance: Instance): void {
  if (instance.raf || !instance.globe)
    return
  if (!instance.visible || document.hidden)
    return
  instance.raf = requestAnimationFrame(() => render(instance))
}

function stop(instance: Instance): void {
  if (!instance.raf)
    return
  cancelAnimationFrame(instance.raf)
  instance.raf = 0
}

function render(instance: Instance): void {
  instance.raf = 0

  if (!instance.root.isConnected) {
    destroyInstance(instance.root)
    return
  }
  if (!instance.globe)
    return

  // 自转、拖拽回弹、配色过渡都结束后就停下来，避免空转耗电
  let animating = false

  if (instance.config.speed && !instance.dragging && !reducedMotion.matches) {
    instance.phi += instance.config.speed
    animating = true
  }

  const deltaX = instance.dragTargetX - instance.dragX
  const deltaY = instance.dragTargetY - instance.dragY
  if (Math.abs(deltaX) > 1e-4 || Math.abs(deltaY) > 1e-4) {
    instance.dragX += deltaX * DRAG_DAMPING
    instance.dragY += deltaY * DRAG_DAMPING
    animating = true
  }
  else {
    instance.dragX = instance.dragTargetX
    instance.dragY = instance.dragTargetY
  }

  const target = appearanceOf(instance.config)
  if (instance.themeFrom) {
    const progress = clamp((performance.now() - instance.themeStart) / THEME_DURATION, 0, 1)
    // smoothstep，让明暗过渡收尾更柔和
    const eased = progress * progress * (3 - 2 * progress)
    instance.current = mixAppearance(instance.themeFrom, target, eased)
    if (progress >= 1)
      instance.themeFrom = null
    else
      animating = true
  }
  else {
    instance.current = target
  }

  instance.globe.update({
    phi: instance.phi + instance.dragX,
    theta: clamp(instance.config.theta + instance.dragY, -THETA_LIMIT, THETA_LIMIT),
    ...instance.current,
  })

  if (animating || instance.dragging)
    instance.raf = requestAnimationFrame(() => render(instance))
}

function destroyInstance(root: HTMLElement): void {
  const instance = instances.get(root)
  if (!instance)
    return

  stop(instance)
  instance.abort.abort()
  instance.resizeObserver?.disconnect()
  instance.intersectionObserver?.disconnect()
  instance.globe?.destroy()
  instance.globe = null
  instances.delete(root)
  delete root.dataset.ready
}

/** 回收已经离开文档的实例，再挂载页面上新出现的地球 */
function scan(): void {
  for (const root of [...instances.keys()]) {
    if (!root.isConnected)
      destroyInstance(root)
  }
  document.querySelectorAll<HTMLElement>('[data-cobe-globe]').forEach((root) => {
    createInstance(root)
  })
}

function onThemeChange(): void {
  for (const instance of instances.values()) {
    if (!instance.globe)
      continue
    const target = appearanceOf(instance.config)
    if (instance.current === target)
      continue
    instance.themeFrom = instance.current
    instance.themeStart = performance.now()
    wake(instance)
  }
}

// 打包后的模块脚本只会求值一次，这里注册的监听器负责后续所有页面
if (!window.__cobeGlobeBound) {
  window.__cobeGlobeBound = true

  // 站点通过 html.dark 切换明暗
  new MutationObserver(onThemeChange).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  document.addEventListener('visibilitychange', () => {
    for (const instance of instances.values()) {
      if (document.hidden)
        stop(instance)
      else
        wake(instance)
    }
  })

  // 用户关闭「减弱动态效果」后重新开始自转
  reducedMotion.addEventListener('change', () => {
    for (const instance of instances.values())
      wake(instance)
  })

  // swup 接管导航后脚本不会重新执行，改由它的生命周期事件驱动
  document.addEventListener('swup:page:view', scan)
  // 兼容 Astro 自带的视图过渡
  document.addEventListener('astro:page-load', scan)
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', scan, { once: true })
else
  scan()
