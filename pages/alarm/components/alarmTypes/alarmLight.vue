<template>
	<view class="alarm-light-container">
		<AlarmCenter :initial-tab="tab" />
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
			tab: '单灯报警'
		};
	}
}
</script>

<style lang="scss">

</style>
