<template>
	<view :class="themeClass" class="light-control-container">
		<view class="list-wrapper">
<!--			<uni-card-->
<!--				:is-shadow="true"-->
<!--				is-full-->
<!--				spacing="0"-->
<!--				margin="12px"-->
<!--				class="custom-card"-->
<!--				v-for="(item, index) in lightControlList"-->
<!--				:key="index"-->
<!--			>-->
<!--				&lt;!&ndash; 主内容区 &ndash;&gt;-->
<!--				<view class="card-body">-->
<!--					<view class="data-row">-->
<!--						<text class="label">规则名称</text>-->
<!--						<text class="value">{{ item.ruleName }}</text>-->
<!--					</view>-->
<!--					<view class="data-row">-->
<!--						<text class="label">设备名称</text>-->
<!--						<text class="value">{{ item.deviceName }}</text>-->
<!--					</view>-->
<!--					<view class="data-row">-->
<!--						<text class="label">开始时间</text>-->
<!--						<text class="value">{{ item.startTime }}</text>-->
<!--					</view>-->
<!--				</view>-->

<!--				&lt;!&ndash; 底部按钮区 &ndash;&gt;-->
<!--				<view class="card-footer">-->
<!--					<view class="btn btn-outline" @click="handleNoSend">不发送联动指令</view>-->
<!--					<view class="btn btn-primary" @click="handleSend">发送联动指令</view>-->
<!--				</view>-->
<!--			</uni-card>-->
			<text class="instruction">敬请期待</text>

		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	data() {
		return {

			lightControlList: [
				// {
				// 	ruleName: '自动夜灯联动规则',
				// 	deviceName: '客厅智能主灯',
				// 	startTime: '2026-08-13 18:00:00'
				// },
				// {
				// 	ruleName: '晨间唤醒模式',
				// 	deviceName: '卧室氛围灯',
				// 	startTime: '2026-08-14 06:30:00'
				// }
			]
		};
	},
	onLoad() {
		// 页面加载时获取光控联动数据
		this.getLightControlList();
	},
	methods: {
		getLightControlList(){
			// TODO: 获取光控联动数据
			console.log('获取光控联动数据');
		},
		handleNoSend() {
			// TODO: 处理不发送联动指令
			console.log('不发送联动指令');
		},
		handleSend() {
			// TODO: 处理发送联动指令
			console.log('发送联动指令');
		}
	}
}
</script>

<style lang="scss" scoped>
.light-control-container {
	background-color: var(--bg-page, #f5f7fa);
	min-height: 100vh;
	padding-top: 10rpx;
}

.list-wrapper {
	height: 100vh;
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;

	.instruction {
		font-size: 32rpx;
		color: var(--text-primary, #333333);
	}
}

/* 覆盖 uni-card 的默认内边距 */
.custom-card {
	::v-deep .uni-card__content {
		padding: 24rpx 30rpx 20rpx 30rpx !important;
	}
}

/* 主内容区 */
.card-body {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-bottom: 24rpx;

	.data-row {
		display: flex;
		justify-content: flex-start;
		align-items: center;

		.label {
			width: 140rpx;
			font-size: 30rpx;
			color: var(--text-tertiary, #888888);
			flex-shrink: 0;
		}

		.value {
			font-size: 30rpx;
			color: var(--text-primary, #333333);
			flex: 1;
		}
	}
}

/* 底部按钮区 */
.card-footer {
	display: flex;
	justify-content: flex-end;
	gap: 24rpx;
	border-top: 1px solid var(--border-color, #f0f0f0);
	padding-top: 20rpx;
}

/* 按钮公用样式 */
.btn {
	padding: 14rpx 32rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	white-space: nowrap;
	background-color: var(--bg-card, #ffffff);
}

/* 描边按钮 */
.btn-outline {
	border: 1px solid #3b82f6;
	color: #3b82f6;
	background-color: transparent;
}

/* 实色按钮 */
.btn-primary {
	border: 1px solid #3b82f6;
	color: #ffffff;
	background-color: #3b82f6;
}

/* 点击态 */
.btn:active {
	opacity: 0.8;
}
</style>
