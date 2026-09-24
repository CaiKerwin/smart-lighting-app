<template>
	<view :class="themeClass" class="editLightIntensityTimeTable-container">
		<!-- ==================== 头部：时间表名称介绍 ==================== -->
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
				<view class="tt-badge">照度日表</view>
			</view>
			<text v-if="nameError" class="name-error">{{ nameError }}</text>
			<view class="header-meta">
				<text class="meta-item">照度满足「方式 + 照度」条件时执行设定亮度</text>
				<text class="meta-divider" />
				<text class="meta-item">未启用的时段不生效</text>
			</view>
		</view>

		<!-- ==================== 时段卡片：固定 6 张 ==================== -->
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
						<!-- 卡片头部：时段序号 + 模式选择 -->
						<view class="card-head">
							<view class="head-left">
								<view class="index-badge">{{ index + 1 }}</view>
								<text class="card-title">时段{{ index + 1 }}</text>
							</view>
							<view class="mode-box">
								<text class="mode-label">模式</text>
								<picker
									:range="modeLabels"
									:value="modeIndex(index)"
									mode="selector"
									@change="onModeChange(index, $event)"
								>
									<view class="picker-box mode-picker">
										<text class="picker-text">{{ modeText(period.mode) }}</text>
										<text class="picker-arrow">▾</text>
									</view>
								</picker>
							</view>
						</view>

						<!-- 参数区：照度(lx) / 方式 / 亮度(%) / 联动亮度(%) -->
						<view class="field-grid">
							<!-- 照度阈值 -->
							<view class="field">
								<text class="field-label">照度(lx)</text>
								<view :class="['input-wrap', errors[index].value ? 'input-error' : '']">
									<input
										:maxlength="5"
										:placeholder="luxRule.tip"
										:value="periods[index].value"
										class="field-input"
										placeholder-style="font-size:26rpx;color:#b8bfcc;"
										type="number"
										@blur="onFieldBlur(index, 'value')"
										@input="onFieldInput(index, 'value', $event)"
									/>
									<text class="field-unit">lx</text>
								</view>
								<text v-if="errors[index].value" class="field-error">{{ errors[index].value }}</text>
							</view>

							<!-- 比较方式：大于 / 小于 -->
							<view class="field">
								<text class="field-label">方式</text>
								<picker
									:range="typeLabels"
									:value="typeIndex(index)"
									mode="selector"
									@change="onTypeChange(index, $event)"
								>
									<view class="picker-box">
										<text class="picker-text">{{ typeText(periods[index].type) }}</text>
										<text class="picker-arrow">▾</text>
									</view>
								</picker>
							</view>

							<!-- 亮度 / 联动亮度 -->
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
						共 6 个时段：未启用的时段不生效，其照度、亮度可留空（保存时按 0 处理）；启用时段需填写照度（1-65535）与亮度、联动亮度（0-100）
					</view>
				</template>
			</view>
		</scroll-view>

		<!-- ==================== 底部：保存按钮 ==================== -->
		<view class="page-footer">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="saveTimeTable">保存</button>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 照度日表固定 6 个时段
const PERIOD_COUNT = 6;

// 模式（mode）：0-未启用，1-启用
const MODE_DISABLED = 0;
const MODE_ENABLE = 1;

// 比较方式（type）：0-小于(<)，1-大于(>)
const TYPE_LESS = 0;
const TYPE_GREATER = 1;

// 模式选项：界面顺序固定为 启用、未启用
const MODE_OPTIONS = [
	{label: '启用', value: MODE_ENABLE},
	{label: '未启用', value: MODE_DISABLED}
];

// 方式选项：界面顺序固定为 小于、大于
const TYPE_OPTIONS = [
	{label: '小于 (<)', value: TYPE_LESS},
	{label: '大于 (>)', value: TYPE_GREATER}
];

// 照度阈值上限（lx）
const LUX_MAX = 65535;

// 需要校验的数值字段（照度单独整行展示，这里指网格中的三个数值字段）
const FIELD_KEYS = ['value', 'bright', 'union'];

// 网格中循环渲染的百分比字段（照度 / 方式单独渲染）
const PERCENT_KEYS = ['bright', 'union'];

// 字段校验规则：只允许整数；照度需大于 0，百分比为 0-100
const FIELD_RULES = {
	value: {label: '照度', unit: 'lx', min: 1, max: LUX_MAX, tip: `1-${LUX_MAX}`},
	bright: {label: '亮度', unit: '%', min: 0, max: 100, tip: '0-100'},
	union: {label: '联动亮度', unit: '%', min: 0, max: 100, tip: '0-100'}
};

// 后端未返回某时段时使用的默认值（模式默认未启用、方式默认小于）
const DEFAULT_PERIOD = {mode: MODE_DISABLED, value: 0, type: TYPE_LESS, bright: 0, union: 0};

// 选项数组中查找值对应的下标（找不到返回 0）
function findOptionIndex(options, value) {
	const target = Number(value);
	for (let i = 0; i < options.length; i++) {
		if (options[i].value === target) return i;
	}
	return 0;
}

// 生成 6 个时段的空白数据
function createPeriods() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		list.push(Object.assign({}, DEFAULT_PERIOD));
	}
	return list;
}

// 生成 6 组字段错误提示
function createErrors() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		const errors = {};
		FIELD_KEYS.forEach((key) => {
			errors[key] = '';
		});
		list.push(errors);
	}
	return list;
}

export default {
	name: 'EditLightIntensityTimeTable',
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
			// 6 个时段参数：{ mode, value(照度), type(方式), bright, union }
			periods: createPeriods(),
			// 6 个时段的字段错误提示
			errors: createErrors(),
			// 照度字段的校验规则（模板中用于占位提示）
			luxRule: FIELD_RULES.value,
			// 界面渲染用字段定义（亮度 / 联动亮度）
			fields: PERCENT_KEYS.map((key) => ({
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
	computed: {
		// 模式 / 方式选择器的文本数组
		modeLabels() {
			return MODE_OPTIONS.map((item) => item.label);
		},
		typeLabels() {
			return TYPE_OPTIONS.map((item) => item.label);
		}
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
		/* ==================== 数据转换 ==================== */

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

		// 模式规范化：非法值按未启用处理
		toMode(value) {
			const num = this.toNumber(value, MODE_DISABLED);
			return MODE_OPTIONS.some((item) => item.value === num) ? num : MODE_DISABLED;
		},

		// 比较方式规范化：非法值按小于处理
		toType(value) {
			const num = this.toNumber(value, TYPE_LESS);
			return TYPE_OPTIONS.some((item) => item.value === num) ? num : TYPE_LESS;
		},

		// 用接口数据填充 6 个时段（整体替换数组，保证响应式更新）
		fillPeriods() {
			const list = [];
			for (let i = 0; i < PERIOD_COUNT; i++) {
				const source = this.getOriginalPeriod(i) || {};
				list.push({
					mode: this.toMode(source.mode),
					value: this.toNumber(source.value, DEFAULT_PERIOD.value),
					type: this.toType(source.type),
					bright: this.toNumber(source.bright, DEFAULT_PERIOD.bright),
					union: this.toNumber(source.union, DEFAULT_PERIOD.union)
				});
			}
			this.periods = list;
		},

		/* ==================== 详情 ==================== */

		// 获取照度日表详情
		getTimeTableDetail() {
			this.loading = true;
			this.loadError = false;
			/**
			 * POST /station/plan/QueryLight9Detail   { "id": 1258 }
			 * 返回 content：
			 * {
			 *   "0": { "bright": 10, "mode": 1, "type": 1, "union": 100, "value": 800 },
			 *   ...（共 6 个时段，"0" ~ "5"）
			 * }
			 * mode：0-未启用，1-启用；type：0-小于(<)，1-大于(>)；
			 * value：照度阈值(lx)；bright：亮度(%)；union：联动亮度(%)
			 */
			request({
				url: '/station/plan/QueryLight9Detail',
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
						console.error('照度日表详情解析失败', e);
						this.loading = false;
						this.loadError = true;
						uni.showToast({title: '时间表详情解析失败', icon: 'none'});
					}
				} else {
					this.loading = false;
					this.loadError = true;
					uni.showToast({title: '获取照度日表详情异常', icon: 'none'});
				}
			}).catch(err => {
				this.loading = false;
				this.loadError = true;
				console.error('获取照度日表详情错误', err.message);
				uni.showToast({title: '获取时间表详情失败', icon: 'none'});
			});
		},

		/* ==================== 展示辅助 ==================== */

		// 当前时段是否为启用模式
		isEnabled(index) {
			return Number(this.periods[index].mode) === MODE_ENABLE;
		},

		// 模式文案
		modeText(mode) {
			const target = Number(mode);
			const option = MODE_OPTIONS.find((item) => item.value === target);
			return option ? option.label : MODE_OPTIONS[MODE_OPTIONS.length - 1].label;
		},

		// 模式选择器当前下标
		modeIndex(index) {
			return findOptionIndex(MODE_OPTIONS, this.periods[index].mode);
		},

		// 比较方式文案（type：0-小于(<)，1-大于(>)）
		typeText(type) {
			const target = Number(type);
			const option = TYPE_OPTIONS.find((item) => item.value === target);
			return option ? option.label : TYPE_OPTIONS[0].label;
		},

		// 方式选择器当前下标
		typeIndex(index) {
			return findOptionIndex(TYPE_OPTIONS, this.periods[index].type);
		},

		/* ==================== 交互 ==================== */

		// 选择模式：未启用只代表该时段不生效，其余参数仍可预填
		onModeChange(index, e) {
			const value = e && e.detail ? Number(e.detail.value) : 0;
			const option = MODE_OPTIONS[value] || MODE_OPTIONS[MODE_OPTIONS.length - 1];
			this.periods[index].mode = option.value;
			// 模式变化会影响必填规则，立即重校验该时段
			this.validatePeriod(index);
		},

		// 选择比较方式
		onTypeChange(index, e) {
			const value = e && e.detail ? Number(e.detail.value) : 0;
			const option = TYPE_OPTIONS[value] || TYPE_OPTIONS[0];
			this.periods[index].type = option.value;
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

		/* ==================== 校验 ==================== */

		/**
		 * 单字段校验：必须为整数且在取值范围内
		 * 未启用时段的字段允许留空或填 0（保存时按 0 处理），避免未生效的时段阻塞保存
		 */
		validateField(index, key) {
			const rule = FIELD_RULES[key];
			const enabled = this.isEnabled(index);
			const raw = this.periods[index][key];
			const text = String(raw === null || raw === undefined ? '' : raw).trim();
			let message = '';

			if (!text) {
				message = enabled ? `请输入${rule.label}` : '';
			} else if (/^-/.test(text)) {
				// 负数
				message = `${rule.label}需为正数`;
			} else if (!/^\d+$/.test(text)) {
				// 含字母、小数点等非数字内容
				message = `${rule.label}仅支持数字`;
			} else if (Number(text) === 0 && !enabled) {
				// 未启用时段允许填 0
				message = '';
			} else if (Number(text) < rule.min) {
				message = rule.min === 1 ? `${rule.label}需大于 0` : `${rule.label}不能小于 ${rule.min}`;
			} else if (Number(text) > rule.max) {
				message = `${rule.label}不能大于 ${rule.max}`;
			}

			this.errors[index][key] = message;
			return message === '';
		},

		// 校验某个时段的全部数值字段
		validatePeriod(index) {
			let ok = true;
			for (let k = 0; k < FIELD_KEYS.length; k++) {
				if (!this.validateField(index, FIELD_KEYS[k])) {
					ok = false;
				}
			}
			return ok;
		},

		// 校验全部时段，返回首个出错时段的索引（-1 表示全部通过）
		validateAll() {
			let firstErrorIndex = -1;
			for (let i = 0; i < PERIOD_COUNT; i++) {
				if (!this.validatePeriod(i) && firstErrorIndex === -1) {
					firstErrorIndex = i;
				}
			}
			return firstErrorIndex;
		},

		// 该时段是否存在字段错误
		hasCardError(index) {
			const row = this.errors[index] || {};
			return FIELD_KEYS.some((key) => !!row[key]);
		},

		/* ==================== 保存 ==================== */

		// 滚动到指定时段卡片
		scrollToCard(index) {
			this.scrollTarget = '';
			this.$nextTick(() => {
				this.scrollTarget = 'period-card-' + index;
			});
		},

		// 组装保存内容：6 个时段各 5 个参数，未展示的字段保留原值
		buildContent() {
			const content = {};
			for (let i = 0; i < PERIOD_COUNT; i++) {
				const origin = this.getOriginalPeriod(i) || {};
				const period = this.periods[i];
				content[String(i)] = Object.assign({}, origin, {
					mode: Number(period.mode) === MODE_ENABLE ? MODE_ENABLE : MODE_DISABLED,
					value: this.toNumber(period.value, 0),
					type: Number(period.type) === TYPE_GREATER ? TYPE_GREATER : TYPE_LESS,
					bright: this.toNumber(period.bright, 0),
					union: this.toNumber(period.union, 0)
				});
			}
			return content;
		},

		// 保存照度日表
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
			 * POST /station/plan/SaveLight9Detail
			 * {
			 *   "id": 1258,
			 *   "name": "照度测试",
			 *   "content": {
			 *     "0": { "bright": 10, "mode": 1, "type": 1, "union": 100, "value": 800 },
			 *     ...（共 6 个时段，"0" ~ "5"）
			 *   }
			 * }
			 * mode：0-未启用，1-启用；type：0-小于(<)，1-大于(>)；
			 * value：照度阈值(lx)；bright：亮度(%)；union：联动亮度(%)
			 */
			uni.showLoading({title: '保存中...', mask: true});
			request({
				url: '/station/plan/SaveLight9Detail',
				method: 'POST',
				data: {
					id: this.timeTableId,
					name: String(this.timeTableName || '').trim(),
					content: this.buildContent()
				}
			}).then(res => {
				uni.hideLoading();
				const payload = res.data || {};
				if (payload.code === 0) {
					// 通知查看页刷新
					uni.$emit('lightIntensityTimeTableUpdated', {id: this.timeTableId});
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
				console.error('保存照度日表失败', err.message);
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
.editLightIntensityTimeTable-container {
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

	/* 名称：可编辑输入框（与单灯准时表编辑页保持一致） */
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

	/* 模式选择 */
	.mode-box {
		flex-shrink: 0;
		display: flex;
		align-items: center;

		.mode-label {
			font-size: 26rpx;
			color: var(--text-secondary, #666666);
			margin-right: 12rpx;
		}
	}
}

/* ==================== 通用选择器 / 输入框 ==================== */
.picker-box {
	display: flex;
	align-items: center;
	height: 76rpx;
	padding: 0 16rpx;
	box-sizing: border-box;
	background-color: var(--bg-soft, #f2f4f8);
	border: 2rpx solid var(--border-color, #e6eaf2);
	border-radius: 12rpx;

	.picker-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 28rpx;
		font-weight: 500;
		color: var(--text-primary, #333333);
	}

	.picker-arrow {
		flex-shrink: 0;
		margin-left: 8rpx;
		font-size: 24rpx;
		color: var(--text-quaternary, #999999);
	}
}

.mode-picker {
	width: 200rpx;
}

.input-wrap {
	display: flex;
	align-items: center;
	height: 76rpx;
	padding: 0 16rpx;
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
		margin-left: 8rpx;
		font-size: 24rpx;
		color: var(--text-quaternary, #999999);
	}
}

.input-wrap.input-error {
	border-color: #f56c6c;
	background-color: rgba(245, 108, 108, 0.08);
}

/* ==================== 照度 / 方式 / 亮度 / 联动亮度：2 列网格 ==================== */
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
