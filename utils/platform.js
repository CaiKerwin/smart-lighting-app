/**
 * 后端接口统一配置：所有 HTTP 请求与 WebSocket 均使用 www.amdm.top
 *
 * - HTTP 基址（非 H5 端）：https://www.amdm.top/api/center
 * - HTTP 基址（H5 端）：/api-cloud/center（经 manifest.json 的 devServer 代理转发到
 *   https://www.amdm.top/api/center，规避跨域）
 * - WebSocket：wss://www.amdm.top/api/center/data
 */

// 统一的后端域名
const DOMAIN = 'www.amdm.top';

// HTTP 接口基址
const HTTP_BASE = `https://${DOMAIN}/api/center`;
// H5 端接口路径（走 devServer 代理）
const H5_PATH = '/api-cloud/center';
// WebSocket 地址
const WS_URL = `wss://${DOMAIN}/api/center/data`;

// 会话缓存（不含「记住密码」）：退出登录 / 登录过期时清除
const SESSION_CACHE_KEYS = [
	'authToken',
	'curCust',
	'curApp',
	'userId',
	'userOperations',
	'userLightShowColumns'
];

/**
 * 清除会话缓存（token、客户信息、权限等），保留「记住密码」
 * 退出登录 / 登录过期时调用：重新登录时仍可自动填充账号密码
 */
export function clearSessionCache() {
	SESSION_CACHE_KEYS.forEach((key) => {
		try {
			uni.removeStorageSync(key);
		} catch (e) {
			// 静默失败
		}
	});
}

/**
 * 获取统一的 HTTP 接口基址
 * - H5 端：走 devServer 代理路径，避免跨域
 * - 非 H5 端（小程序/App）：完整 HTTPS 地址
 * @returns {string}
 */
export function getBaseUrl() {
	// #ifdef H5
	return H5_PATH;
	// #endif
	// #ifndef H5
	return HTTP_BASE;
	// #endif
}

/**
 * 获取统一的 WebSocket 地址
 * @returns {string}
 */
export function getWsUrl() {
	return WS_URL;
}

export default {
	clearSessionCache,
	getBaseUrl,
	getWsUrl
};
