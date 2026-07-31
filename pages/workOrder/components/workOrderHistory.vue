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
		<view class="list-container">
			<view class="list-item" v-for="(item, index) in listData" :key="index">
				<!-- 日期时间分隔符 -->
				<view class="time-tag">
					<image src="/static/common/clock.png" class="icon-clock-img" mode="aspectFit"></image>
					{{ item.time }}
				</view>

				<!-- 卡片内容 -->
				<view class="card">
					<!-- 左侧图标 -->
					<view class="card-left">
						<image src="/static/workOrder/processing.png" class="card-icon" mode="aspectFit"></image>
					</view>

					<!-- 右侧信息 -->
					<view class="card-right">
						<view class="data-row">
							<text class="label">工单ID</text>
							<text class="value">{{ item.id }}</text>
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
			loading: false
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
						id: item.code || '', // 工单ID
						index: index + 1, // 显示序号
						station: item.stationName || '', //所属站点
						attr: (item.stationName || '') + (item.paramName ? ' ' + item.paramName : ''), // 报警属性
						content: item.name || '' // 简要内容
					}));
					// 若列表为空，给出提示
					if (this.listData.length === 0) {
						uni.showToast({ title: '该时间段暂无工单', icon: 'none' });
					}
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
		}
	}
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
.list-container {
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
