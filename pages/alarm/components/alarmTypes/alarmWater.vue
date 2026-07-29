<template>
	<view class="alarm-water-container">
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
			tab: '水浸报警'
		};
	}
}
</script>

<style lang="scss">

</style>
