<!-- 新增 / 编辑站点弹窗 -->
<template>
	<transition name="sf-pop">
		<view v-if="visible" :class="themeClass" class="station-form-popup">
			<!-- 半透明遮罩 -->
			<view class="sf-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="sf-card" @click.stop>
				<!-- 标题栏 -->
				<view class="sf-header">
					<text class="sf-title">{{ title }}</text>
					<view class="sf-close" hover-class="sf-close-hover" @click="close">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 表单内容 -->
				<scroll-view :style="{ maxHeight: bodyHeight }" class="sf-body" scroll-y>
					<!-- 所属分区 -->
					<view class="sf-field">
						<text class="sf-label">所属分区</text>
						<view class="sf-control sf-control-between sf-control-disabled">
							<text :class="['sf-value', 'sf-value-disabled', { 'sf-placeholder': !groupDisplayName }]">
								{{ groupDisplayName || '未获取到所属分区' }}
							</text>
							<uni-icons :color="isDarkMode ? '#6d7689' : '#b0b6c3'" size="20" type="locked"></uni-icons>
						</view>
					</view>

					<!-- 站点类型 -->
					<view class="sf-field">
						<text class="sf-label">站点类型</text>
						<picker :range="stationTypeLabels" :value="stationTypeIndex" @change="onStationTypeChange">
							<view class="sf-control sf-control-between">
								<text class="sf-value">{{ stationTypeLabel }}</text>
								<uni-icons :color="isDarkMode ? '#6d7689' : '#999999'" size="20" type="bottom"></uni-icons>
							</view>
						</picker>
					</view>

					<!-- 供电方式：仅配电柜站点 -->
					<view v-if="showSupplyMode" class="sf-field">
						<text class="sf-label">供电方式</text>
						<picker :range="supplyModeLabels" :value="supplyModeIndex" @change="onSupplyModeChange">
							<view class="sf-control sf-control-between">
								<text class="sf-value">{{ supplyModeLabel }}</text>
								<uni-icons :color="isDarkMode ? '#6d7689' : '#999999'" size="20" type="bottom"></uni-icons>
							</view>
						</picker>
					</view>

					<!-- 名称（必填、不可重复） -->
					<view class="sf-field">
						<view class="sf-label-row">
							<text class="sf-required">*</text>
							<text class="sf-label">名称</text>
						</view>
						<view class="sf-control">
							<input
								v-model="form.name"
								class="sf-input"
								maxlength="50"
								placeholder="请输入站点名称"
								placeholder-class="sf-input-placeholder"
							/>
						</view>
					</view>

					<!-- 能耗区域 -->
					<view class="sf-field">
						<text class="sf-label">能耗区域</text>
						<view class="sf-control">
							<input
								v-model="form.area"
								class="sf-input"
								maxlength="50"
								placeholder="请输入所在区域"
								placeholder-class="sf-input-placeholder"
							/>
						</view>
					</view>

					<!-- 安装位置：只展示地址，经纬度在地图选点页获取 -->
					<view class="sf-field">
						<text class="sf-label">安装位置</text>
						<view class="sf-location" hover-class="sf-location-hover" @click="pickLocation">
							<uni-icons :color="form.location ? primaryColor : (isDarkMode ? '#6d7689' : '#999999')" size="20" type="location"></uni-icons>
							<text :class="['sf-location-text', { 'sf-placeholder': !form.location }]">
								{{ form.location || '请在地图上选择安装位置' }}
							</text>
							<text class="sf-location-action">选择</text>
						</view>
					</view>

					<!-- 安装时间（必填） -->
					<view class="sf-field">
						<view class="sf-label-row">
							<text class="sf-required">*</text>
							<text class="sf-label">安装时间</text>
						</view>
						<picker :value="form.install" mode="date" @change="onInstallChange">
							<view class="sf-control sf-control-between">
								<text :class="['sf-value', { 'sf-placeholder': !form.install }]">
									{{ form.install || '请选择安装时间' }}
								</text>
								<uni-icons :color="isDarkMode ? '#6d7689' : '#999999'" size="20" type="calendar"></uni-icons>
							</view>
						</picker>
					</view>

					<!-- 流量模式：智慧灯杆站点不展示 -->
					<view v-if="showLowFlow" class="sf-field">
						<view class="sf-switch-row">
							<view class="sf-switch-label-box">
								<text class="sf-label">流量模式</text>
								<text class="sf-switch-hint">是否启用低流量？</text>
							</view>
							<switch :checked="form.lowFlow" color="#3880FC" style="transform: scale(0.82)" @change="onLowFlowChange" />
						</view>
						<view v-if="form.lowFlow" class="sf-time-range">
							<view class="sf-time-item">
								<text class="sf-time-label">开始时间</text>
								<picker :value="form.lowStart" mode="time" @change="onLowStartChange">
									<view class="sf-time-box">{{ form.lowStart }}</view>
								</picker>
							</view>
							<text class="sf-time-sep">至</text>
							<view class="sf-time-item">
								<text class="sf-time-label">结束时间</text>
								<picker :value="form.lowEnd" mode="time" @change="onLowEndChange">
									<view class="sf-time-box">{{ form.lowEnd }}</view>
								</picker>
							</view>
						</view>
						<text v-if="form.lowFlow" class="sf-tip">低流量时段支持跨天，例如 22:00 至 06:00</text>
					</view>

					<!-- 线路报警：仅单灯站点 -->
					<view v-if="showLineAlarm" class="sf-field">
						<view class="sf-switch-row">
							<view class="sf-switch-label-box">
								<text class="sf-label">线路报警</text>
								<text class="sf-switch-hint">是否启用线路报警？</text>
							</view>
							<switch :checked="form.lineErrorAlarm" color="#3880FC" style="transform: scale(0.82)" @change="onLineAlarmChange" />
						</view>
						<view v-if="form.lineErrorAlarm" class="sf-time-range">
							<view class="sf-time-item">
								<text class="sf-time-label">开始时间</text>
								<picker :value="form.lineErrorStart" mode="time" @change="onLineStartChange">
									<view class="sf-time-box">{{ form.lineErrorStart }}</view>
								</picker>
							</view>
							<text class="sf-time-sep">至</text>
							<view class="sf-time-item">
								<text class="sf-time-label">结束时间</text>
								<picker :value="form.lineErrorEnd" mode="time" @change="onLineEndChange">
									<view class="sf-time-box">{{ form.lineErrorEnd }}</view>
								</picker>
							</view>
						</view>
						<text v-if="form.lineErrorAlarm" class="sf-tip">
							起始时间可以晚于结束时间，通常用于夜间报警时段
						</text>
					</view>

					<!-- 单灯分组 -->
					<view v-if="showLightGroup" class="sf-field">
						<text class="sf-label">单灯分组</text>
						<picker
							:disabled="lightGroupsLoading"
							:range="lightGroupLabels"
							:value="lightGroupIndex"
							@change="onLightGroupChange"
						>
							<view class="sf-control sf-control-between">
								<text class="sf-value">{{ lightGroupLabel }}</text>
								<uni-icons :color="isDarkMode ? '#6d7689' : '#999999'" size="20" type="bottom"></uni-icons>
							</view>
						</picker>
					</view>
				</scroll-view>

				<!-- 底部按钮 -->
				<view class="sf-footer">
					<button class="sf-btn" @click="close">取消</button>
					<button :disabled="submitting" class="sf-btn primary" @click="submit">保存</button>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
import { request } from '@/utils/request';
import { base64Decode } from '@/utils/common';
import { EVENT_LOCATION_RESULT, POS_TYPE_BOX } from '@/utils/map';

// ==================== 站点类型、供电方式与默认时段 ====================

// 站点类型：1-配电柜 2-隧道 3-单灯 4-水位 5-太阳能一体化 6-直流柜 7-智慧灯杆 8-方大
const STATION_TYPE_OPTIONS = [
	{ value: 1, label: '配电柜站点' },
	{ value: 2, label: '隧道站点' },
	{ value: 3, label: '单灯站点' },
	{ value: 4, label: '水位站点' },
	{ value: 5, label: '太阳能一体化单灯站点' },
	{ value: 6, label: '直流柜站点' },
	{ value: 7, label: '智慧灯杆站点' },
	{ value: 8, label: '方大站点' }
];

// 供电方式：1-公变 2-专变
const SUPPLY_MODE_OPTIONS = [
	{ value: 1, label: '公变' },
	{ value: 2, label: '专变' }
];

// 线路报警默认时段：09:00 ~ 19:00
const DEFAULT_LINE_ERROR_START = 540;
const DEFAULT_LINE_ERROR_END = 1140;

// 低流量默认时段
const DEFAULT_LOW_START = '08:00';
const DEFAULT_LOW_END = '18:00';

const pad2 = value => (Number(value) < 10 ? '0' : '') + Number(value);

/** 单灯站点才展示线路报警 */
function isSingleLampStation(stationType) {
	return Number(stationType) === 3;
}

/** 智慧灯杆站点不展示低流量与单灯分组（与原型一致） */
function supportsLowFlow(stationType) {
	return Number(stationType) !== 7;
}

function supportsLightGroup(stationType) {
	return Number(stationType) !== 7;
}

/** 当天日期 yyyy-MM-dd */
function todayString() {
	const now = new Date();
	return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/**
 * 统一成 yyyy-MM-dd
 * 接口返回的安装时间形如 "2026-06-03 00:00:00"，日期选择器只接受 yyyy-MM-dd
 */
function formatDateOnly(value) {
	if (!value) return '';
	if (typeof value === 'string') {
		const matched = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
		if (matched) return `${matched[1]}-${pad2(matched[2])}-${pad2(matched[3])}`;
	}
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 时间统一成 HH:mm，非法值返回 fallback */
function normalizeTime(value, fallback = '') {
	const matched = String(value === undefined || value === null ? '' : value).match(/^(\d{1,2}):(\d{1,2})/);
	if (!matched) return fallback;
	const hour = Math.min(23, Math.max(0, Number(matched[1])));
	const minute = Math.min(59, Math.max(0, Number(matched[2])));
	return `${pad2(hour)}:${pad2(minute)}`;
}

/** HH:mm -> 当天分钟数；也兼容直接传入分钟数（站点列表接口返回的是分钟数） */
function timeToMinutes(value, fallback = 0) {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return Math.min(1439, Math.max(0, Math.round(value)));
	}
	const normalized = normalizeTime(value, '');
	if (!normalized) return fallback;
	const [hour, minute] = normalized.split(':').map(Number);
	return hour * 60 + minute;
}

/** 当天分钟数 -> HH:mm；兼容直接传入 HH:mm 字符串 */
function minutesToTime(value, fallback = '09:00') {
	if (typeof value === 'string' && value.indexOf(':') >= 0) {
		return normalizeTime(value, fallback);
	}
	const minutes = Number(value);
	if (!Number.isFinite(minutes)) return fallback;
	const safe = Math.min(1439, Math.max(0, Math.round(minutes)));
	return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`;
}

/**
 * 把平铺分组列表拍平成带层级的列表（供所属分区选择展示层级）
 * @returns {Array<{id:*,name:string,parentId:*,level:number}>}
 */
function flattenGroups(groups) {
	const list = Array.isArray(groups) ? groups.filter(item => item && item.id !== undefined && item.id !== null) : [];
	const map = {};
	list.forEach(group => {
		map[String(group.id)] = {
			id: group.id,
			name: group.name || '',
			parentId: group.parentId,
			level: 0,
			children: [],
			attached: false
		};
	});
	list.forEach(group => {
		const node = map[String(group.id)];
		const parent = map[String(group.parentId)];
		if (node && parent && String(group.parentId) !== String(group.id)) {
			parent.children.push(node);
			node.attached = true;
		}
	});
	const flattened = [];
	const walk = (node, level) => {
		flattened.push({ id: node.id, name: node.name, parentId: node.parentId, level });
		node.children.forEach(child => walk(child, level + 1));
	};
	list.forEach(group => {
		const node = map[String(group.id)];
		if (node && !node.attached) walk(node, 0);
	});
	return flattened;
}

function toCoordinate(value) {
	const number = Number(value);
	return Number.isFinite(number) ? number : 0;
}

/**
 * 组装 /station/config/SaveStation 请求体
 * @param {Object} form 站点表单（新增时 id 传空字符串）
 */
function buildSaveStationBody(form = {}) {
	const stationType = Number(form.stationType) || 1;
	const singleLamp = isSingleLampStation(stationType);
	const lowFlowSupported = supportsLowFlow(stationType);
	const lowFlow = lowFlowSupported ? !!form.lowFlow : false;
	const lineErrorAlarm = singleLamp
		? (form.lineErrorAlarm === undefined || form.lineErrorAlarm === null ? true : !!form.lineErrorAlarm)
		: false;
	const lineErrorStart = timeToMinutes(form.lineErrorStart, DEFAULT_LINE_ERROR_START);
	const lineErrorEnd = timeToMinutes(form.lineErrorEnd, DEFAULT_LINE_ERROR_END);

	return {
		id: form.id === undefined || form.id === null ? '' : form.id,
		groupId: Number(form.groupId) || 0,
		type: 1,
		name: String(form.name || '').trim(),
		location: String(form.location || '').trim(),
		install: formatDateOnly(form.install),
		stype: 0,
		area: String(form.area || '').trim(),
		lng: toCoordinate(form.lng),
		lat: toCoordinate(form.lat),
		lowFlow: lowFlow,
		lowStart: lowFlow ? normalizeTime(form.lowStart, DEFAULT_LOW_START) : '',
		lightGroupId: supportsLightGroup(stationType) ? (Number(form.lightGroupId) || 0) : 0,
		lowEnd: lowFlow ? normalizeTime(form.lowEnd, DEFAULT_LOW_END) : '',
		stationType: stationType,
		supplyMode: Number(form.supplyMode) || 1,
		lineErrorAlarm: lineErrorAlarm,
		lineErrorStart: lineErrorStart,
		lineErrorEnd: lineErrorEnd
	};
}

const createDefaultForm = () => ({
	groupId: 0,
	stationType: 1,
	supplyMode: 1,
	name: '',
	area: '',
	location: '',
	lng: '',
	lat: '',
	install: todayString(),
	lowFlow: false,
	lowStart: DEFAULT_LOW_START,
	lowEnd: DEFAULT_LOW_END,
	lightGroupId: 0,
	lineErrorAlarm: true,
	lineErrorStart: '09:00',
	lineErrorEnd: '19:00'
});

export default {
	name: 'StationFormPopup',
	props: {
		visible: { type: Boolean, default: false },
		// add-新增 / edit-编辑
		mode: { type: String, default: 'add' },
		// 编辑时传入当前站点完整数据
		station: { type: Object, default: null },
		// 新增时默认所属分组
		groupId: { type: [Number, String], default: 0 },
		groupName: { type: String, default: '' },
		// 全量分组（平铺）与全量站点，用于所属分区选择与站点名称查重
		groups: { type: Array, default: () => [] },
		stations: { type: Array, default: () => [] }
	},
	data() {
		return {
			form: createDefaultForm(),
			submitting: false,
			lightGroups: [{ id: 0, name: '无' }],
			lightGroupsLoading: false,
			lightGroupSeq: 0,
			locationToken: '' // 地图选点回传配对标识
		};
	},
	computed: {
		isEdit() {
			return this.mode === 'edit';
		},
		title() {
			return this.isEdit ? '编辑站点' : '新增站点';
		},
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#3880FC';
		},
		bodyHeight() {
			return '64vh';
		},
		groupOptions() {
			return flattenGroups(this.groups);
		},
		groupDisplayName() {
			const matched = this.groupOptions.find(group => String(group.id) === String(this.form.groupId));
			return matched ? matched.name : (this.groupName || '');
		},
		stationTypeLabels() {
			return STATION_TYPE_OPTIONS.map(item => item.label);
		},
		stationTypeIndex() {
			const index = STATION_TYPE_OPTIONS.findIndex(item => item.value === Number(this.form.stationType));
			return index >= 0 ? index : 0;
		},
		stationTypeLabel() {
			const matched = STATION_TYPE_OPTIONS.find(item => item.value === Number(this.form.stationType));
			return matched ? matched.label : '请选择站点类型';
		},
		supplyModeLabels() {
			return SUPPLY_MODE_OPTIONS.map(item => item.label);
		},
		supplyModeIndex() {
			const index = SUPPLY_MODE_OPTIONS.findIndex(item => item.value === Number(this.form.supplyMode));
			return index >= 0 ? index : 0;
		},
		supplyModeLabel() {
			const matched = SUPPLY_MODE_OPTIONS.find(item => item.value === Number(this.form.supplyMode));
			return matched ? matched.label : '公变';
		},
		showSupplyMode() {
			return Number(this.form.stationType) === 1;
		},
		showLowFlow() {
			return supportsLowFlow(this.form.stationType);
		},
		showLightGroup() {
			return supportsLightGroup(this.form.stationType);
		},
		showLineAlarm() {
			return isSingleLampStation(this.form.stationType);
		},
		lightGroupLabels() {
			return this.lightGroups.map(group => group.name);
		},
		lightGroupIndex() {
			const index = this.lightGroups.findIndex(group => String(group.id) === String(this.form.lightGroupId));
			return index >= 0 ? index : 0;
		},
		lightGroupLabel() {
			if (this.lightGroupsLoading && this.lightGroups.length <= 1) return '加载中...';
			const matched = this.lightGroups.find(group => String(group.id) === String(this.form.lightGroupId));
			return matched ? matched.name : '无';
		}
	},
	watch: {
		visible(val) {
			if (val) this.initForm();
		}
	},
	mounted() {
		uni.$on(EVENT_LOCATION_RESULT, this.onLocationResult);
		// 兼容组件初始即为显示状态的情况
		if (this.visible) this.initForm();
	},
	beforeDestroy() {
		uni.$off(EVENT_LOCATION_RESULT, this.onLocationResult);
	},
	methods: {
		close() {
			if (this.submitting) return;
			this.$emit('close');
		},
		/** 打开弹窗时按新增 / 编辑初始化表单 */
		initForm() {
			const station = this.station || {};
			const editing = this.isEdit && station && station.id !== undefined && station.id !== null;
			const stationType = editing ? (Number(station.stationType) || 1) : 1;

			this.submitting = false;
			this.form = {
				groupId: editing && station.groupId !== undefined && station.groupId !== null
					? station.groupId
					: (this.groupId || 0),
				stationType: stationType,
				supplyMode: editing ? (Number(station.supplyMode) || 1) : 1,
				name: editing ? String(station.name || '') : '',
				area: editing ? String(station.area || '') : '',
				location: editing ? String(station.location || '') : '',
				lng: editing && station.lng !== undefined && station.lng !== null ? station.lng : '',
				lat: editing && station.lat !== undefined && station.lat !== null ? station.lat : '',
				install: editing && station.install ? formatDateOnly(station.install) : todayString(),
				lowFlow: editing ? !!station.lowFlow : false,
				lowStart: editing ? normalizeTime(station.lowStart, DEFAULT_LOW_START) : DEFAULT_LOW_START,
				lowEnd: editing ? normalizeTime(station.lowEnd, DEFAULT_LOW_END) : DEFAULT_LOW_END,
				lightGroupId: editing ? (Number(station.lightGroupId) || 0) : 0,
				lineErrorAlarm: editing
					? (station.lineErrorAlarm === undefined || station.lineErrorAlarm === null ? true : !!station.lineErrorAlarm)
					: true,
				lineErrorStart: editing ? minutesToTime(station.lineErrorStart, '09:00') : '09:00',
				lineErrorEnd: editing ? minutesToTime(station.lineErrorEnd, '19:00') : '19:00'
			};
			// 每次打开生成新的配对标识，避免上一次地图选点结果串到本次表单
			this.locationToken = `station-form-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
			this.loadLightGroups();
		},
		/** 单灯分组选项：首位固定为「无」（id=0） */
		loadLightGroups() {
			const seq = ++this.lightGroupSeq;
			this.lightGroups = [{ id: 0, name: '无' }];
			this.lightGroupsLoading = false;
			if (!supportsLightGroup(this.form.stationType)) return;
			this.lightGroupsLoading = true;
			const editing = this.isEdit && this.station && this.station.id !== undefined && this.station.id !== null;
			request({
				url: '/station/config/QueryArea',
				method: 'POST',
				// 新增按所属分组查询，编辑按当前站点查询（与 Web 端 QueryArea 调用方式一致）
				data: editing
					? { groupId: 0, stationId: this.station.id }
					: { groupId: Number(this.form.groupId) || 0, stationId: 0 }
			}).then(res => {
				if (seq !== this.lightGroupSeq) return;
				this.lightGroupsLoading = false;
				const list = this.parseResponseList(res);
				const options = [{ id: 0, name: '无' }];
				list.forEach(item => {
					const id = item && (item.id !== undefined ? item.id : item.areaId);
					const name = item && (item.name || item.areaName);
					if (id === undefined || id === null || !name) return;
					if (options.some(option => String(option.id) === String(id))) return;
					options.push({ id: id, name: name });
				});
				// 编辑时若当前分组不在接口返回中，保留原值供展示，避免静默清空
				const currentId = Number(this.form.lightGroupId) || 0;
				if (currentId && !options.some(option => String(option.id) === String(currentId))) {
					options.push({ id: currentId, name: '当前单灯分组' });
				}
				this.lightGroups = options;
			}).catch(err => {
				if (seq !== this.lightGroupSeq) return;
				this.lightGroupsLoading = false;
				console.error('获取单灯分组失败', err && err.message);
				uni.showToast({ title: '获取单灯分组失败', icon: 'none' });
			});
		},
		/** 兼容数组 / base64 包装的列表响应 */
		parseResponseList(res) {
			const payload = res && res.data;
			let data = payload && payload.data !== undefined ? payload.data : payload;
			if (typeof data === 'string') {
				const text = data.trim();
				try {
					// 兼容直接返回 JSON 字符串与 base64 包装两种情况
					data = text.charAt(0) === '[' || text.charAt(0) === '{'
						? JSON.parse(text)
						: JSON.parse(base64Decode(text) || '[]');
				} catch (e) {
					data = [];
				}
			}
			if (data && !Array.isArray(data)) {
				data = data.list || data.data || [];
			}
			return Array.isArray(data) ? data : [];
		},
		onStationTypeChange(e) {
			const index = Number(e && e.detail ? e.detail.value : 0) || 0;
			const nextType = STATION_TYPE_OPTIONS[index] ? STATION_TYPE_OPTIONS[index].value : 1;
			const prevType = Number(this.form.stationType) || 1;
			this.form.stationType = nextType;
			// 切换为单灯时默认开启线路报警；切换为其它类型时关闭并隐藏
			if (nextType === 3 && prevType !== 3) this.form.lineErrorAlarm = true;
			if (nextType !== 3) this.form.lineErrorAlarm = false;
			// 智慧灯杆不展示低流量与单灯分组
			if (!supportsLowFlow(nextType)) this.form.lowFlow = false;
			if (!supportsLightGroup(nextType)) {
				this.form.lightGroupId = 0;
			} else if (this.lightGroups.length <= 1) {
				// 从智慧灯杆切换到其它类型时补拉单灯分组选项
				this.loadLightGroups();
			}
			// 供电方式只属于配电柜站点
			if (nextType !== 1) this.form.supplyMode = 1;
		},
		onSupplyModeChange(e) {
			const index = Number(e && e.detail ? e.detail.value : 0) || 0;
			const matched = SUPPLY_MODE_OPTIONS[index];
			if (matched) this.form.supplyMode = matched.value;
		},
		onInstallChange(e) {
			this.form.install = (e && e.detail ? e.detail.value : '') || '';
		},
		onLowFlowChange(e) {
			this.form.lowFlow = !!(e && e.detail ? e.detail.value : false);
		},
		onLowStartChange(e) {
			this.form.lowStart = normalizeTime(e && e.detail ? e.detail.value : '', DEFAULT_LOW_START);
		},
		onLowEndChange(e) {
			this.form.lowEnd = normalizeTime(e && e.detail ? e.detail.value : '', DEFAULT_LOW_END);
		},
		onLineAlarmChange(e) {
			this.form.lineErrorAlarm = !!(e && e.detail ? e.detail.value : false);
		},
		onLineStartChange(e) {
			this.form.lineErrorStart = normalizeTime(e && e.detail ? e.detail.value : '', '09:00');
		},
		onLineEndChange(e) {
			this.form.lineErrorEnd = normalizeTime(e && e.detail ? e.detail.value : '', '19:00');
		},
		onLightGroupChange(e) {
			const index = Number(e && e.detail ? e.detail.value : 0) || 0;
			const matched = this.lightGroups[index];
			this.form.lightGroupId = matched ? (Number(matched.id) || 0) : 0;
		},
		/** 打开地图选点页 */
		pickLocation() {
			if (this.submitting) return;
			if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard();
			const query = [
				'mode=pick',
				`type=${POS_TYPE_BOX}`,
				`id=${this.isEdit && this.station && this.station.id !== undefined ? this.station.id : ''}`,
				`name=${encodeURIComponent(this.form.name || '')}`,
				`lat=${this.form.lat === '' ? '' : this.form.lat}`,
				`lng=${this.form.lng === '' ? '' : this.form.lng}`,
				`token=${encodeURIComponent(this.locationToken)}`
			].join('&');
			uni.navigateTo({
				url: `/pages/operation/components/showAndEditLocation?${query}`
			});
		},
		/** 地图选点结果：只接受本次表单发起的选点 */
		onLocationResult(payload) {
			if (!payload || payload.mode !== 'pick') return;
			if (payload.token !== this.locationToken) return;
			if (Number(payload.type) !== POS_TYPE_BOX) return;
			const lat = Number(payload.lat);
			const lng = Number(payload.lng);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
			this.form.lat = lat;
			this.form.lng = lng;
			this.form.location = this.formatPickedAddress(payload);
		},
		/** 选点回传地址：优先完整地址，缺失时用逆地理组件拼接 */
		formatPickedAddress(payload) {
			const address = String(payload && payload.address || '').trim();
			if (address) return address;
			const components = payload && payload.components;
			if (components) {
				const text = [
					components.province,
					components.city,
					components.district,
					components.town,
					components.street,
					components.streetNumber
				].filter(Boolean).join('');
				if (text) return text;
			}
			return '已选择位置';
		},
		/** 名称不能与现有站点重复（编辑时排除自身） */
		isNameDuplicated(name) {
			const selfId = this.isEdit && this.station ? this.station.id : null;
			return (this.stations || []).some(station => {
				if (!station) return false;
				if (selfId !== null && selfId !== undefined && String(station.id) === String(selfId)) return false;
				return String(station.name || '').trim() === name;
			});
		},
		/** 保存站点 */
		submit() {
			if (this.submitting) return;
			const name = String(this.form.name || '').trim();
			if (!Number(this.form.groupId)) {
				uni.showToast({ title: '未获取到所属分区', icon: 'none' });
				return;
			}
			if (!name) {
				uni.showToast({ title: '请输入站点名称', icon: 'none' });
				return;
			}
			// 编辑时名称未变化不再查重，避免历史重名数据导致无法编辑其它字段
			const originalName = this.isEdit && this.station ? String(this.station.name || '').trim() : '';
			if (name !== originalName && this.isNameDuplicated(name)) {
				uni.showToast({ title: '站点名称已存在', icon: 'none' });
				return;
			}
			if (!this.form.install) {
				uni.showToast({ title: '请选择安装时间', icon: 'none' });
				return;
			}

			const body = buildSaveStationBody({
				...this.form,
				id: this.isEdit && this.station ? this.station.id : '',
				name: name,
				groupId: this.form.groupId
			});

			this.submitting = true;
			uni.showLoading({ title: '保存中...', mask: true });
			request({
				url: '/station/config/SaveStation',
				method: 'POST',
				data: body
			}).then(res => {
				uni.hideLoading();
				this.submitting = false;
				const payload = res && res.data;
				if (payload && payload.code !== undefined && payload.code !== null && Number(payload.code) !== 0) {
					uni.showToast({ title: this.decodeErrorMessage(payload) || '保存失败', icon: 'none' });
					return;
				}
				uni.showToast({ title: this.isEdit ? '保存成功' : '新增成功', icon: 'success' });
				this.$emit('refresh', { mode: this.mode });
				this.$emit('close');
			}).catch(err => {
				uni.hideLoading();
				this.submitting = false;
				console.error('保存站点失败', err && err.message);
				uni.showToast({ title: '保存失败', icon: 'none' });
			});
		},
		/** 解析接口业务错误信息 */
		decodeErrorMessage(payload) {
			let msg = (payload && (payload.msg || payload.message)) || '';
			const data = payload && payload.data;
			if (typeof data === 'string' && data) {
				if (/^[A-Za-z0-9+/=]+$/.test(data)) {
					const decoded = base64Decode(data);
					if (decoded) msg = decoded;
				}
				if (!msg) msg = data;
			}
			if (typeof msg === 'string' && msg.charAt(0) === '{') {
				try {
					const parsed = JSON.parse(msg);
					if (parsed && typeof parsed === 'object') msg = parsed.msg || parsed.message || msg;
				} catch (e) {
					// 非 JSON 时按原文返回
				}
			}
			return String(msg || '');
		}
	}
};
</script>

<style lang="scss" scoped>
/* 弹窗动画 */
.sf-pop-enter-active,
.sf-pop-leave-active {
	transition: opacity 0.25s ease;
}

.sf-pop-enter-active .sf-card,
.sf-pop-leave-active .sf-card {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.sf-pop-enter,
.sf-pop-leave-to {
	opacity: 0;
}

.sf-pop-enter .sf-card,
.sf-pop-leave-to .sf-card {
	opacity: 0;
	transform: scale(0.92);
}

.station-form-popup {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
}

.sf-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.55);
}

.sf-card {
	position: relative;
	width: 680rpx;
	max-width: 92%;
	max-height: 88vh;
	box-sizing: border-box;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* 标题栏 */
.sf-header {
	height: 108rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 0 32rpx;
	box-sizing: border-box;
}

.sf-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.sf-close {
	position: absolute;
	right: 24rpx;
	top: 50%;
	transform: translateY(-50%);
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.sf-close-hover {
	opacity: 0.7;
}

/* 内容区 */
.sf-body {
	flex: 1 1 auto;
	min-height: 0;
	box-sizing: border-box;
	padding: 8rpx 32rpx 12rpx;
}

.sf-field {
	margin-bottom: 24rpx;
}

.sf-label-row {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
}

.sf-label {
	display: block;
	margin-bottom: 12rpx;
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

.sf-label-row .sf-label {
	margin-bottom: 0;
}

.sf-required {
	color: #ff3b30;
	font-size: 26rpx;
	margin-right: 4rpx;
}

.sf-control {
	min-height: 76rpx;
	padding: 0 22rpx;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 12rpx;
	display: flex;
	align-items: center;
}

.sf-control-between {
	justify-content: space-between;
}

/* 只读 / 禁用状态的表单控件（所属分区） */
.sf-control-disabled {
	background: var(--bg-page, #f7f8fa);
	border: 1rpx solid var(--border-color, #e5e5e5);
}

.sf-value-disabled {
	color: var(--text-secondary, #666666);
}

.sf-value {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.sf-placeholder {
	color: var(--text-quaternary, #999999);
}

.sf-input {
	flex: 1;
	min-width: 0;
	height: 76rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.sf-input-placeholder {
	color: var(--text-quaternary, #999999);
}

/* 安装位置 */
.sf-location {
	min-height: 84rpx;
	padding: 0 22rpx;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 12rpx;
	display: flex;
	align-items: center;
}

.sf-location-hover {
	background: var(--bg-accent, #eef3ff);
}

.sf-location-text {
	flex: 1;
	min-width: 0;
	margin: 0 16rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.sf-location-action {
	flex-shrink: 0;
	font-size: 26rpx;
	color: #3880FC;
}

/* 开关行 */
.sf-switch-row {
	min-height: 84rpx;
	padding: 0 22rpx;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.sf-switch-label-box {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.sf-switch-label-box .sf-label {
	margin-bottom: 4rpx;
	color: var(--text-primary, #333333);
}

.sf-switch-hint {
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
}

/* 时间区间 */
.sf-time-range {
	display: flex;
	align-items: flex-end;
	margin-top: 16rpx;
}

.sf-time-item {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.sf-time-label {
	margin-bottom: 8rpx;
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
}

.sf-time-box {
	width: 100%;
	min-width: 0;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	text-align: center;
	background: var(--bg-soft, #f2f4f8);
	border-radius: 12rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.sf-time-sep {
	margin: 0 18rpx;
	padding-bottom: 24rpx;
	font-size: 26rpx;
	color: var(--text-tertiary, #888888);
}

.sf-tip {
	display: block;
	margin-top: 12rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: var(--text-quaternary, #999999);
}

/* 底部按钮 */
.sf-footer {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	padding: 20rpx 32rpx 28rpx;
}

.sf-btn {
	flex: 1;
	height: 84rpx;
	line-height: 80rpx;
	font-size: 30rpx;
	border-radius: 12rpx;
	margin: 0;
	padding: 0;
	text-align: center;
	box-sizing: border-box;
	background-color: transparent;
	color: #3880FC;
	border: 2rpx solid #3880FC;

	&::after {
		border: none;
	}

	&.primary {
		margin-left: 32rpx;
		background-color: #3880FC;
		color: #ffffff;
		border: none;
		line-height: 84rpx;
	}

	&[disabled] {
		opacity: 0.6;
	}
}
</style>
