<!-- 编辑分组弹窗 -->
<template>
	<transition name="ge-pop">
		<view v-if="visible" :class="themeClass" class="edit-group-popup">
			<!-- 半透明遮罩 -->
			<view class="ge-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="ge-card" @click.stop>
				<!-- 标题栏 -->
				<view class="ge-header">
					<text class="ge-title">编辑分组</text>
					<view class="ge-close" hover-class="ge-close-hover" @click="close">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 内容区 -->
				<view class="ge-body">
					<!-- 新的分组名称（必填） -->
					<view class="ge-field">
						<text class="ge-field-label">新的分组名称</text>
						<view class="ge-input-box">
							<input
								v-model="name"
								class="ge-input"
								maxlength="20"
								placeholder="请输入新的分组名称"
								placeholder-class="ge-input-placeholder"
							/>
						</view>
					</view>
				</view>

				<!-- 底部按钮 -->
				<view class="ge-footer">
					<button class="ge-btn" @click="close">取消</button>
					<button class="ge-btn primary" @click="confirm">确定</button>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
export default {
	name: 'EditGroupPopup',
	props: {
		visible: { type: Boolean, default: false },
		// 当前分组名称（打开时带入输入框）
		groupName: { type: String, default: '' }
	},
	data() {
		return {
			name: '' // 新的分组名称
		};
	},
	watch: {
		// 每次打开时带入当前分组名称
		visible(val) {
			if (val) this.name = this.groupName || '';
		}
	},
	methods: {
		close() {
			this.$emit('close');
		},
		confirm() {
			// 新的分组名称为必填项
			const name = (this.name || '').trim();
			if (!name) {
				uni.showToast({ title: '请输入新的分组名称', icon: 'none' });
				return;
			}
			this.$emit('confirm', { name });
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

.edit-group-popup {
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
	box-sizing: border-box;
	padding: 0 32rpx 32rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
}

/* 标题栏 */
.ge-header {
	height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
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

/* 内容区 */
.ge-body {
	padding: 8rpx 0 40rpx;
}

.ge-field {
	display: flex;
	align-items: center;
}

.ge-field-label {
	flex-shrink: 0;
	width: 190rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.ge-input-box {
	flex: 1;
	min-width: 0;
	height: 72rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 10rpx;
	display: flex;
	align-items: center;
}

.ge-input {
	flex: 1;
	min-width: 0;
	height: 100%;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.ge-input-placeholder {
	color: var(--text-quaternary, #999999);
}

/* 底部按钮 */
.ge-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 40rpx;
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
	transition: color 0.3s ease, border-color 0.3s ease, background-color 0.3s ease;

	&::after {
		border: none;
	}

	&.primary {
		margin-left: 40rpx;
		background-color: #3880FC;
		color: #ffffff;
		border: none;
		line-height: 84rpx;
	}
}
</style>
