import presetAttributify from '@unocss/preset-attributify'
import transformerDirectives from '@unocss/transformer-directives'
import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetWind3,
  transformerVariantGroup,
} from 'unocss'
import presetTheme from 'unocss-preset-theme'
import { themeConfig } from './src/.config'

const { colorsDark, colorsLight, fonts } = themeConfig.appearance

const cssExtend = {
  ':root': {
    '--prose-borders': '#eee',
  },

  // 标题层级：主标题 30 / h2 24 / h3 20 / h4 17 / h5 16 / h6 15，正文 16。
  // 上边距一律 > 段落间距（1em = 16px）且逐级递减；下边距刻意小于 16px——
  // 它会与后续段落的上边距折叠为 16px，从而保证「上松下紧」，标题永远与
  // 其统辖的内容贴得比段间更紧。
  // h2-h6 的 font-weight: 600 由 presetTypography 的共用规则提供，无需重复。
  'h1': {
    'font-size': '1.875rem',
    'font-weight': '700',
    'line-height': '1.4',
    'margin': '0',
    'text-wrap': 'balance',
  },

  'h2': {
    'font-size': '1.5em',
    'line-height': '1.35',
    'margin': '2em 0 0.6em',
  },

  'h3': {
    'font-size': '1.25em',
    'line-height': '1.35',
    'margin': '1.8em 0 0.5em',
  },

  'h4': {
    'font-size': '1.0625em',
    'margin': '1.6em 0 0.4em',
  },

  'h5': {
    'font-size': '1em',
    'margin': '1.5em 0 0.4em',
  },

  'h6': {
    'font-size': '0.9375em',
    'margin': '1.5em 0 0.4em',
  },

  'code::before,code::after': {
    content: 'none',
  },

  ':where(:not(pre):not(a) > code)': {
    'white-space': 'normal',
    'word-wrap': 'break-word',
    'padding': '2px 4px',
    'color': '#c7254e',
    'font-size': '90%',
    'background-color': '#f9f2f4',
    'border-radius': '4px',
  },

  'li': {
    'white-space': 'normal',
    'word-wrap': 'break-word',
  },
}

export default defineConfig({
  rules: [
    [
      /^row-(\d+)-(\d)$/,
      ([, start, end]) => ({ 'grid-row': `${start}/${end}` }),
    ],
    [
      /^col-(\d+)-(\d)$/,
      ([, start, end]) => ({ 'grid-column': `${start}/${end}` }),
    ],
    [
      /^scrollbar-hide$/,
      ([_]) => `.scrollbar-hide { scrollbar-width:none;-ms-overflow-style: none; }
      .scrollbar-hide::-webkit-scrollbar {display:none;}`,
    ],
  ],
  presets: [
    presetWind3(),
    presetTypography({ cssExtend }),
    presetAttributify(),
    presetIcons({ scale: 1.2, warn: true }),
    presetTheme ({
      theme: {
        dark: {
          colors: { ...colorsDark, shadow: '#FFFFFF0A' },
          // TODO 需要配置代码块颜色
        },
      },
    }),
  ],
  theme: {
    colors: { ...colorsLight, shadow: '#0000000A' },
    fontFamily: fonts,
  },
  shortcuts: [
    // 列表页 / 归档页 / 分类页的条目标题
    ['post-title', 'text-5 font-bold lh-7.5 m-0'],
    // 文章型页面的主标题。数值与上面 cssExtend 的 h1 规则保持一致，
    // 因此 .prose 内外、两条规则谁先谁后都不影响结果。
    ['article-title', 'text-7.5 font-bold lh-[1.4] m-0'],
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: [
    ...themeConfig.site.socialLinks.map(social => `i-mdi-${social.name}`),
    'i-mdi-content-copy',
    'i-mdi-check',
  ],
})
