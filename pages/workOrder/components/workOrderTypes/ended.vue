<template>
	<view class="page-wrapper">
		<!-- 时间选择框 -->
		<view class="date-picker">
			<view class="date-input-wrap">
				<uni-datetime-picker
					v-model="startDate"
					:border="false"
					class="custom-picker"
					format="yyyy-MM-dd HH:mm:ss"
					placeholder="选择开始时间"
					return-type="string"
					type="datetime"
				/>
			</view>

			<text class="to-text">至</text>

			<view class="date-input-wrap">
				<uni-datetime-picker
					v-model="endDate"
					:border="false"
					class="custom-picker"
					format="yyyy-MM-dd HH:mm:ss"
					placeholder="选择结束时间"
					return-type="string"
					type="datetime"
				/>
			</view>
		</view>

		<!-- 查询按钮 -->
		<button class="query-btn" @click="queryEndedWorkOrder">查询</button>

		<!-- 工单列表 -->
		<view class="ended-list-container">
			<view v-for="(item, index) in endedListData" :key="index" class="list-item">
				<!-- 日期时间分隔符 -->
				<view class="time-tag">
					<image class="icon-clock-img" mode="aspectFit" src="/static/common/clock.png"></image>
					{{ item.time }}
				</view>

				<!-- 卡片内容 -->
				<view class="card" @click="goToEndedWODetail(item.id)">
					<!-- 左侧图标 -->
					<view class="card-left">
						<image class="card-icon" mode="aspectFit" src="/static/workOrder/pending.png"></image>
					</view>

					<!-- 右侧信息 -->
					<view class="card-right">
						<view class="data-row">
							<text class="label">工单ID</text>
							<text class="value">{{ item.workOrderId }}</text>
							<text class="index">{{ item.index }}</text>
						</view>
						<view class="data-row">
							<text class="label">所属站点</text>
							<text class="value">{{ item.station }}</text>
						</view>
						<view class="data-row">
							<text class="label">报警属性</text>
							<text class="value">{{ item.attr }}</text>
						</view>
						<view class="data-row">
							<text class="label">简要内容</text>
							<text class="value text-red">{{ item.content }}</text>
						</view>
						<view class="data-row">
							<text class="label">处理状态</text>
							<text class="value">{{ item.status }}</text>
						</view>
						<view class="data-row">
							<text class="label">超时期限</text>
							<text class="value">{{ item.overdue }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import uniDatetimePicker from "@dcloudio/uni-ui/lib/uni-datetime-picker/uni-datetime-picker.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
export default {
	components: {
		uniDatetimePicker
	},
	data() {
		return {
			// 时间选择器默认值
			startDate: '',
			endDate: '',
			// 列表数据
			listData: [],
			loading: false,
			endedListData: [
				// {
				// 	time: '2023-01-01 12:00:00',
				// 	workOrderId: '202508120006',
				// 	index: 1,
				// 	station: '单灯测试',
				// 	attr: '灯杆',
				// 	content: '路灯不亮；白天亮灯；其它:灯太亮了',
				// 	status: '已修复',
				// 	overdue: '2023-01-01 12:00:00'
				// }
			],
		};
	},
	onLoad() {
		// 加载时获取已结束的工单列表数据
		this.getEndedWorkOrderListData();
	},
	methods: {
		getEndedWorkOrderListData() {
			/**
			 * [
			 *   {
			 *     "id": "901930bb6a0b4292b47d6cdcb970c573",
			 *     "paramType": 14,
			 *     "paramTypeName": null,
			 *     "stationId": 2211,
			 *     "stationName": "单灯测试",
			 *     "paramId": 352308,
			 *     "deviceId": "00000000000000000000000000000000",
			 *     "paramName": "116B-1",
			 *     "code": "202508120006",
			 *     "name": "路灯不亮；白天亮灯；其它:灯太亮了",
			 *     "limit": false,
			 *     "limitTime": "2026-01-26 17:18:13",
			 *     "fireTime": "2025-08-12 09:41:00",
			 *     "dealUserId": 82,
			 *     "dealUserName": "luosp",
			 *     "receiveTime": "2026-01-26 17:18:04",
			 *     "arriveTime": "2026-01-26 17:18:09",
			 *     "misReport": false,
			 *     "alarmLevel": 1,
			 *     "alarmLevelName": null,
			 *     "levelTime": "2026-01-26 17:18:13",
			 *     "remoteMisReport": false,
			 *     "remoteMisReportTime": "0001-01-01 00:00:00",
			 *     "remoteUserId": 0,
			 *     "remoteUserName": null,
			 *     "isDelay": true,
			 *     "delayDays": 0,
			 *     "delayContent": "下雨天延期,申请延期至:2026-7-11 10:1.",
			 *     "delayTime": "2026-07-11 10:01:00",
			 *     "dealContent": "已修复",
			 *     "dealTime": "2026-01-26 17:18:27",
			 *     "confirmDelay": false,
			 *     "confirmDelayDays": 0,
			 *     "confirmDelayContent": null,
			 *     "confirmDelayUserId": 0,
			 *     "confirmDelayUserName": null,
			 *     "confirmDelayTime": "0001-01-01 00:00:00",
			 *     "systemConfirmDone": false,
			 *     "systemConfirmTime": "2026-01-26 17:29:00",
			 *     "status": 50,
			 *     "statusName": null,
			 *     "alarmStart": "2025-08-12 09:40:32",
			 *     "alarmEnd": "2025-08-12 09:40:32",
			 *     "alarmContent": [
			 *       "路灯不亮；白天亮灯；其它:灯太亮了"
			 *     ]
			 *   }
			 * ]
			 */
			const paramTypeMap = {
				1: '配电柜总配电',
				2: '配电柜转换开关',
				3: '配电柜控制输出开关',
				4: '配电柜接触器',
				5: '配电柜支路配电',
				6: '配电柜柜门',
				7: '配电柜门锁',
				8: '配电柜烟雾监测',
				9: '配电柜水浸监测',
				10: '配电柜线缆',
				14: '灯杆',
				16: '电能表',
				199: '单灯'
			}
			request({
				url: '/station/Maintance/QueryStatusTypeOrder',
				method: 'POST',
				data: {
					// 查询已结束工单
					start: '',
					end: '',
					type: 7 // 已结束
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const pendingWOData = JSON.parse(base64Decode(payload.data));
					this.pendingListData = pendingWOData.map((item,index) =>({
						time: item.fireTime || '',
						workOrderId: item.code || '',
						index: index+1,
						station: item.stationName || '',
						attr: (item.paramType ? paramTypeMap[item.paramType] : '未知设备') + (item.paramName ? item.paramName : ''),
						content: item.name || '',
						status: item.dealContent || '',
						overdue: item.limitTime || '',
						id: item.id || '' // 用于跳转到工单详情界面
					}))
				}
				if (this.endedListData === 0){
					uni.showToast({title: '暂无已结束工单', icon: 'none'})
				}
			}).catch(err =>{
				console.error('获取待受理工单列表数据错误',err.message);
			})
		},
		queryEndedWorkOrder(){
			/**
			 * [
			 *   {
			 *     "id": "901930bb6a0b4292b47d6cdcb970c573",
			 *     "paramType": 14,
			 *     "paramTypeName": null,
			 *     "stationId": 2211,
			 *     "stationName": "单灯测试",
			 *     "paramId": 352308,
			 *     "deviceId": "00000000000000000000000000000000",
			 *     "paramName": "116B-1",
			 *     "code": "202508120006",
			 *     "name": "路灯不亮；白天亮灯；其它:灯太亮了",
			 *     "limit": false,
			 *     "limitTime": "2026-01-26 17:18:13",
			 *     "fireTime": "2025-08-12 09:41:00",
			 *     "dealUserId": 82,
			 *     "dealUserName": "luosp",
			 *     "receiveTime": "2026-01-26 17:18:04",
			 *     "arriveTime": "2026-01-26 17:18:09",
			 *     "misReport": false,
			 *     "alarmLevel": 1,
			 *     "alarmLevelName": null,
			 *     "levelTime": "2026-01-26 17:18:13",
			 *     "remoteMisReport": false,
			 *     "remoteMisReportTime": "0001-01-01 00:00:00",
			 *     "remoteUserId": 0,
			 *     "remoteUserName": null,
			 *     "isDelay": true,
			 *     "delayDays": 0,
			 *     "delayContent": "下雨天延期,申请延期至:2026-7-11 10:1.",
			 *     "delayTime": "2026-07-11 10:01:00",
			 *     "dealContent": "已修复",
			 *     "dealTime": "2026-01-26 17:18:27",
			 *     "confirmDelay": false,
			 *     "confirmDelayDays": 0,
			 *     "confirmDelayContent": null,
			 *     "confirmDelayUserId": 0,
			 *     "confirmDelayUserName": null,
			 *     "confirmDelayTime": "0001-01-01 00:00:00",
			 *     "systemConfirmDone": false,
			 *     "systemConfirmTime": "2026-01-26 17:29:00",
			 *     "status": 50,
			 *     "statusName": null,
			 *     "alarmStart": "2025-08-12 09:40:32",
			 *     "alarmEnd": "2025-08-12 09:40:32",
			 *     "alarmContent": [
			 *       "路灯不亮；白天亮灯；其它:灯太亮了"
			 *     ]
			 *   }
			 * ]
			 */
			const paramTypeMap = {
				1: '配电柜总配电',
				2: '配电柜转换开关',
				3: '配电柜控制输出开关',
				4: '配电柜接触器',
				5: '配电柜支路配电',
				6: '配电柜柜门',
				7: '配电柜门锁',
				8: '配电柜烟雾监测',
				9: '配电柜水浸监测',
				10: '配电柜线缆',
				14: '灯杆',
				16: '电能表',
				199: '单灯'
			}

			request({
				url: '/station/Maintance/QueryStatusTypeOrder',
				method: 'POST',
				data: {
					// 按照选择的时间查询已结束工单
					start: this.startDate,
					end: this.endDate,
					type: 7 // 已结束
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const pendingWOData = JSON.parse(base64Decode(payload.data));
					this.pendingListData = pendingWOData.map((item,index) =>({
						time: item.fireTime || '',
						workOrderId: item.code || '',
						index: index+1,
						station: item.stationName || '',
						attr: (item.paramType ? paramTypeMap[item.paramType] : '未知设备') + (item.paramName ? item.paramName : ''),
						content: item.name || '',
						status: item.dealContent || '',
						overdue: item.limitTime || ''
					}))
				}
				if (this.endedListData.length === 0) {
					uni.showToast({title: '暂无已结束工单', icon: 'none'})
				}
			}).catch(err =>{
				console.error('获取待受理工单列表数据错误',err.message);
			})
		},
		goToEndedWODetail(id) {
			uni.navigateTo({
				url: `/pages/workOrder/components/workOrderDetail`
			});
		},
	},
}
</script>

<style lang="scss" scoped>
.page-wrapper {
	padding: 20px;
	background-color: #f4f7fb;
	min-height: 100vh;
	box-sizing: border-box;
}

/* 时间选择区 */
.date-picker {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;

	.date-input-wrap {
		flex: 1;
		background-color: #ffffff;
		border-radius: 8px;
		padding: 0 10px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;

		.custom-picker {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;

			:deep(.uni-datetime-picker-text) {
				color: #4ba3f5;
				font-size: 14px;
			}
		}
	}

	.to-text {
		margin: 0 10px;
		color: #333333;
		font-size: 14px;
	}
}

/* 查询按钮  */
.query-btn {
	width: 100%;
	height: 44px;
	max-height: 80rpx;
	background-color: #3b82f6;
	color: #ffffff;
	border: none;
	border-radius: 8px;
	font-size: 16px;
	margin-bottom: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	&::after {
		border: none;
	}
}

/* 列表容器 */
.ended-list-container {
	.list-item {
		margin-bottom: 24px;

		.time-tag {
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #e1e7f0;
			padding: 4px 16px;
			border-radius: 12px;
			font-size: 12px;
			color: #333;
			margin: 0 auto 12px auto;
			width: fit-content;

			.icon-clock-img {
				width: 12px;
				height: 12px;
				margin-right: 4px;
			}
		}

		.card {
			background: #ffffff;
			border-radius: 12px;
			padding: 16px 16px 16px 12px;
			display: flex;
			align-items: flex-start;

			.card-left {
				width: 24px;
				height: 24px;
				margin-right: 12px;
				flex-shrink: 0;
				margin-top: 2px;
				display: flex;
				align-items: center;
				justify-content: center;
				.card-icon {
					width: 100%;
					height: 100%;
					border-radius: 50%;
					background-color: #e5f0ff;
				}
			}

			.card-right {
				flex: 1;
				.data-row {
					display: flex;
					align-items: center;
					margin-bottom: 8px;
					line-height: 1.5;
					&:last-child { margin-bottom: 0; }
					.label {
						width: 70px;
						color: #999999;
						font-size: 14px;
						flex-shrink: 0;
					}
					.value {
						color: #333333;
						font-size: 14px;
						flex: 1;
					}
					.index {
						color: #cccccc;
						font-size: 13px;
						margin-left: 10px;
						flex-shrink: 0;
					}
					.text-red { color: #ff4d4f; }
				}
			}
		}
	}
}
</style>
