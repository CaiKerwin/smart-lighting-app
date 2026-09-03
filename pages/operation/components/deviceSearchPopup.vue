<template>
	<transition name="search-pop">
		<view
			v-if="visible"
			:class="themeClass"
			class="device-search-popup"
			@touchmove.stop.prevent
		>
			<!-- 半透明遮罩 -->
			<view class="search-mask" @click="handleClose"></view>

			<!-- 弹窗卡片 -->
			<view class="search-card" @click.stop>
				<!-- 标题栏 -->
				<view class="search-header">
					<text class="search-title">搜索</text>
					<view class="search-close" hover-class="search-close-hover" @click="handleClose">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 搜索框 -->
				<view class="search-bar">
					<view class="search-input-wrap">
						<uni-icons class="search-input-icon" color="#999999" size="18" type="search"></uni-icons>
						<input
							v-model="keyword"
							:placeholder="inputPlaceholder"
							class="search-input"
							confirm-type="search"
							placeholder-class="search-placeholder"
							@confirm="handleSearch"
						/>
						<view v-if="keyword" class="search-clear" @click="keyword = ''">
							<uni-icons :color="isDarkMode ? '#8b94a8' : '#c0c4cc'" size="16" type="clear"></uni-icons>
						</view>
					</view>
					<view class="search-btn" hover-class="search-btn-hover" @click="handleSearch">搜索</view>
				</view>

				<!-- 搜索结果区域 -->
				<view class="search-result-area">
					<view class="result-empty">
						<uni-icons :color="isDarkMode ? '#4a5265' : '#d8dce4'" size="56" type="search"></uni-icons>
						<text class="result-empty-text">{{ resultEmptyText }}</text>
					</view>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
export default {
	name: 'DeviceSearchPopup',
	props: {
		visible: { type: Boolean, default: false },
		// 搜索类型：powerbox-配电箱 / light-单灯
		type: { type: String, default: 'powerbox' }
	},
	data() {
		return {
			keyword: ''
		};
	},
	computed: {
		inputPlaceholder() {
			return this.type === 'light' ? '请输入单灯名称/编号' : '请输入配电箱名称/编号';
		},
		resultEmptyText() {
			return this.keyword ? '暂无搜索结果' : '请输入关键字进行搜索';
		}
	},
	watch: {
		visible(v) {
			if (!v) {
				this.keyword = '';
			}
		}
	},
	methods: {
		handleClose() {
			this.$emit('close');
		},
		// 搜索功能暂未接入，仅保留搜索框交互
		handleSearch() {
			try {
				uni.hideKeyboard();
			} catch (e) {
				// 个别平台不支持时静默处理
			}
		}
	}
}
</script>

<style lang="scss" scoped>
/* 弹窗动画 */
.search-pop-enter-active,
.search-pop-leave-active {
	transition: opacity 0.25s ease;
}

.search-pop-enter-active .search-card,
.search-pop-leave-active .search-card {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.search-pop-enter,
.search-pop-leave-to {
	opacity: 0;
}

.search-pop-enter .search-card,
.search-pop-leave-to .search-card {
	opacity: 0;
	transform: scale(0.9);
}

.device-search-popup {
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

.search-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.55);
}

.search-card {
	position: relative;
	width: 640rpx;
	max-height: 80vh;
	box-sizing: border-box;
	padding: 32rpx 32rpx 28rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
}

/* 标题栏 */
.search-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.search-title {
	font-size: 34rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.search-close {
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.search-close-hover {
	opacity: 0.7;
}

/* 搜索框 */
.search-bar {
	display: flex;
	align-items: center;
}

.search-input-wrap {
	flex: 1;
	display: flex;
	align-items: center;
	height: 80rpx;
	padding: 0 20rpx;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 40rpx;
}

.search-input-icon {
	margin-right: 10rpx;
	flex-shrink: 0;
}

.search-input {
	flex: 1;
	height: 100%;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.search-placeholder {
	color: var(--text-quaternary, #999999);
}

.search-clear {
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.search-btn {
	margin-left: 16rpx;
	height: 80rpx;
	padding: 0 36rpx;
	border-radius: 40rpx;
	background: #3880fc;
	color: #ffffff;
	font-size: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.search-btn-hover {
	background: #2266d8;
}

/* 搜索结果区域（预留） */
.search-result-area {
	margin-top: 28rpx;
	height: 560rpx;
	background: var(--bg-soft, #f8f8f8);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.result-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.result-empty-text {
	margin-top: 16rpx;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}
</style>
