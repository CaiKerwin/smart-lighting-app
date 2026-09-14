<!-- 指令弹窗通用滑动条：实心（亮度/延时）与渐变（色温 暖→冷）两种轨道 -->
<template>
	<view
		class="light-slider"
		@touchcancel="onTouchEnd"
		@touchend="onTouchEnd"
		@touchstart="onTouchStart"
		@touchmove.stop.prevent="onTouchMove"
	>
		<!-- 轨道 -->
		<view :class="['slider-track', variant === 'gradient' ? 'track-gradient' : 'track-solid']">
			<!-- 实心轨道：左半部分为已填充 -->
			<view v-if="variant !== 'gradient'" :style="{ width: percent + '%' }" class="slider-fill"></view>
		</view>
		<!-- 滑块（白圈 + 蓝色圆点） -->
		<view :style="{ left: percent + '%' }" class="slider-thumb">
			<view class="thumb-core"></view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'LightSlider',
		props: {
			// 当前值（受控：由父组件通过 input 事件回写）
			value: { type: Number, default: 0 },
			min: { type: Number, default: 0 },
			max: { type: Number, default: 100 },
			step: { type: Number, default: 1 },
			// solid：蓝色填充轨道；gradient：整条渐变轨道（色温）
			variant: { type: String, default: 'solid' }
		},
		data() {
			return {
				trackLeft: 0,    // 轨道左边界（px，屏幕坐标）
				trackWidth: 0,   // 轨道宽度（px）
				dragging: false
			};
		},
		computed: {
			// 当前值对应的百分比位置
			percent() {
				const range = this.max - this.min;
				if (range <= 0) return 0;
				const p = ((Number(this.value) - this.min) / range) * 100;
				return Math.min(100, Math.max(0, p));
			}
		},
		mounted() {
			// 弹窗内组件为 v-if 渲染，挂载后即可量取轨道尺寸
			this.$nextTick(() => this.measure());
		},
		methods: {
			// 量取轨道位置与宽度（用于把触摸横坐标换算成值）
			measure(callback) {
				const query = uni.createSelectorQuery().in(this);
				query.select('.slider-track').boundingClientRect(rect => {
					if (rect && rect.width) {
						this.trackLeft = rect.left;
						this.trackWidth = rect.width;
					}
					if (callback) callback();
				}).exec();
			},
			// 取触摸点横坐标（兼容小程序 / H5）
			touchX(e) {
				const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e.detail || {};
				if (t.clientX !== undefined && t.clientX !== null) return t.clientX;
				if (t.pageX !== undefined && t.pageX !== null) return t.pageX;
				return t.x;
			},
			onTouchStart(e) {
				this.dragging = true;
				if (this.trackWidth) {
					this.updateByTouch(e);
				} else {
					// 首次未量到尺寸时，先量取再换算
					this.measure(() => this.updateByTouch(e));
				}
			},
			onTouchMove(e) {
				if (!this.dragging) return;
				this.updateByTouch(e);
			},
			onTouchEnd(e) {
				if (!this.dragging) return;
				this.dragging = false;
				this.updateByTouch(e);
				this.$emit('change', Number(this.value));
			},
			// 触摸位置 → 值（按 step 取整并夹在 min~max 之间）
			updateByTouch(e) {
				if (!this.trackWidth) return;
				const x = this.touchX(e);
				if (x === undefined || x === null) return;
				const ratio = Math.min(1, Math.max(0, (x - this.trackLeft) / this.trackWidth));
				const raw = this.min + ratio * (this.max - this.min);
				let next = Math.round(raw / this.step) * this.step;
				next = Math.min(this.max, Math.max(this.min, next));
				if (next !== Number(this.value)) this.$emit('input', next);
			}
		}
	};
</script>

<style lang="scss" scoped>
	.light-slider {
		position: relative;
		flex: 1;
		min-width: 0;
		height: 60rpx;
		display: flex;
		align-items: center;
	}

	.slider-track {
		position: relative;
		width: 100%;
		height: 20rpx;
		border-radius: 10rpx;
		overflow: hidden;
	}

	.track-solid {
		background-color: var(--slider-track, #e4ebf7);
		transition: background-color 0.3s ease;
	}

	.slider-fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background-color: var(--color-primary, #3a7bf7);
		border-radius: 10rpx;
	}

	.slider-thumb {
		position: absolute;
		top: 50%;
		width: 46rpx;
		height: 46rpx;
		margin-top: -23rpx;
		margin-left: -23rpx;
		border-radius: 50%;
		background-color: var(--bg-card, #ffffff);
		box-shadow: 0 0 0 8rpx var(--slider-thumb-ring, rgba(58, 123, 247, 0.14)),
		0 2rpx 8rpx rgba(0, 0, 0, 0.18);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.thumb-core {
		width: 26rpx;
		height: 26rpx;
		border-radius: 50%;
		background-color: var(--color-primary, #3a7bf7);
	}
</style>
