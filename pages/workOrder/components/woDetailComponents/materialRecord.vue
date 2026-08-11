<template>
	<view class="material-record-container">
		<!-- 空状态 -->
		<view v-if="materialRecordList.length === 0" class="empty-state">
			<text>暂无申领记录</text>
		</view>

		<!-- 记录列表 -->
		<view v-else class="record-list">
			<view v-for="(item, index) in materialRecordList" :key="index" class="record-card">
				<view class="card-row">
					<text class="label">领取人员</text>
					<text class="value">{{ item.applicant }}</text>
				</view>
				<view class="card-row">
					<text class="label">耗材名称</text>
					<text class="value">{{ item.name }}</text>
				</view>
				<view class="card-row">
					<text class="label">领取数量</text>
					<text class="value">{{ item.amount }} {{ item.unit }}</text>
				</view>
				<view class="card-row">
					<text class="label">领取说明</text>
					<text class="value">{{ item.description }}</text>
				</view>
				<view class="card-row last-row">
					<text class="label">领取时间</text>
					<text class="value">{{ item.createTime }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import {base64Decode} from "@/utils/common";
import {request} from "@/utils/request";

export default {
	data() {
		return {
			orderId: '',
			materialRecordList: []
		};
	},
	onLoad(options) {
		// 获取从工单详情界面传递的工单ID
		this.orderId = options.orderId || '';
		// 页面加载时获取物料记录列表
		this.getMaterialRecordList();
	},
	methods: {
		getMaterialRecordList() {
			/**
			 * [
			 *   {
			 *     "id": "c42389b718af4c9abdc33c47ef86faeb",
			 *     "materialId": "856ac03f93094a2ea3ce637660dc2ddc",
			 *     "materialName": "小开关",
			 *     "materialModel": "1002",
			 *     "materialUnit": "个",
			 *     "matUserId": 1033,
			 *     "matUserName": "蔡仕栋",
			 *     "matAmount": 1,
			 *     "matTime": "2026-08-11 13:48:25",
			 *     "orderFlag": 1,
			 *     "orderId": "6e59eaf9b97c4bfcaa27824821ef9a66",
			 *     "orderCode": null,
			 *     "orderName": null,
			 *     "remark": "维修"
			 *   }
			 * ]
			 */
			uni.showLoading({
				title: '加载中...',
				mask: true
			});
			request({
				url: '/station/asset/OrderUseList',
				method: 'POST',
				data: {
					orderId: this.orderId || ''
				}
			}).then(res => {
				uni.hideLoading();
				console.log(base64Decode(res.data.data));
				const payload =res.data;
				if (payload && payload.data){
					const data = JSON.parse(base64Decode(payload.data));
					this.materialRecordList = data.map(item =>({
						id: item.id,
						applicant: item.matUserName,
						name: item.materialName,
						amount: item.matAmount,
						unit: item.materialUnit,
						description: item.remark,
						createTime: item.matTime
					}));
				} else {
					uni.showToast({
						title: '获取物料记录列表失败',
						icon: 'none'
					});
				}
			}).catch(err =>{
				uni.hideLoading();
				console.log('获取物料记录列表错误', err.message);
				uni.showToast({
					title: '获取物料记录列表错误',
					icon: 'none'
				});
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.material-record-container {
	min-height: 100vh;
	background-color: #f5f7fa; // 页面浅色背景
	padding: 20rpx;
	box-sizing: border-box;
}

.empty-state {
	display: flex;
	justify-content: center;
	align-items: center;
	padding-top: 200rpx;
	color: #999;
	font-size: 28rpx;
}

.record-card {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 0 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.card-row {
	display: flex;
	align-items: flex-start;
	padding: 24rpx 0;
	border-bottom: 1px solid #f0f0f0;

	.label {
		width: 160rpx;
		color: #909399; // 灰黑色标签文字
		font-size: 28rpx;
		flex-shrink: 0;
	}

	.value {
		flex: 1;
		color: #303133; // 深黑色内容文字
		font-size: 28rpx;
		word-break: break-all;
	}

	&.last-row {
		border-bottom: none;
		padding-bottom: 30rpx;
	}
}
</style>
