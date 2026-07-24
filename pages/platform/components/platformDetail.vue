<template>
	<view class="modal-mask" @click.self="$emit('close')">
		<view class="modal-box">
			<view class="modal-header">
				<text class="modal-title">平台客户列表</text>
				<image src="/static/common/close.png" class="close-icon" @click="$emit('close')" />
			</view>

			<view class="search-box">
				<image src="/static/common/search.png" class="search-icon" />
				<!-- @click.stop用于拦住事件冒泡 -->
				<input
					@click.stop
					ref="searchInput"
					class="search-input"
					type="text"
					placeholder="请输入平台名称"
					:value="searchText"
					@input="onInput"
				/>
			</view>

			<scroll-view class="client-list" scroll-y="true">
				<view
					v-for="item in filteredClients"
					:key="item.id"
					:class="['client-item', { active: item.id === selectedId }]"
					@click="select(item)"
				>
					<view class="item-left">
						<image src="/static/common/platform.png" class="item-icon" />
						<text class="item-text">{{ item.name }}</text>
					</view>
					<image
						v-if="item.id === selectedId"
						src="/static/common/check.png"
						class="item-check"
					/>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PlatformDetail',
	props: {
		clients: {
			type: Array,
			default: () => []
		},
		selectedId: {
			type: [String, Number],
			default: null
		},
		searchText: {
			type: String,
			default: ''
		}
	},
	emits: ['close', 'select', 'update:searchText'],
	mounted() {
		// 在下一次 DOM 更新循环中执行延迟回调
		this.$nextTick(() =>{
			if (this.$refs.searchInput && this.$refs.searchInput.focus) {
				this.$refs.searchInput.focus()
			}
		});
	},
	computed: {
		filteredClients() {
			const keyword = this.searchText.trim().toLowerCase()
			if (!keyword) return this.clients
			return this.clients.filter(item =>
				item.name.toLowerCase().includes(keyword)
			)
		}
	},
	methods: {
		onInput(event) {
			this.$emit('update:searchText', event.detail.value)
		},
		select(item) {
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
	min-width: 600rpx;
	background: #ffffff;
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
	color: #172033;
}
.close-icon {
	width: 32rpx;
	height: 32rpx;
}

.search-box {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
	gap: 18rpx;
}

.search-icon {
	width: 40rpx;
	height: 40rpx;
}

.search-input {
	flex: 1;
	height: 80rpx;
	padding: 0;
	border-radius: 16rpx;
	border: 1rpx solid #e6ecf3;
	background: #f5f8fb;
	font-size: 26rpx;
	color: #172033;
}

.client-list {
	max-height: 520rpx;
}
.client-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx;
	border: 1rpx solid #dce3eb;
	border-radius: 22rpx;
	margin-bottom: 16rpx;
	background: #fff;
}
.client-item.active {
	border-color: #3880FC;
}
.item-left {
	display: flex;
	align-items: center;
}
.item-icon {
	width: 36rpx;
	height: 36rpx;
	margin-right: 18rpx;
}
.item-text {
	font-size: 24rpx;
	color: #172033;
	line-height: 36rpx;
}
.item-check {
	width: 32rpx;
	height: 32rpx;
}
</style>
