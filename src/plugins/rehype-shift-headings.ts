interface HastNode {
  type: string
  tagName?: string
  children?: HastNode[]
}

const LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

function walk(node: HastNode, fn: (node: HastNode) => void): void {
  if (node.type === 'element')
    fn(node)

  for (const child of node.children ?? [])
    walk(child, fn)
}

/**
 * 页面主标题由 PostMeta 渲染为 h1，正文里再出现 `#` 就会造成同页两个 h1，
 * 破坏文档大纲与 SEO 结构。
 *
 * 这里只在文档**含 h1** 时，把该文档的所有标题整体下移一级（`#` → h2、
 * `##` → h3 …），层级关系保持连续；不含 h1 的文档完全不受影响。
 *
 * 之所以在构建期归一化而不是直接改 Markdown：`src/content/posts/` 由 Obsidian
 * 同步产生，手改会在下次同步被覆盖。
 */
export function rehypeShiftHeadings() {
  return (tree: HastNode): void => {
    let hasH1 = false
    walk(tree, (node) => {
      if (node.tagName === 'h1')
        hasH1 = true
    })

    if (!hasH1)
      return

    walk(tree, (node) => {
      const index = LEVELS.indexOf(node.tagName ?? '')
      // h6 已无处可降，保持原级
      if (index !== -1)
        node.tagName = LEVELS[Math.min(index + 1, LEVELS.length - 1)]
    })
  }
}
