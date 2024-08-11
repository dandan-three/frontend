import Vue from 'vue'
import App from './App'
import router from './router'
import axios from 'axios'
import ElementUI from 'element-ui'
import VueDragResize from 'vue-drag-resize'
import StatusIndicator from 'vue-status-indicator'
import * as echarts from 'echarts'
import 'element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
Vue.prototype.$axios = axios
axios.defaults.baseURL = '/api'
Vue.prototype.$echarts = echarts
Vue.use(ElementUI)
Vue.use(StatusIndicator)
Vue.component('vue-drag-resize', VueDragResize)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
