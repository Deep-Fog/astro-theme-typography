import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare global {
  namespace astroHTML.JSX {
    interface HTMLAttributes extends AttributifyAttributes {}
  }

  interface Window {
    /** Globe 组件的全局监听器只注册一次 */
    __cobeGlobeBound?: boolean
  }
}
