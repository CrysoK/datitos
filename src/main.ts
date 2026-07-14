import './assets/normalize.css'

import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Google Analytics 4 Injection
const gaId = import.meta.env.VITE_GA_ID
if (gaId) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(script)

  const dataLayer = window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', gaId)
}

const app = createApp(App)
app.use(router)
app.mount('#app')

