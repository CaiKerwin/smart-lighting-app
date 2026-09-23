<template>
	<view :class="themeClass" class="edit115BAccurateTimeTable-container">
		<!-- ==================== 头部：名称 + 日出日落 + 填写说明（固定，不随卡片滚动） ==================== -->
		<view class="page-header">
			<!-- 时间表名称 -->
			<view class="name-row">
				<text class="name-label">名称</text>
				<view :class="['name-input-wrap', nameError ? 'input-error' : '']">
					<input
						:value="timeTableName"
						class="name-input"
						maxlength="20"
						placeholder="请输入时间表名称"
						placeholder-style="font-size:26rpx;color:#b8bfcc;"
						@blur="validateName"
						@input="onNameInput"
					/>
				</view>
			</view>
			<text v-if="nameError" class="name-error">{{ nameError }}</text>

			<!-- 当日日出 / 日落时间：经纬度模式设置偏移量的参考 -->
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
				<text class="meta-item">经纬度可选日出/日落并设偏移量</text>
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

						<!-- 时钟模式：时分选择器 -->
						<view v-if="isClock(index)" class="row-line time-line">
							<text class="row-label">时间</text>
							<picker :value="pickerValue(index)" mode="time" @change="onTimeChange(index, $event)">
								<view :class="['picker-box time-picker', (errors[index].time || timeOrderErrors[index]) ? 'input-error' : '']">
									<text :class="['picker-text', !period.time ? 'picker-placeholder' : '']">
										{{ period.time || '请选择时和分' }}
									</text>
									<text class="picker-arrow">▾</text>
								</view>
							</picker>
						</view>

						<!-- 经纬度模式：日出/日落 + 偏移方式 + 偏移量 -->
						<view v-else-if="isSun(index)" class="row-line sun-line">
							<picker
								:range="sunLabels"
								:value="sunIndex(index)"
								class="sun-picker"
								mode="selector"
								@change="onSunChange(index, $event)"
							>
								<view class="picker-box">
									<image :src="sunIcon(period.on)" class="sun-icon" mode="aspectFit" />
									<text class="picker-text">{{ sunText(period.on) }}</text>
									<text class="picker-arrow">▾</text>
								</view>
							</picker>
							<picker
								:range="offsetLabels"
								:value="offsetIndex(index)"
								class="offset-picker"
								mode="selector"
								@change="onOffsetChange(index, $event)"
							>
								<view class="picker-box">
									<text class="picker-text">{{ offsetText(period.off) }}</text>
									<text class="picker-arrow">▾</text>
								</view>
							</picker>
							<view class="offset-item">
								<text class="row-label">偏移量</text>
								<view
									:class="['input-wrap', 'offset-input', isOffsetDisabled(index) ? 'input-disabled' : '', errors[index].interval ? 'input-error' : '']"
								>
									<input
										:disabled="isOffsetDisabled(index)"
										:value="period.interval"
										class="field-input"
										maxlength="4"
										placeholder="0"
										placeholder-style="font-size:26rpx;color:#b8bfcc;"
										type="number"
										@blur="onFieldBlur(index, 'interval')"
										@input="onFieldInput(index, 'interval', $event)"
									/>
									<text class="field-unit">分</text>
								</view>
							</view>
						</view>

						<!-- 未启用模式：时间为空 -->
						<view v-else class="row-line time-line">
							<text class="row-label">时间</text>
							<view class="picker-box time-picker disabled-box">
								<text class="picker-text picker-placeholder">未启用</text>
							</view>
						</view>

						<!-- 亮度 / 联动亮度 -->
						<view class="param-row">
							<view v-for="field in fields" :key="field.key" class="param-item">
								<text class="row-label">{{ field.label }}</text>
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
							</view>
						</view>

						<!-- 该时段的校验提示 -->
						<text v-if="firstError(index)" class="field-error">{{ firstError(index) }}</text>
					</view>

					<view class="scroll-footer-tip">
						6 个时段均须设置：未启用模式无需填时间；时钟模式需选择时和分且时间依次递增；经纬度模式选择日出/日落并设置偏移量
					</view>
				</template>
			</view>
		</scroll-view>

		<!-- ==================== 底部：保存按钮（固定在底部，始终可见） ==================== -->
		<view class="page-footer">
			<button class="btn save-btn" @click="saveTimeTable">保存</button>
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

// 模式选项：界面顺序固定为 未启用、经纬度、时钟
const MODE_OPTIONS = [
	{label: '未启用', value: MODE_DISABLED},
	{label: '经纬度', value: MODE_SUN},
	{label: '时钟', value: MODE_CLOCK}
];

// 经纬度时间类型（on）：0-日落时间，1-日出时间
const SUN_OPTIONS = [
	{label: '日出时间', value: 1, icon: '/static/home/sunrise.png'},
	{label: '日落时间', value: 0, icon: '/static/home/sunset.png'}
];

// 经纬度时间偏移（off）：0-无偏移，1-延迟，2-提早
const OFFSET_OPTIONS = [
	{label: '无偏移', value: 0},
	{label: '延迟', value: 1},
	{label: '提早', value: 2}
];

// 偏移量取值范围（分钟）：最大为一天
const OFFSET_MAX = 1440;

// 每个时段可编辑的数值参数：亮度(%)、联动亮度(%)
const FIELD_KEYS = ['bright', 'union'];

// 字段校验规则：只允许整数，范围为 0-100
const FIELD_RULES = {
	bright: {label: '亮度', unit: '%', min: 0, max: 100, tip: '0-100'},
	union: {label: '联动', unit: '%', min: 0, max: 100, tip: '0-100'}
};

// 后端未返回某时段时使用的默认值（时间保持空，模式默认未启用）
const DEFAULT_PERIOD = {mode: MODE_DISABLED, time: '', on: 1, off: 0, interval: 0, bright: 0, union: 100};

// 合法时间格式：HH:mm（00:00 - 23:59）
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

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

// HH:mm 转从 0 点算起的分钟数，非法返回 0
function timeToMinutes(text) {
	const matched = String(text === null || text === undefined ? '' : text).trim().match(/^(\d{1,2}):(\d{1,2})$/);
	if (!matched) return 0;
	return Number(matched[1]) * 60 + Number(matched[2]);
}

// 选项数组中查找值对应的下标（找不到返回 0）
function findOptionIndex(options, value) {
	const target = Number(value);
	for (let i = 0; i < options.length; i++) {
		if (options[i].value === target) return i;
	}
	return 0;
}

// 选项数组中查找值对应的选项（找不到返回第一项）
function findOption(options, value) {
	return options[findOptionIndex(options, value)];
}

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
		const errors = {time: '', interval: ''};
		FIELD_KEYS.forEach((key) => {
			errors[key] = '';
		});
		list.push(errors);
	}
	return list;
}

// 生成 6 个时钟模式时间排序的错误提示（单独存放，避免覆盖"请选择时间"等填写错误）
function createOrderErrors() {
	const list = [];
	for (let i = 0; i < PERIOD_COUNT; i++) {
		list.push('');
	}
	return list;
}

export default {
	name: 'Edit115BAccurateTimeTable',
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
			nameError: '',
			// 当日日出 / 日落时间（仅展示，作为经纬度偏移量的参考）
			sunriseTime: '',
			sunsetTime: '',
			// 6 个时段参数：{ mode, time, on, off, interval, bright, union }
			periods: createPeriods(),
			// 6 个时段的字段错误提示
			errors: createErrors(),
			// 6 个时段的时间排序错误提示（时钟模式下 时间1 < 时间2 < ... < 时间6）
			timeOrderErrors: createOrderErrors(),
			// 界面渲染用字段定义（亮度 / 联动亮度）
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
	computed: {
		// 模式选择器 / 经纬度选择器 / 偏移选择器的文本数组
		modeLabels() {
			return MODE_OPTIONS.map((item) => item.label);
		},
		sunLabels() {
			return SUN_OPTIONS.map((item) => item.label);
		},
		offsetLabels() {
			return OFFSET_OPTIONS.map((item) => item.label);
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
		this.getSunTime();
	},
	methods: {
		/* ==================== 数据转换 ==================== */

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

		// 工作模式规范化：非法值按未启用处理
		toMode(value) {
			const num = this.toNumber(value, MODE_DISABLED);
			return MODE_OPTIONS.some((item) => item.value === num) ? num : MODE_DISABLED;
		},

		// 用接口数据填充 6 个时段（整体替换数组，保证响应式更新）
		fillPeriods() {
			const list = [];
			for (let i = 0; i < PERIOD_COUNT; i++) {
				const source = this.getOriginalPeriod(i) || {};
				const mode = this.toMode(source.mode);
				list.push({
					mode: mode,
					// 时钟模式：interval 为从 0 点算起的分钟数，界面展示为时和分；其余模式时间为空
					time: mode === MODE_CLOCK ? minutesToTime(source.interval) : '',
					// 经纬度时间类型 / 偏移方式：非经纬度模式也原样保留，避免保存时丢字段
					on: findOption(SUN_OPTIONS, this.toNumber(source.on, DEFAULT_PERIOD.on)).value,
					off: findOption(OFFSET_OPTIONS, this.toNumber(source.off, DEFAULT_PERIOD.off)).value,
					// 经纬度模式为偏移量（分钟），时钟模式为从 0 点算起的分钟数
					interval: this.toNumber(source.interval, DEFAULT_PERIOD.interval),
					bright: this.toNumber(source.bright, DEFAULT_PERIOD.bright),
					union: this.toNumber(source.union, DEFAULT_PERIOD.union)
				});
			}
			this.periods = list;
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
						this.originalContent = (detail && detail.content) || {};
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}
						this.fillPeriods();
						this.validateTimeOrder();
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

		// 获取当日日出 / 日落时间（仅作展示，失败不影响编辑）
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

		/* ==================== 展示辅助 ==================== */

		// 当前时段是否为时钟模式
		isClock(index) {
			return Number(this.periods[index].mode) === MODE_CLOCK;
		},

		// 当前时段是否为经纬度模式
		isSun(index) {
			return Number(this.periods[index].mode) === MODE_SUN;
		},

		// 经纬度模式选择"无偏移"时，偏移量输入框不可编辑
		isOffsetDisabled(index) {
			return Number(this.periods[index].off) === 0;
		},

		// 模式文案
		modeText(mode) {
			return findOption(MODE_OPTIONS, mode).label;
		},

		// 模式选择器当前下标
		modeIndex(index) {
			return findOptionIndex(MODE_OPTIONS, this.periods[index].mode);
		},

		// 经纬度时间类型文案 / 图标 / 下标
		sunText(on) {
			return findOption(SUN_OPTIONS, on).label;
		},

		sunIcon(on) {
			return findOption(SUN_OPTIONS, on).icon;
		},

		sunIndex(index) {
			return findOptionIndex(SUN_OPTIONS, this.periods[index].on);
		},

		// 偏移方式文案 / 下标
		offsetText(off) {
			return findOption(OFFSET_OPTIONS, off).label;
		},

		offsetIndex(index) {
			return findOptionIndex(OFFSET_OPTIONS, this.periods[index].off);
		},

		// 时间选择器的 value（picker 需要 HH:mm，空值时回退 00:00）
		pickerValue(index) {
			return this.periods[index].time || '00:00';
		},

		// 取出该时段第一条错误提示（用于卡片底部整体提示）
		firstError(index) {
			const row = this.errors[index] || {};
			if (row.time) return row.time;
			if (this.timeOrderErrors[index]) return this.timeOrderErrors[index];
			if (row.interval) return row.interval;
			for (let i = 0; i < FIELD_KEYS.length; i++) {
				if (row[FIELD_KEYS[i]]) return row[FIELD_KEYS[i]];
			}
			return '';
		},

		// 该时段是否存在错误
		hasCardError(index) {
			return !!this.firstError(index);
		},

		/* ==================== 交互 ==================== */

		// 名称输入
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

		// 切换工作模式
		onModeChange(index, e) {
			const selected = MODE_OPTIONS[Number(e && e.detail ? e.detail.value : 0)];
			const mode = selected ? selected.value : MODE_CLOCK;
			const period = this.periods[index];
			period.mode = mode;

			if (mode === MODE_DISABLED) {
				// 未启用模式：时间为空
				period.time = '';
				this.errors[index].time = '';
				this.errors[index].interval = '';
			} else if (mode === MODE_CLOCK) {
				// 时钟模式：沿用原偏移量对应的时和分（无有效值时保持为空，需用户选择）
				if (!period.time) {
					period.time = minutesToTime(period.interval);
				}
				this.errors[index].interval = '';
			} else {
				// 经纬度模式：偏移量沿用当前值
				this.errors[index].time = '';
			}

			this.validateTime(index);
			this.validateOffset(index);
			this.validateTimeOrder();
		},

		// 切换日出 / 日落
		onSunChange(index, e) {
			const selected = SUN_OPTIONS[Number(e && e.detail ? e.detail.value : 0)];
			this.periods[index].on = selected ? selected.value : SUN_OPTIONS[0].value;
		},

		// 切换偏移方式
		onOffsetChange(index, e) {
			const selected = OFFSET_OPTIONS[Number(e && e.detail ? e.detail.value : 0)];
			this.periods[index].off = selected ? selected.value : 0;
			this.validateOffset(index);
		},

		// 选择时和分后同步数据并即时校验
		onTimeChange(index, e) {
			const value = e && e.detail ? e.detail.value : '';
			this.periods[index].time = value;
			this.validateTime(index);
			// 时间变化后即时校验整体排序
			this.validateTimeOrder();
		},

		// 数值字段输入：已提示错误的字段边输入边校验，通过后立即清除提示
		onFieldInput(index, key, e) {
			const value = e && e.detail ? e.detail.value : '';
			this.periods[index][key] = value;
			if (this.errors[index][key]) {
				if (key === 'interval') {
					this.validateOffset(index);
				} else {
					this.validateField(index, key);
				}
			}
		},

		// 失焦时校验
		onFieldBlur(index, key) {
			if (key === 'interval') {
				this.validateOffset(index);
			} else {
				this.validateField(index, key);
			}
		},

		/* ==================== 校验 ==================== */

		// 时间校验：时钟模式必须为 HH:mm（00:00 - 23:59）
		validateTime(index) {
			if (!this.isClock(index)) {
				this.errors[index].time = '';
				return true;
			}
			const text = String(this.periods[index].time || '').trim();
			let message = '';
			if (!text) {
				message = '请选择时间';
			} else if (!TIME_REGEX.test(text)) {
				message = '时间格式需为 HH:mm';
			}
			this.errors[index].time = message;
			return message === '';
		},

		// 校验时钟模式下 6 个时段的时间依次递增（时间1 < 时间2 < ... < 时间6，严格递增）
		// 未启用 / 经纬度模式的时段没有时钟时间，跳过比较；
		// 返回首个排序出错的时段索引（-1 表示排序正确）
		validateTimeOrder() {
			for (let i = 0; i < PERIOD_COUNT; i++) {
				this.timeOrderErrors[i] = '';
			}
			let firstErrorIndex = -1;
			let prevIndex = -1;
			for (let i = 0; i < PERIOD_COUNT; i++) {
				if (!this.isClock(i)) continue;
				const currText = String(this.periods[i].time || '').trim();
				// 未填写 / 格式非法的时间由 validateTime 提示，这里跳过比较
				if (!TIME_REGEX.test(currText)) continue;
				if (prevIndex > -1) {
					const prevText = String(this.periods[prevIndex].time || '').trim();
					// 时间已规范化为 HH:mm，字符串比较即为时间先后
					if (currText <= prevText) {
						this.timeOrderErrors[i] = `需大于时段${prevIndex + 1}的时间 ${prevText}`;
						if (firstErrorIndex === -1) {
							firstErrorIndex = i;
						}
					}
				}
				prevIndex = i;
			}
			return firstErrorIndex;
		},

		// 偏移量校验：经纬度模式下选择延迟 / 提早时必须填写 0-1440 分钟的整数
		validateOffset(index) {
			if (!this.isSun(index)) {
				this.errors[index].interval = '';
				return true;
			}
			// 无偏移无需填写偏移量
			if (Number(this.periods[index].off) === 0) {
				this.errors[index].interval = '';
				return true;
			}
			const raw = this.periods[index].interval;
			const text = String(raw === null || raw === undefined ? '' : raw).trim();
			let message = '';
			if (!text) {
				message = '请输入偏移量';
			} else if (/^-/.test(text)) {
				message = '偏移量需为正数';
			} else if (!/^\d+$/.test(text)) {
				message = '偏移量仅支持数字';
			} else if (Number(text) > OFFSET_MAX) {
				message = `偏移量不能大于 ${OFFSET_MAX} 分钟`;
			}
			this.errors[index].interval = message;
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

		// 校验全部内容，返回首个出错时段的索引（-1 表示全部通过）
		validateAll() {
			let firstErrorIndex = -1;
			for (let i = 0; i < PERIOD_COUNT; i++) {
				// 1、时钟模式的时间必须填写且格式合法
				const timeOk = this.validateTime(i);
				// 2、经纬度模式的偏移量（选择延迟 / 提早时必填）
				const offsetOk = this.validateOffset(i);
				// 3、亮度 / 联动亮度取值 0-100
				let fieldOk = true;
				for (let k = 0; k < FIELD_KEYS.length; k++) {
					if (!this.validateField(i, FIELD_KEYS[k])) {
						fieldOk = false;
					}
				}
				if (firstErrorIndex === -1 && (!timeOk || !offsetOk || !fieldOk)) {
					firstErrorIndex = i;
				}
			}
			// 4、时钟模式的时间需依次递增
			const orderErrorIndex = this.validateTimeOrder();
			if (firstErrorIndex === -1 && orderErrorIndex > -1) {
				firstErrorIndex = orderErrorIndex;
			}
			return firstErrorIndex;
		},

		/* ==================== 保存 ==================== */

		// 滚动到指定时段卡片
		scrollToCard(index) {
			this.scrollTarget = '';
			this.$nextTick(() => {
				this.scrollTarget = 'period-card-' + index;
			});
		},

		// 组装保存内容：6 个时段各 6 个参数，未展示的字段保留原值
		buildContent() {
			const content = {};
			for (let i = 0; i < PERIOD_COUNT; i++) {
				const origin = this.getOriginalPeriod(i) || {};
				const period = this.periods[i];
				const mode = Number(period.mode);
				// 时钟模式：interval 为从 0 点算起的分钟数；经纬度模式：interval 为偏移量；
				// 未启用模式：时间为空，interval 置 0
				let interval = 0;
				if (mode === MODE_CLOCK) {
					interval = timeToMinutes(period.time);
				} else if (mode === MODE_SUN) {
					interval = this.toNumber(period.interval, 0);
				}
				content[String(i)] = Object.assign({}, origin, {
					mode: mode,
					on: Number(period.on),
					off: Number(period.off),
					interval: interval,
					bright: this.toNumber(period.bright, 0),
					union: this.toNumber(period.union, 100)
				});
			}
			return content;
		},

		// 保存 115B 准时日表
		saveTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '缺少时间表 id，无法保存', icon: 'none'});
				return;
			}

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
			 * POST /station/plan/SaveLight8Detail
			 * {
			 *   "id": 827,
			 *   "name": "测试11",
			 *   "type": 8,                       // 8 固定表示 115B 准时日表
			 *   "content": {
			 *     "0": { "mode": 1, "on": 0, "off": 1, "interval": 540, "bright": 0, "union": 100 },
			 *     ...（共 6 个时段，"0" ~ "5"）
			 *   }
			 * }
			 */
			uni.showLoading({title: '保存中...', mask: true});
			request({
				url: '/station/plan/SaveLight8Detail',
				method: 'POST',
				data: {
					id: this.timeTableId,
					name: String(this.timeTableName || '').trim(),
					content: this.buildContent(),
					type: 8
				}
			}).then(res => {
				uni.hideLoading();
				const payload = res.data || {};
				if (payload.code === 0) {
					// 通知查看页刷新
					uni.$emit('115BAccurateTimeTableUpdated', {id: this.timeTableId});
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
				console.error('保存115B准时日表失败', err.message);
				uni.showToast({title: '保存失败，请重试', icon: 'none'});
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 容器：头部 + 滚动区 + 底部三行式布局 ==================== */
.edit115BAccurateTimeTable-container {
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
	padding: 24rpx 28rpx 20rpx;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));
	z-index: 10;

	/* 名称行 */
	.name-row {
		display: flex;
		align-items: center;

		.name-label {
			flex-shrink: 0;
			width: 92rpx;
			font-size: 30rpx;
			font-weight: 600;
			color: var(--text-primary, #333333);
		}

		.name-input-wrap {
			flex: 1;
			min-width: 0;
			display: flex;
			align-items: center;
			height: 76rpx;
			padding: 0 18rpx;
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
				color: var(--text-primary, #333333);
				background-color: transparent;
			}
		}

		.name-input-wrap.input-error {
			border-color: #f56c6c;
			background-color: rgba(245, 108, 108, 0.08);
		}
	}

	.name-error {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #f56c6c;
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

	.picker-placeholder {
		font-weight: normal;
		font-size: 24rpx;
		color: #b8bfcc;
	}

	.picker-arrow {
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

.picker-box.input-error {
	border-color: #f56c6c;
	background-color: rgba(245, 108, 108, 0.08);
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

/* 选择"无偏移"时偏移量输入框不可编辑 */
.input-wrap.input-disabled {
	background-color: var(--bg-page, #f8f8f8);

	.field-input {
		color: var(--text-quaternary, #999999);
	}
}

/* ==================== 时间 / 经纬度行 ==================== */
.row-line {
	display: flex;
	align-items: center;
}

/* 行内标签（时间 / 偏移量 / 亮度 / 联动） */
.row-label {
	flex-shrink: 0;
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

/* 时钟模式：时间 */
.time-line {
	.row-label {
		width: 92rpx;
	}

	.time-picker {
		width: 280rpx;
	}
}

/* 经纬度模式：日出日落 + 偏移方式 + 偏移量 */
.sun-line {
	.sun-picker {
		flex: 1;
		min-width: 0;
		margin-right: 12rpx;
	}

	.offset-picker {
		flex-shrink: 0;
		width: 160rpx;
		margin-right: 12rpx;
	}

	.offset-item {
		flex-shrink: 0;
		display: flex;
		align-items: center;

		.row-label {
			font-size: 24rpx;
			margin-right: 8rpx;
		}

		.offset-input {
			width: 140rpx;
		}
	}
}

/* 未启用模式：只读的占位框 */
.disabled-box {
	background-color: var(--bg-soft, #f2f4f8);
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

		.input-wrap {
			flex: 1;
			min-width: 0;
		}
	}
}

.field-error {
	display: block;
	margin-top: 14rpx;
	font-size: 22rpx;
	color: #f56c6c;
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
	padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 -6rpx 20rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.08));
	z-index: 10;

	.btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		padding: 0;
		margin: 0;
		font-size: 30rpx;
		border-radius: 12rpx;

		&::after {
			border: none;
		}
	}

	.save-btn {
		background: linear-gradient(90deg, #3a7bf7, #5a96ff);
		color: #ffffff;
		font-weight: 500;
	}
}
</style>
