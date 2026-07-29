<template>
	<view class="alarm-offline-container">
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
			tab: '离线报警'
		};

	}
}
</script>

<style lang="scss">

</style>
