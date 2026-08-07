<template>
	<view class="search-result-container">
		<!-- 搜索条件展示 -->
		<view class="search-condition">
			<text class="condition-label">搜索条件：</text>
			<text class="condition-type">{{ searchTypeLabel }}</text>
			<text class="condition-value">“{{ searchValue }}”</text>
			<text class="condition-result">（共 {{ total }} 条结果）</text>
		</view>
		<!-- 搜索结果表格 -->
		<view class="table-container">
			<uni-table border emptyText="暂无数据" stripe>
				<!-- 表头行 -->
				<uni-tr>
					<uni-th align="center" width="40%">工单ID</uni-th>
					<uni-th align="center" width="30%">所属站点</uni-th>
					<uni-th align="center" width="30%">操作</uni-th>
				</uni-tr>
				<!-- 表格数据行 -->
				<uni-tr v-for="(item, index) in workOrderList" :key="index">
					<uni-td align="center">{{ item.code || '' }}</uni-td>
					<uni-td align="center">{{ item.stationName || '' }}</uni-td>
					<uni-td align="center">
						<button
							size="mini"
							type="primary"
							@click="goToWorkOrderDetailPage(item.orderId)"
						>
							查看详情
						</button>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>
		<!-- 分页器 -->
		<view v-if="total > 0"  class="pagination-container">
			<uni-pagination
				:current="currentPage"
				:pageSize="pageSize"
				:total="total"
				@change="handlePageChange"
			/>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
export default {
	data() {
		return {
			// 搜索参数
			searchType: "",
			searchValue: "",
			// 分页器相关数据
			total: 0, // 总数据条数
			currentPage: 1, // 当前页码
			pageSize: 10, // 每页显示条数
			// 工单列表数据
			workOrderList: [],
			// 所有数据（用于分页）
			allWorkOrderList: [],
		};
	},
	computed: {
		searchTypeLabel() {
			const map = {
				workOrderId: "工单ID",
				workOrderName: "故障内容",
				generateTime: "生成时间",
			};
			return map[this.searchType] || this.searchType;
		},
	},
	onLoad(options) {
		// 接收搜索参数
		this.searchType = options.searchType || "workOrderId";
		this.searchValue = decodeURIComponent(options.searchValue || "");
		if (!this.searchValue) {
			uni.showToast({ title: "搜索内容为空", icon: "none" });
			return;
		}
		// 获取数据
		this.fetchWorkOrderSearchList();
	},
	methods: {
		fetchWorkOrderSearchList() {
			/**
			 * {
			 *   "count": 2,
			 *   "list": [
			 *     {
			 *       "orderId": "dd0ef9a948f7498c8bc3cb10298aec5d",
			 *       "logId": "77176a753d95467b8c4bc24828b07701",
			 *       "startTime": "2026-08-05 18:01:00",
			 *       "stationId": 75,
			 *       "stationName": "AMDM演示柜",
			 *       "code": "202608050002",
			 *       "name": "过流",
			 *       "paramType": 1,
			 *       "paramId": 0,
			 *       "fireTime": "2026-08-05 18:01:00",
			 *       "status": 10,
			 *       "limit": false,
			 *       "limitTime": "2026-08-05 18:01:00",
			 *       "notifySms": false,
			 *       "smsTime": "0001-01-01 00:00:00",
			 *       "notifyVms": false,
			 *       "vmsTime": "0001-01-01 00:00:00"
			 *     },
			 *     {
			 *       "orderId": "6e59eaf9b97c4bfcaa27824821ef9a66",
			 *       "logId": "fd1f6e346e0c4efdb181bf8decaf475a",
			 *       "startTime": "2026-08-06 10:43:59",
			 *       "stationId": 2672,
			 *       "stationName": "演示道路",
			 *       "code": "202608030001",
			 *       "name": "路灯不亮;1",
			 *       "paramType": 14,
			 *       "paramId": 456007,
			 *       "paramName": "1",
			 *       "fireTime": "2026-08-03 11:32:00",
			 *       "dealUserName": "蔡仕栋",
			 *       "status": 30,
			 *       "limit": false,
			 *       "limitTime": "2026-08-03 11:32:00",
			 *       "notifySms": false,
			 *       "smsTime": "0001-01-01 00:00:00",
			 *       "notifyVms": false,
			 *       "vmsTime": "0001-01-01 00:00:00"
			 *     }
			 *   ]
			 * }
			 */
			uni.showLoading({ title: "加载中..." });
			// 构建请求参数
			let params = {};
			switch (this.searchType) {
				case "workOrderId":
					params = {
						start: '1970-01-01 00:00:00',
						end: '2099-12-31 23:59:59',
						name: '',
						code: this.searchValue,
						stationId: 0,
						paramType:0
					}
					break;
				case "workOrderName":
					params = {
						start: '1970-01-01 00:00:00',
						end: '2099-12-31 23:59:59',
						name: this.searchValue,
						code: '',
						stationId: 0,
						paramType:0
					}
					break;
				case "generateTime":
					// searchValue的格式是 yyyy-MM-dd，所以start和end需要拼接时分秒部分
					params = {
						start: this.searchValue +' '+'00:00:00',
						end: this.searchValue +' '+ '23:59:59',
						name: '',
						code: '',
						stationId: 0,
						paramType:0
					}
					break;
				default:
					break;
			}
			request({
				url: "/station/Maintance/QuerySysOrder",
				method: "POST",
				data: params,
			})
				.then((res) => {
					console.log(base64Decode(res.data.data));
					uni.hideLoading();
					const payload = res.data;
					if (payload && payload.data) {
						try {
							const decoded = base64Decode(payload.data);
							const result = JSON.parse(decoded);
							const list = result.list || [];
							this.allWorkOrderList = list;
							this.total = list.length;
							// 更新当前页数据
							this.updatePageData();
						} catch (e) {
							console.error("解析搜索结果失败:", e);
							this.allWorkOrderList = [];
							this.total = 0;
							this.workOrderList = [];
							uni.showToast({ title: "数据解析失败", icon: "none" });
						}
					} else {
						this.allWorkOrderList = [];
						this.total = 0;
						this.workOrderList = [];
						uni.showToast({ title: payload?.message || "查询失败", icon: "none" });
					}
				})
				.catch((err) => {
					uni.hideLoading();
					console.error("搜索工单数据错误:", err.message);
					this.allWorkOrderList = [];
					this.total = 0;
					this.workOrderList = [];
					uni.showToast({ title: "网络请求失败", icon: "none" });
				});
		},
		/**
		 * 更新当前页数据
		 */
		updatePageData() {
			const start = (this.currentPage - 1) * this.pageSize;
			const end = Math.min(start + this.pageSize, this.total);
			this.workOrderList = this.allWorkOrderList.slice(start, end);
		},
		/**
		 * 分页切换
		 */
		handlePageChange(e) {
			this.currentPage = e.current;
			this.updatePageData();
		},
		goToWorkOrderDetailPage(orderId) {
			if (!orderId) {
				uni.showToast({ title: "工单ID缺失", icon: "none" });
				return;
			}
			uni.navigateTo({
				url: `/pages/workOrder/components/workOrderDetail?id=${orderId}`,
			});
		}
	},
}
</script>

<style lang="scss" scoped>
.search-result-container {
	min-height: 100vh;
	padding: 24rpx;
	background-color: #f5f7fa;
	display: flex;
	flex-direction: column;
}

/* 搜索条件展示 */
.search-condition {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	font-size: 24rpx;
}

.condition-label {
	color: #999;
	margin-right: 4rpx;
}

.condition-type {
	color: #3880fc;
	font-weight: 600;
	margin-right: 4rpx;
}

.condition-value {
	color: #333;
	font-weight: 500;
	margin-right: 12rpx;
}

.condition-result {
	color: #999;
}

/* 表格容器 */
.table-container {
	flex: 1;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 16rpx 8rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

/* 分页器容器 */
.pagination-container {
	margin-top: 24rpx;
	display: flex;
	justify-content: center;
	padding: 12rpx 0;
}

/* uni-table 样式微调 */
::v-deep .uni-table {
	border-radius: 12rpx;
	overflow: hidden;
}

::v-deep .uni-th {
	background: #f0f4fe !important;
	color: #333;
	font-weight: 600;
	font-size: 28rpx;
	padding: 20rpx 0;
}

::v-deep .uni-td {
	font-size: 26rpx;
	padding: 18rpx 0;
	color: #444;
}

::v-deep .uni-tr {
	border-bottom: 1rpx solid #f0f2f5;
}

::v-deep .uni-tr:last-child {
	border-bottom: none;
}



/* 空状态文字 */
::v-deep .uni-table-empty-text {
	color: #bbb;
	font-size: 28rpx;
	padding: 60rpx 0;
}
</style>
