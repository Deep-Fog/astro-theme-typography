import type { Post } from '~/types'
import { getCollection } from 'astro:content'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

export async function getCategories() {
  const posts = await getPosts()
  const categories = new Map<string, Post[]>()

  for (const post of posts) {
    if (post.data.categories) {
      for (const c of post.data.categories) {
        const bucket = categories.get(c) || []
        bucket.push(post)
        categories.set(c, bucket)
      }
    }
  }

  return categories
}

export async function getPosts(isArchivePage = false) {
  let posts = await getCollection('posts')

  if (import.meta.env.PROD) {
    posts = posts.filter(post => post.data.draft !== true)
  }

  posts.sort((a, b) => {
    if (isArchivePage) {
      return b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
    }

    const aDate = a.data.modDate ?? a.data.pubDate
    const bDate = b.data.modDate ?? b.data.pubDate

    return bDate.valueOf() - aDate.valueOf()
  })

  return posts
}

const parser = new MarkdownIt()
const descriptionCache = new Map<string, string>()
export function getPostDescription(post: Post) {
  if (post.data.description) {
    return post.data.description
  }

  const cached = descriptionCache.get(post.id)
  if (cached !== undefined)
    return cached

  const html = parser.render(post.body || '')
  const sanitized = sanitizeHtml(html, { allowedTags: [] }).slice(0, 400)
  descriptionCache.set(post.id, sanitized)
  return sanitized
}

export function formatDate(date: Date, format: string = 'YYYY-MM-DD') {
  return dayjs(date).format(format)
}

// CJK-aware word counter:
// - each CJK character counts as one word
// - remaining (latin/cyrillic/etc.) text is split on whitespace
const CJK_CHAR = /[\u{3040}-\u{30FF}\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}\u{AC00}-\u{D7AF}\u{F900}-\u{FAFF}]/gu
export function countWords(text: string): number {
  if (!text)
    return 0
  const cjkMatches = text.match(CJK_CHAR)
  const cjkCount = cjkMatches ? cjkMatches.length : 0
  const latinCount = text
    .replace(CJK_CHAR, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .length
  return cjkCount + latinCount
}

export function getPathFromCategory(
  category: string,
  category_map: { name: string, path: string }[],
) {
  const mappingPath = category_map.find(l => l.name === category)
  return mappingPath ? mappingPath.path : category
}
