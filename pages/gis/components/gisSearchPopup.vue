<!-- GIS 地图搜索弹窗 -->
<template>
	<view v-if="visible" class="search-mask" @click="onMaskClick">
		<view class="search-dialog" @click.stop>
			<!-- 标题 -->
			<view class="dialog-header">
				<text class="dialog-title">{{ dialogTitle }}</text>
				<uni-icons :color="iconColor" class="close-icon" size="26" type="closeempty" @click="onClose" />
			</view>

			<!-- 下划线标签 -->
			<view class="tab-bar">
				<text
					v-for="tab in tabs"
					:key="tab.key"
					:class="{ active: currentTab === tab.key }"
					class="tab-item"
					@click="switchTab(tab.key)"
				>
					{{ tab.name }}
				</text>
			</view>

			<!-- 搜索输入框 -->
			<view class="input-box">
				<input
					:placeholder="placeholder"
					:value="keyword"
					class="search-input"
					confirm-type="search"
					placeholder-class="input-placeholder"
					type="text"
					@confirm="onConfirm"
					@input="onInput"
				/>
				<uni-icons v-if="keyword" :color="iconColor" size="18" type="clear" @click="onClearKeyword" />
			</view>

			<!-- 结果区 -->
			<scroll-view class="result-area" scroll-y>
				<!-- 加载中 -->
				<view v-if="loading" class="result-tip">查询中...</view>

				<!-- 单灯：所属灯杆 -->
				<block v-else-if="currentTab === TAB_LIGHT">
					<view v-if="lightPole" class="pole-row">
						<text class="pole-label">所属灯杆</text>
						<text class="pole-name">{{ lightPole.name || '-' }}</text>
						<text class="pole-link" @click="viewLightOnMap">在地图中查看</text>
					</view>
					<view v-else-if="lightTip" class="result-tip">{{ lightTip }}</view>
				</block>

				<!-- 道路 / 配电箱：结果列表 -->
				<block v-else>
					<view v-if="!resultList.length" class="result-tip">
						{{ keyword ? '未找到相关位置' : (currentTab === TAB_BOX ? '暂无配电箱数据' : '') }}
					</view>
					<view
						v-for="(item, index) in resultList"
						:key="index"
						class="result-item"
						@click="onSelectResult(item, index)"
					>
						<text v-if="currentTab === TAB_BOX" class="result-index">{{ index + 1 }}</text>
						<view class="result-content">
							<text class="result-title">{{ item.title }}</text>
							<text v-if="item.address" class="result-address">{{ item.address }}</text>
						</view>
					</view>
				</block>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { searchPlace, DEFAULT_CITY } from '@/utils/map';
import {
	ZOOM_SEARCH_ROAD,
	ZOOM_SEARCH_DEVICE,
	SEARCH_TYPE_ROAD,
	SEARCH_TYPE_BOX,
	SEARCH_TYPE_POLE,
	parseResponseData,
	decodeErrorMessage,
	isBusinessError,
	fetchPoleByLight,
	isValidPoint
} from '@/utils/gis';

// 标签 key（与搜索方式一一对应）
const TAB_ROAD = 'road';
const TAB_BOX = 'box';
const TAB_LIGHT = 'light';
// 单灯通信 ID 位数（8 位，大写字母 + 数字）
const LIGHT_CODE_LENGTH = 8;

export default {
	name: 'GisSearchPopup',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		// 配电箱列表（QuerySimple 中 supplyMode=1 的标注物）
		boxes: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			TAB_ROAD,
			TAB_BOX,
			TAB_LIGHT,
			tabs: [
				{ key: TAB_ROAD, name: '道路' },
				{ key: TAB_BOX, name: '配电箱' },
				{ key: TAB_LIGHT, name: '单灯' }
			],
			currentTab: TAB_ROAD,
			keyword: '',
			loading: false,
			// 道路检索结果
			roadResults: [],
			searchTimer: null,
			searchSeq: 0,
			// 单灯搜索：所属灯杆 + 提示文案
			lightPole: null,
			lightTip: '',
			lightSeq: 0
		};
	},
	computed: {
		// 弹窗标题（与原型一致：搜索道路 / 搜索配电柜 / 查找设备）
		dialogTitle() {
			if (this.currentTab === TAB_BOX) return '搜索配电柜';
			if (this.currentTab === TAB_LIGHT) return '查找设备';
			return '搜索道路';
		},
		placeholder() {
			if (this.currentTab === TAB_BOX) return '输入配电柜名称';
			if (this.currentTab === TAB_LIGHT) return '输入设备ID';
			return '输入道路名';
		},
		// 道路：百度检索结果；配电箱：本地按名称过滤
		resultList() {
			if (this.currentTab === TAB_ROAD) return this.roadResults;
			if (this.currentTab === TAB_BOX) {
				const keyword = String(this.keyword || '').trim();
				const list = (this.boxes || []).map(item => ({
					title: item.name || '-',
					address: '',
					lat: Number(item.lat),
					lng: Number(item.lng),
					id: item.id
				}));
				if (!keyword) return list;
				return list.filter(item => String(item.title).indexOf(keyword) >= 0);
			}
			return [];
		},
		iconColor() {
			return this.isDarkMode ? '#8b94a8' : '#999999';
		}
	},
	watch: {
		// 打开弹窗时回到「道路」标签并清空上一次的结果
		visible(val) {
			if (val) this.resetAll();
		}
	},
	methods: {
		/* ==================== 通用 ==================== */
		resetAll() {
			this.currentTab = TAB_ROAD;
			this.keyword = '';
			this.roadResults = [];
			this.lightPole = null;
			this.lightTip = '';
			this.loading = false;
			this.clearSearchTimer();
		},
		switchTab(key) {
			if (this.currentTab === key) return;
			this.currentTab = key;
			// 切换标签清空输入与结果，避免不同搜索方式相互干扰
			this.keyword = '';
			this.roadResults = [];
			this.lightPole = null;
			this.lightTip = '';
			this.clearSearchTimer();
		},
		clearSearchTimer() {
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
		},
		onMaskClick() {
			this.onClose();
		},
		onClose() {
			this.clearSearchTimer();
			this.$emit('close');
		},
		onInput(e) {
			const value = (e && e.detail ? e.detail.value : '') || '';
			this.keyword = value;
			if (this.currentTab === TAB_ROAD) {
				this.scheduleRoadSearch();
			} else if (this.currentTab === TAB_LIGHT) {
				this.onLightInput(value);
			}
		},
		onConfirm() {
			if (this.currentTab === TAB_ROAD) {
				this.clearSearchTimer();
				this.runRoadSearch();
			}
		},
		onClearKeyword() {
			this.keyword = '';
			this.roadResults = [];
			this.lightPole = null;
			this.lightTip = '';
			this.clearSearchTimer();
		},

		/* ==================== 道路：百度 POI 联想检索 ==================== */
		scheduleRoadSearch() {
			this.clearSearchTimer();
			const keyword = String(this.keyword || '').trim();
			if (keyword.length < 2) {
				this.roadResults = [];
				return;
			}
			this.searchTimer = setTimeout(() => {
				this.searchTimer = null;
				this.runRoadSearch();
			}, 450);
		},
		runRoadSearch() {
			const keyword = String(this.keyword || '').trim();
			if (!keyword) {
				this.roadResults = [];
				return;
			}
			const seq = ++this.searchSeq;
			this.loading = true;
			searchPlace(keyword, { city: DEFAULT_CITY }).then((list) => {
				if (seq !== this.searchSeq) return; // 只接受最后一次检索结果
				this.roadResults = (list || []).map(item => ({
					title: item.title || '-',
					address: item.address || '',
					lat: Number(item.lat),
					lng: Number(item.lng)
				}));
			}).catch((err) => {
				if (seq !== this.searchSeq) return;
				this.roadResults = [];
				console.error('搜索道路失败', err && err.message);
				uni.showToast({ title: (err && err.message) || '搜索失败', icon: 'none' });
			}).finally(() => {
				if (seq === this.searchSeq) this.loading = false;
			});
		},

		/* ==================== 单灯：8 位通信 ID 查所属灯杆 ==================== */
		onLightInput(value) {
			const code = String(value || '').trim();
			this.lightPole = null;
			this.lightTip = '';
			if (code.length !== LIGHT_CODE_LENGTH) return;
			this.queryLightPole(code);
		},
		queryLightPole(code) {
			const seq = ++this.lightSeq;
			this.loading = true;
			fetchPoleByLight(code).then((res) => {
				if (seq !== this.lightSeq) return;
				const payload = res && res.data;
				if (isBusinessError(payload)) {
					const msg = decodeErrorMessage(payload);
					// 业务失败（多为未查到灯杆）→ 按文档提示「未绑定灯杆」
					this.lightTip = msg && msg.indexOf('未查到') === -1 ? msg : '未绑定灯杆';
					return;
				}
				const data = parseResponseData(res) || {};
				// 兼容返回灯杆对象 / 包一层 pole / 空结果三种结构
				const pole = data.pole || data;
				const name = pole.name || data.poleName || '';
				const lat = Number(pole.lat !== undefined ? pole.lat : data.lat);
				const lng = Number(pole.lng !== undefined ? pole.lng : data.lng);
				if (!name && !isValidPoint(lat, lng)) {
					this.lightTip = '未绑定灯杆';
					return;
				}
				this.lightPole = {
					id: pole.id !== undefined ? pole.id : data.poleId,
					name: name || '-',
					lat,
					lng
				};
			}).catch((err) => {
				if (seq !== this.lightSeq) return;
				this.lightTip = '未绑定灯杆';
				console.error('查询所属灯杆失败', err && err.message);
			}).finally(() => {
				if (seq === this.lightSeq) this.loading = false;
			});
		},
		/** 在地图中查看：回传灯杆坐标（type=3，zoom=21） */
		viewLightOnMap() {
			if (!this.lightPole) {
				const code = String(this.keyword || '').trim();
				uni.showToast({ title: code.length === LIGHT_CODE_LENGTH ? '未绑定灯杆' : '请输入8位', icon: 'none' });
				return;
			}
			if (!isValidPoint(this.lightPole.lat, this.lightPole.lng)) {
				uni.showToast({ title: '未发现灯杆', icon: 'none' });
				return;
			}
			this.emitSelect(this.lightPole.lat, this.lightPole.lng, ZOOM_SEARCH_DEVICE, SEARCH_TYPE_POLE);
		},

		/* ==================== 结果选择 ==================== */
		/**
		 * 选中搜索结果 → 回传坐标
		 * @param {Object} item 结果项
		 */
		onSelectResult(item) {
			if (this.currentTab === TAB_ROAD) {
				if (!isValidPoint(item.lat, item.lng)) return;
				this.keyword = item.title;
				this.roadResults = [];
				this.emitSelect(item.lat, item.lng, ZOOM_SEARCH_ROAD, SEARCH_TYPE_ROAD);
				return;
			}
			if (this.currentTab === TAB_BOX) {
				if (!isValidPoint(item.lat, item.lng)) {
					uni.showToast({ title: '该配电箱未配置定位', icon: 'none' });
					return;
				}
				this.emitSelect(item.lat, item.lng, ZOOM_SEARCH_DEVICE, SEARCH_TYPE_BOX);
			}
		},
		/**
		 * 回传「在地图中查看」事件
		 * @param {number} lat 纬度（BD-09）
		 * @param {number} lng 经度（BD-09）
		 * @param {number} zoom 目标缩放级别
		 * @param {number} type 1 道路 / 2 配电箱 / 3 灯杆（对应 ShowMarkOnMapBean.type）
		 */
		emitSelect(lat, lng, zoom, type) {
			this.$emit('select', {
				lat: Number(lat),
				lng: Number(lng),
				zoom: Number(zoom),
				type: Number(type)
			});
			this.$emit('close');
		}
	}
};
</script>

<style lang="scss" scoped>
/* ==================== 遮罩与弹窗 ==================== */
.search-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--popup-mask, rgba(0, 0, 0, 0.5));
}

.search-dialog {
	display: flex;
	flex-direction: column;
	width: 92%;
	height: 76vh;
	padding: 30rpx 30rpx 24rpx;
	box-sizing: border-box;
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	overflow: hidden;
}

/* ==================== 标题 ==================== */
.dialog-header {
	position: relative;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding-bottom: 20rpx;
}

.dialog-title {
	font-size: 34rpx;
	font-weight: 600;
	color: var(--text-primary, #1d2129);
}

.close-icon {
	position: absolute;
	right: 0;
	top: 0;
}

/* ==================== 下划线标签（与状态操作界面一致） ==================== */
.tab-bar {
	flex-shrink: 0;
	display: flex;
	justify-content: space-evenly;
	margin-bottom: 24rpx;
}

.tab-item {
	padding: 0 24rpx 8rpx;
	font-size: 32rpx;
	font-weight: bold;
	color: var(--text-quaternary, #999999);
	border-bottom: 4rpx solid transparent;
	transition: all 0.3s;
}

.tab-item.active {
	color: #3880fc;
	border-bottom-color: #3880fc;
}

/* ==================== 输入框 ==================== */
.input-box {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	height: 80rpx;
	padding: 0 24rpx;
	background-color: var(--bg-soft, #f2f4f8);
	border-radius: 12rpx;
}

.search-input {
	flex: 1;
	height: 80rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.input-placeholder {
	font-size: 28rpx;
	color: var(--text-quaternary, #999999);
}

/* ==================== 结果区 ==================== */
.result-area {
	flex: 1;
	min-height: 0;
	margin-top: 12rpx;
}

.result-tip {
	padding: 60rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}

.result-item {
	display: flex;
	align-items: center;
	padding: 24rpx 6rpx;
	border-bottom: 1rpx solid var(--border-color, #f0f0f0);
}

.result-item:last-child {
	border-bottom: none;
}

.result-index {
	width: 60rpx;
	font-size: 28rpx;
	color: var(--text-secondary, #666666);
	text-align: center;
	flex-shrink: 0;
}

.result-content {
	flex: 1;
	min-width: 0;
}

.result-title {
	display: block;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	word-break: break-all;
}

.result-address {
	display: block;
	margin-top: 6rpx;
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
	word-break: break-all;
}

/* ==================== 单灯：所属灯杆 ==================== */
.pole-row {
	display: flex;
	align-items: center;
	padding: 30rpx 6rpx;
}

.pole-label {
	font-size: 28rpx;
	color: var(--text-secondary, #666666);
	flex-shrink: 0;
}

.pole-name {
	flex: 1;
	min-width: 0;
	margin-left: 16rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	word-break: break-all;
}

.pole-link {
	flex-shrink: 0;
	margin-left: 16rpx;
	font-size: 28rpx;
	color: var(--color-primary, #3a7bf7);
}
</style>
