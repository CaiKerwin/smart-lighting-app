<!-- 设备信息弹窗：新增设备 / 编辑设备 -->
<template>
	<view v-if="visible" :class="themeClass" class="device-form-root">
		<!-- 遮罩 -->
		<view class="df-mask" @click="onCancel" @touchmove.stop.prevent></view>

		<!-- 底部表单面板 -->
		<view class="df-sheet" @click.stop>

			<!-- 标题栏 -->
			<view class="df-header">
				<text class="df-title">{{ title }}</text>
				<view class="df-close" hover-class="df-close-hover" @click="onCancel">
					<uni-icons :color="iconMutedColor" size="22" type="closeempty" />
				</view>
			</view>

			<!-- 表单内容 -->
			<scroll-view :scroll-into-view="scrollTarget" :show-scrollbar="false" class="df-body" scroll-y>
				<!-- ==================== 基本信息 ==================== -->
				<view class="df-section">
					<view class="df-section-title">
						<uni-icons :color="iconMutedColor" size="20" type="info" />
						<text>基本信息</text>
					</view>

					<!-- 所属站点：只读，来源为进入页面时携带的站点 -->
					<view id="df-row-station" class="df-row">
						<view class="df-label">
							<text class="df-star">*</text>
							<text>所属站点</text>
						</view>
						<view class="df-control df-control-readonly">
							<text class="df-readonly-value">{{ stationDisplayName }}</text>
							<uni-icons :color="iconMutedColor" size="20" type="locked" />
						</view>
					</view>

					<!-- 上级设备：选择框，选项为当前表格中的设备名称，可为空（无） -->
					<view id="df-row-parent" class="df-row df-row-tap" hover-class="df-row-hover"
					      @click="openPicker('parent')">
						<view class="df-label">
							<text>上级设备</text>
						</view>
						<view class="df-control df-control-select">
							<text class="df-select-value">{{ parentLabel }}</text>
							<uni-icons :color="iconMutedColor" size="20" type="down" />
						</view>
					</view>

					<!-- 设备名称：必填 -->
					<view id="df-row-name" :class="{ 'df-row-error': errors.name }" class="df-row">
						<view class="df-label">
							<text class="df-star">*</text>
							<text>设备名称</text>
						</view>
						<view class="df-control">
							<input v-model="form.name" :placeholder-style="placeholderStyle" class="df-input"
							       maxlength="50" placeholder="请输入设备名称"
							       type="text" @input="clearError('name')" />
						</view>
					</view>
					<view v-if="errors.name" class="df-error">{{ errors.name }}</view>

					<!-- 通信ID：必填；新增可扫码带入，编辑时不可修改 -->
					<view id="df-row-code" :class="{ 'df-row-error': errors.code }" class="df-row">
						<view class="df-label">
							<text class="df-star">*</text>
							<text>通信ID</text>
						</view>
						<!-- 编辑：只读展示，禁止修改通信ID -->
						<view v-if="isEdit" class="df-control df-control-readonly">
							<text class="df-readonly-value">{{ form.code || '-' }}</text>
							<uni-icons :color="iconMutedColor" size="20" type="locked" />
						</view>
						<!-- 新增：可输入，或扫码获取通信ID -->
						<view v-else class="df-control">
							<input v-model="form.code" :placeholder-style="placeholderStyle"
							       class="df-input" placeholder="请输入有效的通信ID"
							       type="text" @input="clearError('code')" />
							<!-- #ifndef H5 -->
							<view class="df-scan" hover-class="df-scan-hover" @click="requestScan">
								<uni-icons :color="primaryColor" size="16" type="scan" />
								<text class="df-scan-text" >扫码获取</text>
							</view>
							<!-- #endif -->
						</view>
					</view>
					<text class="df-tip">注意：通信ID由纯数字或者纯字母或者两者混和组成</text>
					<view v-if="errors.code" class="df-error">{{ errors.code }}</view>
				</view>

				<!-- ==================== 设备类型 ==================== -->
				<view class="df-section">
					<view class="df-section-title">
						<uni-icons :color="iconMutedColor" size="20" type="info" />
						<text>设备类型</text>
					</view>

					<!-- 设备大类：选择框 -->
					<view id="df-row-bigType" :class="{ 'df-row-error': errors.bigType }"
					      class="df-row df-row-tap" hover-class="df-row-hover" @click="openPicker('bigType')">
						<view class="df-label">
							<text class="df-star">*</text>
							<text>设备大类</text>
						</view>
						<view class="df-control df-control-select">
							<text :class="['df-select-value', { 'df-placeholder': !bigLabel }]">{{ bigLabel || '请选择设备大类' }}</text>
							<uni-icons :color="iconMutedColor" size="20" type="down" />
						</view>
					</view>
					<view v-if="errors.bigType" class="df-error">{{ errors.bigType }}</view>

					<!-- 设备小类：选择框，选项按已选大类过滤 -->
					<view id="df-row-smallType" :class="{ 'df-row-error': errors.smallType }"
					      class="df-row df-row-tap" hover-class="df-row-hover" @click="openPicker('smallType')">
						<view class="df-label">
							<text class="df-star">*</text>
							<text>设备小类</text>
						</view>
						<view class="df-control df-control-select">
							<text :class="['df-select-value', { 'df-placeholder': !smallLabel }]">{{ smallLabel || (hasBigType ? '请选择设备小类' : '请先选择设备大类') }}</text>
							<uni-icons :color="iconMutedColor" size="20" type="down" />
						</view>
					</view>
					<view v-if="errors.smallType" class="df-error">{{ errors.smallType }}</view>

					<!-- 协议类型：只读，选择设备小类后自动显示 -->
					<view id="df-row-protocol" :class="{ 'df-row-error': errors.protocol }" class="df-row">
						<view class="df-label">
							<text class="df-star">*</text>
							<text>协议类型</text>
						</view>
						<view class="df-control df-control-readonly">
							<view class="df-protocol">
								<text :class="['df-readonly-value', { 'df-placeholder': !protocolLabel }]">{{ protocolLabel || '选择设备小类后自动填充' }}</text>
								<text v-if="protocolKeyText" class="df-protocol-key">{{ protocolKeyText }}</text>
							</view>
							<uni-icons :color="iconMutedColor" size="20" type="locked" />
						</view>
					</view>
					<view v-if="errors.protocol" class="df-error">{{ errors.protocol }}</view>

					<!-- 设备类型接口失败时提供重试 -->
					<view v-if="enumsError" class="df-enums-tip">
						<text class="df-enums-tip-text">{{ enumsError }}</text>
						<text class="df-enums-retry" @click="reloadEnums">重新加载</text>
					</view>
				</view>

				<!-- ==================== 其他 ==================== -->
				<view class="df-section">
					<view class="df-section-title">
						<uni-icons :color="iconMutedColor" size="20" type="info" />
						<text>其他</text>
					</view>

					<!-- SIM卡号：选填 -->
					<view id="df-row-simCard" class="df-row">
						<view class="df-label">
							<text>SIM卡号</text>
						</view>
						<view class="df-control">
							<input v-model="form.simCard" :placeholder-style="placeholderStyle" class="df-input"
							       maxlength="30" placeholder="选填" type="text" />
						</view>
					</view>
				</view>

				<view class="df-body-bottom"></view>
			</scroll-view>

			<!-- 底部操作栏 -->
			<view class="df-footer">
				<view class="df-btn" hover-class="df-btn-hover" @click="onCancel">取消</view>
				<view :class="['df-btn', 'primary', { 'is-disabled': submitting }]" hover-class="df-btn-hover"
				      @click="submit">{{ submitting ? '保存中...' : '保存' }}</view>
			</view>
		</view>

		<!-- ==================== 选择器弹层（上级设备 / 设备大类 / 设备小类） ==================== -->
		<view v-if="pickerVisible" class="df-picker-mask">
			<!-- 背景层：点击关闭；阻止触摸穿透，避免影响选项列表滚动 -->
			<view class="df-picker-backdrop" @click="closePicker" @touchmove.stop.prevent></view>

			<view class="df-picker-card" @click.stop>
				<view class="df-picker-header">
					<text class="df-picker-title">{{ pickerTitle }}</text>
					<view class="df-picker-close" hover-class="df-close-hover" @click="closePicker">
						<uni-icons :color="iconMutedColor" size="20" type="closeempty" />
					</view>
				</view>

				<!-- 选项较多时支持搜索 -->
				<view v-if="pickerSearchable" class="df-picker-search">
					<uni-icons :color="iconMutedColor" size="20" type="search" />
					<input v-model="pickerKeyword" :placeholder-style="placeholderStyle" class="df-picker-search-input"
					       placeholder="搜索" type="text" @input="onPickerKeywordInput" />
					<text v-if="pickerKeyword" class="df-picker-search-clear" @click="clearPickerKeyword">✕</text>
				</view>

				<scroll-view :scroll-into-view="pickerScrollInto" :show-scrollbar="false" class="df-picker-list"
				             scroll-y>
					<view v-for="(opt, idx) in filteredPickerOptions" :id="'df-opt-' + idx" :key="opt.value"
					      class="df-picker-item" hover-class="df-picker-item-hover" @click="onPickerSelect(opt)">
						<view class="df-picker-item-main">
							<text :class="['df-picker-item-label', { 'is-active': isPickerActive(opt) }]">{{ opt.label }}</text>
							<text v-if="opt.desc" class="df-picker-item-desc">{{ opt.desc }}</text>
						</view>
						<uni-icons v-if="isPickerActive(opt)" :color="primaryColor" size="18"
						           type="checkmarkempty" />
					</view>

					<view v-if="!filteredPickerOptions.length" class="df-picker-empty">
						<text>{{ enumsLoading ? '加载中...' : (enumsError && isEnumsPicker ? '加载失败' : '暂无可选项') }}</text>
						<text v-if="!enumsLoading && enumsError && isEnumsPicker" class="df-picker-retry"
						      @click="reloadEnums">重新加载</text>
					</view>
				</scroll-view>

				<view class="df-picker-footer">
					<view class="df-picker-cancel" hover-class="df-picker-cancel-hover" @click="closePicker">取消</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { request } from '@/utils/request';
import { base64Decode } from '@/utils/common';

// 表单字段顺序：校验失败时按该顺序定位第一个错误项
const FIELD_ORDER = ['name', 'code', 'bigType', 'smallType', 'protocol'];

// 通信ID规则：只能由数字、字母或两者混合组成，长度不限制
const CODE_PATTERN = /^[A-Za-z0-9]+$/;

export default {
	name: 'DeviceInfoPopup',
	props: {
		// 弹窗显隐
		visible: { type: Boolean, default: false },
		// 弹窗模式：add 新增设备 / edit 编辑设备信息
		mode: { type: String, default: 'add' },
		// 编辑时的设备行数据（列表接口返回的一行）
		device: { type: Object, default: null },
		// 所属站点
		stationId: { type: [Number, String], default: 0 },
		stationName: { type: String, default: '' },
		// 上级设备选项：当前表格中的行数据
		parentOptions: { type: Array, default: () => [] },
		// 新增时预填的通信ID（扫码结果 / 再次扫码更新）
		initialCode: { type: String, default: '' }
	},
	data() {
		return {
			// 表单数据；channel / timeout / calOnline 为固定默认值，不在界面中展示
			form: {
				name: '',
				code: '',
				simCard: '',
				parentId: 0,
				bigType: null,
				smallType: null,
				protocol: ''
			},
			// 字段错误提示
			errors: { name: '', code: '', bigType: '', smallType: '', protocol: '' },
			// 设备大类 / 设备小类（/station/enum/DeviceTypes）
			bigs: [],
			smallTypes: [],
			// 协议标识 → 协议名称（/common/type/Gettypes）
			protocolMap: {},
			enumsLoading: false,
			enumsLoaded: false,
			enumsError: '',
			submitting: false,
			// 滚动定位（校验失败时滚动到错误项）
			scrollTarget: '',
			// 选择器
			pickerVisible: false,
			pickerKey: '',
			pickerKeyword: '',
			pickerScrollInto: ''
		};
	},
	computed: {
		isEdit() {
			return this.mode === 'edit';
		},
		title() {
			return this.isEdit ? '编辑设备信息' : '新增设备';
		},
		iconMutedColor() {
			return this.isDarkMode ? '#8b94a8' : '#9aa1ad';
		},
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#4285f4';
		},
		// 输入框占位文字颜色（跟随昼夜主题）
		placeholderStyle() {
			return 'color: ' + (this.isDarkMode ? '#6d7689' : '#9aa1ad') + ';';
		},
		// 所属站点展示名：优先页面携带的站点名，其次用站点ID兜底
		stationDisplayName() {
			if (this.stationName) return this.stationName;
			return this.stationId ? ('站点 ' + this.stationId) : '未获取到站点';
		},
		hasBigType() {
			return this.hasCode(this.form.bigType);
		},
		// 当前编辑设备自身ID：上级设备选项中需要排除自身
		selfId() {
			if (!this.isEdit || !this.device) return null;
			return this.hasCode(this.device.id) ? this.device.id : null;
		},
		// 上级设备选项：无 + 当前表格内的设备（编辑时若父级不在当前页则补一条用于回显）
		parentOptionsAll() {
			const options = [{ value: 0, label: '无', desc: '' }];
			const list = Array.isArray(this.parentOptions) ? this.parentOptions : [];
			list.forEach(item => {
				if (!item || item.id === undefined || item.id === null) return;
				if (this.selfId !== null && String(item.id) === String(this.selfId)) return;
				options.push({
					value: item.id,
					label: item.name || ('设备 ' + item.id),
					desc: item.code ? ('通信ID ' + item.code) : ''
				});
			});
			const parentId = this.form.parentId;
			if (this.isEdit && this.device && this.hasCode(parentId)
				&& !options.some(o => String(o.value) === String(parentId))) {
				options.push({
					value: parentId,
					label: this.device.parentName || ('设备 ' + parentId),
					desc: this.device.parentCode ? ('通信ID ' + this.device.parentCode) : ''
				});
			}
			return options;
		},
		parentLabel() {
			const hit = this.parentOptionsAll.find(o => String(o.value) === String(this.form.parentId));
			return hit ? hit.label : '无';
		},
		bigOptions() {
			return (this.bigs || []).map(b => ({
				value: b.code,
				label: b.name || ('大类 ' + b.code),
				desc: ''
			}));
		},
		bigLabel() {
			const hit = this.bigOptions.find(o => String(o.value) === String(this.form.bigType));
			if (hit) return hit.label;
			return this.isEdit && this.device ? (this.device.bigName || '') : '';
		},
		// 设备小类：只保留 type 等于已选大类 code 的项
		smallOptions() {
			if (!this.hasBigType) return [];
			const bigCode = Number(this.form.bigType);
			return (this.smallTypes || [])
				.filter(t => t && Number(t.type) === bigCode)
				.map(t => ({
					value: t.code,
					label: t.name || ('小类 ' + t.code),
					desc: this.protocolOf(t.protocol) || ''
				}));
		},
		smallLabel() {
			const hit = this.smallOptions.find(o => String(o.value) === String(this.form.smallType));
			if (hit) return hit.label;
			return this.isEdit && this.device ? (this.device.smallName || '') : '';
		},
		// 协议类型展示名：优先取协议接口的映射，其次用列表中的协议名兜底，最后显示协议标识
		protocolLabel() {
			const key = this.form.protocol;
			if (!key) return '';
			const name = this.protocolOf(key);
			if (name) return name;
			const typeName = this.isEdit && this.device && this.device.type === key
				? (this.device.typeName || '')
				: '';
			return typeName || key;
		},
		// 已显示协议名称时，额外展示协议标识（与PC端一致的信息量）
		protocolKeyText() {
			const key = this.form.protocol;
			if (!key) return '';
			return this.protocolLabel === key ? '' : key;
		},
		// ==================== 选择器 ====================
		pickerOptions() {
			switch (this.pickerKey) {
				case 'parent':
					return this.parentOptionsAll;
				case 'bigType':
					return this.bigOptions;
				case 'smallType':
					return this.smallOptions;
				default:
					return [];
			}
		},
		pickerTitle() {
			switch (this.pickerKey) {
				case 'parent':
					return '选择上级设备';
				case 'bigType':
					return '选择设备大类';
				case 'smallType':
					return '选择设备小类';
				default:
					return '请选择';
			}
		},
		pickerSearchable() {
			return this.pickerOptions.length > 8;
		},
		pickerCurrentValue() {
			switch (this.pickerKey) {
				case 'parent':
					return this.form.parentId;
				case 'bigType':
					return this.form.bigType;
				case 'smallType':
					return this.form.smallType;
				default:
					return '';
			}
		},
		filteredPickerOptions() {
			const options = this.pickerOptions || [];
			const keyword = (this.pickerKeyword || '').trim().toLowerCase();
			if (!keyword) return options;
			return options.filter(opt => {
				const label = String(opt.label || '').toLowerCase();
				const desc = String(opt.desc || '').toLowerCase();
				return label.indexOf(keyword) > -1 || desc.indexOf(keyword) > -1;
			});
		},
		isEnumsPicker() {
			return this.pickerKey === 'bigType' || this.pickerKey === 'smallType';
		}
	},
	watch: {
		visible: {
			immediate: true,
			handler(val) {
				if (val) {
					this.initForm();
					this.loadEnums();
				} else {
					this.closePicker();
				}
			}
		},
		// 扫码完成后由页面回填通信ID（弹窗已打开时）
		initialCode(val) {
			if (this.visible && !this.isEdit && val) {
				this.setCode(val);
			}
		}
	},
	methods: {
		// 判断编码类字段是否有值（0 也视为有值）
		hasCode(value) {
			return value !== null && value !== undefined && value !== '';
		},
		// 协议标识 → 协议名称
		protocolOf(key) {
			if (!key) return '';
			return (this.protocolMap && this.protocolMap[key]) || '';
		},
		// 打开弹窗时按模式初始化表单
		initForm() {
			const device = this.isEdit ? (this.device || {}) : null;
			this.form = {
				name: device ? String(device.name || '') : '',
				code: device ? String(device.code || '') : String(this.initialCode || ''),
				simCard: device ? String(device.simCard || '') : '',
				parentId: device && this.hasCode(device.parentId) ? device.parentId : 0,
				bigType: device && this.hasCode(device.bigType) ? device.bigType : null,
				smallType: device && this.hasCode(device.smallType) ? device.smallType : null,
				protocol: device ? String(device.type || '') : ''
			};
			this.resetErrors();
			this.closePicker();
			this.scrollTarget = '';
		},
		resetErrors() {
			this.errors = { name: '', code: '', bigType: '', smallType: '', protocol: '' };
		},
		clearError(key) {
			if (key && this.errors[key]) {
				this.errors[key] = '';
			}
		},
		// ==================== 设备类型 / 协议数据 ====================
		reloadEnums() {
			this.loadEnums(true);
		},
		loadEnums(force = false) {
			if (this.enumsLoading) return;
			if (this.enumsLoaded && !force) return;
			this.enumsLoading = true;
			this.enumsError = '';
			Promise.all([this.fetchDeviceTypes(), this.fetchProtocols()])
				.then(() => {
					this.enumsLoaded = true;
				})
				.catch(err => {
					console.error('获取设备类型失败', err && err.message);
					this.enumsError = '设备类型加载失败';
				})
				.finally(() => {
					this.enumsLoading = false;
				});
		},
		// 设备大类 / 设备小类
		fetchDeviceTypes() {
			return request({
				url: '/station/enum/DeviceTypes',
				method: 'POST',
				data: {}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res && res.data;
				if (payload && !this.isSuccessPayload(payload)) {
					throw new Error(this.decodeErrorMessage(payload) || '获取设备类型失败');
				}
				const data = this.parseResponseData(res);
				if (!data || typeof data !== 'object') {
					throw new Error('设备类型数据为空');
				}
				this.bigs = Array.isArray(data.bigs) ? data.bigs : [];
				this.smallTypes = Array.isArray(data.types) ? data.types : [];
			});
		},
		// 每种设备小类对应的协议：{ type: { 协议标识: 协议名称 } }
		fetchProtocols() {
			return request({
				url: '/common/type/Gettypes',
				method: 'POST',
				data: {}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res && res.data;
				if (payload && !this.isSuccessPayload(payload)) {
					this.protocolMap = {};
					return;
				}
				const data = this.parseResponseData(res) || {};
				this.protocolMap = (data && data.type) || {};
			}).catch(err => {
				// 协议名称仅用于展示，失败时降级为显示协议标识，不阻断表单
				console.error('获取协议类型失败', err.message);
				this.protocolMap = {};
			});
		},
		// ==================== 选择器 ====================
		openPicker(key) {
			if (key === 'smallType' && !this.hasBigType) {
				uni.showToast({ title: '请先选择设备大类', icon: 'none' });
				return;
			}
			// 大类 / 小类的可选项来自设备类型接口，首次打开时按需加载
			if ((key === 'bigType' || key === 'smallType') && !this.enumsLoaded) {
				this.loadEnums();
			}
			this.pickerKey = key;
			this.pickerKeyword = '';
			this.pickerScrollInto = '';
			this.pickerVisible = true;
			this.$nextTick(() => {
				const index = this.filteredPickerOptions.findIndex(
					opt => String(opt.value) === String(this.pickerCurrentValue)
				);
				if (index > -1) {
					this.pickerScrollInto = 'df-opt-' + index;
				}
			});
		},
		closePicker() {
			this.pickerVisible = false;
			this.pickerKeyword = '';
			this.pickerScrollInto = '';
		},
		onPickerKeywordInput() {
			this.pickerScrollInto = '';
		},
		clearPickerKeyword() {
			this.pickerKeyword = '';
			this.pickerScrollInto = '';
		},
		isPickerActive(option) {
			return String(this.pickerCurrentValue) === String(option.value);
		},
		onPickerSelect(option) {
			const key = this.pickerKey;
			if (key === 'parent') {
				this.form.parentId = option.value;
			} else if (key === 'bigType') {
				// 大类变化后小类与协议都需要重新选择
				if (String(this.form.bigType) !== String(option.value)) {
					this.form.bigType = option.value;
					this.form.smallType = null;
					this.form.protocol = '';
					this.errors.smallType = '';
					this.errors.protocol = '';
				}
				this.errors.bigType = '';
			} else if (key === 'smallType') {
				this.form.smallType = option.value;
				// 选择设备小类后自动带出其协议
				const hit = (this.smallTypes || []).find(t => t && String(t.code) === String(option.value));
				this.form.protocol = (hit && hit.protocol) || '';
				this.errors.smallType = '';
				this.errors.protocol = '';
			}
			this.closePicker();
		},
		// 扫码由页面统一处理（扫码获取设备通信ID），结果通过 initialCode / setCode 回填
		requestScan() {
			this.$emit('scan');
		},
		// 父组件回填扫码得到的通信ID（仅新增可用，编辑时通信ID不可修改）
		setCode(code) {
			if (this.isEdit || !code) return;
			this.form.code = code;
			this.clearError('code');
		},
		onCancel() {
			if (this.submitting) return;
			this.$emit('close');
		},
		// ==================== 校验与保存 ====================
		scrollToRow(key) {
			this.scrollTarget = '';
			this.$nextTick(() => {
				this.scrollTarget = 'df-row-' + key;
			});
		},
		validate() {
			this.form.name = String(this.form.name || '').trim();
			this.form.code = String(this.form.code || '').trim();
			this.form.simCard = String(this.form.simCard || '').trim();

			const errors = { name: '', code: '', bigType: '', smallType: '', protocol: '' };
			if (!this.form.name) errors.name = '请输入设备名称';
			if (!this.form.code) {
				// 编辑时通信ID只读，缺失时只能提示无法保存
				errors.code = this.isEdit ? '该设备缺少通信ID，无法保存' : '请输入通信ID';
			} else if (!CODE_PATTERN.test(this.form.code)) {
				// 通信ID只能由纯数字、纯字母或两者混合组成（不限位数）
				errors.code = '通信ID只能由纯数字或纯字母或两者混合组成';
			}
			if (!this.hasBigType) errors.bigType = '请选择设备大类';
			if (!this.hasCode(this.form.smallType)) errors.smallType = '请选择设备小类';
			if (!this.form.protocol) errors.protocol = '该设备小类未配置协议，请重新选择设备小类';
			this.errors = errors;

			for (let i = 0; i < FIELD_ORDER.length; i++) {
				const key = FIELD_ORDER[i];
				if (errors[key]) {
					this.scrollToRow(key);
					return false;
				}
			}
			return true;
		},
		submit() {
			if (this.submitting) return;
			if (!this.validate()) return;

			this.submitting = true;
			uni.showLoading({ title: '保存中...', mask: true });
			request({
				url: '/station/config/SaveDevice',
				method: 'POST',
				data: {
					// 新增时 id 为空字符串
					id: this.isEdit && this.device ? this.device.id : '',
					stationId: Number(this.stationId) || 0,
					name: this.form.name,
					code: this.form.code,
					type: this.form.protocol,
					bigType: Number(this.form.bigType),
					smallType: Number(this.form.smallType),
					parentId: Number(this.form.parentId) || 0,
					// 设备方式固定为 2（界面不展示该行）
					channel: '2',
					simCard: this.form.simCard,
					timeout: 5,
					calOnline: true
				}
			}).then(res => {
				uni.hideLoading();
				this.submitting = false;
				console.log(base64Decode(res.data.data))
				const payload = res && res.data;
				if (payload && !this.isSuccessPayload(payload)) {
					uni.showToast({ title: this.decodeErrorMessage(payload) || '保存失败', icon: 'none' });
					return;
				}
				uni.showToast({ title: this.isEdit ? '修改成功' : '添加成功', icon: 'success' });
				this.$emit('saved');
				this.$emit('close');
			}).catch(err => {
				uni.hideLoading();
				this.submitting = false;
				console.error('保存设备失败', err.message);
				uni.showToast({ title: '保存失败', icon: 'none' });
			});
		},
		// ==================== 响应处理 ====================
		isSuccessPayload(payload) {
			const code = payload ? payload.code : null;
			if (code === undefined || code === null || code === '') return true;
			const value = Number(code);
			return value === 0 || value === 200;
		},
		// 解析响应 payload.data：支持直接返回对象、JSON 字符串或 Base64 编码的 JSON
		parseResponseData(res) {
			const body = res && res.data;
			if (!body) return null;
			const data = body.data;
			if (data === undefined || data === null || data === '') return null;
			if (typeof data === 'object') return data;
			if (typeof data !== 'string') return null;

			const text = data.trim();
			// 兼容接口未做 Base64 编码、直接返回 JSON 字符串的情况
			if (text.charAt(0) === '{' || text.charAt(0) === '[') {
				try {
					return JSON.parse(text);
				} catch (e) {
					// 解析失败时继续按 Base64 处理
				}
			}
			const decoded = base64Decode(text);
			if (!decoded) return null;
			try {
				return JSON.parse(decoded);
			} catch (e) {
				console.error('解析接口数据失败', e);
				return null;
			}
		},
		// 解析接口业务错误信息
		decodeErrorMessage(payload) {
			let msg = (payload && (payload.msg || payload.message)) || '';
			const data = payload && payload.data;
			if (typeof data === 'string' && data) {
				// 形似 Base64 的字符串先尝试解码
				if (/^[A-Za-z0-9+/=]+$/.test(data)) {
					const decoded = base64Decode(data);
					if (decoded) msg = decoded;
				}
				if (!msg) msg = data;
			}
			// 解码结果本身是 JSON（形如 {"code":500,"msg":"..."}）时取出其中的提示信息
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
/* ==================== 弹窗根节点 ==================== */
.device-form-root {
	/* 局部主题变量：随昼夜主题切换，不污染全局 */
	--df-error: #e5484d;
	--df-hover: rgba(0, 0, 0, 0.035);
	--df-sheet-shadow: rgba(0, 0, 0, 0.16);
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 1200;
}

.device-form-root.theme-dark {
	--df-error: #ff7b7b;
	--df-hover: rgba(255, 255, 255, 0.06);
	--df-sheet-shadow: rgba(0, 0, 0, 0.6);
}

/* 遮罩 */
.df-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: var(--popup-mask, rgba(0, 0, 0, 0.5));
	animation: df-fade-in 0.2s ease-out;
}

/* ==================== 底部面板 ==================== */
.df-sheet {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	flex-direction: column;
	max-height: 92vh;
	background: var(--bg-card, #ffffff);
	border-radius: 32rpx 32rpx 0 0;
	box-shadow: 0 -8rpx 48rpx var(--df-sheet-shadow);
	overflow: hidden;
	box-sizing: border-box;
	animation: df-slide-up 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
	transition: background-color 0.3s ease;
}

/* 标题栏 */
.df-header {
	flex: none;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	padding: 0 96rpx;
}

.df-title {
	font-size: 34rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.df-close {
	position: absolute;
	right: 24rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
}

.df-close-hover {
	background: var(--bg-soft, #f2f4f8);
}

/* ==================== 表单内容 ==================== */
.df-body {
	/* 竖向 scroll-view 需要确定高度，高度随屏幕自适应 */
	height: 62vh;
	padding: 0 32rpx;
	box-sizing: border-box;
}

.df-section {
	padding-top: 6rpx;
}

.df-section + .df-section {
	margin-top: 12rpx;
}

.df-section-title {
	display: flex;
	align-items: center;
	height: 64rpx;
	font-size: 28rpx;
	font-weight: bold;
	letter-spacing: 1rpx;
	color: var(--text-tertiary, #888888);
}

/* 表单行 */
.df-row {
	display: flex;
	align-items: center;
	min-height: 96rpx;
	border-bottom: 1rpx solid var(--border-color, #ececec);
	box-sizing: border-box;
	transition: border-color 0.2s ease, background-color 0.2s ease;
}

.df-section .df-row:last-child {
	border-bottom: none;
}

.df-row-tap {
	border-radius: 8rpx;
}

.df-row-hover {
	background: var(--df-hover);
}

.df-row-error {
	border-bottom-color: var(--df-error);
}

.df-label {
	flex: none;
	width: 168rpx;
	display: flex;
	align-items: center;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.df-star {
	margin-right: 6rpx;
	font-size: 28rpx;
	line-height: 1;
	color: var(--df-error);
}

.df-control {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
}

.df-control-select,
.df-control-readonly {
	justify-content: space-between;
	gap: 16rpx;
}

.df-input {
	flex: 1;
	min-width: 0;
	height: 96rpx;
	font-size: 30rpx;
	line-height: 96rpx;
	text-align: left;
	color: var(--text-primary, #333333);
}
.df-tip{
	font-size: 22rpx;
	color: #dd524d;
}

.df-select-value {
	flex: 1;
	min-width: 0;
	font-size: 30rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.df-readonly-value {
	flex: 1;
	min-width: 0;
	font-size: 30rpx;
	color: var(--text-secondary, #666666);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.df-select-value.df-placeholder,
.df-readonly-value.df-placeholder {
	color: var(--text-quaternary, #999999);
}

/* 协议类型：名称 + 协议标识 */
.df-protocol {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 14rpx 0;
}

.df-protocol-key {
	margin-top: 2rpx;
	font-size: 22rpx;
	color: var(--text-quaternary, #999999);
}

/* 通信ID 行内扫码按钮（仅新增，H5 端不展示） */
.df-scan {
	flex: none;
	display: flex;
	align-items: center;
	margin-left: 12rpx;
	padding: 8rpx 16rpx;
	border-radius: 40rpx;
	background: var(--bg-accent, #eef3ff);
}

.df-scan-text {
	margin-left: 6rpx;
	font-size: 22rpx;
	color: var(--color-primary, #4285f4);
}

.df-scan-hover {
	opacity: 0.72;
}

/* 字段错误提示 */
.df-error {
	padding: 8rpx 0 14rpx 168rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: var(--df-error);
}

/* 设备类型接口失败提示 */
.df-enums-tip {
	display: flex;
	align-items: center;
	padding: 12rpx 0;
	font-size: 22rpx;
}

.df-enums-tip-text {
	color: var(--df-error);
}

.df-enums-retry {
	margin-left: 16rpx;
	color: var(--color-primary, #4285f4);
}

.df-body-bottom {
	height: 16rpx;
}

/* ==================== 底部操作栏 ==================== */
.df-footer {
	flex: none;
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
	border-top: 1rpx solid var(--border-color, #ececec);
	background: var(--bg-card, #ffffff);
	transition: background-color 0.3s ease, border-color 0.3s ease;
}

.df-btn {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16rpx;
	font-size: 30rpx;
	background: var(--bg-soft, #f2f4f8);
	color: var(--text-secondary, #666666);
	transition: background-color 0.3s ease, color 0.3s ease, opacity 0.2s ease;
}

.df-btn-hover {
	opacity: 0.85;
}

.df-btn.primary {
	background: var(--color-primary, #4285f4);
	color: #ffffff;
	font-weight: 600;
}

.df-btn.primary.is-disabled {
	opacity: 0.6;
}

/* ==================== 选择器弹层 ==================== */
.df-picker-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
}

.df-picker-backdrop {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: var(--popup-mask, rgba(0, 0, 0, 0.45));
	animation: df-fade-in 0.18s ease-out;
}

.df-picker-card {
	position: relative;
	z-index: 1;
	width: 606rpx;
	max-width: 86%;
	display: flex;
	flex-direction: column;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--df-sheet-shadow);
	overflow: hidden;
	animation: df-pop-in 0.2s ease-out;
	transition: background-color 0.3s ease;
}

.df-picker-header {
	position: relative;
	flex: none;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 96rpx;
	padding: 0 88rpx;
	border-bottom: 1rpx solid var(--border-color, #ececec);
}

.df-picker-title {
	font-size: 30rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.df-picker-close {
	position: absolute;
	right: 16rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
}

.df-picker-search {
	flex: none;
	display: flex;
	align-items: center;
	height: 76rpx;
	margin: 20rpx 24rpx 8rpx;
	padding: 0 20rpx;
	border-radius: 12rpx;
	background: var(--bg-soft, #f2f4f8);
	box-sizing: border-box;
}

.df-picker-search-input {
	flex: 1;
	min-width: 0;
	height: 76rpx;
	margin-left: 10rpx;
	font-size: 26rpx;
	color: var(--text-primary, #333333);
}

.df-picker-search-clear {
	flex: none;
	width: 44rpx;
	text-align: center;
	font-size: 24rpx;
	color: var(--text-quaternary, #999999);
}

.df-picker-list {
	height: 50vh;
	padding: 8rpx 0;
	box-sizing: border-box;
}

.df-picker-item {
	display: flex;
	align-items: center;
	padding: 20rpx 28rpx;
}

.df-picker-item-hover {
	background: var(--df-hover);
}

.df-picker-item-main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.df-picker-item-label {
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.df-picker-item-label.is-active {
	color: var(--color-primary, #4285f4);
	font-weight: 600;
}

.df-picker-item-desc {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: var(--text-tertiary, #888888);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.df-picker-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 260rpx;
	font-size: 26rpx;
	color: var(--text-tertiary, #888888);
	gap: 16rpx;
}

.df-picker-retry {
	font-size: 26rpx;
	color: var(--color-primary, #4285f4);
}

.df-picker-footer {
	flex: none;
	padding: 16rpx 24rpx 20rpx;
	border-top: 1rpx solid var(--border-color, #ececec);
}

.df-picker-cancel {
	height: 76rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: var(--text-secondary, #666666);
	background: var(--bg-soft, #f2f4f8);
}

.df-picker-cancel-hover {
	opacity: 0.8;
}

/* ==================== 动画 ==================== */
@keyframes df-fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes df-slide-up {
	from {
		transform: translateY(48rpx);
		opacity: 0.5;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

@keyframes df-pop-in {
	from {
		transform: scale(0.94);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
