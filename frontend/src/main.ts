import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import VueTippy from 'vue-tippy'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './queryClient'
import './style.css'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light-border.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient })
app.use(VueTippy, {
    defaultProps: {
        theme: 'light-border',
        allowHTML: true,
        // include focus so tooltips are visible when navigating by keyboard
        trigger: 'mouseenter focus click',
    },
})

app.mount('#app')
