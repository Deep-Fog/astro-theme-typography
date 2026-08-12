/** cobe 使用 0-1 区间的 RGB 三元组 */
export type RGB = [number, number, number]

/** 地理坐标 [纬度, 经度] */
export type LatLng = [number, number]

/** 标签外观：badge 对应官网 Showcase 的 Interactive，note 对应 Labels，pin 是带下尖角的像素标牌 */
export type GlobeLabelVariant = 'badge' | 'note' | 'pin'

export interface GlobeMarker {
  /** [纬度, 经度]，如北京为 [39.9042, 116.4074] */
  location: LatLng
  /** 光点半径，常用 0.03 ~ 0.1，缺省为 0.05 */
  size?: number
  /** 单独指定颜色，缺省时使用 markerColor */
  color?: RGB
  /** 标签锚点标识，写了 label 时必填；组件会自动加实例前缀避免同页重名 */
  id?: string
  /** 常显的标签文字，需要配合 id 使用 */
  label?: string
  /** 点击标签后展开的补充信息，仅 badge 外观支持 */
  detail?: string
  /** note 外观的便签底色，任意 CSS 颜色 */
  labelColor?: string
  /** note 外观的倾斜角度（度），正值顺时针 */
  labelRotate?: number
}

/** 传给 cobe 的光点，size 必填，label 相关字段属于组件层不下发 */
export interface ResolvedGlobeMarker {
  location: LatLng
  size: number
  color?: RGB
  id?: string
}

/** 由带 label 的 marker 生成、在 Astro 端渲染成 DOM 的标签 */
export interface GlobeLabel {
  /** 加过实例前缀的锚点名，对应 cobe 的 --cobe-{anchor} */
  anchor: string
  label: string
  detail?: string
  color?: string
  rotate?: number
}

export interface GlobeArc {
  from: LatLng
  to: LatLng
  color?: RGB
  id?: string
}

/** 随站点明暗主题切换的外观参数 */
export interface GlobeAppearance {
  /** 暗面强度，0 为无明暗过渡 */
  dark: number
  /** 漫反射强度 */
  diffuse: number
  /** 陆地采样点亮度 */
  mapBrightness: number
  /** 陆地采样点的基础亮度 */
  mapBaseBrightness: number
  /** 球体本身的颜色 */
  baseColor: RGB
  /** 光点颜色 */
  markerColor: RGB
  /** 边缘辉光颜色 */
  glowColor: RGB
}

/** 序列化后交给客户端脚本的完整配置 */
export interface GlobeConfig {
  /** 每帧自转的弧度，0 表示静止 */
  speed: number
  /** 初始经度（弧度） */
  phi: number
  /** 初始纬度（弧度） */
  theta: number
  /** 是否允许拖拽旋转 */
  interactive: boolean
  /** 陆地采样点数量 */
  mapSamples: number
  scale: number
  offset: [number, number]
  opacity: number
  markers: ResolvedGlobeMarker[]
  arcs: GlobeArc[]
  arcColor?: RGB
  arcWidth: number
  arcHeight: number
  markerElevation: number
  light: GlobeAppearance
  dark: GlobeAppearance
}
