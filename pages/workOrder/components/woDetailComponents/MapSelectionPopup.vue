<template>
	<uni-popup ref="popup" :mask-click="true" type="center">
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
		// 选择地图并抛出事件
		selectMap(name) {
			this.$emit('select', name);
			console.log('选择地图：', name)
			// this.$refs.popup.close(); // 点击选择后关闭弹窗
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
	width: 640rpx;
	background: #ffffff;
	border-radius: 24rpx;
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
			color: #1d2129;
		}
	}

	.map-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		padding: 10rpx 20rpx 20rpx 20rpx;

		.map-item {
			width: 45%;
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 40rpx;
			padding: 20rpx 0;
			border-radius: 16rpx;
			transition: background 0.2s;

			&:active { background: #f5f7fa; }

			.map-logo {
				width: 100rpx;
				height: 100rpx;
				border-radius: 20rpx;
				background: #f4f5f7;
			}
			.map-name {
				font-size: 28rpx;
				color: #1d2129;
				margin-top: 16rpx;
			}
		}
	}

	.cancel-btn {
		margin-top: 10rpx;
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: #ffffff;
		color: #2b6df6;
		font-size: 32rpx;
		border-radius: 16rpx;
		border: 2rpx solid #2b6df6;
		&::after { border: none; }
	}
}
</style>
