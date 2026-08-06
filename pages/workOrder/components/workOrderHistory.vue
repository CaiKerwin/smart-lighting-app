<template>
	<view class="page-wrapper">
		<!-- 时间选择框 -->
		<view class="date-picker">
			<view class="date-input-wrap">
				<uni-datetime-picker
					type="datetime"
					v-model="startDate"
					return-type="string"
					:border="false"
					class="custom-picker"
					placeholder="选择开始时间"
					format="yyyy-MM-dd HH:mm:ss"
				/>
			</view>

			<text class="to-text">至</text>

			<view class="date-input-wrap">
				<uni-datetime-picker
					type="datetime"
					v-model="endDate"
					return-type="string"
					:border="false"
					class="custom-picker"
					placeholder="选择结束时间"
					format="yyyy-MM-dd HH:mm:ss"
				/>
			</view>
		</view>

		<!-- 查询按钮 -->
		<button class="query-btn" @click="queryWorkOrder">查询</button>

		<!-- 工单列表 -->
		<view :class="{ 'select-mode-active': isSelectMode }" class="list-container">
			<view v-for="(item, index) in listData"
				  :key="index"
				  class="list-item"
				  @click="handleItemClick(item)"
				  @longpress="handleLongPress(item)"
			>
				<!-- 日期时间分隔符 -->
				<view class="time-tag">
					<image src="/static/common/clock.png" class="icon-clock-img" mode="aspectFit"></image>
					{{ item.time }}
				</view>

				<!-- 卡片内容 -->
				<view :class="{ 'select-mode': isSelectMode }" class="card">
					<!-- 选择框（仅在选择模式下显示） -->
					<view v-if="isSelectMode" class="select-check" @click.stop="toggleSelect(item)">
						<view :class="{ checked: selectedIds.includes(item.id) }" class="check-box">
							<text v-if="selectedIds.includes(item.id)" class="check-mark">✓</text>
						</view>
					</view>
					<!-- 左侧图标 -->
					<view class="card-left">
						<image src="/static/workOrder/processing.png" class="card-icon" mode="aspectFit"></image>
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
					</view>
				</view>
			</view>
		</view>

		<!-- 底部操作栏（选择模式时显示） -->
		<view v-if="isSelectMode" class="bottom-bar">
			<view class="bar-content">
				<text class="btn-cancel" @click="cancelSelect">取消选中</text>
				<text class="btn-delete" @click="confirmDelete">删除</text>
				<text class="btn-exit" @click="exitSelectMode">✕</text>
			</view>
		</view>
	</view>
</template>

<script>
import uniDatetimePicker from "@dcloudio/uni-ui/lib/uni-datetime-picker/uni-datetime-picker.vue";
import {base64Decode} from "@/utils/common";
import {request} from "@/utils/request";

export default {
	components: { uniDatetimePicker },
	data() {
		return {
			// 时间选择器默认值
			startDate: '',
			endDate: '',
			// 列表数据
			listData: [],
			loading: false,
			// 选择模式相关
			isSelectMode: false,
			selectedIds: [] // 存储工单id，用于选择模式
		};
	},
	methods: {
		queryWorkOrder() {
			//校验
			if (!this.startDate) {
				uni.showToast({ title: '请选择开始时间', icon: 'none' });
				return;
			}
			if (!this.endDate) {
				uni.showToast({ title: '请选择结束时间', icon: 'none' });
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
			/**
			 * {
			 *   "count": 3,
			 *   "list": [
			 *     {
			 *       "id": "f256995ca9354ce5a5c21b28a9b3a727",
			 *       "code": "202607150002",
			 *       "name": "过流",
			 *       "stationId": 2211,
			 *       "stationName": "单灯测试",
			 *       "paramType": 199,
			 *       "paramId": 493797,
			 *       "paramName": "25011501",
			 *       "notifySms": false,
			 *       "notifyCount": 0,
			 *       "fireTime": "2026-07-15 17:54:00",
			 *       "overTime": "2026-07-17 14:12:00"
			 *     },
			 *     {
			 *       "id": "684639293dae4d279e7f9f67bcc36431",
			 *       "code": "202607150001",
			 *       "name": "欠流",
			 *       "stationId": 2211,
			 *       "stationName": "单灯测试",
			 *       "paramType": 199,
			 *       "paramId": 493797,
			 *       "paramName": "25011501",
			 *       "notifySms": false,
			 *       "notifyCount": 0,
			 *       "fireTime": "2026-07-15 17:46:00",
			 *       "overTime": "2026-07-15 17:55:00"
			 *     },
			 *     {
			 *       "id": "fcf92f60c7e14dcea4eae31aa9caee92",
			 *       "code": "202607060002",
			 *       "name": "过流",
			 *       "stationId": 75,
			 *       "stationName": "AMDM演示柜",
			 *       "paramType": 1,
			 *       "paramId": 0,
			 *       "notifySms": false,
			 *       "notifyCount": 0,
			 *       "fireTime": "2026-07-06 15:28:00",
			 *       "overTime": "2026-07-09 18:01:00"
			 *     }
			 *   ]
			 * }
			 */
			request({
				url: '/station/Maintance/QueryDoneWorkOrder',
				method: 'POST',
				data: {
					name: '',
					start: this.startDate,
					end: this.endDate
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				uni.hideLoading();
				this.loading = false;

				// 检查 HTTP 状态
				if (res.statusCode !== 200) {
					uni.showToast({ title: `请求失败 (${res.statusCode})`, icon: 'none' });
					return;
				}
				const payload = res.data;
				if (!payload || !payload.data) {
					uni.showToast({ title: '接口返回数据异常', icon: 'none' });
					return;
				}
				try {
					// 将JSON字符串转换成对象
					const workOrderData = JSON.parse(base64Decode(payload.data));
					// 检查是否包含 list
					if (!workOrderData.list || !Array.isArray(workOrderData.list)) {
						uni.showToast({ title: '数据格式错误', icon: 'none' });
						this.listData = [];
						return;
					}
					this.listData = workOrderData.list.map((item,index) =>({
						time: item.fireTime || '', // 工单下发时间
						workOrderId: item.code || '', // 工单ID
						index: index + 1, // 显示序号
						station: item.stationName || '', //所属站点
						attr: (item.stationName || '') + (item.paramName ? ' ' + item.paramName : ''), // 报警属性
						content: item.name || '', // 简要内容
						id: item.id || '',    // 原始ID，用于删除
					}));
					// 若列表为空，给出提示
					if (this.listData.length === 0) {
						uni.showToast({ title: '该时间段暂无工单', icon: 'none' });
					}
					// 退出选择模式
					this.exitSelectMode();
				} catch (e) {
					console.error('工单数据解析失败', e);
					uni.showToast({ title: '工单数据解析失败，请重试', icon: 'none' });
					this.listData = [];
				}
			}).catch(err =>{
				uni.hideLoading();
				this.loading = false;
				console.error('工单查询错误', err.message);
				uni.showToast({ title: '网络异常，请检查网络后重试', icon: 'none' });
			});
		},
		// ----- 长按进入选择模式 -----
		handleLongPress(item) {
			if (this.isSelectMode) return; // 已在选择模式，忽略
			this.isSelectMode = true;
			// 自动选中长按的项
			if (!this.selectedIds.includes(item.id)) {
				this.selectedIds.push(item.id);
			}
		},
		// ----- 点击工单（选择模式下切换选中） -----
		handleItemClick(item) {
			if (!this.isSelectMode) return;
			this.toggleSelect(item);
		},

		// ----- 切换选中状态 -----
		toggleSelect(item) {
			const idx = this.selectedIds.indexOf(item.id);
			if (idx > -1) {
				this.selectedIds.splice(idx, 1);
			} else {
				this.selectedIds.push(item.id);
			}
		},

		// ----- 取消选中的记录 -----
		cancelSelect() {
			this.selectedIds = [];
			this.isSelectMode = true;
		},

		// ----- 退出选择模式（清空选中） -----
		exitSelectMode() {
			this.selectedIds = [];
			this.isSelectMode = false;
		},
		// ----- 确认删除 -----
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
								// 从列表中移除已删除的项
								this.listData = this.listData.filter(
									item => !this.selectedIds.includes(item.id)
								);
								uni.showToast({ title: '删除成功', icon: 'success' });
								this.exitSelectMode();
							})
							.catch(err => {
								uni.showToast({ title: err.message || '删除失败', icon: 'none' });
								console.error(err.message)
							});
					}
				}
			});
		},
		batchDeleteWorkOrder(ids){
			return new Promise((resolve, reject) => {
				request({
					url: '/station/Maintance/DeleteWorkOrders',
					method: 'POST',
					data: {
						orderIds: ids
					}
				}).then(res => {
					console.log(res);
					if (res.statusCode !== 200) {
						reject(new Error(`请求失败 (${res.statusCode})`));
						return;
					}
					const payload = res.data;
					if (!payload || !payload.data) {
						reject(new Error('接口返回数据异常'));
						return;
					}
					// code===0 表示删除成功
					if (payload.code === 0) {
						resolve(payload);
					} else {
						reject(new Error(payload.msg || '删除失败'));
					}
				}).catch(err => {
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
	// 为底部栏预留空间
	padding: 40rpx 40rpx 160rpx;
}

/* 时间选择区 */
.date-picker {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 32rpx;

	.date-input-wrap {
		flex: 1;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 0 20rpx;
		height: 88rpx;
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
				font-size: 28rpx;
			}
		}
	}

	.to-text {
		margin: 0 20rpx;
		color: #333333;
		font-size: 28rpx;
	}
}

/* 查询按钮 */
.query-btn {
	width: 100%;
	height: 88rpx;
	max-height: 80rpx;
	background-color: #3b82f6;
	color: #ffffff;
	border: none;
	border-radius: 16rpx;
	font-size: 32rpx;
	margin-bottom: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	&::after {
		border: none;
	}
}

/* 列表容器 */
.list-container {
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
				padding-left: 16rpx; // 为选择框腾出空间
			}

			// 选择框
			.select-check {
				width: 72rpx;
				height: 72rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				margin-right: 8rpx;

				.check-box {
					width: 44rpx;
					height: 44rpx;
					border-radius: 50%;
					border: 4rpx solid #cccccc;
					background-color: #ffffff;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.2s;

					&.checked {
						background-color: #3b82f6;
						border-color: #3b82f6;
						.check-mark {
							color: #ffffff;
							font-size: 32rpx;
							line-height: 1;
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

/* 底部操作栏（固定） */
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

		.btn-cancel {
			color: #333333;
		}

		.btn-delete {
			color: #ff3b30;
		}

		.btn-exit {
			color: #999999;
			font-size: 40rpx;
			font-weight: 400;
		}
	}
}
</style>
