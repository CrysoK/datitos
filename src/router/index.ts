import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";

const routes = [
  {
    path: "/",
    component: App,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: App
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  const gaId = import.meta.env.VITE_GA_ID
  if (gaId && typeof window.gtag === 'function') {
    window.gtag('config', gaId, {
      page_path: to.fullPath,
    })
  }
})

export default router

