import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPlugin } from 'pinia-plugin-subscription';
import piniaPluginActionFlow from './plugins/ActionsFlow';
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia();

pinia.use(createPlugin([piniaPluginActionFlow], true));
app.use(pinia)
app.mount('#app')
