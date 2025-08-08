import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ExperimentView from '../views/ExperimentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      // 路由路径保持不变，但现在它会在App.vue的<RouterView>中加载
      path: '/experiment/:name',
      name: 'experiment',
      component: ExperimentView,
      props: true
    }
  ]
})

export default router