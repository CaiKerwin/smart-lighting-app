<!-- GIS 地图：水浸设备点击弹窗
     左侧水位计（满量程 30 cm），右侧基础水位 / 实际水位 / 测量水位 / 报警 / 速度，
     底部三个按钮：查看详情 / 修改定位 / 路线导航（与配电箱弹窗功能一致） -->
<template>
	<view v-if="visible" class="popup-mask" @click="onMaskClick">
		<view class="popup-container" @click.stop>
			<!-- 设备名称 -->
			<view class="popup-header">
				<text class="popup-title">{{ name || '-' }}</text>
				<uni-icons :color="iconColor" class="close-icon" size="26" type="closeempty" @click="$emit('close')" />
			</view>

			<!-- 水位计 + 数据 -->
			<view class="water-body">
				<!-- 左侧水位计刻度 -->
				<view class="gauge">
					<view class="gauge-labels">
						<text
							v-for="(mark, idx) in scaleMarks"
							:key="idx"
							:style="{ top: (2 + (idx / 6) * 96) + '%' }"
							class="scale-text"
						>
							{{ mark }}
						</text>
					</view>
					<view class="gauge-tube">
						<view
							v-for="(tick, idx) in tickMarks"
							:key="'tick' + idx"
							:class="{ 'tick-major': tick.major }"
							:style="{ top: tick.top + '%' }"
							class="tick"
						/>
						<view :class="{ 'is-alarm': alarm }" :style="{ height: waterHeight }" class="water-fill">
							<view class="water-wave" />
						</view>
					</view>
				</view>

				<!-- 右侧数据 -->
				<view class="water-data">
					<view class="data-row">
						<text class="row-label">基础水位</text>
						<text class="row-val">{{ baseText }}</text>
						<text :class="{ online: online }" class="row-status">{{ online ? '在线' : '离线' }}</text>
					</view>
					<view class="data-row">
						<text class="row-label">实际水位</text>
						<text class="row-val">{{ resultText }}</text>
					</view>
					<view class="data-row">
						<text class="row-label">测量水位</text>
						<text :class="{ 'is-alarm': alarm }" class="row-val highlight">{{ levelText }}</text>
					</view>
					<view class="data-row">
						<text class="row-label">报警</text>
						<text class="row-val">{{ alarm ? '是' : '否' }}</text>
					</view>
					<view class="data-row">
						<text class="row-label">速度</text>
						<text class="row-val">{{ speedText }}</text>
					</view>
				</view>
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
import { waterLevelText, waterGaugeRatio, formatMeasure } from '@/utils/gis';

// 水位计满量程（30 cm，与 Android 端 cupView.maxScale 一致）
const MAX_SCALE = 30;

export default {
	name: 'GisWaterPopup',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		// 水浸标注物（QueryGisItems 返回的 MapWaterBean）
		bean: {
			type: Object,
			default: () => ({})
		}
	},
	computed: {
		name() {
			return this.bean.name || '';
		},
		online() {
			return !!this.bean.online;
		},
		alarm() {
			return !!this.bean.alarm;
		},
		// 基础水位 / 实际水位 / 测量水位（0 → 0 cm，否则 /10 → cm）
		baseText() {
			return waterLevelText(this.bean.base);
		},
		resultText() {
			return waterLevelText(this.bean.result);
		},
		levelText() {
			return waterLevelText(this.bean.level);
		},
		speedText() {
			return formatMeasure(this.bean.speed, 0);
		},
		// 顶部刻度值（30 → 0，共 7 档）
		scaleMarks() {
			const marks = [];
			const step = MAX_SCALE / 6;
			for (let i = 0; i < 7; i++) {
				const val = MAX_SCALE - step * i;
				marks.push(val % 1 === 0 ? val : parseFloat(val.toFixed(1)));
			}
			return marks;
		},
		// 刻度线（30 段 = 31 条，每 5 条加粗）
		tickMarks() {
			const ticks = [];
			const total = 30;
			for (let i = 0; i <= total; i++) {
				ticks.push({
					major: i % 5 === 0,
					top: 2 + (i / total) * 96
				});
			}
			return ticks;
		},
		// 水柱高度（水位计满量程 30 cm）
		waterHeight() {
			const ratio = waterGaugeRatio(this.bean.level);
			if (ratio === 0) return '4rpx';
			return `${ratio * 96}%`;
		},
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
	width: 92%;
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

/* ==================== 水位计 + 数据 ==================== */
.water-body {
	display: flex;
	align-items: stretch;
	padding: 34rpx 30rpx;
}

.gauge {
	display: flex;
	align-items: stretch;
	align-self: stretch;
	min-height: 300rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.gauge-labels {
	position: relative;
	width: 44rpx;
	align-self: stretch;
}

.scale-text {
	position: absolute;
	right: 0;
	transform: translateY(-50%);
	font-size: 20rpx;
	line-height: 1;
	color: var(--text-secondary, #666666);
	white-space: nowrap;
}

.gauge-tube {
	position: relative;
	width: 44rpx;
	align-self: stretch;
	margin-left: 10rpx;
	background-color: var(--bg-soft, #f7f9fc);
	border-left: 1px solid var(--gauge-border, #ccd2dc);
	border-right: 1px solid var(--gauge-border, #ccd2dc);
	overflow: hidden;
}

.tick {
	position: absolute;
	left: 0;
	width: 12rpx;
	height: 1px;
	background-color: var(--gauge-tick, #b4bbc7);
	transform: translateY(-50%);
	z-index: 2;
}

.tick.tick-major {
	width: 24rpx;
	background-color: var(--gauge-tick-major, #8b93a1);
}

.water-fill {
	position: absolute;
	left: 0;
	bottom: 2%;
	width: 100%;
	background: linear-gradient(180deg, var(--water-from, #4da3ff) 0%, var(--water-to, #1a73e8) 100%);
	transition: height 0.3s ease;
	z-index: 1;
}

/* 报警时水柱转红 */
.water-fill.is-alarm {
	background: linear-gradient(180deg, #ff7a7a 0%, #e53935 100%);
}

.water-wave {
	position: absolute;
	top: -4rpx;
	left: 0;
	width: 200%;
	height: 8rpx;
	background-color: var(--water-wave, #6bb2ff);
	border-radius: 50%;
}

.water-data {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.data-row {
	display: flex;
	align-items: center;
	min-height: 48rpx;
}

.row-label {
	width: 150rpx;
	font-size: 28rpx;
	color: var(--text-secondary, #666666);
	flex-shrink: 0;
}

.row-val {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	word-break: break-all;
}

/* 测量水位：报警红色，否则强调色 */
.row-val.highlight {
	color: var(--color-primary, #3a7bf7);
}

.row-val.highlight.is-alarm {
	color: #e53935;
}

.row-status {
	flex-shrink: 0;
	margin-left: 12rpx;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}

.row-status.online {
	color: #22a06b;
}

/* ==================== 底部按钮 ==================== */
.popup-footer {
	display: flex;
	justify-content: space-between;
	padding: 10rpx 26rpx 40rpx;
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
