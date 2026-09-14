<!-- 设置控制模式弹窗：选择通道后下发 setPlanType 指令 -->
<template>
	<transition name="cmd-pop">
		<view v-if="visible" class="cmd-popup">
			<!-- 半透明遮罩 -->
			<view class="cmd-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="cmd-card">
				<view class="cmd-header">
					<text class="cmd-title">设置控制模式</text>
				</view>

				<!-- 通道选择（普通弹出选择框） -->
				<view class="cmd-body">
					<view class="field-row">
						<text class="field-label">通道</text>
						<picker :range="channelLabels" :value="channelIndex" mode="selector" @change="onChannelChange">
							<view class="field-picker">
								<text class="field-text">{{ channelLabels[channelIndex] }}</text>
								<uni-icons color="#999999" size="14" type="bottom"></uni-icons>
							</view>
						</picker>
					</view>
				</view>

				<!-- 取消 / 设置 -->
				<view class="cmd-footer">
					<button class="cmd-btn" @click="close">取消</button>
					<button class="cmd-btn primary" @click="confirm">设置</button>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
	// 通道可选项：一路 ~ 四路
	const CHANNEL_OPTIONS = [
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 3, label: '3' },
		{ value: 4, label: '4' }
	];

	export default {
		name: 'CommandModePopup',
		props: {
			visible: { type: Boolean, default: false }
		},
		data() {
			return {
				channelIndex: 0,
				channelLabels: CHANNEL_OPTIONS.map(item => item.label)
			};
		},
		watch: {
			visible(val) {
				// 每次打开恢复默认通道（原型默认值 1）
				if (val) this.channelIndex = 0;
			}
		},
		methods: {
			close() {
				this.$emit('close');
			},
			onChannelChange(e) {
				this.channelIndex = Number(e.detail.value) || 0;
			},
			confirm() {
				const option = CHANNEL_OPTIONS[this.channelIndex] || CHANNEL_OPTIONS[0];
				this.$emit('confirm', { ch: option.value });
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
		padding: 8rpx 0 40rpx;
	}

	.field-row {
		display: flex;
		align-items: center;
		padding-left: 32rpx;
	}

	.field-label {
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		margin-right: 16rpx;
	}

	.field-picker {
		width: 200rpx;
		height: 70rpx;
		padding: 0 20rpx;
		box-sizing: border-box;
		background: var(--bg-soft, #f2f4f8);
		border-radius: 10rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.field-text {
		font-size: 28rpx;
		color: var(--text-primary, #333333);
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
		color: var(--color-primary, #3a7bf7);
		border: 2rpx solid var(--color-primary, #3a7bf7);
		transition: color 0.3s ease, border-color 0.3s ease, background-color 0.3s ease;

		&::after {
			border: none;
		}

		&.primary {
			margin-left: 40rpx;
			background-color: var(--color-primary, #3a7bf7);
			color: #ffffff;
			border: none;
			line-height: 84rpx;
		}
	}
</style>
