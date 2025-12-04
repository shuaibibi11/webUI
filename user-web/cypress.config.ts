import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:13080',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    experimentalRunAllSpecs: true,
    experimentalInteractiveRunEvents: true,
    experimentalMemoryManagement: true,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    retries: {
      runMode: 2,
      openMode: 0
    }
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite'
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}'
  }
})
