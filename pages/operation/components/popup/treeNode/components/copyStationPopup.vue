<!-- 复制站点弹窗 -->
<template>
	<transition name="cp-pop">
		<view v-if="visible" :class="themeClass" class="copy-station-popup">
			<!-- 半透明遮罩 -->
			<view class="cp-mask" @click="close" @touchmove.stop.prevent></view>

			<!-- 弹窗卡片 -->
			<view class="cp-card" @click.stop>
				<!-- 标题栏 -->
				<view class="cp-header">
					<text class="cp-title">复制站点</text>
					<view class="cp-close" hover-class="cp-close-hover" @click="close">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 表单内容 -->
				<view class="cp-body">
					<!-- 要复制的站点 -->
					<view class="cp-field">
						<view class="cp-label-box">
							<text class="cp-label">复制对象</text>
						</view>
						<text class="cp-station-name">{{ stationName || '-' }}</text>
					</view>

					<!-- 新的站点名称（必填、不可重名） -->
					<view class="cp-field">
						<view class="cp-label-box">
							<text class="cp-required">*</text>
							<text class="cp-label">名称</text>
						</view>
						<view class="cp-control-wrap">
							<view :class="['cp-control', { 'cp-control-error': errors.name }]">
								<input
									v-model="form.name"
									class="cp-input"
									maxlength="50"
									placeholder="输入名称"
									placeholder-class="cp-input-placeholder"
									@input="clearError('name')"
								/>
							</view>
							<text v-if="errors.name" class="cp-error">{{ errors.name }}</text>
						</view>
					</view>

					<!-- 通信ID（必填，纯数字 / 纯字母 / 字母数字组合） -->
					<view class="cp-field">
						<view class="cp-label-box">
							<text class="cp-required">*</text>
							<text class="cp-label">通信ID</text>
						</view>
						<view class="cp-control-wrap">
							<view :class="['cp-control', { 'cp-control-error': errors.code }]">
								<input
									v-model="form.code"
									class="cp-input"
									maxlength="50"
									placeholder="输入通信ID"
									placeholder-class="cp-input-placeholder"
									@input="clearError('code')"
								/>
								<view class="cp-scan" hover-class="cp-scan-hover" @click="scanCode">
									<uni-icons :color="primaryColor" size="22" type="scan"></uni-icons>
								</view>
							</view>
							<text v-if="errors.code" class="cp-error">{{ errors.code }}</text>
						</view>
					</view>

					<!-- 要复制到的分组 -->
					<view class="cp-field">
						<view class="cp-label-box">
							<text class="cp-required">*</text>
							<text class="cp-label">所属分组</text>
						</view>
						<view class="cp-control-wrap">
							<view
								:class="['cp-control', 'cp-control-tap', { 'cp-control-error': errors.groupId }]"
								hover-class="cp-control-hover"
								@click="openGroupPicker"
							>
								<text :class="['cp-select-value', { 'cp-placeholder': !groupDisplayName }]">
									{{ groupDisplayName || '请选择所属分组' }}
								</text>
								<view class="cp-group-add" hover-class="cp-group-add-hover" @click.stop="openGroupPicker">
									<uni-icons :color="isDarkMode ? '#8b94a8' : '#666666'" size="24" type="down"></uni-icons>
								</view>
							</view>
							<text v-if="errors.groupId" class="cp-error">{{ errors.groupId }}</text>
						</view>
					</view>
				</view>

				<!-- 底部按钮 -->
				<view class="cp-footer">
					<button class="cp-btn" @click="close">取消</button>
					<button :disabled="submitting" class="cp-btn primary" @click="submit">
						{{ submitting ? '复制中...' : '确定' }}
					</button>
				</view>
			</view>

			<!-- 所属分组选择层 -->
			<view v-if="groupPickerVisible" class="cp-picker-mask">
				<view class="cp-picker-backdrop" @click="closeGroupPicker" @touchmove.stop.prevent></view>

				<view class="cp-picker-card" @click.stop>
					<view class="cp-picker-header">
						<text class="cp-picker-title">选择所属分组</text>
						<view class="cp-close" hover-class="cp-close-hover" @click="closeGroupPicker">
							<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
						</view>
					</view>

					<scroll-view class="cp-picker-list" scroll-y>
						<view
							v-for="item in groupOptions"
							:key="item.id"
							class="cp-picker-item"
							hover-class="cp-picker-item-hover"
							@click="chooseGroup(item)"
						>
							<view :style="{ paddingLeft: groupPadding(item) }" class="cp-picker-main">
								<image class="cp-picker-icon" mode="aspectFit" src="/static/operation/city.png" />
								<text class="cp-picker-name">{{ item.name }}</text>
								<text v-if="isCurrentGroup(item)" class="cp-picker-tag">当前</text>
							</view>
							<uni-icons
								v-if="isSelectedGroup(item)"
								:color="primaryColor"
								size="18"
								type="checkmarkempty"
							></uni-icons>
						</view>

						<view v-if="!groupOptions.length" class="cp-picker-empty">暂无可选分组</view>
					</scroll-view>
				</view>
			</view>
		</view>
	</transition>
</template>

<script>
import { request } from '@/utils/request';
import { base64Decode } from '@/utils/common';

// 通信ID规则：只能由纯数字、纯字母或两者组合而成
const CODE_PATTERN = /^[A-Za-z0-9]+$/;

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

export default {
	name: 'CopyStationPopup',
	props: {
		visible: { type: Boolean, default: false },
		// 要复制的站点完整数据
		station: { type: Object, default: null },
		// 全量分组（平铺）
		groups: { type: Array, default: () => [] },
		// 全量站点（平铺），用于新站点名称查重
		stations: { type: Array, default: () => [] }
	},
	data() {
		return {
			form: {
				name: '',
				code: '',
				groupId: null
			},
			errors: {
				name: '',
				code: '',
				groupId: ''
			},
			submitting: false,
			groupPickerVisible: false
		};
	},
	computed: {
		stationName() {
			return (this.station && this.station.name) || '';
		},
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#3880FC';
		},
		groupOptions() {
			return flattenGroups(this.groups);
		},
		groupDisplayName() {
			const matched = this.groupOptions.find(item => String(item.id) === String(this.form.groupId));
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
		/** 打开弹窗时初始化表单：默认复制到站点当前所在分组 */
		initForm() {
			const station = this.station || {};
			const options = this.groupOptions;
			const currentId = station.groupId !== undefined && station.groupId !== null ? station.groupId : null;
			const matched = currentId !== null
				? options.find(item => String(item.id) === String(currentId))
				: null;

			this.form = {
				name: '',
				code: '',
				groupId: matched ? matched.id : (options.length ? options[0].id : null)
			};
			this.errors = { name: '', code: '', groupId: '' };
			this.submitting = false;
			this.groupPickerVisible = false;
		},
		clearError(key) {
			if (this.errors[key]) this.errors[key] = '';
		},
		/** 打开分组选择层 */
		openGroupPicker() {
			if (this.submitting) return;
			if (!this.groupOptions.length) {
				uni.showToast({ title: '暂无可选分组', icon: 'none' });
				return;
			}
			if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard();
			this.groupPickerVisible = true;
		},
		closeGroupPicker() {
			this.groupPickerVisible = false;
		},
		/** 选择要复制到的分组 */
		chooseGroup(item) {
			if (!item) return;
			this.form.groupId = item.id;
			this.clearError('groupId');
			this.groupPickerVisible = false;
		},
		// 按层级计算左侧缩进，体现分组层级关系
		groupPadding(item) {
			const level = item && item.level !== undefined && item.level !== null ? item.level : 0;
			return Math.max(level, 0) * 32 + 'rpx';
		},
		isSelectedGroup(item) {
			return !!item && String(item.id) === String(this.form.groupId);
		},
		isCurrentGroup(item) {
			return !!item && this.currentGroupId !== null && String(item.id) === String(this.currentGroupId);
		},
		/** 扫码获取通信ID（H5 不支持扫码时给出提示） */
		scanCode() {
			if (this.submitting) return;
			if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard();

			// #ifdef H5
			uni.showToast({ title: '暂不支持扫码', icon: 'none' });
			// #endif

			// #ifndef H5
			uni.scanCode({
				onlyFromCamera: false,
				scanType: ['qrCode', 'barCode', 'datamatrix', 'pdf417'],
				success: res => {
					const raw = (res && res.result) || '';
					// 二维码内容可能带换行，去掉空白字符后作为通信ID
					const code = raw.replace(/\s/g, '');
					if (!code) {
						uni.showToast({ title: '未获取到通信ID', icon: 'none' });
						return;
					}
					this.form.code = code;
					this.clearError('code');
				},
				fail: err => {
					// 用户主动取消扫码时不提示
					const msg = (err && err.errMsg) || '';
					if (msg.indexOf('cancel') === -1) {
						uni.showToast({ title: '扫码失败', icon: 'none' });
					}
				}
			});
			// #endif
		},
		/** 新站点名称不能与现有站点重复 */
		isNameDuplicated(name) {
			const target = String(name || '').trim();
			return (this.stations || []).some(station => {
				return !!station && String(station.name || '').trim() === target;
			});
		},
		/** 表单校验：名称必填且不重名、通信ID格式、所属分组必选 */
		validate() {
			const name = String(this.form.name || '').trim();
			const code = String(this.form.code || '').trim();
			this.form.name = name;
			this.form.code = code;

			const errors = { name: '', code: '', groupId: '' };
			if (!name) {
				errors.name = '请输入站点名称';
			} else if (this.isNameDuplicated(name)) {
				errors.name = '站点名称已存在';
			}
			if (!code) {
				errors.code = '请输入通信ID';
			} else if (!CODE_PATTERN.test(code)) {
				errors.code = '通信ID只能由纯数字或纯字母或两者混合组成';
			}
			const selectedGroup = this.groupOptions.find(item => String(item.id) === String(this.form.groupId));
			if (!selectedGroup) {
				errors.groupId = '请选择所属分组';
			} else {
				this.form.groupId = selectedGroup.id;
			}
			this.errors = errors;

			return !errors.name && !errors.code && !errors.groupId;
		},
		/** 复制站点 */
		submit() {
			if (this.submitting) return;
			const station = this.station;
			if (!station || station.id === undefined || station.id === null) {
				uni.showToast({ title: '未获取到站点信息', icon: 'none' });
				return;
			}
			if (!this.validate()) return;
			if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard();

			const body = {
				name: this.form.name,
				code: this.form.code,
				groupId: Number(this.form.groupId),
				id: station.id
			};

			this.submitting = true;
			uni.showLoading({ title: '复制中...', mask: true });
			request({
				url: '/station/config/CopyStation',
				method: 'POST',
				data: body
			}).then(res => {
				uni.hideLoading();
				this.submitting = false;
				const payload = res && res.data;
				if (payload && payload.code !== undefined && payload.code !== null && Number(payload.code) !== 0) {
					uni.showToast({ title: this.decodeErrorMessage(payload) || '复制失败', icon: 'none' });
					return;
				}
				uni.showToast({ title: '复制成功', icon: 'success' });
				this.$emit('refresh');
				this.$emit('close');
			}).catch(err => {
				uni.hideLoading();
				this.submitting = false;
				console.error('复制站点失败', err && err.message);
				uni.showToast({ title: '复制失败', icon: 'none' });
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
.cp-pop-enter-active,
.cp-pop-leave-active {
	transition: opacity 0.25s ease;
}

.cp-pop-enter-active .cp-card,
.cp-pop-leave-active .cp-card {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.cp-pop-enter,
.cp-pop-leave-to {
	opacity: 0;
}

.cp-pop-enter .cp-card,
.cp-pop-leave-to .cp-card {
	opacity: 0;
	transform: scale(0.92);
}

.copy-station-popup {
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

.cp-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.55);
}

.cp-card {
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
.cp-header {
	height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.cp-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.cp-close {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.cp-close-hover {
	opacity: 0.7;
}

/* 表单内容 */
.cp-body {
	padding: 4rpx 8rpx 8rpx;
}

.cp-field {
	display: flex;
	align-items: flex-start;
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 8rpx;
	}
}

.cp-label-box {
	flex-shrink: 0;
	width: 150rpx;
	padding-top: 24rpx;
	display: flex;
	align-items: center;
}

.cp-label {
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
}

.cp-required {
	margin-right: 4rpx;
	font-size: 26rpx;
	color: #ff3b30;
}

.cp-station-name {
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

.cp-control-wrap {
	flex: 1;
	min-width: 0;
}

.cp-control {
	min-height: 76rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	background: var(--bg-soft, #f2f4f8);
	border: 1rpx solid transparent;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
}

.cp-control-error {
	border-color: #ff3b30;
}

.cp-control-tap {
	cursor: pointer;
}

.cp-control-hover {
	background: var(--bg-accent, #eef3ff);
}

.cp-input {
	flex: 1;
	min-width: 0;
	height: 76rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.cp-input-placeholder {
	color: var(--text-quaternary, #999999);
}

/* 通信ID 行内扫码 */
.cp-scan {
	flex-shrink: 0;
	width: 56rpx;
	height: 56rpx;
	margin-left: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
}

.cp-scan-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.cp-select-value {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.cp-placeholder {
	color: var(--text-quaternary, #999999);
}

/* 所属分组右侧选择入口 */
.cp-group-add {
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

.cp-group-add-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.cp-error {
	display: block;
	margin-top: 8rpx;
	padding-left: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #ff3b30;
}

/* 底部按钮 */
.cp-footer {
	display: flex;
	align-items: center;
	padding: 16rpx 40rpx 8rpx;
}

.cp-btn {
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
.cp-picker-mask {
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

.cp-picker-backdrop {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.45);
}

.cp-picker-card {
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

.cp-picker-header {
	flex-shrink: 0;
	height: 96rpx;
	padding: 0 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	border-bottom: 1rpx solid var(--border-color, #ececec);
}

.cp-picker-title {
	font-size: 30rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.cp-picker-list {
	flex: 1;
	max-height: 46vh;
	padding: 8rpx 0;
	box-sizing: border-box;
}

.cp-picker-item {
	display: flex;
	align-items: center;
	padding: 22rpx 24rpx;
}

.cp-picker-item-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.cp-picker-main {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
}

.cp-picker-icon {
	flex-shrink: 0;
	width: 44rpx;
	height: 44rpx;
	margin-right: 10rpx;
}

.cp-picker-name {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.cp-picker-tag {
	flex-shrink: 0;
	margin-left: 12rpx;
	padding: 2rpx 10rpx;
	font-size: 20rpx;
	line-height: 1.5;
	color: #3880FC;
	border: 1rpx solid rgba(56, 128, 252, 0.5);
	border-radius: 8rpx;
}

.cp-picker-empty {
	padding: 60rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: var(--text-quaternary, #999999);
}
</style>
