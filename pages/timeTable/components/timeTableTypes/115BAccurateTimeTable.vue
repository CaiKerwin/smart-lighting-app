<template>
	<view :class="themeClass" class="b115AccurateTimeTable-container">
		<!-- ==================== 时间表名称介绍 + 日出日落（固定） ==================== -->
		<view class="page-header">
			<view class="header-title-row">
				<view class="tt-name">{{ timeTableName || '未命名时间表' }}</view>
				<view class="tt-badge">115B准时表</view>
			</view>

			<!-- 当日日出 / 日落时间：经纬度模式偏移量的参考 -->
			<view class="sun-bar">
				<view class="sun-item">
					<image class="sun-icon" mode="aspectFit" src="/static/home/sunrise.png" />
					<text class="sun-text">{{ sunriseTime || '--:--' }}</text>
				</view>
				<view class="sun-item">
					<image class="sun-icon" mode="aspectFit" src="/static/home/sunset.png" />
					<text class="sun-text">{{ sunsetTime || '--:--' }}</text>
				</view>
			</view>

			<view class="header-meta">
				<text class="meta-item">时钟模式时间依次递增</text>
				<text class="meta-divider" />
				<text class="meta-item">点击右下角按钮可编辑</text>
			</view>
		</view>

		<!-- ==================== 时段卡片（只读） ==================== -->
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
						<!-- 卡片头部：时段序号 + 模式 -->
						<view class="card-head">
							<view class="head-left">
								<view class="index-badge">{{ index + 1 }}</view>
								<text class="card-title">时段{{ index + 1 }}</text>
							</view>
							<view class="mode-box">
								<text class="mode-label">模式</text>
								<text :class="modeChipClass(period.mode)">{{ modeText(period.mode) }}</text>
							</view>
						</view>

						<!-- 时钟模式：时间 -->
						<view v-if="isClock(period)" class="row-line time-line">
							<text class="row-label">时间</text>
							<view class="value-box time-value">
								<text class="value-text">{{ period.time || '--' }}</text>
							</view>
						</view>

						<!-- 经纬度模式：日出/日落 + 偏移 -->
						<view v-else-if="isSun(period)" class="row-line sun-line">
							<view class="value-box sun-value">
								<image :src="sunIcon(period.on)" class="sun-icon" mode="aspectFit" />
								<text class="value-text">{{ sunText(period.on) }}</text>
							</view>
							<view class="value-box offset-value">
								<text class="value-text">{{ offsetText(period) }}</text>
							</view>
						</view>

						<!-- 未启用模式：时间为空 -->
						<view v-else class="row-line time-line">
							<text class="row-label">时间</text>
							<view class="value-box time-value disabled-box">
								<text class="value-text value-placeholder">未启用</text>
							</view>
						</view>

						<!-- 亮度 / 联动亮度 -->
						<view class="param-row">
							<view v-for="field in fields" :key="field.key" class="param-item">
								<text class="row-label">{{ field.label }}</text>
								<view class="value-box">
									<text class="value-text">{{ displayValue(period[field.key]) }}</text>
									<text class="field-unit">{{ field.unit }}</text>
								</view>
							</view>
						</view>
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

// 115B 准时日表固定 6 个时段
const PERIOD_COUNT = 6;

// 工作模式（mode）：0-未启用，1-经纬度，2-时钟
const MODE_DISABLED = 0;
const MODE_SUN = 1;
const MODE_CLOCK = 2;

// 模式文案
const MODE_LABELS = {
	0: '未启用',
	1: '经纬度',
	2: '时钟'
};

// 经纬度时间类型（on）：0-日落时间，1-日出时间
const SUN_OPTIONS = {
	0: {label: '日落时间', icon: '/static/home/sunset.png'},
	1: {label: '日出时间', icon: '/static/home/sunrise.png'}
};

// 经纬度时间偏移（off）：0-无偏移，1-延迟，2-提早
const OFFSET_LABELS = {
	0: '无偏移',
	1: '延迟',
	2: '提早'
};

// 每个时段展示的数值参数：亮度(%)、联动亮度(%)
const FIELD_KEYS = ['bright', 'union'];
const FIELD_LABELS = {
	bright: {label: '亮度', unit: '%'},
	union: {label: '联动', unit: '%'}
};

// 分钟数（从 0 点算起）转 HH:mm，非法返回空字符串
function minutesToTime(value) {
	if (value === null || value === undefined || value === '') return '';
	const num = Number(value);
	if (isNaN(num)) return '';
	const minutes = Math.floor(num);
	if (minutes < 0 || minutes > 1439) return '';
	const hour = Math.floor(minutes / 60);
	const minute = minutes % 60;
	return `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
}

// 生成 6 个时段的展示数据（未取到数据前保持空白）
function createPeriods() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		const period = {mode: MODE_DISABLED, time: '', on: 1, off: 0, interval: '', bright: '', union: ''};
		list.push(period);
	}
	return list;
}

export default {
	name: 'B115AccurateTimeTable',
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
			// 当日日出 / 日落时间（仅展示，作为经纬度偏移量的参考）
			sunriseTime: '',
			sunsetTime: '',
			// 6 个时段参数（只读展示）：{ mode, time, on, off, interval, bright, union }
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
		uni.$on('115BAccurateTimeTableUpdated', this.refreshHandler);

		this.getTimeTableDetail();
		this.getSunTime();
	},
	onUnload() {
		if (this.refreshHandler) {
			uni.$off('115BAccurateTimeTableUpdated', this.refreshHandler);
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

		// 取数字，失败时回退默认值
		toNumber(value, fallback) {
			const text = String(value === null || value === undefined ? '' : value).trim();
			const num = Number(text);
			return text === '' || isNaN(num) ? fallback : num;
		},

		// 展示值：空值统一显示 --
		displayValue(value) {
			if (value === null || value === undefined || value === '') return '--';
			return value;
		},

		/* ==================== 展示辅助 ==================== */

		// 当前时段是否为时钟模式
		isClock(period) {
			return Number(period.mode) === MODE_CLOCK;
		},

		// 当前时段是否为经纬度模式
		isSun(period) {
			return Number(period.mode) === MODE_SUN;
		},

		// 模式文案
		modeText(mode) {
			const text = MODE_LABELS[Number(mode)];
			return text === undefined ? '--' : text;
		},

		// 模式标签样式：未启用显示为灰色
		modeChipClass(mode) {
			return Number(mode) === MODE_DISABLED ? 'mode-chip mode-chip-off' : 'mode-chip';
		},

		// 经纬度时间类型文案 / 图标（on：0-日落时间，1-日出时间）
		sunText(on) {
			const option = SUN_OPTIONS[Number(on) === 1 ? 1 : 0];
			return option.label;
		},

		sunIcon(on) {
			const option = SUN_OPTIONS[Number(on) === 1 ? 1 : 0];
			return option.icon;
		},

		// 偏移文案：无偏移 / 延迟 X 分 / 提早 X 分
		offsetText(period) {
			const off = Number(period.off);
			const label = OFFSET_LABELS[off];
			if (label === undefined) return '--';
			if (off === 0) return label;
			const minutes = period.interval;
			if (minutes === null || minutes === undefined || minutes === '') return label;
			return `${label} ${minutes} 分`;
		},

		/* ==================== 详情 / 日出日落 ==================== */

		// 获取 115B 准时日表详情
		getTimeTableDetail() {
			this.loading = true;
			this.loadError = false;
			/**
			 * POST /station/plan/QueryLight8Detail   { "id": 827 }
			 * 返回 content：
			 * {
			 *   "0": { "mode": 2, "on": 0, "off": 1, "interval": 540, "bright": 0, "union": 100 },
			 *   ...（共 6 个时段，"0" ~ "5"）
			 * }
			 * mode：0-未启用，1-经纬度，2-时钟
			 * on：经纬度时间类型 0-日落时间，1-日出时间
			 * off：经纬度时间偏移 0-无偏移，1-延迟，2-提早
			 * interval：经纬度模式为偏移量（分钟），时钟模式为从 0 点算起的分钟数
			 */
			request({
				url: '/station/plan/QueryLight8Detail',
				method: 'POST',
				data: {
					id: this.timeTableId
				}
			}).then(res => {
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
							const mode = this.toNumber(source.mode, MODE_DISABLED);
							list.push({
								mode: mode,
								// 时钟模式：interval 为从 0 点算起的分钟数，展示为时和分；其余模式时间为空
								time: mode === MODE_CLOCK ? minutesToTime(source.interval) : '',
								on: this.toNumber(source.on, 0),
								off: this.toNumber(source.off, 0),
								interval: source.interval === undefined || source.interval === null ? '' : source.interval,
								bright: source.bright === undefined || source.bright === null ? '' : source.bright,
								union: source.union === undefined || source.union === null ? '' : source.union
							});
						}
						this.periods = list;

						this.loading = false;
					} catch (e) {
						console.error('115B准时日表详情解析失败', e);
						this.loading = false;
						this.loadError = true;
						uni.showToast({title: '时间表详情解析失败', icon: 'none'});
					}
				} else {
					this.loading = false;
					this.loadError = true;
					uni.showToast({title: '获取115B准时日表详情异常', icon: 'none'});
				}
			}).catch(err => {
				this.loading = false;
				this.loadError = true;
				console.error('获取115B准时日表详情错误', err.message);
				uni.showToast({title: '获取时间表详情失败', icon: 'none'});
			});
		},

		// 获取当日日出 / 日落时间（仅作展示，失败不影响详情）
		getSunTime() {
			/**
			 * POST /station/home/QueryEnv
			 * 返回：{"area":"深圳市","lat":22.63,"lng":114.05,"open":"-","close":"-","sunRise":"05:53","sunSet":"19:07"}
			 */
			request({
				url: '/station/home/QueryEnv',
				method: 'POST',
				data: {}
			}).then(res => {
				const payload = res.data;
				if (!payload || !payload.data) return;
				try {
					const decoded = typeof payload.data === 'string' ? JSON.parse(base64Decode(payload.data)) : payload.data;
					this.sunriseTime = (decoded && decoded.sunRise) || '';
					this.sunsetTime = (decoded && decoded.sunSet) || '';
				} catch (e) {
					console.error('日出/日落时间解析失败', e);
				}
			}).catch(err => {
				console.error('获取日出/日落时间错误', err.message);
			});
		},

		// 跳转编辑页
		editTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '缺少时间表 id', icon: 'none'});
				return;
			}
			uni.navigateTo({
				url: `/pages/timeTable/components/timeTableEdit/edit115BAccurateTimeTable?id=${this.timeTableId}&name=${encodeURIComponent(this.timeTableName || '')}`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 容器：头部 + 滚动区 ==================== */
.b115AccurateTimeTable-container {
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

	/* 日出 / 日落时间条 */
	.sun-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 76rpx;
		padding: 0 24rpx;
		margin-top: 20rpx;
		box-sizing: border-box;
		background-color: var(--bg-soft, #f2f4f8);
		border: 2rpx solid var(--border-color, #e6eaf2);
		border-radius: 12rpx;

		.sun-item {
			display: flex;
			align-items: center;
		}

		.sun-icon {
			width: 34rpx;
			height: 34rpx;
			margin-right: 12rpx;
		}

		.sun-text {
			font-size: 28rpx;
			font-weight: 500;
			color: var(--text-primary, #333333);
		}
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

	/* 模式 */
	.mode-box {
		flex-shrink: 0;
		display: flex;
		align-items: center;

		.mode-label {
			font-size: 26rpx;
			color: var(--text-secondary, #666666);
			margin-right: 12rpx;
		}

		.mode-chip {
			width: 200rpx;
			height: 64rpx;
			line-height: 64rpx;
			padding: 0 16rpx;
			box-sizing: border-box;
			text-align: center;
			font-size: 26rpx;
			font-weight: 500;
			color: #3a7bf7;
			background-color: var(--bg-accent, #eef3ff);
			border-radius: 12rpx;
		}

		/* 未启用模式：灰色标签 */
		.mode-chip-off {
			color: var(--text-tertiary, #888888);
			background-color: var(--bg-soft, #f2f4f8);
		}
	}
}

/* ==================== 只读数值框 ==================== */
.value-box {
	display: flex;
	align-items: center;
	height: 76rpx;
	padding: 0 16rpx;
	box-sizing: border-box;
	background-color: var(--bg-soft, #f2f4f8);
	border: 2rpx solid var(--border-color, #e6eaf2);
	border-radius: 12rpx;

	.value-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 28rpx;
		font-weight: 500;
		color: var(--text-primary, #333333);
	}

	.value-placeholder {
		font-weight: normal;
		font-size: 24rpx;
		color: #b8bfcc;
	}

	.field-unit {
		flex-shrink: 0;
		margin-left: 8rpx;
		font-size: 24rpx;
		color: var(--text-quaternary, #999999);
	}

	.sun-icon {
		flex-shrink: 0;
		width: 32rpx;
		height: 32rpx;
		margin-right: 10rpx;
	}
}

/* ==================== 时间 / 经纬度行 ==================== */
.row-line {
	display: flex;
	align-items: center;
}

/* 行内标签（时间 / 亮度 / 联动） */
.row-label {
	flex-shrink: 0;
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

/* 时钟模式 / 未启用：时间 */
.time-line {
	.row-label {
		width: 92rpx;
	}

	.time-value {
		width: 280rpx;
	}
}

/* 经纬度模式：日出/日落 + 偏移 */
.sun-line {
	justify-content: space-between;

	.sun-value {
		width: 48%;
	}

	.offset-value {
		width: 48%;
	}
}

/* 未启用模式：只读的占位框 */
.disabled-box {
	border-style: dashed;
}

/* ==================== 亮度 / 联动亮度 ==================== */
.param-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 22rpx;

	.param-item {
		display: flex;
		align-items: center;
		width: 48%;

		.row-label {
			width: 76rpx;
		}

		.value-box {
			flex: 1;
			min-width: 0;
		}
	}
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
