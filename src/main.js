import { createApp } from 'vue'
import App from './App.vue'
import store from './store/store.js';
import { createRouter, createWebHistory } from 'vue-router'
import Navbar from './Navbar.vue'
import Index from './Index.vue'
import Pdh from './views/Pdh.vue'
import Sgb from './views/Sgb.vue'
import Swl from './views/Swl.vue'

const routes = [
    { path: '/', component: Index },
    { path: '/pdh', component: Pdh },
    { path: '/sgb', component: Sgb },
    { path: '/swl', component: Swl }
];

const router = createRouter({
    history: createWebHistory(),
    routes // 修正从 router 变为 routes
});

const app = createApp(App);
app.component('Navbar', Navbar);
app.use(router);
app.use(store); // 确保 Vuex store 被添加到 Vue 应用
app.mount('#app');