<template>
	<view :class="themeClass" class="search-float-btn" @click="handleClick">
		<uni-icons color="#ffffff" size="24" type="search"></uni-icons>
	</view>
</template>

<script>
export default {
	name: 'SearchFloatButton',
	methods: {
		// 点击悬浮按钮，由父组件打开搜索弹窗
		handleClick() {
			this.$emit('open');
		}
	}
}
</script>

<style lang="scss" scoped>
.search-float-btn {
	position: fixed;
	right: 24rpx;
	bottom: calc(160rpx + env(safe-area-inset-bottom));
	z-index: 998;

	width: 92rpx;
	height: 92rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: linear-gradient(135deg, #4f8bfd, #3880fc);
	color: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(56, 128, 252, 0.4);
}

/* #ifndef H5 || MP */
/* App 端 tabbar 高 100rpx 且贴底，间距 16rpx */
.search-float-btn {
	bottom: 116rpx;
	bottom: calc(116rpx + env(safe-area-inset-bottom));
}
/* #endif */
</style>
