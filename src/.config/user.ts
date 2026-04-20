import type { UserConfig } from '~/types'

export const userConfig: Partial<UserConfig> = {
  site: {
    title: '深霧遠東通訊所',
    subtitle: 'DeepFog Blog',
    author: '治典',
    description: 'The best way to predict the future is to create it.',
    website: 'https://deepfog.top/',
    socialLinks: [
      {
        name: 'github',
        href: 'https://github.com/Deep-Fog',
      },
      {
        name: 'email-fast',
        href: 'mailto:deepf0g@icloud.com',
      },
      {
        name: 'rss',
        href: '/atom.xml',
      },
    ],
  },
  seo: {
    meta: [
      { name: 'robots', content: 'index, follow, max-image-preview:large' },
      { name: 'revisit-after', content: '7 days' },
      { name: 'googlebot', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'bingbot', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
    ],
    link: [
      { rel: 'sitemap', href: '/sitemap-index.xml', type: 'application/xml' },
      { rel: 'canonical', href: 'https://deepfog.top/' },
    ],
    jsonLd: [
      // 网站信息的结构化数据
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': '深霧遠東通訊所',
        'url': 'https://deepfog.top/',
        'description': 'The best way to predict the future is to create it.',
        'inLanguage': 'zh-CN',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://deepfog.top/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      // 组织/个人信息的结构化数据
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': '治典',
        'url': 'https://deepfog.top/',
        'sameAs': [
          'https://github.com/DeepFog-ORG',
        ],
      },
      // 博客信息的结构化数据
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': '深霧遠東通訊所',
        'url': 'https://deepfog.top/',
        'description': 'The best way to predict the future is to create it.',
        'publisher': {
          '@type': 'Person',
          'name': '治典',
          'url': 'https://deepfog.top/',
        },
      },
    ],
  },
  latex: {
    katex: true,
  },
}
