<template>
	<transition name="scan-pop">
		<view v-if="visible" class="scan-popup" @touchmove.stop.prevent>
			<!-- 半透明遮罩 -->
			<view class="scan-mask" @click="handleCancel"></view>
			<!-- 弹窗卡片 -->
			<view class="scan-card" @click.stop>
				<!-- 顶部电脑终端图标 -->
				<img alt="电脑终端" class="scan-icon" src="/static/common/pc-terminal.png" />
				<!-- 标题 -->
				<view class="scan-title">{{ $t('scanLogin.confirmTitle') }}</view>
				<!-- 描述 -->
				<view class="scan-desc">{{ $t('scanLogin.confirmDesc') }}</view>
				<!-- 操作按钮 -->
				<view class="scan-actions">
					<view class="scan-btn-confirm" hover-class="scan-btn-confirm-hover" @click="handleConfirm">
						{{ $t('scanLogin.confirm') }}
					</view>
					<view class="scan-btn-cancel" hover-class="scan-btn-cancel-hover" @click="handleCancel">
						{{ $t('scanLogin.cancel') }}
					</view>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
export default {
	name: 'ScanConfirmPopup',
	props: {
		visible: { type: Boolean, default: false }
	},
	methods: {
		handleConfirm() {
			this.$emit('confirm');
		},
		handleCancel() {
			this.$emit('cancel');
		}
	}
}
</script>

<style scoped>
/* 弹窗动画 */
.scan-pop-enter-active,
.scan-pop-leave-active {
	transition: opacity 0.25s ease;
}
.scan-pop-enter-active .scan-card,
.scan-pop-leave-active .scan-card {
	transition: opacity 0.25s ease, transform 0.25s ease;
}
.scan-pop-enter,
.scan-pop-leave-to {
	opacity: 0;
}
.scan-pop-enter .scan-card,
.scan-pop-leave-to .scan-card {
	opacity: 0;
	transform: scale(0.9);
}

.scan-popup {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.scan-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.55);
}

.scan-card {
	position: relative;
	width: 600rpx;
	box-sizing: border-box;
	padding: 64rpx 48rpx 40rpx;
	background: #ffffff;
	border-radius: 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

/* 电脑端图标 */
.scan-icon {
	width: 150rpx;
	height: 150rpx;
	display: block;
}

.scan-title {
	margin-top: 32rpx;
	font-size: 36rpx;
	font-weight: 600;
	color: #1a1a1a;
	line-height: 1.4;
}

.scan-desc {
	margin-top: 16rpx;
	font-size: 28rpx;
	color: #999999;
	line-height: 1.5;
	text-align: center;
}

.scan-actions {
	width: 100%;
	margin-top: 56rpx;
}

/* 确认按钮 */
.scan-btn-confirm {
	width: 100%;
	height: 88rpx;
	border-radius: 12rpx;
	background: #3880FC;
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
}

.scan-btn-confirm-hover {
	background: #0948b6;
}

/* 取消按钮 */
.scan-btn-cancel {
	margin-top: 28rpx;
	text-align: center;
	color: #9a9a9a;
	font-size: 28rpx;
	padding: 12rpx 0;
}

.scan-btn-cancel-hover {
	opacity: 0.7;
}
</style>
