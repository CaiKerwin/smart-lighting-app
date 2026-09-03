<template>
	<view class="operation-container">
		<!-- 底部导航 -->
		<TabBar :current="1" />
	</view>
</template>

<script>
import TabBar from "@/components/tabBar.vue";

export default {
	name: 'Operation',
	components: {TabBar},
	data() {
		return {};
	}
}
</script>

<style lang="scss" scoped>

</style>
