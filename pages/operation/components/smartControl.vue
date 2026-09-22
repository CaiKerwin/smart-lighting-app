<template>
	<view :class="themeClass" class="smart-control-container">
		<!-- 一键开关灯 -->
		<view class="section-block">
			<view class="section-title">
				一键开关灯
			</view>
			<view class="control-grid">
				<view
					v-for="(item, index) in lightOnOffList"
					:key="item.id"
					class="control-btn"
					@click.stop="goToLightOnOffDetail(item)"
				>
					{{ item.name }}
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
					v-for="(item, index) in illuminanceList"
					:key="item.id"
					class="sensor-card"
					@click.stop="goToIlluminanceDetail(item)"
				>
					<!-- 设备ID/名称 -->
					<view class="card-header">{{ item.name }}</view>

					<!-- 数值 -->
					<view class="card-value-row">
						<view class="value-left">
							<text class="label">数值</text>
							<text class="value">{{ item.value }}</text>
							<text class="unit">lux</text>
						</view>
						<text class="out-label">{{ item.label }}</text>
					</view>

					<!-- 温/湿度 -->
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
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	name: 'SmartControl',
	data() {
		return {
			// 一键开关灯分组列表
			lightOnOffList: [],
			// 光照度看板分组列表
			illuminanceList: []
		};
	},
	created() {
		// 页面创建时
		this.getLightOnOffGroupList();
		this.getIlluminanceList();
	},
	methods: {
		// 获取一键开关灯分组列表
		getLightOnOffGroupList() {
			/**
			 * [
			 *   {
			 *     "id": "5bbd79f742864fed80a04a87e6097fa9",
			 *     "name": "人行路灯2组"
			 *   }
			 * ]
			 */
			request({
				url: '/station/lux/QueryOutputGroup',
				method: 'POST',
				data: {}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res.data
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data))
					this.lightOnOffList = data.map(item =>({
						id: item.id,
						name: item.name
					}))
				}
			}).catch(err =>{
				uni.showToast({title: '获取一键开关灯分组列表失败', icon: 'none'})
				console.error('获取一键开关灯分组列表失败', err.message);
			});
		},
		// 获取光照度看板数据
		getIlluminanceList() {
			/**
			 * [
			 *   {
			 *     "id": "6762a5176fe3484a8f232ee48daac7bd",
			 *     "ruleId": 1,
			 *     "ruleName": "默认规则",
			 *     "name": "00020250519",
			 *     "transType": 239,
			 *     "transTypeName": "AMDM-DMS-7210(11位)",
			 *     "code": "00020250519",
			 *     "smallType": 252,
			 *     "smallTypeName": "D302",
			 *     "transChannel": 0,
			 *     "address": 1,
			 *     "buildDate": "2026-01-04 00:00:00",
			 *     "location": "",
			 *     "fireTime": "2026-01-04 15:24:35",
			 *     "luxValue": 35,
			 *     "temperature": 0,
			 *     "humidity": 0,
			 *     "isOuter": true
			 *   }
			 * ]
			 */
			request({
				url: '/device/lux/QueryState',
				method: 'POST',
				data: {}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res.data
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data))
					this.illuminanceList = data.map(item =>({
						id: item.id,
						name: item.name,
						value: item.luxValue,
						label: item.isOuter ? '外' : '内',
						temp: item.temperature,
						humidity: item.humidity,
						time: item.fireTime
					}))
				}
			}).catch(err =>{
				uni.showToast({title: '获取光照度看板数据失败', icon: 'none'})
				console.error('获取光照度看板数据失败',err.message)
			});
		},
		goToLightOnOffDetail(item){
			uni.navigateTo({
				url: `/pages/operation/components/smartControl/lightOnOffDetail?id=${item.id}&name=${encodeURIComponent(item.name)}`
			})
		},
		goToIlluminanceDetail(item){
			uni.navigateTo({
				url: `/pages/operation/components/smartControl/illuminanceDetail?id=${item.id}&name=${encodeURIComponent(item.name)}`
			})
		}
	},
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
