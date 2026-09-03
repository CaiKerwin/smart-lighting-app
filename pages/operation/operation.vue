<template>
	<view :class="themeClass" class="page-wrapper">
		<view
			class="operation-container"
			@touchend="onTouchEnd"
			@touchstart="onTouchStart"

		>
			<!-- 标签栏 -->
			<view class="title-bar">
				<text
					:class="{ active: currentTab === 'powerbox' }"
					class="page-title"
					@click="switchTab('powerbox')"
				>
					{{ $t('operation.powerbox') }}
				</text>
				<text
					:class="{ active: currentTab === 'light' }"
					class="page-title"
					@click="switchTab('light')"
				>
					{{ $t('operation.light') }}
				</text>

				<text
					:class="{ active: currentTab === 'control' }"
					class="page-title"
					@click="switchTab('control')"
				>
					{{ $t('operation.control') }}
				</text>
			</view>

			<!-- 内容区域 -->
			<view class="content-area">
				<!-- 配电箱 -->
				<block v-if="currentTab === 'powerbox'">
					<text>内部测试城市照明</text>
				</block>
				<!-- 单灯 -->
				<block v-if="currentTab === 'light'">
					<text>内部测试城市照明</text>
				</block>

				<!-- 智能控制 -->
				<block v-if="currentTab === 'control'">
					<text>内部测试城市照明</text>
				</block>
			</view>
		</view>

		<!-- 搜索悬浮按钮 -->
		<SearchFloatButton v-if="currentTab !== 'control'" @open="openSearchPopup"/>

		<!-- 搜索弹窗 -->
		<DeviceSearchPopup
			:type="currentTab"
			:visible="searchPopupVisible"
			@close="closeSearchPopup"
		/>

		<!-- 底部导航 -->
		<TabBar :current="1"/>
	</view>
</template>

<script>
import TabBar from "@/components/tabBar.vue";
import SearchFloatButton from "./components/searchFloatButton.vue";
import DeviceSearchPopup from "./components/deviceSearchPopup.vue";

export default {
	name: 'Operation',
	components: {TabBar, SearchFloatButton, DeviceSearchPopup},
	data() {
		return {
			currentTab: 'powerbox', // 当前激活标签页
			touchStartX: 0,         // 触摸起始X坐标
			touchStartY: 0,         // 触摸起始Y坐标
			searchPopupVisible: false // 搜索弹窗是否显示
		};
	},
	methods: {
		// 切换标签
		switchTab(tab) {
			this.currentTab = tab;
			// 切换页签时关闭搜索弹窗
			this.searchPopupVisible = false;
		},
		// 打开搜索弹窗
		openSearchPopup() {
			this.searchPopupVisible = true;
		},
		// 关闭搜索弹窗
		closeSearchPopup() {
			this.searchPopupVisible = false;
		},
		// 触摸开始：记录起始坐标
		onTouchStart(e) {
			// 搜索弹窗打开时不响应滑动
			if (this.searchPopupVisible) return;
			const touch = e.touches && e.touches[0];
			if (!touch) return;
			this.touchStartX = touch.clientX;
			this.touchStartY = touch.clientY;
		},
		// 触摸结束：判断滑动方向
		onTouchEnd(e) {
			const touch = e.changedTouches && e.changedTouches[0];
			if (!touch) return;
			this.handleSwipe(touch.clientX, touch.clientY);
		},
		// 水平滑动判断：水平位移大于垂直位移且超过阈值时切换标签
		handleSwipe(endX, endY) {
			const deltaX = endX - this.touchStartX;
			const deltaY = endY - this.touchStartY;
			const threshold = 50; // 滑动阈值（像素）

			// 水平滑动距离大于垂直距离，且超过阈值
			if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
				const tabs = ['powerbox', 'light', 'control'];
				const currentIndex = tabs.indexOf(this.currentTab);
				let targetIndex = currentIndex;

				if (deltaX < 0) {
					// 左滑 → 下一个
					targetIndex = Math.min(currentIndex + 1, tabs.length - 1);
				} else if (deltaX > 0) {
					// 右滑 → 上一个
					targetIndex = Math.max(currentIndex - 1, 0);
				}

				if (targetIndex !== currentIndex) {
					this.switchTab(tabs[targetIndex]);
				}
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.page-wrapper {
	height: 100vh;
	display: flex;
	flex-direction: column;

	.operation-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 20rpx 20rpx 180rpx 20rpx;
		background-color: var(--bg-page, #EFF3FB);

		/* 标题栏样式 */
		.title-bar {
			display: flex;
			justify-content: space-evenly;
			margin-top: 0;
			margin-bottom: 20rpx;
			flex-shrink: 0;
		}

		.page-title {
			font-size: 34rpx;
			font-weight: bold;
			color: var(--text-quaternary, #999); /* 默认灰色 */
			padding-bottom: 8rpx;
			border-bottom: 4rpx solid transparent;
			transition: all 0.3s;
			cursor: pointer;
		}

		.page-title.active {
			color: #3880FC;
			border-bottom-color: #3880FC;
		}

		.content-area {
			flex: 1;
			min-height: 0;
		}
	}
}

</style>
