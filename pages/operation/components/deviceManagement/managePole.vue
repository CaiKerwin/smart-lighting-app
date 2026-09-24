<template>
	<view :class="themeClass" class="page-container">
		<!-- ==================== 头部固定搜索栏 ==================== -->
		<view class="search-header">
			<!-- 搜索框 -->
			<view class="search-bar-wrap">
				<uni-search-bar
					v-model="keyword"
					:bg-color="searchBgColor"
					:cancel-button="'none'"
					:clear-button="'auto'"
					:radius="6"
					:text-color="searchTextColor"
					placeholder="输入灯杆名称"
					@clear="onSearch"
					@confirm="onSearch"
				/>
			</view>
			<view class="search-btn" @click="onSearch">搜索</view>
		</view>

		<!-- ==================== 灯杆卡片列表 ==================== -->
		<view v-if="poleList.length" class="card-list">
			<view v-for="item in poleList" :key="item.id" class="card">
				<!-- 左侧：灯杆信息 -->
				<view class="card-info">
					<view class="info-row">
						<text class="info-label">灯杆名称</text>
						<text class="info-value">{{ cellText(item.name) }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">灯杆类型</text>
						<text class="info-value">{{ cellText(item.poleType) }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">灯臂类型</text>
						<text class="info-value">{{ cellText(item.armType) }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">灯杆高度</text>
						<text class="info-value">{{ cellText(poleHeight(item)) }}m</text>
					</view>
					<view class="info-row">
						<text class="info-label">所属站点</text>
						<text class="info-value">{{ cellText(item.stationName) }}</text>
					</view>
				</view>

				<!-- 右侧：修改定位 / 灯杆图片图标 + 编辑 / 删除按钮 -->
				<view class="card-actions">
					<view class="icon-btn" @click="goModifyLocation(item)">
						<uni-icons :color="iconColor" size="22" type="location" />
					</view>
					<view class="icon-btn" @click="goPoleImages(item)">
						<uni-icons :color="iconColor" size="22" type="images" />
					</view>
					<view class="op-btn op-btn-edit" @click="openPolePopup(item)">编辑</view>
					<view class="op-btn op-btn-delete" @click="deletePole(item)">删除</view>
				</view>
			</view>
		</view>

		<!-- 空数据 / 加载中 -->
		<view v-else class="empty-tip">
			<text class="empty-text">{{ loading ? '加载中...' : '暂无灯杆数据' }}</text>
		</view>

		<!-- ==================== 底部固定区域：分页器 + 悬浮按钮 ==================== -->
		<view class="fixed-bottom">
			<Pagination
				:current="currentPage"
				:pageSize="pageSize"
				:pageSizeOptions="pageSizeOptions"
				:total="total"
				@change="onPageChange"
				@pageSizeChange="onPageSizeChange"
			/>

			<!-- 悬浮按钮：位于分页器上方右下角 -->
			<view class="fab-anchor">
				<!-- 新增灯杆 -->
				<view class="fab-btn" @click="openPolePopup">
					<uni-icons color="#ffffff" size="26" type="plusempty" />
				</view>
				<!-- 跳转灯杆位置界面 -->
				<view class="fab-btn fab-btn-pole" @click="goPoleLocation">
					<image class="fab-icon" mode="aspectFit" src="/static/common/pole.png" />
				</view>
			</view>
		</view>

		<!-- ==================== 新增 / 编辑灯杆弹窗（同一个组件、同一个接口） ==================== -->
		<PoleInfo ref="poleInfo" :station-id="stationId" @saved="onPoleSaved" />
	</view>
</template>

<script>
import Pagination from "@/components/pagination.vue";
import PoleInfo from "./components/poleInfo.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import {EVENT_LOCATION_RESULT, POS_TYPE_POLE} from "@/utils/map";

export default {
	name: 'managePole',
	components: {
		Pagination,
		PoleInfo
	},
	data() {
		return {
			// 入口参数
			stationId: 0,
			groupId: 0,
			boxName: '',

			// 头部搜索关键字（灯杆名称）
			keyword: '',

			// 灯杆列表数据
			poleList: [],
			loading: false,

			// 分页相关
			currentPage: 1,  // 当前页码
			pageSize: 10,    // 每页条数
			total: 0,        // 总条数
			pageSizeOptions: [10, 20, 50, 100]
		};
	},
	computed: {
		// 图标颜色：uni-icons 的 color 只能传具体色值，这里按主题取色
		iconColor() {
			return this.isDarkMode ? '#c3ccdb' : '#4a4a4a';
		},
		// uni-search-bar 的背景色 / 文字色通过行内样式生效，只能传具体色值，这里按主题取色
		searchBgColor() {
			return this.isDarkMode ? '#252c3d' : '#f2f4f8'; // --bg-soft
		},
		searchTextColor() {
			return this.isDarkMode ? '#e8ecf4' : '#333333'; // --text-primary
		}
	},
	onLoad(options) {
		const opts = options || {};
		// 获取传入的站点ID（0 表示所有站点）
		this.stationId = Number(opts.stationId) || 0;
		this.groupId = Number(opts.groupId) || 0;
		try {
			this.boxName = opts.boxName ? decodeURIComponent(opts.boxName) : '';
		} catch (e) {
			this.boxName = opts.boxName || '';
		}

		// 灯杆定位修改结果回传（showAndEditLocation 页面 SetPos 成功后同步本地坐标）
		uni.$on(EVENT_LOCATION_RESULT, this.onLocationResult);

		// 获取站点的灯杆列表
		this.getStationPoleList();
	},
	onUnload() {
		uni.$off(EVENT_LOCATION_RESULT, this.onLocationResult);
	},
	onPullDownRefresh() {
		this.getStationPoleList();
	},
	methods: {
		/**
		 * 获取灯杆列表（支持按灯杆名称搜索 + 分页）
		 *
		 * 请求参数
		 * {
		 *   "groupId": 0,
		 *   "stationId": 1880,
		 *   "name": "",
		 *   "poleType": "",
		 *   "armType": "",
		 *   "heightMin": 0,
		 *   "heightMax": 100,
		 *   "latMin": 0,
		 *   "latMax": 90,
		 *   "lngMin": 0,
		 *   "lngMax": 180,
		 *   "size": 20,
		 *   "index": 1
		 * }
		 *
		 * 返回结果
		 * {
		 *   "count": 1,
		 *   "list": [
		 *     {
		 *       "id": 277335,
		 *       "name": "142",
		 *       "stationId": 1880,
		 *       "stationName": "122-CAT1",
		 *       "poleType": "",
		 *       "armType": "",
		 *       "hight": 10,
		 *       "meteria": null,
		 *       "code": "e5d3ebcfff4344e6b5c8f4d82dfd1b93",
		 *       "guidCode": "e5d3ebcfff4344e6b5c8f4d82dfd1b93",
		 *       "lat": 22.770683,
		 *       "lng": 113.828068
		 *     }
		 *    ]
		 *   }
		 */
		getStationPoleList() {
			this.loading = true;
			request({
				url: '/station/config/QueryPoleByFilter',
				method: 'POST',
				data: {
					groupId: this.groupId,      // 设备分组ID，0表示所有设备
					stationId: this.stationId,  // 站点ID，0表示所有站点
					// 按列过滤：仅按灯杆名称搜索，其余条件取默认值
					name: this.keyword,
					poleType: '',
					armType: '',
					heightMin: 0,
					heightMax: 100,
					latMin: 0,
					latMax: 90,
					lngMin: 0,
					lngMax: 180,
					// 分页参数
					size: this.pageSize,      // 每页数量
					index: this.currentPage   // 当前页码
				}
			}).then(res => {
				this.loading = false;

				const payload = res && res.data;
				const data = payload ? this.parseResponseData(payload.data) : null;
				const isArray = Array.isArray(data);
				const list = isArray ? data : ((data && Array.isArray(data.list)) ? data.list : []);
				const rawCount = isArray ? NaN : Number(data && data.count);
				this.poleList = list;                                              // 当前页灯杆列表
				this.total = Number.isFinite(rawCount) ? rawCount : list.length;   // 总条数（用于分页）

				// 当前页超出最大页时（例如搜索后数据变少），回退到最后一页
				const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize));
				if (this.currentPage > maxPage) {
					this.currentPage = maxPage;
					this.getStationPoleList();
				}
			}).catch(err => {
				this.loading = false;
				this.total = 0;
				this.poleList = [];
				console.error('获取站点灯杆列表失败', err && err.message);
				uni.showToast({ title: '获取灯杆列表失败', icon: 'none' });
			}).finally(() => {
				// 停止下拉刷新动画
				setTimeout(() => {
					uni.stopPullDownRefresh();
				}, 800);
			});
		},

		/**
		 * 解析响应 data：服务端为 Base64(JSON)，兼容直接返回对象的情况
		 * @param {String|Object} data
		 * @returns {Object|null} 灯杆列表数据
		 */
		parseResponseData(data) {
			if (!data) return null;
			if (typeof data !== 'string') return data;
			try {
				return JSON.parse(base64Decode(data));
			} catch (e) {
				console.error('解析灯杆列表数据失败', e && e.message);
				return null;
			}
		},

		// 单元格内容：空值统一显示为 -
		cellText(value) {
			if (value === null || value === undefined || value === '') {
				return '-';
			}
			return value;
		},

		// 灯杆高度：接口字段为 hight（兼容 height）
		poleHeight(item) {
			if (!item) return '';
			return (item.hight === null || item.hight === undefined) ? item.height : item.hight;
		},

		/**
		 * 搜索：按灯杆名称重新查询，从第一页开始
		 * @param {Object} [e] uni-search-bar 的 confirm / clear 事件（e.value 为输入框内容）
		 */
		onSearch(e) {
			// confirm / clear 事件回传 { value }；点击「搜索」按钮时无该字段，直接用 v-model 绑定的值
			if (e && typeof e === 'object' && e.value !== undefined && e.value !== null) {
				this.keyword = String(e.value);
			}
			this.keyword = (this.keyword || '').trim();
			this.currentPage = 1;
			this.getStationPoleList();
		},

		// 页码变化
		onPageChange(current) {
			if (current === this.currentPage) return;
			this.currentPage = current;
			this.getStationPoleList();
		},

		// 每页条数变化
		onPageSizeChange(size) {
			if (size === this.pageSize) return;
			this.pageSize = size;
			this.currentPage = 1; // 每页条数变化后从第一页开始
			this.getStationPoleList();
		},

		/**
		 * 定位图标：跳转修改定位界面（showAndEditLocation 已实现）
		 * @param {Object} item 灯杆对象
		 */
		goModifyLocation(item) {
			const poleId = item && item.id;
			if (poleId === null || poleId === undefined || poleId === '') {
				uni.showToast({ title: '未获取到灯杆信息', icon: 'none' });
				return;
			}
			const query = [
				'mode=edit',
				`type=${POS_TYPE_POLE}`,
				`id=${poleId}`,
				`name=${encodeURIComponent((item && item.name) || '')}`,
				`lat=${item && item.lat !== null && item.lat !== undefined ? item.lat : ''}`,
				`lng=${item && item.lng !== null && item.lng !== undefined ? item.lng : ''}`
			].join('&');
			uni.navigateTo({ url: `/pages/operation/components/showAndEditLocation?${query}` });
		},

		// 定位修改结果回传：同步列表中该灯杆的坐标
		onLocationResult(payload) {
			if (!payload || !payload.saved) return;
			if (Number(payload.type) !== POS_TYPE_POLE) return;
			const target = (this.poleList || []).find(item => String(item.id) === String(payload.id));
			if (!target) return;
			target.lat = payload.lat;
			target.lng = payload.lng;
		},

		/**
		 * 图片图标：跳转灯杆图片界面
		 * @param {Object} item 灯杆对象
		 */
		goPoleImages(item) {
			if (!item || item.id === null || item.id === undefined || item.id === '') {
				uni.showToast({ title: '未获取到灯杆信息', icon: 'none' });
				return;
			}
			uni.navigateTo({
				url: `/pages/operation/components/deviceManagement/managePoleImages?poleId=${item.id}`
			});
		},
		/**
		 * 打开新增 / 编辑灯杆弹窗
		 * 说明：悬浮按钮的点击事件会作为参数传入，这里只认带 id 的灯杆对象
		 * @param {Object} [item] 灯杆对象，传了为编辑，不传为新增
		 */
		openPolePopup(item) {
			const pole = (item && item.id !== undefined && item.id !== null) ? item : null;
			if (this.$refs.poleInfo) {
				this.$refs.poleInfo.open(pole);
			}
		},
		/**
		 * 灯杆保存成功（新增 / 编辑共用接口 /station/config/SaveLampPole）
		 * @param {Object} payload { mode: 'add'|'edit', id }
		 */
		onPoleSaved(payload) {
			// 新增的灯杆不一定在当前页，回到第一页查询
			if (payload && payload.mode === 'add') {
				this.currentPage = 1;
			}
			this.getStationPoleList();
		},
		// 删除灯杆
		deletePole(item) {
			uni.showModal({
				title: '删除灯杆',
				content: `确定要删除 ${item.name || '该灯杆'} 吗？`,
				success: (res) => {
					if (res.confirm) {
						request({
							url: '/station/config/DeleteDevice',
							method: 'POST',
							data: {
								list: [item.id] // 一个一个删
							}
						}).then(res =>{
							console.log(base64Decode(res.data.data))
							if (res.data.code === 0 || res.statusCode === 200) {
								uni.showToast({ title: '删除成功', icon: 'success' });
							} else {
								uni.showToast({ title: '删除失败', icon: 'none' });
							}
						}).catch(err =>{
							uni.showToast({ title: '删除失败', icon: 'none' });
							console.error('删除灯杆失败', err.message);
						}).finally(() =>{
							this.getStationPoleList();
						})
					}
				}
			});
		},

		// 悬浮按钮：跳转灯杆位置界面
		goPoleLocation() {
			if (this.stationId === null || this.stationId === undefined || this.stationId === '') {
				uni.showToast({ title: '缺少站点信息', icon: 'none' });
				return;
			}
			const params = [
				`stationId=${this.stationId}`,
				`groupId=${this.groupId || 0}`,
				`boxName=${encodeURIComponent(this.boxName || '')}`
			];
			uni.navigateTo({ url: `/pages/operation/components/poleLocation?${params.join('&')}` });
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 页面容器 ====================
 * 头部搜索栏与底部分页器固定，仅中间的灯杆卡片列表随页面滚动
 */
.page-container {
	position: relative;
	min-height: 100vh;
	background-color: var(--bg-page, #f5f6fa);
	/* 上：让开固定搜索栏（头部高度 140rpx + 20rpx 间距，需与 .search-header 的 height 保持一致） */
	/* 下：固定底栏（分页器）+ 悬浮按钮占位 */
	padding: 160rpx 20rpx calc(380rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	transition: background-color 0.3s ease;
}

/* ==================== 头部固定搜索栏 ==================== */
.search-header {
	position: fixed;
	left: 0;
	right: 0;
	/* H5 端 position: fixed 以整个浏览器视口为准，需让开原生导航栏高度（小程序端取不到时为 0） */
	top: var(--window-top, 0px);
	z-index: 20;
	display: flex;
	align-items: center;
	/* 固定高度：与 .page-container 的 padding-top 对应，避免搜索栏高度随组件自身边距变化 */
	height: 140rpx;
	padding: 0 20rpx;
	background-color: var(--bg-page, #f5f6fa);
	box-sizing: border-box;
	transition: background-color 0.3s ease;
}

/* uni-search-bar 容器：占满搜索按钮以外的剩余宽度 */
.search-bar-wrap {
	flex: 1;
	min-width: 0;

	/* 穿透修改 uni-search-bar 内部样式：去掉组件自带边距，与右侧「搜索」按钮对齐 */
	::v-deep .uni-searchbar {
		padding: 0;

		.uni-searchbar__box {
			height: 80rpx;
		}

		.uni-searchbar__box-search-input,
		.uni-searchbar__text-placeholder {
			font-size: 28rpx;
		}
	}
}

.search-btn {
	flex: none;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 160rpx;
	height: 80rpx;
	margin-left: 20rpx;
	background-color: var(--color-primary, #4285f4);
	color: #ffffff;
	font-size: 30rpx;
	border-radius: 12rpx;
}

/* ==================== 灯杆卡片列表 ==================== */
.card-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.card {
	display: flex;
	align-items: center;
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 12rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.08));
	box-sizing: border-box;
	transition: background-color 0.3s ease;
}

/* 左侧信息区：名称 / 高度 / 所属站点 / 灯杆类型 / 灯臂类型 */
.card-info {
	flex: 1;
	min-width: 0;
}

.info-row {
	display: flex;
	align-items: flex-start;
	margin-bottom: 16rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.info-label {
	flex: none;
	width: 132rpx;
	font-size: 26rpx;
	line-height: 40rpx;
	color: var(--text-secondary, #666666);
}

.info-value {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	line-height: 40rpx;
	color: var(--text-primary, #333333);
	word-break: break-all;
}

/* 右侧操作区：修改定位 / 灯杆图片图标 + 编辑 / 删除按钮 */
.card-actions {
	flex: none;
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-left: 16rpx;
}

.icon-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
}

.op-btn {
	padding: 10rpx 18rpx;
	color: #ffffff;
	font-size: 26rpx;
	line-height: 1.2;
	border-radius: 8rpx;
	&.op-btn-edit {
		background-color: var(--color-primary, #4285f4);
	}
	&.op-btn-delete {
		background-color: var(--color-danger, #ff4d4f);
	}
}

/* 空数据 / 加载中 */
.empty-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 400rpx;
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	transition: background-color 0.3s ease;

	.empty-text {
		font-size: 26rpx;
		color: var(--text-quaternary, #999999);
	}
}

/* ==================== 底部固定区域（分页器 + 悬浮按钮） ==================== */
.fixed-bottom {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	background-color: var(--bg-page, #f5f6fa);
	padding: 10rpx 20rpx calc(20rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	transition: background-color 0.3s ease;

	/* 分页器自带外边距，去掉后底栏更紧凑 */
	::v-deep .work-order-pagination {
		margin: 0;
		padding: 10rpx 0;
	}
}

/* 悬浮按钮锚点：绝对定位脱离文档流，始终悬在分页器上方右下角 */
.fab-anchor {
	position: absolute;
	right: 32rpx;
	bottom: calc(100% + 20rpx);
	z-index: 3;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}

.fab-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	background-color: var(--color-primary, #4285f4);
	box-shadow: 0 8rpx 24rpx rgba(66, 133, 244, 0.4);
}

/* 灯杆位置按钮：白底圆形，衬托绿色灯杆图标 */
.fab-btn-pole {
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 8rpx 24rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.16));
}

.fab-icon {
	width: 48rpx;
	height: 48rpx;
}
</style>
