<template>
	<view :class="themeClass" class="monitor-timetable-container">
		<!-- 固定头部：月份筛选气泡（仅可左右滑动） -->
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

		<!-- 每天定时/传感器/混合 卡片（仅可上下滑动） -->
		<scroll-view :show-scrollbar="false" class="days-scroll" scroll-y="true">
			<view class="scroll-inner">
				<view v-if="currentMonthDays.length === 0" class="empty-box">
					<text class="empty-text">该月暂无时间表数据</text>
				</view>
				<view v-else class="days-grid">
					<view v-for="day in currentMonthDays" :key="day.day" class="day-card">
						<view class="day-number">{{ day.day }}</view>
						<view class="action-list">
							<view v-if="day.items.length === 0" class="no-data">无数据</view>
							<!-- 表头：分割线 -->
							<view v-else class="action-head" />
							<!-- 每个动作占一行，时间/动作/数值 按三列对齐 -->
							<view v-for="item in day.items" :key="item.index" class="action-item">
								<text class="item-time">{{ item.time }}</text>
								<text class="item-action">{{ item.actionLabel }}</text>
								<text class="item-value">{{ item.valueText }}</text>
							</view>
						</view>
					</view>
					<!-- 占位卡片：保证最后一行 2 列布局整齐 -->
					<view v-for="i in fillerCount" :key="'filler-' + i" class="day-card filler-card"></view>
				</view>
			</view>
		</scroll-view>

		<!-- 悬浮编辑按钮 -->
		<view class="fab-edit" @click="editMonitorTimeTable">
			<uni-icons color="#ffffff" size="30" type="compose"/>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 动作类型文案：0-定时 1-传感器 2-混合
const ACTION_LABELS = {
	0: '定时',
	1: '传感器',
	2: '混合'
};

// 动作类型对应的数值单位：0-定时为亮度，1-传感器不显示值，2-混合为照度
const ACTION_UNITS = {
	0: '%',
	2: 'lux'
};

export default {
	name: 'MonitorTimeTable',
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
			// 详情中的全年内容：{ "月": { "日": { "a1":.., "t1":.., "v1":.., ... } } }
			content: {},
			loading: false,
			loadError: false
		};
	},
	computed: {
		// 获取当前月份的天数数组以及每一天处理好的数据
		currentMonthDays() {
			const monthData = this.content[this.currentMonth] || {};
			const dayKeys = Object.keys(monthData)
				.map(Number)
				.filter(key => !isNaN(key));

			// 该月没有任何数据时返回空数组，展示空状态
			if (dayKeys.length === 0) {
				return [];
			}

			// 以最大日期为准补全整月，避免接口缺省某天时后续日期整体前移
			const totalDays = Math.max(...dayKeys);
			const days = [];
			for (let i = 1; i <= totalDays; i++) {
				days.push({
					day: i,
					items: this.parseDayData(monthData[i])
				});
			}
			return days;
		},
		// 占位卡片数量：让 2 列网格的最后一行保持整齐
		fillerCount() {
			return this.currentMonthDays.length % 2 === 0 ? 0 : 1;
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
				this.getMonitorTimeTableDetail(this.timeTableId);
			}
		};
		uni.$on('monitorTimeTableUpdated', this.refreshHandler);

		this.getMonitorTimeTableDetail(this.timeTableId);
	},
	onUnload() {
		if (this.refreshHandler) {
			uni.$off('monitorTimeTableUpdated', this.refreshHandler);
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

		// 解析某一天的数据，取 a1~a6 六个动作，转换成 UI 数组格式
		// a：0-定时（值为百分比） 1-传感器（不显示值） 2-混合（值为照度 lux）
		parseDayData(dayData) {
			if (!dayData) return [];
			const items = [];
			for (let i = 1; i <= 6; i++) {
				const tVal = dayData[`t${i}`];
				if (tVal === undefined || tVal === null || tVal === '') continue;

				const aVal = dayData[`a${i}`];
				if (aVal === undefined || aVal === null || aVal === '') continue;

				// a=0 时无单位，取值结果为空字符串，即不显示 v 值
				const unit = ACTION_UNITS[Number(aVal)] || '';
				const vVal = dayData[`v${i}`];
				const hasValue = vVal !== undefined && vVal !== null && vVal !== '';

				items.push({
					index: i,
					time: String(tVal),
					actionLabel: ACTION_LABELS[Number(aVal)] || '',
					valueText: unit && hasValue ? `${vVal} ${unit}` : ''
				});
			}
			return items;
		},

		// 获取集中器年表详情
		getMonitorTimeTableDetail(timeTableId) {
			this.loading = true;
			this.loadError = false;
			/**
			 * {
			 *   "name": "集中器年表1",
			 *   "type": 5,
			 *   "isDefault": false,
			 *   "content": {
			 *     "1": {                              // 月份（1~12）
			 *       "1": {                            // 日期
			 *         "a1": 0, "t1": "00:00", "v1": 20,   // a1~a6 动作（0定时/1传感器/2混合）
			 *         "a2": 0, "t2": "01:00", "v2": 30,   // t1~t6 时间，v1~v6 对应的值
			 *         ...
			 *         "a6": 0, "t6": "05:00", "v6": 70
			 *       },
			 *       ...
			 *     },
			 *     ...
			 *   },
			 *   "id": 227,
			 *   "createTime": "2022-12-08 10:28:23",
			 *   "updateTime": "2025-06-19 14:07:31"
			 * }
			 */
			request({
				url: '/station/plan/QueryMonitorDetail',
				method: 'post',
				data: {
					id: timeTableId
				}
			}).then(res => {
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
						console.error('集中器年表详情解析失败', e);
						this.loading = false;
						this.loadError = true;
					}
				} else {
					this.loading = false;
					this.loadError = true;
					uni.showToast({title: '获取集中器年表详情异常', icon: 'none'});
				}
			}).catch(err => {
				this.loading = false;
				this.loadError = true;
				console.error('获取集中器年表详情错误', err.message);
			});
		},

		// 跳转编辑页
		editMonitorTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '缺少时间表ID', icon: 'none'});
				return;
			}
			uni.navigateTo({
				url: `/pages/timeTable/components/timeTableEdit/editMonitorTimeTable?id=${this.timeTableId}&name=${encodeURIComponent(this.timeTableName || '')}`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 容器：固定头部 + 滚动区 ==================== */
.monitor-timetable-container {
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

/* ==================== 每天动作卡片：唯一可上下滑动的区域 ==================== */
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

/* ==================== 空状态 ==================== */
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

/* ==================== 天数卡片（2 列） ==================== */
.days-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;

	.day-card {
		width: 48.5%;
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

		.action-list {
			.no-data {
				text-align: center;
				font-size: 22rpx;
				color: var(--text-quaternary, #999999);
				padding: 12rpx 0;
			}

			/* 表头：与数据行共用三列栅格，保证列宽完全对齐 */
			.action-head {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				align-items: center;
				padding: 2rpx 0 8rpx;
				margin-bottom: 4rpx;
				border-bottom: 1rpx solid var(--border-color, #e5e5e5);

				.head-cell {
					font-size: 20rpx;
					line-height: 1.4;
					color: var(--text-quaternary, #999999);
				}
			}

			/* 每个动作一行，三列分别为：时间 / 动作 / 数值 */
			.action-item {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				align-items: center;
				padding: 6rpx 0;
				font-size: 22rpx;
				line-height: 1.4;

				/* 三列文字：时间左对齐、动作居中、数值右对齐 */
				.item-time,
				.item-action,
				.item-value {
					min-width: 0;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.item-time {
					text-align: left;
					color: var(--text-secondary, #666666);
				}

				.item-action {
					text-align: center;
					color: var(--text-primary, #333333);
				}

				.item-value {
					text-align: right;
					color: var(--text-primary, #333333);
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
