<template>
	<view v-if="visible" class="popup-mask">
		<view class="popup-container">
			<!-- 头部 -->
			<view class="popup-header">
				<text class="popup-title">详细信息</text>
				<uni-icons class="close-icon" color="#999" size="24" type="closeempty" @click="$emit('close')" />
			</view>

			<!-- 滚动内容区 -->
			<scroll-view class="popup-body" scroll-y>
				<view class="detail-grid">
					<!-- 名称 / ID -->
					<view class="detail-item">
						<text class="detail-label">名称</text>
						<view class="detail-value">{{ lightInfo.name || '-' }}</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">ID</text>
						<view class="detail-value">{{ lightInfo.id || '-' }}</view>
					</view>

					<!-- 通道 / 在线 -->
					<view class="detail-item">
						<text class="detail-label">通道</text>
						<view class="detail-value">{{ lightInfo.channelName || '-' }}</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">在线</text>
						<view class="detail-value">{{ lightInfo.onlineText || '-' }}</view>
					</view>

					<!-- 电压 / 电流 -->
					<view class="detail-item">
						<text class="detail-label">电压</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.voltage || '-' }}</text>
							<text class="unit">V</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">电流</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.ampere || '-' }}</text>
							<text class="unit">A</text>
						</view>
					</view>

					<!-- 功率 / 亮度 -->
					<view class="detail-item">
						<text class="detail-label">功率</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.power || '-' }}</text>
							<text class="unit">W</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">亮度</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.brightness || '-' }}</text>
							<text class="unit">%</text>
						</view>
					</view>

					<!-- 色温 / 温度 -->
					<view class="detail-item">
						<text class="detail-label">色温</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.colorTemp || '-' }}</text>
							<text class="unit">K</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">温度</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.temp || '-' }}</text>
							<text class="unit">℃</text>
						</view>
					</view>

					<!-- 电能 / 开灯时长 -->
					<view class="detail-item">
						<text class="detail-label">电能</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.energy || '-' }}</text>
							<text class="unit">kWh</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">开灯时长</text>
						<view class="detail-value" @click="$emit('click-duration')">
							<text class="value-text">{{ lightInfo.duration || '-' }}</text>
							<text class="unit">分钟</text>
						</view>
					</view>

					<!-- 所属灯杆 -->
					<view class="detail-item full-width">
						<text class="detail-label">所属灯杆</text>
						<view class="detail-value pole-value">
							<text>{{ lightInfo.poleName || '-' }}</text>
							<uni-icons class="location-icon" color="#3a7bf7" size="22" type="location" />
						</view>
					</view>

					<!-- 漏电电流 -->
					<view class="detail-item full-width">
						<text class="detail-label">漏电电流</text>
						<view class="detail-value">
							<text class="value-text">{{ lightInfo.leakageCurrent || '-' }}</text>
							<text class="unit">mA</text>
						</view>
					</view>

					<!-- 最后通讯时间 -->
					<view class="detail-item full-width">
						<text class="detail-label">最后通讯时间</text>
						<view class="detail-value">{{ lightInfo.lastCommTime || '-' }}</view>
					</view>
				</view>
			</scroll-view>

			<!-- 底部按钮区 -->
			<view class="popup-footer">
				<button class="footer-btn primary" @click="$emit('click-image')">图片</button>
				<button class="footer-btn primary" @click="$emit('click-location')">修改定位</button>
				<button class="footer-btn primary" @click="$emit('click-navigation')">路线导航</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'LightInfoPopup',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		lightInfo: {
			type: Object,
			default: () => ({})
		}
	}
};
</script>

<style lang="scss" scoped>
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-container {
	width: 92%;
	max-height: 90vh;
	background-color: #ffffff;
	border-radius: 20rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.popup-header {
	position: relative;
	padding: 30rpx 0;
	text-align: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.close-icon {
	position: absolute;
	right: 30rpx;
	top: 50%;
	transform: translateY(-50%);
}

.popup-body {
	flex: 1;
	padding: 30rpx;
	box-sizing: border-box;
}

.detail-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.detail-item {
	width: 48%;
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;

	&.full-width {
		width: 100%;
	}
}

.detail-label {
	width: 140rpx;
	font-size: 28rpx;
	color: #666;
	flex-shrink: 0;
}

.detail-value {
	flex: 1;
	min-width: 0; // 允许内容收缩，避免撑破容器
	background-color: #f5f6fa;
	border-radius: 8rpx;
	padding: 16rpx 20rpx;
	font-size: 24rpx;
	color: #333;
	display: flex;
	align-items: center;
	min-height: 40rpx;
	word-break: break-all; // 文本过长自动换行
	white-space: pre-line; // 多通道数据（\n 连接）按行显示

	.value-text {
		flex: 1;
		min-width: 0;
	}

	.unit {
		flex-shrink: 0;
		margin-left: auto;
		padding-left: 12rpx;
		font-size: 24rpx;
		color: #999;
	}
}

.pole-value {
	justify-content: space-between;
}

.popup-footer {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 30rpx 40rpx;
	background-color: #fff;
	gap: 20rpx;
}

.footer-btn {
	flex: 1;
	font-size: 28rpx;
	border-radius: 8rpx;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0;
	margin: 0;
	border: none;

	&.primary {
		background-color: #3a7bf7;
		color: #fff;
	}
}
</style>
