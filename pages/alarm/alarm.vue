<template>
	<view :class="themeClass" class="page-wrapper">
		<view class="alarm-container">
			<!-- 列表内容区 -->
			<view class="content">
				<view
					v-for="(group, gidx) in groups"
					:key="gidx"
					:class="{ 'is-empty': !hasItems(group) }"
					class="group-card"
				>

					<!-- 卡片头部 -->
					<view
						:hover-stay-time="80"
						class="group-header"
						hover-class="header-pressed"
						@click="navigateToPage(group.title)"
					>
						<!-- 状态点 -->
						<view class="status-dot">
							<uni-icons
								:color="statusIconColor(group)"
								:size="12"
								type="smallcircle-filled"
							/>
						</view>
						<text class="group-title">{{ $t(group.titleKey) }}</text>
					</view>

					<!-- 有报警 -->
					<view v-if="hasItems(group)" class="metric-list">
						<view
							v-for="(item, idx) in group.items"
							:key="idx"
							:class="{ 'is-active': item.count > 0, 'is-zero': !(item.count > 0) }"
							:hover-stay-time="80"
							class="metric-row"
							hover-class="row-pressed"
							@click="onItemClick(group.title, item.label)"
						>
							<image :src="item.icon" class="metric-icon" mode="aspectFit" />
							<text class="metric-label">{{ $t(item.labelKey) }}</text>
							<text class="metric-count">{{ item.count }}</text>
						</view>
					</view>
				</view>
				<view class="list-placeholder"></view>
			</view>
		</view>
		<TabBar :current="2" />
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
					titleKey: 'alarm.powerbox',
					items: []
				},
				{
					title: '单灯报警',
					titleKey: 'alarm.light',
					items: []
				},
				{
					title: '人工报障',
					titleKey: 'alarm.worker',
					items: []
				},
				{
					title: '线路供电异常报警',
					titleKey: 'alarm.exception',
					items: []
				},
				{
					title: '离线报警',
					titleKey: 'alarm.offline',
					items: []
				},
				{
					title: '水浸报警',
					titleKey: 'alarm.water',
					items: []
				},
				{
					title: '光控联动消息',
					titleKey: 'alarm.lightControl',
					items: []
				}
			],
			fieldMap: {
				'offline': '离线报警',
				'powerbox': '配电箱报警',
				'light': '单灯报警',
				'water': '水浸报警',
				'line': '线路供电异常报警',
				'pole': '人工报障',
				'lightControl': '光控联动消息'
			}
		}
	},
	onShow() {
		// 进入页面时按当前语言刷新原生导航栏标题
		uni.setNavigationBarTitle({ title: this.$t('alarm.title') });
	},
	methods:{
		// 该分类下是否含有报警子项
		hasItems(group) {
			return !!(group && group.items && group.items.length > 0);
		},
		// 状态点颜色：有报警为报警红，无报警为低调整灰
		statusIconColor(group) {
			if (this.hasItems(group)) {
				return this.isDarkMode ? '#ff8a6b' : '#ff5a3c';
			}
			return this.isDarkMode ? '#454b5d' : '#c5cad4';
		},
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
			return request({
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
			}).finally(() => {
				uni.stopPullDownRefresh();
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
						{icon: '/static/alarm/24h-alarm.png', label: '24小时内报警', labelKey: 'alarm.alarm24h', count: data.oneDay || 0},
						{icon: '/static/alarm/48h-alarm.png', label: '24~48小时报警', labelKey: 'alarm.alarm48h', count: data.twoDay || 0},
						{icon: '/static/alarm/longtime-alarm.png', label: '长期报警', labelKey: 'alarm.alarmLong', count: data.longTime || 0}
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
				case '光控联动消息':
					uni.navigateTo({ url: `/pages/alarm/components/alarmTypes/alarmLightControl?tab=${tab}` });
					break;
				default:
					break;
			}
		},
		onItemClick(category, label) {
			// 标签 -> 时间类型映射
			const timeMap = {
				'24小时内报警': '24小时内',
				'24~48小时报警': '48小时内',
				'长期报警': '长期'
			};
			const timeType = timeMap[label] || '';

			// 分类 -> 页面组件名映射（与现有路由一致）
			const pageMap = {
				'配电箱报警': 'alarmPowerbox',
				'单灯报警': 'alarmLight',
				'人工报障': 'alarmWorker',
				'线路供电异常报警': 'alarmException',
				'离线报警': 'alarmOffline',
				'水浸报警': 'alarmWater',
				'光控联动消息': 'alarmLightControl'
			};
			const pageName = pageMap[category];
			if (!pageName) {
				console.warn('未找到对应页面:', category);
				return;
			}
			const url = `/pages/alarm/components/alarmTypes/${pageName}?tab=${encodeURIComponent(category)}&timeType=${encodeURIComponent(timeType)}`;
			uni.navigateTo({ url });
		}
	},
	onLoad() {
		this.fetchAlarmData();
	},
	// 下拉刷新：重新拉取报警统计数据
	onPullDownRefresh() {
		this.fetchAlarmData();
	},
};
</script>

<style scoped>
/* ==================== 主题语义色 ====================
 * 报警红随全局昼夜主题切换；状态点颜色在 statusIconColor() 中同步维护。
 */
.page-wrapper {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: var(--bg-page, #f5f6fa);

	--alarm-color: #ff5a3c;
}

.page-wrapper.theme-dark {
	--alarm-color: #ff8a6b;
}

.alarm-container {
	padding: 20rpx 24rpx 0;
}

/* 列表内容区 */
.content {
	padding-bottom: 20rpx;
}

/* ==================== 卡片 ==================== */
.group-card {
	margin-bottom: 24rpx;
	background-color: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(17, 24, 39, 0.03), 0 16rpx 40rpx -20rpx rgba(17, 24, 39, 0.16);
	overflow: hidden;
}

/* 无报警的卡片更轻，不抢有报警卡片的视觉重心 */
.group-card.is-empty {
	box-shadow: 0 2rpx 8rpx rgba(17, 24, 39, 0.02);
}

.page-wrapper.theme-dark .group-card {
	border: 1rpx solid rgba(255, 255, 255, 0.05);
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.35);
}

/* ----- 卡片头部 ----- */
.group-header {
	display: flex;
	align-items: center;
	padding: 26rpx 26rpx 18rpx;
}

.group-card.is-empty .group-header {
	padding: 26rpx;
}

/* uni-icons 状态点外框：负责间距，颜色由 :color 传入 */
.status-dot {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	margin-right: 12rpx;
}

.group-title {
	flex: 1;
	min-width: 0;
	font-size: 32rpx;
	font-weight: 600;
	line-height: 1.35;
	color: var(--text-primary, #1a1a1a);
}

.group-card.is-empty .group-title {
	font-weight: 500;
	color: var(--text-secondary, #666666);
}

/* ----- 三个时间维度（逐行） ----- */
.metric-list {
	padding: 0 26rpx 6rpx;
}

.metric-row {
	position: relative;
	display: flex;
	align-items: center;
	padding: 16rpx 0;
}

/* 分隔线从文字左边缘开始，弱化而不抢信息 */
.metric-row + .metric-row::before {
	content: '';
	position: absolute;
	top: 0;
	left: 76rpx;
	right: 0;
	height: 1rpx;
	background-color: var(--border-color, #ececec);
}

.metric-icon {
	display: block;
	flex-shrink: 0;
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
}

.metric-label {
	flex: 1;
	min-width: 0;
	margin-left: 20rpx;
	font-size: 28rpx;
	line-height: 1.35;
	color: var(--text-primary, #333333);
	word-break: break-word;
}

.metric-count {
	flex-shrink: 0;
	margin-left: 16rpx;
	font-size: 46rpx;
	line-height: 1.1;
	font-weight: 700;
	letter-spacing: -0.5rpx;
	font-variant-numeric: tabular-nums;
	color: var(--text-primary, #1a1a1a);
}

.metric-row.is-active .metric-count {
	color: var(--alarm-color);
}

/* 计数为 0 的行整体压暗，突出真正有报警的维度 */
.metric-row.is-zero .metric-count {
	font-weight: 600;
	color: var(--text-tertiary, #888888);
}

.metric-row.is-zero .metric-label {
	color: var(--text-secondary, #666666);
}

.metric-row.is-zero .metric-icon {
	opacity: 0.55;
}

/* ----- 点击反馈 ----- */
.row-pressed {
	opacity: 0.6;
}

.header-pressed {
	opacity: 0.6;
}

/* 底部占位，避免内容被悬浮 tabbar 遮挡 */
.list-placeholder {
	width: 100%;
	height: 160rpx;
}

/* #ifdef H5 || MP-WEIXIN */
/* 悬浮玻璃 tabbar（高 120rpx + 距底 24rpx）底部留白 */
.list-placeholder {
	height: calc(160rpx + env(safe-area-inset-bottom));
}
/* #endif */
</style>
