<template>
	<view :class="themeClass" class="manage-property-container">
		<DevicePropertyCenter :initialTab="currentTab" @change="onTabChange" />
		<view class="property-center-container">
			<text>敬请期待</text>
		</view>
	</view>
</template>

<script>
import DevicePropertyCenter from "@/pages/operation/components/deviceManagement/components/devicePropertyCenter.vue";
export default {
	components: {
		DevicePropertyCenter
	},
	data() {
		return {
			currentTab: '总配电', // 默认选中第一项
		};
	},
	methods: {
		onTabChange(tab) {
			this.currentTab = tab;
		},
	},
}
</script>

<style lang="scss" scoped>
.manage-property-container {
	.property-center-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		font-size: 32rpx;
		color: var(--text-primary, #999999);
		background-color: var(--bg-card, #ffffff);
	}
}
</style>
