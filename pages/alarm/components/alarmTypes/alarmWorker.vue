<template>
	<view class="alarm-worker-container">
		<AlarmCenter :initialTab="tab" />
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
			tab: '人工报障'
		};
	}
}
</script>

<style lang="scss">

</style>
