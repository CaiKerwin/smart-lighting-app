import Vue from 'vue'
import VueI18n from 'vue-i18n'
import messages from './index.js'

Vue.use(VueI18n)

// 语言存储 key 与默认语言：utils/locale.js 从这里复用，保证全项目只有一份定义
export const LOCALE_STORAGE_KEY = 'locale'
export const DEFAULT_LANGUAGE = 'zh-Hans'

/**
 * 读取持久化的语言
 *
 * 必须「调用时」才读存储：在模块初始化阶段（import 期间）求值会早于 uni 环境就绪
 * 取不到本地存储，从而永远回退成简体中文。合法性校验交给 utils/locale.js
 * 的 getCurrentLanguage()（那里维护受支持语言的唯一清单）
 */
export function readStoredLocale() {
	try {
		return uni.getStorageSync(LOCALE_STORAGE_KEY) || DEFAULT_LANGUAGE
	} catch (e) {
		return DEFAULT_LANGUAGE
	}
}

/**
 * 全局唯一的 VueI18n 实例（单例）
 *
 * 为什么单独放一个模块：
 * 该实例既要挂到根 Vue 上（new Vue({ i18n })）提供 $t()
 * 又要被 utils/locale.js 的 setLanguage() 用来切换语言
 * 若两处分别 import 不同模块，setLanguage() 改到的就不是真正生效的实例
 * 表现为「语言选了但界面文字不变」
 *
 * 本模块刻意不 import utils/locale.js，避免两者形成循环依赖
 */
const i18n = new VueI18n({
	locale: DEFAULT_LANGUAGE, // 占位，紧接着由 resolveLocale() 覆盖为持久化的语言
	messages
})

/** 用当前持久化语言初始化/覆盖实例语言 */
export function resolveLocale() {
	i18n.locale = readStoredLocale()
	return i18n.locale
}

export default i18n
