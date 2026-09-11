<!-- 单灯指令弹窗：开灯/关灯（通道勾选 + 延时）、调光（各通道亮度）、调色（各通道亮度 + 色温） -->
<template>
	<transition name="cmd-pop">
		<view v-if="visible" class="cmd-popup">
			<!-- 半透明遮罩 -->
			<view class="cmd-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="cmd-card">
				<!-- 标题栏 -->
				<view class="cmd-header">
					<text class="cmd-title">{{ title }}</text>
					<view class="cmd-close" hover-class="cmd-close-hover" @click="close">
						<uni-icons color="#999999" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 内容区（高度按内容计算，超出后滚动） -->
				<scroll-view :style="{ height: bodyHeight }" class="cmd-body" scroll-y>
					<!-- 调光 / 调色：各通道亮度 -->
					<block v-if="mode !== 'switch'">
						<view v-for="ch in channels" :key="ch.channel" class="param-item">
							<view class="param-head">
								<text class="param-label">{{ ch.name }}亮度</text>
								<text class="param-value">{{ brights[ch.channel] }}</text>
							</view>
							<view class="param-slider">
								<text class="slider-edge">0</text>
								<light-slider :max="100" :value="brights[ch.channel]" @input="onBrightInput(ch.channel, $event)" />
								<text class="slider-edge">100</text>
							</view>
						</view>

						<!-- 调色：各通道色温（暖 → 冷） -->
						<view v-if="mode === 'color'">
							<view class="param-divider"></view>
							<view v-for="ch in channels" :key="ch.channel" class="param-item">
								<view class="param-head">
									<text class="param-label">{{ ch.name }}色温</text>
									<text class="param-value">{{ colors[ch.channel] }}</text>
								</view>
								<view class="param-slider">
									<text class="slider-edge edge-warm">暖</text>
									<light-slider :max="100" :value="colors[ch.channel]" variant="gradient" @input="onColorInput(ch.channel, $event)" />
									<text class="slider-edge edge-cold">冷</text>
								</view>
							</view>
						</view>
					</block>

					<!-- 延时到（行内步进器 + 滑块，单位：分钟，上限 600） -->
					<view class="delay-block">
						<view class="delay-row">
							<text class="delay-label">延时到: {{ delayText }}</text>
							<view class="delay-stepper">
								<view class="stepper-btn" hover-class="stepper-btn-hover" @click="changeDelay(-1)">
									<text class="stepper-sign">−</text>
								</view>
								<input
									:value="delayInput"
									class="stepper-input"
									type="number"
									@blur="onDelayBlur"
									@input="onDelayInput"
								/>
								<view class="stepper-btn" hover-class="stepper-btn-hover" @click="changeDelay(1)">
									<text class="stepper-sign">+</text>
								</view>
							</view>
						</view>
						<view class="param-slider">
							<text class="slider-edge">0</text>
							<light-slider :max="600" :value="delayMinutes" @input="setDelay" />
							<text class="slider-edge">600</text>
						</view>
					</view>

					<!-- 开灯 / 关灯：通道勾选（默认全选） -->
					<view v-if="mode === 'switch'" class="channel-row">
						<view class="channel-item" @click="toggleAll">
							<text class="channel-text">全选</text>
							<checkbox :checked="isAllChecked" color="#3a7bf7" @click.stop="toggleAll" />
						</view>
						<view v-for="ch in channels" :key="ch.channel" class="channel-item" @click="toggleChannel(ch.channel)">
							<text class="channel-text">{{ ch.name }}</text>
							<checkbox :checked="!!checked[ch.channel]" color="#3a7bf7" @click.stop="toggleChannel(ch.channel)" />
						</view>
					</view>
				</scroll-view>

				<!-- 设置 -->
				<view class="cmd-footer">
					<button class="cmd-btn primary" @click="confirm">设置</button>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
	import LightSlider from './lightSlider.vue';

	// 内容区高度估算（rpx）：按行数计算，超过上限则滚动
	const ITEM_HEIGHT = 120;    // 一行「标题 + 滑块」
	const DIVIDER_HEIGHT = 24;  // 亮度与色温之间的分隔线
	const DELAY_HEIGHT = 152;   // 延时区块
	const CHANNEL_HEIGHT = 60;  // 通道勾选行（开灯/关灯）
	const BODY_PADDING = 48;    // 内容区上下留白
	const BODY_MAX_HEIGHT = 1080;
	const DELAY_MAX = 600;      // 延时上限（分钟）
	const DELAY_DEFAULT = 60;   // 默认延时 1 小时

	export default {
		name: 'LightControlPopup',
		components: { LightSlider },
		props: {
			visible: { type: Boolean, default: false },
			// switch：开灯/关灯；bright：调光；color：调色
			mode: { type: String, default: 'switch' },
			title: { type: String, default: '开灯控制' },
			// 通道列表：[{ channel: 0, name: '一路' }]
			channels: { type: Array, default: () => [] },
			// switch 模式下的动作：on 开灯 / off 关灯
			action: { type: String, default: 'on' }
		},
		data() {
			return {
				baseTime: 0,        // 弹窗打开时刻（用于计算「延时到」）
				delayMinutes: DELAY_DEFAULT,
				delayInput: String(DELAY_DEFAULT),
				checked: {},        // 通道勾选状态（开灯/关灯）
				brights: {},        // 各通道亮度
				colors: {}          // 各通道色温
			};
		},
		computed: {
			// 「延时到」：当前时间 + 延时分钟数
			delayText() {
				const d = new Date((this.baseTime || Date.now()) + this.delayMinutes * 60000);
				return d.getHours() + '时' + d.getMinutes() + '分';
			},
			// 通道是否全部勾选
			isAllChecked() {
				const list = this.channels || [];
				if (!list.length) return false;
				return list.every(ch => !!this.checked[ch.channel]);
			},
			// 内容区高度
			bodyHeight() {
				const count = (this.channels || []).length;
				let height = BODY_PADDING;
				if (this.mode === 'switch') {
					height += DELAY_HEIGHT + CHANNEL_HEIGHT;
				} else {
					height += count * ITEM_HEIGHT + DELAY_HEIGHT;
					if (this.mode === 'color') height += count * ITEM_HEIGHT + DIVIDER_HEIGHT;
				}
				return Math.min(height, BODY_MAX_HEIGHT) + 'rpx';
			}
		},
		watch: {
			// 每次打开恢复原型默认值
			visible(val) {
				if (val) this.reset();
			},
			// 滑块/步进器改动后同步输入框显示
			delayMinutes(val) {
				this.delayInput = String(val);
			}
		},
		methods: {
			// 恢复默认值：延时 1 小时、通道全选、亮度 0（调光）/ 100（调色）、色温 100
			reset() {
				this.baseTime = Date.now();
				this.delayMinutes = DELAY_DEFAULT;
				this.delayInput = String(DELAY_DEFAULT);
				const checked = {};
				const brights = {};
				const colors = {};
				(this.channels || []).forEach(ch => {
					checked[ch.channel] = true;
					brights[ch.channel] = this.mode === 'color' ? 100 : 0;
					colors[ch.channel] = 100;
				});
				this.checked = checked;
				this.brights = brights;
				this.colors = colors;
			},
			close() {
				this.$emit('close');
			},
			// 延时步进（±1 分钟，夹在 0~600）
			changeDelay(delta) {
				this.setDelay(this.delayMinutes + delta);
			},
			setDelay(value) {
				const num = Number(value);
				if (isNaN(num)) return;
				this.delayMinutes = Math.min(DELAY_MAX, Math.max(0, Math.round(num)));
			},
			// 输入框输入（仅数字生效，失焦时回填）
			onDelayInput(e) {
				const text = e.detail ? e.detail.value : '';
				this.delayInput = text;
				const num = parseInt(text, 10);
				if (!isNaN(num)) {
					this.delayMinutes = Math.min(DELAY_MAX, Math.max(0, num));
				}
			},
			onDelayBlur() {
				this.delayInput = String(this.delayMinutes);
			},
			toggleAll() {
				const next = !this.isAllChecked;
				const checked = {};
				(this.channels || []).forEach(ch => {
					checked[ch.channel] = next;
				});
				this.checked = checked;
			},
			toggleChannel(channel) {
				this.$set(this.checked, channel, !this.checked[channel]);
			},
			onBrightInput(channel, value) {
				this.$set(this.brights, channel, value);
			},
			onColorInput(channel, value) {
				this.$set(this.colors, channel, value);
			},
			// 确认：向父组件抛出指令参数（携带 mode/action，父组件无需依赖弹窗状态）
			confirm() {
				if (this.mode === 'switch') {
					const channels = (this.channels || [])
						.filter(ch => !!this.checked[ch.channel])
						.map(ch => ch.channel);
					if (!channels.length) {
						uni.showToast({ title: '请选择要操作的通道', icon: 'none' });
						return;
					}
					this.$emit('confirm', {
						mode: 'switch',
						action: this.action,
						channels: channels,
						expireMinutes: this.delayMinutes
					});
					return;
				}
				const payload = {
					mode: this.mode,
					brights: this.brights,
					expireMinutes: this.delayMinutes
				};
				if (this.mode === 'color') payload.colors = this.colors;
				this.$emit('confirm', payload);
			}
		}
	};
</script>

<style lang="scss" scoped>
	/* 弹窗动画 */
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
		width: 640rpx;
		max-width: 88%;
		max-height: 84vh;
		box-sizing: border-box;
		padding: 0 32rpx 32rpx;
		background: var(--bg-card, #ffffff);
		border-radius: 24rpx;
		box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
		display: flex;
		flex-direction: column;
	}

	/* 标题栏 */
	.cmd-header {
		position: relative;
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-bottom: 1rpx solid var(--border-color, #e5e5e5);
	}

	.cmd-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--text-primary, #333333);
	}

	.cmd-close {
		position: absolute;
		right: -12rpx;
		top: 50%;
		margin-top: -30rpx;
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cmd-close-hover {
		opacity: 0.6;
	}

	/* 内容区 */
	.cmd-body {
		flex-shrink: 1;
		box-sizing: border-box;
		padding: 24rpx 0;
	}

	.param-item {
		margin-bottom: 16rpx;
	}

	.param-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 44rpx;
	}

	.param-label {
		font-size: 28rpx;
		color: var(--text-primary, #333333);
	}

	.param-value {
		font-size: 28rpx;
		color: var(--text-primary, #333333);
	}

	.param-slider {
		display: flex;
		align-items: center;
	}

	.slider-edge {
		font-size: 26rpx;
		color: var(--text-secondary, #666666);
		flex-shrink: 0;
		width: 52rpx;
		text-align: left;
	}

	.slider-edge:last-child {
		text-align: right;
	}

	.edge-warm {
		color: #e8722c;
	}

	.edge-cold {
		color: #3a7bf7;
	}

	.param-divider {
		height: 1rpx;
		margin: 8rpx 0 20rpx;
		background: var(--border-color, #e5e5e5);
	}

	/* 延时区块 */
	.delay-block {
		margin-top: 8rpx;
	}

	.delay-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 84rpx;
	}

	.delay-label {
		font-size: 28rpx;
		color: var(--text-primary, #333333);
	}

	.delay-stepper {
		display: flex;
		align-items: center;
	}

	.stepper-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stepper-btn-hover {
		opacity: 0.6;
	}

	.stepper-sign {
		font-size: 40rpx;
		line-height: 1;
		color: var(--text-secondary, #666666);
	}

	.stepper-input {
		width: 120rpx;
		height: 64rpx;
		margin: 0 8rpx;
		text-align: center;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		background: var(--bg-soft, #f2f4f8);
		border-radius: 10rpx;
	}

	/* 通道勾选行 */
	.channel-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		margin-top: 12rpx;
	}

	.channel-item {
		display: flex;
		align-items: center;
		padding: 8rpx 0;
	}

	.channel-text {
		font-size: 26rpx;
		color: var(--text-primary, #333333);
		margin-right: 4rpx;
	}

	.channel-item checkbox {
		transform: scale(0.8);
	}

	/* 底部按钮 */
	.cmd-footer {
		flex-shrink: 0;
		padding-top: 20rpx;
	}

	.cmd-btn {
		height: 88rpx;
		line-height: 88rpx;
		font-size: 32rpx;
		border-radius: 12rpx;
		margin: 0;
		padding: 0;
		text-align: center;
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
