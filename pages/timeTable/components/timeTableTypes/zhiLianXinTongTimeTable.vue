<template>
	<view :class="themeClass" class="zhiLianXinTongTimeTable-container">
		<!-- ==================== 时间表名称介绍 ==================== -->
		<view class="page-header">
			<view class="header-title-row">
				<view class="tt-name">{{ timeTableName || '未命名时间表' }}</view>
				<view class="tt-badge">智联信通</view>
			</view>
			<view class="header-meta">
				<text class="meta-item">按周设置动作，共 {{ actions.length }} 个动作</text>
				<text class="meta-divider" />
				<text class="meta-item">非正常时间按日出/日落偏移执行</text>
			</view>
		</view>

		<!-- ==================== 动作卡片 ==================== -->
		<scroll-view :show-scrollbar="false" class="action-scroll" scroll-y="true">
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

				<!-- 动作卡片列表 -->
				<template v-else>
					<view v-if="actions.length === 0" class="state-box">
						<text class="state-text">该时间表暂无动作</text>
					</view>

					<view v-for="(action, index) in actions" :key="index" class="action-card">
						<!-- 卡片头部：动作序号 + 动作方式 -->
						<view class="card-head">
							<view class="head-left">
								<view class="index-badge">{{ index + 1 }}</view>
								<text class="card-title">动作{{ index + 1 }}</text>
							</view>
							<text :class="['mode-chip', isNormal(action.mode) ? 'chip-normal' : 'chip-sun']">
								{{ modeText(action.mode) }}
							</text>
						</view>

						<!-- 周范围：7 个星期，选中的高亮 -->
						<view class="week-block">
							<text class="field-label">周范围</text>
							<view class="week-grid">
								<view
									v-for="(day, dayIndex) in weekLabels"
									:key="dayIndex"
									:class="['week-chip', action.weeks[dayIndex] ? 'chip-active' : '']"
								>
									<text class="chip-text">{{ day }}</text>
								</view>
							</view>
						</view>

						<!-- 时间 / 亮度 -->
						<view class="field-grid">
							<view class="field">
								<text class="field-label">时间</text>
								<view class="value-box">
									<text class="value-text">{{ action.hour }}小时{{ action.minute }}分钟</text>
								</view>
							</view>
							<view class="field">
								<text class="field-label">亮度(%)</text>
								<view class="value-box">
									<text class="value-text">{{ action.bright }}</text>
									<text class="field-unit">%</text>
								</view>
							</view>
						</view>
					</view>

					<view v-if="actions.length > 0" class="scroll-footer-tip">
						周范围高亮表示该动作在这些星期生效；时间按动作方式执行，非正常时间表示相对日出/日落的时间
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

// 一个星期固定 7 天，顺序与接口 weeks 数组一致：0-周日 ... 6-周六
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 动作方式（mode）：与后端下标一一对应
 * 0-正常时间，1-日出前，2-日出后，3-日落前，4-日落后
 */
const MODE_OPTIONS = [
	{label: '正常时间', value: 0},
	{label: '日出前', value: 1},
	{label: '日出后', value: 2},
	{label: '日落前', value: 3},
	{label: '日落后', value: 4}
];

// 正常时间：按设定时刻执行
const MODE_NORMAL = 0;

// 选项数组中查找值对应的选项（找不到返回第一项）
function findOption(options, value) {
	const target = Number(value);
	return options.find((item) => item.value === target) || options[0];
}

// 规范化星期数组：始终返回 7 个布尔值
function normalizeWeeks(weeks) {
	const list = [];
	for (let i = 0; i < WEEK_LABELS.length; i++) {
		list.push(!!(weeks && weeks[i]));
	}
	return list;
}

// 规范化非负整数，非法时回退默认值
function toInt(value, fallback) {
	const num = Number(value);
	return value === null || value === undefined || value === '' || isNaN(num) ? fallback : Math.floor(num);
}

export default {
	name: 'ZhiLianXinTongTimeTable',
	data() {
		return {
			// 页面状态
			loading: true,
			loadError: false,
			// 时间表 id / 名称
			timeTableId: null,
			timeTableName: '',
			// 星期文案（顺序固定：周日 ~ 周六）
			weekLabels: WEEK_LABELS,
			// 动作列表：{ weeks[7], mode, hour, minute, bright }
			actions: []
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
		uni.$on('zhiLianXinTongTimeTableUpdated', this.refreshHandler);

		this.getTimeTableDetail();
	},
	onUnload() {
		if (this.refreshHandler) {
			uni.$off('zhiLianXinTongTimeTableUpdated', this.refreshHandler);
			this.refreshHandler = null;
		}
	},
	methods: {
		// 是否为正常时间方式
		isNormal(mode) {
			return Number(mode) === MODE_NORMAL;
		},

		// 动作方式文案
		modeText(mode) {
			if (mode === null || mode === undefined || mode === '') return '--';
			return findOption(MODE_OPTIONS, mode).label;
		},

		// 获取智联信通时间表详情
		getTimeTableDetail() {
			this.loading = true;
			this.loadError = false;
			/**
			 * POST /station/plan/QueryLight10Detail   { "id": 1259 }
			 * 返回 content：
			 * {
			 *   "list": [
			 *     {
			 *       "weeks": [true, true, true, true, true, true, true], // 0-周日 ... 6-周六
			 *       "mode": 1,      // 0-正常时间，1-日出前，2-日出后，3-日落前，4-日落后
			 *       "hour": 0,      // 正常时间：时；其余方式：相对日出/日落的偏移（小时）
			 *       "minute": 0,    // 正常时间：分；其余方式：相对日出/日落的偏移（分钟）
			 *       "bright": 100   // 亮度(%)
			 *     }
			 *   ]
			 * }
			 */
			request({
				url: '/station/plan/QueryLight10Detail',
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
						const list = Array.isArray(content.list) ? content.list : [];
						this.actions = list.map((item) => ({
							weeks: normalizeWeeks(item && item.weeks),
							mode: findOption(MODE_OPTIONS, item && item.mode).value,
							hour: toInt(item && item.hour, 0),
							minute: toInt(item && item.minute, 0),
							bright: toInt(item && item.bright, 0)
						}));
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}
						this.loading = false;
					} catch (e) {
						console.error('智联信通时间表详情解析失败', e);
						this.loading = false;
						this.loadError = true;
						uni.showToast({title: '时间表详情解析失败', icon: 'none'});
					}
				} else {
					this.loading = false;
					this.loadError = true;
					uni.showToast({title: '获取智联信通时间表详情异常', icon: 'none'});
				}
			}).catch(err => {
				this.loading = false;
				this.loadError = true;
				console.error('获取智联信通时间表详情错误', err.message);
				uni.showToast({title: '获取时间表详情失败', icon: 'none'});
			});
		},

		// 跳转编辑页
		editTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '找不到时间表', icon: 'none'});
				return;
			}
			uni.navigateTo({
				url: `/pages/timeTable/components/timeTableEdit/editZhiLianXinTongTimeTable?id=${this.timeTableId}&name=${encodeURIComponent(this.timeTableName || '')}`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 容器：头部 + 滚动区 ==================== */
.zhiLianXinTongTimeTable-container {
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

/* ==================== 滚动区：仅动作卡片上下滚动 ==================== */
.action-scroll {
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

/* ==================== 动作卡片（只读） ==================== */
.action-card {
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

	/* 动作方式标签：正常时间为蓝色，日出/日落为橙色 */
	.mode-chip {
		flex-shrink: 0;
		font-size: 22rpx;
		border-radius: 40rpx;
		padding: 8rpx 20rpx;
	}

	.chip-normal {
		color: #3a7bf7;
		background-color: var(--bg-accent, #eef3ff);
	}

	.chip-sun {
		color: #f5a623;
		background-color: rgba(245, 166, 35, 0.12);
	}
}

/* ==================== 周范围：7 天，一行 4 个自动换行 ==================== */
.week-block {
	margin-bottom: 24rpx;

	.week-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.week-chip {
		width: 23%;
		height: 60rpx;
		margin-bottom: 12rpx;
		border-radius: 10rpx;
		box-sizing: border-box;
		background-color: var(--bg-soft, #f2f4f8);
		border: 2rpx solid var(--border-color, #e6eaf2);
		display: flex;
		align-items: center;
		justify-content: center;

		.chip-text {
			font-size: 24rpx;
			color: var(--text-tertiary, #9aa7bd);
		}
	}

	.chip-active {
		background-color: var(--bg-accent, #eaf2ff);
		border-color: rgba(58, 123, 247, 0.5);

		.chip-text {
			color: #2f6fed;
			font-weight: 500;
		}
	}
}

/* ==================== 时间 / 亮度：2 列网格 ==================== */
.field-label {
	display: block;
	font-size: 24rpx;
	color: var(--text-secondary, #666666);
	margin-bottom: 10rpx;
}

.field-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;

	.field {
		width: 48%;
		box-sizing: border-box;
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
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
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
