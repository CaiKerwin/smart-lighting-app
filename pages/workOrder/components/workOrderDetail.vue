<template>
	<view class="page-wrapper">
		<!-- 工单基本信息卡片 -->
		<view class="header-card">
			<!-- 右上角状态标签 -->
			<view class="status-badge">{{ workOrderBase.statusName }}</view>

			<!-- 信息列表 -->
			<view class="info-row">
				<text class="label">工单ID</text>
				<text class="value">{{ workOrderBase.workOrderId }}</text>
			</view>
			<view class="info-row">
				<text class="label">站点名称</text>
				<text class="value">{{ workOrderBase.stationName }}</text>
			</view>
			<view class="info-row">
				<text class="label">站点属性</text>
				<text class="value">{{ workOrderBase.property }}</text>
			</view>
			<view class="info-row">
				<text class="label">简要内容</text>
				<text class="value">{{ workOrderBase.content }}</text>
			</view>
		</view>

		<!-- 工单详情卡片 -->
		<view class="detail-card">

		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode, formatAlarmContent} from "@/utils/common";

export default {
	name: 'WorkOrderDetail',
	data() {
		return {
			statusNameMap: {
				0: ' ',
				1: '普通故障',
				2: '一般故障',
				3: '重大故障',
				4: '特殊故障'
			},
			paramTypeMap: {
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
			},
			lightAlarmTypes: [
				{ id: 23, name: '灭灯', code: 'p0', args: ['通道', '亮度', '电流', '功率'] },
				{ id: 25, name: '欠载', code: 'p1', args: ['通道', '亮度', '功率', '额定值', '阈值', '阈值百分比'] },
				{ id: 24, name: '过载', code: 'p2', args: ['通道', '亮度', '功率', '额定值', '阈值', '阈值百分比'] },
				{ id: 10, name: '掉电', code: 'v0', args: ['当前值'] },
				{ id: 13, name: '降功率欠压', code: 'v1', args: ['当前值', '阈值'] },
				{ id: 12, name: '欠压', code: 'v2', args: ['当前值', '最小值', '最大值'] },
				{ id: 14, name: '降功率过压', code: 'v3', args: ['当前值', '阈值'] },
				{ id: 11, name: '过压', code: 'v4', args: ['当前值', '最小值', '最大值'] },
				{ id: 22, name: '欠流', code: 'c1', args: ['通道', '亮度', '电流', '最小值', '最大值', '功率'] },
				{ id: 21, name: '过流', code: 'c2', args: ['通道', '亮度', '电流', '最小值', '最大值', '功率'] },
				{ id: 32, name: '降功率过温', code: 't1', args: ['当前值', '阈值'] },
				{ id: 31, name: '过温', code: 't2', args: ['当前值', '阈值'] },
				{ id: 51, name: '倾斜', code: 'g1', args: ['X当前值', 'X基准值', 'Y当前值', 'Y基准值', 'Z当前值', 'Z基准值', '阈值'] },
				{ id: 66, name: '线路供电异常', code: 'l1', args: [] }
			],
			stationAlarmTypes: [
				{ id: 61, name: '一级水浸', code: 'w1', args: ['监测值', '报警值'] },
				{ id: 62, name: '二级水浸', code: 'w2', args: ['监测值', '报警值'] },
				{ id: 63, name: '三级水浸', code: 'w3', args: ['监测值', '报警值'] },
				{ id: 51, name: '烟雾报警', code: 's1', args: ['监测值', '报警值'] },
				{ id: 43, name: '锁开报警', code: 'l1', args: ['监测值', '报警值'] },
				{ id: 42, name: '门开报警', code: 'd1', args: ['监测值', '报警值'] },
				{ id: 92, name: '接触器断开', code: 'ct0', args: ['监测值', '关联输出值'] },
				{ id: 91, name: '接触器黏合', code: 'ct1', args: ['监测值', '关联输出值'] },
				{ id: 101, name: '控制输出异常', code: 'ot1', args: ['时间表值', '当前输出值'] },
				{ id: 83, name: '停止报警', code: 'sw0', args: ['手动状态', '遥控状态', '时控状态'] },
				{ id: 81, name: '手动报警', code: 'sw1', args: ['手动状态', '遥控状态', '时控状态'] },
				{ id: 82, name: '时控报警', code: 'sw2', args: ['手动状态', '遥控状态', '时控状态'] },
				{ id: 71, name: '一级漏电', code: 'lk1', args: ['漏电值', '一级阈值', '二级阈值', '三级阈值'] },
				{ id: 72, name: '二级漏电', code: 'lk2', args: ['漏电值', '一级阈值', '二级阈值', '三级阈值'] },
				{ id: 73, name: '三级漏电', code: 'lk3', args: ['漏电值', '一级阈值', '二级阈值', '三级阈值'] },
				{ id: 11, name: '失压', code: 'v0', args: ['当前值'] },
				{ id: 12, name: '缺相', code: 'v1', args: ['相位'] },
				{ id: 14, name: '欠压', code: 'v2', args: ['相位', '当前值', '最小值', '最大值'] },
				{ id: 13, name: '过压', code: 'v3', args: ['相位', '当前值', '最小值', '最大值'] },
				{ id: 33, name: '功率因数过低', code: 'f1', args: ['相位', '当前值', '额定值'] },
				{ id: 24, name: '灭灯', code: 'p0', args: ['A相电流', 'B相电流', 'C相电流'] },
				{ id: 31, name: '过载', code: 'p1', args: ['相位', '当前值', '额定值'] },
				{ id: 32, name: '功率异常', code: 'p2', args: ['当前值', '对比值列表', '均值', '电流差阈值'] },
				{ id: 25, name: '异常亮灯', code: 'p3', args: ['A相电流', 'B相电流', 'C相电流'] },
				{ id: 22, name: '欠流', code: 'c1', args: ['相位', '当前值', '最小值', '最大值'] },
				{ id: 21, name: '过流', code: 'c2', args: ['相位', '当前值', '最小值', '最大值'] },
				{ id: 23, name: '电流异常', code: 'c3', args: ['相位', '当前值', '对比值列表', '均值', '电流差阈值'] },
				{ id: 41, name: '被盗', code: 'st', args: ['当前值', '防盗阈值'] }
			],
			lineAlarmTypes: [
				{ name: '线路报警', code: 'l0', args: ['站点单灯总数', '离线数量', '离线占比', '灭灯数量', '灭灯占比', '过压数量', '过压占比', '欠压数量', '欠压占比'] }
			],
			waterAlarmTypes: [
				{ id: 99, name: '离线报警', code: '99', args: ['通信ID'] },
				{ id: 1, name: '一级报警', code: '1', args: ['当前水位', '一级阈值', '二级阈值', '三级阈值'] },
				{ id: 2, name: '二级报警', code: '2', args: ['当前水位', '一级阈值', '二级阈值', '三级阈值'] },
				{ id: 3, name: '三级报警', code: '3', args: ['当前水位', '一级阈值', '二级阈值', '三级阈值'] }
			],
			orderId: '', // 存储从上一页传来的工单ID
			workOrderBase:
				{
					// workOrderId: '78',
					// stationName: '测试配电箱二',
					// property: '测试配电箱二',
					// content: '二支路大片灭灯',
					// statusName: '一般故障'
				}

		};
	},
	onLoad(options) {
		if (options && options.id) {
			this.orderId = options.id;
			this.getWorkOrderDetail();   // 获取到ID后再获取工单详情
		} else {
			uni.showToast({ title: '缺少工单ID', icon: 'none' });
		}
	},
	methods: {
		getWorkOrderDetail() {
			/**
			 * {
			 *   "order": {
			 *     "id": "c17aaba88967471387261635d898f694",
			 *     "paramType": 1,
			 *     "paramTypeName": "总配电",
			 *     "stationId": "0f217fdc69364eeeb89a6f8d6ae7a489",
			 *     "stationName": "海滨大道14号箱（罗马广场）",
			 *     "deviceId": "00000000000000000000000000000000",
			 *     "paramName": null,
			 *     "code": "202608050049",
			 *     "name": "失压",
			 *     "limit": false,
			 *     "limitTime": "2026-08-05 09:26:00",
			 *     "fireTime": "2026-08-05 09:26:00",
			 *     "dealUserId": "00000000000000000000000000000000",
			 *     "dealUserName": null,
			 *     "receiveTime": "0001-01-01 00:00:00",
			 *     "arriveTime": "0001-01-01 00:00:00",
			 *     "misReport": false,
			 *     "alarmLevel": 0,
			 *     "alarmLevelName": "",
			 *     "levelTime": "0001-01-01 00:00:00",
			 *     "remoteMisReport": false,
			 *     "remoteMisReportTime": "0001-01-01 00:00:00",
			 *     "remoteUserId": "00000000000000000000000000000000",
			 *     "remoteUserName": null,
			 *     "isDelay": false,
			 *     "delayDays": 0,
			 *     "delayContent": null,
			 *     "delayTime": "0001-01-01 00:00:00",
			 *     "dealContent": null,
			 *     "dealTime": "0001-01-01 00:00:00",
			 *     "confirmDelay": false,
			 *     "confirmDelayDays": 0,
			 *     "confirmDelayContent": null,
			 *     "confirmDelayUserId": "00000000000000000000000000000000",
			 *     "confirmDelayUserName": null,
			 *     "confirmDelayTime": "0001-01-01 00:00:00",
			 *     "systemConfirmDone": false,
			 *     "systemConfirmTime": "0001-01-01 00:00:00",
			 *     "status": 10,
			 *     "statusName": "已生成",
			 *     "alarmStart": "2026-08-05 09:25:09",
			 *     "alarmEnd": "2026-08-05 09:25:09",
			 *     "alarmContent": [
			 *       "失压"
			 *     ]
			 *   },
			 *   "logs": [
			 *     {
			 *       "id": "6e05e1d189724cbc8b364b12684dfab8",
			 *       "content": "系统生成工单，待管养人员接警",
			 *       "isComment": false,
			 *       "limit": false,
			 *       "limitTime": "2026-08-05 09:26:00",
			 *       "isOver": false,
			 *       "startTime": "2026-08-05 09:26:00",
			 *       "endTime": "2026-08-05 09:26:00",
			 *       "status": 10,
			 *       "statusName": "已生成",
			 *       "userId": "00000000000000000000000000000000",
			 *       "userName": null,
			 *       "imageIds": []
			 *     }
			 *   ],
			 *   "isDone": false,
			 *   "isWorker": true,
			 *   "alarms": [
			 *     {
			 *       "id": "2684776495364de7b9a3a10d1642693e",
			 *       "type": 11,
			 *       "name": "失压",
			 *       "extra": null,
			 *       "startTime": "2026-08-05 09:25:09",
			 *       "paramId": "47f0bd6949c84399a5dc42eafc68f09e",
			 *       "paramName": "总配电",
			 *       "paramType": 1,
			 *       "paramTypeName": null,
			 *       "done": false,
			 *       "doneTime": "0001-01-01 00:00:00",
			 *       "deviceId": "00000000000000000000000000000000"
			 *     }
			 *   ],
			 *   "pos": {
			 *     "lat": 22.776447069514028,
			 *     "lng": 115.36310643899265
			 *   },
			 *   "levels": {
			 *     "1": 0,
			 *     "2": 0,
			 *     "3": 0
			 *   }
			 * }
			 */
			request({
				url: '/station/Maintance/FindWorkOrder',
				method: 'POST',
				data: {
					orderId: this.orderId
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data));
					this.workOrderBase.statusName = this.statusNameMap[data.order.alarmLevel] || '';
					this.workOrderBase.workOrderId = data.order.code || '';
					this.workOrderBase.stationName = data.order.stationName || '';
					this.workOrderBase.property = ((this.paramTypeMap[data.order.paramType] || '') + (data.order.paramName || '')) || '';
					this.workOrderBase.content = formatAlarmContent(data.alarms.extra, data.order.paramType) || '';
				} else {
					uni.showToast({title: '获取工单详情数据失败，请重试', icon: 'none'});
				}
			}).catch(err =>{
				console.error('获取工单详情错误',err.message);
			})
		},
	},
}
</script>

<style lang="scss" scoped>
/* 页面整体浅色背景 */
.page-wrapper {
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 40rpx;
	box-sizing: border-box;
}

/* 基本信息卡片主体 */
.header-card {
	background: #ffffff;
	border-radius: 32rpx;
	padding: 48rpx 40rpx;
	position: relative;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 32rpx;
}

/* 右上角状态标签  */
.status-badge {
	position: absolute;
	top: 0;
	right: 0;
	background-color: #ff9531;
	color: #ffffff;
	font-size: 26rpx;
	font-weight: 500;
	padding: 12rpx 32rpx 12rpx 24rpx;
	border-radius: 0 32rpx 0 32rpx;
	box-shadow: 0 4rpx 8rpx rgba(255, 149, 49, 0.3);
}

/* 信息行布局 */
.info-row {
	display: flex;
	align-items: flex-start;
	margin-bottom: 14rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

/* 左侧标签 */
.label {
	width: 140rpx;
	color: #86909c;
	font-size: 28rpx;
	flex-shrink: 0;
	margin-right: 24rpx;
}

/* 右侧值 */
.value {
	flex: 1;
	color: #1d2129;
	font-size: 28rpx;
	line-height: 1.5;
	word-break: break-all;
}

/* 下方详情卡片占位 */
.detail-card {
	background: #ffffff;
	border-radius: 32rpx;
	padding: 48rpx;
	min-height: 400rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}
</style>
