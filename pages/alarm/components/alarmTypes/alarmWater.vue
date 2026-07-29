<template>
	<view class="alarm-water-container">
		<!-- 顶部标签栏 -->
		<AlarmCenter :initialTab="tab" @change="onTabChange" />

		<!-- 卡片区域 -->
		<view class="card-wrapper">
			<!-- ==================== 普通模式 ==================== -->
			<view v-if="!isTimeMode" class="alarm-card">
				<!-- 时间快捷选项 -->
				<view class="card-header">
					<view
						class="bubble"
						v-for="item in tabList"
						:key="item.value"
						:class="{ active: activeTab === item.value }"
						@click="onTabClick(item)"
					>
						{{ item.label }}
					</view>
				</view>

				<!-- 筛选行 -->
				<view class="filter-row">
					<!-- 名称输入框 -->
					<view class="filter-item">
						<text class="label">名称</text>
						<input
							class="input-field"
							type="text"
							placeholder="输入"
							placeholder-class="input-placeholder"
							v-model="propertyValue"
						/>
					</view>

					<!-- 类型选择 -->
					<view class="filter-item filter-select" @click="openPopup('type')">
						<text class="label">类型</text>
						<text class="value">{{ selectedType }}</text>
						<!-- 改为右箭头 -->
						<uni-icons type="right" size="14" color="#999999" />
					</view>
				</view>

				<view class="query-btn" @click="queryPowerboxAlarm">查询</view>
			</view>

			<!-- ==================== 时间模式 ==================== -->
			<view v-else class="alarm-card time-card">
				<view class="time-header">
					<text class="time-label" @click="backToNormalMode">范围</text>

					<!-- 开始时间 picker -->
					<uni-datetime-picker
						type="datetime"
						v-model="startDate"
						return-type="string"
						:border="false"
						class="time-picker-wrap"
						placeholder="选择开始时间"
						format="yyyy-MM-dd HH:mm:ss"
					/>


					<text class="time-to" @click="backToNormalMode">至</text>

					<!-- 结束时间 picker -->
					<uni-datetime-picker
						type="datetime"
						v-model="endDate"
						return-type="string"
						:border="false"
						class="time-picker-wrap"
						placeholder="选择结束时间"
						format="yyyy-MM-dd HH:mm:ss"
					/>

				</view>

				<!-- 筛选行 -->
				<view class="filter-row">
					<!-- 名称输入框 -->
					<view class="filter-item">
						<text class="label">名称</text>
						<input
							class="input-field"
							type="text"
							placeholder="输入"
							placeholder-class="input-placeholder"
							v-model="propertyValue"
						/>
					</view>

					<!-- 类型选择 -->
					<view class="filter-item filter-select" @click="openPopup('type')">
						<text class="label">类型</text>
						<text class="value">{{ selectedType }}</text>
						<!-- 右箭头 -->
						<uni-icons type="right" size="14" color="#999999" />
					</view>
				</view>

				<view class="query-btn" @click="queryWaterAlarm">查询</view>
			</view>
		</view>

		<!-- ==================== 底部弹窗 ==================== -->
		<uni-popup ref="popup" type="bottom" :safe-area="false">
			<view class="popup-content">
				<view class="popup-header">
					<text class="popup-title">{{ popupTitle }}</text>
					<view class="popup-close" @click="closePopup">
						<uni-icons type="close" size="20" color="#999999" />
					</view>
				</view>
				<scroll-view scroll-y class="popup-list">
					<view
						class="popup-item"
						v-for="(item, index) in popupOptions"
						:key="index"
						:class="{ active: popupSelected === item }"
						@click="onPopupItemClick(item)"
					>
						<text class="item-text">{{ item }}</text>
						<uni-icons
							v-if="popupSelected === item"
							type="check"
							size="18"
							color="#3A7BF7"
						/>
					</view>
				</scroll-view>
			</view>
		</uni-popup>

	</view>
</template>

<script>
import AlarmCenter from "@/pages/alarm/components/alarmCenter.vue";
export default {
	components: {
		AlarmCenter
	},
	data() {
		return {
			tab: '水浸报警',
			tabMap: {
				'配电箱报警': '/pages/alarm/components/alarmTypes/alarmPowerbox',
				'单灯报警': '/pages/alarm/components/alarmTypes/alarmLight',
				'离线报警': '/pages/alarm/components/alarmTypes/alarmOffline',
				'线路供电异常报警': '/pages/alarm/components/alarmTypes/alarmException',
				'线路供电异常报警记录': '/pages/alarm/components/alarmTypes/alarmExceptionRecord',
				'水浸报警': '/pages/alarm/components/alarmTypes/alarmWater',
				'人工报障': '/pages/alarm/components/alarmTypes/alarmWorker'
			},
			tabList: [
				{ label: '24小时内', value: '24小时内' },
				{ label: '48小时内', value: '48小时内' },
				{ label: '长期', value: '长期' },
				{ label: '选择时间', value: '选择时间' }
			],
			activeTab: '24小时内',
			isTimeMode: false,
			propertyValue: '',

			// 类型选择框内容
			typeOptions: [
				'全部', '一级报警', '二级报警', '三级报警'
			],
			selectedType: '全部',

			// 时间选择器
			startDate: '',
			endDate: '',

			// 弹窗
			popupType: 'type',
			popupTitle: '选择报警类型',
			popupOptions: [],
			popupSelected: '全部'
		};
	},
	computed: {

	},
	onLoad(options) {
		// 设置顶部标签
		if (options.tab) {
			this.tab = decodeURIComponent(options.tab);
		}
		// 高亮对应快捷选项并查询
		if (options.timeType) {
			const timeType = decodeURIComponent(options.timeType);
			this.activeTab = timeType;
			this.quickQuery(timeType);
		}
	},
	methods: {
		onTabChange(tabName) {
			const url = this.tabMap[tabName];
			if (url) {
				uni.navigateTo({ url });
			} else {
				console.warn('未知标签:', tabName);
				uni.showToast({ title: '未知标签', icon: 'none' });
			}
		},
		onTabClick(item) {
			if (item.value === '选择时间') {
				this.isTimeMode = !this.isTimeMode;
				return;
			}
			this.activeTab = item.value;
			this.quickQuery(item.value);
		},
		backToNormalMode() {
			this.isTimeMode = false;
		},
		quickQuery(type) {
			const now = new Date();
			let start = new Date();
			if (type === '24小时内') {
				start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			} else if (type === '48小时内') {
				start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
			} else if (type === '长期') {
				start = new Date('2020-01-01 00:00:00');
			} else {
				return;
			}
			this.startDate = this.formatDate(start);
			this.endDate = this.formatDate(now);
			// 调用查询（显示 Toast，并退出时间模式）
			this.queryWaterAlarm();
		},
		openPopup(type) {
			this.popupType = type;
			this.popupTitle = '选择报警类型';
			this.popupOptions = this.typeOptions;
			this.popupSelected = this.selectedType;

			this.$refs.popup.open();
		},
		closePopup() {
			this.$refs.popup.close();
		},
		onPopupItemClick(item) {
			this.popupSelected = item;
			this.selectedType = item;
			this.closePopup();
		},
		queryWaterAlarm() {
			uni.showToast({
				title: `查询 ${this.startDate} 至 ${this.endDate}`,
				icon: 'none',
				duration: 2000
			});
			this.isTimeMode = false;
		},
		formatDate(date) {
			if (!date) return '';
			const d = new Date(date);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			const hours = String(d.getHours()).padStart(2, '0');
			const minutes = String(d.getMinutes()).padStart(2, '0');
			const seconds = String(d.getSeconds()).padStart(2, '0');
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
		}
	}
}
</script>

<style lang="scss" scoped>
.alarm-water-container{
	width: 100%;
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

.card-wrapper {
	padding: 0 20rpx;
	margin: 20rpx 40rpx 20rpx 0; /* 上 右 下 左 */
	flex: 1;
}

.alarm-card {
	width: 100%;
	min-height: 300rpx;
	background-color: #ffffff;
	border-radius: 20rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

/* ===== 卡片头部  ===== */
.card-header {
	display: flex;
	flex-wrap: nowrap;
	gap: 12rpx;
	margin-bottom: 28rpx;
	overflow-x: auto;
	padding-bottom: 4rpx;
	&::-webkit-scrollbar {
		display: none;
	}
}

.bubble {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	padding: 10rpx 24rpx;
	border-radius: 16rpx;
	background-color: #f2f4f8;
	color: #666666;
	font-size: 24rpx;
	line-height: 1.4;
	white-space: nowrap;
	transition: all 0.25s ease;
	cursor: pointer;

	&.active {
		background-color: #3a7bf7;
		color: #ffffff;
		box-shadow: 0 2rpx 8rpx rgba(58, 123, 247, 0.25);
	}
}

/* ===== 筛选行 ===== */
.filter-row {
	display: flex;
	flex-direction: column; /* 垂直排列 */
	gap: 20rpx; /* 上下间距 */
}

/* 每个筛选项样式 */
.filter-item {
	width: 100%;
	height: 80rpx; /* 增加高度，与图片一致 */
	display: flex;
	align-items: center;
	background-color: #f5f7fa;
	border-radius: 12rpx; /* 圆角变大 */
	padding: 0 24rpx;
	box-sizing: border-box;
	position: relative;

	.label {
		font-size: 28rpx;
		color: #666666;
		width: 80rpx;
		flex-shrink: 0;
		margin-right: 16rpx;
	}
}

/* 属性输入框 */
.filter-item .input-field {
	flex: 1;
	height: 100%;
	font-size: 28rpx;
	color: #333333;
	background: transparent;
	border: none;
	outline: none;
}

.filter-item .input-placeholder {
	color: #999999;
	font-size: 28rpx;
}

/* 级别 / 类型 选择器 */
.filter-select {
	display: flex;
	align-items: center;
	justify-content: flex-start; /* 内容左对齐 */
	cursor: pointer;

	.value {
		flex: 1;
		font-size: 28rpx;
		color: #333333;
		margin-right: auto; /* 挤占中间空间 */
	}

	/* 把右箭头推到最右侧 */
	.uni-icons {
		flex-shrink: 0;
		margin-left: auto;
	}
}

/* ===== 时间模式 ===== */
.time-card {
	padding: 28rpx 20rpx 32rpx 20rpx;
}

.time-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 32rpx;
	flex-wrap: wrap;

	.time-label {
		font-size: 26rpx;
		color: #666666;
		flex-shrink: 0;
	}
	.time-to {
		font-size: 24rpx;
		color: #999999;
		flex-shrink: 0;
	}
}

.time-picker-wrap {
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

.query-btn {
	width: 100%;
	height: 80rpx;
	margin: 20rpx 0;
	background: linear-gradient(135deg, #3a7bf7 0%, #2b6ae0 100%);
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 500;
	color: #ffffff;
	cursor: pointer;
	transition: opacity 0.2s ease;
	&:active {
		opacity: 0.8;
	}
}

/* ===== 底部弹窗 ===== */
.popup-content {
	background-color: #ffffff;
	border-radius: 32rpx 32rpx 0 0;
	padding: 32rpx 0 40rpx 0;
	max-height: 70vh;
}
.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 32rpx 24rpx 32rpx;
	border-bottom: 2rpx solid #f0f0f0;
	.popup-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #1a1a1a;
	}
	.popup-close {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: 50%;
		&:active {
			background-color: #f5f5f5;
		}
	}
}
.popup-list {
	max-height: 50vh;
	padding: 12rpx 0 20rpx 0;
}
.popup-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 32rpx;
	cursor: pointer;
	&:active {
		background-color: #f5f8ff;
	}
	.item-text {
		font-size: 28rpx;
		color: #333333;
	}
	&.active .item-text {
		color: #3a7bf7;
		font-weight: 500;
	}
}
</style>
