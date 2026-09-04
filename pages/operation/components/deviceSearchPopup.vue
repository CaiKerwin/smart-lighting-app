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
						<uni-icons :color="isDarkMode ? '#6d7689' : '#999999'" class="search-input-icon" size="18" type="search" />
						<input
							v-model="keyword"
							:placeholder="inputPlaceholder"
							class="search-input"
							confirm-type="search"
							placeholder-class="search-placeholder"
							@confirm="handleSearch"
						/>
						<view v-if="keyword" class="search-clear" @click="keyword = ''">
							<uni-icons :color="isDarkMode ? '#8b94a8' : '#c0c4cc'" size="16" type="clear" />
						</view>
					</view>
					<view class="search-btn" hover-class="search-btn-hover" @click="handleSearch">搜索</view>
				</view>

				<!-- 搜索结果区域 -->
				<view class="search-result-area">
					<!-- 加载中 -->
					<view v-if="searching" class="result-loading">
						<view class="loading-spinner"></view>
						<text class="loading-text">搜索中...</text>
					</view>
					<!-- 有结果 -->
					<view v-else-if="searchResults.length" class="result-list">
						<view
							v-for="item in searchResults"
							:key="item.id"
							class="result-item"
							hover-class="result-item-hover"
							@click="handleItemClick(item)"
						>
							<view class="result-item-main">
								<view class="result-name-row">
									<text class="result-name">{{ item.name }}</text>
									<text v-if="item.isStation" class="result-tag result-tag-station">站点</text>
									<text v-else class="result-tag result-tag-group">分组</text>
								</view>
							</view>
							<uni-icons :color="isDarkMode ? '#6d7689' : '#c0c4cc'" class="result-arrow" size="16" type="right"></uni-icons>
							<view class="result-divider"></view>
						</view>
					</view>
					<!-- 空状态 -->
					<view v-else class="result-empty">
						<uni-icons :color="isDarkMode ? '#46506a' : '#d8dce4'" size="56" type="search"></uni-icons>
						<text class="result-empty-text">{{ resultEmptyText }}</text>
					</view>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	name: 'DeviceSearchPopup',
	props: {
		visible: {type: Boolean, default: false},
		// 搜索类型：powerbox-配电箱 / light-单灯
		type: {type: String, default: 'powerbox'}
	},
	data() {
		return {
			keyword: '',
			searchResults: [],   // 搜索结果列表
			searching: false,     // 是否加载中
			searched: false,      // 是否已搜索过
		};
	},
	computed: {
		inputPlaceholder() {
			return this.type === 'light' ? '请输入单灯名称/编号' : '请输入配电箱名称/编号';
		},
		resultEmptyText() {
			// 已搜索、有关键词且结果为空
			if (this.searched && this.keyword && this.searchResults.length === 0) return '暂无搜索结果';
			return '请输入关键字进行搜索';
		}
	},
	watch: {
		// 输入清空时自动清空搜索结果
		keyword(newVal) {
			if (!newVal) {
				this.searchResults = [];
				this.searched = false;   // 清空关键词时重置搜索状态
			}
		}
	},
	methods: {
		handleClose() {
			this.$emit('close');
		},
		// 搜索站点叶子节点或者分组节点
		handleSearch() {
			// 校验
			if (!this.keyword) {
				uni.showToast({title: '请输入关键字', icon: 'none'})
				this.searchResults = [];
				this.searched = false;   // 关键词为空时不视为已搜索
				return;
			}
			this.searching = true;
			this.searched = true;   // 标记已执行搜索
			/**
			 * [
			 *   {
			 *     "isStation": true,
			 *     "id": 2085,
			 *     "name": "111"
			 *   },
			 *   {
			 *     "isStation": true,
			 *     "id": 3648,
			 *     "name": "lora单灯"
			 *   },
			 *   {
			 *     "isStation": true,
			 *     "id": 2084,
			 *     "name": "MR307DL"
			 *   },
			 *   {
			 *     "isStation": true,
			 *     "id": 3635,
			 *     "name": "勿删：成都数德科技测试点"
			 *   },
			 *   {
			 *     "isStation": true,
			 *     "id": 2681,
			 *     "name": "测试2131112"
			 *   }
			 * ]
			 */
			request({
				url: '/station/config/FilterTree',
				method: 'POST',
				data: {
					filter: this.keyword //输入的内容
				}
			}).then(res => {
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					try {
						const list = JSON.parse(base64Decode(payload.data));
						this.searchResults = Array.isArray(list) ? list : [];
					} catch (e) {
						console.error('解析搜索结果失败', e);
						this.searchResults = [];
					}
				} else {
					this.searchResults = [];
				}
			}).catch(err => {
				console.error('搜索站点错误', err.message);
				uni.showToast({title: '搜索失败', icon: 'none'});
				this.searchResults = [];
			}).finally(() => {
				this.searching = false;
			});
		},
		handleItemClick(item){
			console.log('跳转到详情界面',item.name);
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
	padding: 32rpx 32rpx 32rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
	display: flex;
	flex-direction: column;
}

/* 标题栏 */
.search-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
	flex-shrink: 0;
}

.search-title {
	font-size: 34rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.search-close {
	margin-right: -8rpx;
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
	flex-shrink: 0;
}

.search-input-wrap {
	flex: 1;
	min-width: 0;
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
	min-width: 0;
	height: 100%;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.search-placeholder {
	color: var(--text-quaternary, #999999);
}

.search-clear {
	padding: 8rpx;
	margin-right: -8rpx;
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

/* 搜索结果区域 */
.search-result-area {
	margin-top: 28rpx;
	height: 560rpx;
	min-height: 240rpx;
	flex-shrink: 1;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 20rpx;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

/* 加载中 */
.result-loading {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.loading-spinner {
	width: 40rpx;
	height: 40rpx;
	border: 4rpx solid var(--border-color, #e5e5e5);
	border-top-color: #3880fc;
	border-radius: 50%;
	animation: search-spin 0.8s linear infinite;
}

@keyframes search-spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.loading-text {
	margin-top: 18rpx;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}

/* 搜索结果列表 */
.result-list {
	flex: 1;
	overflow-y: auto;
	padding: 0 24rpx;
}

.result-item {
	display: flex;
	align-items: center;
	padding: 26rpx 0;
	position: relative;
}

.result-item-hover {
	opacity: 0.7;
}

.result-item-main {
	flex: 1;
	min-width: 0;
}

.result-name-row {
	display: flex;
	align-items: center;
}

.result-name {
	display: block;
	flex-shrink: 1;
	min-width: 0;
	font-size: 30rpx;
	color: var(--text-primary, #333333);
	line-height: 1.4;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.result-tag {
	flex-shrink: 0;
	margin-left: 12rpx;
	padding: 2rpx 14rpx;
	font-size: 22rpx;
	background: var(--bg-accent, #eef3ff);
	border-radius: 8rpx;

	&-station {
		color: #3880fc;
		background: #eef3ff;
	}
	&-group {
		color: #888;
		background: #f0f0f0;
	}
}

.result-arrow {
	margin-left: 16rpx;
	flex-shrink: 0;
}

.result-divider {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1rpx;
	background: var(--border-color, #e5e5e5);
}

.result-item:last-child .result-divider {
	display: none; /* 最后一项不显示分割线 */
}

/* 空状态 */
.result-empty {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0 32rpx;
}

.result-empty-text {
	margin-top: 20rpx;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
	text-align: center;
}
</style>
