import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)

app.config.errorHandler = (err, vm, info) => {
  console.error(err);
  const errDiv = document.createElement('div');
  errDiv.style = 'position:fixed; top:0; left:0; width:100%; z-index:9999; background:red; color:white; padding:20px; text-align:left; white-space:pre-wrap;';
  errDiv.innerHTML = `Vue Error in ${info}:<br/>${err.message}<br/>${err.stack}`;
  document.body.appendChild(errDiv);
};

app.mount('#app')
