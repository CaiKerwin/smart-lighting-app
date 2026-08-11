<template>
	<uni-popup ref="popup" :mask-click="true" type="bottom">
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

			// #ifdef H5
			this.openWebMap(mapName);
			// #endif

			// #ifdef APP-PLUS
			this.openAppMap(mapName);
			// #endif
			// this.$refs.popup.close(); // 点击选择后关闭弹窗
		},
		/* ---------- H5 端：打开地图官网 ---------- */
		openWebMap(mapName) {
			const webUrls = {
				'百度地图': 'https://map.baidu.com',
				'高德地图': 'https://www.amap.com',
				'腾讯地图': 'https://map.qq.com',
				'谷歌地图': 'https://www.google.com/maps'
			};
			const url = webUrls[mapName];
			if (url) {
				window.open(url, '_blank');
			} else {
				uni.showToast({ title: '暂不支持该地图', icon: 'none' });
			}
		},

		/* ---------- App 端：检测并打开地图 APP（首页） ---------- */
		openAppMap(mapName) {
			// 定义各大地图的包名（Android）和 URL Scheme（iOS/Android 通用）
			const mapConfig = {
				'百度地图': {
					pname: 'com.baidu.BaiduMap',
					iosUrl: 'baidumap://',          // 打开 APP 首页
					androidUrl: 'baidumap://'      // 同样，部分 Android 也支持 scheme
				},
				'高德地图': {
					pname: 'com.autonavi.minimap',
					iosUrl: 'iosamap://',
					androidUrl: 'androidamap://'
				},
				'腾讯地图': {
					pname: 'com.tencent.map',
					iosUrl: 'qqmap://',
					androidUrl: 'qqmap://'
				},
				'谷歌地图': {
					pname: 'com.google.android.apps.maps',
					iosUrl: 'comgooglemaps://',
					androidUrl: 'comgooglemaps://'
				}
			};

			const config = mapConfig[mapName];
			if (!config) {
				uni.showToast({ title: '暂不支持该地图', icon: 'none' });
				return;
			}

			const systemInfo = uni.getSystemInfoSync();
			const isAndroid = systemInfo.platform === 'android';
			const url = isAndroid ? config.androidUrl : config.iosUrl;

			// Android 使用 plus.runtime.checkApplication 检测包名
			if (isAndroid) {
				plus.runtime.checkApplication({
					pname: config.pname,
					action: url
				}, (result) => {
					if (result) {
						// 已安装，直接打开
						plus.runtime.openURL(url, (err) => {
							uni.showToast({ title: '打开地图失败', icon: 'none' });
							console.error('打开地图失败', err.message);
						});
					} else {
						uni.showModal({
							title: '提示',
							content: `未安装 ${mapName}，请前往应用商店安装`,
							showCancel: false
						});
					}
				});
			} else {
				// iOS 直接尝试打开，失败则提示（因 iOS 无法有效检测，只能尝试）
				plus.runtime.openURL(url, (err) => {
					uni.showModal({
						title: '提示',
						content: `未安装 ${mapName} 或无法调起，请检查是否已安装`,
						showCancel: false
					});
					console.error('打开地图失败', err.message);
				});
			}
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
	background: #ffffff;
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
			color: #1d2129;
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

			&:active { background: #f5f7fa; }

			.map-logo {
				width: 100rpx;
				height: 100rpx;
				border-radius: 20rpx;
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
