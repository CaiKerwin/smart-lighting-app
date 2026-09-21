<!--
	说明：本组件由「状态操作」与「GIS 地图」两个分包共用，必须放在主包 components 下。
	     小程序分包之间不能互相引用组件，一旦放回某个分包，另一个分包的页面会报Component is not found in path
-->
<template>
	<view v-if="visible" class="popup-mask">
		<view class="popup-container">
			<!-- 头部：灯杆名称 / 控制器数量 -->
			<view class="popup-header">
				<view class="header-info">
					<view class="header-row">
						<text class="header-label">灯杆名称</text>
						<text class="header-value">{{ poleName || '-' }}</text>
					</view>
					<view class="header-row">
						<text class="header-label">控制器数量</text>
						<text class="header-value">{{ lights.length }}</text>
					</view>
				</view>
				<uni-icons :color="iconColor" class="close-icon" size="24" type="closeempty" @click="$emit('close')" />
			</view>

			<!-- 单灯切换标签：多个单灯时蓝色标签切换 -->
			<scroll-view v-if="lights.length" class="light-tabs" scroll-x>
				<view :class="['light-tabs-inner', tabsAlignClass]">
					<view
						v-for="(item, index) in lights"
						:key="index"
						:class="['light-tab', { 'light-tab-active': index === activeIndex }]"
						@click="activeIndex = index"
					>
						{{ item.name || ('单灯' + (index + 1)) }}
					</view>
				</view>
			</scroll-view>

			<!-- 滚动内容区：当前单灯的详细信息（无单灯信息时中部为空） -->
			<scroll-view class="popup-body" scroll-y>
				<view v-if="activeLight" class="detail-grid">
					<!-- 名称 / ID -->
					<view class="detail-item">
						<text class="detail-label">名称</text>
						<view class="detail-value">{{ activeLight.name || '-' }}</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">ID</text>
						<view class="detail-value">{{ activeLight.id || '-' }}</view>
					</view>

					<!-- 通道 / 在线 -->
					<view class="detail-item">
						<text class="detail-label">通道</text>
						<view class="detail-value">{{ activeLight.channelName || '-' }}</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">在线</text>
						<view class="detail-value">{{ activeLight.onlineText || '-' }}</view>
					</view>

					<!-- 电压 / 电流 -->
					<view class="detail-item">
						<text class="detail-label">电压</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.voltage || '-' }}</text>
							<text class="unit">V</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">电流</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.ampere || '-' }}</text>
							<text class="unit">A</text>
						</view>
					</view>

					<!-- 功率 / 亮度 -->
					<view class="detail-item">
						<text class="detail-label">功率</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.power || '-' }}</text>
							<text class="unit">W</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">亮度</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.brightness || '-' }}</text>
							<text class="unit">%</text>
						</view>
					</view>

					<!-- 色温 / 温度 -->
					<view class="detail-item">
						<text class="detail-label">色温</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.colorTemp || '-' }}</text>
							<text class="unit">K</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">温度</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.temp || '-' }}</text>
							<text class="unit">℃</text>
						</view>
					</view>

					<!-- 电能 / 开灯时长 -->
					<view class="detail-item">
						<text class="detail-label">电能</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.energy || '-' }}</text>
							<text class="unit">kWh</text>
						</view>
					</view>
					<view class="detail-item">
						<text class="detail-label">开灯时长</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.duration || '-' }}</text>
							<text class="unit">分钟</text>
						</view>
					</view>

					<!-- 所属灯杆：右侧 location 图标查看灯杆位置（与单灯详情一致） -->
					<view class="detail-item full-width">
						<text class="detail-label">所属灯杆</text>
						<view class="detail-value pole-value">
							<text class="value-text">{{ poleName || '-' }}</text>
							<uni-icons :color="primaryColor" class="location-icon" size="22" type="location" @click="$emit('click-show-location')" />
						</view>
					</view>

					<!-- 漏电电流 -->
					<view class="detail-item full-width">
						<text class="detail-label">漏电电流</text>
						<view class="detail-value">
							<text class="value-text">{{ activeLight.leakageCurrent || '-' }}</text>
							<text class="unit">mA</text>
						</view>
					</view>

					<!-- 最后通讯时间 -->
					<view class="detail-item full-width">
						<text class="detail-label">最后通讯时间</text>
						<view class="detail-value">{{ activeLight.lastCommTime || '-' }}</view>
					</view>
				</view>
			</scroll-view>

			<!-- 底部按钮区：操作（跳转单灯站点界面）/ 图片 / 修改定位 / 路线导航 -->
			<view class="popup-footer">
				<button class="footer-btn primary" @click="$emit('click-operation', activeLight)">操作</button>
				<button class="footer-btn primary" @click="$emit('click-image', activeLight)">图片</button>
				<button class="footer-btn primary" @click="$emit('click-modify-location')">修改定位</button>
				<button class="footer-btn primary" @click="$emit('click-navigation')">路线导航</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PoleDetailPopup',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		// 灯杆名称（头部 + 所属灯杆）
		poleName: {
			type: String,
			default: ''
		},
		// 灯杆下的单灯列表（已包装为显示对象，见 poleLocation.wrapPoleLight）
		lights: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			activeIndex: 0 // 当前选中的单灯标签下标
		};
	},
	computed: {
		// 当前选中的单灯（无单灯时为 null，中部留空）
		activeLight() {
			return this.lights[this.activeIndex] || null;
		},
		// 标签较少时居中显示（与原型一致），较多时左对齐以便横向滚动
		tabsAlignClass() {
			return this.lights.length > 3 ? 'tabs-start' : 'tabs-center';
		},
		// 关闭图标颜色
		iconColor() {
			return this.isDarkMode ? '#8b94a8' : '#999999';
		},
		// 定位图标颜色
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#3a7bf7';
		}
	},
	watch: {
		// 换灯杆（单灯列表变化）时回到第一个标签
		lights() {
			this.activeIndex = 0;
		}
	}
};
</script>

<style lang="scss" scoped>
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: var(--popup-mask, rgba(0, 0, 0, 0.5));
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-container {
	width: 92%;
	max-height: 90vh;
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* ==================== 头部 ==================== */
.popup-header {
	position: relative;
	padding: 26rpx 90rpx 26rpx 30rpx;
	border-bottom: 1rpx solid var(--border-color, #f0f0f0);
}

.header-row {
	display: flex;
	align-items: center;
	line-height: 40rpx;

	& + .header-row {
		margin-top: 8rpx;
	}
}

.header-label {
	width: 160rpx;
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
	flex-shrink: 0;
}

.header-value {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	word-break: break-all;
}

.close-icon {
	position: absolute;
	right: 30rpx;
	top: 50%;
	transform: translateY(-50%);
}

/* ==================== 单灯切换标签 ==================== */
.light-tabs {
	width: 100%;
	flex-shrink: 0;
	border-bottom: 1rpx solid var(--border-color, #f0f0f0);
}

.light-tabs-inner {
	display: flex;
	align-items: center;
	padding: 18rpx 20rpx 0;

	&.tabs-center {
		justify-content: center;
	}

	&.tabs-start {
		justify-content: flex-start;
	}
}

.light-tab {
	flex-shrink: 0;
	padding: 0 24rpx 14rpx;
	font-size: 30rpx;
	color: var(--text-secondary, #666666);
	border-bottom: 4rpx solid transparent;
}

.light-tab-active {
	color: var(--color-primary, #4285f4);
	border-bottom-color: var(--color-primary, #4285f4);
	font-weight: 600;
}

/* ==================== 单灯详情字段 ==================== */
.popup-body {
	flex: 1;
	min-height: 200rpx;
	padding: 30rpx;
	box-sizing: border-box;
	overflow-y: auto;
}

.detail-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.detail-item {
	width: 48%;
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;

	&.full-width {
		width: 100%;
	}
}

.detail-label {
	width: 140rpx;
	font-size: 28rpx;
	color: var(--text-secondary, #666666);
	flex-shrink: 0;
}

.detail-value {
	flex: 1;
	min-width: 0; // 允许内容收缩，避免撑破容器
	background-color: var(--bg-soft, #f5f6fa);
	border-radius: 8rpx;
	padding: 16rpx 20rpx;
	font-size: 24rpx;
	color: var(--text-primary, #333333);
	display: flex;
	align-items: center;
	min-height: 40rpx;
	word-break: break-all; // 文本过长自动换行
	white-space: pre-line; // 多通道数据（\n 连接）按行显示

	.value-text {
		flex: 1;
		min-width: 0;
	}

	.unit {
		flex-shrink: 0;
		margin-left: auto;
		padding-left: 12rpx;
		font-size: 24rpx;
		color: var(--text-quaternary, #999999);
	}
}

.pole-value {
	justify-content: space-between;
}

.location-icon {
	margin-left: 16rpx;
	flex-shrink: 0;
}

/* ==================== 底部按钮区 ==================== */
.popup-footer {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 30rpx 40rpx;
	background-color: var(--bg-card, #ffffff);
	gap: 16rpx;
}

.footer-btn {
	flex: 1;
	font-size: 26rpx;
	border-radius: 8rpx;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0;
	margin: 0;
	border: none;

	&.primary {
		background-color: var(--color-primary, #3a7bf7);
		color: #ffffff;
	}
}
</style>
