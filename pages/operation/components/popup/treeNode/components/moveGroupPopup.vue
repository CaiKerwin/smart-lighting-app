<!--移动分组弹窗-->
<template>
	<transition name="mg-pop">
		<view v-if="visible" :class="themeClass" class="move-group-popup">
			<!-- 半透明遮罩 -->
			<view class="mg-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="mg-card" @click.stop>
				<!-- 标题栏 -->
				<view class="mg-header">
					<text class="mg-title">移动分组</text>
					<view class="mg-close" hover-class="mg-close-hover" @click="close">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 表单内容 -->
				<view class="mg-body">
					<!-- 当前分组 -->
					<view class="mg-field">
						<view class="mg-label-box">
							<text class="mg-label">当前分组</text>
						</view>
						<text class="mg-group-name">{{ groupName || '-' }}</text>
					</view>

					<!-- 移动到的上级分组 -->
					<view class="mg-field">
						<view class="mg-label-box">
							<text class="mg-required">*</text>
							<text class="mg-label">移动至</text>
						</view>
						<view class="mg-control-wrap">
							<view
								:class="['mg-control', 'mg-control-tap', { 'mg-control-error': errorMessage }]"
								hover-class="mg-control-hover"
								@click="openGroupPicker"
							>
								<text :class="['mg-select-value', { 'mg-placeholder': !targetDisplayName }]">
									{{ targetDisplayName || '请选择上级分组' }}
								</text>
								<view class="mg-group-add" hover-class="mg-group-add-hover" @click.stop="openGroupPicker">
									<uni-icons :color="isDarkMode ? '#8b94a8' : '#666666'" size="24" type="down"></uni-icons>
								</view>
							</view>
							<text v-if="errorMessage" class="mg-error">{{ errorMessage }}</text>
						</view>
					</view>
				</view>

				<!-- 底部按钮 -->
				<view class="mg-footer">
					<button class="mg-btn" @click="close">取消</button>
					<button class="mg-btn primary" @click="submit">确定</button>
				</view>
			</view>

			<!-- 上级分组选择层 -->
			<view v-if="groupPickerVisible" class="mg-picker-mask">
				<view class="mg-picker-backdrop" @click="closeGroupPicker" @touchmove.stop.prevent></view>

				<view class="mg-picker-card" @click.stop>
					<view class="mg-picker-header">
						<text class="mg-picker-title">选择上级分组</text>
						<view class="mg-close" hover-class="mg-close-hover" @click="closeGroupPicker">
							<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
						</view>
					</view>

					<scroll-view class="mg-picker-list" scroll-y>
						<view
							v-for="item in targets"
							:key="item.id"
							class="mg-picker-item"
							hover-class="mg-picker-item-hover"
							@click="chooseTarget(item)"
						>
							<view :style="{ paddingLeft: groupPadding(item) }" class="mg-picker-main">
								<image class="mg-picker-icon" mode="aspectFit" src="/static/operation/city.png" />
								<text class="mg-picker-name">{{ targetName(item) }}</text>
								<text v-if="isCurrentTarget(item)" class="mg-picker-tag">当前</text>
							</view>
							<uni-icons
								v-if="isSelectedTarget(item)"
								:color="primaryColor"
								size="18"
								type="checkmarkempty"
							></uni-icons>
						</view>

						<view v-if="!targets.length" class="mg-picker-empty">暂无可选分组</view>
					</scroll-view>
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
		targets: { type: Array, default: () => [] },
		// 分组当前所属的父分组 id，用于在选择层标记「当前」
		currentParentId: { type: [String, Number], default: 0 }
	},
	data() {
		return {
			groupPickerVisible: false,
			// 选择的移动目标分组 id
			selectedTargetId: null,
			errorMessage: ''
		};
	},
	computed: {
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#3880FC';
		},
		// 已选择的移动目标分组名称
		targetDisplayName() {
			const matched = this.targets.find(item => String(item.id) === String(this.selectedTargetId));
			return matched ? this.targetName(matched) : '';
		},
		// 分组当前所属的父分组 id（顶级分组为 0）
		currentTargetId() {
			return this.currentParentId === undefined || this.currentParentId === null ? 0 : this.currentParentId;
		}
	},
	watch: {
		visible(val) {
			if (val) {
				this.initForm();
			} else {
				this.groupPickerVisible = false;
			}
		}
	},
	mounted() {
		if (this.visible) this.initForm();
	},
	methods: {
		close() {
			this.groupPickerVisible = false;
			this.$emit('close');
		},
		/** 打开弹窗时重置选择状态 */
		initForm() {
			this.selectedTargetId = null;
			this.errorMessage = '';
			this.groupPickerVisible = false;
		},
		/** 打开上级分组选择层 */
		openGroupPicker() {
			if (!this.targets.length) {
				uni.showToast({ title: '暂无可选分组', icon: 'none' });
				return;
			}
			this.errorMessage = '';
			this.groupPickerVisible = true;
		},
		closeGroupPicker() {
			this.groupPickerVisible = false;
		},
		/** 选择移动目标分组 */
		chooseTarget(item) {
			if (!item || item.id === undefined || item.id === null) return;
			// 分组已在该位置，无需移动
			if (this.isCurrentTarget(item)) {
				uni.showToast({ title: '分组已在该位置', icon: 'none' });
				return;
			}
			this.selectedTargetId = item.id;
			this.errorMessage = '';
			this.groupPickerVisible = false;
		},
		// 按层级计算左侧缩进，体现分组层级关系
		groupPadding(item) {
			const level = item && item.level !== undefined && item.level !== null ? item.level : 0;
			return Math.max(level, 0) * 32 + 'rpx';
		},
		isSelectedTarget(item) {
			return !!item && String(item.id) === String(this.selectedTargetId);
		},
		isCurrentTarget(item) {
			return !!item && String(item.id) === String(this.currentTargetId);
		},
		// 顶级分组没有名称时兜底展示
		targetName(item) {
			if (!item) return '';
			if (item.name) return item.name;
			return String(item.id) === '0' ? '顶级分组' : '';
		},
		/** 点击确定：以目标分组作为新的 parentId */
		submit() {
			const target = this.targets.find(item => String(item.id) === String(this.selectedTargetId));
			if (!target) {
				this.errorMessage = '请选择上级分组';
				return;
			}
			if (this.isCurrentTarget(target)) {
				this.errorMessage = '分组已在该位置';
				return;
			}
			this.$emit('confirm', { parentId: target.id });
		}
	}
};
</script>

<style lang="scss" scoped>
/* 弹窗动画 */
.mg-pop-enter-active,
.mg-pop-leave-active {
	transition: opacity 0.25s ease;
}

.mg-pop-enter-active .mg-card,
.mg-pop-leave-active .mg-card {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.mg-pop-enter,
.mg-pop-leave-to {
	opacity: 0;
}

.mg-pop-enter .mg-card,
.mg-pop-leave-to .mg-card {
	opacity: 0;
	transform: scale(0.92);
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

.mg-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.55);
}

.mg-card {
	position: relative;
	width: 660rpx;
	max-width: 92%;
	box-sizing: border-box;
	padding: 0 32rpx 32rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
}

/* 标题栏 */
.mg-header {
	height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.mg-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.mg-close {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mg-close-hover {
	opacity: 0.7;
}

/* 表单内容 */
.mg-body {
	padding: 4rpx 8rpx 8rpx;
}

.mg-field {
	display: flex;
	align-items: flex-start;
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 8rpx;
	}
}

.mg-label-box {
	flex-shrink: 0;
	width: 150rpx;
	padding-top: 24rpx;
	display: flex;
	align-items: center;
}

.mg-label {
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

.mg-required {
	margin-right: 4rpx;
	font-size: 26rpx;
	color: #ff3b30;
}

.mg-group-name {
	flex: 1;
	min-width: 0;
	padding-top: 24rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.mg-control-wrap {
	flex: 1;
	min-width: 0;
}

.mg-control {
	min-height: 76rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border: 1rpx solid transparent;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
}

.mg-control-error {
	border-color: #ff3b30;
}

.mg-control-tap {
	cursor: pointer;
}

.mg-control-hover {
	background: var(--bg-accent, #eef3ff);
}

.mg-select-value {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.mg-placeholder {
	color: var(--text-quaternary, #999999);
}

/* 上级分组右侧选择入口 */
.mg-group-add {
	flex-shrink: 0;
	width: 60rpx;
	height: 60rpx;
	margin-left: 8rpx;
	margin-right: -8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
}

.mg-group-add-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.mg-error {
	display: block;
	margin-top: 8rpx;
	padding-left: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #ff3b30;
}

/* 底部按钮 */
.mg-footer {
	display: flex;
	align-items: center;
	padding: 16rpx 40rpx 8rpx;
}

.mg-btn {
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

	&.primary {
		margin-left: 32rpx;
		background-color: #3880FC;
		color: #ffffff;
		border: none;
		line-height: 84rpx;
	}
}

/* 上级分组选择层 */
.mg-picker-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mg-picker-backdrop {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.45);
}

.mg-picker-card {
	position: relative;
	z-index: 1;
	width: 600rpx;
	max-width: 88%;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
	overflow: hidden;
}

.mg-picker-header {
	flex-shrink: 0;
	height: 96rpx;
	padding: 0 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	border-bottom: 1rpx solid var(--border-color, #ececec);
}

.mg-picker-title {
	font-size: 30rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.mg-picker-list {
	flex: 1;
	max-height: 46vh;
	padding: 8rpx 0;
	box-sizing: border-box;
}

.mg-picker-item {
	display: flex;
	align-items: center;
	padding: 22rpx 24rpx;
}

.mg-picker-item-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.mg-picker-main {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
}

.mg-picker-icon {
	flex-shrink: 0;
	width: 44rpx;
	height: 44rpx;
	margin-right: 10rpx;
}

.mg-picker-name {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.mg-picker-tag {
	flex-shrink: 0;
	margin-left: 12rpx;
	padding: 2rpx 10rpx;
	font-size: 20rpx;
	line-height: 1.5;
	color: #3880FC;
	border: 1rpx solid rgba(56, 128, 252, 0.5);
	border-radius: 8rpx;
}

.mg-picker-empty {
	padding: 60rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}
</style>
