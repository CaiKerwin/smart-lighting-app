/**
 * GIS 渲染性能工具（纯函数，不依赖 uni / 地图 SDK，可直接单测）
 *
 *
 * 视口估算：取不到 SDK 可视范围时（页面首屏、程序化移动后），
 *    由中心点 + 缩放级别 + 屏幕像素推算出近似范围，保证「裁剪」始终生效；
 * 网格聚合：按屏幕像素尺度把密集点位合并成带数量的聚合点，
 *    输出数量只与「视口尺寸 / 聚合直径」有关（几何上限），与标注物总数无关。
 *
 * 坐标约定：lat / lng 同尺度使用（BD-09 / GCJ-02 差异在百米级，对聚合与裁剪无影响）。
 */

/** 地球长半径（米，Web 墨卡托使用球体半径） */
const EARTH_RADIUS_M = 6378137;
/** 瓦片边长（像素） */
const TILE_SIZE = 256;
/** 1 纬度约等于多少米（聚合 / 范围估算使用，误差 < 1%） */
const METERS_PER_DEG_LAT = 111320;
/** 墨卡托可表示的最大纬度 */
const MAX_MERCATOR_LAT = 85.05112878;
/** 缩放级别取值范围（与地图 SDK 一致） */
const MIN_ZOOM = 1;
const MAX_ZOOM = 21;

/** 数值兜底：非有限数一律返回 fallback */
function finiteNumber(value, fallback) {
	const num = Number(value);
	return Number.isFinite(num) ? num : fallback;
}

/**
 * 缩放级别 → 地面分辨率（米/像素）
 * @param {number} zoom 缩放级别
 * @param {number} lat 参考纬度（用于余弦修正）
 * @returns {number} 米/像素
 */
export function metersPerPixel(zoom, lat) {
	const z = Math.min(Math.max(finiteNumber(zoom, 15), MIN_ZOOM), MAX_ZOOM);
	const safeLat = Math.min(Math.max(finiteNumber(lat, 0), -MAX_MERCATOR_LAT), MAX_MERCATOR_LAT);
	const rad = (safeLat * Math.PI) / 180;
	return (Math.cos(rad) * 2 * Math.PI * EARTH_RADIUS_M) / (TILE_SIZE * Math.pow(2, z));
}

/**
 * 由中心点 / 缩放级别 / 屏幕像素估算可视范围
 * 说明：地图 SDK 的 getBounds / getRegion 是异步或可能失败的，
 *      标注物渲染不能因为「拿不到范围」就退化成全量渲染，这里给出确定性的兜底范围。
 * @param {{lat:number,lng:number}} center 中心点
 * @param {number} zoom 缩放级别
 * @param {number} widthPx 视口宽度（px）
 * @param {number} heightPx 视口高度（px）
 * @returns {{latMin:number,latMax:number,lngMin:number,lngMax:number}|null}
 */
export function estimateBounds(center, zoom, widthPx, heightPx) {
	const lat = finiteNumber(center && center.lat, NaN);
	const lng = finiteNumber(center && center.lng, NaN);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	const width = Math.max(finiteNumber(widthPx, 375), 1);
	const height = Math.max(finiteNumber(heightPx, 667), 1);
	const resolution = metersPerPixel(zoom, lat);
	const latHalf = (resolution * height) / 2 / METERS_PER_DEG_LAT;
	const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.05);
	const lngHalf = (resolution * width) / 2 / (METERS_PER_DEG_LAT * cosLat);
	return {
		latMin: lat - latHalf,
		latMax: lat + latHalf,
		lngMin: lng - lngHalf,
		lngMax: lng + lngHalf
	};
}

/**
 * 聚合点直径（px）：离详细图标档位越远，聚合粒度越大
 * 作用：低缩放时视口内点极多，用更大的聚合直径把输出数量压到几十个；
 *      临近详细档位时用较小直径，保证「再放大一点就能看到单个灯杆」的观感。
 * @param {number} zoom 当前缩放
 * @param {number} detailZoom 该图层切换详细图标的缩放阈值
 * @returns {number} 聚合点直径（px）
 */
export function clusterCellPx(zoom, detailZoom) {
	const gap = Math.max(finiteNumber(detailZoom, 18) - finiteNumber(zoom, 15), 0);
	if (gap >= 5) return 132;
	if (gap >= 3) return 104;
	if (gap >= 1) return 80;
	return 64;
}

/**
 * 单轮网格聚合（内部使用）
 * @param {Array} list 点位
 * @param {number} zoom 缩放
 * @param {number} cellPx 聚合直径
 * @param {number} refLat 参考纬度
 * @returns {Array<{lat:number,lng:number,count:number,first:Object}>}
 */
function clusterOnce(list, zoom, cellPx, refLat) {
	// 屏幕像素 → 经纬度步长（经度按参考纬度做余弦修正）
	const cellMeters = cellPx * metersPerPixel(zoom, refLat);
	const latStep = Math.max(cellMeters / METERS_PER_DEG_LAT, 1e-7);
	const cosLat = Math.max(Math.cos((refLat * Math.PI) / 180), 0.05);
	const lngStep = Math.max(cellMeters / (METERS_PER_DEG_LAT * cosLat), 1e-7);

	const buckets = new Map();
	const total = list.length;
	for (let i = 0; i < total; i++) {
		const item = list[i];
		if (!item) continue;
		const lat = finiteNumber(item.lat, NaN);
		const lng = finiteNumber(item.lng, NaN);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
		const key = Math.floor(lng / lngStep) + ':' + Math.floor(lat / latStep);
		const bucket = buckets.get(key);
		if (bucket) {
			bucket.count += 1;
			bucket.latSum += lat;
			bucket.lngSum += lng;
		} else {
			buckets.set(key, { count: 1, latSum: lat, lngSum: lng, first: item });
		}
	}

	const clusters = [];
	buckets.forEach((bucket) => {
		clusters.push({
			lat: bucket.latSum / bucket.count,
			lng: bucket.lngSum / bucket.count,
			count: bucket.count,
			first: bucket.first
		});
	});
	return clusters;
}

/**
 * 网格聚合：把屏幕像素尺度相同的点位合并为一个聚合点
 *
 * 复杂度 O(n)，正常情况下的输出数量 ≈ (视口宽 / 聚合直径) × (视口高 / 聚合直径)，
 * 与 n 无关；一旦「视口范围与缩放级别不匹配」（例如只上报了 scale、没上报 region，
 * 沿用旧的更大范围）导致聚合点超出 maxClusters，会自动放大聚合直径再聚合，
 * 保证交给地图的覆盖物数量始终有硬上限。
 *
 * @param {Array<{lat:number,lng:number}>} items 待聚合点位（建议先按视口裁剪）
 * @param {{zoom:number, cellPx:number, lat?:number, maxClusters?:number}} options
 *        zoom：当前缩放；cellPx：聚合直径（px）；lat：参考纬度；maxClusters：聚合点数量上限
 * @returns {Array<{lat:number,lng:number,count:number,first:Object}>}
 *          聚合点坐标取桶内均值，first 为桶内第一个点（count === 1 时即为它本身）
 */
export function clusterByGrid(items, options = {}) {
	const list = items || [];
	if (!list.length) return [];

	const zoom = finiteNumber(options.zoom, 15);
	const cellPx = Math.max(finiteNumber(options.cellPx, 64), 8);
	const maxClusters = Math.max(finiteNumber(options.maxClusters, 0), 0);
	let refLat = finiteNumber(options.lat, NaN);
	if (!Number.isFinite(refLat) && list[0]) refLat = finiteNumber(list[0].lat, NaN);
	if (!Number.isFinite(refLat)) refLat = 0;

	let clusters = clusterOnce(list, zoom, cellPx, refLat);
	if (!maxClusters) return clusters;

	// 逐轮放大聚合直径，直到聚合点数量落入上限（正常情况下第一轮就满足）
	let current = cellPx;
	let guard = 0;
	while (clusters.length > maxClusters && guard < 8) {
		const factor = Math.min(Math.max(Math.sqrt(clusters.length / maxClusters), 1.2), 4);
		current = Math.ceil(current * factor);
		clusters = clusterOnce(list, zoom, current, refLat);
		guard += 1;
	}
	return clusters;
}

export default {
	metersPerPixel,
	estimateBounds,
	clusterCellPx,
	clusterByGrid
};
