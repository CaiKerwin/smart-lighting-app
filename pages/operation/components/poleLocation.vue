<!-- 灯杆位置 -->
<template>
	<view :class="themeClass" class="page">
		<!-- ==================== 地图 ==================== -->
		<view class="map-area">
			<!-- H5：百度地图 JSAPI GL 容器 -->
			<!-- #ifdef H5 -->
			<view id="poleMapCanvas" class="map-canvas"></view>
			<!-- #endif -->

			<!-- 小程序端：内置 map 组件（坐标已转 GCJ-02） -->
			<!-- #ifndef H5 -->
			<map
				:latitude="mpCenterGcj.lat"
				:longitude="mpCenterGcj.lng"
				:markers="mpMarkers"
				:scale="mapScale"
				:show-location="false"
				class="map-canvas"
				@markertap="onMiniMarkerTap"
			/>
			<!-- #endif -->

			<!-- 地图加载中 / 加载失败 -->
			<view v-if="mapStatusText" class="map-state" @click="onMapStateTap">
				<text class="map-state-text">{{ mapStatusText }}</text>
				<text v-if="mapError" class="map-state-retry">点击重试</text>
			</view>

			<!-- 无灯杆数据提示 -->
			<view v-if="!loading && !poleTotal && !mapStatusText" class="map-state">
				<text class="map-state-text">暂无灯杆数据</text>
			</view>

			<!-- 右上角：灯杆总数（type=14 的灯杆数量） -->
			<view class="total-badge">
				<text class="total-label">灯杆总数</text>
				<text class="total-value">{{ poleTotal }}</text>
			</view>

			<!-- 定位按钮 -->
			<!-- #ifdef H5 -->
			<view :class="{ 'is-locating': locating }" class="locate-btn" @click="locateCurrent">
				<image :src="locateIcon" class="locate-icon" />
			</view>
			<!-- #endif -->
			<!-- #ifndef H5 -->
			<!-- 小程序端 -->
			<cover-view :class="{ 'is-locating': locating }" class="locate-btn" @click="locateCurrent">
				<cover-image :src="locateIcon" class="locate-icon" />
			</cover-view>
			<!-- #endif -->
		</view>

		<!-- ==================== 灯杆详情弹窗 ==================== -->
		<PoleDetailPopup
			:lights="poleDetail.lights"
			:pole-name="poleDetail.name"
			:visible="detailVisible"
			@close="detailVisible = false"
			@click-image="getPoleImages"
			@click-modify-location="openPoleLocation('edit')"
			@click-navigation="onNavigate"
			@click-operation="onClickOperation"
			@click-show-location="openPoleLocation('view')"
		/>

		<!-- 线路导航弹窗 -->
		<!-- #ifndef MP -->
		<MapSelectionPopup ref="mapSelectionPopup" @select="onMapSelected" />
		<!-- #endif -->
	</view>
</template>

<script>
import { request } from '@/utils/request';
import { base64Decode, bd09ToGcj02 } from '@/utils/common';
import {
	isH5Platform,
	loadBMapGL,
	getCurrentPoint,
	DEFAULT_CENTER,
	DEFAULT_ZOOM,
	POS_TYPE_POLE,
	EVENT_LOCATION_RESULT,
	DOT_ICON,
	LOCATE_ICON
} from '@/utils/map';
import { navigateWithMap, openMiniMap } from '@/utils/navigation';
import PoleDetailPopup from './popup/common/poleDetailPopup.vue';
import MapSelectionPopup from '@/components/mapSelectionPopup.vue';

// 灯杆业务类型
const POLE_TYPE = 14;
// 灯杆状态图标根目录
const POLE_ICON_ROOT = '/static/gis/poleStatus';
// 图标统一缩放倍数
const ICON_SCALE = 0.7;
// 各状态图标原始高度
const ICON_SOURCE_HEIGHT = 60;
// 地图容器 id（H5）
const MAP_DOM_ID = 'poleMapCanvas';
// 名称标签（HTML 覆盖物）最多渲染的灯杆数量，超过只渲染图标
const MAX_LABEL_POLES = 200;
// 小程序端「当前定位」标记 id（灯杆标记 id 为下标 + 1，从 1 开始，故用 0 区分）
const MY_LOCATION_MARKER_ID = 0;
// 小程序端「当前定位」蓝点显示尺寸（px，与 static/common/map/location-dot.png 原始尺寸一致）
const MY_LOCATION_ICON_SIZE = 40;

/**
 * 灯杆状态 → 图标文件名
 * @param {Object} pole QuerySimple 灯杆对象
 * @returns {string} light-on / light-on-alarm / light-off / light-off-alarm / offline
 */
function poleStatusFile(pole) {
	if (!pole.online) return 'offline';
	if (pole.running && pole.alarm) return 'light-on-alarm';
	if (pole.running) return 'light-on';
	if (pole.alarm) return 'light-off-alarm';
	return 'light-off';
}

/**
 * 灯杆灯数分档目录
 * 说明：count 为 0（灯杆上未挂单灯）时接口未提供 pole_none 图标，按 1 档图标兜底显示
 * @param {number} count 灯杆下单灯数量
 * @returns {string} oneLight / twoLight / threeLight / multiLight
 */
function poleLightDir(count) {
	const num = Number(count) || 0;
	if (num >= 4) return 'multiLight';
	if (num === 3) return 'threeLight';
	if (num === 2) return 'twoLight';
	return 'oneLight';
}

/** 图标原始宽度（px，与 static/gis/poleStatus 下各文件实际尺寸一致） */
function poleIconSourceWidth(dir, statusFile) {
	if (dir === 'twoLight') return 55;
	if (dir === 'oneLight') return (statusFile === 'light-on' || statusFile === 'light-off') ? 31 : 39;
	return 53; // threeLight / multiLight
}

/** 图标显示尺寸（按 0.7 倍缩放，保持原始宽高比） */
function poleIconSize(dir, statusFile) {
	return {
		width: Math.round(poleIconSourceWidth(dir, statusFile) * ICON_SCALE),
		height: Math.round(ICON_SOURCE_HEIGHT * ICON_SCALE)
	};
}

/** 名称文字估算宽度（px，用于地图标签水平居中；ASCII 与中文分别估算） */
function labelPixelWidth(text) {
	let width = 0;
	String(text || '').split('').forEach((ch) => {
		width += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 13 : 7;
	});
	return width + 14; // 左右内边距
}

export default {
	name: 'poleLocation',
	components: {
		PoleDetailPopup,
		MapSelectionPopup
	},
	data() {
		return {
			// 入口参数（stationTwo 悬浮按钮传入；缺省 0 表示查询全部）
			stationId: 0,
			groupId: 0,
			boxName: '',

			// 灯杆数据
			poles: [],
			poleTotal: 0,
			loading: false,

			// 地图
			mapScale: DEFAULT_ZOOM,
			mpCenter: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }, // 小程序地图中心（BD-09）
			mapLoading: false,
			mapError: '',
			mapReady: false,

			// 当前定位（BD-09，点击定位按钮时获取并绘制蓝点）
			myLocation: null,
			locating: false,
			locateIcon: LOCATE_ICON,

			// 当前灯杆详情（PoleInfo）
			detailVisible: false,
			poleDetail: {
				id: '',
				name: '',
				lat: 0,
				lng: 0,
				lights: []
			},
			poleLocation: { lat: 0, lng: 0 },      // GCJ-02，小程序 openLocation / 高德 / 腾讯导航使用
			poleLocationBd09: { lat: 0, lng: 0 }   // BD-09，百度地图 / 修改定位使用
		};
	},
	computed: {
		// 地图状态提示文案（加载中 / 加载失败）
		mapStatusText() {
			if (this.mapError) return this.mapError;
			if (this.mapLoading) return '地图加载中…';
			return '';
		},
		// 小程序 map 组件中心点（GCJ-02）
		mpCenterGcj() {
			return bd09ToGcj02(this.mpCenter.lng, this.mpCenter.lat);
		},
		// 小程序 map 组件标记（GCJ-02）：当前位置蓝点 + 灯杆图标 + 灯杆名称标签
		mpMarkers() {
			const markers = [];
			// 当前位置（点击定位按钮后出现）：id 固定 0，锚点在图标中心，层级低于灯杆
			if (this.myLocation) {
				const gcj = bd09ToGcj02(this.myLocation.lng, this.myLocation.lat);
				markers.push({
					id: MY_LOCATION_MARKER_ID,
					latitude: gcj.lat,
					longitude: gcj.lng,
					iconPath: DOT_ICON,
					width: MY_LOCATION_ICON_SIZE,
					height: MY_LOCATION_ICON_SIZE,
					anchor: { x: 0.5, y: 0.5 },
					zIndex: 10
				});
			}
			this.poles.forEach((pole, index) => {
				const gcj = bd09ToGcj02(pole.lng, pole.lat);
				const size = poleIconSize(pole.iconDir, pole.statusFile);
				markers.push({
					id: index + 1,
					latitude: gcj.lat,
					longitude: gcj.lng,
					iconPath: pole.iconPath,
					width: size.width,
					height: size.height,
					anchor: { x: 0.5, y: 1 }, // 灯杆底部对准坐标点
					zIndex: 20,
					label: {
						content: pole.name,
						color: '#ffffff',
						fontSize: 11,
						bgColor: '#000000B3',
						borderRadius: 4,
						padding: 4,
						textAlign: 'center',
						anchorX: 0, // 相对图标中心水平居中
						anchorY: 0 // 图标下方
					}
				});
			});
			return markers;
		}
	},
	onLoad(options) {
		const opts = options || {};
		this.stationId = Number(opts.stationId) || 0;
		this.groupId = Number(opts.groupId) || 0;
		try {
			this.boxName = opts.boxName ? decodeURIComponent(opts.boxName) : '';
		} catch (e) {
			this.boxName = opts.boxName || '';
		}
		// 灯杆定位修改结果回传（showAndEditLocation 页面 SetPos 成功后同步本地坐标）
		uni.$on(EVENT_LOCATION_RESULT, this.onLocationResult);
		this.loadPoles();
	},
	mounted() {
		// H5 需要等 DOM 就绪后再初始化百度地图
		this.$nextTick(() => {
			this.initMap();
		});
	},
	onUnload() {
		this._unloaded = true;
		uni.$off(EVENT_LOCATION_RESULT, this.onLocationResult);
		this.destroyMap();
	},
	methods: {
		/* ==================== 数据加载 ==================== */
		/**
		 * 拉取地图标注物，筛选出灯杆（type=14）
		 * 请求体：{"groupId":0,"stationId":0}，stationId / groupId 由入口参数带入
		 */
		loadPoles() {
			this.loading = true;
			uni.showLoading({ title: '加载中...', mask: true });
			request({
				url: '/station/gis/QuerySimple',
				method: 'POST',
				data: {
					groupId: this.groupId,     // 分组 id，0 表示全部分组
					stationId: this.stationId  // 站点 id，0 表示全部站点
				}
			}).then((res) => {
				console.log(base64Decode(res.data.data))
				const payload = res && res.data;
				// 业务失败 → 提示并清空
				if (payload && payload.code !== undefined && payload.code !== null && payload.code !== 0) {
					this.setPoles([]);
					const msg = this.decodeErrorMessage(payload);
					if (msg && msg.indexOf('未查到相关数据') === -1) {
						uni.showToast({ title: msg, icon: 'none' });
					}
					return;
				}
				// 接口可能返回数组，也可能包一层 list
				const data = this.parseResponseData(res);
				let list = [];
				if (Array.isArray(data)) {
					list = data;
				} else if (data && Array.isArray(data.list)) {
					list = data.list;
				} else if (data && Array.isArray(data.items)) {
					list = data.items;
				}
				// 筛选 type=14（灯杆）
				this.setPoles(list.filter(item => Number(item && item.type) === POLE_TYPE));
			}).catch((err) => {
				console.error('获取灯杆数据失败', err && err.message);
				this.setPoles([]);
				uni.showToast({ title: '获取灯杆数据失败', icon: 'none' });
			}).finally(() => {
				this.loading = false;
				uni.hideLoading();
			});
		},
		/**
		 * 保存灯杆数据：灯杆总数为 type=14 的对象数量，无有效坐标的灯杆不落图
		 * @param {Array} list 筛选后的灯杆列表
		 */
		setPoles(list) {
			const poles = [];
			(list || []).forEach((item) => {
				const lat = Number(item && item.lat);
				const lng = Number(item && item.lng);
				// 坐标非数值或为 (0,0) 时无法落图（总数仍按接口返回统计）
				if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
				const statusFile = poleStatusFile(item);
				const iconDir = poleLightDir(item.count);
				poles.push({
					id: item.id,
					name: item.name || '',
					lat,
					lng,
					count: Number(item.count) || 0,
					online: !!item.online,
					running: !!item.running,
					alarm: !!item.alarm,
					statusFile,
					iconDir,
					iconPath: `${POLE_ICON_ROOT}/${iconDir}/${statusFile}.png`
				});
			});
			this.poles = poles;
			// 灯杆总数：接口返回的灯杆对象数量（文档要求取筛选结果 length）
			this.poleTotal = (list || []).length;
			this.$nextTick(() => {
				this.renderH5Markers();
				this.fitMapView();
			});
		},
		/* ==================== 地图初始化（H5） ==================== */
		/** 初始化地图：H5 创建百度地图实例；小程序由 <map> 组件渲染 */
		async initMap() {
			if (!isH5Platform()) return;
			this._unloaded = false;
			this.mapLoading = true;
			this.mapError = '';
			try {
				const BMapGL = await loadBMapGL();
				const container = document.getElementById(MAP_DOM_ID);
				if (!container) throw new Error('地图容器未就绪');
				// 页面切换动画期间容器可能尚未完成布局，BMapGL 在 0 尺寸容器上初始化会失败
				await this.waitForContainer(container);
				// BMapGL 依赖 WebGL 渲染，浏览器禁用 WebGL 时 SDK 内部会抛难以定位的错误，先显式检测
				if (!this.isWebGLAvailable()) {
					throw new Error('当前浏览器未启用 WebGL，无法加载百度地图，请开启浏览器硬件加速或更换 Chrome/Edge 后重试');
				}

				// 1. 创建地图实例（只传最少参数，避免部分 SDK 版本对构造选项处理异常）
				let map;
				try {
					map = new BMapGL.Map(container);
				} catch (e) {
					throw new Error('创建地图实例失败：' + this.errText(e));
				}
				this.h5Map = map;
				this.h5BMapGL = BMapGL;

				// 2. 关闭底图自带点击处理，避免与标注物点击冲突（设置失败不影响使用）
				try {
					if (typeof map.setOptions === 'function') {
						map.setOptions({ enableMapClick: false });
					}
				} catch (e) {
					console.warn('设置地图选项失败', e);
				}

				// 3. 设置中心点与缩放级别
				const center = this.poles.length ? this.poles[0] : DEFAULT_CENTER;
				try {
					map.centerAndZoom(new BMapGL.Point(center.lng, center.lat), this.mapScale);
				} catch (e) {
					throw new Error('设置地图中心点失败：' + this.errText(e));
				}

				// 4. 交互与事件绑定
				try {
					map.enableScrollWheelZoom(true);
				} catch (e) {
					console.warn('绑定地图事件失败', e);
				}

				this.mapReady = true;
				this.mapLoading = false;
				// 地图就绪后渲染（灯杆数据可能先于地图返回）
				this.renderH5Markers();
				this.fitMapView();
				// 地图重建（加载失败后点击重试）时补画当前位置蓝点
				if (this.myLocation) this.updateMyLocationOverlay();
			} catch (err) {
				// 清理半初始化的地图实例，保证「点击重试」时从头创建
				this.destroyMap();
				if (this._unloaded) return;
				this.mapLoading = false;
				this.mapReady = false;
				this.mapError = (err && err.message) || '地图加载失败';
				console.error('百度地图初始化失败', err);
			}
		},
		/** 等待地图容器完成布局并拥有实际尺寸（页面切换动画期间可能尚未就绪） */
		waitForContainer(container, timeout = 2000) {
			return new Promise((resolve, reject) => {
				const start = Date.now();
				const check = () => {
					if (this._unloaded) return reject(new Error('页面已关闭'));
					if (container && container.clientWidth > 0 && container.clientHeight > 0) return resolve();
					if (Date.now() - start >= timeout) return reject(new Error('地图容器尺寸异常，请重试'));
					setTimeout(check, 100);
				};
				check();
			});
		},
		/** 浏览器 WebGL 可用性检测（BMapGL 使用 WebGL 渲染） */
		isWebGLAvailable() {
			try {
				const canvas = document.createElement('canvas');
				return !!(window.WebGLRenderingContext &&
					(canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
			} catch (e) {
				return false;
			}
		},
		/** 错误信息提取（兼容 Error / 字符串 / 其它类型） */
		errText(err) {
			if (!err) return '';
			return typeof err.message === 'string' ? err.message : String(err);
		},
		/** 地图加载失败后点击重试 */
		onMapStateTap() {
			if (!this.mapError) return;
			this.mapLoading = true;
			this.mapError = '';
			this.initMap();
		},
		destroyMap() {
			if (!this.h5Map) return;
			try {
				if (typeof this.h5Map.clearOverlays === 'function') this.h5Map.clearOverlays();
				if (typeof this.h5Map.destroy === 'function') this.h5Map.destroy();
			} catch (e) {
				console.warn('销毁地图实例失败', e);
			}
			this.h5Map = null;
			this.h5BMapGL = null;
			this.h5Markers = [];
			this.h5Labels = [];
			this.h5Dot = null;
			this.h5DotRing = null;
			this.mapReady = false;
		},
		/* ==================== 标注物渲染 ==================== */
		/** 构建百度地图图标（灯杆底部对准坐标点） */
		buildH5Icon(BMapGL, url, size) {
			const iconSize = new BMapGL.Size(size.width, size.height);
			try {
				return new BMapGL.Icon(url, iconSize, {
					anchor: new BMapGL.Size(size.width / 2, size.height),
					imageSize: iconSize
				});
			} catch (e) {
				return new BMapGL.Icon(url, iconSize);
			}
		},
		/** 清除已渲染的灯杆标注物与名称标签 */
		clearH5Markers() {
			if (!this.h5Map) return;
			const overlays = [].concat(this.h5Markers || [], this.h5Labels || []);
			overlays.forEach((overlay) => {
				try {
					this.h5Map.removeOverlay(overlay);
				} catch (e) {
					console.warn('移除地图标注物失败', e);
				}
			});
			this.h5Markers = [];
			this.h5Labels = [];
		},
		/** 渲染灯杆标注物 + 灯杆名称标签（H5） */
		renderH5Markers() {
			if (!this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			const BMapGL = this.h5BMapGL;
			// 名称标签是 HTML 覆盖物，灯杆过多时（如未按站点过滤）只渲染图标，避免卡顿
			const showLabel = this.poles.length <= MAX_LABEL_POLES;
			this.clearH5Markers();
			this.poles.forEach((pole) => {
				const point = new BMapGL.Point(pole.lng, pole.lat);
				const size = poleIconSize(pole.iconDir, pole.statusFile);
				try {
					const marker = new BMapGL.Marker(point, { icon: this.buildH5Icon(BMapGL, pole.iconPath, size) });
					marker.addEventListener('click', () => this.openPoleDetail(pole));
					this.h5Map.addOverlay(marker);
					this.h5Markers.push(marker);

					if (!showLabel) return;
					// 名称标签：图标下方，水平居中
					const label = new BMapGL.Label(pole.name, {
						position: point,
						offset: new BMapGL.Size(-Math.round(labelPixelWidth(pole.name) / 2), 0)
					});
					label.setStyle({
						color: '#ffffff',
						backgroundColor: 'rgba(0, 0, 0, 0.68)',
						border: '0',
						borderRadius: '4px',
						padding: '2px 7px',
						fontSize: '12px',
						lineHeight: '18px',
						textAlign: 'center',
						whiteSpace: 'nowrap',
						cursor: 'pointer'
					});
					label.addEventListener('click', () => this.openPoleDetail(pole));
					this.h5Map.addOverlay(label);
					this.h5Labels.push(label);
				} catch (e) {
					console.error('渲染灯杆标注物失败', e);
				}
			});
		},
		/** 视野调整：H5 自适应显示全部灯杆，小程序按经纬度跨度选择缩放级别 */
		fitMapView() {
			if (!this.poles.length) return;
			// 小程序：中心点 + 缩放级别
			const lats = this.poles.map(pole => pole.lat);
			const lngs = this.poles.map(pole => pole.lng);
			const minLat = Math.min.apply(null, lats);
			const maxLat = Math.max.apply(null, lats);
			const minLng = Math.min.apply(null, lngs);
			const maxLng = Math.max.apply(null, lngs);
			this.mpCenter = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };

			const span = Math.max(maxLat - minLat, maxLng - minLng);
			let scale = DEFAULT_ZOOM;
			if (span > 0.08) scale = 12;
			else if (span > 0.04) scale = 13;
			else if (span > 0.02) scale = 14;
			else if (span > 0.01) scale = 15;
			else if (span > 0.005) scale = 16;
			else if (span > 0.002) scale = 17;
			this.mapScale = scale;

			// H5：优先使用 setViewport 自适应
			if (!this.h5Map || !this.h5BMapGL) return;
			try {
				if (this.poles.length === 1 && typeof this.h5Map.centerAndZoom === 'function') {
					const only = this.poles[0];
					this.h5Map.centerAndZoom(new this.h5BMapGL.Point(only.lng, only.lat), DEFAULT_ZOOM);
					return;
				}
				if (typeof this.h5Map.setViewport === 'function') {
					const points = this.poles.map(pole => new this.h5BMapGL.Point(pole.lng, pole.lat));
					this.h5Map.setViewport(points);
					return;
				}
			} catch (e) {
				console.warn('自适应灯杆视野失败', e);
			}
			this.h5Map.centerAndZoom(new this.h5BMapGL.Point(this.mpCenter.lng, this.mpCenter.lat), this.mapScale);
		},
		/** 小程序标记点击 */
		onMiniMarkerTap(e) {
			const id = Number(e && e.detail && e.detail.markerId);
			// 当前位置蓝点不弹灯杆详情
			if (id === MY_LOCATION_MARKER_ID) return;
			const pole = this.poles[id - 1]; // 标记 id = 下标 + 1
			if (pole) this.openPoleDetail(pole);
		},
		/* ==================== 定位 ==================== */
		/**
		 * 定位按钮：以当前定位为中心（不重置缩放级别），并绘制当前位置蓝点
		 * 已有定位缓存时直接居中，避免重复申请定位权限
		 */
		locateCurrent() {
			if (this.locating) return;
			// H5：地图实例未就绪（加载中 / 加载失败）时无法居中，直接提示
			if (isH5Platform() && (!this.mapReady || !this.h5Map)) {
				uni.showToast({ title: '地图未就绪，请稍后重试', icon: 'none' });
				return;
			}
			if (this.myLocation) {
				this.centerOn(this.myLocation);
				this.updateMyLocationOverlay();
				return;
			}
			this.locating = true;
			getCurrentPoint().then((pos) => {
				// 页面已关闭时不再更新视图
				if (this._unloaded || !pos) return;
				this.myLocation = pos;
				this.updateMyLocationOverlay();
				this.centerOn(pos);
			}).catch((err) => {
				console.error('获取当前位置失败', err && err.message);
				uni.showToast({ title: '获取当前位置失败，请检查定位权限', icon: 'none' });
			}).finally(() => {
				this.locating = false;
			});
		},
		/**
		 * 地图居中：H5 保持当前缩放级别（与 Android 端 isSetZoom=false 一致），小程序更新地图中心
		 * @param {{lat:number,lng:number}} point BD-09 坐标
		 */
		centerOn(point) {
			if (!point) return;
			if (isH5Platform() && this.h5Map && this.h5BMapGL) {
				try {
					const target = new this.h5BMapGL.Point(Number(point.lng), Number(point.lat));
					let zoom = this.mapScale;
					if (typeof this.h5Map.getZoom === 'function') {
						const current = Number(this.h5Map.getZoom());
						if (Number.isFinite(current) && current > 0) zoom = current;
					}
					this.h5Map.centerAndZoom(target, zoom);
				} catch (e) {
					console.warn('地图居中失败', e);
				}
			}
			// 小程序：更新地图中心（scale 不变）
			this.mpCenter = { lat: Number(point.lat), lng: Number(point.lng) };
		},
		/** 当前位置蓝点：H5 用圆形覆盖物绘制；小程序由 mpMarkers 计算属性渲染 */
		updateMyLocationOverlay() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL || !this.myLocation) return;
			const BMapGL = this.h5BMapGL;
			const point = new BMapGL.Point(Number(this.myLocation.lng), Number(this.myLocation.lat));
			const move = (overlay) => {
				if (!overlay) return;
				// BMapGL 的 Circle 用 setCenterIn / setPoint，兼容其它版本的 setCenter / setPosition
				if (typeof overlay.setCenter === 'function') overlay.setCenter(point);
				else if (typeof overlay.setPosition === 'function') overlay.setPosition(point);
				else if (typeof overlay.setCenterIn === 'function') overlay.setCenterIn(point);
				else if (typeof overlay.setPoint === 'function') overlay.setPoint(point);
			};
			if (this.h5Dot && this.h5DotRing) {
				move(this.h5DotRing);
				move(this.h5Dot);
				return;
			}
			try {
				// 外圈光晕 + 内圈实心点，颜色与灯杆标注物区分
				this.h5DotRing = new BMapGL.Circle(point, 16, {
					strokeColor: '#ffffff', strokeWeight: 1, strokeOpacity: 0.9,
					fillColor: '#3a7bf7', fillOpacity: 0.2
				});
				this.h5Dot = new BMapGL.Circle(point, 7, {
					strokeColor: '#ffffff', strokeWeight: 2, strokeOpacity: 1,
					fillColor: '#3a7bf7', fillOpacity: 1
				});
				this.h5Map.addOverlay(this.h5DotRing);
				this.h5Map.addOverlay(this.h5Dot);
			} catch (e) {
				console.warn('绘制当前定位标记失败', e);
			}
		},
		/* ==================== 灯杆详情 ==================== */
		/**
		 * 点击灯杆图标：拉取灯杆详情（含杆上单灯列表）并弹出详情弹窗
		 * @param {Object} pole 灯杆对象
		 */
		openPoleDetail(pole) {
			if (!pole) return;
			uni.showLoading({ title: '加载中...', mask: true });
			request({
				url: '/station/gis/PoleInfo',
				method: 'POST',
				data: {
					id: pole.id // 灯杆 id
				}
			}).then((res) => {
				console.log(base64Decode(res.data.data))
				const payload = res && res.data;
				// 业务失败 → 提示并退出
				if (payload && payload.code !== undefined && payload.code !== null && payload.code !== 0) {
					uni.showToast({ title: this.decodeErrorMessage(payload) || '获取灯杆信息失败', icon: 'none' });
					return;
				}
				const data = this.parseResponseData(res) || {};
				const lights = Array.isArray(data.lights) ? data.lights : [];
				// 灯杆坐标：优先取详情接口返回值，无效时回退到标注物坐标（均为百度坐标）
				const lat = Number(data.lat);
				const lng = Number(data.lng);
				const hasCoord = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
				this.poleDetail = {
					id: pole.id,
					name: data.name || pole.name || '',
					lat: hasCoord ? lat : pole.lat,
					lng: hasCoord ? lng : pole.lng,
					lights: lights.map(light => this.wrapPoleLight(light, pole))
				};
				this.setPoleLocation(this.poleDetail.lat, this.poleDetail.lng);
				this.detailVisible = true;
			}).catch((err) => {
				console.error('获取灯杆信息失败', err && err.message);
				uni.showToast({ title: '获取灯杆信息失败', icon: 'none' });
			}).finally(() => {
				uni.hideLoading();
			});
		},
		/**
		 * 灯杆详情中的单灯 → 详情弹窗显示对象（字段与单灯详情界面保持一致）
		 * @param {Object} light PoleInfo 返回的 LightBean
		 * @param {Object} pole 灯杆标注物（PoleInfo 未返回在线状态时兜底用）
		 */
		wrapPoleLight(light, pole) {
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
				const lines = channels.map(i => this.formatMeasure(lastData[key + i], decimals));
				return lines.length ? lines.join('\n') : '-';
			};

			return {
				id: raw.code || '-',                 // ID 列显示通信 ID（与单灯详情一致）
				lightId: raw.id,                     // 单灯 id
				stationId: raw.stationId != null ? raw.stationId : this.stationId,
				name: raw.name || '',
				channelName: channels.map(i => 'K' + i + ':' + (content['nm' + i] || '')).join('\n') || '-',
				onlineText: (raw.online !== undefined && raw.online !== null ? raw.online : !!(pole && pole.online)) ? '在线' : '离线',
				voltage: this.formatMeasure(lastData.u, 1),
				ampere: joinPlain('c', 2),
				power: joinPlain('p', 0),
				brightness: joinPlain('op', 0),
				colorTemp: joinPlain('ct', 0),
				temp: this.formatMeasure(lastData.tc, 0),
				energy: joinPlain('q', 1),
				duration: this.formatMeasure(lastData.lo != null ? lastData.lo : raw.newLightOnTime, 0),
				leakageCurrent: joinPlain('cl', 1),
				lastCommTime: this.formatDateTime(raw.fireTime != null ? raw.fireTime : lastData.time)
			};
		},
		/**
		 * 保存当前灯杆坐标（BD-09 原始值 + GCJ-02 供导航使用）
		 * @param {number} lat 纬度（BD-09）
		 * @param {number} lng 经度（BD-09）
		 */
		setPoleLocation(lat, lng) {
			const latNum = Number(lat);
			const lngNum = Number(lng);
			// 未配置（0）或非数值时清空，避免导航到 (0,0)
			if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || (latNum === 0 && lngNum === 0)) {
				this.poleLocation = { lat: 0, lng: 0 };
				this.poleLocationBd09 = { lat: 0, lng: 0 };
				return;
			}
			this.poleLocationBd09 = { lat: latNum, lng: lngNum };
			const gcj = bd09ToGcj02(lngNum, latNum);
			this.poleLocation = { lat: gcj.lat, lng: gcj.lng };
		},
		/* ==================== 弹窗底部操作 ==================== */
		/** 图片 */
		getPoleImages() {
			uni.navigateTo({ url: '/pages/operation/components/deviceManagement/managePoleImages' })
		},
		/**
		 * 操作：跳转到对应的单灯站点界面（stationTwo）
		 * @param {Object|null} light 当前选中的单灯
		 */
		onClickOperation(light) {
			if (!light) {
				uni.showToast({ title: '该灯杆下没有单灯', icon: 'none' });
				return;
			}
			const stationId = light.stationId || this.stationId;
			if (!stationId) {
				uni.showToast({ title: '缺少站点信息', icon: 'none' });
				return;
			}
			const sameStation = String(stationId) === String(this.stationId);
			const params = [
				`stationId=${stationId}`,
				`boxName=${encodeURIComponent(sameStation ? (this.boxName || '') : '')}`
			];
			if (sameStation && this.groupId) params.push(`parentId=${this.groupId}`);
			this.detailVisible = false;
			uni.navigateTo({ url: `/pages/operation/components/stationTypes/stationTwo?${params.join('&')}` });
		},
		/**
		 * 查看 / 修改灯杆定位（与单灯详情界面入口保持一致）
		 * @param {'view'|'edit'} mode view 查看定位 / edit 修改定位
		 */
		openPoleLocation(mode) {
			const poleId = this.poleDetail.id;
			if (poleId === null || poleId === undefined || poleId === '') {
				uni.showToast({ title: '未获取到灯杆信息', icon: 'none' });
				return;
			}
			const bd = this.poleLocationBd09 || {};
			const query = [
				`mode=${mode}`,
				`type=${POS_TYPE_POLE}`,
				`id=${poleId}`,
				`name=${encodeURIComponent(this.poleDetail.name || '')}`,
				`lat=${bd.lat || ''}`,
				`lng=${bd.lng || ''}`
			].join('&');
			uni.navigateTo({ url: `/pages/operation/components/showAndEditLocation?${query}` });
		},
		// 定位修改结果回传：同步当前灯杆坐标（BD-09 原始值 + GCJ-02 供导航使用）
		onLocationResult(payload) {
			if (!payload || !payload.saved) return;
			if (Number(payload.type) !== POS_TYPE_POLE) return;
			if (String(payload.id) !== String(this.poleDetail.id)) return;
			this.setPoleLocation(payload.lat, payload.lng);
			// 同步地图上的灯杆标记位置
			const pole = this.poles.find(item => String(item.id) === String(payload.id));
			if (pole) {
				pole.lat = Number(payload.lat);
				pole.lng = Number(payload.lng);
				this.$nextTick(() => this.renderH5Markers());
			}
		},
		/** 路线导航：小程序端直接打开内置地图，其余端先选地图（与单灯详情一致） */
		onNavigate() {
			// #ifdef MP
			// 小程序端：直接打开内置地图
			if (!openMiniMap(this.poleLocation, this.poleDetail.name || '灯杆位置')) {
				uni.showToast({ title: '未获取到灯杆位置', icon: 'none' });
			}
			// #endif

			// #ifndef MP
			// 非小程序端：弹出地图选择弹窗
			this.$refs.mapSelectionPopup.open();
			// #endif
		},
		/** 选择地图后打开路线 */
		onMapSelected(mapName) {
			// 关闭弹窗
			this.$refs.mapSelectionPopup.$refs.popup.close();
			if (!this.poleLocation.lat || !this.poleLocation.lng) {
				uni.showToast({ title: '未获取到灯杆位置', icon: 'none' });
				return;
			}
			navigateWithMap(mapName, {
				dest: this.poleLocation,               // GCJ-02
				destBd: this.poleLocationBd09,         // BD-09（百度地图使用）
				destName: this.poleDetail.name || '灯杆位置'
			});
		},
		/* ==================== 工具方法 ==================== */
		/** 解析响应 payload.data（可能是 Base64 字符串） */
		parseResponseData(res) {
			const body = res && res.data;
			if (!body) return null;
			let data = body.data;
			if (typeof data === 'string') {
				try {
					data = JSON.parse(base64Decode(data));
				} catch (e) {
					console.error('解析接口数据失败', e);
					return null;
				}
			}
			return data;
		},
		/** 解析接口业务错误信息 */
		decodeErrorMessage(payload) {
			let msg = payload.msg || payload.message || '';
			const data = payload.data;
			if (typeof data === 'string' && data) {
				// 形似 Base64 的字符串先尝试解码
				if (/^[A-Za-z0-9+/=]+$/.test(data)) {
					const decoded = base64Decode(data);
					if (decoded) msg = decoded;
				}
				if (!msg) msg = data;
			}
			// 解码结果本身是 JSON 时取出其中的提示信息
			if (typeof msg === 'string' && msg.charAt(0) === '{') {
				try {
					const parsed = JSON.parse(msg);
					if (parsed && typeof parsed === 'object') msg = parsed.msg || parsed.message || msg;
				} catch (e) {
					// 非 JSON 时按原文返回
				}
			}
			return String(msg || '');
		},
		/** 数值格式化：负数（-1/-2 表示无效）与空值一律显示 '-' */
		formatMeasure(val, decimals = 0) {
			if (val === null || val === undefined || val === '') return '-';
			const num = Number(val);
			if (isNaN(num)) return '-';
			if (num < 0) return '-';
			if (decimals === 0) return String(Math.round(num));
			return Number.isInteger(num) ? String(num) : num.toFixed(decimals);
		},
		/** 毫秒时间戳 → yyyy-MM-dd HH:mm:ss */
		formatDateTime(ms) {
			if (!ms) return '-';
			const d = new Date(Number(ms));
			if (isNaN(d.getTime())) return '-';
			const pad = n => (n < 10 ? '0' + n : '' + n);
			return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
				+ ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
		}
	}
};
</script>

<style lang="scss" scoped>
/* ==================== 布局 ====================
 * 地图铺满页面；H5 端 100vh / position:fixed 以整个浏览器视口为准，
 * 需用 --window-top 让开原生导航栏高度（小程序端为 0，取不到时回退 0）。
 */
.page {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	overflow: hidden;
	background-color: var(--bg-page, #f8f8f8);
}

.map-area {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	overflow: hidden;
	background-color: #e8eef6;
}

.map-canvas {
	width: 100%;
	height: 100%;
}

/* ==================== 灯杆总数 ==================== */
.total-badge {
	position: absolute;
	right: 24rpx;
	top: 24rpx;
	z-index: 20;
	display: flex;
	align-items: center;
	padding: 14rpx 24rpx;
	background-color: var(--bg-card, #ffffff);
	border-radius: 40rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

.total-label {
	font-size: 26rpx;
	color: var(--text-primary, #333333);
}

.total-value {
	margin-left: 12rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: var(--color-primary, #3a7bf7);
}

/* ==================== 定位按钮 ====================
 * 地图右下角悬浮按钮：点击后以当前定位为中心（保持缩放级别），并绘制当前位置蓝点
 */
.locate-btn {
	position: absolute;
	right: 24rpx;
	bottom: 40rpx;
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 84rpx;
	height: 84rpx;
	border-radius: 50%;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.16);
}

.locate-btn:active {
	background-color: var(--bg-soft, #f2f4f8);
}

.locate-icon {
	width: 40rpx;
	height: 40rpx;
}

/* 定位中：图标变淡，避免重复点击（locating 期间点击直接返回） */
.locate-btn.is-locating .locate-icon {
	opacity: 0.4;
}

/* ==================== 地图状态提示 ==================== */
.map-state {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	z-index: 19;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 32rpx;
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

.map-state-text {
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
	text-align: center;
}

.map-state-retry {
	margin-top: 10rpx;
	font-size: 26rpx;
	color: var(--color-primary, #4285f4);
}

/* ==================== H5：让开原生导航栏高度 ==================== */
/* #ifdef H5 */
.page {
	top: var(--window-top, 0px);
	bottom: var(--window-bottom, 0px);
}
/* #endif */
</style>
