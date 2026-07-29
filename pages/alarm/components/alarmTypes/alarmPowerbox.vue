<template>
	<view class="alarm-powerbox-container">
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
			tab: '配电箱报警'
		};
	}
}
</script>

<style lang="scss">

</style>
