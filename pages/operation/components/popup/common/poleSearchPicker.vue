<template>
	<view v-if="visible" :class="themeClass" class="pole-search-mask" @click.stop="onMaskClick">
		<view class="pole-search-panel" @click.stop>
			<!-- 标题栏 -->
			<view class="pole-search-title-bar">
				<text class="pole-search-title">选择灯杆</text>
				<view class="pole-search-close" @click="onCancel">
					<uni-icons :color="iconMutedColor" size="20" type="closeempty" />
				</view>
			</view>
			<!-- 搜索栏 -->
			<view class="pole-search-header">
				<view class="pole-search-box">
					<uni-icons :color="iconMutedColor" size="16" type="search" />
					<input v-model="keyword" :focus="focus" :placeholder="placeholder"
					       class="pole-search-input" confirm-type="search"
					       placeholder-class="placeholder" type="text"
					       @input="onKeywordInput" />
					<text v-if="keyword" class="pole-search-clear" @click="clearKeyword">✕</text>
				</view>
				<text class="pole-search-cancel" @click="onCancel">取消</text>
			</view>

			<!-- 选项列表 -->
			<scroll-view :scroll-into-view="scrollIntoView" class="pole-search-list" scroll-y>
				<view v-for="(item, idx) in filteredOptions" :id="'pole-opt-' + idx"
				      :key="idx"
				      :class="{ active: item === value }"
				      class="pole-search-item"
				      @click="onSelect(item)">
					<text class="pole-search-item-text">{{ item }}</text>
					<uni-icons v-if="item === value" :color="primaryColor" size="18" type="checkmarkempty" />
				</view>
				<view v-if="!filteredOptions.length" class="pole-search-empty">
					{{ options.length ? emptySearchText : emptyText }}
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PoleSearchPicker',
	props: {
		visible: { type: Boolean, default: false },
		options: { type: Array, default: () => [] },
		value: { type: String, default: '' },
		placeholder: { type: String, default: '搜索灯杆名称' },
		emptyText: { type: String, default: '暂无可选项' },
		emptySearchText: { type: String, default: '未找到匹配的选项' },
		autoFocus: { type: Boolean, default: true }
	},
	data() {
		return {
			keyword: '',
			focus: false,
			scrollIntoView: ''
		};
	},
	computed: {
		// 静默图标颜色（搜索、关闭）：跟随主题
		iconMutedColor() {
			return this.isDarkMode ? '#8b94a8' : '#909399';
		},
		// 主色图标颜色（选中勾选）：跟随主题
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#007aff';
		},
		filteredOptions() {
			const kw = (this.keyword || '').trim().toLowerCase();
			if (!kw) return this.options;
			return this.options.filter(item =>
				String(item).toLowerCase().indexOf(kw) > -1
			);
		}
	},
	watch: {
		visible(val) {
			if (val) {
				this.onOpen();
			} else {
				this.focus = false;
			}
		}
	},
	methods: {
		onOpen() {
			this.keyword = '';
			const idx = this.options.indexOf(this.value);
			this.scrollIntoView = idx > -1 ? 'pole-opt-' + idx : '';
			if (this.autoFocus) {
				this.$nextTick(() => { this.focus = true; });
			}
		},
		onKeywordInput() { this.scrollIntoView = ''; },
		clearKeyword() { this.keyword = ''; this.scrollIntoView = ''; },
		onSelect(item) {
			this.$emit('confirm', item);
			this.$emit('update:visible', false);
		},
		onCancel() {
			this.$emit('close');
			this.$emit('update:visible', false);
		},
		onMaskClick() { this.onCancel(); }
	}
};
</script>

<style lang="scss" scoped>
.pole-search-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--popup-mask, rgba(0, 0, 0, 0.45));
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.pole-search-panel {
	width: 88%;
	max-width: 660rpx;
	max-height: 70vh;
	background: var(--bg-card, #fff);
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* 标题栏 */
.pole-search-title-bar {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	height: 88rpx;
	padding: 0 24rpx;
	border-bottom: 1px solid var(--border-color, #f0f0f0);
	flex-shrink: 0;

	.pole-search-title {
		font-size: 30rpx;
		font-weight: bold;
		color: var(--text-primary, #333);
	}

	.pole-search-close {
		position: absolute;
		right: 16rpx;
		top: 50%;
		transform: translateY(-50%);
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.pole-search-header {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	border-bottom: 1px solid var(--border-color, #f0f0f0);
	flex-shrink: 0;

	.pole-search-box {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 8rpx;
		height: 68rpx;
		padding: 0 16rpx;
		background: var(--bg-soft, #f0f2f5);
		border-radius: 8rpx;
		box-sizing: border-box;
	}

	.pole-search-input {
		flex: 1;
		min-width: 0;
		height: 68rpx;
		font-size: 28rpx;
		color: var(--text-primary, #333);

		.placeholder { color: var(--text-tertiary, #909399); }
	}

	.pole-search-clear {
		flex-shrink: 0;
		width: 40rpx;
		text-align: center;
		font-size: 24rpx;
		color: var(--text-quaternary, #c0c4cc);
	}

	.pole-search-cancel {
		margin-left: 20rpx;
		font-size: 28rpx;
		color: var(--color-primary, #007aff);
		flex-shrink: 0;
	}
}

.pole-search-list {
	flex: 1;
	max-height: 56vh;
	padding: 8rpx 0;
	box-sizing: border-box;
}

.pole-search-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 22rpx 24rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333);

	&:active { background: var(--bg-row-selected, #f5f7fa); }

	&.active {
		.pole-search-item-text { color: var(--color-primary, #007aff); }
	}

	.pole-search-item-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.pole-search-empty {
	padding: 60rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: var(--text-tertiary, #909399);
}
</style>
