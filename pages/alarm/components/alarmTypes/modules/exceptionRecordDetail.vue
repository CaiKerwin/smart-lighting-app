<template>
	<view :class="themeClass" class="exception-record-detail-container">
		<!-- 当前记录对应的报警时间 -->
		<view class="filter-card">
			<image class="filter-icon" mode="aspectFit" src="/static/alarm/power.png" />
			<view class="filter-info">
				<view class="filter-title">{{ recordName || '线路供电异常报警明细' }}</view>
				<view class="filter-time">
					<text class="filter-label">报警时间</text>
					<text class="filter-value">{{ displayTime }}</text>
				</view>
			</view>
		</view>

		<!-- 报警信息列表 -->
		<scroll-view :scroll-top="scrollTop" :show-scrollbar="false" class="alarm-exception-list" scroll-y>
			<view class="list-inner">
				<view v-for="(item, index) in pagedAlarmData" :key="index" class="alarm-card" @click="onItemClick(item)">
					<!-- 头部 -->
					<view class="card-header">
						<image class="card-icon" mode="aspectFit" src="/static/alarm/power.png" />
						<view class="header-info">
							<view class="card-title">{{ item.stationName }}</view>
							<view class="card-time">{{ item.alarmTime }}</view>
						</view>
						<view class="card-total">
							<text class="total-label">单灯总数</text>
							<text class="total-num">{{ item.total }}</text>
						</view>
					</view>

					<!-- 数据区域 -->
					<view class="card-body">
						<!-- 左列 -->
						<view class="column">
							<view class="row-item">
								<text class="label">离线数</text>
								<text class="num">{{ item.offline }}</text>
							</view>
							<view class="row-item">
								<text class="label">过压数</text>
								<text class="num">{{ item.overVoltage }}</text>
							</view>
						</view>
						<!-- 中列 -->
						<view class="column">
							<view class="row-item">
								<text class="label">离线异常</text>
								<text class="num">{{ item.offlineAbnormal }}</text>
							</view>
							<view class="row-item">
								<text class="label">灭灯异常</text>
								<text class="num">{{ item.lightOffAbnormal }}</text>
							</view>
						</view>
						<!-- 右列 -->
						<view class="column">
							<view class="row-item">
								<text class="label">灭灯数</text>
								<text class="num">{{ item.lightOff }}</text>
							</view>
							<view class="row-item">
								<text class="label">欠压数</text>
								<text class="num">{{ item.underVoltage }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 加载中 -->
				<view v-if="loading" class="loading-tip">
					<text class="loading-text">加载中...</text>
				</view>

				<!-- 空状态 -->
				<view v-if="!loading && exceptionAlarmData.length === 0" class="empty-tip">
					<image class="empty-icon" mode="aspectFit" src="/static/alarm/power.png" />
					<text class="empty-text">{{ emptyText }}</text>
				</view>
			</view>
		</scroll-view>

		<!-- ==================== 分页器 ==================== -->
		<view v-if="total > 0" class="pagination-wrap">
			<Pagination
				:current="currentPage"
				:pageSize="pageSize"
				:total="total"
				@change="onPageChange"
				@pageSizeChange="onPageSizeChange"
			/>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import Pagination from "@/components/pagination.vue";

/**
 * 安全解码 URL 参数
 * @param {string} value - 待解码的参数值
 * @returns {string} 解码后的字符串
 */
function safeDecode(value) {
	if (!value) return '';
	try {
		return decodeURIComponent(value);
	} catch (e) {
		return String(value);
	}
}

/**
 * 解析接口返回的 data：兼容 base64 编码的 JSON 字符串与直接返回的对象/数组
 * @param {string|Array|Object} data - 接口返回的 data 字段
 * @returns {Array|Object} 解析后的数据
 */
function parseResponseData(data) {
	if (typeof data !== 'string') return data;
	try {
		return JSON.parse(base64Decode(data));
	} catch (e) {
		// 兼容未做 base64 编码、直接返回 JSON 字符串的情况
		return JSON.parse(data);
	}
}

export default {
	components: {
		Pagination
	},
	data() {
		return {
			// 传入的记录 id（查询条件）
			recordId: '',
			// 传入的报警时间（仅用于展示）
			createTime: '',
			// 传入的记录名称
			recordName: '',

			// 该记录对应的线路供电异常报警明细
			exceptionAlarmData: [],

			loading: false,

			// 卡片列表滚动位置（切换分页后回到顶部）
			scrollTop: 0,

			// 分页相关
			currentPage: 1,  // 当前页码
			pageSize: 10,    // 每页条数
			total: 0         // 总条数
		};
	},
	computed: {
		// 当前页显示的数据（前端分页）
		pagedAlarmData() {
			const start = (this.currentPage - 1) * this.pageSize;
			return this.exceptionAlarmData.slice(start, start + this.pageSize);
		},
		// 头部展示的报警时间（列表页传入的记录时间）
		displayTime() {
			return this.createTime || '--';
		},
		emptyText() {
			if (!this.recordId) return '记录不存在';
			return this.createTime
				? `暂无 ${this.createTime} 的线路供电异常报警明细`
				: '暂无线路供电异常报警明细';
		}
	},
	onLoad(options) {
		// 兼容小程序/H5 的两种参数读取方式
		this.recordId = safeDecode(options && options.id);
		this.createTime = safeDecode(options && options.createTime);
		this.recordName = safeDecode(options && options.name);
		if (!this.recordId) {
			uni.showToast({ title: '缺少记录id,无法查询明细', icon: 'none' });
			return;
		}
		// 页面加载时按记录 id 查询该次分析的明细
		this.fetchExceptionAlarmData();
	},
	methods: {
		/**
		 * 查询该记录对应的线路供电异常报警明细
		 */
		fetchExceptionAlarmData() {
			this.loading = true;
			this.requestHistoryDesc()
				.then(list => {
					this.loading = false;
					// 接口已按 id 返回该时间对应的明细，直接展示
					this.exceptionAlarmData = list;
					this.total = list.length;
					this.currentPage = 1;
				})
				.catch(err => {
					this.loading = false;
					this.exceptionAlarmData = [];
					this.total = 0;
					console.error('获取线路供电异常报警明细错误:', err.message);
					uni.showToast({ title: '获取线路供电异常报警明细出错,请重试', icon: 'none' });
				});
		},
		/**
		 * 按记录 id 查询该次线路供电异常分析的逐站点明细
		 * 请求体固定为 { id }，返回该次分析的全部站点明细
		 * @returns {Promise<Array>} 明细列表
		 */
		requestHistoryDesc() {
			/**
			 * [
			 *   {
			 *     "id": "cb2af84bc8474312bd1d13e408c0e708",
			 *     "createTime": "2026-10-13 21:53:00",
			 *     "stationId": 3975,
			 *     "stationName": "机场路尾段",
			 *     "lightCount": 41,
			 *     "offlineCount": 1,
			 *     "voltageUpperCount": 0,
			 *     "voltageLowerCount": 0,
			 *     "powerOffCount": 3,
			 *     "offlineError": 0,
			 *     "poweroffError": 0
			 *   }
			 * ]
			 */
			return request({
				url: '/device/light/QueryPowerLineHistoryDesc',
				method: 'POST',
				data: { id: this.recordId }
			}).then(res => {
				const payload = res.data;
				if (res.statusCode !== 200 || !payload || !payload.data) {
					return Promise.reject(new Error(`查询线路供电异常报警明细失败,statusCode=${res.statusCode}`));
				}
				const list = this.mapAlarmList(parseResponseData(payload.data));
				// 打印返回的时间分布，便于核对数据
				this.logAlarmTimes(list);
				return list;
			});
		},
		/**
		 * 接口字段 -> 页面字段
		 * @param {Array} data - 接口返回的明细数组
		 * @returns {Array} 页面使用的明细数组
		 */
		mapAlarmList(data) {
			return (Array.isArray(data) ? data : []).map(item => ({
				stationId: item.stationId, // 用于跳转站点详情
				stationName: item.stationName,
				alarmTime: item.createTime,
				total: item.lightCount,
				offline: item.offlineCount,
				overVoltage: item.voltageUpperCount,
				underVoltage: item.voltageLowerCount,
				offlineAbnormal: item.offlineError,
				lightOffAbnormal: item.poweroffError,
				lightOff: item.powerOffCount
			}));
		},
		/**
		 * 打印接口返回的报警时间分布，便于核对数据
		 * @param {Array} list - 报警明细列表
		 */
		logAlarmTimes(list) {
			const times = [];
			list.forEach(item => {
				const time = String(item.alarmTime || '').trim();
				if (time && times.indexOf(time) === -1) {
					times.push(time);
				}
			});
			const detail = times
				.map(time => `${time}(${list.filter(item => item.alarmTime === time).length}条)`)
				.join('、');
			console.log(`线路供电异常报警明细：共 ${list.length} 条，涉及 ${times.length} 个时间点 ${detail}`);
		},
		// 分页切换
		onPageChange(current) {
			if (current === this.currentPage) return;
			this.currentPage = current;
			this.scrollListToTop();
		},
		// 每页条数切换
		onPageSizeChange(size) {
			if (size === this.pageSize) return;
			this.pageSize = size;
			this.currentPage = 1; // 每页条数变化后从第一页开始
			this.scrollListToTop();
		},
		// 卡片列表回到顶部（页面本身不滚动，scroll-top 需数值变化才生效，故在 0/1 之间交替）
		scrollListToTop() {
			this.scrollTop = this.scrollTop === 0 ? 1 : 0;
		},
		onItemClick(item) {
			if (!item.stationId || !item.stationName) {
				uni.showToast({ title: '站点不存在或者已删除', icon: 'none' });
				return;
			}
			uni.navigateTo({
				url: `/pages/operation/components/stationTypes/stationTwo?stationId=${item.stationId}&boxName=${encodeURIComponent(item.stationName)}`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.exception-record-detail-container {
	width: 100%;
	height: 100vh;
	/*
	 * H5 端 100vh 以整个浏览器视口为准，需减去导航栏高度
	 * （--window-top/--window-bottom 在 H5 为导航栏高度，小程序端为 0，取不到时回退 0）
	 */
	height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
	background-color: var(--bg-page, #f5f7fa);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-sizing: border-box;
}

/* ========= 筛选条件卡片 ========= */
.filter-card {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	margin: 20rpx 30rpx;
	padding: 24rpx;
	background-color: var(--bg-card, #FFFFFF);
	border-radius: 16rpx;
	border: 1px solid var(--border-color, #f0f2f5);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
	box-sizing: border-box;
}

.filter-icon {
	width: 56rpx;
	height: 56rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.filter-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.filter-title {
	font-size: 28rpx;
	font-weight: 500;
	color: var(--text-primary, #333333);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.filter-time {
	margin-top: 8rpx;
	display: flex;
	align-items: center;
}

.filter-label {
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
	margin-right: 10rpx;
}

.filter-value {
	font-size: 26rpx;
	color: #3A7BF7;
	font-weight: 500;
}

/* ========= 报警信息列表 ========= */
.alarm-exception-list {
	flex: 1;
	height: 0;
	min-height: 0;
	width: 100%;
	overflow: hidden;
}

.list-inner {
	padding: 0 30rpx 20rpx;
	box-sizing: border-box;
}

.alarm-card {
	background-color: var(--bg-card, #FFFFFF);
	border-radius: 16rpx;
	padding: 24rpx 24rpx 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
	border: 1px solid var(--border-color, #f0f2f5);
}

/* 卡片头部 */
.card-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.card-icon {
	width: 56rpx;
	height: 56rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.header-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	margin-right: 10rpx;
}

.card-title {
	font-size: 30rpx;
	font-weight: 500;
	color: var(--text-primary, #333333);
	margin-bottom: 4rpx;
}

.card-time {
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
}

.card-total {
	display: flex;
	align-items: baseline;
}

.total-label {
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
	margin-right: 6rpx;
}

.total-num {
	font-size: 30rpx;
	font-weight: bold;
	color: var(--text-primary, #333333);
}

/* 卡片数据区域 */
.card-body {
	display: flex;
	justify-content: space-between;
	padding-top: 10rpx;
}

.column {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.row-item {
	display: flex;
	margin-bottom: 16rpx;
	align-items: baseline;
}

.row-item .label {
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
	margin-right: 8rpx;
}

.row-item .num {
	font-size: 26rpx;
	color: var(--text-primary, #333333);
	font-weight: 500;
}

/* ========= 加载中 / 空状态 ========= */
.loading-tip {
	padding: 60rpx 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.loading-text {
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}

.empty-tip {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 40rpx;
}

.empty-icon {
	width: 96rpx;
	height: 96rpx;
	opacity: 0.35;
	margin-bottom: 24rpx;
}

.empty-text {
	font-size: 28rpx;
	color: var(--text-quaternary, #999999);
	text-align: center;
}

/* ========= 分页器 ========= */
.pagination-wrap {
	flex-shrink: 0;
	background-color: var(--bg-page, #f5f7fa);
	/* 适配全面屏底部安全区 */
	padding-bottom: env(safe-area-inset-bottom);
}
</style>
