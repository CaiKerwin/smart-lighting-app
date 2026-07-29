<template>
	<view class="page-wrapper">
		<view class="alarm-container">
			<!-- 列表内容区 -->
			<scroll-view class="content" scroll-y="true">
				<view class="group-card" v-for="(group, gidx) in groups" :key="gidx">

					<!-- 有报警子项 -->
					<template v-if="group.items && group.items.length > 0">
						<view class="group-header" @click="navigateToPage(group.title)">
							<text class="group-title">{{ group.title }}</text>
						</view>
						<view class="list">
							<view class="list-item" v-for="(item, idx) in group.items" :key="idx">
								<image class="item-icon" :src="item.icon" mode="aspectFill" />
								<view class="item-body">
									<text class="item-label">{{ item.label }}</text>
									<text class="item-count">{{ item.count }}</text>
								</view>
								<view class="item-right">
									<image class="arrow" src="/static/alarm/arrow.png" mode="aspectFit" />
								</view>
							</view>
						</view>
					</template>

					<!-- 无报警子项 -->
					<template v-else>
						<view class="group-item-empty" @click="navigateToPage(group.title)">
							<text class="empty-title">{{ group.title }}</text>
							<image class="arrow" src="/static/alarm/arrow.png" mode="aspectFit" />
						</view>
					</template>
				</view>
				<view class="list-placeholder"></view>
			</scroll-view>
		</view>
		<TabBar :current="1" />
	</view>
</template>

<script>
import TabBar from "../../components/tabBar.vue";
import {base64Decode} from "@/utils/common";
import {request} from "@/utils/request";

export default {
	name: "Alarm",
	components: { TabBar },
	data() {
		return {
			groups: [
				{
					title: '配电箱报警',
					items: []
				},
				{
					title: '单灯报警',
					items: []
				},
				{
					title: '人工报障',
					items: []
				},
				{
					title: '线路供电异常报警',
					items: []
				},
				{
					title: '离线报警',
					items: []
				},
				{
					title: '水浸报警',
					items: []
				}
			],
			fieldMap: {
				'offline': '离线报警',
				'powerbox': '配电箱报警',
				'light': '单灯报警',
				'water': '水浸报警',
				'line': '线路供电异常报警',
				'pole': '人工报障'
			}
		}
	},
	methods:{
		// 获取报警统计数据
		fetchAlarmData() {
			/**
			 * {
			 *   "offline": {
			 *     "oneDay": 0,
			 *     "twoDay": 0,
			 *     "longTime": 190
			 *   },
			 *   "powerbox": {
			 *     "oneDay": 2,
			 *     "twoDay": 0,
			 *     "longTime": 126
			 *   },
			 *   "light": {
			 *     "oneDay": 14,
			 *     "twoDay": 2,
			 *     "longTime": 26437
			 *   },
			 *   "water": {
			 *     "oneDay": 0,
			 *     "twoDay": 0,
			 *     "longTime": 0
			 *   },
			 *   "line": {
			 *     "oneDay": 0,
			 *     "twoDay": 0,
			 *     "longTime": 0
			 *   },
			 *   "pole": {
			 *     "oneDay": 0,
			 *     "twoDay": 0,
			 *     "longTime": 8
			 *   }
			 * }
			 */
			request({
				url: '/station/alarm/AnalysePhone',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const alarmStatisticsData = JSON.parse(base64Decode(payload.data));
					// 更新数据
					this.updateGroups(alarmStatisticsData);
				}
			}).catch(err =>{
				console.error('报警统计数据请求失败',err.message);
			});
		},
		updateGroups(alarmStatisticsData) {
			this.groups = this.groups.map(group => {
				// 根据 group中的title 查找对应的接口字段
				let fieldKey = null;
				for (const [key, title] of Object.entries(this.fieldMap)) {
					if (title === group.title) {
						fieldKey = key;
						break;
					}
				}

				if (fieldKey && alarmStatisticsData[fieldKey]) {
					const data = alarmStatisticsData[fieldKey];
					// 构造 items 数组
					const items = [
						{icon: '/static/alarm/24h-alarm.png', label: '24小时内报警', count: data.oneDay || 0},
						{icon: '/static/alarm/48h-alarm.png', label: '24~48小时报警', count: data.twoDay || 0},
						{icon: '/static/alarm/longtime-alarm.png', label: '长期报警', count: data.longTime || 0}
					];

					// 判断是否所有 count 都为 0
					const allZero = items.every(item => item.count === 0);
					return {
						...group,
						items: allZero ? [] : items
					};
				}

				// 如果找不到对应字段，保持原样
				return group;
			});
		},
		navigateToPage(title) {
			// 将标题编码以防止特殊字符
			const tab = encodeURIComponent(title);
			switch (title){
				case '配电箱报警':
					uni.navigateTo({ url: `/pages/alarm/components/alarmTypes/alarmPowerbox?tab=${tab}` });
					break;
				case '单灯报警':
					uni.navigateTo({ url: `/pages/alarm/components/alarmTypes/alarmLight?tab=${tab}` });
					break;
				case '人工报障':
					uni.navigateTo({ url: `/pages/alarm/components/alarmTypes/alarmWorker?tab=${tab}` });
					break;
				case '线路供电异常报警':
					uni.navigateTo({ url: `/pages/alarm/components/alarmTypes/alarmException?tab=${tab}` });
					break;
				case '离线报警':
					uni.navigateTo({ url: `/pages/alarm/components/alarmTypes/alarmOffline?tab=${tab}` });
					break;
				case '水浸报警':
					uni.navigateTo({ url: `/pages/alarm/components/alarmTypes/alarmWater?tab=${tab}` });
					break;
				default:
					break;
			}
		}
	},
	onLoad() {
		this.fetchAlarmData();
	},
};
</script>

<style scoped>
/* 页面整体容器 */
.page-wrapper {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: #f5f6fa;
}

.alarm-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 0 24rpx;
	margin-top: 10px;
	overflow: hidden;
}

/* 列表滚动区 */
.content {
	flex: 1;
	overflow-y: auto;
	padding-bottom: 20rpx;
}

/* 卡片通用样式 */
.group-card {
	background-color: #ffffff;
	border-radius: 20rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

/* ----- 有子项的卡片 ----- */
.group-header {
	padding: 24rpx 24rpx 12rpx 24rpx;
}
.group-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a1a;
}

.list-item {
	display: flex;
	align-items: center;
	padding: 24rpx 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
}
.list-item:last-child {
	border-bottom: none;
}

.item-icon {
	width: 80rpx;
	height: 80rpx;
	margin-right: 20rpx;
	border-radius: 50%; /* 确保图标展示为圆形 */
	flex-shrink: 0;
}

.item-body {
	flex: 1;
	display: flex;
	flex-direction: column;
}
.item-label {
	font-size: 28rpx;
	color: #888888;
	margin-bottom: 4rpx;
}
.item-count {
	font-size: 34rpx;
	font-weight: 600;
	color: #333333;
}

.item-right {
	display: flex;
	align-items: center;
	padding-left: 12rpx;
}
.arrow {
	width: 28rpx;
	height: 28rpx;
	opacity: 0.3;
}

/* 无子项的卡片（单行空卡片） */
.group-item-empty {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx 24rpx;
}
.empty-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333333;
}

.list-placeholder {
	width: 100%;
	height: 160rpx;
}
</style>
