<template>
	<view :class="themeClass" class="page-wrapper">
		<TabBar :current="4" />
	</view>
</template>

<script>
import TabBar from "@/components/tabBar.vue";

export default {
	components: {TabBar},
	data() {
		return {};
	}
}
</script>

<style lang="scss" scoped>

</style>
