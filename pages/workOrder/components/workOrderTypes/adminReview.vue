<template>
	<view class="page-wrapper">
		<!-- 工单列表 -->
		<view class="admin-review-list-container">
			<view v-for="(item, index) in adminReviewListData" :key="index" class="list-item">
				<!-- 日期时间分隔符 -->
				<view class="time-tag">
					<image class="icon-clock-img" mode="aspectFit" src="/static/common/clock.png"></image>
					{{ item.time }}
				</view>

				<!-- 卡片内容 -->
				<view class="card">
					<!-- 左侧图标 -->
					<view class="card-left">
						<image class="card-icon" mode="aspectFit" src="/static/workOrder/pending.png"></image>
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
	</view>
</template>

<script>
export default {
	data() {
		return {
			adminReviewListData: [
				{
					time: '2023-04-01 10:00:00',
					id: '001',
					index: '1',
					station: '站点A',
					attr: '属性1',
					content: '这是一条测试工单',
					status: '处理中',
					overdue: '0天'
				},
			]
		};
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
/* 列表容器 */
.admin-review-list-container {
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
