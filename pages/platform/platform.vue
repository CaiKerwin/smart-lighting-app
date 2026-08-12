<template>
	<view class="page">
		<!-- 卡片部分不变 -->
		<view
			v-for="card in cards"
			:key="card.appType"
			:class="{ active: card.appType === currentApp }"
			class="card"
			@click="detail(card.appType)"
		>
			<view class="card-left">
				<text class="card-title">{{ card.name }}</text><br />
				<text class="card-sub">{{ card.description }}</text>
			</view>
			<view class="card-right">
				<view class="image-frame">
					<image :src="card.image" class="card-image" mode="widthFix" />
				</view>
			</view>
		</view>

		<platform-detail
			v-if="showModal"
			:app-type="currentAppType"
			:clients="allClients"
			:current-app="currentApp"
			:selected-id="currentCustId"
			:search-text="searchText"
			@close="closeModal"
			@select="selectClient"
			@update:searchText="searchText = $event"
		/>
	</view>
</template>

<script>
import platformDetail from './components/platformDetail.vue'
import { request } from '@/utils/request'
import { base64Decode } from '@/utils/common'

export default {
	name: 'Platform',
	components: {
		platformDetail
	},
	data() {
		return {
			showModal: false,
			searchText: '',
			currentAppType: '',
			allClients: [],
			currentApp: '', // 当前登录用户的 curApp
			currentCustId: null,
			cards: [
				{
					appType: 'road',
					name: '城市照明',
					description: '实现对路灯的远程集中控制与管理',
					image: '/static/platform/city-lighting.png'
				},
				{
					appType: 'factory',
					name: '工厂照明',
					description: '采用物联网智控节能实现控、管、维一体化技术架构',
					image: '/static/platform/factory-lighting.png'
				},
				{
					appType: 'pole',
					name: '智慧灯杆',
					description: '采用物联网智控节能实现灯杆的远程集中控制与管理',
					image: '/static/platform/pole-lighting.png'
				}
			]
		}
	},
	onLoad() {
		this.currentCustId = uni.getStorageSync('curCust') || null
		this.currentApp = uni.getStorageSync('curApp') || 'road' // 默认 road
		this.getPlatformList()
	},
	methods: {
		getPlatformList() {
			/**
			 * [
			 *   {
			 *     "id": 2,
			 *     "appType": "factory",
			 *     "name": "湖南省长沙工厂项目",
			 *     "appName": "长沙工厂项目工厂照明",
			 *     "logo": "bc97b5c243d342649fec930ef84c0076",
			 *     "isOwner": false
			 *   },
			 *   {
			 *     "id": 4,
			 *     "appType": "road",
			 *     "name": "亚美达现代城市照明",
			 *     "appName": "内部测试城市照明",
			 *     "logo": "93777905ed554945a3b9f4aa58f7ff11",
			 *     "isOwner": false
			 *   },
			 *   {
			 *     "id": 4,
			 *     "appType": "factory",
			 *     "name": "亚美达现代城市照明",
			 *     "appName": "内部测试工厂照明",
			 *     "logo": "eeddc663e934434aa72414186ef344ef",
			 *     "isOwner": false
			 *   },
			 *   {
			 *     "id": 4,
			 *     "appType": "pole",
			 *     "name": "亚美达现代城市照明",
			 *     "appName": "内部测试智慧灯杆",
			 *     "logo": "031f81de955c4bb78971c028188bba9a",
			 *     "isOwner": false
			 *   },
			 *   {
			 *     "id": 2,
			 *     "appType": "road",
			 *     "name": "湖南省长沙工厂项目",
			 *     "appName": "内部测试88888",
			 *     "logo": "82d40428e1474bc8a104eeedb4a51089",
			 *     "isOwner": false
			 *   },
			 *   {
			 *     "id": 4,
			 *     "appType": "light",
			 *     "name": "亚美达现代城市照明",
			 *     "appName": "单灯版智能监控系统",
			 *     "logo": "3a5fad3ca916421296c9ea44e2cf8f9d",
			 *     "isOwner": false
			 *   },
			 *   {
			 *     "id": 502,
			 *     "appType": "road",
			 *     "name": "App专用测试项目",
			 *     "appName": "App专用测试项目",
			 *     "logo": "859235ffb01a451db52ebeb4290761db",
			 *     "isOwner": false
			 *   }
			 * ]
			 */
			request({
				url: '/common/auth/QueryMyCust',
				method: 'POST',
				data: {}
			}).then(res => {
				const payload = res.data
				if (payload && payload.data) {
					let list = payload.data
					try {
						const decoded = base64Decode(list)
						list = JSON.parse(decoded)
					} catch (e) {
						console.error('解析应用列表失败', e)
						list = []
					}

					this.allClients = list
				} else {
					uni.showToast({ title: '获取应用列表失败', icon: 'none' })
				}
			}).catch(err => {
				console.error('请求应用列表错误', err)
				uni.showToast({ title: '网络异常', icon: 'none' })
			})
		},
		detail(appType) {
			this.currentAppType = appType
			this.showModal = true
		},
		closeModal() {
			this.showModal = false
			this.searchText = ''
		},
		selectClient(item) {
			const appType = item.appType;
			const custId = item.id;

			// 仅城市照明（road）支持切换，其他提示
			if (appType !== 'road') {
				uni.showToast({
					title: '暂时不支持切换',
					icon: 'none'
				});
				return;
			}

			// 切换组织
			request({
				url: '/common/auth/SwitchCust',
				method: 'POST',
				data: {
					app: appType,    // app类型
					cust: custId     // 客户ID
				}
			})
				.then(res => {
					console.log(base64Decode(res.data.data));
					if (res.data && res.data.code === 0) {
						// 更新本地存储
						uni.setStorageSync('curCust', custId);
						uni.setStorageSync('curApp', appType);
						// 关闭弹窗
						this.closeModal();
						// 重新加载首页，刷新整个APP状态
						uni.reLaunch({
							url: '/pages/index/index'
						});
					} else {
						uni.showToast({
							title: res.data?.msg || '切换失败',
							icon: 'none'
						});
					}
				})
				.catch(err => {
					console.error('切换失败', err);
					uni.showToast({
						title: '网络异常，切换失败',
						icon: 'none'
					});
				});
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

.card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #ffffff;
	border-radius: 24rpx;
	padding: 36rpx;
	box-shadow: 0 8rpx 24rpx rgba(31, 45, 61, 0.06);
	overflow: hidden;
	border: 5rpx solid #e4e7ed;
	margin-bottom: 24rpx;
	transition: border-color 0.3s;
}

.card.active {
	border-color: #3880FC;
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
