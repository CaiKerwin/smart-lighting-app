<template>
	<view class="tab-bar">
		<view
			class="tab-item"
			v-for="(item, index) in tabs"
			:key="index"
			@click="switchTab(index)"
		>
			<image
				class="tab-icon"
				:src="current === index ? item.activeIcon : item.icon"
				mode="aspectFit"
			/>
			<text class="tab-label" :class="{ active: current === index }">
				{{ $t(item.labelKey) }}
			</text>
		</view>
	</view>
</template>

<script>
export default {
	name: "TabBar",
	props: {
		current: {
			type: Number,
			default: 0, // 0-首页，1-集中报警，2-工单维护
		},
	},
	data() {
		return {
			tabs: [
				{
					labelKey: "tabBar.home",
					icon: "/static/common/home.png",
					activeIcon: "/static/common/home-active.png",
					path: "/pages/index/index",
				},
				{
					labelKey: "tabBar.alarm",
					icon: "/static/common/alarm.png",
					activeIcon: "/static/common/alarm-active.png",
					path: "/pages/alarm/alarm",
				},
				{
					labelKey: "tabBar.workOrder",
					icon: "/static/common/workOrder.png",
					activeIcon: "/static/common/workOrder-active.png",
					path: "/pages/workOrder/workOrder",
				},
			],
		};
	},
	methods: {
		switchTab(index) {
			if (index === this.current) return;
			const { path } = this.tabs[index];
			uni.redirectTo({ url: path });
		},
	},
};
</script>

<style scoped>
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	justify-content: space-around;
	align-items: center;
	height: 100rpx;
	background-color: #ffffff;
	border-top: 1px solid #e5e5e5;
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	z-index: 999;
}

.tab-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	padding: 8rpx 0;
}

.tab-icon {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 4rpx;
}

.tab-label {
	font-size: 22rpx;
	color: #999999;
	transition: color 0.2s;
}

.tab-label.active {
	color: #007aff;
	font-weight: 500;
}
</style>
