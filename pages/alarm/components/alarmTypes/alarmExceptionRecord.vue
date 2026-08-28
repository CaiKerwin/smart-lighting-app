<template>
	<view :class="themeClass" class="alarm-exception-record-container">
		<AlarmCenter :initialTab="'线路供电异常报警记录'" @change="onTabChange" />
		<view class="time-card">
			<!-- 开始时间 picker -->
			<uni-datetime-picker
				type="datetime"
				v-model="startDate"
				return-type="string"
				:border="false"
				class="time-picker-wrap"
				placeholder="请选择开始时间"
				hide-second
			/>

			<text class="time-to">至</text>

			<!-- 结束时间 picker -->
			<uni-datetime-picker
				type="datetime"
				v-model="endDate"
				return-type="string"
				:border="false"
				class="time-picker-wrap"
				placeholder="选择结束时间"
				hide-second
			/>

			<view class="query-btn" @click="queryExceptionRecord">查询</view>
		</view>

		<!-- 线路供电异常报警记录列表 -->
		<view class="alarm-exception-record-list">
			<view v-for="(item, index) in exceptionRecordAlarmList" :key="index" class="record-card">
				<!-- 卡片头部 -->
				<view class="card-header">
					<image class="card-icon" mode="aspectFit" src="/static/alarm/power.png"></image>
					<view class="header-text">
						<view class="card-title">{{ item.title }}</view>
						<view class="card-time">{{ item.time }}</view>
					</view>
				</view>

				<!-- 配电箱信息 -->
				<view class="content-row title-row">
					<view class="col-left"><text class="col-title">配电箱</text></view>
					<view class="col-right"><text class="col-title">站点总数 {{ item.distributionBox.totalStations }}</text></view>
				</view>
				<view class="content-row">
					<view class="col-left"><text class="label">离线报警数</text><text class="val">{{ item.distributionBox.offlineAlarms }}</text></view>
					<view class="col-right"><text class="label">灭灯报警数</text><text class="val">{{ item.distributionBox.lightOffAlarms }}</text></view>
				</view>
				<view class="content-row">
					<view class="col-left"><text class="label">过压报警数</text><text class="val">{{ item.distributionBox.overVoltageAlarms }}</text></view>
					<view class="col-right"><text class="label">欠压报警数</text><text class="val">{{ item.distributionBox.underVoltageAlarms }}</text></view>
				</view>

				<!-- 单灯信息 -->
				<view class="content-row title-row">
					<view class="col-left"><text class="col-title">单灯</text></view>
					<view class="col-right"><text class="col-title">单灯总数 {{ item.singleLamp.total }}</text></view>
				</view>
				<view class="content-row">
					<view class="col-left"><text class="label">离线数</text><text class="val">{{ item.singleLamp.offlineCount }}</text></view>
					<view class="col-right"><text class="label">灭灯数</text><text class="val">{{ item.singleLamp.lightOffCount }}</text></view>
				</view>
				<view class="content-row">
					<view class="col-left"><text class="label">过压数</text><text class="val">{{ item.singleLamp.overVoltageCount }}</text></view>
					<view class="col-right"><text class="label">欠压数</text><text class="val">{{ item.singleLamp.underVoltageCount }}</text></view>
				</view>
			</view>
		</view>

		<!-- ==================== 分页器 ==================== -->
		<AlarmPagination
			v-if="total > 0"
			:current="currentPage"
			:pageSize="pageSize"
			:total="total"
			@change="onPageChange"
			@pageSizeChange="onPageSizeChange"
		/>
	</view>
</template>

<script>
import AlarmCenter from "@/pages/alarm/components/alarmCenter.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import AlarmPagination from "@/pages/alarm/components/alarmPagination.vue";
export default {
	components: {
		AlarmPagination,
		AlarmCenter
	},
	data() {
		return {
			tabMap: {
				'配电箱报警': '/pages/alarm/components/alarmTypes/alarmPowerbox',
				'单灯报警': '/pages/alarm/components/alarmTypes/alarmLight',
				'离线报警': '/pages/alarm/components/alarmTypes/alarmOffline',
				'线路供电异常报警': '/pages/alarm/components/alarmTypes/alarmException',
				'线路供电异常报警记录': '/pages/alarm/components/alarmTypes/alarmExceptionRecord',
				'水浸报警': '/pages/alarm/components/alarmTypes/alarmWater',
				'人工报障': '/pages/alarm/components/alarmTypes/alarmWorker'
			},
			startDate: '',
			endDate: '',
			exceptionRecordAlarmList: [],
			// 分页相关
			currentPage: 1,  // 当前页码
			pageSize: 10,    // 每页条数
			total: 0         // 总条数
		};
	},
	methods: {
		onTabChange(tabName) {
			const url = this.tabMap[tabName];
			if (url) {
				uni.navigateTo({ url });
			} else {
				console.warn('未知标签:', tabName);
				uni.showToast({ title: '未知标签', icon: 'none' });
			}
		},
		// 分页切换
		onPageChange(current) {
			if (current === this.currentPage) return;
			this.currentPage = current;
			this.loadExceptionRecordAlarms();
		},
		// 每页条数切换
		onPageSizeChange(size) {
			if (size === this.pageSize) return;
			this.pageSize = size;
			this.currentPage = 1; // 每页条数变化后从第一页开始
			this.loadExceptionRecordAlarms();
		},
		loadExceptionRecordAlarms() {
			//校验
			if (!this.startDate ) {
				uni.showToast({ title: '请选择开始时间和结束时间', icon: 'none' });
				return;
			} else if (!this.endDate) {
				uni.showToast({ title: '请选择开始时间和结束时间', icon: 'none' });
				return;
			} else if (!this.startDate && !this.endDate) {
				uni.showToast({ title: '请选择开始时间和结束时间', icon: 'none' });
				return;
			}
			/**
			 * {
			 *   "count": 125670,
			 *   "list": [
			 *     {
			 *       "id": "9e867fd5492246068b5728246acc2f80",
			 *       "name": "2026年06月22日16时42分线路供电异常分析结果",
			 *       "createTime": "2026-06-22 16:42:00",
			 *       "stationTotalCount": 8,
			 *       "voltageUpperStationCount": 0,
			 *       "voltageLowerStationCount": 0,
			 *       "powerOffStationCount": 0,
			 *       "offlineStationCount": 6,
			 *       "lightTotalCount": 38,
			 *       "voltageUpperLightCount": 0,
			 *       "voltageLowerLightCount": 0,
			 *       "powerOffLightCount": 0,
			 *       "offlineLightCount": 38
			 *     }
			 *   ]
			 * }
			 */
			// 发起请求
			this.loading = true;
			uni.showLoading({ title: '查询中...', mask: true });
			request({
				url: '/device/light/QueryPowerLineHistory',
				method: 'POST',
				data: {
					start: this.startDate,
					end: this.endDate,
					index: this.currentPage,
					size: this.pageSize
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				uni.hideLoading();
				this.loading = false;

				const payload = res.data;
				try {
					if (payload && payload.data){
						const data = JSON.parse(base64Decode(payload.data));
						this.total = Number(data.count) || 0; // 总条数（用于分页）
						this.exceptionRecordAlarmList = data.list.map(item =>({
							title: item.name,
							time: item.createTime,
							distributionBox: {
								totalStations: item.stationTotalCount,
								offlineAlarms: item.offlineStationCount,
								lightOffAlarms: item.powerOffStationCount,
								overVoltageAlarms: item.voltageUpperStationCount,
								underVoltageAlarms: item.voltageLowerStationCount
							},
							singleLamp: {
								total: item.lightTotalCount,
								offlineCount: item.offlineLightCount,
								lightOffCount: item.powerOffLightCount,
								overVoltageCount: item.voltageUpperLightCount,
								underVoltageCount: item.voltageLowerLightCount
							}
						}));
						// 当前页超出最大页时（例如删除最后一页的最后一条），回退到最后一页
						const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize));
						if (this.currentPage > maxPage) {
							this.currentPage = maxPage;
							this.loadExceptionRecordAlarms();
							return;
						}
					}
					// 若列表为空，给出提示
					if (this.exceptionRecordAlarmList.length === 0) {
						uni.showToast({ title: '该时间段暂无线路供电异常报警记录', icon: 'none' });
					}
				} catch (e) {
					console.error('解析线路供电异常报警记录数据错误:', e.message);
				}
			}).catch(err =>{
				console.error('获取线路供电异常报警记录数据错误:', err.message);
				uni.showToast({ title: '获取线路供电异常报警记录数据出错,请重试', icon: 'none' });
			})
		},
		queryExceptionRecord() {
			// 重新查询时重置到第一页
			this.currentPage = 1;
			this.loadExceptionRecordAlarms();
		}
	}
}
</script>

<style lang="scss" scoped>
.alarm-exception-record-container {
	width: 100%;
	min-height: 100vh;
	background-color: var(--bg-page, #f5f7fa);
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

.time-card {
	margin: 20rpx;
	background-color: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	padding: 48rpx 32rpx;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);

	/* 时间选择器外层 */
	.time-picker-wrap {
		flex: 1;
		min-width: 200rpx;

		/* 穿透修改 uni-datetime-picker 内部输入框样式 */
		::v-deep .uni-date-picker__container,
		::v-deep .uni-input-wrapper {
			background-color: var(--bg-accent, #eef5ff) !important;
			border-radius: 8rpx !important;
			border: 1px solid transparent !important;
			height: 76rpx !important;
			padding: 0 24rpx !important;
			display: flex;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;

			.uni-input {
				color: #3b7bf7 !important;
				font-size: 28rpx !important;
				text-align: center;
				width: 100%;
				letter-spacing: 1rpx;
			}

			&::after {
				border: none !important;
			}
		}
	}

	/* 中间的至字 */
	.time-to {
		color: #9faaba;
		font-size: 28rpx;
		margin: 0 20rpx;
		flex-shrink: 0;
	}

	/* 查询按钮 */
	.query-btn {
		width: 100%;
		margin-top: 40rpx;
		background-color: #3b7bf7;
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 500;
		border-radius: 24rpx;
		text-align: center;
		padding: 24rpx 0;
		cursor: pointer;
		transition: opacity 0.2s;

		&:active {
			opacity: 0.8;
		}
	}
}

/* ========= 列表及卡片样式 ========= */
.alarm-exception-record-list {
	padding: 0 20rpx;
}

.record-card {
	background: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 30rpx 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

/* 卡片头部 */
.card-header {
	display: flex;
	align-items: flex-start;
	margin-bottom: 30rpx;
}

.card-icon {
	width: 64rpx;
	height: 64rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.header-text {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;  /* 防止内部元素撑开 */
	min-width: 0;
}

.card-title {
	width: 100%;
	font-size: 30rpx;
	font-weight: 500;
	color: var(--text-primary, #333333);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.card-time {
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
	margin-top: 8rpx;
}

/* 内容行双列布局 */
.content-row {
	display: flex;
	justify-content: space-between;
	padding: 8rpx 0;
}

.title-row {
	padding: 4rpx 0 12rpx 0;
}

.col-left,
.col-right {
	flex: 1;
	display: flex;
	align-items: center;
}

.col-right {
	padding-left: 30rpx;
}

.col-title {
	font-size: 28rpx;
	font-weight: bold;
	color: var(--text-primary, #333333);
}

.label {
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

.val {
	font-size: 26rpx;
	color: var(--text-primary, #333333);
	margin-left: 8rpx;
}
</style>
