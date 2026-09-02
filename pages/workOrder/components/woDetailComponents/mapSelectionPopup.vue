<template>
	<uni-popup ref="popup" :class="themeClass" :mask-click="true" type="bottom">
		<view class="map-popup">
			<!-- 头部 -->
			<view class="popup-header">
				<text class="popup-title">选择导航地图</text>
			</view>

			<!-- 地图选项 -->
			<view class="map-grid">
				<view class="map-item" @click="selectMap('百度地图')">
					<image class="map-logo" mode="aspectFit" src="/static/workOrder/baidu-map.png" />
					<text class="map-name">百度地图</text>
				</view>
				<view class="map-item" @click="selectMap('高德地图')">
					<image class="map-logo" mode="aspectFit" src="/static/workOrder/amap.png" />
					<text class="map-name">高德地图</text>
				</view>
				<view class="map-item" @click="selectMap('腾讯地图')">
					<image class="map-logo" mode="aspectFit" src="/static/workOrder/tencent-map.png" />
					<text class="map-name">腾讯地图</text>
				</view>
				<view class="map-item" @click="selectMap('谷歌地图')">
					<image class="map-logo" mode="aspectFit" src="/static/workOrder/google-map.png" />
					<text class="map-name">谷歌地图</text>
				</view>
			</view>

			<!-- 取消按钮 -->
			<button class="cancel-btn" @click="cancelSelection">取消</button>
		</view>
	</uni-popup>
</template>

<script>
export default {
	name: 'MapSelectionPopup',
	methods: {
		// 供父组件调用的打开方法
		open() {
			this.$refs.popup.open();
		},
		// 选择地图
		selectMap(mapName) {
			this.$emit('select', mapName);
		},
		// 取消选择
		cancelSelection() {
			this.$emit('cancel');
			this.$refs.popup.close();
		}
	}
}
</script>

<style lang="scss" scoped>
.map-popup {
	width: 100%;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx 24rpx 0 0 ;
	padding: 40rpx 32rpx 32rpx 32rpx;
	box-sizing: border-box;

	.popup-header {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 30rpx;

		.popup-title {
			font-size: 34rpx;
			font-weight: 600;
			color: var(--text-primary, #1d2129);
		}
	}

	.map-grid {
		display: flex;
		flex-wrap: nowrap;
		justify-content: space-between;
		padding: 10rpx 10rpx 20rpx 10rpx;

		.map-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 40rpx;
			padding: 20rpx 0;
			border-radius: 16rpx;
			transition: background 0.2s;

			&:active { background: var(--bg-soft, #f5f7fa); }

			.map-logo {
				width: 100rpx;
				height: 100rpx;
				border-radius: 20rpx;
			}
			.map-name {
				font-size: 28rpx;
				color: var(--text-primary, #1d2129);
				margin-top: 16rpx;
			}
		}
	}

	.cancel-btn {
		margin-top: 10rpx;
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: var(--bg-card, #ffffff);
		color: #2b6df6;
		font-size: 32rpx;
		border-radius: 16rpx;
		border: 2rpx solid #2b6df6;
		&::after { border: none; }
	}
}
</style>
