<template>
	<view :class="themeClass" class="smart-control-container">
		<!-- 一键开关灯 -->
		<view class="section-block">
			<view class="section-title">
				一键开关灯
			</view>
			<view class="control-grid">
				<view
					v-for="(item, index) in controlButtons"
					:key="index"
					class="control-btn"
				>
					{{ item }}
				</view>
			</view>
		</view>

		<!-- 光照度看板 -->
		<view class="section-block">
			<view class="section-title">
				光照度看板
			</view>
			<view class="sensor-grid">
				<view
					v-for="(item, index) in sensorData"
					:key="index"
					class="sensor-card"
				>
					<!-- 设备ID/名称 -->
					<view class="card-header">{{ item.id }}</view>

					<!-- 数值行 -->
					<view class="card-value-row">
						<view class="value-left">
							<text class="label">数值</text>
							<text class="value">{{ item.value }}</text>
							<text class="unit">lux</text>
						</view>
						<text class="out-label">外</text>
					</view>

					<!-- 温湿度行 -->
					<view class="card-env-row">
						<text class="env-item">温度 {{ item.temp }} ℃</text>
						<text class="env-item">湿度 {{ item.humidity }} %</text>
					</view>

					<!-- 时间戳 -->
					<view class="card-footer">{{ item.time }}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'SmartControl',
	data() {
		return {
			// 一键开关灯按钮数据
			controlButtons: [
				'人行路灯2组', '光照度测试', '光照度测试分组1114',
				'景观一期', '测试', '测试2',
				'测试分组三', '测试分组二', '路灯3',
				'路灯3组', '龙岗景观灯'
			],
			// 光照度看板卡片数据
			sensorData: [
				{
					id: '00020250519',
					value: '35',
					temp: '0',
					humidity: '0',
					time: '2026-01-04 15:24:35'
				},
				{
					id: '00050005',
					value: '265',
					temp: '0',
					humidity: '0',
					time: '2024-10-12 14:37:20'
				},
				{
					id: '898604A81024D0244765',
					value: '301',
					temp: '0',
					humidity: '0',
					time: '2025-09-01 16:09:36'
				},
				{
					id: '89860868102590279430',
					value: '1274',
					temp: '0',
					humidity: '0',
					time: '2026-09-22 10:56:36'
				},
				{
					id: '89860868102590279460',
					value: '286',
					temp: '0',
					humidity: '0',
					time: ''
				},
				{
					id: '89860868102590279469',
					value: '0',
					temp: '0',
					humidity: '0',
					time: ''
				}
			]
		};
	}
}
</script>

<style lang="scss" scoped>
.smart-control-container {
	display: flex;
	flex-direction: column;
	width: 100%;

	.section-block {
		background-color: var(--bg-card, #FFFFFF);
		border-radius: 16rpx;
		padding: 30rpx 24rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.03));

		&:last-child {
			margin-bottom: 0;
		}
	}

	.section-title {
		display: flex;
		align-items: center;
		font-size: 32rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
		margin-bottom: 24rpx;
		padding-left: 8rpx;
	}

	/* 一键开关灯网格布局 */
	.control-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20rpx;
	}

	.control-btn {
		background-color: var(--bg-soft, #F4F7FC);
		color: var(--text-primary, #333333);
		font-size: 26rpx;
		padding: 24rpx 10rpx;
		text-align: center;
		border-radius: 8rpx;
		transition: all 0.2s;
		line-height: 1.4;

		&:active {
			background-color: var(--bg-accent, #E0E8F5);
		}
	}

	/* 光照度看板网格布局 */
	.sensor-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}

	.sensor-card {
		background-color: var(--bg-card, #FFFFFF);
		border: 1rpx solid var(--border-color, #EEEEEE);
		border-radius: 12rpx;
		padding: 24rpx 20rpx;
		display: flex;
		flex-direction: column;
		gap: 16rpx;

		.card-header {
			text-align: center;
			font-size: 26rpx;
			color: var(--text-primary, #333333);
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 1.2;
		}

		.card-value-row {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			margin-top: 4rpx;

			.value-left {
				display: flex;
				align-items: baseline;
				gap: 8rpx;

				.label {
					font-size: 24rpx;
					color: var(--text-secondary, #666666);
				}

				.value {
					font-size: 28rpx;
					color: var(--text-primary, #333333);
					font-weight: bold;
				}

				.unit {
					font-size: 24rpx;
					color: var(--color-primary, #3880FC);
					font-weight: 500;
				}
			}

			.out-label {
				font-size: 24rpx;
				font-weight: bolder;
				color: #3880FC;
			}
		}

		.card-env-row {
			display: flex;
			justify-content: space-between;
			font-size: 24rpx;
			color: var(--text-secondary, #666666);
			margin-top: 4rpx;

			.env-item {
				flex: 1;
				&:last-child {
					text-align: right;
				}
			}
		}

		.card-footer {
			font-size: 24rpx;
			color: var(--text-quaternary, #999999);
			margin-top: 8rpx;
			text-align: center;
		}
	}
}
</style>
