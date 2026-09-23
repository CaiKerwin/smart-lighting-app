<template>
	<view :class="themeClass" class="lightAccurateTimeTable-container">
		<!-- ==================== 时间表名称介绍 ==================== -->
		<view class="page-header">
			<view class="header-title-row">
				<view class="tt-name">{{ timeTableName || '未命名时间表' }}</view>
				<view class="tt-badge">单灯准时表</view>
			</view>
			<view class="header-meta">
				<text class="meta-item">时间从上到下依次递增</text>
				<text class="meta-divider" />
				<text class="meta-item">6个时间段必须都填</text>
			</view>
		</view>

		<!-- ==================== 时段卡片 ==================== -->
		<scroll-view :show-scrollbar="false" class="period-scroll" scroll-y="true">
			<view class="scroll-inner">
				<!-- 加载中 -->
				<view v-if="loading" class="state-box">
					<text class="state-text">时间表加载中...</text>
				</view>

				<!-- 加载失败 -->
				<view v-else-if="loadError" class="state-box">
					<text class="state-text">时间表加载失败，请检查网络后重试</text>
					<view class="retry-btn" @click="getTimeTableDetail">重新加载</view>
				</view>

				<!-- 六个时段卡片 -->
				<template v-else>
					<view v-for="(period, index) in periods" :key="index" class="period-card">
						<!-- 卡片头部：时段序号 + 时间 -->
						<view class="card-head">
							<view class="head-left">
								<view class="index-badge">{{ index + 1 }}</view>
								<text class="card-title">时段{{ index + 1 }}</text>
							</view>
							<text class="duration-chip">{{ timeText(period.min) }}</text>
						</view>

						<!-- 参数区：时间 / 亮度(%) / 色温(%) / 联动亮度(%)，两行两列 -->
						<view class="field-grid">
							<!-- 时间 -->
							<view class="field">
								<text class="field-label">时间</text>
								<view class="value-box">
									<text class="value-text">{{ displayValue(period.min) }}</text>
								</view>
							</view>
							<view v-for="field in fields" :key="field.key" class="field">
								<text class="field-label">{{ field.label }}({{ field.unit }})</text>
								<view class="value-box">
									<text class="value-text">{{ displayValue(period[field.key]) }}</text>
									<text class="field-unit">{{ field.unit }}</text>
								</view>
							</view>
						</view>
					</view>

					<view class="scroll-footer-tip">
						每个时段仅一组参数：时间、亮度(%)、色温(%)、联动亮度(%)，点击右下角按钮可编辑
					</view>
				</template>
			</view>
		</scroll-view>

		<!-- ==================== 右下角编辑悬浮按钮：跳转编辑页 ==================== -->
		<view class="fab-edit" @click="editTimeTable">
			<uni-icons color="#ffffff" size="30" type="compose"/>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 单灯准时表固定 6 个时段
const PERIOD_COUNT = 6;

// 每个时段仅有 3 个参数：亮度(%)、色温(%)、联动亮度(%)（时间单独整行展示）
const FIELD_KEYS = ['ch1', 'c1', 'un1'];

// 字段展示信息
const FIELD_LABELS = {
	ch1: {label: '亮度', unit: '%'},
	c1: {label: '色温', unit: '%'},
	un1: {label: '联动亮度', unit: '%'}
};

// 生成 6 个时段的展示数据（未取到数据前保持空白）
function createPeriods() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		const period = {min: ''};
		FIELD_KEYS.forEach((key) => {
			period[key] = '';
		});
		list.push(period);
	}
	return list;
}

export default {
	name: 'LightAccurateTimeTable',
	data() {
		return {
			// 固定时段数量
			periodCount: PERIOD_COUNT,
			// 页面状态
			loading: true,
			loadError: false,
			// 时间表基本信息
			timeTableId: null,
			timeTableName: '',
			// 6 个时段参数（只读展示）：{ min: "HH:mm", ch1, c1, un1 }
			periods: createPeriods(),
			// 界面渲染用字段定义（顺序即界面顺序）
			fields: FIELD_KEYS.map((key) => ({
				key: key,
				label: FIELD_LABELS[key].label,
				unit: FIELD_LABELS[key].unit
			}))
		};
	},
	onLoad(options) {
		this.timeTableId = options && options.id ? Number(options.id) : null;
		if (options && options.name) {
			try {
				this.timeTableName = decodeURIComponent(options.name);
			} catch (e) {
				this.timeTableName = options.name;
			}
		}

		if (!this.timeTableId) {
			this.loading = false;
			this.loadError = true;
			uni.showToast({title: '缺少时间表 id', icon: 'none'});
			return;
		}

		// 编辑页保存成功后，刷新本页详情
		this.refreshHandler = (payload) => {
			if (payload && payload.id === this.timeTableId) {
				this.getTimeTableDetail();
			}
		};
		uni.$on('lightAccurateTimeTableUpdated', this.refreshHandler);

		this.getTimeTableDetail();
	},
	onUnload() {
		if (this.refreshHandler) {
			uni.$off('lightAccurateTimeTableUpdated', this.refreshHandler);
			this.refreshHandler = null;
		}
	},
	methods: {
		// 取后端某时段的原始数据（兼容数字/字符串键）
		getOriginalPeriod(content, index) {
			const src = content || {};
			if (src[index] !== undefined && src[index] !== null) return src[index];
			if (src[String(index)] !== undefined && src[String(index)] !== null) return src[String(index)];
			return null;
		},

		// 展示值：空值统一显示 --
		displayValue(value) {
			if (value === null || value === undefined || value === '') return '--';
			return value;
		},

		// 卡片头部的时间展示
		timeText(min) {
			return min === null || min === undefined || min === '' ? '时间未设置' : min;
		},

		// 获取单灯准时日表详情
		getTimeTableDetail() {
			this.loading = true;
			this.loadError = false;
			/**
			 * POST /station/plan/QueryLight7Detail   { "id": 101 }
			 * 返回 content：
			 * {
			 *   "0": { "min": "09:00", "ch1": 0, "c1": 21, "un1": 30, "ch2": 40, "c2": 50, "un2": 60,
			 *          "ch3": 70, "c3": 80, "un3": 90, "ch4": 0, "c4": 0, "un4": 0 },
			 *   ...（共 6 个时段，"0" ~ "5"，界面仅展示 min / ch1 / c1 / un1）
			 * }
			 */
			request({
				url: '/station/plan/QueryLight7Detail',
				method: 'POST',
				data: {
					id: this.timeTableId
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res.data;
				if (payload && payload.data) {
					try {
						// 兼容返回已解码对象的情况
						let detail = payload.data;
						if (typeof detail === 'string') {
							const decoded = base64Decode(detail);
							detail = decoded ? JSON.parse(decoded) : {};
						}
						const content = (detail && detail.content) || {};
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}

						// 固定展示 6 个时段
						const list = [];
						for (let i = 0; i < PERIOD_COUNT; i++) {
							const source = this.getOriginalPeriod(content, i) || {};
							const period = {
								min: source.min === undefined || source.min === null ? '' : source.min
							};
							FIELD_KEYS.forEach((key) => {
								period[key] = source[key] === undefined || source[key] === null ? '' : source[key];
							});
							list.push(period);
						}
						this.periods = list;


						this.loading = false;
					} catch (e) {
						console.error('单灯准时日表详情解析失败', e);
						this.loading = false;
						this.loadError = true;
						uni.showToast({title: '时间表详情解析失败', icon: 'none'});
					}
				} else {
					this.loading = false;
					this.loadError = true;
					uni.showToast({title: '获取单灯准时日表详情异常', icon: 'none'});
				}
			}).catch(err => {
				this.loading = false;
				this.loadError = true;
				console.error('获取单灯准时日表详情错误', err.message);
				uni.showToast({title: '获取时间表详情失败', icon: 'none'});
			});
		},

		// 跳转编辑页
		editTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '缺少时间表 id', icon: 'none'});
				return;
			}
			uni.navigateTo({
				url: `/pages/timeTable/components/timeTableEdit/editLightAccurateTimeTable?id=${this.timeTableId}&name=${encodeURIComponent(this.timeTableName || '')}`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 容器：头部 + 滚动区 ==================== */
.lightAccurateTimeTable-container {
	display: flex;
	flex-direction: column;
	/* 占满导航栏之外的整屏高度，保证只有卡片区域滚动 */
	height: 100vh;
	height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
	overflow: hidden;
	box-sizing: border-box;
	background-color: var(--bg-page, #f8f8f8);
}

/* ==================== 头部（固定） ==================== */
.page-header {
	flex-shrink: 0;
	padding: 26rpx 28rpx 22rpx;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));
	z-index: 10;

	.header-title-row {
		display: flex;
		align-items: center;
	}

	.tt-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 36rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
		margin-right: 16rpx;
	}

	.tt-badge {
		flex-shrink: 0;
		font-size: 22rpx;
		color: #3a7bf7;
		background-color: var(--bg-accent, #eef3ff);
		border-radius: 8rpx;
		padding: 6rpx 16rpx;
	}

	.header-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 14rpx;

		.meta-item {
			font-size: 22rpx;
			color: var(--text-quaternary, #999999);
		}

		.meta-divider {
			font-size: 22rpx;
			color: var(--text-quaternary, #999999);
			margin: 0 10rpx;
		}
	}
}

/* ==================== 滚动区：仅时段卡片上下滚动 ==================== */
.period-scroll {
	flex: 1;
	height: 0;
	min-height: 0;
	width: 100%;
}

.scroll-inner {
	/* 底部留出悬浮按钮空间，避免遮挡最后一张卡片 */
	padding: 24rpx 24rpx 200rpx;
	box-sizing: border-box;
}

/* ==================== 加载 / 失败状态 ==================== */
.state-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;

	.state-text {
		font-size: 26rpx;
		color: var(--text-quaternary, #999999);
	}

	.retry-btn {
		margin-top: 28rpx;
		font-size: 26rpx;
		color: #ffffff;
		background-color: #3a7bf7;
		border-radius: 40rpx;
		padding: 12rpx 40rpx;
	}
}

/* ==================== 时段卡片（只读） ==================== */
.period-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));
}

.card-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 20rpx;
	margin-bottom: 22rpx;
	border-bottom: 1rpx solid var(--border-color, #f0f2f5);

	.head-left {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.index-badge {
		flex-shrink: 0;
		width: 44rpx;
		height: 44rpx;
		border-radius: 12rpx;
		margin-right: 16rpx;
		background: linear-gradient(135deg, #3a7bf7, #5a96ff);
		color: #ffffff;
		font-size: 24rpx;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-title {
		font-size: 30rpx;
		font-weight: 600;
		color: var(--text-primary, #333333);
	}

	.duration-chip {
		flex-shrink: 0;
		font-size: 22rpx;
		color: #3a7bf7;
		background-color: var(--bg-accent, #eef3ff);
		border-radius: 40rpx;
		padding: 8rpx 20rpx;
	}
}

/* ==================== 时间 + 三个参数：2 列网格 ==================== */
.field-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	/* 抵消最后一行字段的下外边距 */
	margin-bottom: -22rpx;

	.field {
		width: 48%;
		margin-bottom: 22rpx;
		box-sizing: border-box;
	}

	.field-label {
		display: block;
		font-size: 24rpx;
		color: var(--text-secondary, #666666);
		margin-bottom: 10rpx;
	}

	.value-box {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		height: 76rpx;
		padding: 0 18rpx;
		box-sizing: border-box;
		background-color: var(--bg-soft, #f2f4f8);
		border: 2rpx solid var(--border-color, #e6eaf2);
		border-radius: 12rpx;

		.value-text {
			flex: 1;
			min-width: 0;
			text-align: right;
			font-size: 28rpx;
			font-weight: 500;
			color: var(--text-primary, #333333);
		}

		.field-unit {
			flex-shrink: 0;
			margin-left: 10rpx;
			font-size: 24rpx;
			color: var(--text-quaternary, #999999);
		}
	}
}

.scroll-footer-tip {
	padding: 28rpx 8rpx 0;
	text-align: center;
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
}

/* ==================== 右下角编辑悬浮按钮 ==================== */
.fab-edit {
	position: fixed;
	right: 30rpx;
	bottom: calc(60rpx + env(safe-area-inset-bottom));
	width: 110rpx;
	height: 110rpx;
	border-radius: 50%;
	background-color: #3a7bf7;
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(58, 123, 247, 0.4);
	z-index: 999;
}
</style>
