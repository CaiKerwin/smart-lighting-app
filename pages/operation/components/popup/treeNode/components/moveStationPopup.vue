<!-- 移动站点弹窗 -->
<template>
	<transition name="mv-pop">
		<view v-if="visible" :class="themeClass" class="move-station-popup">
			<!-- 半透明遮罩 -->
			<view class="mv-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="mv-card" @click.stop>
				<!-- 标题栏 -->
				<view class="mv-header">
					<text class="mv-title">移动站点</text>
					<view class="mv-close" hover-class="mv-close-hover" @click="close">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 表单内容 -->
				<view class="mv-body">
					<!-- 当前站点 -->
					<view class="mv-field">
						<view class="mv-label-box">
							<text class="mv-label">当前站点</text>
						</view>
						<text class="mv-station-name">{{ stationName || '-' }}</text>
					</view>

					<!-- 移动到的分组 -->
					<view class="mv-field">
						<view class="mv-label-box">
							<text class="mv-required">*</text>
							<text class="mv-label">所属分组</text>
						</view>
						<view class="mv-control-wrap">
							<view
								:class="['mv-control', 'mv-control-tap', { 'mv-control-error': errorMessage }]"
								hover-class="mv-control-hover"
								@click="openGroupPicker"
							>
								<text :class="['mv-select-value', { 'mv-placeholder': !targetDisplayName }]">
									{{ targetDisplayName || '请选择所属分组' }}
								</text>
								<view class="mv-group-add" hover-class="mv-group-add-hover" @click.stop="openGroupPicker">
									<uni-icons :color="isDarkMode ? '#8b94a8' : '#666666'" size="24" type="down"></uni-icons>
								</view>
							</view>
							<text v-if="errorMessage" class="mv-error">{{ errorMessage }}</text>
						</view>
					</view>
				</view>

				<!-- 底部按钮 -->
				<view class="mv-footer">
					<button class="mv-btn" @click="close">取消</button>
					<button :disabled="submitting" class="mv-btn primary" @click="submit">
						{{ submitting ? '移动中...' : '确定' }}
					</button>
				</view>
			</view>

			<!-- 所属分组选择层 -->
			<view v-if="groupPickerVisible" class="mv-picker-mask">
				<view class="mv-picker-backdrop" @click="closeGroupPicker" @touchmove.stop.prevent></view>

				<view class="mv-picker-card" @click.stop>
					<view class="mv-picker-header">
						<text class="mv-picker-title">选择所属分组</text>
						<view class="mv-close" hover-class="mv-close-hover" @click="closeGroupPicker">
							<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
						</view>
					</view>

					<scroll-view class="mv-picker-list" scroll-y>
						<view
							v-for="item in groupOptions"
							:key="item.id"
							class="mv-picker-item"
							hover-class="mv-picker-item-hover"
							@click="chooseGroup(item)"
						>
							<view :style="{ paddingLeft: groupPadding(item) }" class="mv-picker-main">
								<image class="mv-picker-icon" mode="aspectFit" src="/static/operation/city.png" />
								<text class="mv-picker-name">{{ item.name }}</text>
								<text v-if="isCurrentGroup(item)" class="mv-picker-tag">当前</text>
							</view>
							<uni-icons
								v-if="isSelectedGroup(item)"
								:color="primaryColor"
								size="18"
								type="checkmarkempty"
							></uni-icons>
						</view>

						<view v-if="!groupOptions.length" class="mv-picker-empty">暂无可选分组</view>
					</scroll-view>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
import { request } from '@/utils/request';
import { base64Decode } from '@/utils/common';

// ==================== 移动站点用到的站点表单规则 ====================

// 线路报警默认时段：09:00 ~ 19:00
const DEFAULT_LINE_ERROR_START = 540;
const DEFAULT_LINE_ERROR_END = 1140;

// 低流量默认时段
const DEFAULT_LOW_START = '08:00';
const DEFAULT_LOW_END = '18:00';

const pad2 = value => (Number(value) < 10 ? '0' : '') + Number(value);

/** 单灯站点才有线路报警 */
function isSingleLampStation(stationType) {
	return Number(stationType) === 3;
}

/** 智慧灯杆站点没有低流量与单灯分组 */
function supportsLowFlow(stationType) {
	return Number(stationType) !== 7;
}

function supportsLightGroup(stationType) {
	return Number(stationType) !== 7;
}

/** 统一成 yyyy-MM-dd（接口返回的安装时间形如 "2026-06-03 00:00:00"） */
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

function toCoordinate(value) {
	const number = Number(value);
	return Number.isFinite(number) ? number : 0;
}

/**
 * 把平铺分组列表拍平成带层级的列表（分组选择层按层级展示）
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

/**
 * 移动只改所属分组，其余字段沿用站点当前值，按 SaveStation 的字段要求重新组装请求体
 * @param {Object} station 当前站点完整数据
 * @param {*} groupId 目标分组 id
 */
function buildMoveStationBody(station, groupId) {
	const stationType = Number(station.stationType) || 1;
	const singleLamp = isSingleLampStation(stationType);
	const lowFlow = supportsLowFlow(stationType) ? !!station.lowFlow : false;
	const lineErrorAlarm = singleLamp
		? (station.lineErrorAlarm === undefined || station.lineErrorAlarm === null ? true : !!station.lineErrorAlarm)
		: false;

	return {
		id: station.id,
		groupId: Number(groupId) || 0,
		type: 1,
		name: String(station.name || '').trim(),
		location: String(station.location || '').trim(),
		install: formatDateOnly(station.install),
		stype: 0,
		area: String(station.area || '').trim(),
		lng: toCoordinate(station.lng),
		lat: toCoordinate(station.lat),
		lowFlow: lowFlow,
		lowStart: lowFlow ? normalizeTime(station.lowStart, DEFAULT_LOW_START) : '',
		lightGroupId: supportsLightGroup(stationType) ? (Number(station.lightGroupId) || 0) : 0,
		lowEnd: lowFlow ? normalizeTime(station.lowEnd, DEFAULT_LOW_END) : '',
		stationType: stationType,
		supplyMode: Number(station.supplyMode) || 1,
		lineErrorAlarm: lineErrorAlarm,
		lineErrorStart: timeToMinutes(station.lineErrorStart, DEFAULT_LINE_ERROR_START),
		lineErrorEnd: timeToMinutes(station.lineErrorEnd, DEFAULT_LINE_ERROR_END)
	};
}

export default {
	name: 'MoveStationPopup',
	props: {
		visible: { type: Boolean, default: false },
		// 要移动的站点完整数据
		station: { type: Object, default: null },
		// 全量分组（平铺）
		groups: { type: Array, default: () => [] }
	},
	data() {
		return {
			submitting: false,
			groupPickerVisible: false,
			// 选择的移动目标分组 id
			targetGroupId: null,
			errorMessage: ''
		};
	},
	computed: {
		stationName() {
			return (this.station && this.station.name) || '';
		},
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#3880FC';
		},
		// 全量分组（按层级拍平），分组选择层按层级展示
		groupOptions() {
			return flattenGroups(this.groups);
		},
		// 已选择的移动目标分组名称
		targetDisplayName() {
			const matched = this.groupOptions.find(item => String(item.id) === String(this.targetGroupId));
			return matched ? matched.name : '';
		},
		// 站点当前所属分组，在分组选择层中标记「当前」
		currentGroupId() {
			return this.station && this.station.groupId !== undefined && this.station.groupId !== null
				? this.station.groupId
				: null;
		}
	},
	watch: {
		visible(val) {
			if (val) {
				this.initForm();
			} else {
				this.groupPickerVisible = false;
			}
		}
	},
	mounted() {
		// 兼容组件初始即为显示状态的情况
		if (this.visible) this.initForm();
	},
	methods: {
		close() {
			if (this.submitting) return;
			this.groupPickerVisible = false;
			this.$emit('close');
		},
		/** 打开弹窗时重置选择状态 */
		initForm() {
			this.targetGroupId = null;
			this.errorMessage = '';
			this.submitting = false;
			this.groupPickerVisible = false;
		},
		/** 打开分组选择层 */
		openGroupPicker() {
			if (this.submitting) return;
			if (!this.groupOptions.length) {
				uni.showToast({ title: '暂无可选分组', icon: 'none' });
				return;
			}
			if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard();
			this.errorMessage = '';
			this.groupPickerVisible = true;
		},
		closeGroupPicker() {
			this.groupPickerVisible = false;
		},
		/** 选择要移动到的分组 */
		chooseGroup(item) {
			if (!item || this.submitting) return;
			// 站点已在该分组，无需移动
			if (this.isCurrentGroup(item)) {
				uni.showToast({ title: '站点已在该分组', icon: 'none' });
				return;
			}
			this.targetGroupId = item.id;
			this.errorMessage = '';
			this.groupPickerVisible = false;
		},
		// 按层级计算左侧缩进，体现分组层级关系
		groupPadding(item) {
			const level = item && item.level !== undefined && item.level !== null ? item.level : 0;
			return Math.max(level, 0) * 32 + 'rpx';
		},
		isSelectedGroup(item) {
			return !!item && String(item.id) === String(this.targetGroupId);
		},
		isCurrentGroup(item) {
			return !!item && this.currentGroupId !== null && String(item.id) === String(this.currentGroupId);
		},
		/** 点击确定：校验后保存 */
		submit() {
			if (this.submitting) return;
			const station = this.station;
			if (!station || station.id === undefined || station.id === null) {
				uni.showToast({ title: '未获取到站点信息', icon: 'none' });
				return;
			}
			const target = this.groupOptions.find(item => String(item.id) === String(this.targetGroupId));
			if (!target) {
				this.errorMessage = '请选择所属分组';
				return;
			}
			if (this.isCurrentGroup(target)) {
				this.errorMessage = '目标分组不能与当前分组相同';
				return;
			}
			if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard();
			this.save(target);
		},
		/** 移动站点：复用 SaveStation，只修改 groupId */
		save(target) {
			const station = this.station;
			if (!station || station.id === undefined || station.id === null) {
				uni.showToast({ title: '未获取到站点信息', icon: 'none' });
				return;
			}
			if (this.submitting) return;

			const body = buildMoveStationBody(station, target.id);

			this.submitting = true;
			uni.showLoading({ title: '移动中...', mask: true });
			request({
				url: '/station/config/SaveStation',
				method: 'POST',
				data: body
			}).then(res => {
				uni.hideLoading();
				this.submitting = false;
				const payload = res && res.data;
				if (payload && payload.code !== undefined && payload.code !== null && Number(payload.code) !== 0) {
					uni.showToast({ title: this.decodeErrorMessage(payload) || '移动失败', icon: 'none' });
					return;
				}
				uni.showToast({ title: '移动成功', icon: 'success' });
				this.$emit('refresh');
				this.$emit('close');
			}).catch(err => {
				uni.hideLoading();
				this.submitting = false;
				console.error('移动站点失败', err && err.message);
				uni.showToast({ title: '移动失败', icon: 'none' });
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
.mv-pop-enter-active,
.mv-pop-leave-active {
	transition: opacity 0.25s ease;
}

.mv-pop-enter-active .mv-card,
.mv-pop-leave-active .mv-card {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.mv-pop-enter,
.mv-pop-leave-to {
	opacity: 0;
}

.mv-pop-enter .mv-card,
.mv-pop-leave-to .mv-card {
	opacity: 0;
	transform: scale(0.92);
}

.move-station-popup {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mv-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.55);
}

.mv-card {
	position: relative;
	width: 660rpx;
	max-width: 92%;
	box-sizing: border-box;
	padding: 0 32rpx 32rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
}

/* 标题栏 */
.mv-header {
	height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.mv-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.mv-close {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mv-close-hover {
	opacity: 0.7;
}

/* 表单内容 */
.mv-body {
	padding: 4rpx 8rpx 8rpx;
}

.mv-field {
	display: flex;
	align-items: flex-start;
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 8rpx;
	}
}

.mv-label-box {
	flex-shrink: 0;
	width: 150rpx;
	padding-top: 24rpx;
	display: flex;
	align-items: center;
}

.mv-label {
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

.mv-required {
	margin-right: 4rpx;
	font-size: 26rpx;
	color: #ff3b30;
}

.mv-station-name {
	flex: 1;
	min-width: 0;
	padding-top: 24rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.mv-control-wrap {
	flex: 1;
	min-width: 0;
}

.mv-control {
	min-height: 76rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border: 1rpx solid transparent;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
}

.mv-control-error {
	border-color: #ff3b30;
}

.mv-control-tap {
	cursor: pointer;
}

.mv-control-hover {
	background: var(--bg-accent, #eef3ff);
}

.mv-select-value {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.mv-placeholder {
	color: var(--text-quaternary, #999999);
}

/* 所属分组右侧选择入口 */
.mv-group-add {
	flex-shrink: 0;
	width: 60rpx;
	height: 60rpx;
	margin-left: 8rpx;
	margin-right: -8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
}

.mv-group-add-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.mv-error {
	display: block;
	margin-top: 8rpx;
	padding-left: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #ff3b30;
}

/* 底部按钮 */
.mv-footer {
	display: flex;
	align-items: center;
	padding: 16rpx 40rpx 8rpx;
}

.mv-btn {
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

/* 所属分组选择层 */
.mv-picker-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mv-picker-backdrop {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.45);
}

.mv-picker-card {
	position: relative;
	z-index: 1;
	width: 600rpx;
	max-width: 88%;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
	overflow: hidden;
}

.mv-picker-header {
	flex-shrink: 0;
	height: 96rpx;
	padding: 0 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	border-bottom: 1rpx solid var(--border-color, #ececec);
}

.mv-picker-title {
	font-size: 30rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.mv-picker-list {
	flex: 1;
	max-height: 46vh;
	padding: 8rpx 0;
	box-sizing: border-box;
}

.mv-picker-item {
	display: flex;
	align-items: center;
	padding: 22rpx 24rpx;
}

.mv-picker-item-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.mv-picker-main {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
}

.mv-picker-icon {
	flex-shrink: 0;
	width: 44rpx;
	height: 44rpx;
	margin-right: 10rpx;
}

.mv-picker-name {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.mv-picker-tag {
	flex-shrink: 0;
	margin-left: 12rpx;
	padding: 2rpx 10rpx;
	font-size: 20rpx;
	line-height: 1.5;
	color: #3880FC;
	border: 1rpx solid rgba(56, 128, 252, 0.5);
	border-radius: 8rpx;
}

.mv-picker-empty {
	padding: 60rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}
</style>
