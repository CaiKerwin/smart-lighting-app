<template>
	<view :class="themeClass" class="editZhiLianXinTongTimeTable-container">
		<!-- ==================== 头部：名称 + 新增动作 + 说明 ==================== -->
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
				<view class="tt-badge">智联信通</view>
			</view>
			<text v-if="nameError" class="name-error">{{ nameError }}</text>

			<!-- 动作数量 + 新增动作 -->
			<view class="action-toolbar">
				<text class="count-text">共 {{ actions.length }} 个动作（最多 {{ maxActionCount }} 个）</text>
				<view :class="['add-btn', actions.length >= maxActionCount ? 'add-disabled' : '']" @click="addAction">
					<text class="add-icon">＋</text>
					<text class="add-text">新增动作</text>
				</view>
			</view>

			<view class="header-meta">
				<text class="meta-item">周范围默认全选</text>
				<text class="meta-divider" />
				<text class="meta-item">删除动作后序号自动重排</text>
			</view>
		</view>

		<!-- ==================== 动作卡片：数量可变，仅此区域上下滚动 ==================== -->
		<scroll-view
			:scroll-into-view="scrollTarget"
			:scroll-with-animation="true"
			:show-scrollbar="false"
			class="action-scroll"
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

				<!-- 动作卡片列表 -->
				<template v-else>
					<view
						v-for="(action, index) in actions"
						:id="'action-card-' + index"
						:key="action.key"
						:class="['action-card', hasCardError(index) ? 'card-has-error' : '']"
					>
						<!-- 卡片头部：动作序号 + 删除 -->
						<view class="card-head">
							<view class="head-left">
								<view class="index-badge">{{ index + 1 }}</view>
								<text class="card-title">动作{{ index + 1 }}</text>
							</view>
							<view
								:class="['delete-btn', actions.length <= 1 ? 'delete-disabled' : '']"
								@click="confirmDelete(index)"
							>
								<text class="delete-text">删除</text>
							</view>
						</view>

						<!-- 周范围：7 天多选，默认全选 -->
						<view class="field-block">
							<text class="field-label">周范围</text>
							<view class="week-grid">
								<view
									v-for="(day, dayIndex) in weekLabels"
									:key="dayIndex"
									:class="['week-chip', action.weeks[dayIndex] ? 'chip-active' : '']"
									@click="toggleWeek(index, dayIndex)"
								>
									<text class="chip-text">{{ day }}</text>
								</view>
							</view>
							<text v-if="errors[index].weeks" class="field-error">{{ errors[index].weeks }}</text>
						</view>

						<!-- 动作方式：正常时间 / 日出前 / 日出后 / 日落前 / 日落后 -->
						<view class="field-block">
							<text class="field-label">动作</text>
							<picker
								:range="modeLabels"
								:value="modeIndex(index)"
								mode="selector"
								@change="onModeChange(index, $event)"
							>
								<view class="picker-box">
									<text class="picker-text">{{ modeText(action.mode) }}</text>
									<text class="picker-arrow">▾</text>
								</view>
							</picker>
						</view>

						<!-- 时间：只能选择时和分 -->
						<view class="field-block">
							<text class="field-label">时间</text>
							<view class="time-row">
								<picker
									:range="hourRange"
									:value="hourIndex(index)"
									class="time-picker"
									mode="selector"
									@change="onHourChange(index, $event)"
								>
									<view class="picker-box time-box">
										<text class="picker-text">{{ action.hour }}</text>
										<text class="picker-arrow">▾</text>
									</view>
								</picker>
								<text class="time-unit">小时</text>
								<picker
									:range="minuteRange"
									:value="minuteIndex(index)"
									class="time-picker"
									mode="selector"
									@change="onMinuteChange(index, $event)"
								>
									<view class="picker-box time-box">
										<text class="picker-text">{{ action.minute }}</text>
										<text class="picker-arrow">▾</text>
									</view>
								</picker>
								<text class="time-unit">分钟</text>
							</view>
							<text class="field-tip">{{ timeTip(action) }}</text>
						</view>

						<!-- 亮度 -->
						<view class="field-block">
							<text class="field-label">亮度(%)</text>
							<view :class="['input-wrap', errors[index].bright ? 'input-error' : '']">
								<input
									:maxlength="3"
									:value="action.bright"
									class="field-input"
									placeholder="0-100"
									placeholder-style="font-size:28rpx;color:#b8bfcc;"
									type="number"
									@blur="onBrightBlur(index)"
									@input="onBrightInput(index, $event)"
								/>
								<text class="field-unit">%</text>
							</view>
							<text v-if="errors[index].bright" class="field-error">{{ errors[index].bright }}</text>
						</view>
					</view>

					<view class="scroll-footer-tip">
						共 {{ actions.length }} 个动作：周范围至少勾选一天；时间只能选择时和分，正常时间按设定时刻执行，其余方式表示相对日出/日落的时间；亮度取值 0-100
					</view>
				</template>
			</view>
		</scroll-view>

		<!-- ==================== 底部：取消 / 保存 ==================== -->
		<view class="page-footer">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="saveTimeTable">保存</button>
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
 * 0-正常时间（默认），1-日出前，2-日出后，3-日落前，4-日落后
 */
const MODE_OPTIONS = [
	{label: '正常时间', value: 0},
	{label: '日出前', value: 1},
	{label: '日出后', value: 2},
	{label: '日落前', value: 3},
	{label: '日落后', value: 4}
];

// 正常时间：按设定的时和分执行；其余方式为相对日出/日落的时间
const MODE_NORMAL = 0;

// 默认动作数量（与 PC 端一致：默认 4 个动作）
const DEFAULT_ACTION_COUNT = 4;
// 至少保留 1 个动作
const MIN_ACTION_KEEP = 1;
// 动作数量上限：最多 10 个动作
const MAX_ACTION_COUNT = 10;

// 时间可选范围：时 0-23，分 0-59
const HOUR_RANGE = Array.from({length: 24}, (v, i) => i);
const MINUTE_RANGE = Array.from({length: 60}, (v, i) => i);

// 亮度取值范围（%）
const BRIGHT_MIN = 0;
const BRIGHT_MAX = 100;

// 默认动作：周范围全选、正常时间、00:00、亮度 100（与 PC 端默认一致）
const DEFAULT_ACTION = {
	weeks: [true, true, true, true, true, true, true],
	mode: MODE_NORMAL,
	hour: 0,
	minute: 0,
	bright: 100
};

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

// 生成一个新的默认动作（含自增 key，保证列表增删后渲染稳定）
function createAction(key) {
	return {
		key: key,
		weeks: [].concat(DEFAULT_ACTION.weeks),
		mode: DEFAULT_ACTION.mode,
		hour: DEFAULT_ACTION.hour,
		minute: DEFAULT_ACTION.minute,
		bright: DEFAULT_ACTION.bright,
		// 接口返回的原始数据（保存时保留未展示的字段）
		original: {}
	};
}

// 生成一个动作的字段错误提示（键固定，保证响应式）
function createActionError() {
	return {weeks: '', bright: ''};
}

// 转整数：非法或空值回退默认值
function toInt(value, fallback) {
	const text = String(value === null || value === undefined ? '' : value).trim();
	const num = Number(text);
	return text === '' || isNaN(num) ? fallback : Math.floor(num);
}

// 取给定范围内的整数，超出范围时取边界值
function clampInt(value, min, max) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

// 规范化星期数组：始终返回 7 个布尔值
function normalizeWeeks(weeks) {
	const list = [];
	for (let i = 0; i < WEEK_LABELS.length; i++) {
		list.push(!!(weeks && weeks[i]));
	}
	return list;
}

export default {
	name: 'EditZhiLianXinTongTimeTable',
	data() {
		return {
			// 页面状态
			loading: true,
			loadError: false,
			// 时间表基本信息
			timeTableId: null,
			timeTableName: '',
			nameError: '',
			// 星期文案（顺序固定：周日 ~ 周六）
			weekLabels: WEEK_LABELS,
			// 时 / 分选项
			hourRange: HOUR_RANGE,
			minuteRange: MINUTE_RANGE,
			// 动作列表：{ key, weeks[7], mode, hour, minute, bright, original }
			actions: [],
			// 动作数量上限（最多 10 个，与后端/设备一致）
			maxActionCount: MAX_ACTION_COUNT,
			// 每个动作的字段错误提示（与 actions 一一对应）
			errors: [],
			// 自增 key
			actionKey: 0,
			// 校验失败时滚动定位到对应卡片
			scrollTarget: ''
		};
	},
	computed: {
		// 动作方式选择器的文本数组
		modeLabels() {
			return MODE_OPTIONS.map((item) => item.label);
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

		// 动作方式文案
		modeText(mode) {
			if (mode === null || mode === undefined || mode === '') return MODE_OPTIONS[0].label;
			return findOption(MODE_OPTIONS, mode).label;
		},

		// 动作方式选择器当前下标
		modeIndex(index) {
			return findOptionIndex(MODE_OPTIONS, this.actions[index].mode);
		},

		// 时 / 分选择器当前下标（下标与数值一致：0-23、0-59）
		hourIndex(index) {
			return clampInt(toInt(this.actions[index].hour, 0), 0, HOUR_RANGE.length - 1);
		},

		minuteIndex(index) {
			return clampInt(toInt(this.actions[index].minute, 0), 0, MINUTE_RANGE.length - 1);
		},

		// 时间填写提示：正常时间按时刻执行，其余方式为相对日出/日落的时间
		timeTip(action) {
			const mode = Number(action.mode);
			if (mode === MODE_NORMAL) return '正常时间：按设定的时和分执行';
			return `${this.modeText(mode)}：相对日出/日落的时间`;
		},

		// 用接口数据填充动作列表（整体替换数组，保证响应式更新）
		fillActions(list) {
			const source = Array.isArray(list) ? list : [];
			const actions = [];
			// 接口返回多少动作就展示多少，不做截断，避免保存时丢失原有动作
			for (let i = 0; i < source.length; i++) {
				const item = source[i] || {};
				let hour = toInt(item.hour, DEFAULT_ACTION.hour);
				let minute = toInt(item.minute, DEFAULT_ACTION.minute);
				// 时 / 分只能在 0-23、0-59 之间，异常值按边界处理
				if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
					console.warn('智联信通时间表时间超出可选范围，已按边界处理', hour, minute);
					hour = clampInt(hour, 0, 23);
					minute = clampInt(minute, 0, 59);
				}
				actions.push({
					key: ++this.actionKey,
					weeks: normalizeWeeks(item.weeks),
					mode: findOption(MODE_OPTIONS, item.mode).value,
					hour: hour,
					minute: minute,
					bright: toInt(item.bright, DEFAULT_ACTION.bright),
					original: item
				});
			}

			// 后端未返回动作时，按默认 4 个动作展示（首次进入即可直接编辑保存）
			if (actions.length === 0) {
				for (let i = 0; i < DEFAULT_ACTION_COUNT; i++) {
					actions.push(createAction(++this.actionKey));
				}
			}

			this.actions = actions;
			this.errors = actions.map(() => createActionError());
		},

		// 新增动作
		addAction() {
			if (this.actions.length >= MAX_ACTION_COUNT) {
				uni.showToast({title: `最多只能设置 ${MAX_ACTION_COUNT} 个动作`, icon: 'none'});
				return;
			}
			this.actions.push(createAction(++this.actionKey));
			this.errors.push(createActionError());
			// 新增的动作在列表末尾，滚动到该卡片方便继续填写
			this.scrollToCard(this.actions.length - 1);
		},

		// 删除确认：删除后动作序号自动重排
		confirmDelete(index) {
			if (this.actions.length <= MIN_ACTION_KEEP) {
				uni.showToast({title: '至少保留一个动作', icon: 'none'});
				return;
			}
			uni.showModal({
				title: '提示',
				content: `确定删除动作${index + 1}？删除后动作序号将重新排列`,
				success: (res) => {
					if (res.confirm) {
						this.deleteAction(index);
					}
				}
			});
		},

		// 删除动作：数组移除后，界面上的序号由下标重新生成，实现自动重排
		deleteAction(index) {
			this.actions.splice(index, 1);
			this.errors.splice(index, 1);
		},

		/* ==================== 交互 ==================== */

		// 勾选 / 取消勾选某一天
		toggleWeek(index, dayIndex) {
			const weeks = this.actions[index].weeks;
			weeks.splice(dayIndex, 1, !weeks[dayIndex]);
			// 已提示错误时立即重校验，勾选后马上清除提示
			if (this.errors[index].weeks) {
				this.validateWeeks(index);
			}
		},

		// 选择动作方式
		onModeChange(index, e) {
			const value = e && e.detail ? Number(e.detail.value) : 0;
			const option = MODE_OPTIONS[value] || MODE_OPTIONS[0];
			this.actions[index].mode = option.value;
		},

		// 选择小时
		onHourChange(index, e) {
			const value = e && e.detail ? toInt(e.detail.value, 0) : 0;
			this.actions[index].hour = clampInt(value, 0, HOUR_RANGE.length - 1);
		},

		// 选择分钟
		onMinuteChange(index, e) {
			const value = e && e.detail ? toInt(e.detail.value, 0) : 0;
			this.actions[index].minute = clampInt(value, 0, MINUTE_RANGE.length - 1);
		},

		// 亮度输入：同步数据；已提示错误时边输入边校验
		onBrightInput(index, e) {
			const value = e && e.detail ? e.detail.value : '';
			this.actions[index].bright = value;
			if (this.errors[index].bright) {
				this.validateBright(index);
			}
		},

		// 亮度失焦校验
		onBrightBlur(index) {
			this.validateBright(index);
		},

		/* ==================== 校验 ==================== */

		// 周范围校验：至少勾选一天
		validateWeeks(index) {
			const weeks = this.actions[index].weeks || [];
			const message = weeks.some((day) => !!day) ? '' : '请至少勾选一个星期';
			this.errors[index].weeks = message;
			return message === '';
		},

		// 亮度校验：必须为 0-100 的整数
		validateBright(index) {
			const raw = this.actions[index].bright;
			const text = String(raw === null || raw === undefined ? '' : raw).trim();
			let message = '';
			if (!text) {
				message = '请输入亮度';
			} else if (/^-/.test(text)) {
				message = '亮度不能为负数';
			} else if (!/^\d+$/.test(text)) {
				message = '亮度仅支持整数';
			} else if (Number(text) > BRIGHT_MAX) {
				message = `亮度不能大于 ${BRIGHT_MAX}`;
			} else if (Number(text) < BRIGHT_MIN) {
				message = `亮度不能小于 ${BRIGHT_MIN}`;
			}
			this.errors[index].bright = message;
			return message === '';
		},

		// 校验单个动作
		validateAction(index) {
			const weeksOk = this.validateWeeks(index);
			const brightOk = this.validateBright(index);
			return weeksOk && brightOk;
		},

		// 校验全部动作，返回首个出错动作的下标（-1 表示全部通过）
		validateAll() {
			let firstErrorIndex = -1;
			for (let i = 0; i < this.actions.length; i++) {
				if (!this.validateAction(i) && firstErrorIndex === -1) {
					firstErrorIndex = i;
				}
			}
			return firstErrorIndex;
		},

		// 该动作是否存在字段错误
		hasCardError(index) {
			const row = this.errors[index] || {};
			return !!row.weeks || !!row.bright;
		},

		/* ==================== 详情 ==================== */

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
						this.fillActions(content.list);
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

		/* ==================== 保存 ==================== */

		// 滚动到指定动作卡片
		scrollToCard(index) {
			this.scrollTarget = '';
			this.$nextTick(() => {
				this.scrollTarget = 'action-card-' + index;
			});
		},

		// 组装保存内容：动作顺序即接口 list 顺序
		buildContent() {
			const list = this.actions.map((action) => Object.assign({}, action.original, {
				weeks: normalizeWeeks(action.weeks),
				mode: findOption(MODE_OPTIONS, action.mode).value,
				hour: clampInt(toInt(action.hour, 0), 0, 23),
				minute: clampInt(toInt(action.minute, 0), 0, 59),
				bright: toInt(action.bright, 0)
			}));
			return {list: list};
		},

		// 保存前校验
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
				uni.showToast({title: `动作${firstErrorIndex + 1} 填写有误，请检查`, icon: 'none'});
				return;
			}

			uni.showModal({
				title: '提示',
				content: `确定保存当前智联信通时间表？`,
				success: (res) => {
					if (res.confirm) {
						this.submitSave();
					}
				}
			});
		},

		submitSave() {
			/**
			 * POST /station/plan/SaveLight10Detail
			 * {
			 *   "id": 1259,
			 *   "name": "11122121",
			 *   "content": {
			 *     "list": [
			 *       {
			 *         "weeks": [true, true, true, true, true, true, true],
			 *         "mode": 1,     // 0-正常时间，1-日出前，2-日出后，3-日落前，4-日落后
			 *         "hour": 0,
			 *         "minute": 0,
			 *         "bright": 100
			 *       }
			 *     ]
			 *   },
			 *   "type": 10
			 * }
			 */
			uni.showLoading({title: '保存中...', mask: true});
			request({
				url: '/station/plan/SaveLight10Detail',
				method: 'POST',
				data: {
					id: this.timeTableId,
					name: String(this.timeTableName || '').trim(),
					content: this.buildContent(),
					type: 10
				}
			}).then(res => {
				uni.hideLoading();
				const payload = res.data || {};
				if (payload.code === 0) {
					// 通知查看页刷新
					uni.$emit('zhiLianXinTongTimeTableUpdated', {id: this.timeTableId});
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
				console.error('保存智联信通时间表失败', err.message);
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
/* ==================== 容器：头部 + 滚动区 + 底部按钮 ==================== */
.editZhiLianXinTongTimeTable-container {
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

	/* 名称：可编辑输入框 */
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

	/* 动作数量 + 新增动作 */
	.action-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 20rpx;

		.count-text {
			font-size: 26rpx;
			color: var(--text-secondary, #666666);
		}

		.add-btn {
			display: flex;
			align-items: center;
			height: 60rpx;
			padding: 0 24rpx;
			border-radius: 30rpx;
			background: linear-gradient(90deg, #3a7bf7, #5a96ff);
			box-shadow: 0 6rpx 16rpx rgba(58, 123, 247, 0.28);

			.add-icon {
				font-size: 28rpx;
				color: #ffffff;
				margin-right: 6rpx;
			}

			.add-text {
				font-size: 26rpx;
				color: #ffffff;
				font-weight: 500;
			}
		}

		/* 达到动作数量上限：按钮置灰 */
		.add-btn.add-disabled {
			background: var(--bg-soft, #f2f4f8);
			box-shadow: none;

			.add-icon,
			.add-text {
				color: var(--text-quaternary, #b8bfcc);
			}
		}
	}

	.header-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 16rpx;

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

/* ==================== 动作卡片 ==================== */
.action-card {
	background-color: var(--bg-card, #ffffff);
	border: 2rpx solid transparent;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));
}

/* 存在校验错误时高亮整张卡片 */
.action-card.card-has-error {
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

	/* 删除按钮：红色描边，仅剩一个动作时置灰不可点击效果 */
	.delete-btn {
		flex-shrink: 0;
		height: 56rpx;
		padding: 0 22rpx;
		border-radius: 28rpx;
		border: 2rpx solid rgba(245, 108, 108, 0.6);
		background-color: rgba(245, 108, 108, 0.08);
		display: flex;
		align-items: center;

		.delete-text {
			font-size: 24rpx;
			color: #f56c6c;
		}
	}

	.delete-btn.delete-disabled {
		border-color: var(--border-color, #e6eaf2);
		background-color: var(--bg-soft, #f2f4f8);

		.delete-text {
			color: var(--text-quaternary, #b8bfcc);
		}
	}
}

/* ==================== 字段通用 ==================== */
.field-block {
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.field-label {
	display: block;
	font-size: 24rpx;
	color: var(--text-secondary, #666666);
	margin-bottom: 10rpx;
}

.field-tip {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
}

.field-error {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #f56c6c;
}

/* ==================== 周范围：7 天，一行 4 个自动换行 ==================== */
.week-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.week-chip {
	width: 23%;
	height: 68rpx;
	margin-bottom: 12rpx;
	border-radius: 10rpx;
	box-sizing: border-box;
	background-color: var(--bg-soft, #f2f4f8);
	border: 2rpx solid var(--border-color, #e6eaf2);
	display: flex;
	align-items: center;
	justify-content: center;

	.chip-text {
		font-size: 26rpx;
		color: var(--text-tertiary, #9aa7bd);
	}
}

.week-chip.chip-active {
	background-color: var(--bg-accent, #eaf2ff);
	border-color: rgba(58, 123, 247, 0.5);

	.chip-text {
		color: #2f6fed;
		font-weight: 500;
	}
}

/* ==================== 选择器 / 输入框 ==================== */
.picker-box {
	display: flex;
	align-items: center;
	height: 76rpx;
	padding: 0 18rpx;
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

/* ==================== 时间：时 + 分 ==================== */
.time-row {
	display: flex;
	align-items: center;

	.time-picker {
		width: 200rpx;
		flex-shrink: 0;
	}

	.time-box {
		justify-content: center;

		.picker-text {
			flex: none;
			text-align: center;
		}
	}

	.time-unit {
		flex-shrink: 0;
		font-size: 26rpx;
		color: var(--text-secondary, #666666);
		margin: 0 20rpx;
	}
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

.scroll-footer-tip {
	padding: 12rpx 8rpx 0;
	text-align: center;
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
}

/* ==================== 底部取消 / 保存按钮（固定在底部，始终可见） ==================== */
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
