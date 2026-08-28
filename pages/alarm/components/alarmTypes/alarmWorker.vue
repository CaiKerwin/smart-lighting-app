<template>
	<view :class="themeClass" class="alarm-worker-container">
		<AlarmCenter :initialTab="tab" @change="onTabChange" />
		<view class="manual-report-btn" @click="goToManualReport">
			人工报障
		</view>

		<!-- 人工报障列表 -->
		<view class="alarm-worker-list">
			<view v-for="(item, index) in workerAlarmList" :key="index" class="card">
				<!-- 头部 -->
				<view class="card-header">
					<image class="header-icon" mode="aspectFill" src="/static/alarm/pdg.png" />
					<view class="header-info">
						<view class="title">{{ item.title }}</view>
						<view class="time">{{ item.time }}</view>
					</view>
				</view>

				<!-- 主体 -->
				<view class="card-body">
					<view class="row">
						<text class="label">报警设备</text>
						<text class="value">{{ item.device }}</text>
					</view>
					<view class="row">
						<text class="label">报警内容</text>
						<text class="value">{{ item.content }}</text>
					</view>
					<!-- 内容区图片 -->
					<view v-if="item.imageIds && item.imageIds.length" class="content-images">
						<image
							v-for="(imgId, idx) in item.imageIds"
							:key="idx"
							:src="getImageUrl(imgId)"
							class="content-img"
							mode="aspectFill"
							@click="previewImage(item.imageIds, idx)"
						/>
					</view>
				</view>

				<!-- 底部 -->
				<view class="card-footer">
					<view class="action-btn" @click="manualWorkOrder(item.id)">
						<image class="btn-icon" mode="aspectFit" src="/static/alarm/watch.png" />
						<text>手动下发工单</text>
					</view>
					<view class="action-btn">
						<image class="btn-icon" mode="aspectFit" src="/static/alarm/check.png" />
						<text :style="{ color: item.isConfirm ? '#3A7BF7' : 'red' }">{{ item.isConfirm===true ? '已确认' : '未确认' }}</text>
					</view>
					<view class="action-btn" @click="deleteWorkerAlarm(item.id)">
						<image class="btn-icon" mode="aspectFit" src="/static/alarm/delete.png" />
						<text>删除</text>
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
			tab: '人工报障',
			tabMap: {
				'配电箱报警': '/pages/alarm/components/alarmTypes/alarmPowerbox',
				'单灯报警': '/pages/alarm/components/alarmTypes/alarmLight',
				'离线报警': '/pages/alarm/components/alarmTypes/alarmOffline',
				'线路供电异常报警': '/pages/alarm/components/alarmTypes/alarmException',
				'线路供电异常报警记录': '/pages/alarm/components/alarmTypes/alarmExceptionRecord',
				'水浸报警': '/pages/alarm/components/alarmTypes/alarmWater',
				'人工报障': '/pages/alarm/components/alarmTypes/alarmWorker'
			},
			// 人工报障列表
			workerAlarmList: []
		};
	},
	onLoad() {
		// 页面加载时获取人工报障列表
		this.fetchWorkerAlarmList();
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
		goToManualReport(){
			uni.navigateTo({
				url: '/pages/alarm/components/alarmTypes/modules/manualReport'
			});
		},
		fetchWorkerAlarmList() {
			/**
			 * [
			 *  {
			 *     "id": "d1caa2cad22340fb80769fa600c48242",
			 *     "stationId": 2211,
			 *     "stationName": "单灯测试",
			 *     "paramId": 352308,
			 *     "paramName": "116B-1",
			 *     "mobile": "13655525481",
			 *     "reportName": "小张张",
			 *     "imageIds": [
			 *       "9b6dc60aa5c74a7b9133255404247b47"
			 *     ],
			 *     "type": 0,
			 *     "name": "人工报障",
			 *     "extra": "路灯不亮；白天亮灯；其它:灯太亮了",
			 *     "startTime": "2025-08-12 09:40:32",
			 *     "isConfirm": true,
			 *     "confirmName": "路灯不亮；白天亮灯；其它:灯太亮了",
			 *     "confirmTime": "2025-08-12 09:41:00",
			 *     "byUser": false
			 *    }
			 *  ]
			 */
			request({
				url: '/station/alarm/QueryReportSimple',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				try {
					if (payload && payload.data){
						const data = JSON.parse(base64Decode(payload.data));
						this.workerAlarmList = data.map(item =>({
							title: item.stationName,
							time:item.startTime,
							device: item.paramName,
							content: item.extra,
							imageIds: item.imageIds,
							isConfirm: item.isConfirm,
							id: item.id // 删除人工报障工单功能要用到
						}));
					}
					// 若列表为空，提示
					if (this.workerAlarmList.length === 0) {
						uni.showToast({ title: '暂无人工报障记录', icon: 'none' });
					}
				} catch (e) {
					console.error('解析人工报障列表数据失败', e.message);
				}

			}).catch(err =>{
				console.error('查询人工报障列表错误', err.message);
			})
		},
		getImageUrl(imageId) {
			const token = uni.getStorageSync('authToken') || ''; // 从本地存储中获取 token
			if (!token) {
				console.warn('未获取到 token，图片可能无法显示');
			}
			return `https://www.amdm.top/api/center/station/config/ViewImage?id=${imageId}&auth=${token}`;
		},
		previewImage(ids, current) {
			const urls = ids.map(id => this.getImageUrl(id));
			uni.previewImage({
				urls: urls,
				current: current
			});
		},
		deleteWorkerAlarm(id) {
			console.log('删除人工报障记录：', id);
			uni.showModal({
				title: '提示',
				content: '确定要删除此人工报障记录吗？',
				success: (res) =>{
					if (res.confirm) {
						request({
							url: '/station/alarm/DeleteReportAlarms',
							method: 'POST',
							data: {
								list: [id]
							}
						}).then(res =>{
							console.log(res.data.data);
							const payload = res.data;
							if (res.statusCode === 200 && payload.data){ // code === 200 表示OK
								uni.showToast({ title: '删除成功', icon: 'none' });
								// 删除成功后刷新列表
								this.fetchWorkerAlarmList();
							} else {
								uni.showToast({ title: '删除失败', icon: 'none' });
							}
						}).catch(err =>{
							console.error('删除人工报障记录错误：', err.message);
							uni.showToast({ title: '删除失败，请重试', icon: 'none' });
						})
					} else {
						console.log('用户取消删除');
					}
				}
			})
		},
		manualWorkOrder(id) {
			uni.showModal({
				title: '提示',
				content: '确定要手动下发工单吗？',
				confirmText: '确定',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						request({
							url: '/station/alarm/CreateOrderByPoleAlarms',
							method: 'POST',
							data: {
								list: [id]
							}
						}).then(res =>{
							console.log(res.data.data);
							uni.showToast({ title: '手动下发工单成功', icon: 'success' });
						}).catch(err =>{
							console.error('手动下发工单错误：', err.message);
							uni.showToast({ title: '手动下发工单出错，请重试', icon: 'none' });
						})
					} else {
						console.log('用户点击取消');
					}
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.alarm-worker-container {
	width: 100%;
	min-height: 100vh;
	background-color: var(--bg-page);
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

// 按钮
.manual-report-btn {
	width: 100%;
	margin-top: 20rpx;
	padding: 20rpx 0;
	border: 2rpx solid #5a9cf8;
	border-radius: 12rpx;
	background-color: var(--bg-card);
	color: #5a9cf8;
	font-size: 32rpx;
	font-weight: 500;
	text-align: center;
	box-sizing: border-box;
	cursor: pointer;

	&:active {
		opacity: 0.7;
	}
}

// 列表样式
.alarm-worker-list {
	padding: 20rpx;
	box-sizing: border-box;

	.card {
		background-color: var(--bg-card);
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
		display: flex;
		flex-direction: column;
	}

	// 卡片头部
	.card-header {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;

		.header-icon {
			width: 80rpx;
			height: 80rpx;
			border-radius: 12rpx;
			margin-right: 20rpx;
			background-color: var(--bg-accent);
		}

		.header-info {
			display: flex;
			flex-direction: column;

			.title {
				font-size: 32rpx;
				font-weight: 600;
				color: var(--text-primary);
			}

			.time {
				font-size: 24rpx;
				color: var(--text-quaternary);
				margin-top: 6rpx;
			}
		}
	}

	// 卡片内容
	.card-body {
		margin-bottom: 30rpx;

		.row {
			display: flex;
			align-items: flex-start;
			font-size: 28rpx;
			line-height: 1.6;
			margin-bottom: 12rpx;

			.label {
				color: var(--text-secondary);
				margin-right: 16rpx;
				white-space: nowrap;
			}

			.value {
				color: var(--text-primary);
				flex: 1;
				word-break: break-all;
			}
		}

		.content-images {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;
			margin-top: 16rpx;

			.content-img {
				width: 200rpx;
				height: 140rpx;
				border-radius: 8rpx;
				background-color: var(--bg-soft);
				flex-shrink: 0;
			}
		}
	}

	// 卡片底部操作栏
	.card-footer {
		display: flex;
		justify-content: space-between;
		gap: 16rpx;

		.action-btn {
			flex: 1;
			height: 64rpx;
			background-color: var(--bg-accent);
			border-radius: 8rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			color: #3b82f6;
			font-size: 26rpx;
			box-sizing: border-box;
			cursor: pointer;

			&:active {
				opacity: 0.6;
			}

			.btn-icon {
				width: 28rpx;
				height: 28rpx;
				margin-right: 8rpx;
			}
		}
	}
}
</style>
