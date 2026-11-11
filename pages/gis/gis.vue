<template>
	<view :class="themeClass" class="page">
		<!-- ==================== 小程序端：头部条件搜索 ==================== -->
		<!-- #ifndef H5 -->
		<view class="mp-header">
			<view class="refresh-btn" @click="onRefresh">
				<uni-icons :color="primaryColor" size="24" type="refreshempty" />
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
			<view class="search-btn" @click="openSearch">
				<uni-icons color="#ffffff" size="24" type="search" />
			</view>
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
					<uni-icons :color="primaryColor" size="24" type="refreshempty" />
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
				<view class="search-btn" @click="openSearch">
					<uni-icons color="#ffffff" size="24" type="search" />
				</view>
			</view>

			<!-- 二维 / 实景地图切换 -->
			<view class="map-type-switch" @click="toggleMapType">
				<view :class="satellite ? 'thumb-2d' : 'thumb-satellite'" class="map-type-thumb"></view>
				<text class="map-type-label">{{ satellite ? '二维地图' : '卫星地图' }}</text>
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
			<cover-view v-if="!mapPopupOpen" class="mp-map-type" @click="toggleMapType">{{ satellite ? '二维地图' : '卫星地图' }}</cover-view>

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
			@click-duration="onPoleLightOnDuration"
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
	LABEL_PIXEL_OFFSET_Y,
	POLE_STATE_LIST,
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
	fetchLightStationId,
	fetchStationName,
	labelPixelWidth,
	buildRenderEntries,
	groupPoleByState
} from '@/utils/gis';
import { clusterByGrid, clusterCellPx, estimateBounds } from '@/utils/gisRender';

// 地图容器 id（H5）
const MAP_DOM_ID = 'gisMapCanvas';
// 小程序端「当前定位」标记 id（设备标记从 1 开始，故用 0 区分）
const MY_LOCATION_MARKER_ID = 0;
// 小程序端「当前定位」蓝点显示尺寸（px，与 static/common/map/location-dot.png 原始尺寸一致）
const MY_LOCATION_ICON_SIZE = 40;
// 名称标签最多渲染的标注物数量（超出只渲染图标，避免卡顿）
const MAX_LABELS = 250;
/*
 * 详细图标档位的渲染上限：
 * 超过上限说明该缩放级别下点位仍然过密，改用聚合点渲染。
 * 这样任何缩放级别下交给地图的覆盖物数量都有上限，与设备总数无关。
 */
const MAX_DETAIL_POLE = 250;
const MAX_DETAIL_BOX = 250;
const MAX_DETAIL_OTHER = 200;
// 单次渲染的聚合点数量上限（视口范围与缩放级别不匹配时的硬保护）
const MAX_CLUSTERS = 220;
// 小程序端标记重建节流（ms）：合并同一批视野变化，避免连续 setData
const MINI_MARKER_DELAY = 100;
/*
 * 小程序端视野对齐延迟（ms）
 * 手指离开屏幕时地图往往还在惯性滑动 / 缩放动画中，regionchange 里的中心点、缩放
 * 只是那一刻的快照。立刻回写 latitude / longitude / scale 会让原生地图重新应用属性，
 * 表现为「滑到某处又回退一点」「松手后自己放大缩小」，所以要等地图停稳再回读真实视野。
 */
const MINI_VIEW_SYNC_DELAY = 320;
// 程序化移动（定位 / 搜索 / 聚合点放大）后的视野对齐延迟：留出地图移动动画时间
const MINI_PROGRAMMATIC_SYNC_DELAY = 450;
/*
 * 停稳后是否把地图真实缩放回写到 <map scale> 绑定值。
 * 正常情况下应该回写（绑定值必须和地图实际状态一致，否则后续 setData 会把地图拉回去）；
 * 但个别基础库的 scale 只接受整数，回写小数值会被取整，反而出现「缩放回弹」，
 * 这类机型可把开关改为 false：缩放只在程序化操作（+ / - / 搜索）时下发。
 */
const SYNC_MAP_SCALE = true;
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
			linePointCount: 0,// 线缆数量
			loading: false,

			// 地图
			satellite: false,
			mapScale: ZOOM_DEFAULT,
			mpCenter: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }, // 小程序地图中心（BD-09）
			mpBounds: null,                                                 // 小程序可视范围（BD-09，用于高缩放时的可视范围过滤）
			// 小程序地图标记：由 buildMiniMarkers 按「视口裁剪 + 聚合 + 数量上限」构建后整体赋值，
			// 不再用 computed 全量推导（否则任何视野变化都会把上万条标记重新 setData 一次）
			mpMarkers: [],
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
	onShow() {
		// 进入页面时按当前语言刷新原生导航栏标题
		uni.setNavigationBarTitle({ title: this.$t('gis.title') })
	},
	created() {
		// BMapGL 覆盖物对象不放入 data（避免被 Vue 观测导致性能问题）
		this.h5Map = null;
		this.h5BMapGL = null;
		this.h5Dot = null;
		this.h5DotRing = null;
		this.overlays = { box: [], pole: [], special: [], water: [], line: [] };
		this.iconCache = new Map();      // 图标对象缓存（同一 URL + 尺寸只创建一次）
		this.renderCache = { box: [], pole: [], special: [], water: [] }; // 预计算渲染条目
		this.poleStateGroup = [];        // 灯杆按单灯状态预分组
		this.viewTimer = null;           // 拖动 / 缩放重绘防抖
		this.miniTimer = null;           // 小程序标记重建节流
		this.windowSize = null;          // 小程序窗口尺寸缓存（估算视口用）
		this.navTarget = null;           // 当前待导航目标（BD-09）
		this.mapCtx = null;              // 小程序地图上下文（获取缩放 / 可视范围）
		this.userMovedMap = false;       // 用户是否已手动拖动 / 缩放过地图（首次进入自动定位仅在未操作时生效）
		this.viewSyncTimer = null;       // 视野对齐定时器：等地图停稳后再回写绑定值
		this._viewSeq = 0;               // 视野查询序号：手势开始 / 新查询会让在途回调作废
		this._viewScale = 0;             // 小程序地图真实缩放（手势后由 regionchange / getScale 回读，不参与渲染绑定）
		this._probeCenter = null;        // 上一次回读的地图中心（GCJ-02），用于判断地图是否仍在惯性滑动
		this._suppressRegionSyncUntil = 0; // 自己回写触发的 regionchange 忽略截止时间（防止自激循环）
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
	onReady() {
		// 小程序：地图渲染完成后回读一次真实视野（首屏不会触发 regionchange）
		if (isH5Platform()) return;
		this.$nextTick(() => {
			this.scheduleMiniViewSync(0);
		});
	},
	onUnload() {
		this._unloaded = true;
		uni.$off(EVENT_LOCATION_RESULT, this.onLocationResult);
		if (this.viewTimer) {
			clearTimeout(this.viewTimer);
			this.viewTimer = null;
		}
		if (this.miniTimer) {
			clearTimeout(this.miniTimer);
			this.miniTimer = null;
		}
		this.cancelMiniViewSync();
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
					// 小程序：中心点靠绑定值驱动，等地图移动完成后回读一次可视范围（不改中心点）
					else this.scheduleMiniViewSync(MINI_PROGRAMMATIC_SYNC_DELAY, true);
				}
				this.updateMyLocationOverlay();
				this.scheduleMiniMarkers();
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
				// 数据到齐后一次性预计算渲染条目（图标 / GCJ 坐标 / 状态分组）
				this.prepareRenderData();
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
				this.linePointCount = 0;
				this.syncCounts();
				return;
			}
			const lineBeans = toList(parseResponseData(res));
			// 线缆数量
			this.linePointCount = lineBeans.reduce((sum, item) => (
				sum + (Array.isArray(item.points) ? item.points.length : 0)
			), 0);
			this.lineList = lineBeans.map((item) => {
				const points = Array.isArray(item.points)
					? item.points.map(p => ({ lat: Number(p && p.lat), lng: Number(p && p.lng) }))
					: [];
				return Object.assign({}, item, { points });
			}).filter(item => item.points.length > 1);
			this.syncCounts();
		},
		/** 同步图层数量与单灯状态统计 */
		syncCounts() {
			this.setLayerCount('box', this.boxList.length);
			this.setLayerCount('pole', this.poleList.length);
			this.setLayerCount('special', this.specialList.length);
			this.setLayerCount('water', this.waterList.length);
			this.setLayerCount('line', this.linePointCount);
		},
		/**
		 * 预计算渲染条目（数据加载完成 / 定位修改后调用）
		 *
		 * 把状态判定、图标路径、图标尺寸、BD-09 → GCJ-02 一次性算好，
		 * 后续缩放、拖动、图层切换只做「取字段 + 建覆盖物」，不再重复计算上万次。
		 */
		prepareRenderData() {
			this.renderCache = {
				box: buildRenderEntries(this.boxList, 'box'),
				pole: buildRenderEntries(this.poleList, 'pole'),
				special: buildRenderEntries(this.specialList, 'special'),
				water: buildRenderEntries(this.waterList, 'water')
			};
			// 单灯状态预分组：筛选时直接取数组，不再 filter 一万条
			this.poleStateGroup = groupPoleByState(this.renderCache.pole);
			this.stateCounts = this.poleStateGroup.map(group => group.length);
			if (this.stateIndex >= POLE_STATE_LIST.length) this.stateIndex = -1;
		},
		/** 取某一图层的渲染条目（灯杆按单灯状态筛选后返回） */
		getRenderEntries(kind) {
			if (kind === 'pole' && this.stateIndex >= 0) {
				const group = this.poleStateGroup[this.stateIndex];
				if (group) return group;
			}
			return this.renderCache[kind] || [];
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
					// 标注物与聚合点均使用普通 Marker，点击事件由覆盖物自身触发；
					// 不再监听地图 click 做全量像素距离命中（上万次坐标换算会直接卡住主线程）
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
			// 图标对象与地图实例绑定，重建地图后需重新创建
			this.iconCache = new Map();
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
		/** 当前缩放级别（H5 取地图实例；小程序优先取手势回读的真实缩放，其次取绑定值） */
		getZoom() {
			if (isH5Platform() && this.h5Map && typeof this.h5Map.getZoom === 'function') {
				const zoom = Number(this.h5Map.getZoom());
				if (Number.isFinite(zoom) && zoom > 0) return zoom;
			}
			if (!isH5Platform()) {
				const actual = Number(this._viewScale);
				if (Number.isFinite(actual) && actual > 0) return actual;
			}
			return Number(this.mapScale) || ZOOM_DEFAULT;
		},
		/** 当前可视范围（BD-09）；SDK 取不到时按中心点 + 缩放 + 容器像素估算，保证裁剪始终生效 */
		getBounds() {
			if (!isH5Platform() || !this.h5Map) return null;
			try {
				if (typeof this.h5Map.getBounds === 'function') {
					const bounds = this.h5Map.getBounds();
					const sw = bounds && typeof bounds.getSouthWest === 'function' ? bounds.getSouthWest() : null;
					const ne = bounds && typeof bounds.getNorthEast === 'function' ? bounds.getNorthEast() : null;
					if (sw && ne) {
						return {
							latMin: Number(sw.lat),
							latMax: Number(ne.lat),
							lngMin: Number(sw.lng),
							lngMax: Number(ne.lng)
						};
					}
				}
			} catch (e) {
				console.warn('获取可视范围失败', e);
			}
			// 兜底：中心点 + 缩放 + 容器尺寸估算（不能因为取不到范围就退化成全量渲染）
			try {
				const center = typeof this.h5Map.getCenter === 'function' ? this.h5Map.getCenter() : null;
				if (!center) return null;
				const size = this.getMapPixelSize();
				return estimateBounds(
					{ lat: Number(center.lat), lng: Number(center.lng) },
					this.getZoom(),
					size.width,
					size.height
				);
			} catch (e) {
				return null;
			}
		},
		/** 地图容器像素尺寸（取不到时用窗口尺寸兜底） */
		getMapPixelSize() {
			let width = 0;
			let height = 0;
			try {
				const container = typeof document !== 'undefined' ? document.getElementById(MAP_DOM_ID) : null;
				if (container) {
					width = Number(container.clientWidth) || 0;
					height = Number(container.clientHeight) || 0;
				}
			} catch (e) {
				// 忽略：使用窗口尺寸兜底
			}
			if (!width || !height) {
				const size = this.getWindowSize();
				width = size.width;
				height = size.height;
			}
			return { width, height };
		},
		/**
		 * 首次落图后自适应视野（仅当没有配置中心坐标、也没有当前定位时，用标注物兜底）
		 * 优化：只取数据的外接矩形两个角点，避免把上万个点交给 setViewport 逐个换算。
		 */
		fitInitialView() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			if (this.readCachedCenter() || this.myLocation) return;
			const source = this.renderCache.pole.length
				? this.renderCache.pole
				: (this.renderCache.box.length ? this.renderCache.box : this.renderCache.water);
			if (!source || source.length < 2) return;
			let latMin = Infinity;
			let latMax = -Infinity;
			let lngMin = Infinity;
			let lngMax = -Infinity;
			source.forEach((entry) => {
				if (entry.lat < latMin) latMin = entry.lat;
				if (entry.lat > latMax) latMax = entry.lat;
				if (entry.lng < lngMin) lngMin = entry.lng;
				if (entry.lng > lngMax) lngMax = entry.lng;
			});
			if (!Number.isFinite(latMin) || !Number.isFinite(lngMin)) return;
			if (latMax - latMin < 1e-6 && lngMax - lngMin < 1e-6) return;
			try {
				if (typeof this.h5Map.setViewport !== 'function') return;
				const BMapGL = this.h5BMapGL;
				this.h5Map.setViewport([
					new BMapGL.Point(lngMin, latMin),
					new BMapGL.Point(lngMax, latMax)
				]);
				this.mapScale = this.getZoom();
			} catch (e) {
				console.warn('自适应视野失败', e);
			}
		},

		/* ==================== 标注物渲染（H5） ==================== */
		/** 全量重绘（图层开关、数据刷新时调用） */
		renderAll() {
			this.scheduleMiniMarkers();
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.renderBoxLayer();
			this.renderPoleLayer();
			this.renderSpecialLayer();
			this.renderWaterLayer();
			this.renderLineLayer();
		},
		/** 只重绘被切换的图层（避免切换「线缆」时把灯杆 / 配电箱全部重建一遍） */
		renderLayerByKey(key) {
			this.scheduleMiniMarkers();
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			if (key === 'box') this.renderBoxLayer();
			else if (key === 'pole') this.renderPoleLayer();
			else if (key === 'special') this.renderSpecialLayer();
			else if (key === 'water') this.renderWaterLayer();
			else if (key === 'line') this.renderLineLayer();
		},
		/** 可视范围重绘（拖动 / 缩放结束后调用，线缆不需要重绘） */
		renderViewportLayers() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.renderBoxLayer();
			this.renderPoleLayer();
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
		/**
		 * 构建百度地图图标（anchor 传 {x, y}，y=1 表示图标底部对准坐标点）
		 * 说明：同 URL + 尺寸的图标对象只创建一次，避免每次重绘都新建上百个 Icon。
		 */
		getIcon(BMapGL, url, size, anchor) {
			const ax = anchor ? anchor.x : 0.5;
			const ay = anchor ? anchor.y : 1;
			const key = `${url}|${size.width}x${size.height}|${ax},${ay}`;
			const cached = this.iconCache.get(key);
			if (cached) return cached;
			const iconSize = new BMapGL.Size(size.width, size.height);
			const anchorPx = new BMapGL.Size(
				Math.round(size.width * ax),
				Math.round(size.height * ay)
			);
			let icon = null;
			try {
				icon = new BMapGL.Icon(url, iconSize, { anchor: anchorPx, imageSize: iconSize });
			} catch (e) {
				icon = new BMapGL.Icon(url, iconSize);
			}
			this.iconCache.set(key, icon);
			return icon;
		},
		/**
		 * 按「视口裁剪 + 数量上限」规划一个图层的渲染方式
		 *
		 * - 达到详细图标档位且视口内数量不超过上限 → detail（真实图标 + 名称）；
		 * - 其它情况（低缩放 / 视口内过密）→ cluster（聚合点 + 数量），
		 *   输出数量只与视口像素尺寸有关，与设备总数无关。
		 *
		 * @param {Array} entries 预计算渲染条目
		 * @param {number} zoom 当前缩放
		 * @param {number} detailZoom 切换详细图标的缩放阈值
		 * @param {number} maxDetail 详细图标的数量上限
		 * @param {Object|null} bounds 可视范围
		 * @returns {{mode:'detail'|'cluster', items:Array, clusters:Array}}
		 */
		planLayerRender(entries, zoom, detailZoom, maxDetail, bounds) {
			const list = entries || [];
			if (!list.length) return { mode: 'detail', items: [], clusters: [] };
			const area = bounds || this.getBounds();
			const visible = filterByViewport(list, area, zoom);
			if (zoom >= detailZoom && visible.length && visible.length <= maxDetail) {
				return { mode: 'detail', items: visible, clusters: [] };
			}
			if (!visible.length) return { mode: 'detail', items: [], clusters: [] };
			return { mode: 'cluster', items: [], clusters: this.buildClusters(visible, zoom, detailZoom, area) };
		},
		/** 视口内点位按当前缩放做网格聚合（带数量硬上限） */
		buildClusters(items, zoom, detailZoom, bounds) {
			const center = bounds ? { lat: (bounds.latMin + bounds.latMax) / 2 } : this.mpCenter;
			return clusterByGrid(items, {
				zoom,
				lat: center ? center.lat : 0,
				cellPx: clusterCellPx(zoom, detailZoom),
				maxClusters: MAX_CLUSTERS
			});
		},
		/**
		 * 生成详细标注物（状态图标）与名称标签
		 * @param {string} kind 图层 key
		 * @param {Array} entries 渲染条目（已按可视范围裁剪、并受数量上限保护）
		 * @param {number} mapType 点击分发类型（DeviceTypeUtil）
		 * @param {number} zoom 当前缩放级别
		 */
		addDetailMarkers(kind, entries, mapType, zoom) {
			const BMapGL = this.h5BMapGL;
			const list = entries || [];
			if (!BMapGL || !list.length) return;
			const showText = Number(zoom) >= ZOOM_TEXT && list.length <= MAX_LABELS;
			list.forEach((entry) => {
				const point = new BMapGL.Point(entry.lng, entry.lat);
				try {
					const marker = new BMapGL.Marker(point, {
						icon: this.getIcon(
							BMapGL,
							entry.icon,
							{ width: entry.width, height: entry.height },
							{ x: 0.5, y: 1 }
						)
					});
					marker.addEventListener('click', () => this.onMarkerClick(mapType, entry.source));
					this.h5Map.addOverlay(marker);
					this.overlays[kind].push(marker);

					if (!showText || !entry.name) return;
					// 名称标签：图标下方，水平居中
					const label = new BMapGL.Label(entry.name, {
						position: point,
						offset: new BMapGL.Size(-Math.round(labelPixelWidth(entry.name) / 2), LABEL_PIXEL_OFFSET_Y)
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
					label.addEventListener('click', () => this.onMarkerClick(mapType, entry.source));
					this.h5Map.addOverlay(label);
					this.overlays[kind].push(label);
				} catch (e) {
					console.error('渲染地图标注物失败', e);
				}
			});
		},
		/**
		 * 生成聚合点：一个聚合点代表 N 个设备，数量大于 1 时在上方显示数量标签
		 * @param {string} kind 图层 key
		 * @param {Array} clusters clusterByGrid 的结果
		 * @param {string} iconPath 聚合点图标
		 * @param {string} color 数量标签底色
		 * @param {number} mapType 点击分发类型
		 */
		addClusterMarkers(kind, clusters, iconPath, color, mapType) {
			const BMapGL = this.h5BMapGL;
			const list = clusters || [];
			if (!BMapGL || !list.length) return;
			const icon = this.getIcon(BMapGL, iconPath, POINT_ICON_SIZE, { x: 0.5, y: 0.5 });
			list.forEach((cluster) => {
				const point = new BMapGL.Point(Number(cluster.lng), Number(cluster.lat));
				try {
					const marker = new BMapGL.Marker(point, { icon });
					marker.addEventListener('click', () => this.onClusterClick(mapType, cluster));
					this.h5Map.addOverlay(marker);
					this.overlays[kind].push(marker);

					if (cluster.count <= 1) return;
					const text = cluster.count > 999 ? '999+' : String(cluster.count);
					// 数量标签：聚合点上方，水平居中
					const label = new BMapGL.Label(text, {
						position: point,
						offset: new BMapGL.Size(
							-Math.round(labelPixelWidth(text) / 2),
							-(POINT_ICON_SIZE.height + 6)
						)
					});
					label.setStyle({
						color: '#ffffff',
						backgroundColor: color,
						border: '1px solid #ffffff',
						borderRadius: '9px',
						padding: '0 5px',
						fontSize: '11px',
						lineHeight: '16px',
						height: '16px',
						whiteSpace: 'nowrap',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
						cursor: 'pointer',
						zIndex: '12'
					});
					label.addEventListener('click', () => this.onClusterClick(mapType, cluster));
					this.h5Map.addOverlay(label);
					this.overlays[kind].push(label);
				} catch (e) {
					console.warn('渲染聚合点失败', e);
				}
			});
		},
		/**
		 * 聚合点点击：单个设备直接打开弹窗，多个设备则放大一级查看
		 * @param {number} mapType 标注物类型
		 * @param {Object} cluster 聚合点
		 */
		onClusterClick(mapType, cluster) {
			if (!cluster) return;
			if (cluster.count === 1 && cluster.first && cluster.first.source) {
				this.onMarkerClick(mapType, cluster.first.source);
				return;
			}
			const lat = Number(cluster.lat);
			const lng = Number(cluster.lng);
			if (!isValidPoint(lat, lng)) return;
			if (isH5Platform() && this.h5Map && this.h5BMapGL) {
				const next = Math.min(this.getZoom() + 1, ZOOM_MAX_H5);
				this.mapScale = next;
				this.mpCenter = { lat, lng };
				try {
					this.h5Map.centerAndZoom(new this.h5BMapGL.Point(lng, lat), next);
				} catch (e) {
					console.warn('聚合点放大失败', e);
				}
				return;
			}
			this.zoomIntoCluster(lat, lng);
		},
		/* ---- 配电箱 ---- */
		/**
		 * 配电箱：zoom >= 18.2 且视口内数量不超过上限时显示详细图标（文档 §9.1），
		 * 否则显示聚合点（数量受视口几何上限约束，与配电箱总数无关）
		 */
		renderBoxLayer() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.clearOverlays('box');
			if (!this.isLayerChecked('box')) return;
			const zoom = this.getZoom();
			const plan = this.planLayerRender(
				this.getRenderEntries('box'), zoom, ZOOM_BOX_DETAIL, MAX_DETAIL_BOX, this.getBounds()
			);
			if (plan.mode === 'detail') {
				this.addDetailMarkers('box', plan.items, MAP_TYPE_BOX, zoom);
			} else {
				this.addClusterMarkers('box', plan.clusters, POINT_STAR_ICON, POINT_STAR_COLOR, MAP_TYPE_BOX);
			}
		},
		/* ---- 单灯·灯杆 ---- */
		/**
		 * 灯杆：zoom >= 18 且视口内数量不超过上限时显示详细图标（文档 §9.2），否则聚合；
		 * 同时应用左侧单灯状态筛选（预分组，不再逐个判定）
		 */
		renderPoleLayer() {
			this.scheduleMiniMarkers();
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.clearOverlays('pole');
			if (!this.isLayerChecked('pole')) return;
			const zoom = this.getZoom();
			const plan = this.planLayerRender(
				this.getRenderEntries('pole'), zoom, ZOOM_POLE_DETAIL, MAX_DETAIL_POLE, this.getBounds()
			);
			if (plan.mode === 'detail') {
				this.addDetailMarkers('pole', plan.items, MAP_TYPE_POLE, zoom);
			} else {
				this.addClusterMarkers('pole', plan.clusters, POINT_DOT_ICON, POINT_DOT_COLOR, MAP_TYPE_POLE);
			}
		},
		/* ---- 专变 ---- */
		renderSpecialLayer() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.clearOverlays('special');
			if (!this.isLayerChecked('special')) return;
			const zoom = this.getZoom();
			const plan = this.planLayerRender(
				this.getRenderEntries('special'), zoom, 0, MAX_DETAIL_OTHER, this.getBounds()
			);
			if (plan.mode === 'detail') {
				this.addDetailMarkers('special', plan.items, MAP_TYPE_SPECIAL, zoom);
			} else {
				this.addClusterMarkers('special', plan.clusters, POINT_STAR_ICON, POINT_STAR_COLOR, MAP_TYPE_SPECIAL);
			}
		},
		/* ---- 水浸 ---- */
		renderWaterLayer() {
			if (!isH5Platform() || !this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			this.clearOverlays('water');
			if (!this.isLayerChecked('water')) return;
			const zoom = this.getZoom();
			const plan = this.planLayerRender(
				this.getRenderEntries('water'), zoom, 0, MAX_DETAIL_OTHER, this.getBounds()
			);
			if (plan.mode === 'detail') {
				this.addDetailMarkers('water', plan.items, MAP_TYPE_WATER, zoom);
			} else {
				this.addClusterMarkers('water', plan.clusters, POINT_DOT_ICON, POINT_DOT_COLOR, MAP_TYPE_WATER);
			}
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
					lights: lights.map(light => wrapPoleLight(light, pole, data.stationId, data.stationName))
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
		/**
		 * 开灯时长换算：分钟 →「x年x个月x天x小时x分」
		 * 月固定按 30 天、年固定按 12 个月计算（与状态操作模块单灯详情保持一致）
		 * @param {number|string} minutes 开灯时长（分钟）
		 * @returns {string} 换算后的时长文案；无有效数值时返回 '-'
		 */
		calculateLightOnDuration(minutes) {
			if (minutes === null || minutes === undefined || minutes === '') return '-';
			const value = Number(minutes);
			if (!Number.isFinite(value)) return '-';

			const total = Math.floor(value);
			if (total <= 0) return '0分';

			const MIN_PER_HOUR = 60;                    // 1小时60分钟
			const MIN_PER_DAY = MIN_PER_HOUR * 24;      // 1天24小时
			const MIN_PER_MONTH = MIN_PER_DAY * 30;     // 1月固定30天
			const MIN_PER_YEAR = MIN_PER_MONTH * 12;    // 1年固定12月

			const years = Math.floor(total / MIN_PER_YEAR);
			let rest = total % MIN_PER_YEAR;

			const months = Math.floor(rest / MIN_PER_MONTH);
			rest %= MIN_PER_MONTH;

			const days = Math.floor(rest / MIN_PER_DAY);
			rest %= MIN_PER_DAY;

			const hours = Math.floor(rest / MIN_PER_HOUR);
			const mins = rest % MIN_PER_HOUR;

			const parts = [];
			if (years > 0) parts.push(years + '年');
			if (months > 0) parts.push(months + '个月');
			if (days > 0) parts.push(days + '天');
			if (hours > 0) parts.push(hours + '小时');
			if (mins > 0) parts.push(mins + '分');

			return parts.join('') || '0分';
		},
		/**
		 * 开灯时长换算显示
		 * @param {Object} [light] 当前选中的单灯（由 wrapPoleLight 生成）
		 */
		onPoleLightOnDuration(light) {
			const target = light || (this.poleDetail.lights || [])[0] || {};
			const content = this.calculateLightOnDuration(target.duration);
			uni.showModal({
				title: '开灯时长',
				content,
				showCancel: false
			});
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
		async onPoleOperation(light) {
			if (!light) {
				uni.showToast({ title: '该灯杆下没有单灯', icon: 'none' });
				return;
			}
			let stationId = light.stationId || this.stationId;
			let stationName = light.stationName || '';
			if (!stationId || !stationName) {
				uni.showLoading({ title: '加载中...', mask: true });
				try {
					if (!stationId) stationId = await fetchLightStationId(light.lightId);
					if (stationId && !stationName) {
						// 优先复用地图已加载的配电箱/专变站点数据，避免多一次请求
						const box = this.boxList.find(item => String(item.id) === String(stationId))
							|| this.specialList.find(item => String(item.id) === String(stationId));
						if (box) stationName = box.name || '';
					}
					if (stationId && !stationName) stationName = await fetchStationName(stationId);
				} finally {
					uni.hideLoading();
				}
			}
			if (!stationId) {
				uni.showToast({ title: '缺少站点信息', icon: 'none' });
				return;
			}
			this.poleDetailVisible = false;
			uni.navigateTo({
				url: `/pages/operation/components/stationTypes/stationTwo?stationId=${stationId}&boxName=${encodeURIComponent(stationName || '')}`
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
			// 坐标变化后渲染条目（含 GCJ 坐标）需要重算，保证小程序与 H5 都落到新位置
			this.prepareRenderData();
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
				// 只重绘被切换的图层，避免每次开关都把灯杆 / 配电箱全部重建
				this.renderLayerByKey(key);
			});
		},
		/** 单灯状态筛选（单选，再次点击取消筛选） */
		toggleStateFilter(index) {
			this.stateIndex = this.stateIndex === index ? -1 : index;
			this.$nextTick(() => {
				this.renderPoleLayer();
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
			// 小程序端：程序化移动后旧的 mpBounds 已失效，先置空，渲染时用中心点 + 缩放估算
			if (!isH5Platform()) {
				this.mpBounds = null;
				this.scheduleMiniMarkers();
				// 移动动画结束后回读真实视野：用真实可视范围修正估算出来的边界（中心点以本次指令为准）
				this.scheduleMiniViewSync(MINI_PROGRAMMATIC_SYNC_DELAY, true);
			}
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
			// 小程序端：更新 map 组件的 scale 属性（同步真实缩放缓存，避免连续点击时基于旧值计算）
			this.mapScale = zoom;
			this._viewScale = zoom;
			this.mpBounds = null;
			this.scheduleMiniMarkers();
			this.scheduleMiniViewSync(MINI_PROGRAMMATIC_SYNC_DELAY, true);
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
		/** 当前位置蓝点：H5 用圆形覆盖物绘制；小程序由 buildMiniMarkers 渲染 */
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

		/* ==================== 标注物渲染（小程序） ==================== */
		/** 窗口尺寸（懒加载缓存，用于估算可视范围） */
		getWindowSize() {
			if (this.windowSize) return this.windowSize;
			let width = 375;
			let height = 667;
			try {
				const info = uni.getSystemInfoSync();
				if (info && Number(info.windowWidth) > 0) width = Number(info.windowWidth);
				if (info && Number(info.windowHeight) > 0) height = Number(info.windowHeight);
			} catch (e) {
				// 忽略：使用默认尺寸
			}
			this.windowSize = { width, height };
			return this.windowSize;
		},
		/**
		 * 小程序可视范围（BD-09）
		 * 手势结束后用 map 返回的真实 region；程序化移动 / 首屏尚未拿到 region 时，
		 * 用「中心点 + 缩放 + 窗口像素」估算，避免拿不到范围就退化成全量渲染上万条标记。
		 */
		getMiniBounds(zoom) {
			if (this.mpBounds) return this.mpBounds;
			const size = this.getWindowSize();
			return estimateBounds(this.mpCenter, zoom, size.width, size.height);
		},
		/**
		 * 构建小程序地图标记
		 *
		 * 渲染策略与 H5 一致（planLayerRender）：
		 * - 视口裁剪：只渲染当前视野内的设备；
		 * - 分级渲染：达到详细档位且数量不超过上限 → 状态图标 + 名称；
		 * - 网格聚合：低缩放或视口内过密 → 少量聚合点 + 数量标签；
		 * 因此交给 <map> 的标记数量有上限，不会随设备总数（1 万+ 灯杆）线性增长。
		 *
		 * 注意：标记对象会整体 setData 到视图层，只放必要字段，
		 *      不要携带 source / 原始设备对象，否则无谓放大传输体积。
		 * @returns {Array} 小程序 markers
		 */
		buildMiniMarkers() {
			const markers = [];
			// 用真实缩放（手势后可能领先于绑定值），保证聚类档位与眼睛看到的一致
			const zoom = this.getZoom();
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

			const bounds = this.getMiniBounds(zoom);
			const showName = zoom >= ZOOM_TEXT;

			const pushDetail = (entry, mapType, zIndex) => {
				const marker = {
					id: markerId++,
					latitude: entry.gcjLat,
					longitude: entry.gcjLng,
					iconPath: entry.icon,
					width: entry.width,
					height: entry.height,
					anchor: { x: 0.5, y: 1 },
					zIndex,
					// 自定义字段：点击时用于反查设备（原生 map 会忽略未知字段）
					deviceId: entry.id,
					mapType
				};
				if (showName && entry.name) {
					marker.label = {
						content: entry.name,
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

			const pushClusters = (clusters, iconPath, color, mapType, zIndex) => {
				(clusters || []).forEach((cluster) => {
					const gcj = bd09ToGcj(cluster.lat, cluster.lng);
					const marker = {
						id: markerId++,
						latitude: gcj.lat,
						longitude: gcj.lng,
						iconPath,
						width: POINT_ICON_SIZE.width,
						height: POINT_ICON_SIZE.height,
						anchor: { x: 0.5, y: 0.5 },
						zIndex,
						mapType,
						clusterCount: cluster.count
					};
					if (cluster.count === 1 && cluster.first) {
						// 聚合点内只有一台设备：点击直接打开该设备弹窗
						marker.deviceId = cluster.first.id;
					} else {
						marker.clusterLat = cluster.lat;
						marker.clusterLng = cluster.lng;
						marker.label = {
							content: cluster.count > 999 ? '999+' : String(cluster.count),
							color: '#ffffff',
							fontSize: 11,
							bgColor: color,
							borderRadius: 9,
							padding: 3,
							textAlign: 'center',
							anchorX: -8,
							anchorY: -20
						};
					}
					markers.push(marker);
				});
			};

			const planOf = (kind, detailZoom, maxDetail) => this.planLayerRender(
				this.getRenderEntries(kind), zoom, detailZoom, maxDetail, bounds
			);

			// 配电箱：低缩放 / 过密用 star 聚合点，达到阈值后显示状态图标
			if (this.isLayerChecked('box')) {
				const plan = planOf('box', ZOOM_BOX_DETAIL, MAX_DETAIL_BOX);
				if (plan.mode === 'detail') plan.items.forEach(entry => pushDetail(entry, MAP_TYPE_BOX, 30));
				else pushClusters(plan.clusters, POINT_STAR_ICON, POINT_STAR_COLOR, MAP_TYPE_BOX, 20);
			}

			// 单灯·灯杆：低缩放 / 过密用 smallcircle 聚合点，达到阈值后显示状态图标
			if (this.isLayerChecked('pole')) {
				const plan = planOf('pole', ZOOM_POLE_DETAIL, MAX_DETAIL_POLE);
				if (plan.mode === 'detail') plan.items.forEach(entry => pushDetail(entry, MAP_TYPE_POLE, 40));
				else pushClusters(plan.clusters, POINT_DOT_ICON, POINT_DOT_COLOR, MAP_TYPE_POLE, 15);
			}

			// 专变 / 水浸：数量较少，视口裁剪后直接显示状态图标
			if (this.isLayerChecked('special')) {
				const plan = planOf('special', 0, MAX_DETAIL_OTHER);
				if (plan.mode === 'detail') plan.items.forEach(entry => pushDetail(entry, MAP_TYPE_SPECIAL, 35));
				else pushClusters(plan.clusters, POINT_STAR_ICON, POINT_STAR_COLOR, MAP_TYPE_SPECIAL, 25);
			}
			if (this.isLayerChecked('water')) {
				const plan = planOf('water', 0, MAX_DETAIL_OTHER);
				if (plan.mode === 'detail') plan.items.forEach(entry => pushDetail(entry, MAP_TYPE_WATER, 35));
				else pushClusters(plan.clusters, POINT_DOT_ICON, POINT_DOT_COLOR, MAP_TYPE_WATER, 25);
			}
			return markers;
		},
		/**
		 * 请求重建小程序标记（节流）
		 * 拖动 / 缩放过程中会连续触发，合并为一次 setData；H5 端直接忽略。
		 */
		scheduleMiniMarkers() {
			if (isH5Platform()) return;
			if (this.miniTimer) return;
			this.miniTimer = setTimeout(() => {
				this.miniTimer = null;
				if (this._unloaded) return;
				try {
					this.mpMarkers = this.buildMiniMarkers();
				} catch (e) {
					console.warn('构建地图标记失败', e);
				}
			}, MINI_MARKER_DELAY);
		},
		/** 聚合点放大一级（小程序端） */
		zoomIntoCluster(lat, lng) {
			if (!isValidPoint(lat, lng)) return;
			const next = Math.min(Math.max(this.getZoom() + 1, ZOOM_MIN_MP), ZOOM_MAX_MP);
			this.mapScale = next;
			this._viewScale = next;
			this.mpCenter = { lat: Number(lat), lng: Number(lng) };
			this.mpBounds = null;
			this.scheduleMiniMarkers();
			this.scheduleMiniViewSync(MINI_PROGRAMMATIC_SYNC_DELAY, true);
		},

		/* ==================== 小程序端地图事件 ==================== */
		/** 小程序标记点击：聚合点放大一级，单个设备按 id 反查并弹窗 */
		onMiniMarkerTap(e) {
			const markerId = Number(e && e.detail && e.detail.markerId);
			if (markerId === MY_LOCATION_MARKER_ID) return; // 当前位置蓝点不弹窗
			const marker = (this.mpMarkers || []).find(item => item.id === markerId);
			if (!marker) return;
			if (Number(marker.clusterCount) > 1) {
				this.zoomIntoCluster(marker.clusterLat, marker.clusterLng);
				return;
			}
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
		/**
		 * 小程序地图视野变化
		 *
		 * <map> 的 latitude / longitude / scale 是「受控属性」：页面一旦 setData 这三个字段，
		 * 原生地图就会按新值重新定位 / 缩放。而手势刚结束时地图往往还在惯性滑动或缩放动画中，
		 * regionchange 里的中心点、缩放只是那一刻的快照；此时立刻回写绑定值，等于让地图再应用
		 * 一次属性，表现为「滑到某处又往回退一点」「松手后地图自己放大 / 缩小」。
		 *
		 * 因此这里不在手势过程中写任何地图属性，只记录状态，等地图停稳后再回读真实视野对齐
		 * （见 scheduleMiniViewSync / commitMiniView）。
		 */
		onMiniRegionChange(e) {
			// 兼容不同基础库的事件结构：地图信息可能平铺在 detail 中，也可能再嵌套一层 detail；
			// causedBy / type 可能挂在事件顶层，也可能在 detail 内
			const raw = (e && e.detail) || {};
			const info = raw.detail || raw;
			const type = raw.type || info.type || '';
			const causedBy = (e && e.causedBy) || raw.causedBy || info.causedBy || '';

			// 手势开始：取消待执行的对齐，并让在途的异步查询结果作废（否则会把旧位置写回去）
			if (type === 'begin') {
				this.cancelMiniViewSync();
				return;
			}
			if (type && type !== 'end') return;

			// drag 拖动 / scale 缩放为用户手势；update 为接口调用（setData 经纬度、缩放等）
			if (causedBy === 'drag' || causedBy === 'scale') this.userMovedMap = true;

			// 只记录真实缩放（不 setData）：后续点「+ / -」、聚合点放大要基于它计算，不能用落后的绑定值
			const scale = Number(info.scale);
			if (Number.isFinite(scale) && scale > 0) this._viewScale = scale;

			// 自己 setData 引起的变化不再回环同步；部分基础库不带 causedBy，用时间窗口兜底
			if (causedBy === 'update') return;
			if (!causedBy && Date.now() < this._suppressRegionSyncUntil) return;

			// 只安排「停稳后对齐」，这里绝不改 latitude / longitude / scale
			this.scheduleMiniViewSync();
		},
		/**
		 * 延迟对齐小程序地图视野：等惯性滑动 / 缩放动画结束后再回写绑定值
		 * @param {number} delay 延迟（ms）
		 * @param {boolean} keepCenter 程序化移动（定位 / 搜索 / 聚合点放大）时传 true：
		 *        中心点以本次指令为准，只回读缩放与可视范围，避免移动动画未结束时把旧中心写回去
		 */
		scheduleMiniViewSync(delay = MINI_VIEW_SYNC_DELAY, keepCenter = false, attempt = 0) {
			if (isH5Platform() || this._unloaded) return;
			if (this.viewSyncTimer) clearTimeout(this.viewSyncTimer);
			// 让在途的旧查询立即失效：否则上一轮结果可能在新指令之后才回来，把地图写回旧位置
			this._viewSeq += 1;
			if (keepCenter) this._probeCenter = null;
			this.viewSyncTimer = setTimeout(() => {
				this.viewSyncTimer = null;
				this.commitMiniView(keepCenter, attempt);
			}, delay);
		},
		/** 取消待执行的视野对齐，并作废在途的视野查询 */
		cancelMiniViewSync() {
			if (this.viewSyncTimer) {
				clearTimeout(this.viewSyncTimer);
				this.viewSyncTimer = null;
			}
			this._probeCenter = null;
			this._viewSeq += 1;
		},
		/**
		 * 回读地图真实视野并写入绑定值（只在地图停稳后调用）
		 *
		 * 用地图上下文回读，而不是直接用 regionchange 的事件参数：事件里的 centerLocation /
		 * scale 是手势过程中的快照，惯性滑动结束后按快照回写，会把地图拉回快照位置，
		 * 也就是看到的「回退一点」。
		 */
		commitMiniView(keepCenter, attempt = 0) {
			if (this._unloaded) return;
			const ctx = this.ensureMapCtx();
			if (!ctx) return;

			const needCenter = !keepCenter;
			const seq = ++this._viewSeq;
			const view = { scale: 0, center: null, region: null };
			let pending = needCenter ? 3 : 2;
			let flushed = false;
			const flush = () => {
				if (flushed) return;
				flushed = true;
				// 期间开始了新手势 / 有新查询，丢弃这批结果
				if (this._unloaded || seq !== this._viewSeq) return;
				const center = view.center;
				/*
				 * 两次回读的中心点还在变化，说明地图仍处于惯性滑动中：此时写回绑定值会把地图
				 * 「拽停」并回退到快照位置，所以隔一会儿再回读，最多重试 3 次。
				 */
				if (needCenter && isValidPoint(center && center.lat, center && center.lng)
					&& this._probeCenter && attempt < 3 && this.centerMoved(this._probeCenter, center)) {
					this._probeCenter = center;
					this.scheduleMiniViewSync(200, false, attempt + 1);
					return;
				}
				if (center) this._probeCenter = center;
				this.applyMiniView(view, needCenter);
			};
			const done = () => {
				pending -= 1;
				if (pending <= 0) flush();
			};
			// 兜底：个别基础库某些接口不回调 fail，避免视野一直无法对齐
			setTimeout(flush, 600);

			try {
				ctx.getScale({
					success: (res) => { view.scale = Number(res && res.scale); done(); },
					fail: done
				});
				if (needCenter) {
					ctx.getCenterLocation({
						success: (res) => {
							view.center = { lat: Number(res && res.latitude), lng: Number(res && res.longitude) };
							done();
						},
						fail: done
					});
				}
				ctx.getRegion({
					success: (res) => { view.region = res; done(); },
					fail: done
				});
			} catch (err) {
				console.warn('读取地图视野失败', err);
				flush();
			}
		},
		/** 把地图真实视野写入绑定值，并按新视野重建标记（同一次 setData 提交） */
		applyMiniView(view, syncCenter) {
			const scale = Number(view && view.scale);
			if (Number.isFinite(scale) && scale > 0) {
				this._viewScale = scale;
				if (SYNC_MAP_SCALE && Math.abs(scale - Number(this.mapScale)) > 0.001) this.mapScale = scale;
			}
			const center = view && view.center;
			if (syncCenter && isValidPoint(center && center.lat, center && center.lng)) {
				const bd = gcjToBd09(center.lat, center.lng);
				const current = this.mpCenter || {};
				// 差异小于 1e-7 度（约 1cm）不写回，避免无意义的组件更新
				if (Math.abs(bd.lat - Number(current.lat)) > 1e-7 || Math.abs(bd.lng - Number(current.lng)) > 1e-7) {
					this.mpCenter = bd;
				}
			}
			// 回读失败时不能沿用旧范围，置空后按「中心点 + 缩放」估算，避免按旧视口裁剪出空白
			this.mpBounds = null;
			this.applyMiniRegion(view && view.region);
			// 本次回写会触发 causedBy=update 的 regionchange，短时间内不再响应，避免自激循环
			this._suppressRegionSyncUntil = Date.now() + 400;
			this.scheduleMiniMarkers();
		},
		/** 两次回读的中心点是否仍在变化（差异 < 1e-6 度，约 0.1m，视为已静止） */
		centerMoved(prev, next) {
			if (!prev || !next) return false;
			return Math.abs(Number(prev.lat) - Number(next.lat)) > 1e-6
				|| Math.abs(Number(prev.lng) - Number(next.lng)) > 1e-6;
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
		/**
		 * 小程序可视范围（GCJ-02）→ 百度坐标范围，供可视范围过滤使用
		 * 注意：部分基础库会返回全 0 / 反向的无效区域，这类结果必须丢弃，
		 *      否则会被当成「视口内没有任何设备」而渲染出空白地图。
		 */
		applyMiniRegion(region) {
			if (!region || !region.southwest || !region.northeast) return;
			const swLat = Number(region.southwest.latitude);
			const swLng = Number(region.southwest.longitude);
			const neLat = Number(region.northeast.latitude);
			const neLng = Number(region.northeast.longitude);
			if (!Number.isFinite(swLat) || !Number.isFinite(swLng) || !Number.isFinite(neLat) || !Number.isFinite(neLng)) return;
			if (Math.abs(swLat) < 0.0001 && Math.abs(swLng) < 0.0001) return;
			if (!(neLat > swLat) || !(neLng > swLng)) return;
			const southWest = gcjToBd09(swLat, swLng);
			const northEast = gcjToBd09(neLat, neLng);
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
		 * 搜索回传：定位到目标坐标
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
			this._viewScale = zoom;
			this.centerOn({ lat: Number(payload.lat), lng: Number(payload.lng) }, true);
			// H5 端 centerAndZoom 会触发 zoomend/moveend 完成重绘；小程序端由 renderAll 触发标记重建
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
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	margin-left: 20rpx;
	color: #ffffff;
	background-color: var(--color-primary, #3a7bf7);
	border-radius: 50%;
}

.search-btn:active {
	opacity: 0.85;
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
	background-color: var(--bg-card, #ffffff);
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
