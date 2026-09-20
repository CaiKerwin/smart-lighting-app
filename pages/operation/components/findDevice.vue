<template>
	<view :class="themeClass" class="page-container">
		<!-- 头部搜索区域 -->
		<view class="header-section">
			<input
				v-model="deviceId"
				class="search-input"
				placeholder="输入设备ID"
				placeholder-class="input-placeholder"
				type="text"
				@confirm="validateAndSearchDevice"
			/>
			<view class="search-btn" @click="validateAndSearchDevice">查找设备</view>
		</view>

		<!-- 红色提示文字 -->
		<view class="warning-text">
			设备ID长度8位,由大写字母和数字组成。
		</view>

		<!-- 中部表单展示区域 -->
		<view class="info-list">
			<view class="info-item">
				<text class="label">设备ID</text>
				<view class="value-box">{{ deviceId }}</view>
				<view class="icon-box"></view>
			</view>
			<view class="info-item">
				<text class="label">所在应用</text>
				<view class="value-box">{{ appName }}</view>
				<view class="icon-box"></view>
			</view>
			<view class="info-item">
				<text class="label">所在客户</text>
				<view class="value-box">{{ customerName }}</view>
				<view class="icon-box"></view>
			</view>
			<view class="info-item">
				<text class="label">所属分组</text>
				<view class="value-box">{{ groupName }}</view>
				<view class="icon-box"></view>
			</view>
			<view class="info-item">
				<text class="label">所属站点</text>
				<view class="value-box">{{ stationName }}</view>
				<view class="icon-box">
					<image
						class="locate-icon"
						mode="aspectFit"
						src="/static/common/map/locate.png"
						@click="locateDevice"
					/>
				</view>
			</view>
			<view class="info-item">
				<text class="label">上级设备</text>
				<view class="value-box">{{ parentDeviceName }}</view>
				<view class="icon-box"></view>
			</view>
			<view class="info-item">
				<text class="label">设备名称</text>
				<view class="value-box">{{ deviceName }}</view>
				<view class="icon-box"></view>
			</view>
		</view>

		<!-- 底部按钮区域 -->
		<view class="bottom-actions">
			<view class="action-btn" @click="scanToFindDevice">扫一扫</view>
			<view class="action-btn" @click="manageEmptyPole">空灯杆管理</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	data() {
		return {
			deviceId: '',
			appName: '',
			customerName: '',
			groupName: '',
			stationName: '',
			parentDeviceName: '',
			deviceName: '',
			stationId: 0 // 0表示所有站点
		};
	},
	methods: {
		// 校验设备ID并触发查找
		validateAndSearchDevice() {
			// 校验规则：8位，由大写字母和数字组成
			const reg = /^[A-Z0-9]{8}$/;
			if (!reg.test(this.deviceId)) {
				uni.showToast({
					title: '设备ID长度8位,由大写字母和数字组成',
					icon: 'none'
				});
				return;
			}
			/**
			 * {
			 *   "deviceName": "公司老化",
			 *   "deviceType": 176,
			 *   "bigType": 3,
			 *   "topName": "公司老化",
			 *   "stationName": "罗印测试单灯",
			 *   "stationId": 376,
			 *   "custName": "亚美达现代城市照明",
			 *   "appTypeName": "城市照明",
			 *   "groupName": "内部测试",
			 *   "appType": "road",
			 *   "custId": 4,
			 *   "canSwitch": true
			 * }
			 */
			request({
				url: '/station/search/QueryDeviceAppAndCust',
				method: 'POST',
				data: {
					code: this.deviceId
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const data = JSON.parse(base64Decode(payload.data))
					this.appName = data.appTypeName;
					this.customerName = data.custName;
					this.groupName = data.groupName;
					this.stationName = data.stationName;
					this.parentDeviceName = data.topName;
					this.deviceName = data.deviceName;
					this.stationId = data.stationId; // 用于定位功能
				}
			}).catch(err =>{
				console.log('查找设备失败', err.message);
			})
		},
		// 定位
		locateDevice() {
			// 检验
			if (!this.stationId) {
				uni.showToast({
					title: '设备信息获取失败，请重新查找设备',
					icon: 'none'
				});
				return;
			}
			uni.navigateTo({
				url: `/pages/operation/components/stationTypes/stationTwo?groupId=0&stationId=${this.stationId}&boxName=${encodeURIComponent(this.stationName)}`
			})
		},
		// 扫一扫
		scanToFindDevice() {
			// #ifdef H5
			uni.showToast({
				title: '暂不支持扫码',
				icon: 'none'
			});
			// #endif
			// #ifndef H5
			uni.scanCode({
				onlyFromCamera: false,
				scanType: ['qrCode'],
				success: (res) => {
					const originalValue = (res && res.result) || '';
					if (!originalValue) {
						uni.showToast({ title: '扫码结果为空', icon: 'none' });
						return;
					}
					this.deviceId = originalValue;
					this.validateAndSearchDevice();
				},
				fail: (err) => {
					// 用户主动取消扫码时不提示
					const msg = (err && err.errMsg) || '';
					if (!msg.includes('cancel')) {
						uni.showToast({ title: '扫码失败', icon: 'none' });
					}
				}
			})
			// #endif
		},
		// 空灯杆管理
		manageEmptyPole() {
			uni.navigateTo({
				url: '/pages/operation/components/deviceManagement/manageEmptyPole'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	/* 主题页面背景，夜间自动变深 */
	background-color: var(--bg-page);
	padding: 30rpx;
	box-sizing: border-box;
	/* 切换主题时平滑过渡 */
	transition: background-color 0.3s ease;
}

/* 头部搜索区域 */
.header-section {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

/* 原生输入框，直接使用全局主题变量 */
.search-input {
	flex: 1;
	height: 80rpx;
	background-color: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: 8rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: var(--text-primary);
	box-sizing: border-box;
	transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* 占位符样式适配主题 */
.input-placeholder {
	color: var(--text-quaternary);
}

.search-btn {
	width: 180rpx;
	height: 80rpx;
	background-color: var(--color-primary);
	color: #ffffff;
	font-size: 28rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 8rpx;
	margin-left: 20rpx;
	transition: background-color 0.3s ease;
}

/* 红色警告文字 */
.warning-text {
	color: #ef4444;
	font-size: 28rpx;
	margin-bottom: 30rpx;
	padding-left: 10rpx;
}

/* 中部信息列表 */
.info-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.info-item {
	display: flex;
	align-items: center;
}

.label {
	width: 120rpx;
	text-align: right;
	font-size: 28rpx;
	color: var(--text-secondary);
	margin-right: 16rpx;
}

.value-box {
	flex: 1;
	color: var(--text-primary);
	height: 60rpx;
	padding: 0 10rpx;
	margin: 0;
	background-color: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: 8rpx;
	transition: background-color 0.3s ease, border-color 0.3s ease;
}

.icon-box {
	width: 50rpx;
	height: 80rpx;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	margin-left: 10rpx;
}

.locate-icon {
	width: 40rpx;
	height: 40rpx;
}

/* 底部按钮区域 */
.bottom-actions {
	display: flex;
	justify-content: space-between;
	margin-top: 80rpx;
}

.action-btn {
	width: 48%;
	height: 88rpx;
	background-color: var(--color-primary);
	color: #ffffff;
	font-size: 30rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 12rpx;
	transition: background-color 0.3s ease;
}
</style>
