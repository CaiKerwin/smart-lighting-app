/**
 * 路线导航工具（百度 / 高德 / 腾讯 / 谷歌地图）
 *
 *
 * 保证「路线导航」在不同入口下表现一致：
 * - 小程序端（MP）：调用方用 openMiniMap 打开内置地图（见 mapSelectionPopup 在 MP 端不渲染）；
 * - H5 端：先同步打开空白窗口（规避浏览器对异步 window.open 的拦截），定位成功后跳网页版路线；
 * - App 端：定位成功后通过 plus.runtime.openURL 唤起对应地图客户端，未安装时提示。
 *
 * 坐标约定：终点/起点对外传入 GCJ-02（百度地图单独用 BD-09，见 destBd）。
 */

import { gcj02ToBd09, gcj02ToWgs84, wgs84ToGcj02 } from './common.js';

/** 起点名称（与单灯详情界面保持一致） */
export const NAV_ORIGIN_NAME = '我的位置';

/** 目的地兜底名称 */
const FALLBACK_DEST_NAME = '目的地';

/** 有效坐标判断（非数值或 (0,0) 视为无效） */
function isValidPoint(point) {
	if (!point) return false;
	const lat = Number(point.lat);
	const lng = Number(point.lng);
	return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

/**
 * 根据地图类型构建导航链接（起点 + 终点，默认驾车，路线直接展示）
 * @param {string} mapName - 地图名称：百度地图 / 高德地图 / 腾讯地图 / 谷歌地图
 * @param {Object} target - 导航目标
 * @param {{lat:number,lng:number}|null} [target.origin] - 起点坐标（GCJ-02），为空时仅展示终点位置
 * @param {{lat:number,lng:number}} target.dest - 终点坐标（GCJ-02）
 * @param {{lat:number,lng:number}} [target.destBd] - 终点坐标（BD-09），百度地图优先使用
 * @param {string} [target.destName] - 终点名称
 * @returns {{webUrl:string, appUrl:string}} webUrl 网页链接 / appUrl 客户端跳转链接
 */
export function buildMapUrls(mapName, target = {}) {
	const dest = target.dest;
	const destName = target.destName || FALLBACK_DEST_NAME;
	if (!isValidPoint(dest)) {
		return { webUrl: '', appUrl: '' };
	}
	const origin = target.origin;
	const hasOrigin = isValidPoint(origin);
	const originName = NAV_ORIGIN_NAME;

	switch (mapName) {
		case '百度地图': {
			// 百度地图使用 BD-09
			const bdDest = isValidPoint(target.destBd)
				? { lat: Number(target.destBd.lat), lng: Number(target.destBd.lng) }
				: gcj02ToBd09(dest.lng, dest.lat);
			const bdDestStr = `${bdDest.lat},${bdDest.lng}`;

			if (!hasOrigin) {
				return {
					webUrl: `https://api.map.baidu.com/marker?location=${bdDestStr}&title=${encodeURIComponent(destName)}&content=${encodeURIComponent('')}&output=html&src=smartlighting`,
					appUrl: `baidumap://map/marker?location=${bdDestStr}&title=${encodeURIComponent(destName)}&content=${encodeURIComponent('')}&src=smartlighting`
				};
			}
			const bdOrigin = gcj02ToBd09(origin.lng, origin.lat);
			const bdOriginStr = `${bdOrigin.lat},${bdOrigin.lng}`;
			return {
				webUrl: `https://api.map.baidu.com/direction?origin=${bdOriginStr}&destination=${bdDestStr}&mode=driving&coord_type=bd09ll&output=html&src=smartlighting`,
				appUrl: `baidumap://map/direction?origin=${bdOriginStr}&destination=${bdDestStr}&mode=driving&coord_type=bd09ll&src=smartlighting`
			};
		}
		case '高德地图': {
			// 高德地图使用 GCJ-02，网页 URI 坐标格式为 lng,lat
			const destStr = `${dest.lng},${dest.lat}`;
			const fromPart = hasOrigin
				? `from=${origin.lng},${origin.lat},${encodeURIComponent(originName)}&`
				: '';
			const appFromPart = hasOrigin
				? `slat=${origin.lat}&slon=${origin.lng}&sname=${encodeURIComponent(originName)}&`
				: '';
			return {
				webUrl: `https://uri.amap.com/navigation?${fromPart}to=${destStr},${encodeURIComponent(destName)}&mode=car&policy=0&src=smartlighting&coordinate=gaode&callnative=0`,
				appUrl: `amapuri://route/plan/?sourceApplication=smartlighting&${appFromPart}dlat=${dest.lat}&dlon=${dest.lng}&dname=${encodeURIComponent(destName)}&dev=0&t=0`
			};
		}
		case '腾讯地图': {
			// 腾讯地图使用 GCJ-02，fromcoord/tocoord 格式为 lat,lng
			const destStr = `${dest.lat},${dest.lng}`;
			const fromPart = hasOrigin
				? `from=${encodeURIComponent(originName)}&fromcoord=${origin.lat},${origin.lng}&`
				: '';
			if (!hasOrigin) {
				return {
					webUrl: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${destStr};title:${encodeURIComponent(destName)};addr:${encodeURIComponent('')}&referer=smartlighting`,
					appUrl: `qqmap://map/marker?marker=coord:${destStr};title:${encodeURIComponent(destName)}&referer=smartlighting`
				};
			}
			return {
				webUrl: `https://apis.map.qq.com/uri/v1/routeplan?type=drive&${fromPart}to=${encodeURIComponent(destName)}&tocoord=${destStr}&policy=0&referer=smartlighting`,
				appUrl: `qqmap://map/routeplan?type=drive&${fromPart}to=${encodeURIComponent(destName)}&tocoord=${destStr}&policy=0&referer=smartlighting`
			};
		}
		case '谷歌地图': {
			// 谷歌地图使用 WGS-84
			const wgsDest = gcj02ToWgs84(dest.lng, dest.lat);
			const destStr = `${wgsDest.lat},${wgsDest.lng}`;
			if (!hasOrigin) {
				return {
					webUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destStr)}`,
					appUrl: `comgooglemaps://?q=${destStr}`
				};
			}
			const wgsOrigin = gcj02ToWgs84(origin.lng, origin.lat);
			const originStr = `${wgsOrigin.lat},${wgsOrigin.lng}`;
			return {
				webUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&travelmode=driving`,
				appUrl: `comgooglemaps://?saddr=${originStr}&daddr=${destStr}&directionsmode=driving`
			};
		}
		default:
			uni.showToast({ title: '暂不支持该地图', icon: 'none' });
			return { webUrl: '', appUrl: '' };
	}
}

/** 打开地图：App 端跳转对应地图客户端，H5 端打开网页版 */
export function openMapUrl(urls) {
	if (!urls || (!urls.webUrl && !urls.appUrl)) return;
	// #ifdef APP-PLUS
	plus.runtime.openURL(urls.appUrl, (err) => {
		uni.showToast({ title: '打开地图失败，请确认是否已安装对应APP', icon: 'none' });
		console.error('打开地图失败', err);
	});
	// #endif
	// #ifdef H5
	window.open(urls.webUrl, '_blank');
	// #endif
}

/**
 * 路线导航：先取当前定位作为起点，再按所选地图打开路线
 * @param {string} mapName - 地图名称
 * @param {Object} target - 同 buildMapUrls 的 target
 */
export function navigateWithMap(mapName, target = {}) {
	// #ifdef H5
	// 在点击事件的同步调用栈中预先打开空窗口，避免异步定位回调里的 window.open 被浏览器拦截
	let navWindow = null;
	try {
		navWindow = window.open('about:blank', '_blank');
	} catch (e) {
		navWindow = null;
	}
	const openWeb = (urls) => {
		if (!urls || !urls.webUrl) {
			if (navWindow) navWindow.close();
			return;
		}
		if (navWindow) {
			navWindow.location.href = urls.webUrl;
		} else {
			window.open(urls.webUrl, '_blank');
		}
	};

	uni.showLoading({ title: '获取位置中...' });
	navigator.geolocation.getCurrentPosition(
		(pos) => {
			uni.hideLoading();
			// 浏览器定位返回 WGS-84，转换为 GCJ-02 作为起点
			const gcj = wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude);
			openWeb(buildMapUrls(mapName, { ...target, origin: gcj }));
		},
		(err) => {
			uni.hideLoading();
			console.error('定位失败:', err);
			// 定位失败时降级为仅展示终点位置，保证地图页面仍可打开
			openWeb(buildMapUrls(mapName, { ...target, origin: null }));
		},
		{ timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
	);
	// #endif

	// #ifndef H5
	uni.showLoading({ title: '获取位置中...' });
	uni.getLocation({
		type: 'gcj02', // 获取火星坐标系
		success: (location) => {
			uni.hideLoading();
			const origin = { lat: location.latitude, lng: location.longitude };
			openMapUrl(buildMapUrls(mapName, { ...target, origin }));
		},
		fail: (err) => {
			uni.hideLoading();
			console.error('定位失败', err);
			uni.showToast({ title: '获取当前位置失败，请检查定位权限', icon: 'none' });
		}
	});
	// #endif
}

/**
 * 小程序端打开内置地图查看位置
 * @param {{lat:number,lng:number}} dest - 目的地坐标（GCJ-02）
 * @param {string} [name] - 位置名称
 * @returns {boolean} 是否已发起打开（坐标为 0 / 非法时返回 false）
 */
export function openMiniMap(dest, name) {
	// #ifdef MP
	if (!isValidPoint(dest)) {
		return false;
	}
	uni.openLocation({
		latitude: Number(dest.lat),   // GCJ-02 坐标，小程序内置地图使用
		longitude: Number(dest.lng),
		scale: 16,
		name: name || FALLBACK_DEST_NAME,
		address: '',
		fail: (err) => {
			uni.showToast({ title: '打开地图失败', icon: 'none' });
			console.error('打开地图失败', err);
		}
	});
	return true;
	// #endif
	// #ifndef MP
	return false;
	// #endif
}

export default {
	NAV_ORIGIN_NAME,
	buildMapUrls,
	openMapUrl,
	navigateWithMap,
	openMiniMap
};
