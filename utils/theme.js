/**
 * 白天/夜间模式主题管理
 *
 * 实现思路（H5与小程序通用）：
 * 1. 用 Vue.observable 维护全局响应式主题状态，通过 main.js 中的全局 mixin
 *    向所有页面/组件注入 isDarkMode / themeClass / toggleMode，切换后所有界面自动刷新；
 * 2. App.vue 全局样式中定义了主题 CSS 变量（page 上为白天模式默认值，
 *    .theme-dark 类上为夜间模式覆盖值），页面根节点绑定 themeClass 即可整体换肤；
 * 3. 主题选择通过 uni.setStorageSync 持久化，重启后自动恢复；
 * 4. 通过 uni.setBackgroundColor / uni.setNavigationBarColor / body 背景
 *    同步窗口与原生导航栏颜色，避免切换或翻页时露出白色底色。
 */
import Vue from 'vue'

// 主题存储 key
const THEME_STORAGE_KEY = 'appTheme'

// 白天模式配置（与当前界面样式一致）
const LIGHT_CONFIG = {
	pageBg: '#F8F8F8', // 窗口/页面背景
	bodyBg: '#f8f8f8', // H5 body 背景
	navBg: '#F8F8F8', // 原生导航栏背景
	navFrontColor: '#000000' // 原生导航栏文字颜色
}

// 夜间模式配置
const DARK_CONFIG = {
	pageBg: '#12151c',
	bodyBg: '#12151c',
	navBg: '#12151c',
	navFrontColor: '#ffffff'
}

/**
 * 读取本地存储的主题，无存储或值非法时回退为白天模式
 */
function readStoredMode() {
	try {
		const mode = uni.getStorageSync(THEME_STORAGE_KEY)
		return mode === 'dark' ? 'dark' : 'light'
	} catch (e) {
		return 'light'
	}
}

// 全局响应式主题状态：所有组件通过 computed 读取，切换后自动联动刷新
export const themeState = Vue.observable({
	mode: readStoredMode()
})

/** 当前是否为夜间模式 */
export function isDarkMode() {
	return themeState.mode === 'dark'
}

/**
 * 将主题应用到系统级 UI：
 * - 微信小程序：窗口背景 + 原生导航栏颜色
 * - H5：body 背景 + 页面导航栏颜色
 */
export function applyTheme() {
	const conf = isDarkMode() ? DARK_CONFIG : LIGHT_CONFIG

	// 原生导航栏（H5 / 微信小程序）
	try {
		uni.setNavigationBarColor({
			frontColor: conf.navFrontColor,
			backgroundColor: conf.navBg,
			animation: { duration: 300, timingFunc: 'easeIn' }
		})
	} catch (e) {
		// 个别平台不支持时静默降级，不影响主题切换
	}

	// #ifdef MP-WEIXIN
	// 微信小程序窗口背景（防止页面边缘/下拉回弹露出浅色）
	try {
		uni.setBackgroundColor({
			backgroundColor: conf.pageBg,
			backgroundColorTop: conf.pageBg,
			backgroundColorBottom: conf.pageBg
		})
	} catch (e) {
		// 静默降级
	}
	// #endif

	// #ifdef H5
	// H5 端同步 body 背景
	try {
		document.body.style.backgroundColor = conf.bodyBg
	} catch (e) {
		// 静默降级
	}
	// #endif
}

/**
 * 设置主题
 * @param {'light'|'dark'} mode 目标主题
 */
export function setTheme(mode) {
	const next = mode === 'dark' ? 'dark' : 'light'
	if (themeState.mode === next) {
		return
	}
	themeState.mode = next
	try {
		uni.setStorageSync(THEME_STORAGE_KEY, next)
	} catch (e) {
		// 存储失败仅本次生效
	}
	applyTheme()
}

/** 切换白天/夜间模式 */
export function toggleTheme() {
	setTheme(isDarkMode() ? 'light' : 'dark')
}

export default themeState
