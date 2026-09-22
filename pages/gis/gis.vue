<template>
	<view :class="themeClass" class="page">
		<!-- ==================== 小程序端：头部条件搜索 ==================== -->
		<!-- #ifndef H5 -->
		<view class="mp-header">
			<view class="refresh-btn" @click="onRefresh">
				<uni-icons :color="primaryColor" size="22" type="refresh" />
			</view>
			<scroll-view class="layer-scroll" scroll-x>
				<view class="layer-inner">
					<view
						v-for="layer in layers"
						:key="layer.key"
						class="layer-item"
						@click="toggleLayer(layer.key)"
					>
						<uni-icons
							:color="layer.checked ? primaryColor : layerIconColor"
							:type="layer.checked ? 'checkbox-filled' : 'checkbox'"
							size="20"
						/>
						<text class="layer-name">{{ layer.name }}</text>
						<text class="layer-count">{{ layer.count }}</text>
					</view>
				</view>
			</scroll-view>
			<view class="search-btn" @click="openSearch">搜索</view>
		</view>
		<!-- #endif -->

		<!-- ==================== 地图 ==================== -->
		<view class="map-area">
			<!-- H5：百度地图 JSAPI GL 容器 -->
			<!-- #ifdef H5 -->
			<view id="gisMapCanvas" class="map-canvas"></view>
			<!-- #endif -->

			<!-- 小程序端：内置 map 组件（坐标已转 GCJ-02） -->
			<!-- #ifndef H5 -->
			<map
				id="gisMap"
				:enable-satellite="satellite"
				:latitude="mpCenterGcj.lat"
				:longitude="mpCenterGcj.lng"
				:markers="mpMarkers"
				:polyline="mpPolylines"
				:scale="mapScale"
				:show-location="false"
				class="map-canvas"
				@markertap="onMiniMarkerTap"
				@regionchange="onMiniRegionChange"
			/>
			<!-- #endif -->

			<!-- 地图加载中 / 加载失败 -->
			<view v-if="mapStatusText" class="map-state" @click="onMapStateTap">
				<text class="map-state-text">{{ mapStatusText }}</text>
				<text v-if="mapError" class="map-state-retry">点击重试</text>
			</view>

			<!-- ==================== H5：头部条件搜索（浮层） ==================== -->
			<!-- #ifdef H5 -->
			<view class="gis-header">
				<view class="refresh-btn" @click="onRefresh">
					<uni-icons :color="primaryColor" size="22" type="refresh" />
				</view>
				<scroll-view class="layer-scroll" scroll-x>
					<view class="layer-inner">
						<view
							v-for="layer in layers"
							:key="layer.key"
							class="layer-item"
							@click="toggleLayer(layer.key)"
						>
							<uni-icons
								:color="layer.checked ? primaryColor : layerIconColor"
								:type="layer.checked ? 'checkbox-filled' : 'checkbox'"
								size="20"
							/>
							<text class="layer-name">{{ layer.name }}</text>
							<text class="layer-count">{{ layer.count }}</text>
						</view>
					</view>
				</scroll-view>
				<view class="search-btn" @click="openSearch">搜索</view>
			</view>

			<!-- 二维 / 实景地图切换 -->
			<view class="map-type-switch" @click="toggleMapType">
				<view :class="satellite ? 'thumb-2d' : 'thumb-satellite'" class="map-type-thumb"></view>
				<text class="map-type-label">{{ satellite ? '二维地图' : '实景地图' }}</text>
			</view>

			<!-- 左侧单灯状态筛选栏（勾选「单灯·灯杆」图层后显示） -->
			<view v-if="stateBarVisible" class="state-bar">
				<view
					v-for="(state, index) in stateList"
					:key="index"
					:class="{ 'is-active': stateIndex === index }"
					class="state-item"
					@click="toggleStateFilter(index)"
				>
					<image :src="state.icon" class="state-icon" mode="aspectFit" />
					<text class="state-count">{{ state.count }}</text>
				</view>
			</view>

			<!-- 右下角：定位 + 放大 / 缩小 -->
			<view class="map-tools">
				<view :class="{ 'is-locating': locating }" class="tool-btn" @click="locateCurrent">
					<image :src="locateIcon" class="tool-icon" mode="aspectFit" />
				</view>
				<view class="tool-btn" @click="zoomBy(1)">
					<uni-icons :color="toolIconColor" size="22" type="plus" />
				</view>
				<view class="tool-btn" @click="zoomBy(-1)">
					<uni-icons :color="toolIconColor" size="22" type="minus" />
				</view>
			</view>
			<!-- #endif -->

			<!-- ==================== 小程序端：地图浮层 ==================== -->
			<!-- #ifndef H5 -->
			<!--
				cover-view / cover-image 本身也是原生组件，层级恒高于普通 view：
				原生组件的 z-index 只在原生组件之间生效，普通 view 弹窗无论 z-index 多大都盖不住它。
				因此这里不与层级对抗，而是在弹窗打开时直接移除浮层（H5 端同名浮层会被弹窗遮罩自然盖住）。
				新增弹窗时，请把它的 visible 状态一并加进 mapPopupOpen。
			-->
			<cover-view v-if="!mapPopupOpen" class="mp-map-type" @click="toggleMapType">{{ satellite ? '二维地图' : '实景地图' }}</cover-view>

			<cover-view v-if="stateBarVisible && !mapPopupOpen" class="mp-state-bar">
				<cover-view
					v-for="(state, index) in stateList"
					:key="index"
					:class="{ 'is-active': stateIndex === index }"
					class="mp-state-item"
					@click="toggleStateFilter(index)"
				>
					<cover-image :src="state.icon" class="mp-state-icon" />
					<cover-view class="mp-state-count">{{ state.count }}</cover-view>
				</cover-view>
			</cover-view>

			<view class="mp-tools">
				<view :class="{ 'is-locating': locating }" class="mp-tool-btn" @click="locateCurrent">
					<image :src="locateIcon" class="mp-tool-icon" mode="aspectFit" />
				</view>
				<view class="mp-tool-btn" @click="zoomBy(1)">
					<text class="mp-tool-text">＋</text>
				</view>
				<view class="mp-tool-btn" @click="zoomBy(-1)">
					<text class="mp-tool-text">－</text>
				</view>
			</view>
			<!-- #endif -->
		</view>

		<!-- ==================== 搜索弹窗 ==================== -->
		<GisSearchPopup
			:boxes="boxList"
			:visible="searchVisible"
			@close="searchVisible = false"
			@select="onSearchSelect"
		/>

		<!-- ==================== 配电箱 / 专变 弹窗 ==================== -->
		<GisBoxPopup
			:name="boxPopup.name"
			:visible="boxPopup.visible"
			@close="closeBoxPopup"
			@detail="onBoxDetail"
			@navigation="onBoxNavigation"
			@modify-location="onBoxModifyLocation"
		/>

		<!-- ==================== 水浸弹窗 ==================== -->
		<GisWaterPopup
			:bean="waterPopup.bean"
			:visible="waterPopup.visible"
			@close="closeWaterPopup"
			@detail="onWaterDetail"
			@navigation="onWaterNavigation"
			@modify-location="onWaterModifyLocation"
		/>

		<!-- ==================== 灯杆详情弹窗 ==================== -->
		<PoleDetailPopup
			:lights="poleDetail.lights"
			:pole-name="poleDetail.name"
			:visible="poleDetailVisible"
			@close="poleDetailVisible = false"
			@click-image="onPoleImages"
			@click-modify-location="onPoleModifyLocation"
			@click-navigation="onPoleNavigation"
			@click-operation="onPoleOperation"
			@click-show-location="onShowPoleLocation"
		/>

		<!-- 路线导航：选择地图（小程序端直接打开内置地图，不渲染该弹窗） -->
		<!-- #ifndef MP -->
		<MapSelectionPopup ref="mapSelectionPopup" @select="onMapSelected" />
		<!-- #endif -->

		<!-- 底部导航 -->
		<TabBar :current="4" />
	</view>
</template>

<script>
import TabBar from '@/components/tabBar.vue';
import MapSelectionPopup from '@/components/mapSelectionPopup.vue';
import PoleDetailPopup from '@/components/poleDetailPopup.vue';
import GisSearchPopup from './components/gisSearchPopup.vue';
import GisBoxPopup from './components/gisBoxPopup.vue';
import GisWaterPopup from './components/gisWaterPopup.vue';

import {
	isH5Platform,
	loadBMapGL,
	getCurrentPoint,
	resolveMapType,
	bd09ToGcj,
	gcjToBd09,
	DEFAULT_CENTER,
	LOCATE_ICON,
	DOT_ICON,
	POS_TYPE_BOX,
	POS_TYPE_POLE,
	POS_TYPE_WATER,
	EVENT_LOCATION_RESULT
} from '@/utils/map';
import { navigateWithMap, openMiniMap } from '@/utils/navigation';
import {
	ZOOM_DEFAULT,
	ZOOM_TEXT,
	ZOOM_BOX_DETAIL,
	ZOOM_POLE_DETAIL,
	MAP_TYPE_BOX,
	MAP_TYPE_POLE,
	MAP_TYPE_SPECIAL,
	MAP_TYPE_WATER,
	SEARCH_TYPE_BOX,
	SEARCH_TYPE_POLE,
	POINT_STAR_ICON,
	POINT_DOT_ICON,
	POINT_ICON_SIZE,
	POINT_STAR_COLOR,
	POINT_DOT_COLOR,
	BOX_ICON_SIZE,
	SPECIAL_ICON_SIZE,
	WATER_ICON_SIZE,
	LABEL_PIXEL_OFFSET_Y,
	POLE_STATE_LIST,
	poleIconSize,
	poleLightDir,
	poleStatusFile,
	boxIconPath,
	specialIconPath,
	waterIconPath,
	poleIconPath,
	countPoleStates,
	filterPoleByState,
	classifyMarkers,
	isValidPoint,
	filterByViewport,
	wrapPoleLight,
	parseResponseData,
	decodeErrorMessage,
	isBusinessError,
	toList,
	fetchMapMarks,
	fetchWaterItems,
	fetchLines,
	fetchPoleInfo,
	labelPixelWidth
} from '@/utils/gis';

// 地图容器 id（H5）
const MAP_DOM_ID = 'gisMapCanvas';
// 小程序端「当前定位」标记 id（设备标记从 1 开始，故用 0 区分）
const MY_LOCATION_MARKER_ID = 0;
// 小程序端「当前定位」蓝点显示尺寸（px，与 static/common/map/location-dot.png 原始尺寸一致）
const MY_LOCATION_ICON_SIZE = 40;
// 名称标签最多渲染的标注物数量（超出只渲染图标，避免卡顿）
const MAX_LABELS = 300;
// 海量点（聚合点）直径（px）
const POINT_SIZE = 6;
// 低缩放时点击聚合点命中标注物的像素容差
const PICK_TOLERANCE_PX = 14;
// 线缆折线样式
const LINE_STYLE = { strokeColor: '#2b6df6', strokeWeight: 4, strokeOpacity: 0.9 };
// 缩放级别范围（H5 端百度地图 / 小程序端内置地图）
const ZOOM_MIN_H5 = 4;
const ZOOM_MAX_H5 = 21;
const ZOOM_MIN_MP = 3;
const ZOOM_MAX_MP = 20;
// 本地缓存的中心点（项目配置的中心坐标，与 Android 端 loadLocation 优先级一致）
const CENTER_LAT_KEY = 'sun_lat';
const CENTER_LNG_KEY = 'sun_lng';

/**
 * 灯杆图标尺寸（按灯数分档 + 状态，与 static/gis/poleStatus 下文件实际尺寸一致）
 * @param {Object} item 灯杆标注物
 * @returns {{width:number,height:number}}
 */
function poleIconSizeFor(item) {
	return poleIconSize(poleLightDir(item && item.count), poleStatusFile(item));
}

export default {
	name: 'Gis',
	components: {
		TabBar,
		MapSelectionPopup,
		PoleDetailPopup,
		GisSearchPopup,
		GisBoxPopup,
		GisWaterPopup
	},
	data() {
		return {
			// 入口参数（缺省 0 表示查询全部分组 / 站点）
			groupId: 0,
			stationId: 0,

			// 图层开关（勾选后显示在地图上）
			layers: [
				{ key: 'box', name: '配电箱', count: 0, checked: true },
				{ key: 'pole', name: '单灯·灯杆', count: 0, checked: false },
				{ key: 'special', name: '专变', count: 0, checked: false },
				{ key: 'water', name: '水浸', count: 0, checked: false },
				{ key: 'line', name: '线缆', count: 0, checked: false }
			],

			// 标注物数据（坐标均为百度坐标 bd09ll）
			boxList: [],
			poleList: [],
			specialList: [],
			waterList: [],
			lineList: [],
			loading: false,

			// 地图
			satellite: false,
			mapScale: ZOOM_DEFAULT,
			mpCenter: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }, // 小程序地图中心（BD-09）
			mpBounds: null,                                                 // 小程序可视范围（BD-09，用于高缩放时的可视范围过滤）
			mapLoading: false,
			mapError: '',
			mapReady: false,

			// 当前定位（BD-09，点击定位按钮后获取并绘制蓝点）
			myLocation: null,
			locating: false,
			locateIcon: LOCATE_ICON,

			// 单灯状态筛选（-1 表示不过滤）
			stateIndex: -1,
			stateCounts: POLE_STATE_LIST.map(() => 0),

			// 配电箱 / 专变 弹窗
			boxPopup: {
				visible: false,
				name: '',
				id: '',
				lat: 0,
				lng: 0
			},

			// 水浸弹窗
			waterPopup: {
				visible: false,
				bean: {}
			},

			// 灯杆详情弹窗（复用状态操作模块的灯杆详情组件）
			poleDetailVisible: false,
			poleDetail: {
				id: '',
				name: '',
				lat: 0,
				lng: 0,
				lights: []
			},
			poleLocation: { lat: 0, lng: 0 },      // GCJ-02，小程序 openLocation / 高德 / 腾讯导航使用
			poleLocationBd09: { lat: 0, lng: 0 },  // BD-09，百度地图 / 修改定位使用

			// 搜索弹窗
			searchVisible: false
		};
	},
	computed: {
		// 地图状态提示文案（加载中 / 加载失败）
		mapStatusText() {
			if (this.mapError) return this.mapError;
			if (this.mapLoading) return '地图加载中…';
			return '';
		},
		// 主色（图标颜色随主题变化）
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#3a7bf7';
		},
		// 未勾选图标颜色
		layerIconColor() {
			return this.isDarkMode ? '#6b7280' : '#c0c4cc';
		},
		// 工具图标颜色
		toolIconColor() {
			return this.isDarkMode ? '#c7cddb' : '#4e5969';
		},
		// 单灯状态筛选栏数据（图标 + 名称 + 数量）
		stateList() {
			return POLE_STATE_LIST.map((state, index) => ({
				name: state.name,
				icon: state.icon,
				count: this.stateCounts[index] || 0
			}));
		},
		// 状态筛选栏仅在勾选「单灯·灯杆」图层后显示
		stateBarVisible() {
			return this.isLayerChecked('pole');
		},
		/*
		 * 详情 / 搜索弹窗是否已打开：打开时隐藏地图上的原生浮层
		 * （「二维/实景」切换、单灯状态筛选栏均为 cover-view，属于原生组件，
		 *  层级恒高于普通 view 弹窗，只能靠移除来避让）
		 */
		mapPopupOpen() {
			return (
				this.searchVisible ||
				this.boxPopup.visible ||
				this.waterPopup.visible ||
				this.poleDetailVisible
			);
		},
		// 小程序 map 组件中心点（GCJ-02）
		mpCenterGcj() {
			return bd09ToGcj(this.mpCenter.lat, this.mpCenter.lng);
		},
		// 小程序 map 组件标记（GCJ-02）
		mpMarkers() {
			const markers = [];
			const zoom = Number(this.mapScale) || ZOOM_DEFAULT;
			const showText = zoom >= ZOOM_TEXT;
			let markerId = 1;

			// 当前位置蓝点（id 固定 0，锚点在图标中心，层级最低）
			if (this.myLocation) {
				const gcj = bd09ToGcj(this.myLocation.lat, this.myLocation.lng);
				markers.push({
					id: MY_LOCATION_MARKER_ID,
					latitude: gcj.lat,
					longitude: gcj.lng,
					iconPath: DOT_ICON,
					width: MY_LOCATION_ICON_SIZE,
					height: MY_LOCATION_ICON_SIZE,
					anchor: { x: 0.5, y: 0.5 },
					zIndex: 5
				});
			}

			const push = (item, iconPath, size, mapType, anchor, zIndex) => {
				if (!isValidPoint(item.lat, item.lng)) return;
				const gcj = bd09ToGcj(Number(item.lat), Number(item.lng));
				const marker = {
					id: markerId++,
					latitude: gcj.lat,
					longitude: gcj.lng,
					iconPath,
					width: size.width,
					height: size.height,
					anchor,
					zIndex,
					// 自定义字段：点击时用于反查设备（原生 map 会忽略未知字段）
					deviceId: item.id,
					mapType
				};
				if (showText && item.name) {
					marker.label = {
						content: item.name,
						color: '#ffffff',
						fontSize: 11,
						bgColor: '#000000B3',
						borderRadius: 4,
						padding: 4,
						textAlign: 'center',
						anchorX: 0,
						anchorY: 0
					};
				}
				markers.push(marker);
			};

			// 配电箱：缩放不足时用 star-filled 聚合点，达到阈值后显示状态图标 + 名称
			if (this.isLayerChecked('box')) {
				if (zoom >= ZOOM_BOX_DETAIL) {
					filterByViewport(this.boxList, this.mpBounds, zoom).forEach((item) => {
						push(item, boxIconPath(item), BOX_ICON_SIZE, MAP_TYPE_BOX, { x: 0.5, y: 1 }, 30);
					});
				} else {
					this.boxList.forEach((item) => {
						push(item, POINT_STAR_ICON, POINT_ICON_SIZE, MAP_TYPE_BOX, { x: 0.5, y: 0.5 }, 20);
					});
				}
			}

			// 单灯·灯杆：缩放不足时用 smallcircle-filled 聚合点，达到阈值后显示状态图标 + 名称
			if (this.isLayerChecked('pole')) {
				const poles = filterPoleByState(this.poleList, this.stateIndex);
				if (zoom >= ZOOM_POLE_DETAIL) {
					filterByViewport(poles, this.mpBounds, zoom).forEach((item) => {
						push(item, poleIconPath(item), poleIconSizeFor(item), MAP_TYPE_POLE, { x: 0.5, y: 1 }, 40);
					});
				} else {
					poles.forEach((item) => {
						push(item, POINT_DOT_ICON, POINT_ICON_SIZE, MAP_TYPE_POLE, { x: 0.5, y: 0.5 }, 15);
					});
				}
			}

			// 专变 / 水浸：数量较少，直接显示状态图标 + 名称
			if (this.isLayerChecked('special')) {
				filterByViewport(this.specialList, this.mpBounds, zoom).forEach((item) => {
					push(item, specialIconPath(item), SPECIAL_ICON_SIZE, MAP_TYPE_SPECIAL, { x: 0.5, y: 1 }, 35);
				});
			}
			if (this.isLayerChecked('water')) {
				filterByViewport(this.waterList, this.mpBounds, zoom).forEach((item) => {
					push(item, waterIconPath(item), WATER_ICON_SIZE, MAP_TYPE_WATER, { x: 0.5, y: 1 }, 35);
				});
			}
			return markers;
		},
		// 小程序 map 组件线缆（各点用直线连接）
		mpPolylines() {
			if (!this.isLayerChecked('line')) return [];
			const lines = [];
			this.lineList.forEach((line) => {
				const points = (line.points || [])
					.filter(point => isValidPoint(point.lat, point.lng))
					.map((point) => {
						const gcj = bd09ToGcj(Number(point.lat), Number(point.lng));
						return { latitude: gcj.lat, longitude: gcj.lng };
					});
				if (points.length < 2) return;
				lines.push({
					points,
					color: '#2b6df6',
					width: 4,
					arrowLine: false
				});
			});
			return lines;
		}
	},
	created() {
		// BMapGL 覆盖物对象不放入 data（避免被 Vue 观测导致性能问题）
		this.h5Map = null;
		this.h5BMapGL = null;
		this.h5Dot = null;
		this.h5DotRing = null;
		this.overlays = { box: [], pole: [], special: [], water: [], line: [] };
		this.layerMode = { box: '', pole: '', special: '', water: '', line: '' }; // 当前渲染档位（point 聚合点 / detail 详细标注）
		this.viewTimer = null;     // 拖动 / 缩放重绘防抖
		this.navTarget = null;     // 当前待导航目标（BD-09）
		this.mapCtx = null;        // 小程序地图上下文（获取缩放 / 可视范围）
		this.userMovedMap = false; // 用户是否已手动拖动 / 缩放过地图（首次进入自动定位仅在未操作时生效）
		this._programmaticMoveAt = 0; // 最近一次程序化移动地图中心的时间戳（用于区分手势与接口调用）
	},
	onLoad(options) {
		const opts = options || {};
		this.groupId = Number(opts.groupId) || 0;
		this.stationId = Number(opts.stationId) || 0;
		// 定位修改结果回传（showAndEditLocation 页面 SetPos 成功后同步本地坐标）
		uni.$on(EVENT_LOCATION_RESULT, this.onLocationResult);
		// 初始中心点：本地缓存中心坐标优先，其次当前定位
		this.initCenter();
		this.loadGisData();
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
		if (this.viewTimer) {
			clearTimeout(this.viewTimer);
			this.viewTimer = null;
		}
		this.destroyMap();
	},
	methods: {
		/* ==================== 初始中心点（文档 §6.3） ==================== */
		/** 本地缓存中心坐标（sun_lat / sun_lng）优先，zoom=18；否则使用当前定位 */
		initCenter() {
			const cached = this.readCachedCenter();
			if (cached) {
				this.mpCenter = cached;
				this.mapScale = ZOOM_DEFAULT;
				return;
			}
			getCurrentPoint().then((pos) => {
				if (this._unloaded || !pos) return;
				this.myLocation = pos;
				// 用户尚未操作过地图时才移动中心点（首次进入自动显示当前位置）；
				// 若定位返回前用户已拖动地图，则只绘制蓝点，避免把地图强行拽回定位点
				if (!this.userMovedMap) {
					this.mpCenter = { lat: pos.lat, lng: pos.lng };
					if (this.mapReady) this.centerOn(pos, false);
				}
				this.updateMyLocationOverlay();
			}).catch((err) => {
				console.warn('获取当前定位失败', err && err.message);
			});
		},
		/** 读取本地缓存的项目中心坐标，无效时返回 null */
		readCachedCenter() {
			try {
				const lat = Number(uni.getStorageSync(CENTER_LAT_KEY));
				const lng = Number(uni.getStorageSync(CENTER_LNG_KEY));
				if (isValidPoint(lat, lng)) return { lat, lng };
			} catch (e) {
				console.warn('读取中心坐标缓存失败', e);
			}
			return null;
		},

		/* ==================== 数据加载 ==================== */
		/** 拉取地图三类数据：标注物 + 水浸 + 线缆（进入页面与点击刷新时调用） */
		loadGisData() {
			if (this.loading) return;
			this.loading = true;
			uni.showLoading({ title: '加载中...', mask: true });
			Promise.all([
				fetchMapMarks({ groupId: this.groupId, stationId: this.stationId })
					.then(res => this.applyMarkData(res))
					.catch((err) => { console.error('获取地图标注物失败', err && err.message); }),
				fetchWaterItems({ groupId: this.groupId, stationId: this.stationId })
					.then(res => this.applyWaterData(res))
					.catch((err) => { console.error('获取水浸地图数据失败', err && err.message); }),
				fetchLines({ groupId: this.groupId, stationId: this.stationId })
					.then(res => this.applyLineData(res))
					.catch((err) => { console.error('获取地图线缆失败', err && err.message); })
			]).then(() => {
				this.loading = false;
				uni.hideLoading();
				this.$nextTick(() => {
					this.renderAll();
					this.fitInitialView();
				});
			}).catch(() => {
				this.loading = false;
				uni.hideLoading();
			});
		},
		/** 标注物：分类为配电箱 / 灯杆 / 专变 */
		applyMarkData(res) {
			const payload = res && res.data;
			if (isBusinessError(payload)) {
				this.boxList = [];
				this.poleList = [];
				this.specialList = [];
				this.syncCounts();
				const msg = decodeErrorMessage(payload);
				// 「未查到相关数据」属于正常空数据，不弹提示
				if (msg && msg.indexOf('未查到') === -1) {
					uni.showToast({ title: msg, icon: 'none' });
				}
				return;
			}
			const list = toList(parseResponseData(res));
			const { boxes, poles, specials } = classifyMarkers(list);
			this.boxList = boxes;
			this.poleList = poles;
			this.specialList = specials;
			this.syncCounts();
		},
		/** 水浸数据 */
		applyWaterData(res) {
			const payload = res && res.data;
			if (isBusinessError(payload)) {
				this.waterList = [];
				this.syncCounts();
				return;
			}
			this.waterList = toList(parseResponseData(res)).map(item => Object.assign({}, item, {
				lat: Number(item.lat),
				lng: Number(item.lng),
				level: Number(item.level) || 0,
				base: Number(item.base) || 0,
				result: Number(item.result) || 0,
				speed: Number(item.speed) || 0,
				online: !!item.online,
				alarm: !!item.alarm
			}));
			this.syncCounts();
		},
		/** 线缆数据（points 至少 2 个点才落图） */
		applyLineData(res) {
			const payload = res && res.data;
			if (isBusinessError(payload)) {
				this.lineList = [];
				this.syncCounts();
				return;
			}
			this.lineList = toList(parseResponseData(res)).map((item) => {
				const points = Array.isArray(item.points)
					? item.points.map(p => ({ lat: Number(p && p.lat), lng: Number(p && p.lng) }))
					: [];
				return Object.assign({}, item, { points });
			}).filter(item => item.points.length > 1);
			this.syncCounts();
		},
		/** 同步图层数量与单灯状态统计（数量取接口返回条数） */
		syncCounts() {
			this.setLayerCount('box', this.boxList.length);
			this.setLayerCount('pole', this.poleList.length);
			this.setLayerCount('special', this.specialList.length);
			this.setLayerCount('water', this.waterList.length);
			this.setLayerCount('line', this.lineList.length);
			this.stateCounts = countPoleStates(this.poleList);
			// 状态筛选后灯杆数量变化时，越界重置
			if (this.stateIndex >= POLE_STATE_LIST.length) this.stateIndex = -1;
		},
		setLayerCount(key, count) {
			const layer = this.layers.find(item => item.key === key);
			if (layer) layer.count = count;
		},
		isLayerChecked(key) {
			const layer = this.layers.find(item => item.key === key);
			return !!(layer && layer.checked);
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

				// 2. 关闭底图自带点击处理与倾斜 / 旋转手势（与 Android 端一致）
				try {
					if (typeof map.setOptions === 'function') {
						map.setOptions({ enableMapClick: false, enableRotate: false, enableTilt: false });
					}
				} catch (e) {
					console.warn('设置地图选项失败', e);
				}
				try {
					if (typeof map.setIndoorEnabled === 'function') map.setIndoorEnabled(false);
				} catch (e) {
					console.warn('关闭室内图失败', e);
				}

				// 3. 设置中心点与缩放级别
				try {
					map.centerAndZoom(new BMapGL.Point(this.mpCenter.lng, this.mpCenter.lat), this.mapScale);
				} catch (e) {
					throw new Error('设置地图中心点失败：' + this.errText(e));
				}

				// 4. 交互与事件绑定：手势结束后按可视范围重绘标注物（文档 §6.4）
				try {
					map.enableScrollWheelZoom(true);
					const onViewChange = () => this.onMapViewChange();
					map.addEventListener('zoomend', onViewChange);
					map.addEventListener('moveend', onViewChange);
					// 聚合点（海量点）的点击统一由地图点击事件命中判定，避免依赖 SDK 的点选事件
					map.addEventListener('click', (e) => this.onMapClick(e));
				} catch (e) {
					console.warn('绑定地图事件失败', e);
				}

				this.mapReady = true;
				this.mapLoading = false;
				this.renderAll();
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
			this.h5Dot = null;
			this.h5DotRing = null;
			this.overlays = { box: [], pole: [], special: [], water: [], line: [] };
			this.mapReady = false;
		},
		/** 拖动 / 缩放结束：同步缩放级别并按可视范围重绘（文档 §6.4） */
		onMapViewChange() {
			if (this._unloaded) return;
			this.mapScale = this.getZoom();
			if (this.viewTimer) clearTimeout(this.viewTimer);
			this.viewTimer = setTimeout(() => {
				this.viewTimer = null;
				this.renderViewportLayers();
			}, 120);
		},
		/** 当前缩放级别（H5 取地图实例，其余取 mapScale） */
		getZoom() {
			if (isH5Platform() && this.h5Map && typeof this.h5Map.getZoom === 'function') {
				const zoom = Number(this.h5Map.getZoom());
				if (Number.isFinite(zoom) && zoom > 0) return zoom;
			}
			return Number(this.mapScale) || ZOOM_DEFAULT;
		},
		/** 当前可视范围（BD-09），取不到时返回 null（表示不过滤） */
		getBounds() {
			if (!isH5Platform() || !this.h5Map || typeof this.h5Map.getBounds !== 'function') return null;
			try {
				const bounds = this.h5Map.getBounds();
				if (!bounds) return null;
				const sw = typeof bounds.getSouthWest === 'function' ? bounds.getSouthWest() : null;
				const ne = typeof bounds.getNorthEast === 'function' ? bounds.getNorthEast() : null;
				if (!sw || !ne) return null;
				return {
					latMin: Number(sw.lat),
					latMax: Number(ne.lat),
					lngMin: Number(sw.lng),
					lngMax: Number(ne.lng)
				};
			} catch (e) {
				console.warn('获取可视范围失败', e);
				return null;
			}
		},
		/** 首次落图后自适应视野（仅当没有配置中心坐标、也没有当前定位时，用标注物兜底） */
		fitInitialView() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			if (this.readCachedCenter() || this.myLocation) return;
			const source = this.poleList.length ? this.poleList : (this.boxList.length ? this.boxList : this.waterList);
			const points = (source || [])
				.filter(item => isValidPoint(item.lat, item.lng))
				.map(item => new this.h5BMapGL.Point(Number(item.lng), Number(item.lat)));
			if (points.length < 2) return;
			try {
				if (typeof this.h5Map.setViewport === 'function') {
					this.h5Map.setViewport(points);
					this.mapScale = this.getZoom();
				}
			} catch (e) {
				console.warn('自适应视野失败', e);
			}
		},

		/* ==================== 标注物渲染（H5） ==================== */
		/** 全量重绘（图层开关、数据刷新时调用） */
		renderAll() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.renderBoxLayer(true);
			this.renderPoleLayer(true);
			this.renderSpecialLayer();
			this.renderWaterLayer();
			this.renderLineLayer();
		},
		/** 可视范围重绘（拖动 / 缩放结束后调用，线缆不需要重绘） */
		renderViewportLayers() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.renderBoxLayer(false);
			this.renderPoleLayer(false);
			this.renderSpecialLayer();
			this.renderWaterLayer();
		},
		/** 清除某一类标注物（含名称标签） */
		clearOverlays(kind) {
			const group = this.overlays[kind] || [];
			group.forEach((overlay) => {
				try {
					this.h5Map.removeOverlay(overlay);
				} catch (e) {
					console.warn('移除地图标注物失败', e);
				}
			});
			this.overlays[kind] = [];
		},
		/** 构建百度地图图标（anchor 传 {x, y}，y=1 表示图标底部对准坐标点） */
		buildIcon(BMapGL, url, size, anchor) {
			const iconSize = new BMapGL.Size(size.width, size.height);
			const anchorPx = new BMapGL.Size(
				Math.round(size.width * (anchor ? anchor.x : 0.5)),
				Math.round(size.height * (anchor ? anchor.y : 1))
			);
			try {
				return new BMapGL.Icon(url, iconSize, { anchor: anchorPx, imageSize: iconSize });
			} catch (e) {
				return new BMapGL.Icon(url, iconSize);
			}
		},
		/**
		 * 生成详细标注物（状态图标）与名称标签
		 * @param {string} kind 图层 key
		 * @param {Array} list 标注物列表（已按可视范围过滤）
		 * @param {Function} iconFn 图标路径函数
		 * @param {{width:number,height:number}|Function} size 图标尺寸（灯杆等按状态 / 灯数分档时可传函数）
		 * @param {number} mapType 点击分发类型（DeviceTypeUtil）
		 * @param {number} zoom 当前缩放级别
		 */
		addDetailMarkers(kind, list, iconFn, size, mapType, zoom) {
			const BMapGL = this.h5BMapGL;
			const showText = zoom >= ZOOM_TEXT && list.length <= MAX_LABELS;
			const sizeOf = typeof size === 'function' ? size : () => size;
			list.forEach((item) => {
				if (!isValidPoint(item.lat, item.lng)) return;
				const point = new BMapGL.Point(Number(item.lng), Number(item.lat));
				try {
					const marker = new BMapGL.Marker(point, {
						icon: this.buildIcon(BMapGL, iconFn(item), sizeOf(item), { x: 0.5, y: 1 })
					});
					marker.addEventListener('click', () => this.onMarkerClick(mapType, item));
					this.h5Map.addOverlay(marker);
					this.overlays[kind].push(marker);

					if (!showText || !item.name) return;
					// 名称标签：图标下方，水平居中
					const label = new BMapGL.Label(item.name, {
						position: point,
						offset: new BMapGL.Size(-Math.round(labelPixelWidth(item.name) / 2), LABEL_PIXEL_OFFSET_Y)
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
						cursor: 'pointer',
						zIndex: '10'
					});
					label.addEventListener('click', () => this.onMarkerClick(mapType, item));
					this.h5Map.addOverlay(label);
					this.overlays[kind].push(label);
				} catch (e) {
					console.error('渲染地图标注物失败', e);
				}
			});
		},
		/** 百度海量点形状常量（脚本加载后从全局取，取不到时使用同名常量字符串） */
		resolvePointShape(name) {
			const key = 'BMAP_POINT_SHAPE_' + name;
			try {
				if (typeof window !== 'undefined' && window[key] !== undefined) return window[key];
			} catch (e) {
				// 忽略：使用兜底常量
			}
			return key;
		},
		/**
		 * 生成聚合点（海量点）：缩放不足时用单一图标代替大量状态图标与名称
		 * 配电箱 star-filled、单灯·灯杆 smallcircle-filled；SDK 不支持时退化为图标标记
		 * 点击命中由地图点击事件统一判定（见 onMapClick），不依赖海量点自身的点选事件
		 * @param {string} kind 图层 key
		 * @param {Array} list 标注物列表
		 * @param {string} shapeName STAR / CIRCLE
		 * @param {string} color 颜色
		 * @param {string} iconPath 退化时使用的图标
		 * @param {number} mapType 点击分发类型
		 */
		addPointMarkers(kind, list, shapeName, color, iconPath, mapType) {
			const BMapGL = this.h5BMapGL;
			const items = (list || []).filter(item => isValidPoint(item.lat, item.lng));
			if (!items.length) return;
			const points = items.map(item => new BMapGL.Point(Number(item.lng), Number(item.lat)));

			if (typeof BMapGL.PointCollection === 'function') {
				try {
					const collection = new BMapGL.PointCollection(points, {
						size: POINT_SIZE,
						shape: this.resolvePointShape(shapeName),
						color
					});
					this.h5Map.addOverlay(collection);
					this.overlays[kind].push(collection);
					return;
				} catch (e) {
					console.warn('创建海量点失败，退化为图标标记', e);
				}
			}
			// 退化方案：使用聚合点图标逐个渲染（不显示名称）
			this.addDetailMarkers(kind, items, () => iconPath, POINT_ICON_SIZE, mapType, 0);
		},
		/**
		 * 地图点击：低缩放（聚合点档位）时按像素距离命中最近的配电箱 / 灯杆
		 * @param {Object} e 地图点击事件
		 */
		onMapClick(e) {
			const point = this.resolveEventPoint(e);
			if (!point) return;
			const zoom = this.getZoom();
			// 配电箱：未达到详细图标阈值时命中最近的海量点
			if (zoom < ZOOM_BOX_DETAIL && this.isLayerChecked('box') && this.layerMode.box === 'point') {
				const box = this.findNearestByPixel(this.boxList, point, PICK_TOLERANCE_PX);
				if (box) {
					this.openBoxPopup(box);
					return;
				}
			}
			// 灯杆：未达到详细图标阈值时命中最近的海量点
			if (zoom < ZOOM_POLE_DETAIL && this.isLayerChecked('pole') && this.layerMode.pole === 'point') {
				const poles = filterPoleByState(this.poleList, this.stateIndex);
				const pole = this.findNearestByPixel(poles, point, PICK_TOLERANCE_PX);
				if (pole) this.openPoleDetail(pole);
			}
		},
		/**
		 * 按像素距离查找最近的标注物（低缩放时的聚合点命中判定）
		 * @param {Array} list 标注物列表
		 * @param {{lat:number,lng:number}} point 点击坐标（BD-09）
		 * @param {number} maxPixels 最大命中距离（px）
		 * @returns {Object|null}
		 */
		findNearestByPixel(list, point, maxPixels) {
			if (!this.h5Map || !this.h5BMapGL || typeof this.h5Map.pointToPixel !== 'function') return null;
			let target = null;
			try {
				target = this.h5Map.pointToPixel(new this.h5BMapGL.Point(Number(point.lng), Number(point.lat)));
			} catch (e) {
				return null;
			}
			if (!target) return null;
			let nearest = null;
			let minDistance = Infinity;
			(list || []).forEach((item) => {
				if (!isValidPoint(item.lat, item.lng)) return;
				let pixel = null;
				try {
					pixel = this.h5Map.pointToPixel(new this.h5BMapGL.Point(Number(item.lng), Number(item.lat)));
				} catch (e) {
					return;
				}
				if (!pixel) return;
				const dx = Number(pixel.x) - Number(target.x);
				const dy = Number(pixel.y) - Number(target.y);
				const distance = dx * dx + dy * dy;
				if (distance < minDistance) {
					minDistance = distance;
					nearest = item;
				}
			});
			return (nearest && minDistance <= maxPixels * maxPixels) ? nearest : null;
		},
		/** 从地图事件中解析点击坐标（兼容 e.point / e.latlng / 像素坐标） */
		resolveEventPoint(e) {
			if (!e) return null;
			const candidates = [e.point, e.latlng, e.latLng];
			for (let i = 0; i < candidates.length; i++) {
				const candidate = candidates[i];
				if (!candidate) continue;
				const lat = Number(candidate.lat);
				const lng = Number(candidate.lng !== undefined ? candidate.lng : candidate.lon);
				if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
			}
			// 兜底：部分版本事件只带像素坐标
			if (e.pixel && this.h5Map && typeof this.h5Map.pixelToPoint === 'function') {
				try {
					const point = this.h5Map.pixelToPoint(e.pixel);
					if (point) return { lat: Number(point.lat), lng: Number(point.lng) };
				} catch (err) {
					console.warn('像素坐标转换失败', err);
				}
			}
			return null;
		},
		/* ---- 配电箱 ---- */
		/**
		 * 配电箱：zoom >= 18.2 显示详细标注物，否则显示聚合点（文档 §9.1）
		 * @param {boolean} [force] 是否强制重建（聚合点覆盖全部设备，单纯平移无需重建）
		 */
		renderBoxLayer(force) {
			const zoom = this.getZoom();
			const mode = zoom >= ZOOM_BOX_DETAIL ? 'detail' : 'point';
			// 聚合点模式：档位未变时平移不需要重建，避免反复创建海量点
			if (!force && mode === 'point' && this.layerMode.box === 'point') return;
			this.clearOverlays('box');
			this.layerMode.box = '';
			if (!this.isLayerChecked('box')) return;
			if (mode === 'detail') {
				const list = filterByViewport(this.boxList, this.getBounds(), zoom);
				this.addDetailMarkers('box', list, boxIconPath, BOX_ICON_SIZE, MAP_TYPE_BOX, zoom);
			} else {
				this.addPointMarkers('box', this.boxList, 'STAR', POINT_STAR_COLOR, POINT_STAR_ICON, MAP_TYPE_BOX);
			}
			this.layerMode.box = mode;
		},
		/* ---- 单灯·灯杆 ---- */
		/**
		 * 灯杆：zoom >= 18 显示详细标注物，否则显示聚合点（文档 §9.2），并按左侧状态栏筛选
		 * @param {boolean} [force] 是否强制重建
		 */
		renderPoleLayer(force) {
			const zoom = this.getZoom();
			const mode = zoom >= ZOOM_POLE_DETAIL ? 'detail' : 'point';
			if (!force && mode === 'point' && this.layerMode.pole === 'point') return;
			this.clearOverlays('pole');
			this.layerMode.pole = '';
			if (!this.isLayerChecked('pole')) return;
			const poles = filterPoleByState(this.poleList, this.stateIndex);
			if (mode === 'detail') {
				const list = filterByViewport(poles, this.getBounds(), zoom);
				this.addDetailMarkers('pole', list, poleIconPath, poleIconSizeFor, MAP_TYPE_POLE, zoom);
			} else {
				this.addPointMarkers('pole', poles, 'CIRCLE', POINT_DOT_COLOR, POINT_DOT_ICON, MAP_TYPE_POLE);
			}
			this.layerMode.pole = mode;
		},
		/* ---- 专变 ---- */
		renderSpecialLayer() {
			this.clearOverlays('special');
			if (!this.isLayerChecked('special')) return;
			const zoom = this.getZoom();
			const list = filterByViewport(this.specialList, this.getBounds(), zoom);
			this.addDetailMarkers('special', list, specialIconPath, SPECIAL_ICON_SIZE, MAP_TYPE_SPECIAL, zoom);
		},
		/* ---- 水浸 ---- */
		renderWaterLayer() {
			this.clearOverlays('water');
			if (!this.isLayerChecked('water')) return;
			const zoom = this.getZoom();
			const list = filterByViewport(this.waterList, this.getBounds(), zoom);
			this.addDetailMarkers('water', list, waterIconPath, WATER_ICON_SIZE, MAP_TYPE_WATER, zoom);
		},
		/* ---- 线缆 ---- */
		/** 线缆：用直线将各点连起来，点击只打印日志 */
		renderLineLayer() {
			this.clearOverlays('line');
			if (!this.isLayerChecked('line')) return;
			const BMapGL = this.h5BMapGL;
			this.lineList.forEach((line) => {
				const points = (line.points || [])
					.filter(point => isValidPoint(point.lat, point.lng))
					.map(point => new BMapGL.Point(Number(point.lng), Number(point.lat)));
				if (points.length < 2) return;
				try {
					const polyline = new BMapGL.Polyline(points, LINE_STYLE);
					polyline.addEventListener('click', () => {
						console.log('点击线缆', line.name);
					});
					this.h5Map.addOverlay(polyline);
					this.overlays.line.push(polyline);
				} catch (e) {
					console.error('渲染线缆失败', e);
				}
			});
		},

		/* ==================== 标注物点击 ==================== */
		/**
		 * 标注物点击分发（文档 §11.1）
		 * @param {number} mapType 标注物类型（DeviceTypeUtil）
		 * @param {Object} item 标注物数据
		 */
		onMarkerClick(mapType, item) {
			if (!item) return;
			if (mapType === MAP_TYPE_BOX || mapType === MAP_TYPE_SPECIAL) {
				this.openBoxPopup(item);
			} else if (mapType === MAP_TYPE_WATER) {
				this.openWaterPopup(item);
			} else if (mapType === MAP_TYPE_POLE) {
				this.openPoleDetail(item);
			}
		},
		/* ---- 配电箱 / 专变 ---- */
		openBoxPopup(item) {
			this.boxPopup = {
				visible: true,
				name: item.name || '',
				id: item.id,
				lat: Number(item.lat),
				lng: Number(item.lng)
			};
		},
		closeBoxPopup() {
			this.boxPopup.visible = false;
		},
		/** 查看详情：跳转状态操作模块对应详情界面（配电箱 / 专变 → stationOne） */
		onBoxDetail() {
			const id = this.boxPopup.id;
			if (id === null || id === undefined || id === '') {
				uni.showToast({ title: '缺少站点信息', icon: 'none' });
				return;
			}
			this.closeBoxPopup();
			uni.navigateTo({
				url: `/pages/operation/components/stationTypes/stationOne?stationId=${id}&boxName=${encodeURIComponent(this.boxPopup.name || '')}`
			});
		},
		/** 修改定位：showAndEditLocation（type=0 配电箱 / 专变，id 传站点 id） */
		onBoxModifyLocation() {
			this.openEditLocation({
				type: POS_TYPE_BOX,
				id: this.boxPopup.id,
				name: this.boxPopup.name,
				lat: this.boxPopup.lat,
				lng: this.boxPopup.lng
			});
		},
		/** 路线导航 */
		onBoxNavigation() {
			this.navigateToTarget({
				lat: this.boxPopup.lat,
				lng: this.boxPopup.lng,
				name: this.boxPopup.name
			});
		},
		/* ---- 水浸 ---- */
		openWaterPopup(item) {
			this.waterPopup = { visible: true, bean: item };
		},
		closeWaterPopup() {
			this.waterPopup.visible = false;
		},
		/** 查看详情：跳转水浸站点详情（stationThree） */
		onWaterDetail() {
			const bean = this.waterPopup.bean || {};
			const stationId = bean.stationId;
			if (stationId === null || stationId === undefined || stationId === '') {
				uni.showToast({ title: '缺少站点信息', icon: 'none' });
				return;
			}
			this.closeWaterPopup();
			uni.navigateTo({
				url: `/pages/operation/components/stationTypes/stationThree?stationId=${stationId}&boxName=${encodeURIComponent(bean.name || '')}`
			});
		},
		/** 修改定位：水浸走独立接口（type=3，id 传水浸 id） */
		onWaterModifyLocation() {
			const bean = this.waterPopup.bean || {};
			this.openEditLocation({
				type: POS_TYPE_WATER,
				id: bean.id,
				name: bean.name,
				lat: Number(bean.lat),
				lng: Number(bean.lng)
			});
		},
		/** 路线导航 */
		onWaterNavigation() {
			const bean = this.waterPopup.bean || {};
			this.navigateToTarget({
				lat: Number(bean.lat),
				lng: Number(bean.lng),
				name: bean.name
			});
		},

		/* ---- 单灯·灯杆（复用状态操作模块的灯杆详情） ---- */
		/** 点击灯杆：拉取灯杆详情（含杆上单灯列表）并弹出详情弹窗 */
		openPoleDetail(pole) {
			if (!pole) return;
			uni.showLoading({ title: '加载中...', mask: true });
			fetchPoleInfo(pole.id).then((res) => {
				const payload = res && res.data;
				if (isBusinessError(payload)) {
					uni.showToast({ title: decodeErrorMessage(payload) || '获取灯杆信息失败', icon: 'none' });
					return;
				}
				const data = parseResponseData(res) || {};
				const lights = Array.isArray(data.lights) ? data.lights : [];
				// 灯杆坐标：优先取详情接口返回值，无效时回退到标注物坐标（均为百度坐标）
				const lat = Number(data.lat);
				const lng = Number(data.lng);
				const hasCoord = isValidPoint(lat, lng);
				this.poleDetail = {
					id: pole.id,
					name: data.name || pole.name || '',
					lat: hasCoord ? lat : Number(pole.lat),
					lng: hasCoord ? lng : Number(pole.lng),
					lights: lights.map(light => wrapPoleLight(light, pole, data.stationId))
				};
				this.setPoleLocation(this.poleDetail.lat, this.poleDetail.lng);
				this.poleDetailVisible = true;
			}).catch((err) => {
				console.error('获取灯杆信息失败', err && err.message);
				uni.showToast({ title: '获取灯杆信息失败', icon: 'none' });
			}).finally(() => {
				uni.hideLoading();
			});
		},
		/** 保存当前灯杆坐标（BD-09 原始值 + GCJ-02 供导航使用） */
		setPoleLocation(lat, lng) {
			if (!isValidPoint(lat, lng)) {
				this.poleLocation = { lat: 0, lng: 0 };
				this.poleLocationBd09 = { lat: 0, lng: 0 };
				return;
			}
			this.poleLocationBd09 = { lat: Number(lat), lng: Number(lng) };
			const gcj = bd09ToGcj(Number(lat), Number(lng));
			this.poleLocation = { lat: gcj.lat, lng: gcj.lng };
		},
		/** 图片：灯杆图片管理页 */
		onPoleImages() {
			if (!this.poleDetail.id && this.poleDetail.id !== 0) {
				uni.showToast({ title: '未获取到灯杆信息', icon: 'none' });
				return;
			}
			uni.navigateTo({ url: `/pages/operation/components/deviceManagement/managePoleImages?poleId=${this.poleDetail.id}` });
		},
		/** 操作：跳转该单灯所属站点的单灯界面（stationTwo） */
		onPoleOperation(light) {
			if (!light) {
				uni.showToast({ title: '该灯杆下没有单灯', icon: 'none' });
				return;
			}
			const stationId = light.stationId || this.stationId;
			if (!stationId) {
				uni.showToast({ title: '缺少站点信息', icon: 'none' });
				return;
			}
			this.poleDetailVisible = false;
			uni.navigateTo({
				url: `/pages/operation/components/stationTypes/stationTwo?stationId=${stationId}&boxName=${encodeURIComponent('')}`
			});
		},
		/** 修改定位：灯杆（type=14，id 传灯杆 id） */
		onPoleModifyLocation() {
			const bd = this.poleLocationBd09 || {};
			this.openEditLocation({
				type: POS_TYPE_POLE,
				id: this.poleDetail.id,
				name: this.poleDetail.name,
				lat: bd.lat,
				lng: bd.lng
			});
		},
		/** 所属灯杆定位图标：查看灯杆位置 */
		onShowPoleLocation() {
			const bd = this.poleLocationBd09 || {};
			this.openEditLocation({
				type: POS_TYPE_POLE,
				id: this.poleDetail.id,
				name: this.poleDetail.name,
				lat: bd.lat,
				lng: bd.lng,
				mode: 'view'
			});
		},
		/** 路线导航：灯杆位置 */
		onPoleNavigation() {
			this.navigateToTarget({
				lat: this.poleLocationBd09.lat,
				lng: this.poleLocationBd09.lng,
				name: this.poleDetail.name || '灯杆位置'
			});
		},

		/* ==================== 编辑 / 查看定位（复用状态操作模块页面） ==================== */
		/**
		 * 跳转「修改定位 / 查看定位」页面
		 * @param {{type:number,id:any,name:string,lat:number,lng:number,mode?:string}} params
		 */
		openEditLocation(params) {
			const item = params || {};
			if (item.id === null || item.id === undefined || item.id === '') {
				uni.showToast({ title: '未获取到设备信息', icon: 'none' });
				return;
			}
			const query = [
				`mode=${item.mode || 'edit'}`,
				`type=${item.type}`,
				`id=${item.id}`,
				`name=${encodeURIComponent(item.name || '')}`,
				`lat=${isValidPoint(item.lat, item.lng) ? Number(item.lat) : ''}`,
				`lng=${isValidPoint(item.lat, item.lng) ? Number(item.lng) : ''}`
			].join('&');
			uni.navigateTo({ url: `/pages/operation/components/showAndEditLocation?${query}` });
		},
		/** 定位修改结果回传：同步本地坐标并重绘 */
		onLocationResult(payload) {
			if (!payload || !payload.saved) return;
			const type = Number(payload.type);
			const id = String(payload.id);
			const lat = Number(payload.lat);
			const lng = Number(payload.lng);
			if (!isValidPoint(lat, lng)) return;
			if (type === POS_TYPE_POLE) {
				this.poleList.forEach((pole) => {
					if (String(pole.id) === id) {
						pole.lat = lat;
						pole.lng = lng;
					}
				});
				if (String(this.poleDetail.id) === id) this.setPoleLocation(lat, lng);
				this.renderAll();
				return;
			}
			if (type === POS_TYPE_BOX) {
				// 配电箱 / 专变：id 为站点 id
				this.boxList.concat(this.specialList).forEach((item) => {
					if (String(item.id) === id) {
						item.lat = lat;
						item.lng = lng;
					}
				});
				if (String(this.boxPopup.id) === id) {
					this.boxPopup.lat = lat;
					this.boxPopup.lng = lng;
				}
				this.renderAll();
				return;
			}
			if (type === POS_TYPE_WATER) {
				this.waterList.forEach((item) => {
					if (String(item.id) === id) {
						item.lat = lat;
						item.lng = lng;
					}
				});
				if (String(this.waterPopup.bean.id) === id) {
					this.waterPopup.bean = Object.assign({}, this.waterPopup.bean, { lat, lng });
				}
				this.renderWaterLayer();
			}
		},

		/* ==================== 导航（复用组件与工具方法） ==================== */
		/**
		 * 路线导航：小程序端直接打开内置地图，其余端弹出地图选择弹窗（文档 §15）
		 * @param {{lat:number,lng:number,name:string}} target 目标坐标（BD-09）
		 */
		navigateToTarget(target) {
			if (!isValidPoint(target && target.lat, target && target.lng)) {
				uni.showToast({ title: '未获取到设备位置', icon: 'none' });
				return;
			}
			this.navTarget = {
				lat: Number(target.lat),
				lng: Number(target.lng),
				name: target.name || '目的地'
			};
			// #ifdef MP
			// 小程序端：直接打开内置地图
			const gcj = bd09ToGcj(this.navTarget.lat, this.navTarget.lng);
			if (!openMiniMap(gcj, this.navTarget.name)) {
				uni.showToast({ title: '未获取到设备位置', icon: 'none' });
			}
			// #endif

			// #ifndef MP
			this.$refs.mapSelectionPopup.open();
			// #endif
		},
		/** 选择地图后打开路线（起点为当前定位） */
		onMapSelected(mapName) {
			this.$refs.mapSelectionPopup.$refs.popup.close();
			const target = this.navTarget;
			if (!target) return;
			const gcj = bd09ToGcj(target.lat, target.lng);
			navigateWithMap(mapName, {
				dest: gcj,                                   // GCJ-02（高德 / 腾讯 / 谷歌使用）
				destBd: { lat: target.lat, lng: target.lng }, // BD-09（百度地图使用）
				destName: target.name
			});
		},

		/* ==================== 图层开关（文档 §7.2） ==================== */
		toggleLayer(key) {
			const layer = this.layers.find(item => item.key === key);
			if (!layer) return;
			layer.checked = !layer.checked;
			// 取消勾选「单灯·灯杆」时清除状态筛选
			if (key === 'pole' && !layer.checked) this.stateIndex = -1;
			this.$nextTick(() => {
				this.renderAll();
			});
		},
		/** 单灯状态筛选（单选，再次点击取消筛选） */
		toggleStateFilter(index) {
			this.stateIndex = this.stateIndex === index ? -1 : index;
			this.$nextTick(() => {
				this.renderPoleLayer(true);
			});
		},
		/** 刷新：清缓存 → 重拉三接口 → 重绘（文档 §18.12） */
		onRefresh() {
			if (this.loading) return;
			this.clearOverlays('box');
			this.clearOverlays('pole');
			this.clearOverlays('special');
			this.clearOverlays('water');
			this.clearOverlays('line');
			this.stateIndex = -1;
			this.loadGisData();
		},

		/* ==================== 地图交互 ==================== */
		/** 二维地图 / 实景地图切换 */
		toggleMapType() {
			this.satellite = !this.satellite;
			if (isH5Platform() && this.h5Map) {
				try {
					this.h5Map.setMapType(resolveMapType(this.satellite));
				} catch (e) {
					console.error('切换地图类型失败', e);
				}
			}
		},
		/** 定位：以当前定位为中心（不重置缩放级别），并绘制当前位置蓝点 */
		locateCurrent() {
			if (this.locating) return;
			if (isH5Platform() && (!this.mapReady || !this.h5Map)) {
				uni.showToast({ title: '地图未就绪，请稍后重试', icon: 'none' });
				return;
			}
			if (this.myLocation) {
				this.centerOn(this.myLocation, false);
				this.updateMyLocationOverlay();
				return;
			}
			this.locating = true;
			getCurrentPoint().then((pos) => {
				if (this._unloaded || !pos) return;
				this.myLocation = pos;
				this.updateMyLocationOverlay();
				this.centerOn(pos, false);
			}).catch((err) => {
				console.error('获取当前位置失败', err && err.message);
				uni.showToast({ title: '获取当前位置失败，请检查定位权限', icon: 'none' });
			}).finally(() => {
				this.locating = false;
			});
		},
		/**
		 * 地图居中
		 * @param {{lat:number,lng:number}} point BD-09 坐标
		 * @param {boolean} setZoom 是否同时设置缩放级别（定位按钮不重置缩放）
		 */
		centerOn(point, setZoom) {
			if (!point) return;
			// 记录程序化移动时间戳：小程序端 regionchange 回写中心点时据此丢弃“接口调用”类视野变化
			this._programmaticMoveAt = Date.now();
			if (isH5Platform() && this.h5Map && this.h5BMapGL) {
				try {
					const target = new this.h5BMapGL.Point(Number(point.lng), Number(point.lat));
					let zoom = Number(this.mapScale) || ZOOM_DEFAULT;
					if (!setZoom && typeof this.h5Map.getZoom === 'function') {
						const current = Number(this.h5Map.getZoom());
						if (Number.isFinite(current) && current > 0) zoom = current;
					}
					this.h5Map.centerAndZoom(target, zoom);
				} catch (e) {
					console.warn('地图居中失败', e);
				}
			}
			this.mpCenter = { lat: Number(point.lat), lng: Number(point.lng) };
		},
		/** 放大 / 缩小（delta 为 +1 / -1） */
		zoomBy(delta) {
			const h5 = isH5Platform();
			const min = h5 ? ZOOM_MIN_H5 : ZOOM_MIN_MP;
			const max = h5 ? ZOOM_MAX_H5 : ZOOM_MAX_MP;
			let zoom = this.getZoom() + Number(delta);
			if (zoom > max) zoom = max;
			if (zoom < min) zoom = min;
			if (h5 && this.h5Map && typeof this.h5Map.setZoom === 'function') {
				try {
					this.h5Map.setZoom(zoom);
					this.mapScale = zoom;
					// setZoom 为动画缩放，zoomend 后按最终缩放重绘（此处再兜底一次）
					this.afterZoomRender(zoom);
					return;
				} catch (e) {
					console.warn('设置缩放级别失败', e);
				}
			}
			// 小程序端：更新 map 组件的 scale 属性
			this.mapScale = zoom;
		},
		/**
		 * 缩放动画结束后重绘（setZoom 为异步动画，getZoom 在动画期间返回中间值）
		 * @param {number} target 目标缩放级别
		 */
		afterZoomRender(target) {
			setTimeout(() => {
				if (this._unloaded) return;
				const current = this.getZoom();
				// 动画已结束（或已非常接近目标）时以实例值为准并重绘
				if (Math.abs(current - Number(target)) < 0.3) this.mapScale = current;
				this.renderViewportLayers();
			}, 420);
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
				// 外圈光晕 + 内圈实心点
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

		/* ==================== 小程序端地图事件 ==================== */
		/** 小程序标记点击：按标记 id 反查设备并弹窗 */
		onMiniMarkerTap(e) {
			const markerId = Number(e && e.detail && e.detail.markerId);
			if (markerId === MY_LOCATION_MARKER_ID) return; // 当前位置蓝点不弹窗
			const marker = (this.mpMarkers || []).find(item => item.id === markerId);
			if (!marker) return;
			const device = this.findDevice(marker.mapType, marker.deviceId);
			if (device) this.onMarkerClick(marker.mapType, device);
		},
		/** 按类型与 id 查找本地设备数据 */
		findDevice(mapType, id) {
			let list = [];
			if (mapType === MAP_TYPE_BOX) list = this.boxList;
			else if (mapType === MAP_TYPE_SPECIAL) list = this.specialList;
			else if (mapType === MAP_TYPE_WATER) list = this.waterList;
			else if (mapType === MAP_TYPE_POLE) list = this.poleList;
			return list.find(item => String(item.id) === String(id)) || null;
		},
		/** 小程序地图视野变化：同步缩放级别与可视范围，并回写手势结束后的实际中心点 */
		onMiniRegionChange(e) {
			// 兼容不同基础库的事件结构：地图信息可能平铺在 detail 中，也可能再嵌套一层 detail；
			// causedBy / type 可能挂在事件顶层，也可能在 detail 内
			const raw = (e && e.detail) || {};
			const info = raw.detail || raw;
			const type = raw.type || info.type || '';
			if (type && type !== 'end') return;
			const causedBy = (e && e.causedBy) || raw.causedBy || info.causedBy || '';
			// drag 拖动 / scale 缩放为用户手势；update 为接口调用（setData 经纬度、缩放等）
			const isUserGesture = causedBy === 'drag' || causedBy === 'scale';
			const isUpdate = causedBy === 'update';
			if (isUserGesture) this.userMovedMap = true;
			// 接口调用类视野变化无需再同步（数据源就是本次 setData），跳过以避免无效重绘
			if (!isUpdate) {
				let handled = false;
				const scale = Number(info.scale);
				if (Number.isFinite(scale) && scale > 0) {
					this.mapScale = scale;
					handled = true;
				}
				if (info.region && info.region.southwest && info.region.northeast) {
					this.applyMiniRegion(info.region);
					handled = true;
				}
				// 部分基础库不返回 scale / region，改用地图上下文查询
				if (!handled) this.syncMiniMapState();
			}
			/*
			 * 手势结束后把绑定中心点回写为地图实际中心（与缩放 / 可视范围同一批 setData）：
			 * <map> 的 latitude / longitude 是响应式绑定，此后任何 setData（如 markers 更新）都会
			 * 让地图回到绑定中心点，表现为「一拖动就弹回当前位置」。绑定值与地图实际位置一致后，
			 * 拖动到哪就停在哪。
			 * causedBy 为 update（定位按钮 / 搜索等程序化移动）时不回写，避免覆盖目标中心点并引发事件震荡。
			 */
			if (isUserGesture) this.syncMiniCenter(info);
		},
		/** 小程序：通过地图上下文同步缩放级别与可视范围 */
		syncMiniMapState() {
			const ctx = this.ensureMapCtx();
			if (!ctx) return;
			ctx.getScale({
				success: (res) => {
					const scale = Number(res && res.scale);
					if (Number.isFinite(scale) && scale > 0) this.mapScale = scale;
				}
			});
			ctx.getRegion({
				success: (res) => this.applyMiniRegion(res)
			});
		},
		/** 获取小程序地图上下文（懒创建，失败返回 null） */
		ensureMapCtx() {
			if (!this.mapCtx) {
				try {
					this.mapCtx = uni.createMapContext('gisMap', this);
				} catch (e) {
					this.mapCtx = null;
				}
			}
			return this.mapCtx;
		},
		/** 手势结束后回写小程序地图实际中心点（GCJ-02 → BD-09） */
		syncMiniCenter(info) {
			const center = info && info.centerLocation;
			if (center && Number.isFinite(Number(center.latitude)) && Number.isFinite(Number(center.longitude))) {
				this.applyMiniCenter(Number(center.latitude), Number(center.longitude));
				return;
			}
			// 部分基础库事件里没有 centerLocation，用地图上下文兜底
			// （若查询期间发生过程序化移动——定位按钮 / 搜索等，则丢弃本次结果）
			const ctx = this.ensureMapCtx();
			if (!ctx) return;
			const programmaticAt = this._programmaticMoveAt;
			ctx.getCenterLocation({
				success: (res) => {
					if (this._unloaded || this._programmaticMoveAt !== programmaticAt) return;
					this.applyMiniCenter(Number(res && res.latitude), Number(res && res.longitude));
				}
			});
		},
		/** 小程序地图实际中心（GCJ-02）→ mpCenter（BD-09） */
		applyMiniCenter(lat, lng) {
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
			const bd = gcjToBd09(lat, lng);
			this.mpCenter = { lat: bd.lat, lng: bd.lng };
		},
		/** 小程序可视范围（GCJ-02）→ 百度坐标范围，供可视范围过滤使用 */
		applyMiniRegion(region) {
			if (!region || !region.southwest || !region.northeast) return;
			const southWest = gcjToBd09(region.southwest.latitude, region.southwest.longitude);
			const northEast = gcjToBd09(region.northeast.latitude, region.northeast.longitude);
			this.mpBounds = {
				latMin: southWest.lat,
				latMax: northEast.lat,
				lngMin: southWest.lng,
				lngMax: northEast.lng
			};
		},

		/* ==================== 搜索 ==================== */
		openSearch() {
			this.searchVisible = true;
		},
		/**
		 * 搜索回传：定位到目标坐标（对应 Android 的 ShowMarkOnMapBean 处理）
		 * @param {{lat:number,lng:number,zoom:number,type:number}} payload
		 */
		onSearchSelect(payload) {
			if (!payload || !isValidPoint(payload.lat, payload.lng)) return;
			const zoom = Number(payload.zoom) || ZOOM_DEFAULT;
			const type = Number(payload.type);
			// 配电箱 / 灯杆搜索命中时自动勾选对应图层
			if (type === SEARCH_TYPE_BOX) this.ensureLayerChecked('box');
			if (type === SEARCH_TYPE_POLE) this.ensureLayerChecked('pole');
			this.mapScale = zoom;
			this.centerOn({ lat: Number(payload.lat), lng: Number(payload.lng) }, true);
			// H5 端 centerAndZoom 会触发 zoomend/moveend 完成重绘；小程序端由 markers 计算属性自动更新
			this.$nextTick(() => {
				this.renderAll();
			});
		},
		/** 勾选指定图层（已勾选时不处理） */
		ensureLayerChecked(key) {
			const layer = this.layers.find(item => item.key === key);
			if (layer && !layer.checked) layer.checked = true;
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
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background-color: var(--bg-page, #f8f8f8);
}

.map-area {
	position: relative;
	flex: 1;
	min-height: 0;
	overflow: hidden;
	background-color: #e8eef6;
}

.map-canvas {
	width: 100%;
	height: 100%;
}

/* ==================== 头部条件搜索 ==================== */
.gis-header {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	z-index: 20;
	display: flex;
	align-items: center;
	padding: 16rpx 20rpx;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.refresh-btn {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	margin-right: 8rpx;
	border-radius: 50%;
}

.refresh-btn:active {
	background-color: var(--bg-soft, #f2f4f8);
}

/* 左右固定、中部可左右滑动 */
.layer-scroll {
	flex: 1;
	min-width: 0;
	white-space: nowrap;
}

.layer-inner {
	display: inline-flex;
	align-items: center;
	padding: 0 8rpx;
}

.layer-item {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	padding: 6rpx 0;
	margin-right: 28rpx;
}

.layer-name {
	margin-left: 8rpx;
	font-size: 26rpx;
	color: var(--text-primary, #333333);
	white-space: nowrap;
}

.layer-count {
	margin-left: 6rpx;
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
}

.search-btn {
	flex-shrink: 0;
	height: 60rpx;
	line-height: 60rpx;
	padding: 0 26rpx;
	margin-left: 12rpx;
	font-size: 28rpx;
	color: #ffffff;
	background-color: var(--color-primary, #3a7bf7);
	border-radius: 8rpx;
}

/* ==================== 二维 / 实景切换 ==================== */
.map-type-switch {
	position: absolute;
	right: 24rpx;
	top: 120rpx;
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 104rpx;
	height: 104rpx;
	border-radius: 16rpx;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
}

.map-type-thumb {
	width: 58rpx;
	height: 40rpx;
	border-radius: 8rpx;
}

/* 实景（卫星）缩略图 */
.thumb-satellite {
	background-image:
		radial-gradient(circle at 28% 30%, #6d8b4a 0%, rgba(109, 139, 74, 0) 48%),
		radial-gradient(circle at 74% 66%, #8a9a5b 0%, rgba(138, 154, 91, 0) 42%),
		radial-gradient(circle at 18% 82%, #4f6b3a 0%, rgba(79, 107, 58, 0) 52%),
		linear-gradient(135deg, #3f5a30, #6f8a4e);
}

/* 二维（矢量）缩略图 */
.thumb-2d {
	background-image:
		repeating-linear-gradient(0deg, rgba(120, 160, 210, 0.35) 0, rgba(120, 160, 210, 0.35) 2rpx, rgba(0, 0, 0, 0) 2rpx, rgba(0, 0, 0, 0) 12rpx),
		repeating-linear-gradient(90deg, rgba(120, 160, 210, 0.35) 0, rgba(120, 160, 210, 0.35) 2rpx, rgba(0, 0, 0, 0) 2rpx, rgba(0, 0, 0, 0) 12rpx),
		linear-gradient(#f2f6fb, #e2ebf7);
}

.map-type-label {
	margin-top: 4rpx;
	font-size: 18rpx;
	line-height: 1.2;
	color: var(--text-secondary, #666666);
}

/* ==================== 左侧单灯状态筛选栏 ==================== */
.state-bar {
	position: absolute;
	left: 20rpx;
	top: 200rpx;
	z-index: 19;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12rpx 8rpx;
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
}

.state-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 10rpx 20rpx;
	border-radius: 10rpx;
}

.state-item.is-active {
	background-color: var(--bg-soft, #eef4ff);
}

.state-icon {
	width: 40rpx;
	height: 50rpx;
}

.state-count {
	margin-top: 2rpx;
	font-size: 20rpx;
	color: var(--text-secondary, #666666);
}

/* ==================== 右下角地图工具 ==================== */
.map-tools {
	position: absolute;
	right: 24rpx;
	bottom: 180rpx;
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.tool-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 84rpx;
	height: 84rpx;
	margin-top: 16rpx;
	border-radius: 50%;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.16);
}

.tool-btn:active {
	background-color: var(--bg-soft, #f2f4f8);
}

.tool-icon {
	width: 40rpx;
	height: 40rpx;
}

/* 定位中：图标变淡，避免重复点击 */
.tool-btn.is-locating .tool-icon {
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

/* ==================== 小程序端样式 ==================== */
/* 头部：普通视图，位于地图上方 */
.mp-header {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
}

/* 地图浮层 */
.mp-map-type {
	position: absolute;
	right: 20rpx;
	top: 20rpx;
	z-index: 20;
	padding: 12rpx 20rpx;
	font-size: 24rpx;
	color: var(--text-primary, #333333);
	text-align: center;
	background-color: #ffffff;
	border-radius: 12rpx;
}

.mp-state-bar {
	position: absolute;
	left: 16rpx;
	top: 140rpx;
	display: flex;
	flex-direction: column;
	padding: 8rpx;
	background-color: #ffffff;
	border-radius: 12rpx;
}

.mp-state-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 8rpx 10rpx;
	border-radius: 8rpx;
}

.mp-state-item.is-active {
	background-color: #eef4ff;
}

.mp-state-icon {
	width: 40rpx;
	height: 50rpx;
}

.mp-state-count {
	font-size: 18rpx;
	color: #666666;
	text-align: center;
}

/*
 * 右下角工具按钮：底部让开 tabBar（tabBar 高 120rpx、距屏幕底部 24rpx + 底部安全区），
 * 故取 168rpx + 安全区，保证按钮始终显示在 tabBar 上方而不是被遮挡
 */
.mp-tools {
	position: absolute;
	right: 20rpx;
	bottom: calc(168rpx + env(safe-area-inset-bottom));
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.mp-tool-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 76rpx;
	height: 76rpx;
	margin-top: 14rpx;
	background-color: #ffffff;
	border-radius: 38rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.16);
}

.mp-tool-icon {
	width: 36rpx;
	height: 36rpx;
}

.mp-tool-text {
	font-size: 36rpx;
	line-height: 36rpx;
	color: #4e5969;
	text-align: center;
}

.mp-tool-btn.is-locating .mp-tool-icon {
	opacity: 0.4;
}

/* ==================== H5：让开原生导航栏高度 ==================== */
/* #ifdef H5 */
.page {
	display: block;
	top: var(--window-top, 0px);
	bottom: var(--window-bottom, 0px);
}

.map-area {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}
/* #endif */
</style>
