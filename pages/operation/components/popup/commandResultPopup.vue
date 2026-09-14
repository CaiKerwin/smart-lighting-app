<!-- 指令发送结果弹窗（操作列表）：逐条显示单灯指令的执行状态 -->
<template>
	<transition name="cmd-pop">
		<view v-if="visible" class="cmd-popup">
			<!-- 半透明遮罩 -->
			<view class="cmd-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="cmd-card">
				<view class="cmd-header">
					<text class="cmd-title">操作列表</text>
					<view class="cmd-close" hover-class="cmd-close-hover" @click="close">
						<uni-icons color="#999999" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 指令列表：序号 | 设备名称 | 执行状态 -->
				<scroll-view :style="{ height: listHeight }" class="cmd-list" scroll-y>
					<view v-for="(item, index) in list" :key="index" class="list-row">
						<text class="row-index">{{ index + 1 }}</text>
						<text class="row-name">{{ item.name || '-' }}</text>
						<text class="row-status">{{ item.status }}</text>
					</view>
					<view v-if="!list.length" class="list-empty">
						<text class="empty-text">暂无指令</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</transition>
</template>

<script>
	// 列表高度估算（rpx）：按条数计算，超过上限则滚动
	const ROW_HEIGHT = 96;
	const LIST_PADDING = 16;
	const LIST_MAX_HEIGHT = 900;

	export default {
		name: 'CommandResultPopup',
		props: {
			visible: { type: Boolean, default: false },
			// [{ id, name, status }]
			list: { type: Array, default: () => [] }
		},
		computed: {
			listHeight() {
				const count = (this.list || []).length;
				return Math.min(count * ROW_HEIGHT + LIST_PADDING, LIST_MAX_HEIGHT) + 'rpx';
			}
		},
		methods: {
			close() {
				this.$emit('close');
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
		width: 640rpx;
		max-width: 88%;
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

	/* 指令列表 */
	.cmd-list {
		flex-shrink: 1;
		box-sizing: border-box;
		background: var(--bg-card, #ffffff);
	}

	.list-row {
		display: flex;
		align-items: center;
		height: 96rpx;
		border-bottom: 1rpx solid var(--border-color, #e5e5e5);
	}

	.row-index {
		width: 56rpx;
		flex-shrink: 0;
		font-size: 26rpx;
		color: var(--text-quaternary, #999999);
	}

	.row-name {
		flex: 1;
		min-width: 0;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.row-status {
		flex-shrink: 0;
		max-width: 320rpx;
		margin-left: 16rpx;
		font-size: 26rpx;
		color: var(--text-secondary, #666666);
		text-align: right;
	}

	.list-empty {
		height: 160rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 26rpx;
		color: var(--text-quaternary, #999999);
	}
</style>
