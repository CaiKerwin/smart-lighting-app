<template>
	<view class="alarm-offline-container">
		<AlarmCenter :initialTab="tab" @change="onTabChange" />

		<view class="time-card">
			<!-- 开始时间 picker -->
			<uni-datetime-picker
				type="datetime"
				v-model="startDate"
				return-type="string"
				:border="false"
				class="time-picker-wrap"
				placeholder="请选择开始时间"
				hide-second
			/>

			<text class="time-to">至</text>

			<!-- 结束时间 picker -->
			<uni-datetime-picker
				type="datetime"
				v-model="endDate"
				return-type="string"
				:border="false"
				class="time-picker-wrap"
				placeholder="选择结束时间"
				hide-second
			/>

			<view class="query-btn" @click="queryOfflineAlarm">查询</view>
		</view>

         <!--		查询结果列表-->
		<view class="alarm-offline-list">
			<view v-for="(item, index) in offlineAlarmList" :key="index" class="list-item">
				<image class="item-icon" mode="aspectFill" src="/static/alarm/pdg.png" />
				<view class="item-content">
					<view class="item-name">{{ item.stationName }}</view>
					<view class="item-time">{{ item.alarmTime }}</view>
				</view>
			</view>
		</view>

		<!-- ==================== 分页器 ==================== -->
		<AlarmPagination
			v-if="total > 0"
			:current="currentPage"
			:pageSize="pageSize"
			:total="total"
			@change="onPageChange"
			@pageSizeChange="onPageSizeChange"
		/>
	</view>
</template>

<script>
import AlarmCenter from "@/pages/alarm/components/alarmCenter.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import AlarmPagination from "@/pages/alarm/components/alarmPagination.vue";

export default {
	components: {
		AlarmPagination,
		AlarmCenter
	},
	data() {
		return {
			tab: '离线报警',
			tabMap: {
				'配电箱报警': '/pages/alarm/components/alarmTypes/alarmPowerbox',
				'单灯报警': '/pages/alarm/components/alarmTypes/alarmLight',
				'离线报警': '/pages/alarm/components/alarmTypes/alarmOffline',
				'线路供电异常报警': '/pages/alarm/components/alarmTypes/alarmException',
				'线路供电异常报警记录': '/pages/alarm/components/alarmTypes/alarmExceptionRecord',
				'水浸报警': '/pages/alarm/components/alarmTypes/alarmWater',
				'人工报障': '/pages/alarm/components/alarmTypes/alarmWorker'
			},
			startDate: '',
			endDate: '',
			offlineAlarmList: [],

			// 分页相关
			currentPage: 1,  // 当前页码
			pageSize: 10,    // 每页条数
			total: 0         // 总条数
		};

	},
	methods: {
		onTabChange(tabName) {

			const url = this.tabMap[tabName];
			if (url) {
				uni.navigateTo({ url });
			} else {
				console.warn('未知标签:', tabName);
				uni.showToast({ title: '未知标签', icon: 'none' });
			}
		},

		// 分页切换
		onPageChange(current) {
			if (current === this.currentPage) return;
			this.currentPage = current;
			this.loadOfflineAlarms();
		},
		// 每页条数切换
		onPageSizeChange(size) {
			if (size === this.pageSize) return;
			this.pageSize = size;
			this.currentPage = 1; // 每页条数变化后从第一页开始
			this.loadOfflineAlarms();
		},
		queryOfflineAlarm() {
			// 重新查询时重置到第一页
			this.currentPage = 1;
			this.loadOfflineAlarms();
		},
		loadOfflineAlarms() {
			/**
			 * {
			 *   "count": 13,
			 *   "list": [
			 *     {
			 *       "id": "e27318d8aec74ce3b57e4c26ce6e1a9d",
			 *       "stationId": 413,
			 *       "stationName": "程文亮 6036 测试",
			 *       "bigType": 2,
			 *       "smallType": 39,
			 *       "deviceCode": "2708100B",
			 *       "deviceName": "2708100B",
			 *       "startTime": "2026-03-16 15:40:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "a967783302a74d57be6e19a5e1f2fe09",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "22180003",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-09 11:32:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "425fabc526924314bba0983789170bb0",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "2218000B",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-07 12:47:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "69222a41360b4a7f87a6c061d9539cea",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "22180005",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-07 12:19:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "ef4aa80f7ed24654ba241a164b2668d8",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "22180006",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-06 17:17:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "ba892be29dfd4d97be22a953930a53df",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "2218001D",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-06 12:30:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "ff41871f0196491c892ba7e8719731f3",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "22180019",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-05 19:12:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "e499186fabd547a392f85e9424902336",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "22180002",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-05 12:31:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "efcc7749a6fa46b6b910b01dc78ca7d3",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "22180021",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-04 18:44:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "74b4862060d546c586fd48ff7dbc3ac2",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "22180004",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-04 17:02:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "788a4ed700f54383972ac0db730ef761",
			 *       "stationId": 3238,
			 *       "stationName": "3221",
			 *       "bigType": 2,
			 *       "smallType": 34,
			 *       "deviceCode": "2218001C",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-04 14:57:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "03793d22ba89445686a33fe8c400179c",
			 *       "stationId": 2292,
			 *       "stationName": "维修专用",
			 *       "bigType": 2,
			 *       "smallType": 39,
			 *       "deviceCode": "2718005E",
			 *       "deviceName": "6038",
			 *       "startTime": "2026-03-04 09:56:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     },
			 *     {
			 *       "id": "139b2200bcb14d8c98f5ba49893cfa31",
			 *       "stationId": 3150,
			 *       "stationName": "APP-6036",
			 *       "bigType": 2,
			 *       "smallType": 38,
			 *       "deviceCode": "2818007E",
			 *       "deviceName": "6036",
			 *       "startTime": "2026-03-03 11:58:00",
			 *       "isConfirm": false,
			 *       "confirmName": null,
			 *       "confirmTime": "0001-01-01 00:00:00",
			 *       "byUser": true,
			 *       "isMessage": false
			 *     }
			 *   ]
			 * }
			 */
			//校验
			if (!this.startDate ) {
				uni.showToast({ title: '请选择开始时间和结束时间', icon: 'none' });
				return;
			} else if (!this.endDate) {
				uni.showToast({ title: '请选择开始时间和结束时间', icon: 'none' });
				return;
			} else if (!this.startDate && !this.endDate) {
				uni.showToast({ title: '请选择开始时间和结束时间', icon: 'none' });
				return;
			}
			// #ifndef MP-WEIXIN
			if (new Date(this.startDate) > new Date(this.endDate)) {
				uni.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' });
				return;
			}
			// #endif

			// #ifdef MP-WEIXIN
			// 解决微信小程序时间选择器在IOS上的问题
			const start = new Date(this.startDate.replace(' ', 'T'));
			const end = new Date(this.endDate.replace(' ', 'T'));
			if (start > end) {
				uni.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' });
				return;
			}
			// #endif

			// 发起请求
			this.loading = true;
			uni.showLoading({ title: '查询中...', mask: true });
			request({
				url: '/station/alarm/QueryOfflineDetail',
				method: 'POST',
				data: {
					start: this.startDate,
					end: this.endDate,
					index: this.currentPage,// 第几页
					size: this.pageSize // 每页大小
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				uni.hideLoading();
				this.loading = false;

				const payload = res.data;
				try {
					if (payload && payload.data) {
						//将JSON字符串转换成对象
						const offlineAlarmData = JSON.parse(base64Decode(payload.data));
						this.total = Number(offlineAlarmData.count) || 0; // 总条数（用于分页）
						this.offlineAlarmList = offlineAlarmData.list.map((item) => ({
							stationName: item.stationName,
							alarmTime: item.startTime
						}));
					}
					// 当前页超出最大页时（例如删除最后一页的最后一条），回退到最后一页
					const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize));
					if (this.currentPage > maxPage) {
						this.currentPage = maxPage;
						this.loadOfflineAlarms();
						return;
					}
					// 若列表为空，给出提示
					if (this.offlineAlarmList.length === 0) {
						uni.showToast({ title: '该时间段暂无离线报警记录', icon: 'none' });
					}
				} catch (e) {
					console.error('解析离线报警数据错误:', e.message);
				}

			}).catch(err =>{
				console.error('查询离线报警错误:', err.message);
				uni.showToast({ title: '查询失败，请重试', icon: 'none' });
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.alarm-offline-container{
	width: 100%;
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

.time-card {
	margin: 20rpx;
	background-color: #ffffff;
	border-radius: 24rpx;
	padding: 48rpx 32rpx;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);

	/* 时间选择器外层 */
	.time-picker-wrap {
		flex: 1;
		min-width: 200rpx;

		/* 穿透修改 uni-datetime-picker 内部输入框样式 */
		::v-deep .uni-date-picker__container,
		::v-deep .uni-input-wrapper {
			background-color: #eef5ff !important;
			border-radius: 8rpx !important;
			border: 1px solid transparent !important;
			height: 76rpx !important;
			padding: 0 24rpx !important;
			display: flex;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;

			.uni-input {
				color: #3b7bf7 !important;
				font-size: 28rpx !important;
				text-align: center;
				width: 100%;
				letter-spacing: 1rpx;
			}

			&::after {
				border: none !important;
			}
		}
	}

	/* 中间的至字 */
	.time-to {
		color: #9faaba;
		font-size: 28rpx;
		margin: 0 20rpx;
		flex-shrink: 0;
	}

	/* 查询按钮 */
	.query-btn {
		width: 100%;
		margin-top: 40rpx;
		background-color: #3b7bf7;
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 500;
		border-radius: 24rpx;
		text-align: center;
		padding: 24rpx 0;
		cursor: pointer;
		transition: opacity 0.2s;

		&:active {
			opacity: 0.8;
		}
	}
}

/* --- 查询列表 --- */
.alarm-offline-list {
	margin: 0 20rpx;
	background-color: #ffffff;
	border-radius: 24rpx;
	padding: 0 32rpx;
}

.list-item {
	display: flex;
	align-items: center;
	padding: 30rpx 0;
	border-bottom: 1px solid #f2f4f8;

	&:last-child {
		border-bottom: none;
	}
}

.item-icon {
	width: 80rpx;
	height: 80rpx;
	margin-right: 24rpx;
	flex-shrink: 0;
	border-radius: 16rpx;
	background-color: #f5f7fa;
}

.item-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.item-name {
	font-size: 32rpx;
	color: #333333;
	font-weight: 500;
}

.item-time {
	font-size: 26rpx;
	color: #999999;
	margin-top: 10rpx;
}
</style>
