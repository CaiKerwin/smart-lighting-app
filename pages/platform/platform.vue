<template>
	<view class="page">
		<view class="header">
			<image src="/static/common/back.png" class="back-icon" @click="goBack" />
		</view>

		<view class="card" @click="detail">
			<view class="card-left">
				<text class="card-title">城市照明</text><br />
				<text class="card-sub">实现对路灯的远程集中控制与管理</text>
			</view>
			<view class="card-right">
				<view class="image-frame">
					<image src="/static/platform/city-lighting.png" mode="widthFix" class="card-image" />
				</view>
			</view>
		</view>

		<platform-detail
			v-if="showModal"
			:clients="clients"
			:selected-id="selectedClientId"
			:search-text="searchText"
			@close="closeModal"
			@select="selectClient"
			@update:searchText="searchText = $event"
		/>
	</view>
</template>

<script>
import platformDetail from './components/platformDetail.vue'

export default {
	name: 'Platform',
	components: {
		platformDetail
	},
	data() {
		return {
			showModal: false,
			searchText: '',
			selectedClientId: 1, // 默认选中第一项
			clients: [
				{
					id: 1,
					name: '城市照明智能监控系统 - 广东省汕尾市中心'
				}
			]
		}
	},
	methods: {
		goBack() {
			uni.redirectTo({ url: '/pages/index/index' })
		},
		detail() {
			this.showModal = true
		},
		closeModal() {
			this.showModal = false
		},
		selectClient(item) {
			this.selectedClientId = item.id;
			this.showModal = false;
			uni.redirectTo({url: '/pages/index/index'});
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	padding: 32rpx;
	background: #f5f8fb;
}

.header {
	display: flex;
	align-items: center;
	margin-bottom: 40rpx;
}
.back-icon {
	width: 24rpx;
	height: 24rpx;
	margin-left: 6rpx;
}

.card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #ffffff;
	border-radius: 24rpx;
	padding: 36rpx;
	box-shadow: 0 8rpx 24rpx rgba(31, 45, 61, 0.06);
	overflow: hidden;
	border: 5rpx solid #3880FC;
}

.card-left {
	flex: 1;
	margin-right: 48rpx;
}
.card-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #172033;
	margin-bottom: 24rpx;
}
.card-sub {
	font-size: 24rpx;
	color: #7c8a97;
	max-width: 360rpx;
}

.card-right {
	width: 280rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.image-frame {
	width: 260rpx;
	height: 170rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(180deg, rgba(245, 248, 255, 1) 0%, rgba(255, 255, 255, 0.8) 100%);
	padding: 12rpx;
}
.card-image {
	width: 100%;
	height: 100%;
	object-fit: contain;
	border-radius: 8rpx;
}
</style>
