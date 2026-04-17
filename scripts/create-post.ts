import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import dayjs from 'dayjs'

createPost()

/**
 * Create a new post.
 * Prompts the user for a file name and extension, and creates a new post file with frontmatter.
 * If successful, opens the new post file in the default editor.
 */
async function createPost(): Promise<void> {
  consola.start('Ready to create a new post!')

  const filename: string = await consola.prompt('Enter file name: ', { type: 'text' })
  const extension: string = await consola.prompt('Select file extension: ', { type: 'select', options: ['.md', '.mdx'] })
  const isDraft: boolean = await consola.prompt('Is this a draft?', { type: 'confirm', initial: true })

  if (!filename || /[\\/\0]/.test(filename) || filename.includes('..')) {
    consola.error('Invalid file name: must not contain path separators or traversal sequences.')
    return
  }

  const targetDir = path.resolve('./src/content/posts/')
  const fullPath: string = path.resolve(targetDir, `${filename}${extension}`)
  if (!fullPath.startsWith(targetDir + path.sep)) {
    consola.error('Invalid file name: resolved path escapes posts directory.')
    return
  }

  const frontmatter = getFrontmatter({
    title: filename,
    pubDate: dayjs().format('YYYY-MM-DD'),
    categories: '[]',
    description: '\'\'',
    slug: filename.toLowerCase().replace(/\s+/g, '-'),
    draft: isDraft ? 'true' : 'false',
  })

  try {
    fs.writeFileSync(fullPath, frontmatter)
    consola.success('New post created successfully!')

    const open: boolean = await consola.prompt('Open the new post?', { type: 'confirm', initial: true })
    if (open) {
      consola.info(`Opening ${fullPath}...`)
      execFileSync('code', [fullPath], { shell: false, stdio: 'inherit' })
    }
  }
  catch (error) {
    consola.error((error as Error).message || 'Failed to create new post!')
  }
}

/**
 * Create frontmatter from a data object.
 * @param data The data object to convert to frontmatter.
 * @returns The frontmatter as a string.
 */
function getFrontmatter(data: { [key: string]: string }): string {
  const frontmatter = Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  return `---\n${frontmatter}\n---`
}
