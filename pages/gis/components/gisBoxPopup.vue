<!-- GIS 地图：配电箱 / 专变 点击弹窗
     标题为设备名称，底部三个按钮：查看详情（跳转状态操作对应详情界面）/ 修改定位 / 路线导航 -->
<template>
	<view v-if="visible" class="popup-mask" @click="onMaskClick">
		<view class="popup-container" @click.stop>
			<!-- 设备名称 -->
			<view class="popup-header">
				<text class="popup-title">{{ name || '-' }}</text>
				<uni-icons :color="iconColor" class="close-icon" size="26" type="closeempty" @click="$emit('close')" />
			</view>

			<!-- 底部操作按钮 -->
			<view class="popup-footer">
				<button class="footer-btn primary" @click="$emit('detail')">查看详情</button>
				<button class="footer-btn primary" @click="$emit('modify-location')">修改定位</button>
				<button class="footer-btn primary" @click="$emit('navigation')">路线导航</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'GisBoxPopup',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		// 设备名称（配电箱 / 专变）
		name: {
			type: String,
			default: ''
		}
	},
	computed: {
		iconColor() {
			return this.isDarkMode ? '#8b94a8' : '#999999';
		}
	},
	methods: {
		onMaskClick() {
			this.$emit('close');
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
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--popup-mask, rgba(0, 0, 0, 0.5));
}

.popup-container {
	width: 86%;
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	overflow: hidden;
}

/* ==================== 头部：设备名称 ==================== */
.popup-header {
	position: relative;
	padding: 40rpx 100rpx 34rpx;
	border-bottom: 1rpx solid var(--border-color, #f0f0f0);
}

.popup-title {
	display: block;
	font-size: 34rpx;
	font-weight: 600;
	color: var(--text-primary, #1d2129);
	text-align: center;
	word-break: break-all;
}

.close-icon {
	position: absolute;
	right: 26rpx;
	top: 30rpx;
}

/* ==================== 底部按钮 ==================== */
.popup-footer {
	display: flex;
	justify-content: space-between;
	padding: 34rpx 26rpx 40rpx;
	gap: 16rpx;
}

.footer-btn {
	flex: 1;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0;
	margin: 0;
	font-size: 26rpx;
	border-radius: 8rpx;
	border: none;

	&::after {
		border: none;
	}

	&.primary {
		background-color: var(--color-primary, #3a7bf7);
		color: #ffffff;
	}
}
</style>
