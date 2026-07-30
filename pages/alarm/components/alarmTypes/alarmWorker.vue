<template>
	<view class="alarm-worker-container">
		<AlarmCenter :initialTab="tab" @change="onTabChange" />
		<view class="manual-report-btn" @click="goToManualReport">
			人工报障
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
			tab: '人工报障',
			tabMap: {
				'配电箱报警': '/pages/alarm/components/alarmTypes/alarmPowerbox',
				'单灯报警': '/pages/alarm/components/alarmTypes/alarmLight',
				'离线报警': '/pages/alarm/components/alarmTypes/alarmOffline',
				'线路供电异常报警': '/pages/alarm/components/alarmTypes/alarmException',
				'线路供电异常报警记录': '/pages/alarm/components/alarmTypes/alarmExceptionRecord',
				'水浸报警': '/pages/alarm/components/alarmTypes/alarmWater',
				'人工报障': '/pages/alarm/components/alarmTypes/alarmWorker'
			}
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
		goToManualReport(){
			uni.navigateTo({
				url: '/pages/alarm/components/alarmTypes/modules/manualReport'
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.alarm-worker-container {
	width: 100%;
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

// 按钮
.manual-report-btn {
	width: 100%;
	margin-top: 20rpx;
	padding: 20rpx 0;
	border: 2rpx solid #5a9cf8;
	border-radius: 12rpx;
	background-color: #ffffff;
	color: #5a9cf8;
	font-size: 32rpx;
	font-weight: 500;
	text-align: center;
	box-sizing: border-box;
	cursor: pointer;

	// 点击态反馈（可选）
	&:active {
		opacity: 0.7;
	}
}
</style>
