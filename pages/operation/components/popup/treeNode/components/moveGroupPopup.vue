<!--移动分组弹窗-->
<template>
	<transition name="ge-pop">
		<view v-if="visible" :class="themeClass" class="move-group-popup">
			<!-- 半透明遮罩 -->
			<view class="ge-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="ge-card move-card" @click.stop>
				<!-- 标题栏 -->
				<view class="ge-header">
					<text class="ge-title">移动分组</text>
					<view class="ge-close" hover-class="ge-close-hover" @click="close">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 当前节点名展示 -->
				<view class="ge-current-box">
					<text class="ge-current-label">当前节点：</text>
					<text class="ge-current-name">{{ groupName }}</text>
				</view>

				<!-- 移动目标位置列表 -->
				<view class="ge-target-title">移动目标位置</view>
				<scroll-view class="ge-target-list" scroll-y>
					<view
						v-for="item in targets"
						:key="item.id"
						class="ge-target-item"
						hover-class="ge-target-item-hover"
					>
						<!-- 左边：图标+分组名（整体按层级缩进） -->
						<view :style="{ paddingLeft: targetPadding(item) }" class="ge-target-box">
							<image class="ge-target-icon" mode="aspectFit" src="/static/operation/city.png" />
							<text class="ge-target-name">{{ item.name }}</text>
						</view>
						<!-- 右边：选择按钮 -->
						<view class="ge-select-btn" hover-class="ge-select-btn-hover" @click="choose(item)">
							选择
						</view>
					</view>
					<!-- 空状态（仅剩顶级选项时由父组件保证至少有一项，此处兜底） -->
					<view v-if="!targets.length" class="ge-target-empty">暂无可用位置</view>
				</scroll-view>

				<!-- 底部按钮 -->
				<view class="ge-footer">
					<button class="ge-btn" @click="close">取消</button>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
export default {
	name: 'MoveGroupPopup',
	props: {
		visible: { type: Boolean, default: false },
		// 被移动分组的名称（当前节点名展示）
		groupName: { type: String, default: '' },
		// 移动目标位置列表：[{ id, name, level }]，level=0 为顶层分组，-1 为「顶级分组」选项
		targets: { type: Array, default: () => [] }
	},
	methods: {
		close() {
			this.$emit('close');
		},
		// 按层级计算左侧缩进，体现分组层级关系
		targetPadding(item) {
			const level = item && item.level != null ? item.level : 0;
			return (24 + Math.max(level, 0) * 36) + 'rpx';
		},
		// 点击「选择」按钮：以该分组作为移动目标
		choose(item) {
			if (!item || item.id === undefined || item.id === null) return;
			this.$emit('confirm', { parentId: item.id });
		}
	}
}
</script>

<style lang="scss" scoped>
/* 弹窗动画 */
.ge-pop-enter-active,
.ge-pop-leave-active {
	transition: opacity 0.25s ease;
}

.ge-pop-enter-active .ge-card,
.ge-pop-leave-active .ge-card {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.ge-pop-enter,
.ge-pop-leave-to {
	opacity: 0;
}

.ge-pop-enter .ge-card,
.ge-pop-leave-to .ge-card {
	opacity: 0;
	transform: scale(0.9);
}

.move-group-popup {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.ge-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.55);
}

.ge-card {
	position: relative;
	width: 640rpx;
	max-width: 86%;
	max-height: 80vh;
	box-sizing: border-box;
	padding: 0 32rpx 32rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
	display: flex;
	flex-direction: column;
}

/* 标题栏 */
.ge-header {
	height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	flex-shrink: 0;
}

.ge-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.ge-close {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.ge-close-hover {
	opacity: 0.7;
}

/* 当前节点展示 */
.ge-current-box {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	padding: 0 8rpx 20rpx;
}

.ge-current-label {
	font-size: 28rpx;
	color: var(--text-quaternary, #999999);
}

.ge-current-name {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

/* 目标列表 */
.ge-target-title {
	flex-shrink: 0;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
	padding: 0 8rpx 12rpx;
}

.ge-target-list {
	flex: 1;
	min-height: 240rpx;
	max-height: 520rpx;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 20rpx;
	box-sizing: border-box;
}

.ge-target-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 20rpx;
	position: relative;

	&:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 20rpx;
		right: 20rpx;
		bottom: 0;
		height: 1rpx;
		background: var(--border-color, #e5e5e5);
	}
}

.ge-target-item-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.ge-target-box{
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;

	.ge-target-icon{
		flex-shrink: 0;
		width: 48rpx;
		height: 48rpx;
		margin-right: 10rpx;
	}

	.ge-target-name {
		flex: 1;
		min-width: 0;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}


.ge-select-btn {
	flex-shrink: 0;
	margin-left: 20rpx;
	min-width: 100rpx;
	height: 56rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	background: #3880FC;
	color: #ffffff;
	font-size: 24rpx;
	border-radius: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.ge-select-btn-hover {
	background: #2266d8;
}

.ge-target-empty {
	padding: 60rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}

/* 底部按钮 */
.ge-footer {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	padding: 32rpx 40rpx 0;
}

.ge-btn {
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
	color: #3880FC;
	border: 2rpx solid #3880FC;

	&::after {
		border: none;
	}
}
</style>
