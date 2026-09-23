<template>
	<view :class="themeClass" class="editLightAccurateTimeTable-container">
		<!-- ==================== 头部：时间表名称介绍（固定，不随卡片滚动） ==================== -->
		<view class="page-header">
			<view class="header-title-row">
				<!-- 时间表名称 -->
				<view :class="['name-input-wrap', nameError ? 'input-error' : '']">
					<input
						:value="timeTableName"
						class="name-input"
						maxlength="20"
						placeholder="请输入时间表名称"
						placeholder-style="font-size:28rpx;color:#b8bfcc;"
						@blur="validateName"
						@input="onNameInput"
					/>
				</view>
				<view class="tt-badge">单灯准时表</view>
			</view>
			<text v-if="nameError" class="name-error">{{ nameError }}</text>
			<view class="header-meta">
				<text class="meta-item">时间从上到下依次递增</text>
				<text class="meta-divider" />
				<text class="meta-item">6个时间段必须都填</text>
			</view>
		</view>

		<!-- ==================== 时段卡片：固定 6 张，仅此区域上下滚动 ==================== -->
		<scroll-view
			:scroll-into-view="scrollTarget"
			:scroll-with-animation="true"
			:show-scrollbar="false"
			class="period-scroll"
			scroll-y="true"
		>
			<view class="scroll-inner">
				<!-- 加载中 -->
				<view v-if="loading" class="state-box">
					<text class="state-text">时间表加载中...</text>
				</view>

				<!-- 加载失败：避免用默认值覆盖原时间表，提供重新加载 -->
				<view v-else-if="loadError" class="state-box">
					<text class="state-text">时间表加载失败，请检查网络后重试</text>
					<view class="retry-btn" @click="getTimeTableDetail">重新加载</view>
				</view>

				<!-- 六个时段卡片 -->
				<template v-else>
					<view
						v-for="(period, index) in periods"
						:id="'period-card-' + index"
						:key="index"
						:class="['period-card', hasCardError(index) ? 'card-has-error' : '']"
					>
						<!-- 卡片头部：时段序号 + 当前时间 -->
						<view class="card-head">
							<view class="head-left">
								<view class="index-badge">{{ index + 1 }}</view>
								<text class="card-title">时段{{ index + 1 }}</text>
							</view>
							<text class="duration-chip">{{ timeText(index) }}</text>
						</view>

						<!-- 参数区：时间(选择时和分) / 亮度(%) / 色温(%) / 联动亮度(%)，两行两列 -->
						<view class="field-grid">
							<!-- 时间：选择时和分 -->
							<view class="field">
								<text class="field-label">时间</text>
								<picker :value="pickerValue(index)" mode="time" @change="onTimeChange(index, $event)">
									<view :class="['picker-box', (errors[index].min || timeOrderErrors[index]) ? 'input-error' : '']">
										<text :class="['picker-text', !periods[index].min ? 'picker-placeholder' : '']">
											{{ periods[index].min || '请选择时和分' }}
										</text>
										<text class="picker-arrow">▾</text>
									</view>
								</picker>
								<text v-if="errors[index].min || timeOrderErrors[index]" class="field-error">{{ errors[index].min || timeOrderErrors[index] }}</text>
							</view>
							<view v-for="field in fields" :key="field.key" class="field">
								<text class="field-label">{{ field.label }}({{ field.unit }})</text>
								<view :class="['input-wrap', errors[index][field.key] ? 'input-error' : '']">
									<input
										:maxlength="field.maxlength"
										:placeholder="field.placeholder"
										:value="periods[index][field.key]"
										class="field-input"
										placeholder-style="font-size:26rpx;color:#b8bfcc;"
										type="number"
										@blur="onFieldBlur(index, field.key)"
										@input="onFieldInput(index, field.key, $event)"
									/>
									<text class="field-unit">{{ field.unit }}</text>
								</view>
								<text v-if="errors[index][field.key]" class="field-error">{{ errors[index][field.key] }}</text>
							</view>
						</view>
					</view>

					<view class="scroll-footer-tip">
						6 个时段均须填写时间且时间从上到下依次递增，并填写亮度、色温、联动亮度（0-100）
					</view>
				</template>
			</view>
		</scroll-view>

		<!-- ==================== 底部：保存按钮（固定在底部，始终可见） ==================== -->
		<view class="page-footer">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="saveTimeTable">保存</button>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 单灯准时表固定 6 个时段
const PERIOD_COUNT = 6;

// 时间字段键
const TIME_KEY = 'min';

// 每个时段仅有 3 个参数：亮度(%)、色温(%)、联动亮度(%)（时间单独整行展示）
const FIELD_KEYS = ['ch1', 'c1', 'un1'];

// 字段校验规则：只允许整数；百分比为 0-100（时间字段单独校验 HH:mm）
const FIELD_RULES = {
	ch1: {label: '亮度', unit: '%', min: 0, max: 100, tip: '0-100'},
	c1: {label: '色温', unit: '%', min: 0, max: 100, tip: '0-100'},
	un1: {label: '联动亮度', unit: '%', min: 0, max: 100, tip: '0-100'}
};

// 后端未返回某时段时使用的默认值（时间保持空，要求用户选择）
const DEFAULT_PERIOD = {min: '', ch1: 0, c1: 0, un1: 0};

// 后端 content 中未展示的字段默认值（界面不展示，仅保证请求体结构完整）
const DEFAULT_EXTRA = {
	ch2: 0, c2: 0, un2: 0,
	ch3: 0, c3: 0, un3: 0,
	ch4: 0, c4: 0, un4: 0
};

// 合法时间格式：HH:mm（00:00 - 23:59）
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// 生成 6 个时段的空白数据
function createPeriods() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		list.push(Object.assign({}, DEFAULT_PERIOD));
	}
	return list;
}

// 生成 6 组字段错误提示（键固定，保证响应式）
function createErrors() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		const errors = {min: ''};
		FIELD_KEYS.forEach((key) => {
			errors[key] = '';
		});
		list.push(errors);
	}
	return list;
}

// 生成 6 个时段的时间排序错误提示（单独存放，避免覆盖"请选择时间"等填写错误）
function createTimeOrderErrors() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		list.push('');
	}
	return list;
}

export default {
	name: 'EditLightAccurateTimeTable',
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
			// 名称校验提示（名称可直接编辑，保存时随接口提交）
			nameError: '',
			// 6 个时段参数：{ min: "HH:mm", ch1, c1, un1 }
			periods: createPeriods(),
			// 6 个时段的字段错误提示
			errors: createErrors(),
			// 6 个时段的时间排序错误提示（时间1 < 时间2 < ... < 时间6）
			timeOrderErrors: createTimeOrderErrors(),
			// 界面渲染用字段定义（顺序即界面顺序，仅参数，时间单独整行展示）
			fields: FIELD_KEYS.map((key) => ({
				key: key,
				label: FIELD_RULES[key].label,
				unit: FIELD_RULES[key].unit,
				placeholder: FIELD_RULES[key].tip,
				maxlength: 3
			})),
			// 接口返回的原始 content（保存时保留未展示的字段）
			originalContent: {},
			// 校验失败时滚动定位到对应卡片
			scrollTarget: ''
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

		this.getTimeTableDetail();
	},
	methods: {
		// 名称输入：同步数据；已提示错误时边输入边校验，通过后立即清除提示
		onNameInput(e) {
			this.timeTableName = e && e.detail ? e.detail.value : '';
			if (this.nameError) {
				this.validateName();
			}
		},

		// 名称校验：不能为空且长度不能超过 20 字符（与后端一致）
		validateName() {
			const name = String(this.timeTableName || '').trim();
			let message = '';
			if (!name) {
				message = '请输入时间表名称';
			} else if (name.length > 20) {
				message = '名称长度不能超过20字符';
			}
			this.nameError = message;
			return message === '';
		},

		// 取后端某时段的原始数据（兼容数字/字符串键）
		getOriginalPeriod(index) {
			const src = this.originalContent || {};
			if (src[index] !== undefined && src[index] !== null) return src[index];
			if (src[String(index)] !== undefined && src[String(index)] !== null) return src[String(index)];
			return null;
		},

		// 转数字，失败时回退默认值
		toNumber(value, fallback) {
			const text = String(value === null || value === undefined ? '' : value).trim();
			const num = Number(text);
			return text === '' || isNaN(num) ? fallback : num;
		},

		// 规范化时间为 HH:mm（兼容 "9:5"、"09:00:00" 等格式，非法格式返回空）
		normalizeTime(value) {
			if (value === null || value === undefined) return '';
			const text = String(value).trim();
			if (!text) return '';
			const matched = text.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
			if (!matched) return '';
			const hour = Number(matched[1]);
			const minute = Number(matched[2]);
			if (hour > 23 || minute > 59) return '';
			return `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
		},

		// 用接口数据填充 6 个时段（整体替换数组，保证响应式更新）
		fillPeriods() {
			const list = [];
			for (let i = 0; i < PERIOD_COUNT; i++) {
				const source = this.getOriginalPeriod(i) || {};
				const period = {
					min: this.normalizeTime(source.min)
				};
				FIELD_KEYS.forEach((key) => {
					period[key] = this.toNumber(source[key], DEFAULT_PERIOD[key]);
				});
				list.push(period);
			}
			this.periods = list;
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
			 *   ...（共 6 个时段，"0" ~ "5"，界面仅编辑 min / ch1 / c1 / un1）
			 * }
			 */
			request({
				url: '/station/plan/QueryLight7Detail',
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
						this.originalContent = (detail && detail.content) || {};
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}
						this.fillPeriods();
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

		// 时间选择器的 value（picker 需要 HH:mm，空值时回退 00:00）
		pickerValue(index) {
			return this.periods[index].min || '00:00';
		},

		// 选择时和分后同步数据并即时校验
		onTimeChange(index, e) {
			const value = e && e.detail ? e.detail.value : '';
			this.periods[index].min = value;
			this.validateTime(index);
			// 时间变化后即时校验整体排序
			this.validateTimeOrder();
		},

		// 校验 6 个时段的时间按从小到大排序（时间1 < 时间2 < ... < 时间6，严格递增）
		// 返回首个排序出错的时段索引（-1 表示排序正确）；
		// 未填写/格式非法的时间由 validateTime 提示，这里跳过比较
		validateTimeOrder() {
			for (let i = 0; i < PERIOD_COUNT; i++) {
				this.timeOrderErrors[i] = '';
			}
			let firstErrorIndex = -1;
			for (let i = 1; i < PERIOD_COUNT; i++) {
				const prevText = this.periods[i - 1].min;
				const currText = this.periods[i].min;
				if (!prevText || !TIME_REGEX.test(prevText) || !currText || !TIME_REGEX.test(currText)) {
					continue;
				}
				// 时间已规范化为 HH:mm，字符串比较即为时间先后
				if (currText <= prevText) {
					this.timeOrderErrors[i] = `需大于时段${i}的时间 ${prevText}`;
					if (firstErrorIndex === -1) {
						firstErrorIndex = i;
					}
				}
			}
			return firstErrorIndex;
		},

		// 时间校验：必须为 HH:mm（00:00 - 23:59）
		validateTime(index) {
			const time = this.periods[index].min;
			const text = String(time === null || time === undefined ? '' : time).trim();
			let message = '';
			if (!text) {
				message = '请选择时间';
			} else if (!TIME_REGEX.test(text)) {
				message = '时间格式需为 HH:mm';
			}
			this.errors[index].min = message;
			return message === '';
		},

		// 单字段校验：必须为数字（整数）且在取值范围内
		validateField(index, key) {
			const rule = FIELD_RULES[key];
			const raw = this.periods[index][key];
			const text = String(raw === null || raw === undefined ? '' : raw).trim();
			let message = '';

			if (!text) {
				message = `请输入${rule.label}`;
			} else if (/^-/.test(text)) {
				// 负数
				message = `${rule.label}需为正数`;
			} else if (!/^\d+$/.test(text)) {
				// 含字母、小数点等非数字内容
				message = `${rule.label}仅支持数字`;
			} else if (Number(text) < rule.min) {
				message = `${rule.label}不能小于 ${rule.min}`;
			} else if (Number(text) > rule.max) {
				message = `${rule.label}不能大于 ${rule.max}`;
			}

			this.errors[index][key] = message;
			return message === '';
		},

		// 输入时同步数据；已提示错误的字段边输入边校验，通过后立即清除提示
		onFieldInput(index, key, e) {
			const value = e && e.detail ? e.detail.value : '';
			this.periods[index][key] = value;
			if (this.errors[index][key]) {
				this.validateField(index, key);
			}
		},

		// 失焦时校验
		onFieldBlur(index, key) {
			this.validateField(index, key);
		},

		// 该时段是否存在字段错误
		hasCardError(index) {
			const row = this.errors[index] || {};
			return row.min || this.timeOrderErrors[index] || FIELD_KEYS.some((key) => !!row[key]);
		},

		// 校验全部时段，返回首个出错时段的索引（-1 表示全部通过）
		validateAll() {
			let firstErrorIndex = -1;
			// 1、每个时段的时间都必须填写且格式合法
			for (let i = 0; i < PERIOD_COUNT; i++) {
				const timeOk = this.validateTime(i);
				if (!timeOk && firstErrorIndex === -1) {
					firstErrorIndex = i;
				}
			}
			// 2、时间需从小到大排序（时间1 < 时间2 < ... < 时间6）
			const orderErrorIndex = this.validateTimeOrder();
			if (firstErrorIndex === -1 && orderErrorIndex > -1) {
				firstErrorIndex = orderErrorIndex;
			}
			// 3、亮度 / 色温 / 联动亮度取值 0-100
			for (let i = 0; i < PERIOD_COUNT; i++) {
				for (let k = 0; k < FIELD_KEYS.length; k++) {
					const ok = this.validateField(i, FIELD_KEYS[k]);
					if (!ok && firstErrorIndex === -1) {
						firstErrorIndex = i;
					}
				}
			}
			return firstErrorIndex;
		},

		// 滚动到指定时段卡片
		scrollToCard(index) {
			this.scrollTarget = '';
			this.$nextTick(() => {
				this.scrollTarget = 'period-card-' + index;
			});
		},

		// 卡片头部的时间展示
		timeText(index) {
			const time = this.periods[index].min;
			return time === null || time === undefined || time === '' ? '时间待选择' : time;
		},

		// 组装保存内容：6 个时段各 3 个参数 + 时间（HH:mm），未展示的字段保留原值/补默认值
		buildContent() {
			const content = {};
			for (let i = 0; i < PERIOD_COUNT; i++) {
				const origin = this.getOriginalPeriod(i) || {};
				content[String(i)] = Object.assign({}, DEFAULT_EXTRA, origin, {
					min: this.periods[i].min,
					ch1: Number(this.periods[i].ch1),
					c1: Number(this.periods[i].c1),
					un1: Number(this.periods[i].un1)
				});
			}
			return content;
		},

		// 保存单灯准时日表
		saveTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '缺少时间表 id，无法保存', icon: 'none'});
				return;
			}

			// 名称随接口一起提交，先校验名称
			if (!this.validateName()) {
				uni.showToast({title: this.nameError || '名称填写有误', icon: 'none'});
				return;
			}

			const firstErrorIndex = this.validateAll();
			if (firstErrorIndex > -1) {
				this.scrollToCard(firstErrorIndex);
				uni.showToast({title: `时段${firstErrorIndex + 1} 填写有误，请检查`, icon: 'none'});
				return;
			}

			uni.showModal({
				title: '提示',
				content: '确定保存当前时间表？',
				success: (res) => {
					if (res.confirm) {
						this.submitSave();
					}
				}
			});
		},

		submitSave() {
			/**
			 * POST /station/plan/SaveLight7Detail
			 * {
			 *   "id": 101,
			 *   "name": "准时日表1",
			 *   "content": {
			 *     "0": { "min": "09:00", "ch1": 0, "c1": 21, "un1": 30, "ch2": 40, "c2": 50, "un2": 60,
			 *            "ch3": 70, "c3": 80, "un3": 90, "ch4": 0, "c4": 0, "un4": 0 },
			 *     ...（共 6 个时段，"0" ~ "5"）
			 *   },
			 *   "type": 7            // 7 固定表示单灯准时表
			 * }
			 */
			uni.showLoading({title: '保存中...', mask: true});
			request({
				url: '/station/plan/SaveLight7Detail',
				method: 'POST',
				data: {
					id: this.timeTableId,
					name: String(this.timeTableName || '').trim(),
					content: this.buildContent(),
					type: 7
				}
			}).then(res => {
				uni.hideLoading();
				const payload = res.data || {};
				if (payload.code === 0) {
					// 通知查看页刷新
					uni.$emit('lightAccurateTimeTableUpdated', {id: this.timeTableId});
					uni.showToast({title: '保存成功', icon: 'success'});
					setTimeout(() => {
						uni.navigateBack();
					}, 800);
				} else {
					const msg = typeof payload.data === 'string' ? base64Decode(payload.data) : '';
					uni.showToast({title: msg || '保存失败，请重试', icon: 'none'});
				}
			}).catch(err => {
				uni.hideLoading();
				console.error('保存单灯准时日表失败', err.message);
				uni.showToast({title: '保存失败，请重试', icon: 'none'});
			});
		},

		cancel() {
			uni.navigateBack();
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 容器：头部 + 滚动区 + 底部三行式布局 ==================== */
.editLightAccurateTimeTable-container {
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

	/* 名称：可编辑输入框（与 115B 准时表编辑页保持一致） */
	.name-input-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		height: 76rpx;
		padding: 0 18rpx;
		margin-right: 16rpx;
		box-sizing: border-box;
		background-color: var(--bg-soft, #f2f4f8);
		border: 2rpx solid var(--border-color, #e6eaf2);
		border-radius: 12rpx;

		.name-input {
			flex: 1;
			min-width: 0;
			height: 76rpx;
			line-height: 76rpx;
			font-size: 28rpx;
			font-weight: bold;
			color: var(--text-primary, #333333);
			background-color: transparent;
		}
	}

	.name-input-wrap.input-error {
		border-color: #f56c6c;
		background-color: rgba(245, 108, 108, 0.08);
	}

	.name-error {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #f56c6c;
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
	padding: 24rpx 24rpx 40rpx;
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

/* ==================== 时段卡片 ==================== */
.period-card {
	background-color: var(--bg-card, #ffffff);
	border: 2rpx solid transparent;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));
}

/* 存在校验错误时高亮整张卡片 */
.period-card.card-has-error {
	border-color: rgba(245, 108, 108, 0.6);
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
		color: var(--text-tertiary, #888888);
		background-color: var(--bg-soft, #f2f4f8);
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

	picker {
		display: block;
	}

	.picker-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 76rpx;
		padding: 0 18rpx;
		box-sizing: border-box;
		background-color: var(--bg-soft, #f2f4f8);
		border: 2rpx solid var(--border-color, #e6eaf2);
		border-radius: 12rpx;

		.picker-text {
			flex: 1;
			min-width: 0;
			text-align: right;
			font-size: 28rpx;
			font-weight: 500;
			color: var(--text-primary, #333333);
		}

		.picker-placeholder {
			font-weight: normal;
			font-size: 26rpx;
			color: #b8bfcc;
		}

		.picker-arrow {
			flex-shrink: 0;
			margin-left: 10rpx;
			font-size: 24rpx;
			color: var(--text-quaternary, #999999);
		}
	}

	.picker-box.input-error {
		border-color: #f56c6c;
		background-color: rgba(245, 108, 108, 0.08);
	}

	.input-wrap {
		display: flex;
		align-items: center;
		height: 76rpx;
		padding: 0 18rpx;
		box-sizing: border-box;
		background-color: var(--bg-soft, #f2f4f8);
		border: 2rpx solid var(--border-color, #e6eaf2);
		border-radius: 12rpx;

		.field-input {
			flex: 1;
			min-width: 0;
			height: 76rpx;
			line-height: 76rpx;
			font-size: 28rpx;
			color: var(--text-primary, #333333);
			background-color: transparent;
			text-align: right;
		}

		.field-unit {
			flex-shrink: 0;
			margin-left: 10rpx;
			font-size: 24rpx;
			color: var(--text-quaternary, #999999);
		}
	}

	.input-wrap.input-error {
		border-color: #f56c6c;
		background-color: rgba(245, 108, 108, 0.08);
	}

	.field-error {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #f56c6c;
	}
}

.scroll-footer-tip {
	padding: 28rpx 8rpx 0;
	text-align: center;
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
}

/* ==================== 底部保存按钮（固定在底部，始终可见） ==================== */
.page-footer {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 -6rpx 20rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.08));
	z-index: 10;

	.btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		padding: 0;
		margin: 0 12rpx;
		font-size: 30rpx;
		border-radius: 12rpx;

		&::after {
			border: none;
		}
	}

	.cancel-btn {
		background-color: var(--bg-soft, #f2f4f8);
		color: var(--text-secondary, #555555);
	}

	.save-btn {
		background: linear-gradient(90deg, #3a7bf7, #5a96ff);
		color: #ffffff;
		font-weight: 500;
	}
}
</style>
