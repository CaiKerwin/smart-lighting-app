<template>
	<view class="alarm-center-container">
		<!-- 折叠状态：横向滚动 -->
		<view v-if="!isExpanded" class="collapsed-wrap">
			<scroll-view scroll-x class="scroll-view-box">
				<view class="flex-row">
					<!-- 展示全部标签 -->
					<view
						class="tab-item"
						v-for="(item, index) in allTabs"
						:key="index"
						:class="{ 'active': activeTab === item }"
						@click="handleSelect(item)"
					>
						{{ item }}
					</view>
				</view>
			</scroll-view>
			<!-- 分隔线与下拉按钮固定在右侧 -->
			<view class="divider"></view>
			<view class="toggle-btn" @click="toggleExpand">
				<uni-icons type="bottom" size="16" color="#999" />
			</view>
		</view>

		<!-- 展开状态：换行展示 -->
		<view v-else class="expanded-wrap">
			<view class="flex-wrap">
				<!-- 展示全部气泡 -->
				<view
					class="tab-item"
					v-for="(item, index) in allTabs"
					:key="index"
					:class="{ 'active': activeTab === item }"
					@click="handleSelect(item)"
				>
					{{ item }}
				</view>
			</view>
			<!-- 上拉收起按钮 -->
			<view class="toggle-btn expand-up" @click="toggleExpand">
				<uni-icons type="top" size="16" color="#999" />
			</view>
		</view>
	</view>
</template>

<script>

export default {
	name: 'AlarmCenter',
	props: {
		// 接收外部传入的初始选中标签
		initialTab: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			// 全部7个标签数据
			allTabs: [
				'配电箱报警',
				'单灯报警',
				'离线报警',
				'线路供电异常报警',
				'线路供电异常报警记录',
				'水浸报警',
				'人工报障'
			],
			// 当前选中的标签
			activeTab: this.initialTab,
			// 是否展开全部气泡 (默认折叠)
			isExpanded: false
		};
	},
	// 当父组件动态修改 initialTab 时更新 activeTab
	watch: {
		initialTab(newVal) {
			this.activeTab = newVal;
		}
	},
	methods: {
		// 切换展开/收起状态
		toggleExpand() {
			this.isExpanded = !this.isExpanded;
		},
		// 点击标签事件
		handleSelect(item) {
			this.activeTab = item;
			this.$emit('change', item); // 向外抛出当前选中的值
		}
	}
}
</script>

<style lang="scss" scoped>
.alarm-center-container {
	width: 100%;
	background-color: #FFFFFF;
	padding: 20rpx 0;
	position: relative;
}

/* 折叠态容器 */
.collapsed-wrap {
	width: 100%;
	display: flex;
	align-items: center;
	overflow: hidden; /* 防止内容撑开容器 */

	.scroll-view-box {
		flex: 1; /* 占据剩余宽度 */
		width: 0;  /* 配合 flex:1 防止被内容撑开 */
	}

	.flex-row {
		display: inline-flex;
		gap: 20rpx 24rpx;
		padding: 0 20rpx;
		flex-wrap: nowrap; /* 确保标签不换行 */
	}

	.divider {
		width: 2rpx;
		height: 30rpx;
		background-color: #E5E5E5;
		margin: 0 10rpx;
		flex-shrink: 0; /* 固定宽度，不被压缩 */
	}

	.toggle-btn {
		flex-shrink: 0; /* 固定宽度，不被压缩 */
		padding: 0 10rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
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

	/* 展开态下的上拉按钮 */
	.expand-up {
		position: absolute;
		right: 10rpx;
		top: 0;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 30%);
		padding-left: 30rpx;
	}
}

/* 气泡基础样式 */
.tab-item {
	display: inline-block;
	padding: 12rpx 32rpx;
	border-radius: 40rpx;
	background-color: #F2F4F8;
	color: #666666;
	font-size: 28rpx;
	line-height: 1.2;
	white-space: nowrap;
	cursor: pointer;
	transition: all 0.2s ease;
}

/* 气泡选中状态 */
.tab-item.active {
	background-color: #3A7BF7; /* 对应图中的蓝色 */
	color: #FFFFFF;
}

/* 切换按钮公共样式 */
.toggle-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	padding: 0 10rpx;

	.icon-text {
		font-size: 24rpx;
		color: #999999;
		font-weight: 500;
	}
}
</style>
