import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPlugin, PLUGIN_NAME as PPS } from 'pinia-plugin-subscription';
import piniaPluginActionFlow from './plugins/ActionsFlow';
import './style.css'
import App from './App.vue'
import { pluginName } from './utils/constantes';

const app = createApp(App)
const pinia = createPinia();

pinia.use(createPlugin([piniaPluginActionFlow], [PPS, pluginName]));
app.use(pinia)
app.mount('#app')
