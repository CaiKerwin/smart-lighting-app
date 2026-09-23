<template>
	<view :class="themeClass" class="common-year-timetable-container">
		<!-- 固定头部：月份筛选气泡 -->
		<view class="header-fixed">
			<!-- 月份气泡 -->
			<view class="month-section">
				<scroll-view :show-scrollbar="false" class="month-scroll" scroll-x="true">
					<view class="month-row">
						<view
							v-for="month in months"
							:key="month"
							:class="{
									'month-active': currentMonth === month,
									'month-empty': !hasMonthData(month)
								}"
							class="month-bubble"
							@click="selectMonth(month)"
						>
							{{ month }}月
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 每天开关灯时间卡片 -->
		<scroll-view :show-scrollbar="false" class="days-scroll" scroll-y="true">
			<view class="scroll-inner">
				<view v-if="currentMonthDays.length === 0" class="empty-box">
					<text class="empty-text">该月暂无时间表数据</text>
				</view>
				<view v-else class="days-grid">
					<view v-for="day in currentMonthDays" :key="day.day" class="day-card">
						<view class="day-number">{{ day.day }}</view>
						<view class="time-list">
							<view v-if="day.items.length === 0" class="no-data">无数据</view>
							<view v-for="item in day.items" :key="item.index" class="time-item">
								<text class="item-time">{{ item.time }}</text>
								<text :class="'status-' + item.statusKey" class="item-status">{{ item.status }}</text>
							</view>
						</view>
					</view>
					<!-- 占位卡片：保证最后一行 3 列布局整齐 -->
					<view v-for="i in fillerCount" :key="'filler-' + i" class="day-card filler-card"></view>
				</view>
			</view>
		</scroll-view>

		<!-- 悬浮编辑按钮 -->
		<view class="fab-edit" @click="editCommonYearTimeTable">
			<uni-icons color="#ffffff" size="30" type="compose"/>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	name: 'CommonYearTimeTable',
	data() {
		return {
			// 1~12月
			months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
			// 当前选中的月份，默认当前月份
			currentMonth: new Date().getMonth() + 1,
			// 时间表 id
			timeTableId: null,
			// 时间表名称
			timeTableName: '',
			// 详情中的全年内容：{ "月": { "日": { "a1":.., "t1":.., ... } } }
			content: {}
		};
	},
	computed: {
		// 获取当前月份的天数数组以及每一天处理好的数据
		currentMonthDays() {
			const monthData = this.content[this.currentMonth] || {};
			const dayKeys = Object.keys(monthData).map(Number).sort((a, b) => a - b);

			// 该月没有任何数据时返回空数组，展示空状态
			if (dayKeys.length === 0) {
				return [];
			}

			const totalDays = dayKeys.length;
			const days = [];
			for (let i = 1; i <= totalDays; i++) {
				days.push({
					day: i,
					items: this.parseDayData(monthData[i])
				});
			}
			return days;
		},
		// 占位卡片数量：让 3 列网格的最后一行保持整齐
		fillerCount() {
			const len = this.currentMonthDays.length;
			return len % 3 === 0 ? 0 : 3 - (len % 3);
		}
	},
	onLoad(options) {
		this.timeTableId = options && options.id ? Number(options.id) : null;
		if (options && options.name) {
			try {
				this.timeTableName = decodeURIComponent(options.name);
			} catch (e) {
				this.timeTableName = options.name;
			}
		}

		if (!this.timeTableId) {
			this.loading = false;
			this.loadError = true;
			return;
		}

		// 编辑页保存成功后，刷新本页详情
		this.refreshHandler = (payload) => {
			if (payload && payload.id === this.timeTableId) {
				this.getCommonYearTimeTableDetail(this.timeTableId);
			}
		};
		uni.$on('commonYearTimeTableUpdated', this.refreshHandler);

		this.getCommonYearTimeTableDetail(this.timeTableId);
	},
	onUnload() {
		if (this.refreshHandler) {
			uni.$off('commonYearTimeTableUpdated', this.refreshHandler);
			this.refreshHandler = null;
		}
	},
	methods: {
		// 切换月份
		selectMonth(month) {
			this.currentMonth = month;
		},

		// 某月是否存在时间表数据
		hasMonthData(month) {
			return Object.keys(this.content[month] || {}).length > 0;
		},

		// 解析某一天的数据，只取 a1~a4，转换成 UI 数组格式
		// 0-关闭 1-开启 2-无效
		parseDayData(dayData) {
			if (!dayData) return [];
			const items = [];
			for (let i = 1; i <= 4; i++) {
				const tVal = dayData[`t${i}`];
				const aVal = dayData[`a${i}`];
				if (tVal === undefined || tVal === null || tVal === '') continue;
				if (aVal === undefined || aVal === null || aVal === '') continue;

				const actionKey = Number(aVal);
				let status = '关闭';
				let statusKey = 'off';
				if (actionKey === 1) {
					status = '开启';
					statusKey = 'on';
				} else if (actionKey === 2) {
					status = '无效';
					statusKey = 'invalid';
				}

				items.push({
					index: i,
					time: String(tVal),
					status: status,
					statusKey: statusKey
				});
			}
			return items;
		},

		// 获取常规年表详情
		getCommonYearTimeTableDetail(timeTableId) {
			this.loading = true;
			this.loadError = false;
			/**
			 * {
			 *   "name": "公司测试",
			 *   "type": 1,
			 *   "isDefault": false,
			 *   "content": {
			 *     "1": {                              // 月份（1~12）
			 *       "1": {                            // 日期
			 *         "a1": 0, "t1": "07:23",        // a1~a4 动作（0关闭/1开启/2无效），t1~t4 时间
			 *         "a2": 1, "t2": "17:07",
			 *         "a3": 1, "t3": "18:06",
			 *         "a4": 1, "t4": "18:06"
			 *       },
			 *       ...
			 *     },
			 *     ...
			 *   },
			 *   "id": 2,
			 *   "createTime": "2022-12-08 10:28:23",
			 *   "updateTime": "2026-04-01 11:15:58"
			 * }
			 */
			request({
				url: '/station/plan/QueryCommonYearDetail',
				method: 'post',
				data: {
					id: timeTableId
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res.data;
				if (payload && payload.data) {
					try {
						// 兼容返回已解码对象的情况
						let detail = payload.data;
						if (typeof detail === 'string') {
							detail = JSON.parse(base64Decode(detail));
						}
						this.content = (detail && detail.content) || {};
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}
						// 设置导航栏标题为当前时间表名称
						uni.setNavigationBarTitle({title: this.timeTableName});
						this.loading = false;
					} catch (e) {
						console.error('常规年表详情解析失败', e);
						this.loading = false;
						this.loadError = true;
					}
				} else {
					this.loading = false;
					this.loadError = true;
					uni.showToast({title: '获取常规年表详情异常', icon: 'none'});
				}
			}).catch(err => {
				this.loading = false;
				this.loadError = true;
				console.error('获取常规年表详情错误', err.message);
			});
		},
		editCommonYearTimeTable() {
			uni.navigateTo({
				url: `/pages/timeTable/components/timeTableEdit/editCommonYearTimeTable?id=${this.timeTableId}&name=${encodeURIComponent(this.timeTableName)}`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 容器：固定头部 + 滚动区 ==================== */
.common-year-timetable-container {
	display: flex;
	flex-direction: column;
	/* 占满导航栏之外的整屏高度，保证只有卡片区域上下滚动 */
	height: 100vh;
	height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
	overflow: hidden;
	background-color: var(--bg-page, #f8f8f8);
	box-sizing: border-box;
}

/* ==================== 固定头部（月份气泡，仅可左右滑动） ==================== */
.header-fixed {
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	padding: 24rpx 24rpx 0;
}

/* ==================== 悬浮编辑按钮 ==================== */
.fab-edit {
	position: fixed;
	right: 30rpx;
	bottom: calc(60rpx + env(safe-area-inset-bottom));
	width: 110rpx;
	height: 110rpx;
	border-radius: 50%;
	background-color: #3a7bf7;
	color: #ffffff;
	font-size: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(58, 123, 247, 0.4);
	z-index: 999;
}

/* ==================== 月份气泡 ==================== */
.month-section {
	border-radius: 20rpx;
	padding: 20rpx;
	margin-bottom: 24rpx;

	.month-scroll {
		width: 100%;
		white-space: nowrap;
	}

	.month-row {
		display: flex;
		align-items: center;
	}

	.month-bubble {
		flex-shrink: 0;
		padding: 12rpx 28rpx;
		margin-right: 16rpx;
		border-radius: 20rpx;
		background-color: var(--bg-soft, #f2f4f8);
		color: var(--text-secondary, #666666);
		font-size: 26rpx;
		transition: all 0.2s;

		&:last-child {
			margin-right: 0;
		}
	}

	.month-active {
		background-color: #3a7bf7;
		color: #ffffff;
		font-weight: bold;
	}

	/* 无数据月份半透明提示 */
	.month-empty {
		opacity: 0.5;
	}
}

/* ==================== 每天开关灯时间：唯一可上下滑动的区域 ==================== */
.days-scroll {
	flex: 1;
	height: 0;
	min-height: 0;
	width: 100%;
}

.scroll-inner {
	/* 底部留出悬浮按钮空间，避免遮挡最后一行卡片 */
	padding: 0 24rpx 200rpx;
	box-sizing: border-box;
}

/* ==================== 每天开关灯时间 ==================== */
.empty-box {
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	padding: 80rpx 0;
	display: flex;
	justify-content: center;
	box-shadow: 0 2rpx 10rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.06));

	.empty-text {
		font-size: 26rpx;
		color: var(--text-quaternary, #999999);
	}
}

.days-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;

	.day-card {
		width: 32%;
		background-color: var(--bg-card, #ffffff);
		border-radius: 16rpx;
		padding: 20rpx 16rpx;
		margin-bottom: 20rpx;
		box-sizing: border-box;
		box-shadow: 0 2rpx 10rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.05));

		.day-number {
			text-align: center;
			font-size: 40rpx;
			font-weight: bold;
			color: var(--text-primary, #333333);
			margin-bottom: 16rpx;
		}

		.time-list {
			.no-data {
				text-align: center;
				font-size: 22rpx;
				color: var(--text-quaternary, #999999);
				padding: 12rpx 0;
			}

			.time-item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8rpx;
				padding: 8rpx 0;

				.item-time {
					font-size: 24rpx;
					color: var(--text-secondary, #666666);
				}

				.item-status {
					flex-shrink: 0;
					font-size: 22rpx;
					padding: 2rpx 10rpx;
					border-radius: 8rpx;
				}

				.status-on {
					background-color: rgba(7, 193, 96, 0.12);
					color: #07c160;
				}

				.status-off {
					background-color: rgba(144, 147, 153, 0.15);
					color: #dd524d;
				}

				.status-invalid {
					background-color: var(--bg-soft, #f2f4f8);
					color: var(--text-quaternary, #999999);
				}
			}
		}
	}

	/* 占位卡片：不可见但占位，保证最后一行整齐 */
	.filler-card {
		visibility: hidden;
	}
}
</style>
