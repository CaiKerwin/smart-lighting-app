<!-- 设置自动校时参数弹窗：填写允许校时的偏差值后下发 setClockArgs 指令 -->
<template>
	<transition name="cmd-pop">
		<view v-if="visible" class="cmd-popup">
			<!-- 半透明遮罩 -->
			<view class="cmd-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="cmd-card">
				<view class="cmd-header">
					<text class="cmd-title">设置自动校时参数</text>
				</view>

				<view class="cmd-body">
					<input v-model="value" class="value-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="number" />
					<text class="field-tip">自动校时，0-禁止，1-255允许校时的偏差值</text>
				</view>

				<!-- 取消 / 确定 -->
				<view class="cmd-footer">
					<button class="cmd-btn" @click="close">取消</button>
					<button class="cmd-btn primary" @click="confirm">确定</button>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
	export default {
		name: 'SetTimeParamsPopup',
		props: {
			visible: { type: Boolean, default: false }
		},
		data() {
			return {
				value: '' // 自动校时偏差值（0 禁止，1-255 允许校时）
			};
		},
		watch: {
			// 每次打开清空输入
			visible(val) {
				if (val) this.value = '';
			}
		},
		methods: {
			close() {
				this.$emit('close');
			},
			confirm() {
				const text = String(this.value === null || this.value === undefined ? '' : this.value).trim();
				if (!text) {
					uni.showToast({ title: '请输入自动校时参数', icon: 'none' });
					return;
				}
				// 仅接受 0-255 的整数
				if (!/^\d+$/.test(text) || Number(text) > 255) {
					uni.showToast({ title: '请输入0-255之间的整数', icon: 'none' });
					return;
				}
				this.$emit('confirm', { auto: Number(text) });
			}
		}
	};
</script>

<style lang="scss" scoped>
	.cmd-pop-enter-active,
	.cmd-pop-leave-active {
		transition: opacity 0.2s ease;
	}

	.cmd-pop-enter-active .cmd-card,
	.cmd-pop-leave-active .cmd-card {
		transition: opacity 0.2s ease, transform 0.2s ease;
	}

	.cmd-pop-enter,
	.cmd-pop-leave-to {
		opacity: 0;
	}

	.cmd-pop-enter .cmd-card,
	.cmd-pop-leave-to .cmd-card {
		opacity: 0;
		transform: scale(0.92);
	}

	.cmd-popup {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 99;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cmd-mask {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background: rgba(0, 0, 0, 0.5);
	}

	.cmd-card {
		position: relative;
		width: 620rpx;
		max-width: 86%;
		box-sizing: border-box;
		padding: 0 32rpx 32rpx;
		background: var(--bg-card, #ffffff);
		border-radius: 24rpx;
		box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
	}

	.cmd-header {
		height: 108rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cmd-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--text-primary, #333333);
	}

	.cmd-body {
		padding: 8rpx 0 44rpx;
	}

	.value-input {
		height: 76rpx;
		padding: 0 20rpx;
		box-sizing: border-box;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		background: var(--bg-soft, #f2f4f8);
		border: 1rpx solid var(--border-color, #e5e5e5);
		border-radius: 8rpx;
	}

	.field-tip {
		display: block;
		margin-top: 16rpx;
		font-size: 24rpx;
		color: var(--text-quaternary, #999999);
	}

	.cmd-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 40rpx;
	}

	.cmd-btn {
		flex: 1;
		height: 84rpx;
		line-height: 80rpx;
		font-size: 30rpx;
		border-radius: 12rpx;
		margin: 0;
		padding: 0;
		text-align: center;
		box-sizing: border-box;
		background-color: transparent;
		color: #3a7bf7;
		border: 2rpx solid #3a7bf7;

		&::after {
			border: none;
		}

		&.primary {
			margin-left: 40rpx;
			background-color: #3a7bf7;
			color: #ffffff;
			border: none;
			line-height: 84rpx;
		}
	}
</style>
