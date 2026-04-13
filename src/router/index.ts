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

export default router
