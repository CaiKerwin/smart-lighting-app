<template>
	<view class="page-wrapper">
		<view class="content">
			<!-- 标签栏 -->
			<view class="title-bar">
				<text
					:class="{ active: currentTab === 'home' }"
					class="page-title"
					@click="switchTab('home')"
				>首页
				</text>
				<text
					:class="{ active: currentTab === 'config' }"
					class="page-title"
					@click="switchTab('config')"
				>工单配置
				</text>
			</view>

			<block v-if="currentTab === 'home'">
				<!-- 工单搜索 -->
				<view class="card search-card">
					<view class="section-header">
						<text class="dot">•</text>
						<text class="section-label">工单搜索</text>
					</view>
					<view class="search-row">
						<!-- 下拉选择框 -->
						<view class="select-box" @click.stop="toggleDropdown">
							<text>{{ currentSearchLabel }}</text>
							<view class="arrow-down"></view>
							<view v-show="showDropdown" class="dropdown-list">
								<view
									v-for="item in searchOptions"
									:key="item.value"
									class="dropdown-item"
									@click.stop="selectOption(item)"
								>
									{{ item.label }}
								</view>
							</view>
						</view>
						<!-- 输入框 -->
						<view class="input-box">
							<!-- 普通文本输入 -->
							<input
								v-if="searchType !== 'generateTime'"
								v-model="searchValue"
								:placeholder="inputPlaceholder"
								class="search-input"
							/>
							<!-- 日期选择器（直接使用 picker） -->
							<picker
								v-else
								:value="searchValue"
								class="date-picker-wrapper"
								mode="date"
								@change="onDateChange"
							>
								<view :class="{ 'placeholder': !searchValue }" class="date-display">
									{{ searchValue || '请选择日期' }}
								</view>
							</picker>
							<image
								class="clear-icon"
								mode="aspectFit"
								src="/static/common/close.png"
								@tap="clearSearch"
							/>
						</view>
						<view class="search-btn" @click="searchWorkOrder(searchType)">搜索</view>
					</view>
				</view>

				<!-- 消息通知 -->
				<view class="card notice-card">
					<view class="section-header">
						<text class="dot">•</text>
						<text class="section-label">消息通知</text>
					</view>
					<view class="notice-buttons">
						<!-- 蓝色按钮 -->
						<view class="notice-btn btn-blue">
							<image mode="aspectFit" src="/static/workOrder/my-message.png"/>
							<text>我的消息</text>
						</view>
						<!-- 紫色按钮 -->
						<view class="notice-btn btn-purple" @click="navigateToWorkOrderStatistics">
							<image mode="aspectFit" src="/static/workOrder/information.png"/>
							<text>工单统计</text>
						</view>
					</view>
				</view>

				<!-- 状态列表 -->
				<view class="card status-card">
					<view class="status-list">
						<view v-for="(item, index) in statusItems" :key="item.label" class="status-item"
						      @click="navigateToWorkOrderStatus(item.label)">
							<view class="status-left">
								<image :src="item.icon" mode="aspectFit"/>
								<text>{{ item.label }}</text>
							</view>
							<text class="status-num">{{ item.count }}</text>
						</view>
					</view>
				</view>

				<!-- 历史工单 -->
				<view class="history-card" @click="navigateToHistory">
					<text>历史工单</text>
					<image alt="箭头" mode="aspectFit" src="/static/alarm/arrow.png"/>
				</view>
			</block>

			<!-- 工单配置内容 -->
			<WorkOrderConfig v-if="currentTab === 'config'"/>
		</view>


		<TabBar :current="2"/>
	</view>
</template>

<script>
import TabBar from "../../components/tabBar.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import WorkOrderConfig from "@/pages/workOrder/components/workOrderConfig.vue";

export default {
	name: "WorkOrder",
	components: {TabBar, WorkOrderConfig},
	data() {
		return {
			currentTab: 'home', // 当前激活标签页
			searchValue: "",
			searchType: "workOrderId", // 当前搜索类型
			searchOptions: [
				{label: "工单ID", value: "workOrderId"},
				{label: "故障内容", value: "workOrderName"},
				{label: "生成时间", value: "generateTime"},
			],
			showDropdown: false,
			statusItems: [
				{icon: "/static/workOrder/pending.png", label: "待受理", count: 0},
				{icon: "/static/workOrder/processing.png", label: "维修中", count: 0},
				{icon: "/static/workOrder/admin.png", label: "管理员审核", count: 0},
				{icon: "/static/workOrder/system.png", label: "系统审核", count: 0},
				{icon: "/static/workOrder/feedback.png", label: "误报反馈", count: 0},
				{icon: "/static/workOrder/timeout.png", label: "超期工单", count: 0},
				{icon: "/static/workOrder/work-end.png", label: "已结束", count: 0},
			]
		};
	},
	computed: {
		currentSearchLabel() {
			const found = this.searchOptions.find(item => item.value === this.searchType);
			return found ? found.label : "工单ID";
		},
		inputPlaceholder() {
			const map = {
				workOrderId: "请输入工单ID",
				workOrderName: "请输入故障内容",
				generateTime: "请选择日期",
			};
			return map[this.searchType] || "请输入";
		},
	},
	onLoad() {
		// 页面加载时获取工单状态数据
		this.fetchWorkOrderStatusData();
	},
	methods: {
		// 切换标签
		switchTab(tab) {
			this.currentTab = tab;
		},
		toggleDropdown() {
			this.showDropdown = !this.showDropdown;
		},
		selectOption(item) {
			this.searchType = item.value;
			this.searchValue = ""; // 切换类型时清空
			this.showDropdown = false;
		},
		onDateChange(e) {
			this.searchValue = e.detail.value;
		},
		clearSearch() {
			this.searchValue = "";
		},
		navigateToWorkOrderStatus(status) {
			const statusMap = {
				"待受理": "pending",
				"维修中": "repairing",
				"管理员审核": "adminReview",
				"系统审核": "systemReview",
				"误报反馈": "falseFeedback",
				"超期工单": "overdue",
				"已结束": "ended"
			};

			uni.navigateTo({
				url: `/pages/workOrder/components/workOrderTypes/${statusMap[status]}`,
			});
		},
		navigateToHistory() {
			uni.navigateTo({
				url: "/pages/workOrder/components/workOrderHistory",
			});
		},
		fetchWorkOrderStatusData() {
			/**
			 * [
			 *   {
			 *     "status": 1,
			 *     "name": "待受理",
			 *     "count": 0
			 *   },
			 *   {
			 *     "status": 2,
			 *     "name": "维修中",
			 *     "count": 0
			 *   },
			 *   {
			 *     "status": 3,
			 *     "name": "管理员审核",
			 *     "count": 0
			 *   },
			 *   {
			 *     "status": 4,
			 *     "name": "系统审核",
			 *     "count": 0
			 *   },
			 *   {
			 *     "status": 5,
			 *     "name": "误报反馈",
			 *     "count": 0
			 *   },
			 *   {
			 *     "status": 6,
			 *     "name": "超期工单",
			 *     "count": 0
			 *   },
			 *   {
			 *     "status": 7,
			 *     "name": "已结束",
			 *     "count": 0
			 *   }
			 * ]
			 */
			request({
				url: '/station/Maintance/QueryWorkOrderStatus',
				method: 'POST',
				// 查询所有状态的工单数量
				data: {
					start: '',
					end: ''
				}
			}).then(res => {
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const workOrderStatusData = JSON.parse(base64Decode(payload.data));
					this.statusItems.forEach(item => {
						const findCount = workOrderStatusData.find(p => p.name === item.label);
						item.count = findCount ? findCount.count : 0;
					});
				} else {
					console.error('查询不同状态工单数量错误:', payload.message);
					uni.showToast({title: '查询不同状态工单数量错误' + payload.message, icon: 'none'});
				}
			}).catch(err => {
				console.error('查询不同状态工单数量错误:', err.message);
			});
		},
		searchWorkOrder(searchType) {
			// 校验搜索内容
			if (!this.searchValue || this.searchValue.trim() === '') {
				uni.showToast({title: '请输入搜索内容', icon: 'none'});
				return;
			}
			const value = this.searchValue.trim();
			// 跳转到搜索结果页，传递参数
			uni.navigateTo({
				url: `/pages/workOrder/components/workOrderSearch?searchType=${searchType}&searchValue=${encodeURIComponent(value)}`
			});
		},
		navigateToWorkOrderStatistics(){
			uni.navigateTo({
				url: "/pages/workOrder/components/workOrderStatistics",
			});
		}
	},
};
</script>

<style lang="scss" scoped>
.page-wrapper {
	height: 100vh;
}

.content {
	padding: 20rpx 20rpx 180rpx 20rpx;
	background-color: #EFF3FB;
}

/* 标题栏样式 */
.title-bar {
	display: flex;
	justify-content: center;
	margin-top: 0;
	margin-bottom: 20rpx;
	gap: 40rpx; /* 标签间距 */
}

.page-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #999; /* 默认灰色 */
	padding-bottom: 8rpx;
	border-bottom: 4rpx solid transparent;
	transition: all 0.3s;
	cursor: pointer;
}

.page-title.active {
	color: #3880FC;
	border-bottom-color: #3880FC;
}

/* 通用卡片样式 */
.card {
	background: #fff;
	border-radius: 30rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 92, 255, 0.08);
}

/* 标题前带黑点样式 */
.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.dot {
	font-weight: bold;
	font-size: 30rpx;
	margin-right: 6rpx;
	color: #333;
}

.section-label {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
}

/* 搜索栏样式 */
.search-row {
	display: flex;
	align-items: center;
	position: relative;
}

.select-box {
	width: 160rpx;
	height: 70rpx;
	background: #f4f8ff;
	border-radius: 16rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	color: #2b58ff;
	font-size: 28rpx;
	position: relative;
	cursor: pointer;
	user-select: none;
}

.select-box text {
	margin-right: 30rpx;
}

.arrow-down {
	position: absolute;
	right: 16rpx;
	top: 50%;
	transform: translateY(-50%);
	width: 0;
	height: 0;
	border-left: 8rpx solid transparent;
	border-right: 8rpx solid transparent;
	border-top: 10rpx solid #7b9eff;
}

/* 下拉列表 */
.dropdown-list {
	position: absolute;
	top: calc(100% + 8rpx);
	left: 0;
	width: 100%;
	background: #ffffff;
	border-radius: 16rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
	z-index: 10;
	overflow: hidden;
}

.dropdown-item {
	padding: 20rpx 24rpx;
	font-size: 28rpx;
	color: #333;
	border-bottom: 1rpx solid #f0f2f5;
}

.dropdown-item:last-child {
	border-bottom: none;
}

.dropdown-item:active {
	background: transparent;
}

.input-box {
	flex: 1;
	margin: 0 16rpx;
	height: 70rpx;
	background: #f5f7fa;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	padding: 0 16rpx;
	position: relative;
}

.search-input {
	flex: 1;
	height: 100%;
	font-size: 28rpx;
	color: #333;
}

.clear-icon {
	width: 40rpx;
	height: 40rpx;
	margin-left: 10rpx;
	flex-shrink: 0;
}

/* 日期选择器 */
.date-picker-wrapper {
	flex: 1;
	height: 100%;
	display: flex;
	align-items: center;
}

.date-display {
	font-size: 28rpx;
	color: #333;
	width: 100%;
}

.date-display.placeholder {
	color: #b0b8c4;
}

.search-btn {
	width: 120rpx;
	height: 70rpx;
	border-radius: 16rpx;
	background: #3a73ff;
	color: #fff;
	font-size: 28rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}

/* 消息通知按钮样式 */
.notice-buttons {
	display: flex;
	justify-content: space-between;
}

.notice-btn {
	width: 48%;
	height: 120rpx;
	border-radius: 20rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: row;
}

.notice-btn image {
	width: 48rpx;
	height: 48rpx;
	margin-right: 14rpx;
}

.notice-btn text {
	font-size: 28rpx;
}

.btn-blue {
	background: linear-gradient(135deg, #4d8cff, #2b58ff);
}

.btn-blue text {
	color: #fff;
}

.btn-purple {
	background: linear-gradient(135deg, #8c7aff, #6c66ff);
}

.btn-purple text {
	color: #fff;
}

/* 状态列表 */
.status-list {
	display: flex;
	flex-direction: column;
}

.status-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 26rpx 0;
	border-bottom: 1rpx solid #f0f2f5;
}

.status-item:last-child {
	border-bottom: none;
}

.status-left {
	display: flex;
	align-items: center;
}

.status-left image {
	width: 48rpx;
	height: 48rpx;
	margin-right: 20rpx;
}

.status-left text {
	font-size: 28rpx;
	color: #333;
}

.status-num {
	font-size: 32rpx;
	font-weight: 500;
	color: #333;
}

.history-card {
	margin: 0 0 20rpx;
	padding: 24rpx;
	border-radius: 28rpx;
	background: #fff;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 6rpx 20rpx rgba(0, 92, 255, 0.08);
}

.history-card text {
	font-size: 30rpx;
	color: #333;
}

.history-card image {
	width: 28rpx;
	height: 28rpx;
	margin-left: 14rpx;
}
</style>
