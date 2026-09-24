<template>
	<view :class="themeClass" class="editMonitorTimeTable-container">
		<!-- ==================== 头部：时间表基本信息（固定，不随内容滚动） ==================== -->
		<view class="page-header">
			<view class="header-title-row">
				<!-- 时间表名称：可修改 -->
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
				<!-- 时间表类型：集中器年表固定 -->
				<view class="tt-badge">集中器年表</view>
			</view>
			<text v-if="nameError" class="name-error">{{ nameError }}</text>
		</view>

		<!-- ==================== 内容滚动区：日期范围 + 动作卡片 ==================== -->
		<scroll-view :show-scrollbar="false" class="content-scroll" scroll-y="true">
			<view class="scroll-inner">
				<!-- 日期范围 -->
				<view class="section">
					<view class="section-header">
						<text class="section-title">日期范围</text>
						<text class="tip-text">只更新此日期范围内的时间计划</text>
					</view>
					<view class="date-card">
						<view class="date-range">
							<picker
								:end="isValidDate(endDate) ? endDate : ''"
								:value="isValidDate(startDate) ? startDate : today"
								mode="date"
								@change="bindStartDateChange"
							>
								<view :class="['date-box', isValidDate(startDate) ? '' : 'date-placeholder']">
									{{ startDate }}
								</view>
							</picker>
							<text class="to-text">至</text>
							<picker
								:start="isValidDate(startDate) ? startDate : ''"
								:value="isValidDate(endDate) ? endDate : today"
								mode="date"
								@change="bindEndDateChange"
							>
								<view :class="['date-box', isValidDate(endDate) ? '' : 'date-placeholder']">{{ endDate }}</view>
							</picker>
						</view>
					</view>
				</view>

				<!-- 时间表修改内容：动作1~动作6 -->
				<view class="section">
					<view class="section-header">
						<text class="section-title">修改内容</text>
						<text class="tip-text">启用的动作才会覆盖原计划</text>
					</view>
					<view
						v-for="(action, index) in actions"
						:key="action.id"
						:class="['action-card', action.enable ? '' : 'action-card-off']"
					>
						<view class="card-header">
							<view class="action-left">
								<view :style="{ backgroundColor: actionColor(action) }" class="action-icon"></view>
								<text class="action-name">{{ action.name }}</text>
							</view>
							<!-- 原 PC 端的“更新到第N组”改为“是否启用”，即是否覆盖对应的原有动作 -->
							<view class="enable-wrap">
								<text class="enable-label">是否启用</text>
								<switch
									:checked="action.enable"
									color="#07c160"
									style="transform:scale(0.8)"
									@change="handleEnableChange(index, $event)"
								/>
							</view>
						</view>

						<view class="card-content">
							<!-- 时间 -->
							<view class="field">
								<text class="field-label">时间</text>
								<picker :value="action.time" mode="time" @change="bindTimeChange($event, action)">
									<view class="field-box time-box">{{ action.time }}</view>
								</picker>
							</view>

							<!-- 动作类型：定时 / 传感器 / 混合 -->
							<view class="field">
								<text class="field-label">类型</text>
								<picker
									:range="typeOptions"
									:value="action.type"
									mode="selector"
									@change="handleTypeChange(index, $event)"
								>
									<view class="field-box type-box">{{ typeText(action.type) }}</view>
								</picker>
							</view>

							<!-- 数值：定时为亮度(%)，混合为照度(lux)，传感器不使用数值 -->
							<view class="field">
								<text class="field-label">{{ valueLabel(action) }}</text>
								<view
									:class="[
										'field-box',
										'value-box',
										valueErrors[index].value ? 'input-error' : '',
										action.type === TYPE_SENSOR ? 'value-disabled' : ''
									]"
								>
									<input
										:disabled="action.type === TYPE_SENSOR"
										:maxlength="valueMaxLength(action)"
										:value="action.value"
										class="value-input"
										placeholder="0"
										placeholder-style="font-size:26rpx;color:#b8bfcc;"
										type="number"
										@blur="onValueBlur(index)"
										@input="onValueInput(index, $event)"
									/>
									<text v-if="valueUnit(action)" class="value-unit">{{ valueUnit(action) }}</text>
								</view>
							</view>
						</view>
						<text v-if="valueErrors[index].value" class="field-error">{{ valueErrors[index].value }}</text>
					</view>

					<view class="hint-card">
						<text class="hint-text">打开“是否启用”的动作会覆盖所选日期范围内对应的原有动作，未启用的动作保持原计划不变。</text>
						<text class="hint-text">定时动作的数值为亮度(0-100%)，混合动作的数值为照度(0-65535lux)，传感器动作不使用数值。</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- ==================== 底部：保存 / 取消（固定，始终可见） ==================== -->
		<view class="footer-btn">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="saveMonitorTimeTable">保存</button>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 集中器年表固定 6 个动作（a1~a6 / t1~t6 / v1~v6）
const ACTION_COUNT = 6;

// 动作类型（a）：0-定时（数值为亮度百分比） 1-传感器（不使用数值） 2-混合（数值为照度）
const TYPE_TIMER = 0;
const TYPE_SENSOR = 1;
const TYPE_MIX = 2;

// 类型选项：界面顺序固定为 定时、传感器、混合（与详情页 monitorTimeTable 保持一致）
const TYPE_LABELS = ['定时', '传感器', '混合'];

// 数值单位：0-定时为亮度(%)，1-传感器不显示数值，2-混合为照度(lux)
const VALUE_UNITS = {
	0: '%',
	1: '',
	2: 'lux'
};

// 数值字段名称：0-亮度，1-数值，2-照度
const VALUE_LABELS = {
	0: '亮度',
	1: '数值',
	2: '照度'
};

// 数值上限：亮度 0-100(%)，照度 0-65535(lux)，传感器不校验
const VALUE_MAX = {
	0: 100,
	2: 65535
};

// 无原数据时使用的默认值（与 PC 端表单默认值一致：定时、00:00、亮度 100）
const DEFAULT_ACTION = {a: TYPE_TIMER, t: '00:00', v: 100};

// 生成 6 个动作的空白数据
function createActions() {
	const list = [];
	for (let i = 0; i < ACTION_COUNT; i++) {
		list.push({
			id: i + 1,
			name: `动作${i + 1}`,
			// 原 PC 端的“更新到第N组”复选框，改为“是否启用”，默认不覆盖原有动作
			enable: false,
			time: DEFAULT_ACTION.t,
			type: DEFAULT_ACTION.a,
			value: DEFAULT_ACTION.v
		});
	}
	return list;
}

// 生成 6 组数值错误提示（对象形式，保证 Vue2 下修改属性可响应）
function createValueErrors() {
	const list = [];
	for (let i = 0; i < ACTION_COUNT; i++) {
		list.push({value: ''});
	}
	return list;
}

export default {
	name: 'EditMonitorTimeTable',
	data() {
		return {
			// 动作类型常量（模板中判断使用）
			TYPE_SENSOR: TYPE_SENSOR,

			// 时间表基本信息
			timeTableId: null,
			timeTableName: '',
			// 名称校验提示（名称可直接编辑，保存时随接口提交）
			nameError: '',
			// 集中器年表类型固定为 5，保存时随接口提交
			timeTableType: 5,
			// 时间表原有全年内容：{ 月: { 日: { a1..a6, t1..t6, v1..v6 } } }
			originalContent: {},
			// 原有全年内容是否加载成功（未加载成功不允许保存，避免覆盖原数据）
			contentLoaded: false,

			// 日期范围：默认当前年 01-01 ~ 12-31（与 PC 端一致）
			today: this.formatDate(new Date()),
			startDate: this.formatDate(new Date()).slice(0, 4) + '-01-01',
			endDate: this.formatDate(new Date()).slice(0, 4) + '-12-31',

			// 6 个动作
			actions: createActions(),
			// 6 个动作的数值错误提示
			valueErrors: createValueErrors(),
			// 类型选择器选项
			typeOptions: TYPE_LABELS
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
			uni.showToast({title: '缺少时间表ID', icon: 'none'});
			return;
		}

		this.getMonitorTimeTableDetail();
	},
	methods: {
		/* ==================== 基础工具 ==================== */

		// 格式化日期为 YYYY-MM-DD
		formatDate(date) {
			const pad = (n) => (n < 10 ? '0' + n : '' + n);
			return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
		},
		// 是否为合法的 YYYY-MM-DD 日期
		isValidDate(str) {
			return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
		},
		// 解析 YYYY-MM-DD，手动构造 Date，避免 iOS 对 '-' 分隔日期的兼容问题
		parseDate(str) {
			const parts = String(str).split('-').map(Number);
			return new Date(parts[0], parts[1] - 1, parts[2]);
		},
		// 转数字，非法值返回默认值
		toNumber(value, defaultValue) {
			const text = String(value === null || value === undefined ? '' : value).trim();
			if (!text) return defaultValue;
			const num = Number(text);
			return Number.isFinite(num) ? num : defaultValue;
		},
		// 取原有时间表中某一天的数据（兼容数字/字符串键）
		getOriginalDay(month, day) {
			const monthData = this.getOriginalMonth(month);
			if (!monthData) return null;
			return monthData[day] || monthData[String(day)] || null;
		},
		// 取原有时间表中某个月的数据（兼容数字/字符串键）
		getOriginalMonth(month) {
			const src = this.originalContent || {};
			return src[month] || src[String(month)] || null;
		},

		/* ==================== 基本信息 ==================== */

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

		/* ==================== 详情加载 ==================== */

		// 获取集中器年表详情（保存时需要以原有全年内容为基础，避免覆盖其他日期的计划）
		getMonitorTimeTableDetail() {
			request({
				url: '/station/plan/QueryMonitorDetail',
				method: 'POST',
				data: {
					id: this.timeTableId // 时间表id
				}
			}).then(res => {
				const payload = res.data;
				if (payload && payload.data) {
					try {
						// 兼容返回已解码对象的情况
						let detail = payload.data;
						if (typeof detail === 'string') {
							detail = JSON.parse(base64Decode(detail));
						}
						// 全年每天的动作内容：{ 月: { 日: { a1..a6, t1..t6, v1..v6 } } }
						this.originalContent = (detail && detail.content) || {};
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}
						// 集中器年表固定 type = 5
						this.timeTableType = this.toNumber(detail && detail.type, 5) || 5;
						this.contentLoaded = true;
					} catch (e) {
						console.error('集中器年表详情解析失败', e);
						uni.showToast({title: '获取集中器年表详情异常', icon: 'none'});
					}
				} else {
					uni.showToast({title: '获取集中器年表详情异常', icon: 'none'});
				}
			}).catch(err => {
				console.error('获取集中器年表详情错误', err.message);
				uni.showToast({title: '获取集中器年表详情异常', icon: 'none'});
			});
		},

		/* ==================== 交互 ==================== */

		bindStartDateChange(e) {
			this.startDate = e.detail.value;
		},
		bindEndDateChange(e) {
			this.endDate = e.detail.value;
		},
		// 是否启用：开启后该动作会覆盖所选范围内对应的原有动作
		handleEnableChange(index, e) {
			const enable = !!(e && e.detail && e.detail.value);
			this.actions[index].enable = enable;
			if (enable) {
				// 启用后数值变为必填，立即校验
				this.validateValue(index);
			} else {
				this.valueErrors[index].value = '';
			}
		},
		bindTimeChange(e, action) {
			action.time = e.detail.value;
		},
		// 切换类型：数值的单位与上限随之变化，立即重新校验
		handleTypeChange(index, e) {
			const value = e && e.detail ? Number(e.detail.value) : 0;
			this.actions[index].type = TYPE_LABELS[value] ? value : TYPE_TIMER;
			this.validateValue(index);
		},
		// 数值输入：同步数据；已提示错误时边输入边校验，通过后立即清除提示
		onValueInput(index, e) {
			this.actions[index].value = e && e.detail ? e.detail.value : '';
			if (this.valueErrors[index].value) {
				this.validateValue(index);
			}
		},
		onValueBlur(index) {
			this.validateValue(index);
		},

		/* ==================== 展示辅助 ==================== */

		// 类型文案
		typeText(type) {
			const label = TYPE_LABELS[Number(type)];
			return label || TYPE_LABELS[TYPE_TIMER];
		},
		// 数值字段名称
		valueLabel(action) {
			return VALUE_LABELS[Number(action.type)] || VALUE_LABELS[TYPE_TIMER];
		},
		// 数值单位（传感器无单位）
		valueUnit(action) {
			const unit = VALUE_UNITS[Number(action.type)];
			return unit || '';
		},
		// 数值输入框最大长度（照度上限 65535 为 5 位）
		valueMaxLength(action) {
			return Number(action.type) === TYPE_MIX ? 5 : 3;
		},
		actionColor(action) {
			const colors = ['#3a7bf7', '#f5a623', '#7b61ff', '#07c160', '#ff7a45', '#13c2c2'];
			return colors[(action.id - 1) % colors.length];
		},

		/* ==================== 校验 ==================== */

		// 日期校验：必须选择且不能跨年（全年提交时按开始日期所在年份生成）
		validateRange() {
			if (!this.isValidDate(this.startDate)) {
				uni.showToast({title: '请选择开始日期', icon: 'none'});
				return false;
			}
			if (!this.isValidDate(this.endDate)) {
				uni.showToast({title: '请选择结束日期', icon: 'none'});
				return false;
			}
			if (this.startDate > this.endDate) {
				uni.showToast({title: '开始日期不能大于结束日期', icon: 'none'});
				return false;
			}
			if (this.startDate.slice(0, 4) !== this.endDate.slice(0, 4)) {
				uni.showToast({title: '开始和结束日期不能跨年', icon: 'none'});
				return false;
			}
			return true;
		},

		// 单个动作的数值校验：启用的动作且类型需要数值时必填，只允许整数
		validateValue(index) {
			const action = this.actions[index];
			const max = VALUE_MAX[Number(action.type)];
			const text = String(action.value === null || action.value === undefined ? '' : action.value).trim();
			let message = '';

			if (!action.enable || max === undefined) {
				// 未启用的动作、以及不使用数值的传感器动作，数值不参与校验
				message = '';
			} else if (!text) {
				message = `请输入${this.valueLabel(action)}`;
			} else if (/^-/.test(text)) {
				message = `${this.valueLabel(action)}需为正数`;
			} else if (!/^\d+$/.test(text)) {
				message = `${this.valueLabel(action)}仅支持整数`;
			} else if (Number(text) > max) {
				message = `${this.valueLabel(action)}不能大于 ${max}`;
			}

			this.valueErrors[index].value = message;
			return message === '';
		},

		// 动作校验：至少启用一个动作，且启用动作的数值合法
		validateActions() {
			const enabled = this.actions.filter(action => action.enable);
			if (enabled.length === 0) {
				uni.showToast({title: '请至少启用一个动作', icon: 'none'});
				return false;
			}

			let firstErrorIndex = -1;
			this.actions.forEach((action, index) => {
				if (!this.validateValue(index) && firstErrorIndex === -1) {
					firstErrorIndex = index;
				}
			});
			if (firstErrorIndex > -1) {
				const action = this.actions[firstErrorIndex];
				uni.showToast({title: `${action.name}：${this.valueErrors[firstErrorIndex].value}`, icon: 'none'});
				return false;
			}
			return true;
		},

		/* ==================== 组装与保存 ==================== */

		// 把原有某天的数据统一成 a(数字)、t(HH:mm)、v(数字)，缺失字段补默认值
		normalizeDay(day) {
			const result = {};
			for (let i = 1; i <= ACTION_COUNT; i++) {
				const a = day['a' + i];
				const t = day['t' + i];
				const v = day['v' + i];
				result['a' + i] = (a === undefined || a === null || a === '') ? DEFAULT_ACTION.a : this.toNumber(a, DEFAULT_ACTION.a);
				result['t' + i] = (t === undefined || t === null || t === '') ? DEFAULT_ACTION.t : String(t);
				result['v' + i] = (v === undefined || v === null || v === '') ? DEFAULT_ACTION.v : this.toNumber(v, DEFAULT_ACTION.v);
			}
			return result;
		},

		// 无原数据日期使用 PC 端表单默认值（定时 00:00，亮度 100）
		createDefaultDay() {
			const day = {};
			for (let i = 1; i <= ACTION_COUNT; i++) {
				day['a' + i] = DEFAULT_ACTION.a;
				day['t' + i] = DEFAULT_ACTION.t;
				day['v' + i] = DEFAULT_ACTION.v;
			}
			return day;
		},

		// 组装一整年的 content（必须按年提交）：
		// 1、以原有全年内容为基础，缺失日期补 PC 端表单默认值；
		// 2、仅在选择的时间范围内，把启用的动作覆盖为新的时间/类型/数值，
		//    未启用的动作以及范围外的日期均保持原值不变。
		buildYearContent() {
			const year = Number(this.startDate.slice(0, 4));
			const content = {};

			for (let month = 1; month <= 12; month++) {
				const monthKey = String(month);
				// 以所选年份的当月天数为准；原数据若含更多天数（如闰年 2 月 29 日）则保留，避免丢数据
				let daysInMonth = new Date(year, month, 0).getDate();
				const originalMonth = this.getOriginalMonth(month);
				if (originalMonth) {
					const dayKeys = Object.keys(originalMonth)
						.map(Number)
						.filter(key => !isNaN(key));
					if (dayKeys.length > 0) {
						daysInMonth = Math.max(daysInMonth, Math.max.apply(null, dayKeys));
					}
				}

				content[monthKey] = {};
				for (let day = 1; day <= daysInMonth; day++) {
					const original = this.getOriginalDay(month, day);
					content[monthKey][String(day)] = original ? this.normalizeDay(original) : this.createDefaultDay();
				}
			}

			const cursor = this.parseDate(this.startDate);
			const end = this.parseDate(this.endDate);
			while (cursor <= end) {
				const monthKey = String(cursor.getMonth() + 1);
				const dayKey = String(cursor.getDate());
				const dayContent = content[monthKey] && content[monthKey][dayKey];
				if (dayContent) {
					this.actions.forEach((action, index) => {
						const no = index + 1;
						// 只有启用的动作才会覆盖原有对应动作
						if (action.enable) {
							dayContent['a' + no] = Number(action.type);
							dayContent['t' + no] = action.time;
							dayContent['v' + no] = this.toNumber(action.value, 0);
						}
					});
				}
				cursor.setDate(cursor.getDate() + 1);
			}

			return content;
		},

		// 保存修改后的集中器年表
		saveMonitorTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '缺少时间表ID', icon: 'none'});
				return;
			}
			if (!this.contentLoaded) {
				uni.showToast({title: '时间表详情未加载完成，请稍后重试', icon: 'none'});
				return;
			}
			if (!this.validateName()) {
				uni.showToast({title: this.nameError, icon: 'none'});
				return;
			}
			if (!this.validateRange()) return;
			if (!this.validateActions()) return;

			/**
			 * 请求体（按年提交，content 必须包含一整年 1-12 月的内容）
			 * {
			 *   "id": 248,                 // 时间表id
			 *   "name": "App集中器年表",    // 时间表名称
			 *   "type": 5,                 // 集中器年表固定为 5
			 *   "content": {               // 月 -> 日 -> 6 个动作
			 *     "1": {
			 *       "1": {
			 *         "a1": 1, "t1": "01:05", "v1": 100,   // a1~a6 动作（0定时/1传感器/2混合）
			 *         "a2": 1, "t2": "04:02", "v2": 100,   // t1~t6 时间，v1~v6 对应的值
			 *         ...
			 *         "a6": 0, "t6": "15:15", "v6": 66
			 *       },
			 *       ...
			 *     },
			 *     ...
			 *   }
			 * }
			 * 返回结果：{ code: 0, data: "1", abab: true }
			 */
			uni.showModal({
				title: '提示',
				content: `确认修改${this.startDate}至${this.endDate}的时间计划？`,
				success: (res) => {
					if (res.confirm) {
						const content = this.buildYearContent();
						uni.showLoading({title: '保存中...', mask: true});

						request({
							url: '/station/plan/SaveMonitorDetail',
							method: 'POST',
							data: {
								id: this.timeTableId, // 时间表id
								name: String(this.timeTableName || '').trim(), // 时间表名称
								type: this.timeTableType, // 集中器年表类型
								content: content // 全年每天的动作内容
							}
						}).then(res => {
							uni.hideLoading();
							const payload = res.data || {};
							if (payload.code === 0) {
								// 通知详情页刷新
								uni.$emit('monitorTimeTableUpdated', {id: this.timeTableId});
								uni.showToast({title: '修改成功', icon: 'success'});
								setTimeout(() => {
									uni.navigateBack();
								}, 1000);
							} else {
								const msg = typeof payload.data === 'string' ? base64Decode(payload.data) : '';
								uni.showToast({title: msg || '修改失败，请重试', icon: 'none'});
							}
						}).catch(err => {
							uni.hideLoading();
							console.error('保存集中器年表失败', err.message);
							uni.showToast({title: '保存失败，请重试', icon: 'none'});
						});
					}
				}
			});
		},

		cancel() {
			uni.navigateBack();
		}
	}
}
</script>

<style lang="scss" scoped>
.editMonitorTimeTable-container {
	display: flex;
	flex-direction: column;
	/* 占满导航栏之外的整屏高度：头部固定、仅内容区滚动、底部按钮固定 */
	height: 100vh;
	height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
	overflow: hidden;
	box-sizing: border-box;
	background-color: var(--bg-page, #f5f7fa);
}

/* ==================== 头部：时间表基本信息（固定） ==================== */
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

	/* 类型徽章：集中器年表固定 */
	.tt-badge {
		flex-shrink: 0;
		font-size: 22rpx;
		color: #3a7bf7;
		background-color: var(--bg-accent, #eef3ff);
		border-radius: 8rpx;
		padding: 6rpx 16rpx;
	}
}

/* ==================== 内容滚动区：仅此区域上下滚动 ==================== */
.content-scroll {
	flex: 1;
	height: 0;
	min-height: 0;
	width: 100%;
}

.scroll-inner {
	/* 底部预留固定按钮栏的空间，避免内容被遮挡 */
	padding: 24rpx 24rpx calc(200rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

/* ==================== 区块通用 ==================== */
.section {
	margin-bottom: 28rpx;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 18rpx;

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
		white-space: nowrap;
	}

	.tip-text {
		flex: 1;
		font-size: 22rpx;
		color: #f56c6c;
		margin-left: 16rpx;
	}
}

/* ==================== 日期范围 ==================== */
.date-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 26rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));

	.date-range {
		display: flex;
		align-items: center;

		picker {
			flex: 1;
			min-width: 0;
		}

		.date-box {
			background-color: var(--bg-accent, #eaf2ff);
			color: var(--text-primary, #2f6fed);
			padding: 18rpx 0;
			border-radius: 12rpx;
			font-size: 28rpx;
			text-align: center;
		}

		.date-placeholder {
			background-color: var(--bg-soft, #f2f4f8);
			color: var(--text-tertiary, #9aa7bd);
		}

		.to-text {
			font-size: 26rpx;
			color: var(--text-quaternary, #999999);
			margin: 0 20rpx;
			flex-shrink: 0;
		}
	}
}

/* ==================== 动作卡片 ==================== */
.action-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
		padding-bottom: 20rpx;
		border-bottom: 1px solid var(--border-color, #f0f2f5);

		.action-left {
			display: flex;
			align-items: center;

			.action-icon {
				width: 10rpx;
				height: 44rpx;
				border-radius: 6rpx;
				margin-right: 16rpx;
			}

			.action-name {
				font-size: 30rpx;
				font-weight: bold;
				color: var(--text-primary, #333333);
			}
		}

		.enable-wrap {
			display: flex;
			align-items: center;

			.enable-label {
				font-size: 26rpx;
				color: var(--text-secondary, #666666);
				margin-right: 4rpx;
			}
		}
	}

	.card-content {
		display: flex;
		align-items: flex-start;

		.field {
			flex: 1;
			min-width: 0;
			margin-right: 16rpx;

			&:last-child {
				margin-right: 0;
			}

			.field-label {
				display: block;
				font-size: 24rpx;
				color: var(--text-secondary, #666666);
				margin-bottom: 12rpx;
			}

			picker {
				width: 100%;
			}

			.field-box {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 72rpx;
				padding: 0 12rpx;
				box-sizing: border-box;
				background-color: var(--bg-soft, #f2f4f8);
				border: 2rpx solid var(--border-color, #e6eaf2);
				border-radius: 12rpx;
				font-size: 28rpx;
				color: var(--text-primary, #333333);
			}

			.time-box,
			.type-box {
				text-align: center;
			}

			.value-box {
				padding: 0 16rpx;

				.value-input {
					flex: 1;
					min-width: 0;
					height: 72rpx;
					line-height: 72rpx;
					font-size: 28rpx;
					text-align: center;
					color: var(--text-primary, #333333);
					background-color: transparent;
				}

				.value-unit {
					flex-shrink: 0;
					font-size: 24rpx;
					color: var(--text-quaternary, #999999);
					margin-left: 6rpx;
				}
			}

			/* 传感器动作不使用数值 */
			.value-box.value-disabled {
				background-color: var(--bg-page, #f5f7fa);
				opacity: 0.6;
			}

			.field-box.input-error {
				border-color: #f56c6c;
				background-color: rgba(245, 108, 108, 0.08);
			}
		}
	}

	.field-error {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #f56c6c;
	}
}

/* 未启用的动作：仅作预填，不会覆盖原计划 */
.action-card-off {
	.card-content {
		opacity: 0.6;
	}
}

/* ==================== 说明 ==================== */
.hint-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));

	.hint-text {
		display: block;
		font-size: 22rpx;
		line-height: 1.7;
		color: var(--text-quaternary, #999999);

		& + .hint-text {
			margin-top: 8rpx;
		}
	}
}

/* ==================== 保存/取消按钮（固定在页面底部，始终可见） ==================== */
.footer-btn {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	display: flex;
	align-items: center;
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 -6rpx 20rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.08));

	.btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		padding: 0;
		margin: 0 12rpx;
		font-size: 30rpx;
		border-radius: 10rpx;

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
	}
}
</style>
