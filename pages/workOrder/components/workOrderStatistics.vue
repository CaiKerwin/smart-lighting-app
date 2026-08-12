<template>
	<view class="statistics-container">
		<!-- 顶部 Tabs -->
		<view class="tab-bar">
			<view
				:class="{ active: currentTab === 'pending' }"
				class="tab-item"
				@click="switchTab('pending')"
			>
				<text>待处理工单</text>
				<view v-if="currentTab === 'pending'" class="active-line"></view>
			</view>
			<view
				:class="{ active: currentTab === 'overdue' }"
				class="tab-item"
				@click="switchTab('overdue')"
			>
				<text>超期工单</text>
				<view v-if="currentTab === 'overdue'" class="active-line"></view>
			</view>
			<view
				:class="{ active: currentTab === 'ended' }"
				class="tab-item"
				@click="switchTab('ended')"
			>
				<text>完成工单</text>
				<view v-if="currentTab === 'ended'" class="active-line"></view>
			</view>
		</view>

		<!-- 日期选择区 -->
		<view class="date-picker-wrap">
			<view class="date-box">
				<uni-datetime-picker
					v-model="startDate"
					:border="false"
					class="custom-picker"
					hide-second
					placeholder="选择开始时间"
					return-type="string"
					type="datetime"
				/>
			</view>
			<text class="to-text">至</text>
			<view class="date-box">
				<uni-datetime-picker
					v-model="endDate"
					:border="false"
					class="custom-picker"
					hide-second
					placeholder="选择结束时间"
					return-type="string"
					type="datetime"
				/>
			</view>
		</view>

		<!-- 查询按钮 -->
		<button class="query-btn" @click="handleQuery">查询</button>

		<!-- 饼状图区域 -->
		<view class="chart-container">
			<!-- #ifdef H5 -->
			<view ref="pieChartRef" class="chart-box"></view>
			<!-- #endif -->
			<!-- #ifndef H5 -->
			<view class="chart-placeholder">
				<text>暂时不支持查看图表数据</text>
			</view>
			<!-- #endif -->
		</view>

		<!-- 图例区域 -->
		<!-- #ifdef H5 -->
		<view v-if="pieData.length" class="legend-container">
			<view v-for="(item, index) in pieData" :key="index" class="legend-item">
				<view :style="{ backgroundColor: colorList[index % colorList.length] }" class="color-block"></view>
				<text class="legend-label">{{ item.name }}{{ item.value }}</text>
			</view>
		</view>
		<!-- #endif -->

		<!-- 工单列表 -->
		<view class="list-container">
			<view
				v-for="(item, index) in listData"
				:key="index"
				class="list-item"
				@click="handleItemClick(item)"
				@longpress="handleLongPress(item)"
			>
				<!-- 时间分隔符 -->
				<view class="time-tag">
					<image class="icon-clock" mode="aspectFit" src="/static/common/clock.png"></image>
					{{ item.time }}
				</view>

				<!-- 卡片 -->
				<view :class="{ 'select-mode': isSelectMode }" class="card">
					<!-- 选择框 -->
					<view v-if="isSelectMode" class="select-check" @click.stop="toggleSelect(item)">
						<view :class="{ checked: selectedIds.includes(item.id) }" class="check-box">
							<text v-if="selectedIds.includes(item.id)" class="check-mark">✔</text>
						</view>
					</view>

					<!-- 左侧图标 -->
					<view class="card-left">
						<image
							:src="currentTab === 'pending' ? '/static/workOrder/pending.png' : currentTab === 'overdue' ? '/static/workOrder/timeout.png' : '/static/workOrder/work-end.png'"
							class="card-icon"
							mode="aspectFit"
						></image>
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

		<!-- 底部操作栏（多选模式） -->
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
import { request } from "@/utils/request";
import { base64Decode } from "@/utils/common";

// #ifdef H5
import * as echarts from "echarts";
// #endif

export default {
	data() {
		return {
			currentTab: 'pending',
			startDate: '',
			endDate: '',
			listData: [],
			isSelectMode: false,
			selectedIds: [],

			// 数据映射
			workOrderDealStatusMap: {
				10: '工单已生成，待管养人员接警',
				20: '管养人员已接警，待到达现场',
				30: '管养人员已到达现场，待判定故障等级',
				40: '管养人员判定误报，待厂家人员三遥确认',
				50: '若特殊故障申请延期，待管理员审核',
				60: '故障待处理',
				80: '管养人员已处理故障，待系统确认',
				99: '工单结束'
			},
			paramTypeMap: {
				1: '配电柜总配电', 2: '配电柜转换开关', 3: '配电柜控制输出开关',
				4: '配电柜接触器', 5: '配电柜支路配电', 6: '配电柜柜门',
				7: '配电柜门锁', 8: '配电柜烟雾监测', 9: '配电柜水浸监测',
				10: '配电柜线缆', 14: '灯杆', 16: '电能表', 199: '单灯'
			},
			typeMap: {
				'pending': 1,
				'overdue': 6,
				'ended': 7
			},
			// 饼图数据
			pieData: [],
			colorList: ['#7cf07c', '#fce493', '#fab87d', '#6ecbf5', '#fc8f8f', '#a2a8d3', '#f1c40f'],
			// #ifdef H5
			pieChart: null
			// #endif
		};
	},
	onLoad() {
		this.initDateTime();
		this.handleQuery();
	},
	// #ifdef H5
	onReady() {
		// 初始化图表
		this.$nextTick(() => {
			this.initPieChart();
		});
	},
	// #endif
	onUnload() {
		// #ifdef H5
		// 销毁图表
		if (this.pieChart) {
			this.pieChart.dispose();
			this.pieChart = null;
		}
		// #endif
	},
	computed: {
		isAllSelected() {
			return this.listData.length > 0 && this.listData.every(item => this.selectedIds.includes(item.id));
		}
	},
	methods: {
		// 初始化日期 (前7天至今天)
		initDateTime() {
			const now = new Date();
			const end = now;
			const start = new Date();
			start.setDate(start.getDate() - 7);

			const format = (date) => {
				const y = date.getFullYear();
				const m = String(date.getMonth() + 1).padStart(2, '0');
				const d = String(date.getDate()).padStart(2, '0');
				const h = String(date.getHours()).padStart(2, '0');
				const min = String(date.getMinutes()).padStart(2, '0');
				const s = String(date.getSeconds()).padStart(2, '0');
				return `${y}-${m}-${d} ${h}:${min}:${s}`;
			};
			this.startDate = format(start);
			this.endDate = format(end);
		},

		// Tab切换
		switchTab(tab) {
			this.currentTab = tab;
			this.exitSelectMode();
			this.fetchListData();
		},

		// 核心查询方法
		handleQuery() {
			this.exitSelectMode();
			uni.showLoading({ title: '查询中...', mask: true });
			this.fetchListData().finally(() => {
				uni.hideLoading();
			});
		},

		// 获取列表数据并更新饼图
		fetchListData() {
			return new Promise((resolve, reject) => {
				const type = this.typeMap[this.currentTab];
				if (!type) return reject();

				request({
					url: '/station/Maintance/QueryStatusTypeOrder',
					method: 'POST',
					data: {
						start: this.startDate,
						end: this.endDate,
						type: type
					}
				}).then(res => {
					const payload = res.data;
					if (payload && payload.data) {
						const data = JSON.parse(base64Decode(payload.data));

						if (!data || data.length === 0) {
							uni.showToast({ title: '暂无数据', icon: 'none' });
							this.listData = [];
							this.pieData = [];
							// #ifdef H5
							if (this.pieChart) {
								this.pieChart.clear(); // 清除图表内容
							}
							// #endif
							resolve();
							return;
						}

						this.listData = data.map((item, index) => ({
							id: item.id || '',
							time: item.fireTime || '',
							workOrderId: item.code || '',
							index: index + 1,
							station: item.stationName || '',
							attr: (this.paramTypeMap[item.paramType] || '未知设备') + (item.paramName || ''),
							content: item.name || '',
							status: this.workOrderDealStatusMap[item.status] || '未知状态',
							overdue: item.limitTime || ''
						}));

						// 更新饼图 (基于当前列表的status分布)
						this.updatePieDataFromList(this.listData);
						resolve();
					}
				}).catch(err => {
					console.error('获取工单列表错误', err.message);
					reject(err);
				});
			});
		},

		// 根据当前列表数据生成饼图
		updatePieDataFromList(listData) {
			const statusCount = {};
			listData.forEach(item => {
				const statusCode = item.status;
				if (statusCount[statusCode]) {
					statusCount[statusCode]++;
				} else {
					statusCount[statusCode] = 1;
				}
			});

			const tempPieData = [];
			for (const [name, value] of Object.entries(statusCount)) {
				tempPieData.push({ name, value });
			}
			this.pieData = tempPieData;
			// #ifdef H5
			this.updatePieChart();
			// #endif
		},

		// ========== ECharts 饼图渲染 ==========
		// #ifdef H5
		initPieChart() {
			let dom = this.$refs.pieChartRef;
			if (!dom) return;
			if (dom.$el) {
				dom = dom.$el;
			}
			this.pieChart = echarts.init(dom);
			this.updatePieChart();
			window.addEventListener('resize', () => {
				this.pieChart && this.pieChart.resize();
			});
		},
		updatePieChart() {
			if (!this.pieChart) return;
			// ★ 如果没有数据，清空图表不显示“暂无数据”占位
			if (this.pieData.length === 0) {
				this.pieChart.clear();
				return;
			}
			const option = {
				tooltip: { trigger: 'item' },
				color: this.colorList,
				series: [{
					type: 'pie',
					radius: ['50%', '75%'],
					data: this.pieData,
					label: {
						show: true,
						formatter: '{b}{c}',
						position: 'outside'
					},
					labelLine: { show: true }
				}]
			};
			this.pieChart.setOption(option);
		},
		// #endif

		// ========== 列表点击与多选 ==========
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
				uni.navigateTo({
					url: `/pages/workOrder/components/workOrderDetail?id=${item.id}`
				});
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
				this.selectedIds = this.listData.map(item => item.id);
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
								this.listData = this.listData.filter(item => !this.selectedIds.includes(item.id));
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
					data: { orderIds: ids }
				}).then(res => {
					if (res.statusCode !== 200) {
						reject(new Error(`请求失败 (${res.statusCode})`));
						return;
					}
					const payload = res.data;
					if (payload.code === 0) {
						resolve(payload);
					} else {
						reject(new Error(payload.msg || '删除失败'));
					}
				}).catch(err => reject(err));
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.statistics-container {
	background-color: #f4f7fb;
	min-height: 100vh;
	padding: 0 40rpx 160rpx 40rpx;
	box-sizing: border-box;
}

/* Tabs */
.tab-bar {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 0;
	border-radius: 20rpx;
	margin-bottom: 30rpx;
	.tab-item {
		font-size: 30rpx;
		color: #999;
		font-weight: 500;
		position: relative;
		padding-bottom: 10rpx;
		&.active {
			color: #3880FC;
			.active-line {
				position: absolute;
				bottom: 0;
				left: 50%;
				transform: translateX(-50%);
				width: 40rpx;
				height: 4rpx;
				background: #3880FC;
				border-radius: 4rpx;
			}
		}
	}
}

/* 日期选择区 */
.date-picker-wrap {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;

	.date-box {
		flex: 1;
		background: #fff;
		border-radius: 12rpx;
		padding: 16rpx 0;
		display: flex;
		justify-content: center;
		.custom-picker {
			width: 100%;
			display: flex;
			justify-content: center;
			:deep(.uni-datetime-picker-text) {
				color: #4ba3f5;
				font-size: 28rpx;
			}
		}
	}
	.to-text {
		margin: 0 20rpx;
		color: #333;
		font-size: 28rpx;
	}
}

/* 查询按钮 */
.query-btn {
	width: 100%;
	height: 88rpx;
	background: #3b82f6;
	color: #fff;
	font-size: 32rpx;
	border-radius: 12rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 40rpx;
	&::after { border: none; }
}

/* 饼状图区域 */
.chart-container {
	background: #fff;
	border-radius: 20rpx;
	padding: 20rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 20rpx;
	min-height: 400rpx;
	// #ifdef H5
	.chart-box {
		width: 100%;
		height: 400rpx;
	}
	// #endif
	// #ifndef H5
	.chart-placeholder {
		color: #999;
		font-size: 28rpx;
	}
	// #endif
}

/* 图例区域 */
.legend-container {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 30rpx;
	background: #fff;
	border-radius: 20rpx;
	padding: 20rpx;
	margin-bottom: 30rpx;
	.legend-item {
		display: flex;
		align-items: center;
		.color-block {
			width: 24rpx;
			height: 24rpx;
			border-radius: 4rpx;
			margin-right: 10rpx;
		}
		.legend-label {
			font-size: 26rpx;
			color: #333;
		}
	}
}

/* 列表区域 */
.list-container {
	.list-item {
		margin-bottom: 48rpx;
		.time-tag {
			display: flex;
			justify-content: center;
			align-items: center;
			background: #e1e7f0;
			padding: 8rpx 32rpx;
			border-radius: 24rpx;
			font-size: 24rpx;
			color: #333;
			margin: 0 auto 24rpx auto;
			width: fit-content;
			.icon-clock {
				width: 24rpx;
				height: 24rpx;
				margin-right: 8rpx;
			}
		}

		.card {
			background: #fff;
			border-radius: 24rpx;
			padding: 32rpx 32rpx 32rpx 24rpx;
			display: flex;
			align-items: flex-start;
			transition: all 0.2s;
			&.select-mode { padding-left: 16rpx; }

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
					width: 44rpx; height: 44rpx;
					border-radius: 50%;
					border: 2rpx solid #d1d5db;
					background: #fff;
					display: flex; align-items: center; justify-content: center;
					transition: all 0.3s;
					&.checked {
						background: #3b82f6; border-color: #3b82f6;
						transform: scale(1.1);
						.check-mark {
							color: #fff; font-size: 30rpx; font-weight: 700;
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
				display: flex; align-items: center; justify-content: center;
				.card-icon {
					width: 100%; height: 100%;
					border-radius: 50%;
					background: #e5f0ff;
				}
			}

			.card-right {
				flex: 1;
				.data-row {
					display: flex;
					align-items: center;
					margin-bottom: 16rpx;
					line-height: 1.5;
					&:last-child { margin-bottom: 0; }
					.label {
						width: 140rpx;
						color: #999;
						font-size: 28rpx;
						flex-shrink: 0;
					}
					.value {
						color: #333;
						font-size: 28rpx;
						flex: 1;
					}
					.index {
						color: #ccc;
						font-size: 26rpx;
						margin-left: 20rpx;
						flex-shrink: 0;
					}
					.text-red { color: #ff4d4f; }
				}
			}
		}
	}
}

/* 底部操作栏 */
.bottom-bar {
	position: fixed;
	bottom: 0; left: 0; right: 0;
	background: #fff;
	box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.08);
	padding: 20rpx 40rpx;
	z-index: 999;
	height: 100rpx;
	display: flex; align-items: center;
	.bar-content {
		width: 100%;
		display: flex; justify-content: space-between; align-items: center; flex: 1;
		.btn-cancel, .btn-select-all, .btn-delete, .btn-exit {
			font-size: 32rpx; font-weight: 500; padding: 8rpx 24rpx;
		}
		.btn-select-all { color: #3b82f6; }
		.btn-cancel { color: #333; }
		.btn-delete { color: #ff3b30; }
		.btn-exit { margin-left: auto; color: #999; font-size: 40rpx; }
	}
}
</style>
