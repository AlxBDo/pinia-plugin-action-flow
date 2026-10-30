import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPlugin } from 'pinia-plugin-subscription';
import { createTracerRegistry } from 'pinia-plugin-subscription/helpers';
import piniaPluginActionFlow from '../plugins/ActionsFlow.ts';
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia();

const tracerRegistry = createTracerRegistry();
pinia.use(createPlugin([piniaPluginActionFlow], { tracerHandler: tracerRegistry.tracerHandler }));
tracerRegistry.addScopesListener(['onActionStore']);
app.use(pinia)
app.mount('#app')
