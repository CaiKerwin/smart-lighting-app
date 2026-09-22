<template>
	<view :class="themeClass" class="page-container">
		<!-- 头部查询条件 -->
		<view class="search-header">
			<view class="time-range">
				<view class="time-box">
					<uni-datetime-picker
						v-model="startDateTime"
						:clear-icon="false"
						:hide-second="true"
						type="datetime"
					/>
				</view>
				<text class="separator">至</text>
				<view class="time-box">
					<uni-datetime-picker
						v-model="endDateTime"
						:clear-icon="false"
						:hide-second="true"
						type="datetime"
					/>
				</view>
			</view>
			<!-- 查询按钮包裹层 -->
			<view class="query-btn-wrap">
				<button class="query-btn" @click="queryIlluminanceData">查询</button>
			</view>
		</view>

		<!-- 数据表格 -->
		<view class="table-container">
			<!-- 表头 (固定不滑动) -->
			<view class="table-header">
				<view class="col col-index">序号</view>
				<view class="col col-time">采集时间</view>
				<view class="col col-value">光照度</view>
			</view>

			<!-- 表格内容 -->
			<scroll-view class="table-body" scroll-y>
				<view v-for="(item, index) in tableData" :key="index" class="table-row">
					<view class="col col-index">{{ item.index }}</view>
					<view class="col col-time">{{ item.time }}</view>
					<view class="col col-value">{{ item.illuminance }} lux</view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部分页器：固定页面底部可见，仅表格数据区滚动 -->
		<view class="pagination-wrap">
			<Pagination
				:current="currentPage"
				:page-size="pageSize"
				:total="total"
				@change="handlePageChange"
				@pageSizeChange="handleSizeChange"
			/>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import Pagination from "@/components/pagination.vue";
import {base64Decode} from "@/utils/common";

export default {
	components: {
		Pagination
	},
	data() {
		return {
			id: '',
			name: '',
			// 默认：当前时间前两小时 至 当前时间
			startDateTime: '',
			endDateTime: '',
			// 表格数据
			tableData: [],

			// 分页
			currentPage: 1,
			pageSize: 10,
			total: 0,
		};
	},
	onLoad(options) {
		// 获取传递的参数
		this.id = options.id || '';
		this.name = options.name || '';
		uni.setNavigationBarTitle({title: this.name});

		// 初始化默认时间
		this.initDefaultTime();

		// 获取光照数据
		this.getIlluminanceData();
	},
	methods: {
		/**
		 * 初始化默认时间：当前时间前两小时 至 当前时间
		 * 格式：YYYY-MM-DD HH:mm
		 */
		initDefaultTime() {
			const now = new Date();
			const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
			this.endDateTime = this.formatDateTime(now);
			this.startDateTime = this.formatDateTime(twoHoursAgo);
		},
		/**
		 * 格式化日期时间为 YYYY-MM-DD HH:mm
		 */
		formatDateTime(date) {
			const pad = (n) => (n < 10 ? '0' + n : '' + n);
			const y = date.getFullYear();
			const m = pad(date.getMonth() + 1);
			const d = pad(date.getDate());
			const hh = pad(date.getHours());
			const mm = pad(date.getMinutes());
			return `${y}-${m}-${d} ${hh}:${mm}`;
		},
		// 获取光照数据
		getIlluminanceData() {
			this.fetchIlluminanceData();
		},
		// 根据时间范围查询光照数据（重新查询时回到第一页）
		queryIlluminanceData() {
			this.fetchIlluminanceData(true);
		},
		// 翻页
		handlePageChange(page) {
			this.currentPage = page;
			this.fetchIlluminanceData();
		},
		// 每页条数变化（重置回第一页）
		handleSizeChange(size) {
			this.pageSize = size;
			this.currentPage = 1;
			this.fetchIlluminanceData();
		},
		/**
		 * 请求光照数据（分页）
		 * {
		 *   "count": 1,
		 *   "list": [
		 *     {
		 *       "luxId": "387c884f348e400d90c85f191d24b52e",
		 *       "fireTime": "2026-09-22 14:44:55",
		 *       "luxValue": 1284,
		 *       "temperature": 0,
		 *       "humidity": 0
		 *     }
		 *   ]
		 * }
		 * @param {Boolean} resetPage 是否重置回第一页
		 */
		fetchIlluminanceData(resetPage = false) {
			uni.showLoading({
				title: '查询中...',
				mask: true
			});
			if (resetPage) {
				this.currentPage = 1;
			}
			request({
				url: '/device/lux/QueryLogs',
				method: 'POST',
				data: {
					stationId: this.id,
					start: this.startDateTime + ':00',
					end: this.endDateTime + ':00',
					index: this.currentPage,
					size: this.pageSize
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res.data
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data))
					this.total = data.count
					this.tableData = data.list.map((item, index) => ({
						// 序号跨页连续：(当前页-1) * 每页条数 + 行号
						index: (this.currentPage - 1) * this.pageSize + index + 1,
						time: item.fireTime,
						illuminance: item.luxValue
					}))
				}
			}).catch(err => {
				uni.showToast({title: '获取光照数据失败', icon: 'none'})
				console.error('获取光照数据失败：', err.message);
			}).finally(()=>{
				uni.hideLoading();
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page-container {
	height: 100vh;
	background-color: var(--bg-page, #f8f8f8);
	padding: 24rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	overflow: hidden;
}

.search-header {
	background-color: var(--bg-accent, #eef3ff);
	padding: 30rpx 24rpx;
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	gap: 30rpx;
	flex-shrink: 0;
}

.time-range {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

/* 时间选择器外部容器 */
.time-box {
	background-color: var(--bg-card, #ffffff);
	border-radius: 8rpx;
	padding: 12rpx 24rpx;
	min-width: 240rpx;
	box-shadow: 0 2rpx 8rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.05));

	/* 穿透修改 uni-datetime-picker 内部样式 */
	::v-deep .uni-datetime-picker {
		background-color: transparent;
		border: none;

		.uni-datetime-picker--input {
			color: var(--color-highlight, #1a73e8);
			font-size: 28rpx;
			text-align: center;
		}
	}
}

.separator {
	color: var(--text-secondary, #666666);
	font-size: 26rpx;
	padding: 0 10rpx;
}

.query-btn-wrap {
	width: 100%;
}

/* 查询按钮宽度占满 */
.query-btn {
	background-color: var(--color-primary, #4285f4);
	color: #ffffff;
	font-size: 30rpx;
	width: 100%;
	height: 76rpx;
	line-height: 76rpx;
	border-radius: 12rpx;
	margin: 0;
	padding: 0;
	border: none;

	&::after {
		border: none;
	}
}

/* 表格区域：占满剩余空间 */
.table-container {
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.05));
}

/* 表头固定 */
.table-header {
	display: flex;
	background-color: var(--bg-table-header, #f8f9fc);
	padding: 24rpx 0;
	border-bottom: 2rpx solid var(--border-color, #e5e5e5);
	flex-shrink: 0;
}

/* 表体滚动区（仅此区域滚动） */
.table-body {
	flex: 1;
	height: 0;
	min-height: 0;
	overflow: hidden;
}

.table-row {
	display: flex;
	padding: 24rpx 0;
	border-bottom: 2rpx solid var(--border-color, #e5e5e5);
	transition: background-color 0.2s;

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background-color: var(--bg-row-selected, #f0f5ff);
	}
}

.col {
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	text-align: center;
	display: flex;
	align-items: center;
	justify-content: center;

	&.col-index {
		flex: 0 0 100rpx;
		color: var(--text-secondary, #666666);
	}

	&.col-time {
		flex: 1.2;
		color: var(--text-secondary, #666666);
		font-size: 26rpx;
	}

	&.col-value {
		flex: 0.8;
		color: var(--color-highlight, #1a73e8);
		font-weight: 500;
	}
}

/* 分页器固定页面底部：始终可见，不随表格滚动 */
.pagination-wrap {
	flex-shrink: 0;
	margin-top: auto;
	padding-bottom: env(safe-area-inset-bottom);

	::v-deep .work-order-pagination {
		margin: 0;
	}
}
</style>
