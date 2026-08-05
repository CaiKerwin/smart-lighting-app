<template>
	<view class="page-wrapper">
		<!-- 工单基本信息卡片 -->
		<view class="header-card">
			<!-- 右上角状态标签 -->
			<view
				v-if="workOrderBase.alarmLevel && workOrderBase.alarmLevel !== 0"
				:style="{ backgroundColor: getLevelColor(workOrderBase.alarmLevel) }"
				class="status-badge"
			>
				{{ workOrderBase.statusName }}
			</view>

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
			<!-- 顶部流程进度条 -->
			<view class="progress-steps">
				<view
					v-for="(step, index) in progressSteps"
					:key="index"
					class="step-group"
				>
					<!-- 步骤节点 -->
					<view class="step-item">
						<view :class="{ 'is-active': step.active }" class="step-icon">
							<image
								:src="step.active ? step.iconActive : step.icon"
								class="step-img"
								mode="aspectFit"
							/>
						</view>
						<text :class="{ 'is-active': step.active }" class="step-text">{{ step.label }}</text>
					</view>

					<!-- 箭头节点 -->
					<view v-if="index < progressSteps.length - 1" class="step-arrow">
						<image
							:src="step.active ? '/static/workOrder/back-active.png' : '/static/workOrder/back.png'"
							class="arrow-img"
							mode="aspectFit"
						/>
					</view>
				</view>
			</view>

			<!-- 人员与时间信息区 -->
			<view class="info-section">
				<view class="info-item">
					<text class="info-label">发起人</text>
					<text class="info-value">小明</text>
				</view>
				<view class="info-item">
					<text class="info-label">管理员</text>
					<text class="info-value">小明</text>
				</view>
				<view class="info-item">
					<text class="info-label">责任人</text>
					<text class="info-value">小明</text>
				</view>
				<view class="info-item">
					<text class="info-label">审核人</text>
					<text class="info-value">小明</text>
				</view>
				<view class="info-item">
					<text class="info-label">开始时间</text>
					<text class="info-value">2023-11-12 12:00</text>
				</view>
				<view class="info-item">
					<text class="info-label">截止时间</text>
					<text class="info-value">2023-11-12 12:00</text>
				</view>
			</view>

			<!-- 底部时间线/日志区域 -->
			<view class="timeline-section">

				<!-- 已修复 -->
				<view class="timeline-item">
					<!-- 时间线 -->
					<view class="timeline-dot dot-blue"></view>

					<!-- 聊天气泡 -->
					<view class="timeline-bubble">
						<view class="bubble-header">
							<view class="header-left">
								<text class="user-name">小明</text>
								<text class="user-role">维修人员</text>
							</view>
							<text class="status-text green">已修复</text>
						</view>

						<view class="content-desc">马上开始为序，快点完成</view>

						<view class="bubble-bottom">
							<view class="time-text">2023-11-12 13:00</view>
						</view>
					</view>
				</view>

				<!-- 到达现场 -->
				<view class="timeline-item">
					<!-- 灰色空心串珠 -->
					<view class="timeline-dot dot-gray"></view>

					<!-- 聊天气泡 -->
					<view class="timeline-bubble">
						<view class="bubble-header">
							<view class="header-left">
								<text class="user-name">小明</text>
								<text class="user-role">维修人员</text>
							</view>
							<text class="status-text red">到达现场</text>
						</view>

						<view class="content-desc">马上开始为序，快点完成</view>

						<!-- 图片网格 -->
						<view class="grid-wrap">
							<view class="grid-item">
								<image class="grid-img" mode="aspectFill" src="/static/workOrder/admin.png"></image>
							</view>
							<view class="grid-item">
								<image class="grid-img" mode="aspectFill" src="/static/workOrder/admin.png"></image>
							</view>
							<view class="grid-item">
								<image class="grid-img" mode="aspectFill" src="/static/workOrder/admin.png"></image>
							</view>
							<!-- 虚线拍摄占位 -->
							<view class="grid-item add-box">
								<view class="icon-plus">+</view>
							</view>
						</view>

						<view class="bubble-bottom">
							<text class="overtime-text">到达现场超时3分钟</text>
							<view class="time-text">2023-11-12 13:00</view>
						</view>
					</view>
				</view>
			</view>
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
			orderId: '', // 存储从上一页传来的工单ID
			workOrderBase: {
					// workOrderId: '78',
					// stationName: '测试配电箱二',
					// property: '测试配电箱二',
					// content: '二支路大片灭灯',
					// statusName: '一般故障',
					workOrderId: '',
					stationName: '',
					property: '',
					content: '',
					statusName: '',
					alarmLevel: 0 // 用于颜色判断和显隐控制
			},
			// 工单流程数据
			progressSteps: [
				{ label: '已接警', icon: '/static/workOrder/on-way.png', iconActive: '/static/workOrder/on-way-active.png', active: true },
				{ label: '到达现场', icon: '/static/workOrder/scene.png', iconActive: '/static/workOrder/scene-active.png', active: true },
				{ label: '故障判定', icon: '/static/workOrder/fault.png', iconActive: '/static/workOrder/fault-active.png', active: false },
				{ label: '正在维修', icon: '/static/workOrder/repair.png', iconActive: '/static/workOrder/repair-active.png', active: false },
				{ label: '工单结束', icon: '/static/workOrder/over.png', iconActive: '/static/workOrder/over-active.png', active: false }
			]

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
		// 根据 alarmLevel 返回对应背景色
		getLevelColor(level) {
			const colorMap = {
				1: '#52c41a',   // 普通故障
				2: '#faad14',   // 一般故障
				3: '#f5222d',   // 重大故障
				4: '#722ed1'    // 特殊故障
			};
			return colorMap[level] || 'transparent'; // 有其他故障情况默认透明色
		},
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
					this.workOrderBase.alarmLevel = data.order.alarmLevel || 0; // 用于显隐和颜色
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
	color: #ffffff;
	font-size: 26rpx;
	font-weight: 500;
	padding: 12rpx 32rpx 12rpx 24rpx;
	border-radius: 0 32rpx 0 32rpx;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.15); /* 统一阴影，不依赖背景色 */
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

/* ================== 工单详情卡片 ================== */
.detail-card {
	background: #ffffff;
	border-radius: 32rpx;
	padding: 40rpx 30rpx 20rpx 30rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 40rpx;
}

/* 进度条区域 */
.progress-steps {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 10rpx 0 40rpx 0;
	border-bottom: 2rpx solid #f0f0f0;
	margin-bottom: 30rpx;
}

/* 用一个组包裹步骤和箭头，确保箭头作为单独一列 */
.step-group {
	display: flex;
	align-items: flex-start;
	justify-content: center;
}

.step-item {
	display: flex;
	flex-direction: column;
	align-items: center;

	.step-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: #ffffff;
		border: 2rpx solid #e5e6eb;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
		transition: all 0.3s;

		&.is-active {
			background-color: #2b6df6;
			border-color: #2b6df6;
			box-shadow: 0 4rpx 12rpx rgba(43, 109, 246, 0.3);
		}
		.step-img {
			width: 44rpx;
			height: 44rpx;
		}
	}

	.step-text {
		font-size: 22rpx;
		color: #86909c;
		&.is-active {
			color: #1d2129;
			font-weight: 600;
		}
	}
}

/* 箭头独立列 */
.step-arrow {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 8rpx;
	margin-top: 26rpx; /* 与图标对齐 */

	.arrow-img {
		width: 24rpx;
		height: 24rpx;
	}
}

/* 信息区域  */
.info-section {
	display: flex;
	flex-direction: column; /* 纵向排列 */
	padding: 0 20rpx 30rpx 20rpx;
	border-bottom: 2rpx solid #f0f0f0;
	margin-bottom: 30rpx;

	.info-item {
		width: 100%; /* 占满整行 */
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.info-label {
			width: 120rpx;
			color: #86909c;
			font-size: 28rpx;
			flex-shrink: 0;
		}
		.info-value {
			color: #1d2129;
			font-size: 28rpx;
		}
	}
}

/* 时间线区域 */
.timeline-section {
	padding: 0 10rpx;
	position: relative;

	.timeline-item {
		position: relative;
		padding-left: 60rpx; /* 为串珠和箭头预留空间 */
		padding-bottom: 40rpx;

		&:last-child {
			padding-bottom: 0;
		}

		/* 串珠连线：左侧竖线 */
		&::before {
			content: '';
			position: absolute;
			left: 20rpx;
			top: 40rpx;
			bottom: -20rpx;
			width: 4rpx;
			background-color: #e5e6eb;
			z-index: 1; /* 位于下层，被珠子遮挡 */
		}
		&:last-child::before {
			display: none;
		}
	}

	/* 串珠圆点 */
	.timeline-dot {
		position: absolute;
		left: 6rpx;
		top: 20rpx;
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		z-index: 2; /* 压住连线 */
		box-sizing: border-box;
		background-color: #fff;

		&.dot-blue {
			background-color: #2b6df6;
			border: 6rpx solid #dbe5f8;
		}
		&.dot-gray {
			background-color: #f5f7fa;
			border: 6rpx solid #e5e6eb;
		}
	}

	/* 气泡卡片 */
	.timeline-bubble {
		position: relative;
		background: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);

		/* 气泡指向珠子的小三角 */
		&::before {
			content: '';
			position: absolute;
			left: -16rpx;
			top: 30rpx;
			width: 0;
			height: 0;
			border-top: 10rpx solid transparent;
			border-bottom: 10rpx solid transparent;
			border-right: 16rpx solid #ffffff;
			z-index: 3;
		}
	}

	/* --- 气泡内部排版 --- */
	.bubble-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;

		.header-left {
			display: flex;
			align-items: center;
			.user-name {
				font-size: 30rpx;
				font-weight: 600;
				color: #1d2129;
				margin-right: 12rpx;
			}
			.user-role {
				font-size: 24rpx;
				color: #86909c;
			}
		}
		.status-text {
			font-size: 28rpx;
			font-weight: 500;
			&.green { color: #52c41a; }
			&.red { color: #f5222d; }
		}
	}

	.content-desc {
		font-size: 28rpx;
		color: #4e5969;
		margin-bottom: 20rpx;
		line-height: 1.4;
	}

	/* 图片网格 */
	.grid-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-bottom: 20rpx;

		.grid-item {
			position: relative;
			width: 160rpx;
			height: 160rpx;
			border-radius: 12rpx;
			background: #f2f3f5;
			overflow: hidden;

			.grid-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}



			/* 添加照片占位块 */
			&.add-box {
				background: transparent;
				border: 4rpx dashed #c9cdd4;
				display: flex;
				align-items: center;
				justify-content: center;
				box-sizing: border-box;

				.icon-plus {
					font-size: 48rpx;
					color: #86909c;
					line-height: 1;
					font-weight: 300;
				}
			}
		}
	}

	/* 气泡底部 */
	.bubble-bottom {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-top: 4rpx;

		.overtime-text {
			font-size: 26rpx;
			color: #f5222d;
		}
		.time-text {
			font-size: 24rpx;
			color: #86909c;
		}
	}
}
</style>
