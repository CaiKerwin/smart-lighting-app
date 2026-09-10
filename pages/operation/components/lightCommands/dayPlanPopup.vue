<!-- 设置日表弹窗：勾选计时日表 / 准时日表后下发 setDayPlan1 / setDayPlan2 指令 -->
<template>
	<transition name="cmd-pop">
		<view v-if="visible" class="cmd-popup">
			<!-- 半透明遮罩 -->
			<view class="cmd-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="cmd-card">
				<view class="cmd-header">
					<text class="cmd-title">设置日表</text>
				</view>

				<view class="cmd-body">
					<view class="check-row">
						<view class="check-item" @click="timing = !timing">
							<checkbox :checked="timing" color="#3a7bf7" @click.stop="timing = !timing" />
							<text class="check-text">计时日表</text>
						</view>
						<view class="check-item" @click="onTime = !onTime">
							<checkbox :checked="onTime" color="#3a7bf7" @click.stop="onTime = !onTime" />
							<text class="check-text">准时日表</text>
						</view>
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
	export default {
		name: 'DayPlanPopup',
		props: {
			visible: { type: Boolean, default: false }
		},
		data() {
			return {
				timing: false,  // 计时日表（setDayPlan1）
				onTime: false   // 准时日表（setDayPlan2）
			};
		},
		watch: {
			// 每次打开恢复默认值（原型默认均未勾选）
			visible(val) {
				if (val) {
					this.timing = false;
					this.onTime = false;
				}
			}
		},
		methods: {
			close() {
				this.$emit('close');
			},
			confirm() {
				if (!this.timing && !this.onTime) {
					uni.showToast({ title: '请选择日表类型', icon: 'none' });
					return;
				}
				this.$emit('confirm', { timing: this.timing, onTime: this.onTime });
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
		z-index: 1000;
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

	.check-row {
		display: flex;
		align-items: center;
		justify-content: space-around;
	}

	.check-item {
		display: flex;
		align-items: center;
	}

	.check-text {
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		margin-left: 8rpx;
	}

	.check-item checkbox {
		transform: scale(0.9);
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
