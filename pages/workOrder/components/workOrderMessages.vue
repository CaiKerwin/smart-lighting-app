<template>
	<view :class="themeClass" class="work-order-messages-container">
		<text class="work-order-messages-text">敬请期待</text>
	</view>
</template>

<script>
export default {
	data() {
		return {};
	}
}
</script>

<style lang="scss" scoped>
.work-order-messages-container {
	height: 100vh;
	width: 100%;
	margin: 0;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	.work-order-messages-text {
		text-align: center;
		font-size: 32rpx;
		color: var(--text-primary, #333333);
	}
}

</style>
