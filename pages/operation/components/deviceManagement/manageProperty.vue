<template>
	<view :class="themeClass" class="manage-property-container">
		<DevicePropertyCenter :initialTab="currentTab" @change="onTabChange" />
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

</style>
