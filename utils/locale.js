/**
 * 多语言（国际化）管理
 *
 * 语言清单 LANGUAGE_OPTIONS 是唯一数据源
 * 避免多处硬编码导致选项与顺序不一致
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
 * @param {string} label - 语言自称（切换入口与语言选择页中的显示文案，固定不翻译）
 * @param {string} letter - 语言选择页的分组索引字母（按语言英文名称首字母，供 uni-indexed-list 分组与右侧索引）
 */
export const LANGUAGE_OPTIONS = [
	{ value: 'zh-Hans', label: '简体中文', letter: 'C' },
	{ value: 'zh-Hant', label: '繁體中文', letter: 'C' },
	{ value: 'en', label: 'English(United States)', letter: 'E' },
	{ value: 'ar', label: 'اللغة العربية', letter: 'A' }
]

/**
 * 语言选择页（uni-indexed-list）数据源
 *
 * uni-indexed-list 的 options 要求为 [{ letter, data }]：letter 同时作为分组标题
 * 与右侧索引，data 只接受字符串。这里组内使用语言自称，保证用户在任何当前语言下都能认出自己的语言
 * 分组按英文名称首字母排序
 */
export const LANGUAGE_INDEX_OPTIONS = LANGUAGE_OPTIONS.reduce((groups, option) => {
	let group = groups.find((item) => item.letter === option.letter)
	if (!group) {
		group = { letter: option.letter, data: [] }
		groups.push(group)
	}
	group.data.push(option.label)
	return groups
}, []).sort((a, b) => a.letter.localeCompare(b.letter))

/** 按语言标识取语言自称，非法标识返回空字符串 */
export function getLanguageLabel(value) {
	const option = LANGUAGE_OPTIONS.find((item) => item.value === value)
	return option ? option.label : ''
}

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
	LANGUAGE_INDEX_OPTIONS,
	DEFAULT_LANGUAGE,
	getCurrentLanguage,
	getLanguageLabel,
	isSupportedLanguage,
	setLanguage
}
