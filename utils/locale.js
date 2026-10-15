/**
 * 多语言（国际化）管理
 *
 * 语言清单 LANGUAGE_OPTIONS 是唯一数据源，选择平台页 / 登录页 / 手机号登录页
 *    顶部语言切换入口，以及首页菜单里的「语言-Language」共用同一份清单，
 *    避免多处硬编码导致选项与顺序不一致；
 * 当前语言通过 uni.setStorageSync('locale') 持久化（main.js 启动时调用getCurrentLanguage() 读取同一个 key），重启后自动恢复
 * 切换语言时同步三处，保证界面、uni 内置文案、下次启动都生效：
 *    - i18n.locale：VueI18n 实例语言，$t() 立即更新
 *    - uni.setLocale()：同步 uni-app 内置组件（showActionSheet / showModal 等）文案
 *    - 本地存储：持久化，供下次启动读取
 *
 * 注意：这里引用的 i18n 必须是「挂在根 Vue 上的那个实例」，
 * 即 locale/i18n.js 中的单例。若误引用 locale/index.js（那只是语言包数据对象），
 * 改 locale 不会影响界面，表现为「语言切了但文字没变」。
 */
import i18n, { LOCALE_STORAGE_KEY, DEFAULT_LANGUAGE } from '@/locale/i18n'

// 存储 key 与默认语言由 locale/i18n.js 定义，这里对外透出，避免两处各写一份
export { LOCALE_STORAGE_KEY, DEFAULT_LANGUAGE }

/**
 * 支持的语言清单（唯一数据源）
 * @param {string} value - uni-app / VueI18n 使用的语言标识
 * @param {string} label - 语言自称（切换入口与选择面板中的显示文案，固定不翻译）
 */
export const LANGUAGE_OPTIONS = [
	{ value: 'zh-Hans', label: '简体中文' },
	{ value: 'zh-Hant', label: '繁體中文' },
	{ value: 'en', label: 'English(United States)' },
	{ value: 'ar', label: 'اللغة العربية' }
]

// uni.showActionSheet 的选项文案（仅语言自称，不参与多语言翻译）
export const LANGUAGE_ITEM_LIST = LANGUAGE_OPTIONS.map((item) => item.label)

// 语言标识清单，与 LANGUAGE_ITEM_LIST 下标一一对应（供 tapIndex 反查语言）
export const LANGUAGE_VALUES = LANGUAGE_OPTIONS.map((item) => item.value)

/** 判断语言标识是否受支持 */
export function isSupportedLanguage(value) {
	return LANGUAGE_OPTIONS.some((item) => item.value === value)
}

/**
 * 读取当前语言，无存储或值非法时回退为简体中文
 * @returns {string} 语言标识
 */
export function getCurrentLanguage() {
	try {
		const value = uni.getStorageSync(LOCALE_STORAGE_KEY)
		return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE
	} catch (e) {
		return DEFAULT_LANGUAGE
	}
}

/**
 * 设置语言并持久化
 * @param {string} value - 语言标识，非法值回退为简体中文
 * @returns {string} 实际生效的语言标识
 */
export function setLanguage(value) {
	const next = isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE

	// 切换 VueI18n 实例语言，界面上的 $t() 文案立即刷新（实例为全局单例，见 locale/i18n.js）
	try {
		i18n.locale = next
	} catch (e) {
		// i18n 未初始化时静默降级
	}

	// 同步 uni-app 内置文案与应用级语言状态（showActionSheet 取消按钮、showModal 确定/取消等）
	try {
		uni.setLocale(next)
	} catch (e) {
		// 个别平台不支持时静默降级，不影响 $t() 文案切换
	}

	// 持久化，重启后自动恢复
	try {
		uni.setStorageSync(LOCALE_STORAGE_KEY, next)
	} catch (e) {
		// 存储失败仅本次生效
	}

	return next
}

export default {
	LANGUAGE_OPTIONS,
	LANGUAGE_ITEM_LIST,
	LANGUAGE_VALUES,
	DEFAULT_LANGUAGE,
	getCurrentLanguage,
	isSupportedLanguage,
	setLanguage
}
