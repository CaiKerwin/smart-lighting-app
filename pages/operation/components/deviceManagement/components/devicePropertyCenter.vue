<template>
	<view :class="themeClass" class="device-property-center">
		<!-- 折叠状态：横向滚动 -->
		<view v-if="!isExpanded" class="collapsed-wrap">
			<scroll-view
				:scroll-left="scrollLeft"
				:show-scrollbar="false"
				class="scroll-view-box"
				scroll-x
				@scroll="onScroll"
			>
				<view class="flex-row">
					<!-- 展示全部标签，动态绑定 id 用于定位 -->
					<view
						v-for="(item, index) in allTabs"
						:id="'tab-' + index"
						:key="index"
						:class="{ 'active': activeTab === item }"
						class="tab-item"
						@click="handleSelect(item)"
					>
						{{ item }}
					</view>
				</view>
			</scroll-view>
			<!-- 分隔线与下拉按钮固定在右侧 -->
			<view class="right-fixed">
				<view class="divider"></view>
				<view class="toggle-btn" @click="toggleExpand">
					<uni-icons :color="isDarkMode ? '#6d7689' : '#999'" size="16" type="bottom" />
				</view>
			</view>
		</view>

		<!-- 展开状态：换行展示 -->
		<view v-else class="expanded-wrap">
			<view class="flex-wrap">
				<!-- 展示全部气泡 -->
				<view
					v-for="(item, index) in allTabs"
					:key="index"
					:class="{ 'active': activeTab === item }"
					class="tab-item"
					@click="handleSelect(item)"
				>
					{{ item }}
				</view>
			</view>
			<!-- 上拉收起按钮 -->
			<view class="toggle-btn expand-up" @click="toggleExpand">
				<uni-icons :color="isDarkMode ? '#6d7689' : '#999'" size="16" type="top" />
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'DevicePropertyCenter',
	props: {
		// 接收外部传入的初始选中标签
		initialTab: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			allTabs: [
				'总配电',
				'转换开关',
				'控制输出分组',
				'控制输出',
				'接触器',
				'支路配电',
				'电表管理',
				'柜门',
				'门锁',
				'烟雾监测',
				'水浸监测',
				'防盗设备',
				'温度监测',
				'绝缘监测',
				'电流联动',
				'开入量联动'
			],
			activeTab: this.initialTab,
			isExpanded: false,
			// 用于滚动居中的控制变量
			scrollLeft: 0,
			currentScrollLeft: 0
		};
	},
	watch: {
		// 父组件可能动态修改 initialTab
		initialTab(newVal) {
			this.activeTab = newVal;
		},
		// 当前激活标签变化时，若折叠状态则滚动居中
		activeTab() {
			this.scrollToActiveTab();
		}
	},
	mounted() {
		// 组件挂载后，若折叠状态，初始滚动居中
		this.$nextTick(() => {
			this.scrollToActiveTab();
		});
	},
	methods: {
		// 滚动时更新当前滚动位置
		onScroll(e) {
			this.currentScrollLeft = e.detail.scrollLeft;
		},
		// 切换展开/收起状态
		toggleExpand() {
			this.isExpanded = !this.isExpanded;
			// 若变为折叠状态，滚动到当前激活标签居中
			if (!this.isExpanded) {
				this.$nextTick(() => {
					this.scrollToActiveTab();
				});
			}
		},
		// 点击标签事件
		handleSelect(item) {
			this.activeTab = item;
			this.$emit('change', item);
		},
		// 滚动到当前激活标签水平居中（仅折叠状态）
		scrollToActiveTab() {
			// 仅在折叠状态下执行
			if (this.isExpanded) return;

			const index = this.allTabs.indexOf(this.activeTab);
			if (index === -1) return;

			// 延时确保 DOM 渲染完成
			this.$nextTick(() => {
				const query = uni.createSelectorQuery().in(this);
				// 获取滚动容器宽度
				query.select('.scroll-view-box').boundingClientRect();
				// 获取内容容器（flex-row）位置
				query.select('.flex-row').boundingClientRect();
				// 获取目标标签元素位置
				query.select('#tab-' + index).boundingClientRect();

				query.exec((res) => {
					const containerRect = res[0];
					const flexRowRect = res[1];
					const targetRect = res[2];

					if (!containerRect || !flexRowRect || !targetRect) {
						return;
					}

					// 计算目标标签相对于滚动内容起始位置的偏移量（不受滚动影响）
					// 公式：offsetLeft = targetRect.left - flexRowRect.left
					const offsetLeft = targetRect.left - flexRowRect.left;
					const targetWidth = targetRect.width;
					const containerWidth = containerRect.width;

					// 计算使目标标签居中的滚动位置
					let targetScrollLeft = offsetLeft + targetWidth / 2 - containerWidth / 2;

					// 边界限制
					if (targetScrollLeft < 0) targetScrollLeft = 0;
					const maxScrollLeft = flexRowRect.width - containerWidth;
					if (targetScrollLeft > maxScrollLeft) targetScrollLeft = maxScrollLeft;

					if (Math.abs(targetScrollLeft - this.currentScrollLeft) < 1) return;

					// 设置滚动位置
					this.scrollLeft = targetScrollLeft;
				});
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.device-property-center {
	width: 100%;
	background-color: var(--bg-card, #FFFFFF);
	padding: 20rpx 0;
	position: relative;
}

/* 折叠态容器 */
.collapsed-wrap {
	width: 100%;
	display: flex;
	align-items: center;
	overflow: hidden;
	box-sizing: border-box;
	padding-right: 10rpx;

	.scroll-view-box {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.flex-row {
		display: inline-flex;
		gap: 20rpx 24rpx;
		padding: 0 20rpx;
		flex-wrap: nowrap;
	}

	.right-fixed{
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding-left: 6rpx;

		.divider {
			width: 2rpx;
			height: 30rpx;
			background-color: var(--border-color, #E5E5E5);
			margin: 0 10rpx;
			flex-shrink: 0;
		}

		.toggle-btn {
			flex-shrink: 0;
			padding: 0 10rpx;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
		}
	}
}

/* 展开态容器 */
.expanded-wrap {
	width: 100%;
	position: relative;

	.flex-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx 24rpx;
		padding: 0 20rpx;
	}

	.expand-up {
		position: absolute;
		right: 10rpx;
		top: 0;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: 30rpx;
	}
}

/* 气泡基础样式 */
.tab-item {
	display: inline-block;
	padding: 12rpx 26rpx;
	border-radius: 40rpx;
	background-color: var(--bg-soft, #F2F4F8);
	color: var(--text-secondary, #666666);
	font-size: 28rpx;
	line-height: 1.2;
	white-space: nowrap;
	cursor: pointer;
	transition: all 0.2s ease;
}

.tab-item.active {
	background-color: #3A7BF7;
	color: #FFFFFF;
}

.toggle-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	padding: 0 10rpx;
}
</style>
