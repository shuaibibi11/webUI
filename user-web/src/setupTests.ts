import { expect, afterEach } from 'vitest'

// 全局清理函数，在每个测试后执行
afterEach(() => {
  // cleanup()
})

// 扩展expect对象，添加自定义匹配器
expect.extend({
  toBeVisible(received) {
    return {
      message: () => `expected ${received} to be visible`,
      pass: received.isVisible()
    }
  },
  toBeHidden(received) {
    return {
      message: () => `expected ${received} to be hidden`,
      pass: !received.isVisible()
    }
  }
})

// 全局类型声明
declare global {
  namespace Vitest {
    interface Assertion {
      toBeVisible(): void
      toBeHidden(): void
    }
  }
}
