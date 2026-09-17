/**
 * 百度地图工具
 *
 * 平台差异：
 * - H5：动态加载百度地图 JSAPI GL（浏览器端 AK），底图 / 搜索 / 逆地理编码全部由 JSAPI 提供；
 * - 微信小程序：底图由内置 <map> 组件渲染（腾讯地图，GCJ-02 坐标），
 *   搜索与逆地理编码通过百度地图 Web 服务 API（小程序端 AK）请求，
 *   坐标在 BD-09 与 GCJ-02 之间转换后使用。
 *
 * 坐标约定：对外统一使用 BD-09（百度经纬度 bd09ll），与后端接口一致
 */

import { wgs84ToGcj02, gcj02ToBd09, bd09ToGcj02 } from './common.js';

/* ==================== 常量 ==================== */

// H5（浏览器端）AK
export const BAIDU_AK_H5 = 'coxubkUu0KC8mN35T3bx7tiyb4z2cnob';
// 微信小程序端 AK
export const BAIDU_AK_MP = 'FmDtKP91m8tZIZ0XFt29iNJM9SYnoVH4';

// JSAPI GL 脚本与样式（官方 /api 加载器内部使用 document.write，异步加载必须直接取 getscript）
const BMAP_GL_SCRIPT = 'https://api.map.baidu.com/getscript?type=webgl&v=1.0&services=';
const BMAP_GL_STYLE = 'https://api.map.baidu.com/res/webgl/10/bmap.css';
// 小程序端 Web 服务 API
const BMAP_WEB_SUGGESTION = 'https://api.map.baidu.com/place/v2/suggestion';
const BMAP_WEB_REVERSE = 'https://api.map.baidu.com/reverse_geocoding/v3/';

// 默认城市（与 Android 端一致，检索限定城市，避免跨城结果）与兜底中心点（深圳龙华）
export const DEFAULT_CITY = '深圳市';
export const DEFAULT_CENTER = { lat: 22.76944, lng: 113.8289 };
export const DEFAULT_ZOOM = 18;

// 标注物类型（/station/gis/SetPos 的 type 字段）
export const POS_TYPE_BOX = 0;   // 配电箱 / 专变（id 传站点 id）
export const POS_TYPE_WATER = 3; // 水浸（走 /station/water/SetPos，本页面暂未使用）
export const POS_TYPE_POLE = 14; // 灯杆（id 传灯杆 id）

// 地图标记图标（小程序 map 组件 markers 必填 iconPath）
export const PIN_ICON = '/static/common/map/marker-pin.png';
export const DOT_ICON = '/static/common/map/location-dot.png';
export const LOCATE_ICON = '/static/common/map/locate.png';

// 页面间通信事件名（对应 Android 的 COORDINATE / 结果回传事件）
export const EVENT_LOCATION_RESULT = 'deviceLocationResult';

/* ==================== 平台判断 ==================== */

/** 是否 H5 端（条件编译 + 运行时判断双保险） */
export function isH5Platform() {
	// #ifdef H5
	return typeof document !== 'undefined' && typeof window !== 'undefined';
	// #endif
	// #ifndef H5
	return false;
	// #endif
}

/** 当前平台使用的百度地图 AK */
export function getBaiduAk() {
	return isH5Platform() ? BAIDU_AK_H5 : BAIDU_AK_MP;
}

/* ==================== JSAPI GL 加载（H5） ==================== */

let glLoadingPromise = null;

/**
 * 动态加载百度地图 JSAPI GL（H5）
 * @returns {Promise<Object>} window.BMapGL
 */
export function loadBMapGL() {
	// 非 H5 平台（小程序 / App）不使用 JSAPI
	if (!isH5Platform()) {
		return Promise.reject(new Error('当前平台不支持百度地图 JSAPI'));
	}
	// #ifdef H5
	if (typeof window !== 'undefined' && window.BMapGL) {
		return Promise.resolve(window.BMapGL);
	}
	if (glLoadingPromise) {
		return glLoadingPromise;
	}
	glLoadingPromise = new Promise((resolve, reject) => {
		try {
			window.BMAP_PROTOCOL = 'https';
			window.BMapGL_loadScriptTime = new Date().getTime(); // 与官方加载器保持一致
			// 控件 / 信息窗样式（官方加载器会一并注入，直接取 getscript 时需自行注入）
			if (typeof document !== 'undefined' && !document.querySelector('link[data-bmapgl-ui]')) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.type = 'text/css';
				link.setAttribute('data-bmapgl-ui', 'gl');
				link.href = BMAP_GL_STYLE;
				document.head.appendChild(link);
			}
			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = `${BMAP_GL_SCRIPT}&ak=${BAIDU_AK_H5}&t=${Date.now()}`;
			script.onload = () => {
				if (window.BMapGL) {
					resolve(window.BMapGL);
				} else {
					glLoadingPromise = null;
					reject(new Error('百度地图脚本加载异常'));
				}
			};
			script.onerror = () => {
				glLoadingPromise = null;
				reject(new Error('百度地图加载失败，请检查网络或 AK 配置'));
			};
			document.head.appendChild(script);
		} catch (e) {
			glLoadingPromise = null;
			reject(e);
		}
	});
	return glLoadingPromise;
	// #endif
	// #ifndef H5
	return Promise.reject(new Error('当前平台不支持百度地图 JSAPI'));
	// #endif
}

/**
 * 地图类型常量（BMapGL 中为字符串常量，脚本未就绪时使用同值兜底）
 * @param {boolean} satellite 是否实景（卫星）图
 * @returns {string}
 */
export function resolveMapType(satellite) {
	const name = satellite ? 'BMAP_SATELLITE_MAP' : 'BMAP_NORMAL_MAP';
	const fallback = satellite ? 'B_SATELLITE_MAP' : 'B_NORMAL_MAP';
	try {
		if (typeof window !== 'undefined' && window[name]) {
			return window[name];
		}
	} catch (e) {
		// 忽略：使用兜底常量
	}
	return fallback;
}

/* ==================== 坐标转换 ==================== */

/**
 * BD-09 → GCJ-02（小程序 <map> 使用）
 * @param {number} lat 纬度（BD-09）
 * @param {number} lng 经度（BD-09）
 */
export function bd09ToGcj(lat, lng) {
	const gcj = bd09ToGcj02(Number(lng), Number(lat));
	return { lat: gcj.lat, lng: gcj.lng };
}

/**
 * GCJ-02 → BD-09（小程序点击取点后提交使用）
 * @param {number} lat 纬度（GCJ-02）
 * @param {number} lng 经度（GCJ-02）
 */
export function gcjToBd09(lat, lng) {
	const bd = gcj02ToBd09(Number(lng), Number(lat));
	return { lat: bd.lat, lng: bd.lng };
}

/* ==================== 当前位置 ==================== */

/**
 * 获取当前定位（统一返回 BD-09）
 * @returns {Promise<{lat:number,lng:number}>}
 */
export function getCurrentPoint() {
	if (isH5Platform()) {
		return new Promise((resolve, reject) => {
			if (typeof navigator === 'undefined' || !navigator.geolocation) {
				reject(new Error('当前浏览器不支持定位'));
				return;
			}
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					// 浏览器定位为 WGS-84 → GCJ-02 → BD-09
					const gcj = wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude);
					resolve(gcjToBd09(gcj.lat, gcj.lng));
				},
				(err) => reject(new Error(err && err.message ? err.message : '定位失败')),
				{ timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
			);
		});
	}

	return new Promise((resolve, reject) => {
		uni.getLocation({
			type: 'gcj02', // 小程序返回 GCJ-02
			success: (res) => resolve(gcjToBd09(res.latitude, res.longitude)),
			fail: (err) => reject(new Error(err && err.errMsg ? err.errMsg : '定位失败'))
		});
	});
}

/* ==================== 地点搜索 ==================== */

/**
 * 关键字搜索地点
 * @param {string} keyword 关键字
 * @param {{city?:string}} [options] city：检索城市（默认深圳市）
 * @returns {Promise<Array<{title:string,address:string,lat:number,lng:number}>>} BD-09 坐标
 */
export function searchPlace(keyword, options = {}) {
	const word = String(keyword || '').trim();
	if (!word) {
		return Promise.resolve([]);
	}
	const city = options.city || DEFAULT_CITY;
	return isH5Platform() ? h5SearchPlace(word, city) : mpSearchPlace(word, city);
}

/** H5：百度地图 JSAPI LocalSearch（不传 map，避免百度自行渲染结果面板与标注） */
function h5SearchPlace(keyword, city) {
	return loadBMapGL().then((BMapGL) => new Promise((resolve, reject) => {
		let settled = false;
		let timer = null;
		try {
			const search = new BMapGL.LocalSearch(city, {
				pageCapacity: 10,
				renderOptions: { map: null, autoViewport: false, selectFirstResult: false },
				onSearchComplete: (results) => {
					if (settled) return;
					settled = true;
					if (timer) clearTimeout(timer);
					resolve(normalizeH5Results(results));
				}
			});
			timer = setTimeout(() => {
				if (settled) return;
				settled = true;
				reject(new Error('搜索超时，请重试'));
			}, 12000);
			search.search(keyword);
		} catch (e) {
			if (timer) clearTimeout(timer);
			reject(e);
		}
	}));
}

/** 解析 LocalSearch 结果（BMapGL 的 LocalResult：getCurrentNumPois / getPoi） */
function normalizeH5Results(results) {
	const list = [];
	if (!results) return list;
	try {
		const count = typeof results.getCurrentNumPois === 'function' ? results.getCurrentNumPois() : 0;
		for (let i = 0; i < count; i++) {
			const poi = typeof results.getPoi === 'function' ? results.getPoi(i) : null;
			if (!poi) continue;
			const point = poi.point || poi.location || null;
			const lng = point ? Number(point.lng !== undefined ? point.lng : point.lon) : NaN;
			const lat = point ? Number(point.lat) : NaN;
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
			list.push({
				title: poi.title || poi.name || '',
				address: poi.address || '',
				lat,
				lng
			});
		}
	} catch (e) {
		console.error('解析搜索结果失败', e);
	}
	return list;
}

/** 小程序：百度地图 Web 服务 API（Place Suggestion） */
function mpSearchPlace(keyword, city) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BMAP_WEB_SUGGESTION,
			method: 'GET',
			timeout: 10000,
			data: {
				query: keyword,
				region: city,
				city_limit: true,
				output: 'json',
				ak: BAIDU_AK_MP
			},
			success: (res) => {
				const body = res && res.data;
				if (!body || body.status !== 0) {
					reject(new Error((body && body.message) || '搜索失败'));
					return;
				}
				const list = (body.result || []).map((item) => {
					const loc = item.location || {};
					// 联想接口同时返回 address（含社区/楼栋）与省市区，优先用更精确的 address
					const area = [item.province, item.city, item.district, item.business].filter(Boolean).join('');
					const address = item.address ? String(item.address).replace(/-/g, '') : area;
					return {
						title: item.name || '',
						address,
						lat: Number(loc.lat),
						lng: Number(loc.lng)
					};
				}).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
				resolve(list);
			},
			fail: (err) => reject(new Error((err && err.errMsg) || '搜索失败'))
		});
	});
}

/* ==================== 逆地理编码 ==================== */

/**
 * 逆地理编码：坐标 → 地址
 * @param {number} lat 纬度（BD-09）
 * @param {number} lng 经度（BD-09）
 * @returns {Promise<{address:string,components:Object|null}>}
 */
export function reverseGeocode(lat, lng) {
	return isH5Platform() ? h5ReverseGeocode(lat, lng) : mpReverseGeocode(lat, lng);
}

/** H5：JSAPI Geocoder */
function h5ReverseGeocode(lat, lng) {
	return loadBMapGL().then((BMapGL) => new Promise((resolve) => {
		try {
			const geocoder = new BMapGL.Geocoder();
			geocoder.getLocation(new BMapGL.Point(Number(lng), Number(lat)), (rs) => {
				if (!rs) {
					resolve({ address: '', components: null });
					return;
				}
				const comp = rs.addressComponents || null;
				const components = comp ? {
					province: comp.province || '',
					city: comp.city || '',
					district: comp.district || '',
					street: comp.street || '',
					streetNumber: comp.streetNumber || '',
					town: comp.town || '',
					adcode: ''
				} : null;
				// 无标准地址时退化为最近的 POI
				let address = rs.address || '';
				if (!address && Array.isArray(rs.surroundingPois) && rs.surroundingPois.length) {
					const poi = rs.surroundingPois[0];
					address = [poi.title, poi.address].filter(Boolean).join(' ');
				}
				resolve({ address, components });
			});
		} catch (e) {
			console.error('逆地理编码失败', e);
			resolve({ address: '', components: null });
		}
	})).catch(() => ({ address: '', components: null }));
}

/** 小程序：百度地图 Web 服务 API（逆地址解析） */
function mpReverseGeocode(lat, lng) {
	return new Promise((resolve) => {
		uni.request({
			url: BMAP_WEB_REVERSE,
			method: 'GET',
			timeout: 10000,
			data: {
				location: `${lat},${lng}`,
				coordtype: 'bd09ll',
				output: 'json',
				ak: BAIDU_AK_MP
			},
			success: (res) => {
				const body = res && res.data;
				if (!body || body.status !== 0 || !body.result) {
					resolve({ address: '', components: null });
					return;
				}
				const result = body.result;
				const comp = result.addressComponent || null;
				const components = comp ? {
					province: comp.province || '',
					city: comp.city || '',
					district: comp.district || '',
					street: comp.street || '',
					streetNumber: comp.street_number || '',
					town: comp.town || '',
					adcode: comp.adcode ? String(comp.adcode) : ''
				} : null;
				resolve({
					address: result.formatted_address || result.sematic_description || '',
					components
				});
			},
			fail: () => resolve({ address: '', components: null })
		});
	});
}

/* ==================== 地址信息（随 AddDevice 提交） ==================== */

/** 空地址对象（与 QrFastAddBean.address 字段一致） */
export function emptyAddressBean() {
	return {
		adcode: '', address: '', city: '', cityCode: '',
		country: '', countryCode: '', district: '',
		province: '', street: '', streetNumber: '', town: ''
	};
}

/**
 * 逆地理结果 → 添加设备接口的 address 字段（QrFastAddBean.address）
 * @param {Object|null} components 逆地理返回的 addressComponents
 * @param {string} [address] 完整地址文本
 */
export function toAddressBean(components, address) {
	const bean = emptyAddressBean();
	if (!components) return bean;
	bean.province = components.province || '';
	bean.city = components.city || '';
	bean.district = components.district || '';
	bean.street = components.street || '';
	bean.streetNumber = components.streetNumber || '';
	bean.town = components.town || '';
	bean.adcode = components.adcode || '';
	bean.country = '中国';
	bean.address = address || '';
	return bean;
}

export default {
	isH5Platform,
	getBaiduAk,
	loadBMapGL,
	resolveMapType,
	bd09ToGcj,
	gcjToBd09,
	getCurrentPoint,
	searchPlace,
	reverseGeocode,
	emptyAddressBean,
	toAddressBean,
	BAIDU_AK_H5,
	BAIDU_AK_MP,
	DEFAULT_CITY,
	DEFAULT_CENTER,
	DEFAULT_ZOOM,
	POS_TYPE_BOX,
	POS_TYPE_WATER,
	POS_TYPE_POLE,
	EVENT_LOCATION_RESULT,
	PIN_ICON,
	DOT_ICON,
	LOCATE_ICON
};
