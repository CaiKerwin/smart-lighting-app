<template>
	<view class="alarm-exception-record-container">
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
				format="yyyy-MM-dd HH:mm:ss"
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
				format="yyyy-MM-dd HH:mm:ss"
			/>

			<view class="query-btn" @click="queryExceptionRecord">查询</view>
		</view>
	</view>
</template>

<script>
import AlarmCenter from "@/pages/alarm/components/alarmCenter.vue";
export default {
	components: {
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
			endDate: ''
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
		queryExceptionRecord() {
			console.log('查询线路供电异常报警记录', this.startDate, this.endDate);
		}
	}
}
</script>

<style lang="scss" scoped>
.alarm-exception-record-container {
	width: 100%;
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

.time-card {
	margin: 20rpx;
	background-color: #ffffff;
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
			background-color: #eef5ff !important;
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
</style>
