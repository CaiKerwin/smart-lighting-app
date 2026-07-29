<template>
	<view class="alarm-exception-container">
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
			tab: '线路供电异常报警'
		};
	}
}
</script>

<style lang="scss">

</style>
