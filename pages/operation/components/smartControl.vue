<template>
	<view :class="themeClass" class="smart-control-container">
		<!-- 一键开关灯 -->
		<view class="section-block">
			<view class="section-title">
				<view class="section-icon">
					<uni-icons :color="sectionIconColor" size="24" type="checkbox" />
				</view>
				一键开关灯
			</view>
			<view v-if="lightOnOffList.length > 0" class="control-grid">
				<view
					v-for="(item, index) in lightOnOffList"
					:key="item.id"
					class="control-btn"
					@click.stop="goToLightOnOffDetail(item)"
				>
					{{ item.name }}
				</view>
			</view>
			<view v-else class="empty-state">
				<view class="empty-icon">
					<uni-icons :color="emptyIconColor" size="24" type="list" />
				</view>
				<text class="empty-text">暂无数据</text>
			</view>
		</view>

		<!-- 光照度看板 -->
		<view class="section-block">
			<view class="section-title">
				<view class="section-icon">
					<uni-icons :color="sectionIconColor" size="24" type="map" />
				</view>
				光照度看板
			</view>
			<view v-if="illuminanceList.length > 0" class="sensor-grid">
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
			<view v-else class="empty-state">
				<view class="empty-icon">
					<uni-icons :color="emptyIconColor" size="22" type="eye" />
				</view>
				<text class="empty-text">暂无数据</text>
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
	computed: {
		// 空状态图标颜色
		emptyIconColor() {
			return this.isDarkMode ? '#5a97ff' : '#5b8def';
		},
		// 分区标题图标颜色
		sectionIconColor() {
			return this.isDarkMode ? '#8dc0ff' : '#3377F5';
		}
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
	/* 智能控制局部主题变量：白天模式 */
	--sc-card-bg: #FFFFFF;
	--sc-card-border: rgba(56, 128, 252, 0.10);
	--sc-card-shadow: 0 12rpx 36rpx rgba(36, 78, 158, 0.07);
	--sc-card-gradient: linear-gradient(180deg, rgba(56, 128, 252, 0.035) 0%, rgba(56, 128, 252, 0) 180rpx);
	--sc-head-bg: linear-gradient(90deg, rgba(56, 128, 252, 0.10) 0%, rgba(56, 128, 252, 0.03) 55%, rgba(56, 128, 252, 0) 100%);
	--sc-head-border: rgba(56, 128, 252, 0.10);
	--sc-tile-bg: linear-gradient(145deg, #F6FAFF 0%, #EAF2FF 100%);
	--sc-tile-bg-active: linear-gradient(145deg, #EAF2FF 0%, #D8E7FF 100%);
	--sc-tile-border: rgba(56, 128, 252, 0.16);
	--sc-tile-text: #2A5DAE;
	--sc-tile-shadow: 0 6rpx 16rpx rgba(56, 128, 252, 0.08);
	--sc-tile-inset: inset 0 1rpx 0 rgba(255, 255, 255, 0.95);
	--sc-tile-highlight: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
	--sc-value: #1958BD;
	--sc-label: #7386A3;
	--sc-out-text: #2F6BDB;
	--sc-chip-bg: rgba(56, 128, 252, 0.08);
	--sc-chip-border: rgba(56, 128, 252, 0.14);
	--sc-env-bg: #F4F7FC;
	--sc-env-text: #5A6B85;
	--sc-footer-border: #EDF1F8;
	--sc-empty-bg: rgba(56, 128, 252, 0.035);
	--sc-empty-border: rgba(56, 128, 252, 0.14);
	--sc-empty-icon-bg: rgba(56, 128, 252, 0.10);

	display: flex;
	flex-direction: column;
	width: 100%;

	/* 夜间模式：同一套结构，仅替换局部变量 */
	&.theme-dark {
		--sc-card-bg: #1C2130;
		--sc-card-border: rgba(90, 151, 255, 0.14);
		--sc-card-shadow: 0 16rpx 36rpx rgba(0, 0, 0, 0.28);
		--sc-card-gradient: linear-gradient(180deg, rgba(90, 151, 255, 0.06) 0%, rgba(90, 151, 255, 0) 180rpx);
		--sc-head-bg: linear-gradient(90deg, rgba(90, 151, 255, 0.14) 0%, rgba(90, 151, 255, 0.04) 55%, rgba(90, 151, 255, 0) 100%);
		--sc-head-border: rgba(90, 151, 255, 0.14);
		--sc-tile-bg: linear-gradient(145deg, #232C42 0%, #1E2638 100%);
		--sc-tile-bg-active: linear-gradient(145deg, #2A3550 0%, #232C42 100%);
		--sc-tile-border: rgba(90, 151, 255, 0.20);
		--sc-tile-text: #B7D2FF;
		--sc-tile-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.18);
		--sc-tile-inset: inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
		--sc-tile-highlight: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0));
		--sc-value: #A9CCFF;
		--sc-label: #8B94A8;
		--sc-out-text: #8DBBFF;
		--sc-chip-bg: rgba(90, 151, 255, 0.14);
		--sc-chip-border: rgba(90, 151, 255, 0.20);
		--sc-env-bg: #232A3B;
		--sc-env-text: #AAB3C6;
		--sc-footer-border: #2C3447;
		--sc-empty-bg: rgba(90, 151, 255, 0.05);
		--sc-empty-border: rgba(90, 151, 255, 0.18);
		--sc-empty-icon-bg: rgba(90, 151, 255, 0.14);
	}

	.section-block {
		position: relative;
		background-color: var(--sc-card-bg, #FFFFFF);
		background-image: var(--sc-card-gradient);
		border: 1rpx solid var(--sc-card-border);
		border-radius: 24rpx;
		padding: 0 24rpx 28rpx;
		margin-bottom: 24rpx;
		box-shadow: var(--sc-card-shadow);
		overflow: hidden;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.section-title {
		display: flex;
		align-items: center;
		margin: 0 -24rpx 24rpx;
		padding: 26rpx 24rpx 22rpx;
		font-size: 31rpx;
		font-weight: 700;
		letter-spacing: 1rpx;
		line-height: 1.25;
		color: var(--text-primary, #26334D);
		background-image: var(--sc-head-bg);
		border-bottom: 1rpx solid var(--sc-head-border);

		.section-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			line-height: 1;
			margin-right: 12rpx;
		}

		&::after {
			content: '';
			flex: 1;
			height: 1rpx;
			margin-left: 18rpx;
			background-image: linear-gradient(90deg, var(--sc-head-border), rgba(56, 128, 252, 0));
		}
	}

	/* 空数据占位 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 220rpx;
		padding: 36rpx 24rpx;
		border: 1rpx dashed var(--sc-empty-border);
		border-radius: 18rpx;
		background-color: var(--sc-empty-bg);
		box-sizing: border-box;

		.empty-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 84rpx;
			height: 84rpx;
			margin-bottom: 18rpx;
			border-radius: 50%;
			background-color: var(--sc-empty-icon-bg);
			box-shadow: inset 0 0 0 1rpx var(--sc-empty-border);
		}

		.empty-text {
			font-size: 27rpx;
			line-height: 1.3;
			letter-spacing: 1rpx;
			color: var(--text-tertiary, #888888);
		}
	}

	/* 一键开关灯网格布局 */
	.control-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18rpx;
	}

	.control-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 104rpx;
		padding: 22rpx 12rpx;
		background-color: #F4F8FF;
		background-image: var(--sc-tile-bg);
		border: 1rpx solid var(--sc-tile-border);
		border-radius: 16rpx;
		box-shadow: var(--sc-tile-inset), var(--sc-tile-shadow);
		color: var(--sc-tile-text);
		font-size: 27rpx;
		font-weight: 600;
		line-height: 1.35;
		text-align: center;
		word-break: break-all;
		box-sizing: border-box;
		cursor: pointer;
		transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

		/* 顶部高光，仅作装饰 */
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 18rpx;
			right: 18rpx;
			height: 1rpx;
			background-image: var(--sc-tile-highlight);
		}

		&:active {
			background-image: var(--sc-tile-bg-active);
			box-shadow: inset 0 2rpx 6rpx rgba(37, 84, 170, 0.10);
			transform: scale(0.96);
		}
	}

	@media (hover: hover) {
		.control-btn:hover {
			border-color: rgba(56, 128, 252, 0.32);
			box-shadow: var(--sc-tile-inset), 0 10rpx 22rpx rgba(56, 128, 252, 0.16);
			transform: translateY(-2rpx);
		}
	}

	/* 光照度看板网格布局 */
	.sensor-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 18rpx;
	}

	.sensor-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 0 18rpx 18rpx;
		background-color: var(--sc-card-bg, #FFFFFF);
		background-image: var(--sc-card-gradient);
		border: 1rpx solid var(--sc-card-border);
		border-radius: 18rpx;
		box-shadow: var(--sc-card-shadow);
		overflow: hidden;
		cursor: pointer;
		transition: transform 0.18s ease, box-shadow 0.18s ease;

		&:active {
			transform: translateY(1rpx);
			box-shadow: 0 6rpx 18rpx rgba(36, 78, 158, 0.06);
		}

		/* 设备名称：作为卡片头部色带，不新增任何显示内容 */
		.card-header {
			margin: 0 -18rpx;
			padding: 18rpx 18rpx 16rpx;
			text-align: left;
			font-size: 26rpx;
			color: var(--text-primary, #333333);
			font-weight: 600;
			letter-spacing: 0.3rpx;
			line-height: 1.25;
			background-image: var(--sc-head-bg);
			border-bottom: 1rpx solid var(--sc-head-border);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.card-value-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 8rpx;
			margin-top: 18rpx;

			.value-left {
				display: flex;
				align-items: baseline;
				gap: 6rpx;
				min-width: 0;

				.label {
					font-size: 22rpx;
					color: var(--sc-label);
					letter-spacing: 0.5rpx;
				}

				.value {
					font-size: 38rpx;
					line-height: 1;
					color: var(--sc-value);
					font-weight: 700;
					font-variant-numeric: tabular-nums;
					letter-spacing: -0.5rpx;
				}

				.unit {
					font-size: 22rpx;
					color: var(--color-primary, #3880FC);
					font-weight: 600;
				}
			}

			.out-label {
				flex-shrink: 0;
				padding: 3rpx 10rpx;
				font-size: 21rpx;
				font-weight: 700;
				line-height: 1.4;
				color: var(--sc-out-text);
				background-color: var(--sc-chip-bg);
				border: 1rpx solid var(--sc-chip-border);
				border-radius: 8rpx;
			}
		}

		.card-env-row {
			display: flex;
			gap: 8rpx;
			margin-top: 14rpx;
			font-size: 22rpx;
			color: var(--sc-env-text);

			.env-item {
				flex: 1;
				min-width: 0;
				padding: 8rpx 6rpx;
				text-align: center;
				line-height: 1.3;
				background-color: var(--sc-env-bg);
				border-radius: 8rpx;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.card-footer {
			margin-top: 14rpx;
			padding-top: 12rpx;
			font-size: 22rpx;
			color: var(--text-quaternary, #999999);
			line-height: 1.4;
			text-align: center;
			letter-spacing: 0.2rpx;
			font-variant-numeric: tabular-nums;
			border-top: 1rpx dashed var(--sc-footer-border);
		}
	}
}
</style>
