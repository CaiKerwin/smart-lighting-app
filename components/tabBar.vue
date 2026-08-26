<template>
	<!-- 最多五个 tab -->
	<view :class="{ 'five-tabs': tabs.length >= 5 }" class="tab-bar">
		<!-- #ifdef H5 || MP-WEIXIN -->
		<!-- 随当前 tab 滑动的高亮胶囊 -->
		<view
			:style="{
				width: (100 / tabs.length) + '%',
				transform: 'translateX(' + displayIndex * 100 + '%)'
		    }"
			class="tab-highlight"
		/>
		<!-- #endif -->
		<view
			class="tab-item"
			v-for="(item, index) in tabs"
			:key="index"
			@click="switchTab(index)"
		>
			<image
				class="tab-icon"
				:src="current === index ? item.activeIcon : item.icon"
				mode="aspectFit"
			/>
			<text class="tab-label" :class="{ active: current === index }">
				{{ $t(item.labelKey) }}
			</text>
		</view>
	</view>
</template>

<script>
export default {
	name: "TabBar",
	props: {
		current: {
			type: Number,
			default: 0, // 0-首页，1-集中报警，2-工单维护
		},
	},
	data() {
		return {
			// #ifdef H5 || MP-WEIXIN
			// 高亮胶囊的展示位置（用于跨页面切换的滑动动画）
			displayIndex: 0,
			// #endif
			tabs: [
				{
					labelKey: "tabBar.home",
					icon: "/static/common/home.png",
					activeIcon: "/static/common/home-active.png",
					path: "/pages/index/index",
				},
				{
					labelKey: "tabBar.alarm",
					icon: "/static/common/alarm.png",
					activeIcon: "/static/common/alarm-active.png",
					path: "/pages/alarm/alarm",
				},
				{
					labelKey: "tabBar.workOrder",
					icon: "/static/common/workOrder.png",
					activeIcon: "/static/common/workOrder-active.png",
					path: "/pages/workOrder/workOrder",
				}
			],
		};
	},
	// #ifdef H5 || MP-WEIXIN
	mounted() {
		this.initHighlightSlide();
	},
	// #endif
	methods: {
		// #ifdef H5 || MP-WEIXIN
		/**
		 * 页面因 redirectTo 整体重载，无法在页面内做切换过渡，
		 * 因此读取上一次 tab 位置：首帧渲染时先停在旧位置，
		 * 待首帧绘制完成后（约 100ms）再滑动到当前 tab，
		 * 从而在“整页刷新”的前提下保留 iOS 26 的胶囊滑动切换效果。
		 */
		initHighlightSlide() {
			this.displayIndex = this.current;
			try {
				const last = uni.getStorageSync("tabBarLastIndex");
				if (
					last &&
					typeof last.index === "number" &&
					last.index !== this.current &&
					Date.now() - last.time < 8000
				) {
					this.displayIndex = last.index;
					this.$nextTick(() => {
						setTimeout(() => {
							this.displayIndex = this.current;
						}, 100);
					});
				}
			} catch (e) {
				// 存储不可用时直接定位到当前 tab，不播动画

			}
		},
		// #endif
		switchTab(index) {
			if (index === this.current) return;
			// #ifdef H5 || MP-WEIXIN
			try {
				uni.setStorageSync("tabBarLastIndex", {
					index: this.current,
					time: Date.now(),
				});
			} catch (e) {}
			// #endif
			const { path } = this.tabs[index];
			uni.redirectTo({ url: path });
		},
	},
};
</script>

<style scoped>
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	justify-content: space-around;
	align-items: center;
	height: 100rpx;
	background-color: #ffffff;
	border-top: 1px solid #e5e5e5;
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	z-index: 999;
}

.tab-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	padding: 8rpx 0;
}

.tab-icon {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 4rpx;
}

.tab-label {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
	font-size: 22rpx;
	color: #999999;
	transition: color 0.2s;
}

.tab-label.active {
	color: #007aff;
	font-weight: 500;
}

.five-tabs .tab-label {
	font-size: 20rpx;
}

/* #ifdef H5 */
/* H5 端 */
.tab-bar {
	left: 24rpx;
	right: 24rpx;
	bottom: calc(24rpx + env(safe-area-inset-bottom));
	height: 120rpx;
	border: 1px solid rgba(255, 255, 255, 0.5);
	border-radius: 100rpx;
	background-color: transparent;
	box-shadow: 0 16rpx 48rpx rgba(31, 38, 135, 0.14),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.7);
	-webkit-backdrop-filter: saturate(180%) blur(30rpx);
	backdrop-filter: saturate(180%) blur(30rpx);
}

/* 不支持 backdrop-filter 的浏览器降级为高不透明度背景，保证可读性 */
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
	.tab-bar {
		background-color: rgba(255, 255, 255, 0.92);
	}
}

.tab-item {
	position: relative;
	z-index: 1;
	padding: 10rpx 0;
}

/* 当前 tab 的高亮胶囊，通过 translateX 在三个 tab 之间弹簧式滑动 */
.tab-highlight {
	position: absolute;
	top: 12rpx;
	bottom: 12rpx;
	left: 0;
	pointer-events: none;
	transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
	will-change: transform;
}

.tab-highlight::before {
	content: "";
	position: absolute;
	left: 12rpx;
	right: 12rpx;
	top: 0;
	bottom: 0;
	border-radius: 100rpx;
	background-color: transparent;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08),
		inset 0 0 0 1rpx rgba(255, 255, 255, 0.35);
}

.tab-label {
	color: #8e8e93;
}
/* #endif */

/* #ifdef MP-WEIXIN */
/* 微信小程序端 */
.tab-bar {
	left: 24rpx;
	right: 24rpx;
	bottom: calc(24rpx + env(safe-area-inset-bottom));
	height: 120rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.5);
	border-radius: 100rpx;
	background-color: transparent;
	box-shadow: 0 16rpx 48rpx rgba(31, 38, 135, 0.14),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.7);
	-webkit-backdrop-filter: saturate(180%) blur(15px);
	backdrop-filter: saturate(180%) blur(15px);
}

.tab-item {
	position: relative;
	z-index: 1;
	padding: 10rpx 0;
}

.tab-highlight {
	position: absolute;
	top: 12rpx;
	bottom: 12rpx;
	left: 0;
	pointer-events: none;
	transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-highlight::before {
	content: "";
	position: absolute;
	left: 12rpx;
	right: 12rpx;
	top: 0;
	bottom: 0;
	border-radius: 100rpx;
	background-color: transparent;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08),
		inset 0 0 0 1rpx rgba(255, 255, 255, 0.35);
}

.tab-label {
	color: #8e8e93;
}
/* #endif */
</style>
