import { UserConfig } from 'vite'
import { VitePluginUniResolvedOptions } from '..'

export function createOptimizeDeps(
  _options: VitePluginUniResolvedOptions
): UserConfig['optimizeDeps'] {
  return {
    exclude: [
      'vue',
      'vuex',
      'vue-router',
      '@dcloudio/uni-app',
      '@dcloudio/uni-components',
      '@dcloudio/uni-i18n',
      '@dcloudio/uni-shared',
    ],
  }
}