<template>
	<view :class="themeClass" class="modal-mask" @click.self="$emit('close')">
		<view class="modal-box">
			<view class="modal-header">
				<text class="modal-title">平台客户列表</text>
				<uni-icons :color="isDarkMode ? '#fff' : '#000'" size="22" type="closeempty" @click="$emit('close')" />
			</view>

			<view class="search-box">
				<image src="/static/common/search.png" class="search-icon" />
				<input
					@click.stop
					ref="searchInput"
					class="search-input"
					type="text"
					placeholder="请输入应用名称或客户名称"
					placeholder-class="search-placeholder"
					:value="searchText"
					@input="onInput"
				/>
				<view v-if="searchText" class="search-clear" @click.stop="onClear">
					<uni-icons :color="isDarkMode ? '#8b94a8' : '#c0c4cc'" size="20" type="clear" />
				</view>
			</view>

			<scroll-view class="client-list" scroll-y="true">
				<view
					v-for="item in filteredClients"
					:key="item.key"
					:class="['client-item', { active: item.id === selectedId && item.appType === currentApp }]"
					@click="select(item)"
				>
					<view class="item-left">
						<image src="/static/common/platform.png" class="item-icon" />
						<text class="item-text">{{ item.appName }} - {{ item.name }}</text>
					</view>
					<image
						v-if="item.id === selectedId && item.appType === currentApp"
						src="/static/common/check.png"
						class="item-check"
					/>
				</view>
				<view v-if="filteredClients.length === 0" class="empty-tip">无匹配的应用</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PlatformDetail',
	props: {
		clients: { type: Array, default: () => [] },
		appType: { type: String, default: '' },
		selectedId: { type: [String, Number], default: null },
		currentApp: { type: String, default: '' }, // 新增：当前登录用户的 curApp
		searchText: { type: String, default: '' }
	},
	emits: ['close', 'select', 'update:searchText'],
	mounted() {
		this.$nextTick(() => {
			if (this.$refs.searchInput && this.$refs.searchInput.focus) {
				this.$refs.searchInput.focus()
			}
		})
	},
	computed: {
		filteredClients() {
			const list = Array.isArray(this.clients) ? this.clients : [];
			let filtered = list.filter(item => item && item.appType === this.appType)
			const keyword = (this.searchText || '').trim().toLowerCase()
			if (keyword) {
				filtered = filtered.filter(item => {
					const combined = ((item.appName || '') + (item.name || '')).toLowerCase()
					return combined.includes(keyword)
				})
			}
			return filtered
		}
	},
	methods: {
		onInput(event) {
			this.$emit('update:searchText', event.detail.value)
		},
		onClear() {
			this.$emit('update:searchText', '')
		},
		select(item) {
			if (!item) {
				return
			}
			this.$emit('select', item)
		}
	}
}
</script>

<style lang="scss" scoped>
.modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.modal-box {
	width: 80%;
	background: var(--bg-card, #ffffff);
	border-radius: 32rpx;
	padding: 32rpx;
	box-shadow: 0 18rpx 60rpx rgba(0, 0, 0, 0.12);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}
.modal-title {
	font-size: 32rpx;
	font-weight: 700;
	color: var(--text-primary, #172033);
}

.search-box {
	display: flex;
	align-items: center;
	height: 80rpx;
	padding: 0 20rpx;
	margin-bottom: 24rpx;
	border-radius: 16rpx;
	border: 1rpx solid var(--border-color, #e6ecf3);
	background: var(--bg-soft, #f5f8fb);
}

.search-icon {
	width: 32rpx;
	height: 32rpx;
	margin-right: 12rpx;
	flex-shrink: 0;
}

.search-input {
	flex: 1;
	min-width: 0;
	height: 100%;
	font-size: 26rpx;
	color: var(--text-primary, #172033);
}

.search-placeholder {
	color: var(--text-quaternary, #999999);
}

.search-clear {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	padding: 8rpx;
	margin-left: 8rpx;
	margin-right: -8rpx;
}

.client-list {
	max-height: 520rpx;
}
.client-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx;
	border: 1rpx solid var(--border-color, #dce3eb);
	border-radius: 22rpx;
	margin-bottom: 16rpx;
	background: var(--bg-card, #fff);
}
.client-item.active {
	border-color: #3880FC;
}
.item-left {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
}
.item-icon {
	width: 36rpx;
	height: 36rpx;
	margin-right: 18rpx;
	flex-shrink: 0;
}
.item-text {
	flex: 1;
	min-width: 0;
	font-size: 24rpx;
	color: var(--text-primary, #172033);
	line-height: 32rpx;
}
.item-check {
	width: 32rpx;
	height: 32rpx;
	flex-shrink: 0;
}
.empty-tip {
	text-align: center;
	color: var(--text-quaternary, #999);
	padding: 40rpx 0;
	font-size: 26rpx;
}
</style>
