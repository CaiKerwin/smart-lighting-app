<template>
	<view :class="themeClass" class="page">
		<!-- ==================== 搜索栏（H5 浮于地图上方，小程序为普通头部行） ==================== -->
		<view class="search-bar">
			<view class="search-box">
				<uni-icons color="#909399" size="18" type="search" />
				<input
					:value="keyword"
					class="search-input"
					confirm-type="search"
					placeholder="搜索"
					placeholder-class="search-placeholder"
					@confirm="onSearchConfirm"
					@input="onKeywordInput"
				/>
				<uni-icons v-if="keyword" color="#c0c4cc" size="18" type="clear" @click="onClearKeyword" />
			</view>
			<!-- 实景地图 / 二维地图切换 -->
			<view class="map-type-switch" @click="toggleMapType">
				<view :class="satellite ? 'thumb-2d' : 'thumb-satellite'" class="map-type-thumb"></view>
				<text class="map-type-label">{{ satellite ? '二维地图' : '实景地图' }}</text>
			</view>
		</view>

		<!-- ==================== 搜索结果 ==================== -->
		<scroll-view
			v-if="searchResults.length"
			:style="{ height: searchPanelHeight }"
			class="search-panel"
			scroll-y
		>
			<view
				v-for="(item, index) in searchResults"
				:key="index"
				class="search-item"
				@click="onSelectResult(item)"
			>
				<view class="search-item-title">{{ item.title }}</view>
				<view class="search-item-address">{{ item.address || '暂无地址信息' }}</view>
			</view>
		</scroll-view>

		<!-- ==================== 地图 ==================== -->
		<view class="map-area">
			<!-- H5：百度地图 JSAPI GL 容器 -->
			<!-- #ifdef H5 -->
			<view id="deviceMapCanvas" class="map-canvas"></view>
			<!-- #endif -->

			<!-- 小程序端：内置 map 组件 + 百度地图 Web 服务 API 检索（坐标已转 GCJ-02） -->
			<!-- #ifndef H5 -->
			<map
				:enable-satellite="satellite"
				:latitude="mpCenterGcj.lat"
				:longitude="mpCenterGcj.lng"
				:markers="mpMarkers"
				:scale="scale"
				:show-location="false"
				class="map-canvas"
				@tap="onMiniMapTap"
			/>
			<!-- #endif -->

			<!-- 地图加载中 / 加载失败 -->
			<view v-if="mapStatusText" class="map-state" @click="onMapStateTap">
				<text class="map-state-text">{{ mapStatusText }}</text>
				<text v-if="mapError" class="map-state-retry">点击重试</text>
			</view>

			<!-- 回到当前位置 -->
			<!-- #ifdef H5 -->
			<view class="locate-btn" @click="locateCurrent">
				<image :src="locateIcon" class="locate-icon" />
			</view>
			<!-- #endif -->
			<!-- #ifndef H5 -->
			<cover-view class="locate-btn" @click="locateCurrent">
				<cover-image :src="locateIcon" class="locate-icon" />
			</cover-view>
			<!-- #endif -->
		</view>

		<!-- ==================== 底部表单 ==================== -->
		<view class="panel">
			<!-- 经纬度 -->
			<view class="coord-row">
				<text class="coord-label">经度</text>
				<text class="coord-value">{{ lngText }}</text>
				<text class="coord-label">纬度</text>
				<text class="coord-value">{{ latText }}</text>
			</view>

			<!-- 具体位置地址 -->
			<view class="address-box">
				<view class="address-icon">
					<uni-icons :color="primaryColor" size="20" type="location" />
				</view>
				<text :class="{ 'is-placeholder': !address }" class="address-text">
					{{ address || addressPlaceholder }}
				</text>
			</view>

			<!-- 操作按钮 -->
			<view class="button-row">
				<button v-if="!isViewMode" class="action-btn cancel" @click="onCancel">取消</button>
				<button :disabled="submitting" class="action-btn confirm" @click="onConfirm">{{ confirmText }}</button>
			</view>
		</view>
	</view>
</template>

<script>
import { request } from '@/utils/request';
import { base64Decode } from '@/utils/common';
import {
	isH5Platform,
	loadBMapGL,
	searchPlace,
	reverseGeocode,
	getCurrentPoint,
	resolveMapType,
	bd09ToGcj,
	gcjToBd09,
	DEFAULT_CITY,
	DEFAULT_CENTER,
	DEFAULT_ZOOM,
	POS_TYPE_POLE,
	EVENT_LOCATION_RESULT,
	PIN_ICON,
	DOT_ICON,
	LOCATE_ICON
} from '@/utils/map';

// 页面模式
const MODE_EDIT = 'edit'; // 修改定位：点选 / 拖动标记后调用 SetPos 保存
const MODE_VIEW = 'view'; // 显示定位：只读查看
const MODE_PICK = 'pick'; // 地图选点：只回传经纬度（添加设备时随 AddDevice 提交，见文档 §13）

// 地图容器 id（H5）
const MAP_DOM_ID = 'deviceMapCanvas';

export default {
	data() {
		return {
			mode: MODE_EDIT,
			posType: POS_TYPE_POLE, // 0 配电箱 / 14 灯杆
			deviceId: '',
			deviceName: '',
			token: '',              // 调用方传入的请求标识，回传结果时原样带回（用于调用方配对）

			point: { lat: 0, lng: 0 }, // 当前拾取点（BD-09，提交给后端）
			hasPoint: false,
			myLocation: null,          // 当前定位（BD-09，仅展示蓝点）
			address: '',               // 当前位置地址
			addressComponents: null,   // 逆地理结果（添加设备时随 AddDevice 提交）
			city: DEFAULT_CITY,        // 检索城市（跟随逆地理结果）

			keyword: '',
			searchResults: [],
			searchTimer: null,
			searchSeq: 0,

			satellite: false,          // false 二维地图 / true 实景（卫星）地图
			scale: DEFAULT_ZOOM,
			mpCenter: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }, // 小程序地图中心（BD-09）

			mapLoading: false,
			mapError: '',
			mapReady: false,
			submitting: false,

			pinIcon: PIN_ICON,
			dotIcon: DOT_ICON,
			locateIcon: LOCATE_ICON
		};
	},
	computed: {
		// 定位 / 地址图标颜色
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#3a7bf7';
		},
		isViewMode() {
			return this.mode === MODE_VIEW;
		},
		confirmText() {
			return this.isViewMode ? '关闭' : '确定';
		},
		addressPlaceholder() {
			return this.isViewMode ? '暂无位置信息' : '点击地图，拾取坐标信息.';
		},
		lngText() {
			return this.hasPoint ? Number(this.point.lng).toFixed(5) : '--';
		},
		latText() {
			return this.hasPoint ? Number(this.point.lat).toFixed(5) : '--';
		},
		// 地图状态提示文案（加载中 / 加载失败）
		mapStatusText() {
			if (this.mapError) return this.mapError;
			if (this.mapLoading) return '地图加载中…';
			return '';
		},
		// 搜索结果列表高度：最多展示 5 条，超出滚动
		searchPanelHeight() {
			const rows = Math.min(this.searchResults.length, 5) || 1;
			return rows * 96 + 'rpx';
		},
		// 小程序 map 组件中心点（GCJ-02）
		mpCenterGcj() {
			return bd09ToGcj(this.mpCenter.lat, this.mpCenter.lng);
		},
		// 小程序 map 组件标记（GCJ-02）
		mpMarkers() {
			const markers = [];
			if (this.hasPoint) {
				const pt = bd09ToGcj(this.point.lat, this.point.lng);
				markers.push({
					id: 1,
					longitude: pt.lng,
					latitude: pt.lat,
					iconPath: this.pinIcon,
					width: 26,
					height: 34,
					anchor: { x: 0.5, y: 1 },
					zIndex: 20
				});
			}
			if (this.myLocation) {
				const pt = bd09ToGcj(this.myLocation.lat, this.myLocation.lng);
				markers.push({
					id: 2,
					longitude: pt.lng,
					latitude: pt.lat,
					iconPath: this.dotIcon,
					width: 18,
					height: 18,
					anchor: { x: 0.5, y: 0.5 },
					zIndex: 10
				});
			}
			return markers;
		}
	},
	onLoad(options) {
		this.initParams(options || {});
		this.applyNavTitle();
	},
	mounted() {
		// H5 需要等 DOM 就绪后再初始化百度地图
		this.$nextTick(() => {
			this.initMap();
		});
		this.loadMyLocation();
	},
	onUnload() {
		this._unloaded = true;
		if (this.searchTimer) {
			clearTimeout(this.searchTimer);
			this.searchTimer = null;
		}
		this.destroyMap();
	},
	methods: {
		/* ==================== 初始化 ==================== */
		/**
		 * 解析入口参数
		 * @param {Object} options 路由参数：mode / type / id / name / lat / lng
		 */
		initParams(options) {
			const mode = options.mode;
			this.mode = (mode === MODE_VIEW || mode === MODE_PICK) ? mode : MODE_EDIT;

			// type：0 配电箱（id 传站点 id）/ 14 灯杆（id 传灯杆 id）
			const type = Number(options.type);
			this.posType = Number.isFinite(type) ? type : POS_TYPE_POLE;

			this.deviceId = options.id !== undefined && options.id !== null ? String(options.id) : '';
			this.token = options.token !== undefined && options.token !== null ? String(options.token) : '';
			try {
				this.deviceName = options.name ? decodeURIComponent(options.name) : '';
			} catch (e) {
				this.deviceName = options.name || '';
			}

			// 已有坐标（BD-09）：修改 / 查看定位时作为初始标记点
			const lat = Number(options.lat);
			const lng = Number(options.lng);
			if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
				this.point = { lat, lng };
				this.hasPoint = true;
				this.mpCenter = { lat, lng };
			}
		},
		applyNavTitle() {
			const titles = {
				[MODE_EDIT]: '修改定位',
				[MODE_VIEW]: '查看定位',
				[MODE_PICK]: '选择位置'
			};
			uni.setNavigationBarTitle({ title: titles[this.mode] || '修改定位' });
		},
		/** 初始化地图：H5 创建百度地图实例；小程序由 <map> 组件渲染，仅需拉取地址 */
		async initMap() {
			if (!isH5Platform()) {
				if (this.hasPoint) this.loadAddress();
				return;
			}
			this._unloaded = false;
			this.mapLoading = true;
			this.mapError = '';
			try {
				const BMapGL = await loadBMapGL();
				const container = document.getElementById(MAP_DOM_ID);
				if (!container) throw new Error('地图容器未就绪');
				// 页面切换动画期间容器可能尚未完成布局，BMapGL 在 0 尺寸容器上初始化会失败
				await this.waitForContainer(container);
				// BMapGL 依赖 WebGL 渲染，浏览器禁用 WebGL 时 SDK 内部会抛
				// “Cannot read properties of null (reading 'coordType')” 之类难以定位的错误，先显式检测
				if (!this.isWebGLAvailable()) {
					throw new Error('当前浏览器未启用 WebGL，无法加载百度地图，请开启浏览器硬件加速或更换 Chrome/Edge 后重试');
				}
				const center = this.hasPoint ? this.point : (this.myLocation || DEFAULT_CENTER);

				// 1. 创建地图实例（只传最少参数，避免部分 SDK 版本对构造选项处理异常）
				let map;
				try {
					map = new BMapGL.Map(container);
				} catch (e) {
					throw new Error('创建地图实例失败：' + this.errText(e));
				}
				this.h5Map = map;
				this.h5BMapGL = BMapGL;

				// 2. 关闭底图自带点击处理，避免与取点逻辑冲突（设置失败不影响使用）
				try {
					if (typeof map.setOptions === 'function') {
						map.setOptions({ enableMapClick: false });
					}
				} catch (e) {
					console.warn('设置地图选项失败', e);
				}

				// 3. 设置中心点与缩放级别
				try {
					map.centerAndZoom(new BMapGL.Point(center.lng, center.lat), this.scale);
				} catch (e) {
					throw new Error('设置地图中心点失败：' + this.errText(e));
				}

				// 4. 交互与事件绑定
				try {
					map.enableScrollWheelZoom(true);
					map.addEventListener('click', (e) => this.onMapClick(e));
				} catch (e) {
					console.warn('绑定地图事件失败', e);
				}

				this.mapReady = true;
				this.mapLoading = false;
				if (this.hasPoint) {
					this.updateMarker();
					this.loadAddress();
				}
				if (this.myLocation) this.updateMyLocationOverlay();
			} catch (err) {
				// 清理半初始化的地图实例，保证“点击重试”时从头创建，避免在同一容器上重复建图
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
		/** 浏览器 WebGL 可用性检测（BMapGL 使用 WebGL 渲染，不可用时会报难定位的 SDK 内部错误） */
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
			this.h5Marker = null;
			this.h5Dot = null;
			this.h5DotRing = null;
			this.mapReady = false;
		},
		/** 拉取当前定位（蓝点展示；无设备坐标时作为默认拾取点） */
		loadMyLocation() {
			getCurrentPoint().then((pos) => {
				if (!pos) return;
				this.myLocation = pos;
				this.updateMyLocationOverlay();
				// 文档 §13：经纬度来源优先级 —— 当前定位（默认）→ 地图选点 → 灯杆列表选中
				if (!this.hasPoint && !this.isViewMode) {
					this.setPoint(pos.lat, pos.lng, { recenter: true });
				}
			}).catch((err) => {
				console.warn('获取当前定位失败', err && err.message);
			});
		},

		/* ==================== 地图交互 ==================== */
		/** H5：点击地图拾取坐标 */
		onMapClick(e) {
			if (this.isViewMode) return;
			const latlng = e && (e.latlng || e.latLng);
			let lat = latlng ? Number(latlng.lat) : NaN;
			let lng = latlng ? Number(latlng.lng !== undefined ? latlng.lng : latlng.lon) : NaN;
			// 兜底：部分版本事件只带像素坐标
			if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && e && e.pixel && this.h5Map) {
				try {
					const pt = this.h5Map.pixelToPoint(e.pixel);
					if (pt) {
						lat = Number(pt.lat);
						lng = Number(pt.lng);
					}
				} catch (err) {
					console.warn('像素坐标转换失败', err);
				}
			}
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
			this.setPoint(lat, lng);
		},
		/** 小程序：点击地图拾取坐标（返回 GCJ-02，转为 BD-09） */
		onMiniMapTap(e) {
			if (this.isViewMode) return;
			const detail = (e && e.detail) || {};
			const lat = Number(detail.latitude);
			const lng = Number(detail.longitude);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
			const bd = gcjToBd09(lat, lng);
			this.setPoint(bd.lat, bd.lng);
		},
		/**
		 * 更新当前拾取点
		 * @param {number} lat 纬度（BD-09）
		 * @param {number} lng 经度（BD-09）
		 * @param {{address?:string,recenter?:boolean,skipAddress?:boolean}} [options]
		 */
		setPoint(lat, lng, options = {}) {
			this.point = { lat, lng };
			this.hasPoint = true;
			if (options.address) this.address = options.address;
			this.updateMarker();
			if (options.recenter) this.recenterMap({ lat, lng });
			if (!options.skipAddress) this.loadAddress();
		},
		/** 更新标记（H5 用图层覆盖物，小程序由 markers 计算属性渲染） */
		updateMarker() {
			if (!this.mapReady || !this.h5Map || !this.h5BMapGL) return;
			const BMapGL = this.h5BMapGL;
			const point = new BMapGL.Point(this.point.lng, this.point.lat);
			try {
				if (!this.h5Marker) {
					this.h5Marker = new BMapGL.Marker(point);
					if (!this.isViewMode && typeof this.h5Marker.enableDragging === 'function') {
						this.h5Marker.enableDragging();
						this.h5Marker.addEventListener('dragend', () => this.onMarkerDragEnd());
					}
					this.h5Map.addOverlay(this.h5Marker);
				} else {
					this.h5Marker.setPosition(point);
				}
			} catch (e) {
				console.error('更新地图标记失败', e);
			}
		},
		/** 拖动标记结束：以拖动后的位置为准 */
		onMarkerDragEnd() {
			if (!this.h5Marker || typeof this.h5Marker.getPosition !== 'function') return;
			const pos = this.h5Marker.getPosition();
			if (!pos) return;
			this.setPoint(Number(pos.lat), Number(pos.lng));
		},
		/** 当前定位蓝点（H5 用圆形覆盖物绘制） */
		updateMyLocationOverlay() {
			if (!this.mapReady || !this.h5Map || !this.h5BMapGL || !this.myLocation) return;
			const BMapGL = this.h5BMapGL;
			const point = new BMapGL.Point(this.myLocation.lng, this.myLocation.lat);
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
		/** 回到当前位置（不改变已拾取的坐标） */
		locateCurrent() {
			if (this.myLocation) {
				this.recenterMap(this.myLocation);
				return;
			}
			getCurrentPoint().then((pos) => {
				this.myLocation = pos;
				this.updateMyLocationOverlay();
				this.recenterMap(pos);
			}).catch((err) => {
				console.error('获取当前位置失败', err && err.message);
				uni.showToast({ title: '获取当前位置失败，请检查定位权限', icon: 'none' });
			});
		},
		/**
		 * 地图居中
		 * @param {{lat:number,lng:number}} point BD-09 坐标
		 */
		recenterMap(point) {
			if (!point) return;
			if (isH5Platform() && this.h5Map && this.h5BMapGL) {
				this.h5Map.centerAndZoom(new this.h5BMapGL.Point(point.lng, point.lat), this.scale);
			}
			this.mpCenter = { lat: point.lat, lng: point.lng };
		},
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

		/* ==================== 地址解析 ==================== */
		/** 逆地理编码：坐标 → 地址（顺带带回 addressComponents，供添加设备提交） */
		loadAddress() {
			if (!this.hasPoint) return;
			const lat = this.point.lat;
			const lng = this.point.lng;
			reverseGeocode(lat, lng).then((res) => {
				// 防止异步返回顺序错乱：坐标已变化则丢弃
				if (!res || this.point.lat !== lat || this.point.lng !== lng) return;
				if (res.address) this.address = res.address;
				if (res.components) {
					this.addressComponents = res.components;
					if (res.components.city) this.city = res.components.city;
				}
			}).catch((err) => {
				console.warn('逆地址解析失败', err && err.message);
			});
		},

		/* ==================== 搜索 ==================== */
		onKeywordInput(e) {
			this.keyword = (e && e.detail ? e.detail.value : '') || '';
			this.scheduleSearch();
		},
		/** 输入防抖搜索（2 个字符以上） */
		scheduleSearch() {
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
			const keyword = String(this.keyword || '').trim();
			if (keyword.length < 2) {
				this.searchResults = [];
				return;
			}
			this.searchTimer = setTimeout(() => {
				this.searchTimer = null;
				this.runSearch();
			}, 450);
		},
		onSearchConfirm() {
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
			this.runSearch();
		},
		/** 调用百度地图检索接口 */
		runSearch() {
			const keyword = String(this.keyword || '').trim();
			if (!keyword) {
				this.searchResults = [];
				return;
			}
			const seq = ++this.searchSeq;
			searchPlace(keyword, { city: this.city || DEFAULT_CITY }).then((list) => {
				if (seq !== this.searchSeq) return; // 只接受最后一次检索结果
				this.searchResults = list || [];
				if (!this.searchResults.length) {
					uni.showToast({ title: '未找到相关位置', icon: 'none' });
				}
			}).catch((err) => {
				if (seq !== this.searchSeq) return;
				this.searchResults = [];
				console.error('搜索位置失败', err && err.message);
				uni.showToast({ title: (err && err.message) || '搜索失败', icon: 'none' });
			});
		},
		onSelectResult(item) {
			this.searchResults = [];
			this.keyword = item.title || '';
			// 查看模式：只移动视野，不改变设备标记与经纬度
			if (this.isViewMode) {
				this.recenterMap({ lat: item.lat, lng: item.lng });
				return;
			}
			this.setPoint(item.lat, item.lng, {
				address: item.address || item.title || '',
				recenter: true
			});
		},
		onClearKeyword() {
			this.keyword = '';
			this.searchResults = [];
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
		},

		/* ==================== 底部操作 ==================== */
		onCancel() {
			this.goBack();
		},
		onConfirm() {
			// 显示定位：只读查看，按钮仅用于返回
			if (this.isViewMode) {
				this.goBack();
				return;
			}
			if (!this.hasPoint) {
				uni.showToast({ title: '请在地图上选择位置', icon: 'none' });
				return;
			}
			// 地图选点（添加设备流程）：只回传经纬度，随 AddDevice 一起提交，不调用 SetPos
			if (this.mode === MODE_PICK) {
				this.emitResult(false);
				this.goBack();
				return;
			}
			this.submitSetPos();
		},
		/** 修改定位：调用 /station/gis/SetPos 保存经纬度 */
		submitSetPos() {
			if (this.submitting) return;
			if (!this.deviceId) {
				uni.showToast({ title: '缺少设备信息，无法修改定位', icon: 'none' });
				return;
			}
			this.submitting = true;
			uni.showLoading({ title: '保存中...', mask: true });
			request({
				url: '/station/gis/SetPos',
				method: 'POST',
				data: {
					type: this.posType, // 0 配电箱 / 14 灯杆
					id: this.deviceId,
					lat: this.point.lat, // 百度坐标（bd09ll）
					lng: this.point.lng
				}
			}).then((res) => {
				uni.hideLoading();
				this.submitting = false;
				const body = res && res.data;
				if (body && body.code !== undefined && body.code !== null && body.code !== 0) {
					uni.showToast({ title: this.decodeErrorMessage(body) || '定位修改失败', icon: 'none' });
					return;
				}
				uni.showToast({ title: '定位修改成功', icon: 'success' });
				this.emitResult(true);
				setTimeout(() => this.goBack(), 600);
			}).catch((err) => {
				uni.hideLoading();
				this.submitting = false;
				console.error('修改定位失败', err && err.message);
				uni.showToast({ title: '定位修改失败', icon: 'none' });
			});
		},
		/**
		 * 回传结果给上一页（页面间通信，对应 Android 的 COORDINATE / SetPos 结果事件）
		 * @param {boolean} saved 是否已通过 SetPos 保存
		 */
		emitResult(saved) {
			uni.$emit(EVENT_LOCATION_RESULT, {
				mode: this.mode,
				type: this.posType,
				id: this.deviceId,
				name: this.deviceName,
				token: this.token,
				lat: this.point.lat,
				lng: this.point.lng,
				address: this.address,
				components: this.addressComponents,
				saved: !!saved
			});
		},
		goBack() {
			uni.navigateBack({ delta: 1 });
		},
		/** 解析接口业务错误信息 */
		decodeErrorMessage(payload) {
			let msg = payload.msg || payload.message || '';
			const data = payload.data;
			if (typeof data === 'string' && data) {
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
	}
};
</script>

<style lang="scss" scoped>
/* ==================== 布局 ====================
 * 小程序端：搜索栏 / 结果列表 / 地图 / 表单为纵向排列，地图为 <map> 原生组件，避免被原生层遮挡；
 * H5 端：地图铺满全屏，搜索栏与底部表单浮于地图之上（见下方 H5 条件编译）。
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
	overflow: hidden;
	background-color: #e8eef6;
}

.map-canvas {
	width: 100%;
	height: 100%;
}

/* ==================== 搜索栏 ==================== */
.search-bar {
	position: relative;
	z-index: 20;
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	background-color: var(--bg-card, #ffffff);
}

.search-box {
	flex: 1;
	display: flex;
	align-items: center;
	height: 76rpx;
	padding: 0 24rpx;
	background-color: var(--bg-soft, #f2f4f8);
	border-radius: 38rpx;
}

.search-input {
	flex: 1;
	height: 76rpx;
	margin: 0 12rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.search-placeholder {
	font-size: 28rpx;
	color: var(--text-quaternary, #999999);
}

/* 实景地图 / 二维地图切换 */
.map-type-switch {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 108rpx;
	height: 96rpx;
	margin-left: 16rpx;
	border-radius: 16rpx;
	background-color: var(--bg-soft, #f2f4f8);
}

.map-type-thumb {
	width: 62rpx;
	height: 42rpx;
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
	margin-top: 6rpx;
	font-size: 18rpx;
	line-height: 1.2;
	color: var(--text-secondary, #666666);
}

/* ==================== 搜索结果 ==================== */
.search-panel {
	position: relative;
	z-index: 19;
	flex-shrink: 0;
	margin: 0 24rpx;
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.search-item {
	padding: 20rpx 24rpx;
	border-bottom: 1rpx solid var(--border-color, #f0f0f0);
}

.search-item:last-child {
	border-bottom: none;
}

.search-item-title {
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.search-item-address {
	margin-top: 6rpx;
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
}

/* ==================== 地图状态提示 ==================== */
.map-state {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
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

/* ==================== 定位按钮 ==================== */
.locate-btn {
	position: absolute;
	right: 24rpx;
	bottom: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 84rpx;
	height: 84rpx;
	border-radius: 50%;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.16);
}

.locate-icon {
	width: 40rpx;
	height: 40rpx;
}

/* ==================== 底部表单 ==================== */
.panel {
	position: relative;
	z-index: 15;
	flex-shrink: 0;
	padding: 28rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
	background-color: var(--bg-card, #ffffff);
	border-radius: 28rpx 28rpx 0 0;
	box-shadow: 0 -6rpx 24rpx rgba(0, 0, 0, 0.08);
}

.coord-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 4rpx 8rpx 24rpx;
}

.coord-label {
	width: 132rpx;
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

.coord-value {
	flex: 1;
	font-size: 30rpx;
	color: var(--text-primary, #333333);
	text-align: center;
}

.address-box {
	display: flex;
	align-items: center;
	min-height: 88rpx;
	padding: 16rpx 24rpx;
	background-color: var(--bg-soft, #f2f4f8);
	border-radius: 16rpx;
}

.address-icon {
	display: flex;
	align-items: center;
	margin-right: 16rpx;
}

.address-text {
	flex: 1;
	font-size: 26rpx;
	line-height: 36rpx;
	color: var(--text-primary, #333333);
}

.address-text.is-placeholder {
	color: var(--text-quaternary, #999999);
}

.button-row {
	display: flex;
	align-items: center;
	margin-top: 28rpx;
}

.action-btn {
	flex: 1;
	height: 84rpx;
	line-height: 84rpx;
	padding: 0;
	font-size: 30rpx;
	border-radius: 12rpx;
	border: none;
}

.action-btn::after {
	border: none;
}

.action-btn.cancel {
	margin-right: 24rpx;
	background-color: var(--bg-soft, #f2f4f8);
	color: var(--text-secondary, #666666);
}

.action-btn.confirm {
	background-color: var(--color-primary, #4285f4);
	color: #ffffff;
}

/* ==================== H5：地图全屏，搜索栏与底部表单浮于地图之上 ====================
 * H5 端 100vh / position:fixed 以整个浏览器视口为准，需用 --window-top 让开原生导航栏高度
 * （--window-top 在 H5 为导航栏高度，小程序端为 0，取不到时回退 0）
 */
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

.search-bar {
	position: absolute;
	top: 24rpx;
	left: 24rpx;
	right: 24rpx;
	padding: 0;
	background-color: transparent;
}

.search-box {
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

.map-type-switch {
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

.search-panel {
	position: absolute;
	top: 124rpx;
	left: 24rpx;
	right: 24rpx;
	margin: 0;
}

/* 底部表单为浮层，定位按钮上移避免被遮挡 */
.locate-btn {
	bottom: 360rpx;
}

.panel {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 16;
	border-radius: 28rpx 28rpx 0 0;
}
/* #endif */
</style>
