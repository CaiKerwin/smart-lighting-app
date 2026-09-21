/**
 * GIS 地图模块工具
 *
 * - 常量：标注物类型 / 业务类型 / 缩放阈值 / 图标路径；
 * - 图标映射：配电箱、灯杆、专变、水浸的状态 → 图标（5 态 / 3 态）；
 * - 接口：QuerySimple、QueryGisItems、QueryLines、PoleInfo、QueryPoleByLight；
 * - 数据整理：标注物分类、可视范围过滤、灯杆单灯字段包装；
 * - 格式化：数值、时间、水位（cm）。
 *
 * 坐标约定：接口返回的经纬度均为百度坐标（bd09ll），本模块不做坐标转换。
 */

import { request } from './request';
import { base64Decode } from './common';

/* ==================== 标注物「地图点击类型」 ==================== */

export const MAP_TYPE_BOX = 1;         // 配电箱标注物
export const MAP_TYPE_POLE = 2;        // 灯杆标注物
export const MAP_TYPE_LUX = 3;         // 光控标注物
export const MAP_TYPE_CABLE = 4;       // 线缆
export const MAP_TYPE_SPECIAL = 6;     // 专变标注物
export const MAP_TYPE_WATER = 7;       // 水浸标注物

/* ==================== 搜索回传类型 ==================== */

export const SEARCH_TYPE_ROAD = 1;     // 道路
export const SEARCH_TYPE_BOX = 2;      // 配电箱
export const SEARCH_TYPE_POLE = 3;     // 灯杆

/* ==================== 业务类型 ==================== */

export const BIZ_TYPE_BOX = 0;         // 配电箱（站点）
export const BIZ_TYPE_SPECIAL = 2;     // 专变（同时是 supplyMode=2 的判定值）
export const BIZ_TYPE_WATER = 3;       // 水浸（地图选点类型）
export const BIZ_TYPE_POLE = 14;       // 灯杆
export const BIZ_TYPE_LIGHT = 199;     // 单灯
export const BIZ_TYPE_LUX = 299;       // 光控

/** 标注物 supplyMode 语义：1 配电箱 / 2 专变 / 4 水浸 */
export const SUPPLY_MODE_BOX = 1;
export const SUPPLY_MODE_SPECIAL = 2;
export const SUPPLY_MODE_WATER = 4;

/* ==================== 缩放级别阈值 ==================== */

export const ZOOM_DEFAULT = 18;        // 默认缩放（defaultZoom）
export const ZOOM_MIN_RENDER = 4.2;    // 低于该缩放清除配电箱名称（Android 端阈值）
export const ZOOM_TEXT = 18;           // 名称显示阈值（showMarkText）
export const ZOOM_BOX_DETAIL = 18.2;   // 配电箱由海量点切详细图标阈值（showPoleZoom）
export const ZOOM_POLE_DETAIL = 18;    // 灯杆由海量点切详细图标阈值
export const ZOOM_SEARCH_ROAD = 18;    // 搜索「道路」定位后的缩放（Android sendLatLng 传 18f）
export const ZOOM_SEARCH_DEVICE = 21;  // 搜索「配电箱 / 单灯」定位后的缩放（Android 传 21f）

/** 可视范围过滤的经纬度余量 */
const BOUND_OFFSET_NEAR = 0.001;       // zoom >= 17
const BOUND_OFFSET_FAR = 0.0001;       // zoom < 17

/* ==================== 图标资源 ==================== */

// 图标统一缩放倍数
export const ICON_SCALE = 0.7;

export const POLE_ICON_ROOT = '/static/gis/poleStatus';                    // 灯杆状态图标（按灯数分档）
export const LIGHT_STATUS_ROOT = '/static/operation/lightStatus';           // 单灯状态图标（筛选栏图例）
export const BOX_ICON_ROOT = '/static/operation/powerboxStatus';           // 配电箱状态图标
export const SPECIAL_ICON_ROOT = '/static/operation/boxStationStatus';     // 专变（箱变）状态图标
export const WATER_ICON_ROOT = '/static/operation/waterStatus';            // 水浸状态图标
// 低缩放的聚合点图标（H5 端用百度海量点的 star / circle 形状，小程序端用该图标）
export const POINT_STAR_ICON = '/static/gis/mapPoint/star-filled.png';     // 配电箱：star-filled
export const POINT_DOT_ICON = '/static/gis/mapPoint/smallcircle-filled.png'; // 单灯灯杆：smallcircle-filled

// H5 / 小程序 marker 显示尺寸（按图标原始尺寸 × 0.7）
export const POINT_ICON_SIZE = { width: 14, height: 14 };    // 聚合点图标
export const BOX_ICON_SIZE = { width: 14, height: 17 };      // powerboxStatus 20x24
export const SPECIAL_ICON_SIZE = { width: 34, height: 35 };  // boxStationStatus 48x50
export const WATER_ICON_SIZE = { width: 15, height: 17 };    // waterStatus 22x24

// 聚合点颜色（H5 海量点使用）
export const POINT_STAR_COLOR = '#ff8f1f';
export const POINT_DOT_COLOR = '#3a7bf7';

/** 标注物名称标签偏移（H5 端按像素偏移实现 Android 的 lat - 0.000015） */
export const LABEL_PIXEL_OFFSET_Y = 2;

/* ==================== 状态 → 图标 ==================== */

/**
 * 标注物状态码（Android 端 online / running / alarm 三字段组合）
 * @param {Object} item 标注物（MapMarkBean / MapWaterBean）
 * @returns {'turn-on'|'turn-on-alarm'|'turn-off'|'turn-off-alarm'|'offline'}
 */
export function markerStatusKey(item) {
	if (!item || !item.online) return 'offline';
	if (item.running && item.alarm) return 'turn-on-alarm';
	if (item.running) return 'turn-on';
	if (item.alarm) return 'turn-off-alarm';
	return 'turn-off';
}

/**
 * 灯杆状态 → 图标文件名（与 static/gis/poleStatus 下文件一致）
 * @param {Object} pole QuerySimple 灯杆对象
 * @returns {string} light-on / light-on-alarm / light-off / light-off-alarm / offline
 */
export function poleStatusFile(pole) {
	if (!pole || !pole.online) return 'offline';
	if (pole.running && pole.alarm) return 'light-on-alarm';
	if (pole.running) return 'light-on';
	if (pole.alarm) return 'light-off-alarm';
	return 'light-off';
}

/**
 * 灯杆灯数分档目录
 * 说明：count 为 0（灯杆上未挂单灯）时无对应图标，按 1 档兜底
 * @param {number} count 灯杆下单灯数量
 * @returns {string} oneLight / twoLight / threeLight / multiLight
 */
export function poleLightDir(count) {
	const num = Number(count) || 0;
	if (num >= 4) return 'multiLight';
	if (num === 3) return 'threeLight';
	if (num === 2) return 'twoLight';
	return 'oneLight';
}

/** 灯杆图标原始宽度（px，与 static/gis/poleStatus 下各文件实际尺寸一致） */
export function poleIconSourceWidth(dir, statusFile) {
	if (dir === 'twoLight') return 55;
	if (dir === 'oneLight') return (statusFile === 'light-on' || statusFile === 'light-off') ? 31 : 39;
	return 53; // threeLight / multiLight
}

/** 灯杆图标显示尺寸（按 0.7 倍缩放，保持原始宽高比） */
export function poleIconSize(dir, statusFile) {
	return {
		width: Math.round(poleIconSourceWidth(dir, statusFile) * ICON_SCALE),
		height: Math.round(60 * ICON_SCALE)
	};
}

/** 配电箱图标（5 态） */
export function boxIconPath(item) {
	return `${BOX_ICON_ROOT}/${markerStatusKey(item)}.png`;
}

/** 专变图标（5 态） */
export function specialIconPath(item) {
	return `${SPECIAL_ICON_ROOT}/${markerStatusKey(item)}.png`;
}

/** 水浸图标（3 态：在线-报警 / 在线-无报警 / 离线） */
export function waterIconPath(item) {
	if (!item || !item.online) return `${WATER_ICON_ROOT}/offline.png`;
	return item.alarm ? `${WATER_ICON_ROOT}/warning.png` : `${WATER_ICON_ROOT}/normal.png`;
}

/** 灯杆图标（5 态 × 灯数分档） */
export function poleIconPath(item) {
	const statusFile = poleStatusFile(item);
	const dir = poleLightDir(item && item.count);
	return `${POLE_ICON_ROOT}/${dir}/${statusFile}.png`;
}

/* ==================== 单灯状态筛选栏 ==================== */

/** 5 个单灯状态：名称 + 图标 + 统计/过滤条件 */
export const POLE_STATE_LIST = [
	{
		name: '正常亮灯',
		icon: `${LIGHT_STATUS_ROOT}/turn-on.png`,
		match: item => !!item.online && !!item.running && !item.alarm
	},
	{
		name: '开灯报警',
		icon: `${LIGHT_STATUS_ROOT}/turn-on-alarm.png`,
		match: item => !!item.online && !!item.running && !!item.alarm
	},
	{
		name: '正常灭灯',
		icon: `${LIGHT_STATUS_ROOT}/turn-off.png`,
		match: item => !!item.online && !item.running && !item.alarm
	},
	{
		name: '关灯报警',
		icon: `${LIGHT_STATUS_ROOT}/turn-off-alarm.png`,
		match: item => !!item.online && !item.running && !!item.alarm
	},
	{
		name: '离线',
		icon: `${LIGHT_STATUS_ROOT}/offline.png`,
		match: item => !item.online
	}
];

/**
 * 统计灯杆各状态数量
 * @param {Array} poles 灯杆列表
 * @returns {number[]} 与 POLE_STATE_LIST 顺序一致的数量数组
 */
export function countPoleStates(poles) {
	const counts = POLE_STATE_LIST.map(() => 0);
	(poles || []).forEach((pole) => {
		POLE_STATE_LIST.forEach((state, index) => {
			if (state.match(pole)) counts[index] += 1;
		});
	});
	return counts;
}

/**
 * 按状态筛选灯杆
 * @param {Array} poles 灯杆列表
 * @param {number} stateIndex 选中的状态下标，-1 表示不过滤
 * @returns {Array}
 */
export function filterPoleByState(poles, stateIndex) {
	const state = POLE_STATE_LIST[stateIndex];
	if (!state) return poles || [];
	return (poles || []).filter(state.match);
}

/* ==================== 接口响应解析 ==================== */

/**
 * 解析响应 payload.data（字符串时按 Base64 解码后 JSON.parse）
 * @param {Object} res request 返回的原始响应
 * @returns {any} 业务数据；解析失败返回 null
 */
export function parseResponseData(res) {
	const body = res && res.data;
	if (!body) return null;
	let data = body.data;
	if (typeof data === 'string') {
		if (!data) return null;
		try {
			data = JSON.parse(base64Decode(data));
		} catch (e) {
			console.error('解析接口数据失败', e);
			return null;
		}
	}
	return data === undefined ? null : data;
}

/** 解析接口业务错误信息（兼容 msg / message / Base64 密文 / JSON 字符串） */
export function decodeErrorMessage(payload) {
	let msg = (payload && (payload.msg || payload.message)) || '';
	const data = payload && payload.data;
	if (typeof data === 'string' && data) {
		// 形似 Base64 的字符串先尝试解码
		if (/^[A-Za-z0-9+/=]+$/.test(data)) {
			const decoded = base64Decode(data);
			if (decoded) msg = decoded;
		}
		if (!msg) msg = data;
	}
	if (typeof msg === 'string' && msg.charAt(0) === '{') {
		try {
			const parsed = JSON.parse(msg);
			if (parsed && typeof parsed === 'object') msg = parsed.msg || parsed.message || msg;
		} catch (e) {
			// 非 JSON 时按原文返回
		}
	}
	return String(msg || '');
}

/**
 * 接口业务是否失败（code 存在且不为 0）
 * @param {Object} payload 原始响应体
 */
export function isBusinessError(payload) {
	return !!(payload && payload.code !== undefined && payload.code !== null && payload.code !== 0);
}

/** 从任意结构里取出列表（数组 / {list} / {items} / {rows}） */
export function toList(data) {
	if (Array.isArray(data)) return data;
	if (data && typeof data === 'object') {
		if (Array.isArray(data.list)) return data.list;
		if (Array.isArray(data.items)) return data.items;
		if (Array.isArray(data.rows)) return data.rows;
	}
	return [];
}

/* ==================== 数据接口 ==================== */

/**
 * 地图标注物（配电箱 / 灯杆 / 光控 / 专变）
 * POST /station/gis/QuerySimple
 * @param {{groupId?:number,stationId?:number}} [params]
 */
export function fetchMapMarks(params = {}) {
	return request({
		url: '/station/gis/QuerySimple',
		method: 'POST',
		data: {
			groupId: Number(params.groupId) || 0,
			stationId: Number(params.stationId) || 0
		}
	});
}

/**
 * 水浸地图数据
 * POST /station/water/QueryGisItems
 */
export function fetchWaterItems(params = {}) {
	return request({
		url: '/station/water/QueryGisItems',
		method: 'POST',
		data: {
			groupId: Number(params.groupId) || 0,
			stationId: Number(params.stationId) || 0
		}
	});
}

/**
 * 地图线缆
 * POST /station/gis/QueryLines
 */
export function fetchLines(params = {}) {
	return request({
		url: '/station/gis/QueryLines',
		method: 'POST',
		data: {
			groupId: Number(params.groupId) || 0,
			stationId: Number(params.stationId) || 0
		}
	});
}

/**
 * 按单灯通信 ID 查所属灯杆
 * POST /station/config/QueryPoleByLight
 * @param {string} code 8 位通信 ID
 */
export function fetchPoleByLight(code) {
	return request({
		url: '/station/config/QueryPoleByLight',
		method: 'POST',
		data: { code: String(code || '') }
	});
}

/**
 * 灯杆详细信息（含杆上单灯列表）
 * POST /station/gis/PoleInfo
 * @param {number|string} poleId 灯杆 id
 */
export function fetchPoleInfo(poleId) {
	return request({
		url: '/station/gis/PoleInfo',
		method: 'POST',
		data: { id: poleId }
	});
}

/**
 * 单灯显示列配置（判断是否显示漏电列）
 * POST /sys/setting/QueryLightColumns
 */
export function fetchLightColumns() {
	return request({
		url: '/sys/setting/QueryLightColumns',
		method: 'POST',
		data: {}
	});
}

/* ==================== 标注物分类 ==================== */

/**
 * QuerySimple 混合列表 → 灯杆 / 配电箱 / 专变
 * 分类规则（文档 §5.2）：type==14 灯杆；type==0 && stationType==1 时按 supplyMode 分 1 配电箱 / 2 专变
 * @param {Array} list QuerySimple 返回的 MapMarkBean[]
 * @returns {{boxes:Array, poles:Array, specials:Array}}
 */
export function classifyMarkers(list) {
	const boxes = [];
	const poles = [];
	const specials = [];
	(list || []).forEach((item) => {
		if (!item) return;
		const type = Number(item.type);
		if (type === BIZ_TYPE_POLE) {
			poles.push(item);
			return;
		}
		if (type === BIZ_TYPE_BOX && Number(item.stationType) === 1) {
			if (Number(item.supplyMode) === SUPPLY_MODE_SPECIAL) {
				specials.push(item);
			} else if (Number(item.supplyMode) === SUPPLY_MODE_BOX) {
				boxes.push(item);
			}
		}
	});
	return { boxes, poles, specials };
}

/** 坐标是否有效（非数值或 (0,0) 视为无效，无法落图） */
export function isValidPoint(lat, lng) {
	const latNum = Number(lat);
	const lngNum = Number(lng);
	return Number.isFinite(latNum) && Number.isFinite(lngNum) && !(latNum === 0 && lngNum === 0);
}

/* ==================== 可视范围过滤 ==================== */

/**
 * 按可视范围过滤标注物（lat ∈ [latMin, latMax]，lng ∈ [lngMin - offset, lngMax + offset]）
 * @param {Array} list 标注物列表
 * @param {{latMin:number,latMax:number,lngMin:number,lngMax:number}|null} bounds 可视范围（无值时不过滤）
 * @param {number} zoom 当前缩放
 * @returns {Array}
 */
export function filterByViewport(list, bounds, zoom) {
	const items = list || [];
	if (!bounds) return items;
	const offset = Number(zoom) >= 17 ? BOUND_OFFSET_NEAR : BOUND_OFFSET_FAR;
	const { latMin, latMax, lngMin, lngMax } = bounds;
	return items.filter((item) => {
		const lat = Number(item.lat);
		const lng = Number(item.lng);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
		if (lat < latMin || lat > latMax) return false;
		return lng >= (lngMin - offset) && lng <= (lngMax + offset);
	});
}

/** 列表中心点（BD-09），无有效数据时返回 null */
export function centerOfList(list) {
	const items = (list || []).filter(item => item && isValidPoint(item.lat, item.lng));
	if (!items.length) return null;
	let sumLat = 0;
	let sumLng = 0;
	items.forEach((item) => {
		sumLat += Number(item.lat);
		sumLng += Number(item.lng);
	});
	return { lat: sumLat / items.length, lng: sumLng / items.length };
}

/**
 * 按经纬度跨度推算小程序端地图缩放级别（无 setViewport 时的兜底）
 * @param {Array} list 标注物列表
 * @returns {number} 缩放级别
 */
export function scaleForList(list) {
	const items = (list || []).filter(item => item && isValidPoint(item.lat, item.lng));
	if (items.length < 2) return ZOOM_DEFAULT;
	const lats = items.map(item => Number(item.lat));
	const lngs = items.map(item => Number(item.lng));
	const span = Math.max(
		Math.max.apply(null, lats) - Math.min.apply(null, lats),
		Math.max.apply(null, lngs) - Math.min.apply(null, lngs)
	);
	if (span > 0.08) return 12;
	if (span > 0.04) return 13;
	if (span > 0.02) return 14;
	if (span > 0.01) return 15;
	if (span > 0.005) return 16;
	if (span > 0.002) return 17;
	return ZOOM_DEFAULT;
}

/* ==================== 灯杆详情（单灯 Tab） ==================== */

/**
 * PoleInfo 返回的单灯 → 灯杆详情弹窗显示对象（字段与状态操作模块单灯详情一致）
 * @param {Object} light PoleInfo 返回的 LightBean
 * @param {Object} [pole] 灯杆标注物（PoleInfo 未返回在线状态时兜底）
 * @param {number|string} [stationId] 兜底站点 id
 * @returns {Object}
 */
export function wrapPoleLight(light, pole, stationId) {
	const raw = light || {};
	const content = raw.content || {};
	const lastData = raw.lastData || {};

	// 启用通道（en1~en4）
	const channels = [];
	[1, 2, 3, 4].forEach((i) => {
		if (content['en' + i]) channels.push(i);
	});
	// 多通道字段用 \n 连接（每行一个通道的值）
	const joinPlain = (key, decimals) => {
		const lines = channels.map(i => formatMeasure(lastData[key + i], decimals));
		return lines.length ? lines.join('\n') : '-';
	};

	return {
		id: raw.code || '-',                 // ID 列显示通信 ID（与单灯详情一致）
		lightId: raw.id,                     // 单灯 id
		stationId: raw.stationId != null ? raw.stationId : (stationId != null ? stationId : 0),
		poleId: content.pole != null ? content.pole : raw.poleId,
		name: raw.name || '',
		channelName: channels.map(i => 'K' + i + ':' + (content['nm' + i] || '')).join('\n') || '-',
		onlineText: (raw.online !== undefined && raw.online !== null ? raw.online : !!(pole && pole.online)) ? '在线' : '离线',
		voltage: formatMeasure(lastData.u, 1),
		ampere: joinPlain('c', 2),
		power: joinPlain('p', 0),
		brightness: joinPlain('op', 0),
		colorTemp: joinPlain('ct', 0),
		temp: formatMeasure(lastData.tc, 0),
		energy: joinPlain('q', 1),
		duration: formatMeasure(lastData.lo != null ? lastData.lo : raw.newLightOnTime, 0),
		leakageCurrent: joinPlain('cl', 1),
		lastCommTime: formatDateTime(raw.fireTime != null ? raw.fireTime : lastData.time)
	};
}

/* ==================== 格式化 ==================== */

/** 数值格式化：负数（-1/-2 表示无效）与空值一律显示 '-' */
export function formatMeasure(val, decimals = 0) {
	if (val === null || val === undefined || val === '') return '-';
	const num = Number(val);
	if (isNaN(num)) return '-';
	if (num < 0) return '-';
	if (decimals === 0) return String(Math.round(num));
	return Number.isInteger(num) ? String(num) : num.toFixed(decimals);
}

/** 毫秒时间戳 → yyyy-MM-dd HH:mm:ss */
export function formatDateTime(ms) {
	if (!ms) return '-';
	const d = new Date(Number(ms));
	if (isNaN(d.getTime())) return '-';
	const pad = n => (n < 10 ? '0' + n : '' + n);
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
		+ ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

/**
 * 水位值 → 文案（文档 §11.1.3：0 → "0 cm"，否则原值 / 10 → cm）
 * @param {number} val 水浸接口返回的水位值
 */
export function waterLevelText(val) {
	const num = Number(val);
	if (!Number.isFinite(num) || num === 0) return '0 cm';
	return `${num / 10} cm`;
}

/**
 * 水位计填充比例（水位计 maxScale = 30，即 30 cm 满量程，level / 300）
 * @param {number} level 水浸接口返回的 level
 * @returns {number} 0 ~ 1
 */
export function waterGaugeRatio(level) {
	const num = Number(level);
	if (!Number.isFinite(num) || num <= 0) return 0;
	const ratio = num / 300;
	return ratio > 1 ? 1 : ratio;
}

/** 名称文字估算宽度（px，用于地图标签水平居中；ASCII 与中文分别估算） */
export function labelPixelWidth(text) {
	let width = 0;
	String(text || '').split('').forEach((ch) => {
		width += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 13 : 7;
	});
	return width + 14; // 左右内边距
}

export default {
	MAP_TYPE_BOX,
	MAP_TYPE_POLE,
	MAP_TYPE_CABLE,
	MAP_TYPE_SPECIAL,
	MAP_TYPE_WATER,
	SEARCH_TYPE_ROAD,
	SEARCH_TYPE_BOX,
	SEARCH_TYPE_POLE,
	BIZ_TYPE_BOX,
	BIZ_TYPE_SPECIAL,
	BIZ_TYPE_WATER,
	BIZ_TYPE_POLE,
	BIZ_TYPE_LIGHT,
	BIZ_TYPE_LUX,
	ZOOM_DEFAULT,
	ZOOM_MIN_RENDER,
	ZOOM_TEXT,
	ZOOM_BOX_DETAIL,
	ZOOM_POLE_DETAIL,
	ZOOM_SEARCH_ROAD,
	ZOOM_SEARCH_DEVICE,
	ICON_SCALE,
	POLE_ICON_ROOT,
	LIGHT_STATUS_ROOT,
	BOX_ICON_ROOT,
	SPECIAL_ICON_ROOT,
	WATER_ICON_ROOT,
	POINT_STAR_ICON,
	POINT_DOT_ICON,
	POINT_STAR_COLOR,
	POINT_DOT_COLOR,
	POLE_STATE_LIST,
	markerStatusKey,
	poleStatusFile,
	poleLightDir,
	poleIconSourceWidth,
	poleIconSize,
	boxIconPath,
	specialIconPath,
	waterIconPath,
	poleIconPath,
	countPoleStates,
	filterPoleByState,
	parseResponseData,
	decodeErrorMessage,
	isBusinessError,
	toList,
	fetchMapMarks,
	fetchWaterItems,
	fetchLines,
	fetchPoleByLight,
	fetchPoleInfo,
	fetchLightColumns,
	classifyMarkers,
	isValidPoint,
	filterByViewport,
	centerOfList,
	scaleForList,
	wrapPoleLight,
	formatMeasure,
	formatDateTime,
	waterLevelText,
	waterGaugeRatio,
	labelPixelWidth
};
