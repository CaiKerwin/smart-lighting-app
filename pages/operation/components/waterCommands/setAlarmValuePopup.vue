<!-- 设置报警阈值弹窗：填写水浸报警阈值参数后下发 setAlarmRange 指令 -->
<template>
	<transition name="cmd-pop">
		<view v-if="visible" class="cmd-popup">
			<!-- 半透明遮罩 -->
			<view class="cmd-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="cmd-card">
				<view class="cmd-header">
					<text class="cmd-title">设置报警阈值参数</text>
				</view>

				<view class="cmd-body">
					<!-- 外接电压（ah 上限 / al 下限） -->
					<view class="field-row">
						<text class="field-label">外接电压下限</text>
						<input v-model="al" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">V</text>
					</view>
					<view class="field-row">
						<text class="field-label">外接电压上限</text>
						<input v-model="ah" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">V</text>
					</view>

					<!-- 电池电压（dh 上限 / dl 下限） -->
					<view class="field-row">
						<text class="field-label">电池电压下限</text>
						<input v-model="dl" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">V</text>
					</view>
					<view class="field-row">
						<text class="field-label">电池电压上限</text>
						<input v-model="dh" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">V</text>
					</view>

					<!-- 报警限值（l1/l2/l3） -->
					<view class="field-row">
						<text class="field-label">报警一级限值</text>
						<input v-model="l1" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">mm</text>
					</view>
					<view class="field-row">
						<text class="field-label">报警二级限值</text>
						<input v-model="l2" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">mm</text>
					</view>
					<view class="field-row">
						<text class="field-label">报警三级限值</text>
						<input v-model="l3" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">mm</text>
					</view>

					<!-- 联动（flag：0 不联动 / 1 一级报警 / 2 二级报警 / 3 三级报警） -->
					<view class="field-row">
						<text class="field-label">联动</text>
						<picker :range="linkLabels" :value="linkIndex" class="field-picker" mode="selector" @change="onLinkChange">
							<view class="picker-inner">
								<text class="picker-text">{{ linkLabels[linkIndex] }}</text>
							</view>
						</picker>
					</view>

					<!-- 闭合 / 断开时长（on / off） -->
					<view class="field-row">
						<text class="field-label">闭合时长</text>
						<input v-model="onTime" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">秒</text>
					</view>
					<view class="field-row">
						<text class="field-label">断开时长</text>
						<input v-model="offTime" class="field-input" placeholder="输入" placeholder-style="font-size:28rpx;color:#b8bfcc;" type="digit" />
						<text class="field-unit">秒</text>
					</view>
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
	// 联动可选项：0 不联动 / 1 一级报警 / 2 二级报警 / 3 三级报警
	const LINK_OPTIONS = [
		{ value: 0, label: '不联动' },
		{ value: 1, label: '一级报警' },
		{ value: 2, label: '二级报警' },
		{ value: 3, label: '三级报警' }
	];

	// 各字段默认值（与原型一致）
	const DEFAULT_VALUES = {
		al: '10.8',
		ah: '15.0',
		dl: '10.8',
		dh: '15.0',
		l1: '10',
		l2: '15',
		l3: '25',
		onTime: '30',
		offTime: '60',
		linkIndex: 0
	};

	export default {
		name: 'SetAlarmValuePopup',
		props: {
			visible: { type: Boolean, default: false }
		},
		data() {
			return {
				al: DEFAULT_VALUES.al,          // 外接电压下限
				ah: DEFAULT_VALUES.ah,          // 外接电压上限
				dl: DEFAULT_VALUES.dl,          // 电池电压下限
				dh: DEFAULT_VALUES.dh,          // 电池电压上限
				l1: DEFAULT_VALUES.l1,          // 报警一级限值
				l2: DEFAULT_VALUES.l2,          // 报警二级限值
				l3: DEFAULT_VALUES.l3,          // 报警三级限值
				onTime: DEFAULT_VALUES.onTime,  // 闭合时长（秒）
				offTime: DEFAULT_VALUES.offTime, // 断开时长（秒）
				linkIndex: DEFAULT_VALUES.linkIndex,
				linkLabels: LINK_OPTIONS.map(item => item.label)
			};
		},
		watch: {
			// 每次打开恢复默认值
			visible(val) {
				if (val) this.resetForm();
			}
		},
		methods: {
			resetForm() {
				Object.keys(DEFAULT_VALUES).forEach(key => {
					this[key] = DEFAULT_VALUES[key];
				});
			},
			close() {
				this.$emit('close');
			},
			onLinkChange(e) {
				this.linkIndex = Number(e.detail.value) || 0;
			},
			// 校验并转换数值输入，返回 null 表示校验不通过（已提示）
			toNumber(raw, label) {
				const text = String(raw === null || raw === undefined ? '' : raw).trim();
				const num = Number(text);
				if (!text || isNaN(num)) {
					uni.showToast({ title: '请输入' + label, icon: 'none' });
					return null;
				}
				return num;
			},
			confirm() {
				const args = {
					ah: this.toNumber(this.ah, '外接电压上限'),
					al: this.toNumber(this.al, '外接电压下限'),
					dh: this.toNumber(this.dh, '电池电压上限'),
					dl: this.toNumber(this.dl, '电池电压下限'),
					flag: (LINK_OPTIONS[this.linkIndex] || LINK_OPTIONS[0]).value,
					l1: this.toNumber(this.l1, '报警一级限值'),
					l2: this.toNumber(this.l2, '报警二级限值'),
					l3: this.toNumber(this.l3, '报警三级限值'),
					off: this.toNumber(this.offTime, '断开时长'),
					on: this.toNumber(this.onTime, '闭合时长')
				};
				// 任一项校验未通过时 toNumber 已提示，直接中断
				for (const key of Object.keys(args)) {
					if (args[key] === null) return;
				}
				this.$emit('confirm', args);
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
		width: 660rpx;
		max-width: 92%;
		box-sizing: border-box;
		padding: 0 32rpx 32rpx;
		background: var(--bg-card, #ffffff);
		border-radius: 24rpx;
		box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
	}

	.cmd-header {
		height: 100rpx;
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
		padding: 4rpx 0 36rpx;
	}

	/* 表单行：标签 | 输入框 | 单位 */
	.field-row {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.field-label {
		width: 170rpx;
		flex-shrink: 0;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
	}

	.field-input {
		flex: 1;
		min-width: 0;
		height: 68rpx;
		padding: 0 16rpx;
		box-sizing: border-box;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		background: var(--bg-soft, #f2f4f8);
		border: 1rpx solid var(--border-color, #e5e5e5);
		border-radius: 8rpx;
	}

	.field-unit {
		width: 60rpx;
		flex-shrink: 0;
		margin-left: 12rpx;
		display: flex;
		align-items: center;
		font-size: 26rpx;
		color: var(--text-quaternary, #999999);
	}

	/* 联动选择框 */
	.field-picker {
		flex: 1;
		min-width: 0;
	}

	.picker-inner {
		height: 68rpx;
		padding: 0 16rpx;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		background: var(--bg-soft, #f2f4f8);
		border: 1rpx solid var(--border-color, #e5e5e5);
		border-radius: 8rpx;
	}

	.picker-text {
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
