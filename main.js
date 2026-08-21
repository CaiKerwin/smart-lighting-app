import App from './App'
import VueI18n from 'vue-i18n'
import messages from './locale/index.js'

Vue.use(VueI18n)

const i18n = new VueI18n({
	locale: uni.getStorageSync('locale') || 'zh-Hans',
	messages
})

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App,
	i18n
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
// import { createI18n } from 'vue-i18n'
// const i18n = createI18n(i18nConfig)
export function createApp() {
	const app = createSSRApp(App)
	//app.use(i18n)
	return {
		app
	}
}
// #endif
