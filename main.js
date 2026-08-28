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
import { themeState, toggleTheme, applyTheme } from './utils/theme.js'
Vue.config.productionTip = false
App.mpType = 'app'

// 全局主题混入：所有页面/组件自动获得以下响应式能力，无需逐个引入
Vue.mixin({
	computed: {
		// 是否为夜间模式（响应式：切换主题后所有界面自动刷新）
		isDarkMode() {
			return themeState.mode === 'dark'
		},
		// 绑定到页面根节点的主题 class，用于切换 CSS 变量（theme-dark / theme-light）
		themeClass() {
			return themeState.mode === 'dark' ? 'theme-dark' : 'theme-light'
		}
	},
	methods: {
		// 切换白天/夜间模式
		toggleMode() {
			toggleTheme()
		}
	},
	// 页面级生命周期：每次进入页面时同步原生导航栏与窗口背景，
	// 避免从其他页面进入/返回时出现浅色导航栏（组件不受影响）
	onShow() {
		applyTheme()
	}
})

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
