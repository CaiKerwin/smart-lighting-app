<template>
	<view :class="themeClass" class="alarm-exception-container">
		<AlarmCenter :initialTab="tab" @change="onTabChange" />
		<view class="alarm-exception-sequence">
			<view class="title">排序</view>

			<!-- 滑动气泡 -->
			<scroll-view scroll-x class="sort-scroll" :show-scrollbar="false">
				<view class="sort-flex-row">
					<view
						class="sort-item"
						v-for="(item, index) in sortItems"
						:key="index"
						:class="{ 'active': selectedSort === item }"
						@click="handleSortSelect(item)"
					>
						{{ item }}
					</view>
				</view>
			</scroll-view>
		</view>

        <!--		报警信息列表-->
		<view class="alarm-exception-list">
			<view v-for="(item, index) in exceptionAlarmData" :key="index" class="alarm-card">
				<!-- 头部 -->
				<view class="card-header">
					<image class="card-icon" mode="aspectFit" src="/static/alarm/power.png" />
					<view class="header-info">
						<view class="card-title">{{ item.stationName }}</view>
						<view class="card-time">{{ item.alarmTime }}</view>
					</view>
					<view class="card-total">
						<text class="total-label">单灯总数</text>
						<text class="total-num">{{ item.total }}</text>
					</view>
				</view>

				<!-- 数据区域 -->
				<view class="card-body">
					<!-- 左列 -->
					<view class="column">
						<view class="row-item">
							<text class="label">离线数</text>
							<text class="num">{{ item.offline }}</text>
						</view>
						<view class="row-item">
							<text class="label">过压数</text>
							<text class="num">{{ item.overVoltage }}</text>
						</view>
					</view>
					<!-- 中列 -->
					<view class="column">
						<view class="row-item">
							<text class="label">离线异常</text>
							<text class="num">{{ item.offlineAbnormal }}</text>
						</view>
						<view class="row-item">
							<text class="label">灭灯异常</text>
							<text class="num">{{ item.lightOffAbnormal }}</text>
						</view>
					</view>
					<!-- 右列 -->
					<view class="column">
						<view class="row-item">
							<text class="label">灭灯数</text>
							<text class="num">{{ item.lightOff }}</text>
						</view>
						<view class="row-item">
							<text class="label">欠压数</text>
							<text class="num">{{ item.underVoltage }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import AlarmCenter from "@/pages/alarm/components/alarmCenter.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	components: {
		AlarmCenter
	},
	data() {
		return {
			tab: '线路供电异常报警',
			tabMap: {
				'配电箱报警': '/pages/alarm/components/alarmTypes/alarmPowerbox',
				'单灯报警': '/pages/alarm/components/alarmTypes/alarmLight',
				'离线报警': '/pages/alarm/components/alarmTypes/alarmOffline',
				'线路供电异常报警': '/pages/alarm/components/alarmTypes/alarmException',
				'线路供电异常报警记录': '/pages/alarm/components/alarmTypes/alarmExceptionRecord',
				'水浸报警': '/pages/alarm/components/alarmTypes/alarmWater',
				'人工报障': '/pages/alarm/components/alarmTypes/alarmWorker'
			},
			// 排序选项
			sortItems: ['单灯总数', '离线数', '离线异常数', '灭灯数', '灭灯异常数', '过压数', '欠压数'],
			selectedSort: '',

			// 线路供电异常报警数据
			exceptionAlarmData: [],

			// 原始顺序的线路供电异常报警数据
			originalExceptionAlarmData: [],
		};
	},
	onLoad() {
		// 页面加载时获取异常报警数据
		this.fetchExceptionAlarmData();
	},
	methods:{
		onTabChange(tabName) {
			const url = this.tabMap[tabName];
			if (url) {
				uni.navigateTo({ url });
			} else {
				console.warn('未知标签:', tabName);
				uni.showToast({ title: '未知标签', icon: 'none' });
			}
		},
		handleSortSelect(item) {
			// 若点击的是已选中的项，取消排序
			if (this.selectedSort === item) {
				this.selectedSort = '';
				this.exceptionAlarmData = [...this.originalExceptionAlarmData]; // 恢复原始顺序
				return;
			}

			// 否则选中并排序
			this.selectedSort = item;
			const fieldMap = {
				'单灯总数': 'total',
				'离线数': 'offline',
				'离线异常数': 'offlineAbnormal',
				'灭灯数': 'lightOff',
				'灭灯异常数': 'lightOffAbnormal',
				'过压数': 'overVoltage',
				'欠压数': 'underVoltage'
			};
			const field = fieldMap[item];
			if (!field) return;

			// 从原始数据复制并降序排序
			this.exceptionAlarmData = [...this.originalExceptionAlarmData].sort((a, b) => b[field] - a[field]);
		},
		fetchExceptionAlarmData() {
			/**
			 * [
			 *   {
			 *     "id": "81dc28af53354d4da5db769ed01c3b7e",
			 *     "createTime": "2026-06-22 16:42:00",
			 *     "stationId": 2434,
			 *     "stationName": "App测试配电箱",
			 *     "lightCount": 12,
			 *     "offlineCount": 12,
			 *     "voltageUpperCount": 0,
			 *     "voltageLowerCount": 0,
			 *     "powerOffCount": 0,
			 *     "offlineError": 2,
			 *     "poweroffError": 0
			 *   },
			 *   {
			 *     "id": "a063a4c9a12a497584ff588a38a4e612",
			 *     "createTime": "2026-06-22 16:42:00",
			 *     "stationId": 3149,
			 *     "stationName": "测试一路",
			 *     "lightCount": 11,
			 *     "offlineCount": 11,
			 *     "voltageUpperCount": 0,
			 *     "voltageLowerCount": 0,
			 *     "powerOffCount": 0,
			 *     "offlineError": 2,
			 *     "poweroffError": 0
			 *   },
			 *   {
			 *     "id": "e552195a7d5747f7b02b3a53e2c65536",
			 *     "createTime": "2026-06-22 16:42:00",
			 *     "stationId": 75,
			 *     "stationName": "AMDM演示柜",
			 *     "lightCount": 10,
			 *     "offlineCount": 10,
			 *     "voltageUpperCount": 0,
			 *     "voltageLowerCount": 0,
			 *     "powerOffCount": 0,
			 *     "offlineError": 10,
			 *     "poweroffError": 0
			 *   },
			 *   {
			 *     "id": "478a2918b4fd45a8948ad49f373e74c1",
			 *     "createTime": "2026-06-22 16:42:00",
			 *     "stationId": 3648,
			 *     "stationName": "lora单灯",
			 *     "lightCount": 2,
			 *     "offlineCount": 2,
			 *     "voltageUpperCount": 0,
			 *     "voltageLowerCount": 0,
			 *     "powerOffCount": 0,
			 *     "offlineError": 2,
			 *     "poweroffError": 0
			 *   },
			 *   {
			 *     "id": "ddc75c0bf0cb40689ec3c0c3aa686cf6",
			 *     "createTime": "2026-06-22 16:42:00",
			 *     "stationId": 3459,
			 *     "stationName": "单灯导入测试",
			 *     "lightCount": 2,
			 *     "offlineCount": 2,
			 *     "voltageUpperCount": 0,
			 *     "voltageLowerCount": 0,
			 *     "powerOffCount": 0,
			 *     "offlineError": 2,
			 *     "poweroffError": 0
			 *   },
			 *   {
			 *     "id": "5c77b5705e6e4c789f4542d5ce06c852",
			 *     "createTime": "2026-06-22 16:42:00",
			 *     "stationId": 230,
			 *     "stationName": "测试点SS",
			 *     "lightCount": 1,
			 *     "offlineCount": 1,
			 *     "voltageUpperCount": 0,
			 *     "voltageLowerCount": 0,
			 *     "powerOffCount": 0,
			 *     "offlineError": 0,
			 *     "poweroffError": 0
			 *   }
			 * ]
			 */
			request({
				url: '/device/light/QueryPowerLineError',
				method: 'POST',
				data:{}
			}).then(res => {
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (res.statusCode === 200 && payload.data) { // code === 200 表示OK
					const data = JSON.parse(base64Decode(res.data.data)).map(item => ({
						stationName: item.stationName,
						alarmTime: item.createTime,
						total: item.lightCount,
						offline: item.offlineCount,
						overVoltage: item.voltageUpperCount,
						underVoltage: item.voltageLowerCount,
						offlineAbnormal: item.offlineError,
						lightOffAbnormal: item.poweroffError,
						lightOff: item.powerOffCount
					}));
					// 保存原始数据并显示
					this.originalExceptionAlarmData = data;   // 备份
					this.exceptionAlarmData = data;           // 显示
				} else {
					uni.showToast({ title: '获取线路供电异常报警数据失败,请重试', icon: 'none' });
				}
				// 若列表为空，提示
				if (this.exceptionAlarmData.length === 0) {
					uni.showToast({ title: '暂无报警记录', icon: 'none' });
				}
			}).catch(err =>{
				console.error('获取线路供电异常报警数据错误:', err.message);
				uni.showToast({ title: '获取线路供电异常报警数据出错,请重试', icon: 'none' });
			})
		},
	}
}
</script>

<style lang="scss" scoped>
.alarm-exception-container {
	width: 100%;
	min-height: 100vh;
	background-color: var(--bg-page, #f5f7fa);
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

/* 排序区域 */
.alarm-exception-sequence {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	width: 100%;
	box-sizing: border-box;
	background-color: var(--bg-page, #f5f7fa);

	.title {
		flex-shrink: 0;
		font-size: 30rpx;
		font-weight: 500;
		color: var(--text-primary, #333);
		margin-right: 20rpx;
		white-space: nowrap;
	}

	.sort-scroll {
		flex: 1;
		width: 0;
		white-space: nowrap;
	}

	.sort-flex-row {
		display: inline-flex;
		gap: 20rpx;
		padding-right: 20rpx;
	}
}

/* 排序气泡样式  */
.sort-item {
	display: inline-block;
	padding: 12rpx 32rpx;
	border-radius: 40rpx;
	background-color: var(--bg-soft, #F2F4F8);
	color: var(--text-secondary, #666666);
	font-size: 28rpx;
	line-height: 1.2;
	white-space: nowrap;
	cursor: pointer;
	transition: all 0.2s ease;
}

/* 气泡选中状态  */
.sort-item.active {
	background-color: #3A7BF7;
	color: #FFFFFF;
}

/* 报警信息列表  */
.alarm-exception-list {
	padding: 0 30rpx;
	box-sizing: border-box;
}

.alarm-card {
	background-color: var(--bg-card, #FFFFFF);
	border-radius: 16rpx;
	padding: 24rpx 24rpx 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
	border: 1px solid var(--border-color, #f0f2f5);
}

/* 卡片头部 */
.card-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.card-icon {
	width: 56rpx;
	height: 56rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.header-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	margin-right: 10rpx;
}

.card-title {
	font-size: 30rpx;
	font-weight: 500;
	color: var(--text-primary, #333333);
	margin-bottom: 4rpx;
}

.card-time {
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
}

.card-total {
	display: flex;
	align-items: baseline;
}

.total-label {
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
	margin-right: 6rpx;
}

.total-num {
	font-size: 30rpx;
	font-weight: bold;
	color: var(--text-primary, #333333);
}

/* 卡片数据区域 */
.card-body {
	display: flex;
	justify-content: space-between;
	padding-top: 10rpx;
}

.column {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.row-item {
	display: flex;
	margin-bottom: 16rpx;
	align-items: baseline;
}

.row-item .label {
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
	margin-right: 8rpx;
}

.row-item .num {
	font-size: 26rpx;
	color: var(--text-primary, #333333);
	font-weight: 500;
}
</style>
