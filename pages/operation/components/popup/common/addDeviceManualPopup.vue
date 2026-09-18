<template>
	<view v-if="visible" class="popup-mask" @click="onMaskClick">
		<view class="popup-panel" @click.stop>
			<!-- 关闭按钮 -->
			<view class="close-btn" @click="onCancel">
				<uni-icons color="#909399" size="24" type="closeempty" />
			</view>

			<!-- 标题 -->
			<view class="popup-title">添加设备</view>

			<!-- 输入区域 -->
			<view class="input-row">
				<text class="input-label">设备ID</text>
				<input v-model="deviceId" class="device-input" maxlength="8" placeholder="输入8位设备ID"
				       placeholder-class="placeholder" type="text"
				       @input="onInput" />
			</view>

			<!-- 提示 / 错误信息 -->
			<view :class="{ error: errorMsg }" class="tip-text">
				{{ errorMsg || '设备ID长度8位,由大写字母和数字组成。' }}
			</view>

			<!-- 确定按钮 -->
			<button class="confirm-btn" @click="onConfirm">确定</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'AddDeviceManualPopup',
	data() {
		return {
			visible: false,
			deviceId: '',
			errorMsg: ''
		};
	},
	methods: {
		open() {
			this.visible = true;
			this.deviceId = '';
			this.errorMsg = '';
		},
		close() {
			this.visible = false;
		},
		onMaskClick() {
			this.close();
		},
		onInput(e) {
			// 只允许输入大写字母和数字
			let val = (e.detail.value || '').replace(/[^A-Z0-9]/g, '');
			this.deviceId = val;
			// 输入时清除错误提示
			this.errorMsg = '';
		},
		onCancel() {
			this.close();
			this.$emit('cancel');
		},
		onConfirm() {
			// 校验：8位，由大写字母和数字组成
			const reg = /^[A-Z0-9]{8}$/;
			if (!reg.test(this.deviceId)) {
				this.errorMsg = '设备ID长度8位，由大写字母和数字组成。';
				return;
			}
			this.errorMsg = '';
			this.$emit('confirm', this.deviceId);
			this.close();
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
	background: var(--popup-mask, rgba(0, 0, 0, 0.45));
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-panel {
	width: 86%;
	max-width: 620rpx;
	background: var(--bg-card, #fff);
	border-radius: 20rpx;
	padding: 40rpx 40rpx 40rpx;
	position: relative;
	box-sizing: border-box;
}

.close-btn {
	position: absolute;
	top: 20rpx;
	right: 20rpx;
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-title {
	text-align: center;
	font-size: 34rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-bottom: 40rpx;
}

.input-row {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;

	.input-label {
		width: 130rpx;
		font-size: 30rpx;
		color: var(--text-primary, #333);
		flex-shrink: 0;
	}

	.device-input {
		flex: 1;
		min-width: 0;
		height: 80rpx;
		padding: 0 24rpx;
		background: var(--bg-soft, #f0f2f5);
		border: 1px solid var(--border-color, #e4e7ed);
		border-radius: 10rpx;
		font-size: 30rpx;
		color: var(--text-primary, #333);
		box-sizing: border-box;

		.placeholder { color: var(--text-quaternary, #c0c4cc); }
	}
}

.tip-text {
	font-size: 24rpx;
	color: var(--text-tertiary, #909399);
	line-height: 1.5;
	margin-bottom: 40rpx;
	padding-left: 130rpx;

	&.error {
		color: var(--color-error, #ff4d4f);
	}
}

.confirm-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	background: var(--color-primary, #3b7cff);
	color: #fff;
	font-size: 32rpx;
	border-radius: 12rpx;
	border: none;
	padding: 0;
}
</style>
