<template>
	<view class="page-wrapper">
		<!-- 工单列表 -->
		<view :class="{ 'select-mode-active': isSelectMode }" class="pending-list-container">
			<view v-for="(item, index) in pendingListData"
				  :key="index"
				  class="list-item"
				  @click="handleItemClick(item)"
				  @longpress="handleLongPress(item)"
			>
				<!-- 日期时间分隔符 -->
				<view class="time-tag">
					<image class="icon-clock-img" mode="aspectFit" src="/static/common/clock.png"></image>
					{{ item.time }}
				</view>

				<!-- 卡片内容 -->
				<view :class="{ 'select-mode': isSelectMode }" class="card">
					<!-- 选择框（仅在选择模式下显示） -->
					<view v-if="isSelectMode" class="select-check" @click.stop="toggleSelect(item)">
						<view :class="{ checked: selectedIds.includes(item.id) }" class="check-box">
							<text v-if="selectedIds.includes(item.id)" class="check-mark">✔</text>
						</view>
					</view>
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

		<!-- 底部工具栏（仅在选择模式下显示） -->
		<view v-if="isSelectMode" class="bottom-bar">
			<view class="bar-content">
				<text class="btn-cancel" @click="cancelSelect">取消选中</text>
				<text class="btn-select-all" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</text>
				<text class="btn-delete" @click="confirmDelete">删除</text>
				<text class="btn-exit" @click="exitSelectMode">✕</text>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	data() {
		return {
			pendingListData: [],
			isSelectMode: false,
			selectedIds: []
		};
	},
	onLoad() {
		// 页面加载时获取待受理工单列表数据
		this.getPendingListData();
	},
	computed: {
		// 判断是否已全选
		isAllSelected() {
			return this.pendingListData.length > 0 && this.pendingListData.every(item => this.selectedIds.includes(item.id));
		}
	},
	methods: {
		getPendingListData(){
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
			uni.showLoading({ title: '加载中...', mask: true });
			request({
				url: '/station/Maintance/QueryStatusTypeOrder',
				method: 'POST',
				data: {
					// 查询所有待受理工单
					start: '',
					end: '',
					type: 1 // 待受理
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				uni.hideLoading();
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
						id: item.id || '', // 用于跳转工单详情
					}))
				} else {
					uni.showToast({title: '获取待受理工单列表数据失败', icon: 'none'});
				}
				if (this.pendingListData.length === 0) {
					uni.showToast({title: '暂无待受理工单', icon: 'none'})
				}
				this.exitSelectMode();
			}).catch(err =>{
				uni.hideLoading();
				console.error('获取待受理工单列表错误', err.message);
				uni.showToast({ title: '网络异常，请重试', icon: 'none' });
			})
		},
		goToPendingWODetail(id) {
			uni.navigateTo({
				url: `/pages/workOrder/components/workOrderDetail?id=${id}`
			});
		},
		// ----- 选择模式相关方法 -----
		handleLongPress(item) {
			if (this.isSelectMode) return;
			this.isSelectMode = true;
			if (!this.selectedIds.includes(item.id)) {
				this.selectedIds.push(item.id);
			}
		},
		handleItemClick(item) {
			if (this.isSelectMode) {
				this.toggleSelect(item);
			} else {
				this.goToPendingWODetail(item.id);
			}
		},
		toggleSelect(item) {
			const idx = this.selectedIds.indexOf(item.id);
			if (idx > -1) {
				this.selectedIds.splice(idx, 1);
			} else {
				this.selectedIds.push(item.id);
			}
		},
		cancelSelect() {
			this.selectedIds = [];
			this.isSelectMode = true;
		},
		toggleSelectAll() {
			if (this.isAllSelected) {
				this.selectedIds = [];
			} else {
				this.selectedIds = this.pendingListData.map(item => item.id);
			}
		},
		exitSelectMode() {
			this.selectedIds = [];
			this.isSelectMode = false;
		},
		confirmDelete() {
			if (this.selectedIds.length === 0) {
				uni.showToast({ title: '请至少选择一条工单', icon: 'none' });
				return;
			}
			uni.showModal({
				title: '确认删除',
				content: `确定要删除选中的 ${this.selectedIds.length} 条工单吗？`,
				success: (res) => {
					if (res.confirm) {
						this.batchDeleteWorkOrder(this.selectedIds)
							.then(() => {
								this.pendingListData = this.pendingListData.filter(
									item => !this.selectedIds.includes(item.id)
								);
								uni.showToast({ title: '删除成功', icon: 'success' });
								this.exitSelectMode();
							})
							.catch(err => {
								uni.showToast({ title: err.message || '删除失败', icon: 'none' });
								console.error(err.message);
							});
					}
				}
			});
		},
		batchDeleteWorkOrder(ids) {
			return new Promise((resolve, reject) => {
				request({
					url: '/station/Maintance/DeleteWorkOrders',
					method: 'POST',
					data: {
						orderIds: ids
					}
				})
					.then(res => {
						if (res.statusCode !== 200) {
							reject(new Error(`请求失败 (${res.statusCode})`));
							return;
						}
						const payload = res.data;
						if (!payload) {
							reject(new Error('接口返回数据异常'));
							return;
						}
						if (payload.code === 0) {
							resolve(payload);
						} else {
							reject(new Error(payload.msg || '删除失败'));
						}
					})
					.catch(err => {
						reject(err);
					});
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.page-wrapper {
	background-color: #f4f7fb;
	min-height: 100vh;
	box-sizing: border-box;
	padding: 40rpx 40rpx 160rpx;
}
.pending-list-container {
	.list-item {
		margin-bottom: 48rpx;
		.time-tag {
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #e1e7f0;
			padding: 8rpx 32rpx;
			border-radius: 24rpx;
			font-size: 24rpx;
			color: #333;
			margin: 0 auto 24rpx auto;
			width: fit-content;
			.icon-clock-img {
				width: 24rpx;
				height: 24rpx;
				margin-right: 8rpx;
			}
		}
		.card {
			background: #ffffff;
			border-radius: 24rpx;
			padding: 32rpx 32rpx 32rpx 24rpx;
			display: flex;
			align-items: flex-start;
			transition: all 0.2s;
			&.select-mode {
				padding-left: 16rpx;
			}
			.select-check {
				width: 72rpx;
				height: 48rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				margin-right: 8rpx;
				margin-top: 4rpx;
				.check-box {
					width: 44rpx;
					height: 44rpx;
					border-radius: 50%;
					border: 2rpx solid #d1d5db;
					background-color: #ffffff;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: background-color 0.4s, border-color 0.4s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
					&:hover {
						transform: scale(1.05);
						border-color: #3b82f6;
					}
					&.checked {
						background-color: #3b82f6;
						border-color: #3b82f6;
						transform: scale(1.1) rotateZ(360deg) rotateY(360deg);
						.check-mark {
							color: #ffffff;
							font-size: 30rpx;
							line-height: 1;
							font-weight: 700;
							transition: color 0.2s 0.3s;
						}
					}
				}
			}
			.card-left {
				width: 48rpx;
				height: 48rpx;
				margin-right: 24rpx;
				flex-shrink: 0;
				margin-top: 4rpx;
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
					margin-bottom: 16rpx;
					line-height: 1.5;
					&:last-child {
						margin-bottom: 0;
					}
					.label {
						width: 140rpx;
						color: #999999;
						font-size: 28rpx;
						flex-shrink: 0;
					}
					.value {
						color: #333333;
						font-size: 28rpx;
						flex: 1;
					}
					.index {
						color: #cccccc;
						font-size: 26rpx;
						margin-left: 20rpx;
						flex-shrink: 0;
					}
					.text-red {
						color: #ff4d4f;
					}
				}
			}
		}
	}
}
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
	padding: 20rpx 40rpx;
	z-index: 999;
	height: 100rpx;
	display: flex;
	align-items: center;
	.bar-content {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex: 1;
		.btn-cancel,

		.btn-delete,
		.btn-exit {
			font-size: 32rpx;
			font-weight: 500;
			padding: 8rpx 24rpx;
			cursor: pointer;
		}

		.btn-select-all {
			color: #3b82f6;
		}

		.btn-cancel {
			color: #333333;
		}
		.btn-delete {
			color: #ff3b30;
		}
		.btn-exit {
			margin-left: auto;
			color: #999999;
			font-size: 40rpx;
			font-weight: 400;
			padding: 8rpx 0;
			cursor: pointer;
		}
	}
}
</style>
