import Vue from 'vue'
import Router from 'vue-router'
import DataStreamingDisplay from '@/components/display'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'root',
      meta: { title: 'Wireless Sensing Real-Time System Demo' },
      component: DataStreamingDisplay
    },
    {
      path: '/display',
      name: 'DataStreamingDisplay',
      meta: { title: 'Wireless Sensing Real-Time System Demo' },
      component: DataStreamingDisplay
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
