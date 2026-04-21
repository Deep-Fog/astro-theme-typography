import { execSync } from 'node:child_process'
import process from 'node:process'
import bumpp from 'bumpp'
import consola from 'consola'

const confirmed: boolean = await consola.prompt(
  'This will delete ALL local git tags before publishing. Continue?',
  { type: 'confirm', initial: false },
)
if (!confirmed) {
  consola.info('Aborted.')
  process.exit(0)
}

execSync('git tag -l | xargs git tag -d')

let isChangelogenDone = false

await bumpp({
  tag: true,
  commit: true,
  progress: (progress) => {
    const { newVersion } = progress
    if (isChangelogenDone)
      return
    execSync(`changelogen --output -r ${newVersion}`)
    isChangelogenDone = true
  },
})
