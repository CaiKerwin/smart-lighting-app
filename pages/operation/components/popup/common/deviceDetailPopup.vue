<template>
	<view v-if="visible" class="popup-mask" @click="onMaskClick">
		<view class="popup-panel" @click.stop>
			<!-- 二维码设备信息 -->
			<view class="device-info-card" @longpress="clearReuseCache">
				<view class="info-head">
					<view class="info-title">二维码设备信息</view>
					<text class="info-hint">长按清除记忆配置</text>
				</view>
				<view class="info-row">
					<text class="info-label">ID</text>
					<text class="info-value">{{ deviceInfo.id }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">名称</text>
					<text class="info-value">{{ deviceInfo.name }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">类型</text>
					<text class="info-value">{{ deviceInfo.type }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">年份批次编号</text>
					<text class="info-value">{{ deviceInfo.batchNo }}</text>
				</view>
			</view>

			<!-- 表单 -->
			<view class="form-area">
				<!-- 集中器（顶级单灯隐藏） -->
				<view v-if="!isTop" class="form-row">
					<text class="form-label">集中器</text>
					<picker :range="concentratorDisplayOptions" class="form-control" mode="selector" @change="onConcentratorChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.concentrator }">{{ form.concentrator || '无' }}</text>
							<uni-icons color="#909399" size="14" type="bottom" />
						</view>
					</picker>
				</view>

				<!-- 时间表 -->
				<view class="form-row">
					<text class="form-label">时间表</text>
					<picker :range="timeTableDisplayOptions" class="form-control" mode="selector" @change="onTimeTableChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.timeTable }">{{ form.timeTable || '无' }}</text>
							<uni-icons color="#909399" size="14" type="bottom" />
						</view>
					</picker>
				</view>

				<!-- 单灯类型 -->
				<view class="form-row">
					<text class="form-label">单灯类型</text>
					<picker :range="lampTypeDisplayOptions" class="form-control" mode="selector" @change="onLampTypeChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.lampType }">{{ form.lampType || '无' }}</text>
							<uni-icons color="#909399" size="14" type="bottom" />
						</view>
					</picker>
				</view>

				<!-- 控制输出 -->
				<view class="form-row">
					<text class="form-label">控制输出</text>
					<picker :range="outputDisplayOptions" class="form-control" mode="selector" @change="onOutputChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.output }">{{ form.output || '无' }}</text>
							<uni-icons color="#909399" size="14" type="bottom" />
						</view>
					</picker>
				</view>

				<!-- 通道参数 -->
				<view class="form-row">
					<text class="form-label">通道参数</text>
					<input v-model="form.channelParam" class="form-control input-control" placeholder="请输入通道参数"
					       placeholder-class="placeholder" type="number" />
				</view>

				<!-- 所属灯杆 -->
				<view class="form-row pole-row">
					<text class="form-label">所属灯杆</text>
					<view class="form-control pole-control">
						<!-- 左：输入框 + 选择框  -->
						<view class="pole-fields">
							<input v-model="form.pole" class="pole-input" placeholder="输入灯杆名称"
							       placeholder-class="placeholder" type="text"
							       @input="onPoleInput" />
							<view class="pole-picker" @click="openPolePicker">
								<view class="picker-value pole-picker-value">
									<text :class="{ placeholder: !form.polePick }">{{ form.polePick || '搜索选择灯杆名称' }}</text>
									<uni-icons color="#909399" size="14" type="bottom" />
								</view>
							</view>
						</view>
						<!-- 右：定位图标 -->
						<view class="pole-location" @click="modifyLampLocation">
							<uni-icons color="#007aff" size="22" type="location" />
						</view>
					</view>
				</view>

				<!-- 额定功率 -->
				<view class="power-section">
					<view class="section-label">额定功率</view>
					<view class="power-grid">
						<view v-for="(p, idx) in powerList" :key="idx" class="power-item">
							<checkbox-group @change="(e) => onPowerCheckChange(e, idx)">
								<label class="power-label">
									<checkbox :checked="p.checked" color="#007aff" style="transform: scale(0.7);" />
									<text class="power-name">{{ p.name }}</text>
								</label>
							</checkbox-group>
							<input v-model="p.value" class="power-input" type="number" />
							<text class="power-unit">W</text>
						</view>
					</view>
				</view>

				<!-- 名称 -->
				<view class="form-row">
					<text class="form-label">名称</text>
					<input v-model="form.name" class="form-control input-control" placeholder="输入名称"
					       placeholder-class="placeholder" type="text" />
				</view>

				<!-- 分组 -->
				<view class="form-row">
					<text class="form-label">分组</text>
					<picker :range="groupDisplayOptions" class="form-control" mode="selector" @change="onGroupChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.group }">{{ form.group || '' }}</text>
							<uni-icons color="#909399" size="14" type="bottom" />
						</view>
					</picker>
				</view>
			</view>

			<!-- 底部按钮 -->
			<view class="popup-footer">
				<button class="footer-btn cancel" @click="onCancel">取消</button>
				<button class="footer-btn confirm" @click="onConfirm">添加设备</button>
			</view>

			<!-- 灯杆搜索选择弹窗 -->
			<pole-search-picker
				:options="poleOptions"
				:value="form.polePick"
				:visible.sync="polePickerVisible"
				empty-search-text="未找到匹配的灯杆"
				empty-text="暂无可选灯杆"
				placeholder="搜索灯杆名称"
				@close="onPolePickerClose"
				@confirm="onPoleConfirm"
			/>
		</view>
	</view>
</template>

<script>
import poleSearchPicker from "@/pages/operation/components/popup/common/poleSearchPicker.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 参数复用（重复添加记忆）缓存 key：顶级单灯 / 非顶级单灯
const QR_LIGHT_JSON = 'qr_light_json';
const QR_LIGHT_TOP_JSON = 'qr_top_light_json';

export default {
	name: 'DeviceDetailPopup',
	components: {
		poleSearchPicker
	},
	props:{
		stationId: {
			type: [Number, String],
			default: 0
		}
	},
	data() {
		return {
			visible: false,
			submitting: false,        // 提交中标记（防止重复点击添加）
			optionsLoaded: false,     // 下拉选项是否加载完成（未完成时禁止提交）
			// 二维码设备原始信息（QrInfoBean.DataBean）
			deviceCode: '',           // 扫码/手输的设备 code
			deviceModelName: '',      // 设备型号名（用于通道默认值：含 PLC 为 6，否则 2）
			isTop: false,             // 是否顶级单灯（true 时隐藏集中器，monitorId 固定 "0"）
			// 二维码设备信息（默认值）
			deviceInfo: {
				id: '',
				name: '',
				type: '',
				batchNo: ''
			},
			// 下拉选项
			concentratorOptions: [],
			timeTableOptions: [],
			// 单灯类型
			lampTypeOptions: [
				{ id: 101, name: '市电常规性单灯' },
				{ id: 102, name: '市电太阳能混合单灯' },
				{ id: 103, name: '市电带倾斜单灯' },
				{ id: 104, name: '双色温单灯' },
				{ id: 105, name: '485单灯' }
			],
			outputOptions: [],
			poleOptions: [],
			// 灯杆原始列表
			poleList: [],
			groupOptions: [],
			// 表单数据
			form: {
				concentrator: '',
				concentratorId: null,
				concentratorCode: '',  // 集中器 code（通信 ID，提交时作为 monitorId）
				timeTable: '',
				timeTableId: null,
				lampType: '',
				lampTypeId: null,
				output: '',
				outputId: null,
				channelParam: '2',
				pole: '',       // 灯杆输入框的值
				poleId: null,
				polePick: '',   // 灯杆选择框的值
				name: '',
				group: '',
				groupId: null
			},
			// 额定功率：一路默认勾选，值默认 100
			powerList: [
				{ name: '一路', checked: true, value: '100' },
				{ name: '二路', checked: false, value: '100' },
				{ name: '三路', checked: false, value: '100' },
				{ name: '四路', checked: false, value: '100' }
			],
			// 灯杆搜索弹窗显隐
			polePickerVisible: false
		};
	},
	watch: {
		// stationId 晚于 open 传入时补拉一次
		stationId(val) {
			if (val && this.visible) {
				this.loadOptions();
			}
		}
	},
	computed: {
		// 集中器选项
		concentratorDisplayOptions() {
			return this.concentratorOptions.map(item => item.name);
		},
		// 时间表选项
		timeTableDisplayOptions() {
			return this.timeTableOptions.map(item => {
				const type = (item && item.type) || '';
				const name = (item && item.name) || '';
				return type ? `${type} ${name}` : name;
			});
		},
		// 单灯类型选项
		lampTypeDisplayOptions() {
			return this.lampTypeOptions.map(item => item.name);
		},
		// 控制输出选项
		outputDisplayOptions() {
			return this.outputOptions.map(item => item.name);
		},
		// 分组选项
		groupDisplayOptions() {
			return this.groupOptions.map(item => item.name);
		}
	},
	methods: {
		/* ===== 灯杆搜索选择 ===== */
		// 打开灯杆搜索选择弹窗
		openPolePicker() {
			this.polePickerVisible = true;
		},
		// 关闭灯杆搜索选择弹窗
		onPolePickerClose() {},
		// 选中某一项：清空输入框（互斥）
		onPoleConfirm(item) {
			this.form.polePick = item;
			this.form.pole = '';
			const found = this.poleList.find(p => p.name === item);
			this.form.poleId = found ? found.id : null;
			this.$emit('poleChange', item);
		},
		/* ===== 设备信息弹窗相关 ===== */
		// 打开弹窗：data 为 GetLightDeviceInfo 返回的 QrInfoBean.DataBean
		open(data) {
			this.visible = true;
			this.submitting = false;

			const bean = data || {};
			this.deviceCode = bean.code || '';
			this.deviceModelName = bean.name || '';
			this.isTop = !!bean.isTop;
			this.deviceInfo = {
				id: this.deviceCode,
				name: this.deviceModelName,
				type: this.getQrDeviceType(bean.type),
				batchNo: this.buildBatchNo(bean)
			};

			// 重置表单并应用通道默认值（PLC 默认 6，其它默认 2）
			this.resetForm();
			if (this.deviceModelName.indexOf('PLC') > -1) {
				this.form.channelParam = '6';
			}

			// 打开弹窗加载选项，加载完成后回填参数复用缓存
			this.loadOptions().then(() => {
				this.applyReuseCache();
				this.optionsLoaded = true;
			});
		},
		close() {
			this.visible = false;
		},
		onMaskClick() {
			this.close();
		},
		// 重置表单与额定功率为初始状态
		resetForm() {
			this.form = {
				concentrator: '',
				concentratorId: null,
				concentratorCode: '',
				timeTable: '',
				timeTableId: null,
				lampType: '',
				lampTypeId: null,
				output: '',
				outputId: null,
				channelParam: '2',
				pole: '',
				poleId: null,
				polePick: '',
				name: '',
				group: '',
				groupId: null
			};
			this.powerList = [
				{ name: '一路', checked: true, value: '100' },
				{ name: '二路', checked: false, value: '100' },
				{ name: '三路', checked: false, value: '100' },
				{ name: '四路', checked: false, value: '100' }
			];
			this.polePickerVisible = false;
			this.optionsLoaded = false;
		},
		// 设备大类 type → 类型名
		getQrDeviceType(type) {
			const map = {
				1: '采集控制器',
				2: '集中管理器',
				3: '单灯控制器'
			};
			return map[Number(type)] || '';
		},
		// 年份-批次-编号
		buildBatchNo(bean) {
			const parts = [bean.year, bean.batch, bean.no].map(v =>
				(v === undefined || v === null) ? '' : String(v)
			);
			const text = parts.join('-');
			return text === '--' ? '' : text;
		},
		// 分组默认值：优先「默认分组」，否则第一个
		setDefaultGroup() {
			if (!this.groupOptions.length) {
				this.form.group = '';
				this.form.groupId = null;
				return;
			}
			const def = this.groupOptions.find(g => g.name === '默认分组') || this.groupOptions[0];
			this.form.group = def ? def.name : '';
			this.form.groupId = def ? def.id : null;
		},
		/* ===== 参数复用（重复添加记忆）机制 ===== */
		// 按 §12 规则回填上次成功添加的配置：站点相关字段（灯杆/分组/集中器）仅同站点复用
		applyReuseCache() {
			const key = this.isTop ? QR_LIGHT_TOP_JSON : QR_LIGHT_JSON;
			let cached = null;
			try {
				const raw = uni.getStorageSync(key);
				if (raw) cached = JSON.parse(raw);
			} catch (e) {
				cached = null;
			}
			const sameStation = !!(cached && String(cached.stationId) === String(this.stationId));

			// 分组：同站点且缓存有 groupId → 复用；否则回退「默认分组或第一个」
			if (sameStation && cached.groupId !== undefined && cached.groupId !== null && cached.groupId !== 0) {
				const g = this.groupOptions.find(o => Number(o.id) === Number(cached.groupId));
				if (g) {
					this.form.group = g.name;
					this.form.groupId = g.id;
				} else {
					this.setDefaultGroup();
				}
			} else {
				this.setDefaultGroup();
			}

			// 灯杆：同站点且缓存有 poleId/poleName → 复用（poleId 为 0 时按手输灯杆名称回填）
			if (sameStation && cached.poleId !== undefined && cached.poleId !== null && cached.poleName) {
				const p = this.poleList.find(o => Number(o.id) === Number(cached.poleId));
				if (p) {
					this.form.polePick = p.name;
					this.form.pole = '';
					this.form.poleId = p.id;
				} else {
					// 灯杆不在当前列表：仍保留名称和 id 供提交
					this.form.pole = cached.poleName;
					this.form.polePick = '';
					this.form.poleId = cached.poleId || 0;
				}
			}

			// 集中器：非顶级 + 同站点 + 缓存有 parentId → 复用（parentId 为集中器 code）
			if (!this.isTop && sameStation && cached.parentId) {
				const c = this.concentratorOptions.find(o =>
					String(o.code) === String(cached.parentId) || String(o.id) === String(cached.parentId)
				);
				if (c) {
					this.form.concentrator = c.name;
					this.form.concentratorId = c.id;
					this.form.concentratorCode = (c.code !== undefined && c.code !== null) ? c.code : String(c.id);
				}
			}

			if (!cached) return;

			// 以下字段与站点无关，直接回填
			// 单灯类型
			if (cached.type !== undefined && cached.type !== null && cached.type !== 0) {
				const t = this.lampTypeOptions.find(o => Number(o.id) === Number(cached.type));
				if (t) {
					this.form.lampType = t.name;
					this.form.lampTypeId = t.id;
				} else if (cached.typeName) {
					this.form.lampType = cached.typeName;
					this.form.lampTypeId = cached.type;
				}
			}
			// 通道参数
			if (cached.channel !== undefined && cached.channel !== null) {
				this.form.channelParam = String(cached.channel);
			}
			// 时间表（非必填）
			if (cached.timeId !== undefined && cached.timeId !== null && cached.timeId !== 0 && cached.timetableName) {
				this.form.timeTable = cached.timetableName;
				this.form.timeTableId = cached.timeId;
			}
			// 控制输出（非必填，oc）
			if (cached.oc !== undefined && cached.oc !== null && cached.oc !== 0) {
				const o = this.outputOptions.find(item => Number(item.id) === Number(cached.oc));
				if (o) {
					this.form.output = o.name;
					this.form.outputId = o.id;
				}
			}
			// 名称
			if (cached.lightName) {
				this.form.name = cached.lightName;
			}
			// 额定功率（pr1..4 / en1..4）
			for (let i = 1; i <= 4; i++) {
				if (cached['pr' + i] !== undefined && cached['pr' + i] !== null) {
					this.powerList[i - 1].value = String(cached['pr' + i]);
				}
				if (cached['en' + i] !== undefined) {
					this.powerList[i - 1].checked = !!cached['en' + i];
				}
			}
		},
		// 长按二维码信息区：清空参数复用缓存
		clearReuseCache() {
			const key = this.isTop ? QR_LIGHT_TOP_JSON : QR_LIGHT_JSON;
			try {
				uni.removeStorageSync(key);
			} catch (e) {
				console.error('清除复用缓存失败', e);
			}
			uni.showToast({ title: '配置已清除', icon: 'none' });
		},
		/* ===== 下拉变更 ===== */
		onConcentratorChange(e) {
			const item = this.concentratorOptions[e.detail.value];
			this.form.concentrator = item ? item.name : '';
			this.form.concentratorId = item ? item.id : null;
			// monitorId 提交的是集中器 code（通信 ID）
			this.form.concentratorCode = item ? ((item.code !== undefined && item.code !== null) ? item.code : String(item.id)) : '';
		},
		onTimeTableChange(e) {
			const item = this.timeTableOptions[Number(e.detail.value)];
			if (item) {
				const type = item.type || '';
				this.form.timeTable = type ? `${type} ${item.name}` : item.name;
				this.form.timeTableId = item.id;
			} else {
				this.form.timeTable = '';
				this.form.timeTableId = null;
			}
		},
		onLampTypeChange(e) {
			const item = this.lampTypeOptions[Number(e.detail.value)];
			this.form.lampType = item ? item.name : '';
			this.form.lampTypeId = item ? item.id : null;
		},
		onOutputChange(e) {
			const item = this.outputOptions[e.detail.value];
			this.form.output = item ? item.name : '';
			this.form.outputId = item ? item.id : null;
		},
		// 输入框输入：清空选择框（互斥）
		onPoleInput(e) {
			const val = e.detail.value;
			if (val && this.form.polePick) {
				this.form.polePick = '';
				this.form.poleId = null;
			}
		},
		onGroupChange(e) {
			const item = this.groupOptions[e.detail.value];
			this.form.group = item ? item.name : '';
			this.form.groupId = item ? item.id : null;
		},
		onPowerCheckChange(e, idx) {
			const v = e.detail.value;
			this.powerList[idx].checked = Array.isArray(v) ? v.length > 0 : !!v;
		},
		modifyLampLocation() {
			// TODO: 选择位置
			uni.showToast({ title: '敬请期待', icon: 'none' });
		},
		onCancel() {
			this.close();
			this.$emit('cancel');
		},
		// 提交结束（由父级在 AddDevice 请求完成后调用，恢复可再次点击）
		finishSubmit() {
			this.submitting = false;
		},
		onConfirm() {
			if (this.submitting) return;
			// 选项尚未加载完成（灯杆/分组/集中器列表可能为空），禁止提交
			if (!this.optionsLoaded) {
				uni.showToast({ title: '正在加载选项，请稍候', icon: 'none' });
				return;
			}

			// 灯杆 key：输入框优先，否则用选择框的值
			const poleKey = (this.form.pole || this.form.polePick || '').trim();

			// ===== 提交校验（按顺序） =====
			// 非顶级单灯必须选择集中器
			if (!this.isTop && !this.form.concentrator) {
				uni.showToast({ title: '请选择集中器', icon: 'none' });
				return;
			}
			// 单灯类型必填
			if (!this.form.lampType) {
				uni.showToast({ title: '请选择单灯类型', icon: 'none' });
				return;
			}
			// 通道参数必填
			if (!String(this.form.channelParam || '').trim()) {
				uni.showToast({ title: '请输入通道参数', icon: 'none' });
				return;
			}
			// 所属灯杆必填
			if (!poleKey) {
				uni.showToast({ title: '添加灯杆ID或者输入灯杆名称', icon: 'none' });
				return;
			}
			// 额定功率：已勾选的路必须填写功率值
			for (let i = 0; i < this.powerList.length; i++) {
				if (this.powerList[i].checked && !String(this.powerList[i].value || '').trim()) {
					uni.showToast({ title: '请选输入功率', icon: 'none' });
					return;
				}
			}
			// 额定功率：至少勾选一路
			if (!this.powerList.some(p => p.checked)) {
				uni.showToast({ title: '至少启用一路控制', icon: 'none' });
				return;
			}
			// 名称必填
			if (!String(this.form.name || '').trim()) {
				uni.showToast({ title: '请输入单灯名称', icon: 'none' });
				return;
			}
			// 分组必填（分组列表非空时）
			if (this.groupOptions.length && !this.form.group) {
				uni.showToast({ title: '请选择单灯分组', icon: 'none' });
				return;
			}

			// ===== 构造 QrFastAddBean（AddDevice 请求体，§16.1） =====
			// 地址信息：目前未接入地图，address 各字段值全部默认为空
			const emptyAddress = {
				adcode: '', address: '', city: '', cityCode: '',
				country: '', countryCode: '', district: '',
				province: '', street: '', streetNumber: '', town: ''
			};
			const powerEn = {};
			const powerPr = {};
			this.powerList.forEach((p, idx) => {
				const checked = !!p.checked;
				powerEn['en' + (idx + 1)] = checked;
				powerPr['pr' + (idx + 1)] = checked ? (parseFloat(p.value) || 0) : 0;
			});
			const params = {
				address: emptyAddress,
				stationId: Number(this.stationId) || 0,
				name: `${poleKey}-${this.form.name.trim()}`,   // 设备名 = 灯杆key-输入名
				code: this.deviceCode || '',
				monitorId: this.isTop ? '0' : (this.form.concentratorCode || ''),
				areaId: this.form.groupId || 0,
				timeId: this.form.timeTableId || 0,
				type: this.form.lampTypeId || 0,
				channel: Number(this.form.channelParam) || 0,
				oid: this.form.outputId || 0,
				pr1: powerPr.pr1, pr2: powerPr.pr2, pr3: powerPr.pr3, pr4: powerPr.pr4,
				en1: powerEn.en1, en2: powerEn.en2, en3: powerEn.en3, en4: powerEn.en4,
				lat: 0,   // 未接入地图，默认 0
				lng: 0,
				pole: poleKey,
				poleId: this.form.poleId || 0
			};

			// ===== 保存参数复用缓存（提交前写入，供下一次重复添加回填，§12.4） =====
			const position = this.poleList.findIndex(p => Number(p.id) === Number(this.form.poleId));
			const cache = {
				stationId: String(this.stationId),
				parentId: this.isTop ? '' : (this.form.concentratorCode || ''),
				parentName: this.isTop ? '' : (this.form.concentrator || ''),
				timetableName: this.form.timeTable || '',
				timeId: this.form.timeTableId || 0,
				type: this.form.lampTypeId || 0,
				channel: Number(this.form.channelParam) || 0,
				oc: this.form.outputId || 0,
				poleId: this.form.poleId || 0,
				poleName: poleKey,
				typeName: this.form.lampType || '',
				pr1: powerPr.pr1, pr2: powerPr.pr2, pr3: powerPr.pr3, pr4: powerPr.pr4,
				en1: powerEn.en1, en2: powerEn.en2, en3: powerEn.en3, en4: powerEn.en4,
				lightName: this.form.name.trim(),
				groupId: this.form.groupId || 0,
				groupName: this.form.group || '',
				position: position > -1 ? position : 0
			};
			try {
				uni.setStorageSync(this.isTop ? QR_LIGHT_TOP_JSON : QR_LIGHT_JSON, JSON.stringify(cache));
			} catch (e) {
				console.error('保存参数复用缓存失败', e);
			}

			// 提交中锁定，弹窗保持打开，由父级在请求完成后关闭
			this.submitting = true;
			this.$emit('confirm', {
				deviceCode: this.deviceCode,
				isTop: this.isTop,
				poleKey: poleKey,
				lightName: this.form.name.trim(),
				params: params
			});
		},
		// 并行拉取所有下拉选项；顶级单灯不请求集中器列表
		loadOptions() {
			if (!this.stationId) {
				console.warn('DeviceDetailPopup：缺少 stationId，无法拉取选项');
				uni.showToast({ title: '无法拉取选项', icon: 'none' });
				return Promise.resolve();
			}
			const tasks = [
				this.getTimeTableOptions(),
				this.getOutputOptions(),
				this.getPoleOptions(),
				this.getGroupOptions()
			];
			if (!this.isTop) {
				tasks.push(this.getConcentratorOptions());
			}
			return Promise.all(tasks);
		},
		// 解析响应
		parseResponseData(res) {
			const body = res && res.data;
			if (!body) return null;
			let data = body.data;
			if (typeof data === 'string') {
				try {
					data = JSON.parse(base64Decode(data));
				} catch (e) {
					console.error('解析接口数据失败', e);
					return null;
				}
			}
			return data;
		},
		// 获取集中器选择框选项
		getConcentratorOptions() {
			/**
			 * 返回格式示例
			 * [
			 *   {
			 *     "id": 78789,
			 *     "name": "7210",
			 *     ....
			 *   }
			 * ]
			 */
			return request({
				url: '/station/config/GetStationDevice',
				method: 'POST',
				data: {
					stationId: this.stationId, // 传入的站点id
					type: 2 // 2表示集中器类型设备
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const data = this.parseResponseData(res)
				this.concentratorOptions = Array.isArray(data) ? data : [];
			}).catch(err =>{
				console.error('获取集中器列表错误', err.message);
				this.concentratorOptions = [];
				// 站点没有集中器：提示并关闭弹窗（§10.4）
				if (!this.isTop) {
					uni.showToast({ title: '当前站点没有集中器,请先添加。', icon: 'none' });
					setTimeout(() => {
						if (this.visible) this.close();
					}, 1500);
				}
			});
		},
		// 获取时间表选择框选项
		getTimeTableOptions() {
			/**
			 * [
			 *   {
			 *     "id": 101,
			 *     "name": "准时日表1",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 242,
			 *     "name": "准时日表App",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 312,
			 *     "name": "准时表-办公室测试",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 313,
			 *     "name": "TEST-2",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 460,
			 *     "name": "联动测试----现场表",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 505,
			 *     "name": "临时准时表-1",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 566,
			 *     "name": "联动准时表---现场",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 701,
			 *     "name": "全亮",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 721,
			 *     "name": "贺友清测试",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 756,
			 *     "name": "白天亮晚上暗",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 758,
			 *     "name": "N706 测试准时表 白天亮 晚上灭",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 763,
			 *     "name": "N706测试计时表 白天亮 晚上灭",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 772,
			 *     "name": "N706 试验",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 820,
			 *     "name": "全亮",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 827,
			 *     "name": "测试11",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 829,
			 *     "name": "印_计时日表0",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 830,
			 *     "name": "印_准时日表20241015",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 911,
			 *     "name": "全灭",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 969,
			 *     "name": "888",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 976,
			 *     "name": "App-115B-A",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 980,
			 *     "name": "周洪蛟_8011时间表",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 981,
			 *     "name": "周洪蛟_8011_计时时间表",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 1000,
			 *     "name": "李测试-全灭",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 1027,
			 *     "name": "李-测试-全灭",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 1056,
			 *     "name": "李测试-全亮",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 1057,
			 *     "name": "李-测试-全亮",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 7
			 *   },
			 *   {
			 *     "id": 1063,
			 *     "name": "115B_周洪蛟",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 1070,
			 *     "name": "色温准时_周洪蛟",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 1071,
			 *     "name": "色温计时_周洪蛟",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 1072,
			 *     "name": "115B_周洪蛟",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 1326,
			 *     "name": "ly1025",
			 *     "type": "准时日表",
			 *     "mode": "常规模式",
			 *     "flag": 8
			 *   },
			 *   {
			 *     "id": 1387,
			 *     "name": "循环调光",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   },
			 *   {
			 *     "id": 1388,
			 *     "name": "2",
			 *     "type": "计时日表",
			 *     "mode": "常规模式",
			 *     "flag": 6
			 *   }
			 * ]
			 */
			return request({
				url: '/station/plan/QueryLightPlan',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const data = this.parseResponseData(res)
				this.timeTableOptions = Array.isArray(data) ? data : [];
			}).catch(err =>{
				console.error('获取时间表选项错误', err.message);
				this.timeTableOptions = [];
			});
		},
		// 获取控制通道选择框选项
		getOutputOptions() {
			/**
			 * [
			 *   {
			 *     "id": 714,
			 *     "name": "全夜灯",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "groupName": null,
			 *     "content": {
			 *       "mid": 10,
			 *       "oc": 1,
			 *       "timeId": 12,
			 *       "group": "00000000-0000-0000-0000-000000000000",
			 *       "ea1": true,
			 *       "ea2": true,
			 *       "ea3": true,
			 *       "ea4": true
			 *     },
			 *     "mainName": "-",
			 *     "timeName": "白天亮灯",
			 *     "lastData": {
			 *       "time": 1663845313570,
			 *       "ov": 1,
			 *       "tv": 1
			 *     },
			 *     "extraData": {},
			 *     "type": 3,
			 *     "code": null,
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "devType": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false
			 *   },
			 *   {
			 *     "id": 715,
			 *     "name": "半夜灯",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "groupName": null,
			 *     "content": {
			 *       "mid": 10,
			 *       "timeId": 6,
			 *       "oc": 2,
			 *       "group": "a8c418da-db7b-4b95-a07f-761709d00335"
			 *     },
			 *     "mainName": "-",
			 *     "timeName": "测试周表",
			 *     "lastData": {
			 *       "time": 1663845313570,
			 *       "ov": 1,
			 *       "tv": 1
			 *     },
			 *     "extraData": {},
			 *     "type": 3,
			 *     "code": null,
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "devType": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false
			 *   },
			 *   {
			 *     "id": 716,
			 *     "name": "111",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "groupName": null,
			 *     "content": {
			 *       "mid": 10,
			 *       "timeId": 6,
			 *       "oc": 3,
			 *       "group": "a8c418da-db7b-4b95-a07f-761709d00335"
			 *     },
			 *     "mainName": "-",
			 *     "timeName": "测试周表",
			 *     "lastData": {
			 *       "time": 1663845313570,
			 *       "ov": 0,
			 *       "tv": 1
			 *     },
			 *     "extraData": {},
			 *     "type": 3,
			 *     "code": null,
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "devType": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false
			 *   },
			 *   {
			 *     "id": 717,
			 *     "name": "222",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "groupName": null,
			 *     "content": {
			 *       "mid": 10,
			 *       "timeId": 2,
			 *       "oc": 4,
			 *       "group": "a8c418da-db7b-4b95-a07f-761709d00335"
			 *     },
			 *     "mainName": "-",
			 *     "timeName": "公司测试",
			 *     "lastData": {
			 *       "time": 1663845313570,
			 *       "ov": 0,
			 *       "tv": 1
			 *     },
			 *     "extraData": {},
			 *     "type": 3,
			 *     "code": null,
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "devType": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false
			 *   },
			 *   {
			 *     "id": 718,
			 *     "name": "333",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "groupName": null,
			 *     "content": {
			 *       "mid": 10,
			 *       "timeId": 2,
			 *       "oc": 5,
			 *       "group": "a8c418da-db7b-4b95-a07f-761709d00335"
			 *     },
			 *     "mainName": "-",
			 *     "timeName": "公司测试",
			 *     "lastData": {
			 *       "time": 1663845313570,
			 *       "ov": 1,
			 *       "tv": 1
			 *     },
			 *     "extraData": {},
			 *     "type": 3,
			 *     "code": null,
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "devType": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false
			 *   }
			 * ]
			 */
			return request({
				url: '/station/config/QueryOutput',
				method: 'POST',
				data: {
					stationId: this.stationId, // 传入的站点id
					groupId: 0 // 根分组
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const data = this.parseResponseData(res)
				this.outputOptions = Array.isArray(data) ? data : [];
			}).catch(err =>{
				console.error('获取控制通道选择框选项错误', err.message);
				this.outputOptions = [];
			});
		},
		// 获取所属灯杆选择项
		getPoleOptions() {
			/**
			 * [
			 *   {
			 *     "id": 286893,
			 *     "name": "灯杆55",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "content": {},
			 *     "mainName": "-",
			 *     "lastData": {},
			 *     "extraData": {},
			 *     "asset": {
			 *       "poleType": "默认类型",
			 *       "armType": "默认类型",
			 *       "height": 8
			 *     },
			 *     "type": 14,
			 *     "code": "e296ddc2ab664ced9b19c825fd10bd67",
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false,
			 *     "lat": 22.771979691120524,
			 *     "lng": 113.83518758063116
			 *   },
			 *   {
			 *     "id": 286899,
			 *     "name": "灯杆99",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "content": {},
			 *     "mainName": "-",
			 *     "lastData": {},
			 *     "extraData": {},
			 *     "asset": {
			 *       "poleType": "默认类型",
			 *       "armType": "默认类型",
			 *       "height": 8
			 *     },
			 *     "type": 14,
			 *     "code": "61788f51a9cb41d2b12e76dd81bec1ea",
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false,
			 *     "lat": 22.77631165737353,
			 *     "lng": 113.82890842511848
			 *   },
			 *   {
			 *     "id": 378805,
			 *     "name": "DG01",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "content": {},
			 *     "mainName": "-",
			 *     "lastData": {},
			 *     "extraData": {},
			 *     "asset": {
			 *       "armType": "默认类型",
			 *       "height": 8,
			 *       "poleType": "默认类型"
			 *     },
			 *     "type": 14,
			 *     "code": "cb2d5aff0e6b4b3aab1321a82fb10110",
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false,
			 *     "lat": 22.770614,
			 *     "lng": 113.828154
			 *   },
			 *   {
			 *     "id": 270614,
			 *     "name": "Dg001",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "content": {},
			 *     "mainName": "-",
			 *     "lastData": {},
			 *     "extraData": {},
			 *     "asset": {
			 *       "poleType": "默认类型",
			 *       "armType": "默认类型",
			 *       "height": 8
			 *     },
			 *     "type": 14,
			 *     "code": "4f8aa5f10f934d10b55600ae8d870de9",
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false,
			 *     "lat": 22.768521659960157,
			 *     "lng": 113.82973040154008
			 *   },
			 *   {
			 *     "id": 270618,
			 *     "name": "Dg002",
			 *     "stationId": 1,
			 *     "stationName": "测试配电柜二",
			 *     "content": {},
			 *     "mainName": "-",
			 *     "lastData": {},
			 *     "extraData": {},
			 *     "asset": {
			 *       "poleType": "默认类型",
			 *       "armType": "默认类型",
			 *       "height": 8
			 *     },
			 *     "type": 14,
			 *     "code": "5ddb82cfd9624d2aa24d6a9488f58647",
			 *     "deviceId": 0,
			 *     "typeName": null,
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false,
			 *     "lat": 22.768521659960157,
			 *     "lng": 113.82973040154008
			 *   }
			 * ]
			 */
			return request({
				url: '/station/config/QueryLampPole',
				method: 'POST',
				data: {
					stationId: this.stationId // 传入的站点id
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const data = this.parseResponseData(res)
				const list = Array.isArray(data) ? data : [];
				// 提取name作为选项，同时保留原始列表用于回填 poleId
				this.poleList = list;
				this.poleOptions = list.map(item => item.name);
			}).catch(err =>{
				console.error('获取所属灯杆选择项错误', err.message);
				this.poleList = [];
				this.poleOptions = [];
			});
		},
		// 获取分组列表
		getGroupOptions() {
			/**
			 * [
			 *   {
			 *     "id": 901,
			 *     "name": "App单灯分组",
			 *     "code": 5,
			 *     "planId": 2,
			 *     "planName": "公司测试"
			 *   },
			 *   {
			 *     "id": 524,
			 *     "name": "主灯",
			 *     "code": 2,
			 *     "planId": 0,
			 *     "planName": null
			 *   },
			 *   {
			 *     "id": 835,
			 *     "name": "测试一路",
			 *     "code": 7,
			 *     "planId": 2,
			 *     "planName": "公司测试"
			 *   },
			 *   {
			 *     "id": 5,
			 *     "name": "测试二路",
			 *     "code": 1,
			 *     "planId": 0,
			 *     "planName": null
			 *   },
			 *   {
			 *     "id": 642,
			 *     "name": "辅灯",
			 *     "code": 3,
			 *     "planId": 2,
			 *     "planName": "公司测试"
			 *   },
			 *   {
			 *     "id": 834,
			 *     "name": "默认分组",
			 *     "code": 4,
			 *     "planId": 0,
			 *     "planName": null
			 *   }
			 * ]
			 */
			return request({
				url: '/station/config/QueryArea',
				method: 'POST',
				data: {
					groupId: 0, // 表示根分组，这里固定为0
					stationId: this.stationId // 传入的站点id
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const data = this.parseResponseData(res)
				this.groupOptions = Array.isArray(data) ? data.map(item => ({id: item.id, name: item.name})) : [];
			}).catch(err =>{
				console.error('获取分组列表错误', err.message);
				this.groupOptions = [];
			});
		},

	}
};
</script>

<style lang="scss" scoped>
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-panel {
	width: 92%;
	max-width: 700rpx;
	max-height: 88vh;
	background: #fff;
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* 二维码设备信息卡片 */
.device-info-card {
	background: #e8f1ff;
	border-radius: 12rpx;
	margin: 20rpx;
	padding: 20rpx 24rpx;
	flex-shrink: 0;

	.info-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12rpx;
	}

	.info-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.info-hint {
		font-size: 22rpx;
		color: #909399;
	}

	.info-row {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;

		&:last-child { margin-bottom: 0; }

		.info-label {
			width: 180rpx;
			font-size: 26rpx;
			color: #666;
			flex-shrink: 0;
		}

		.info-value {
			font-size: 26rpx;
			color: #333;
			flex: 1;
			word-break: break-all;
		}
	}
}

/* 表单区域 */
.form-area {
	flex: 1;
	overflow-y: auto;
	padding: 0 20rpx 20rpx;

	.form-row {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;

		.form-label {
			width: 160rpx;
			font-size: 28rpx;
			color: #666;
			flex-shrink: 0;
		}

		.form-control {
			flex: 1;
			min-width: 0;
		}

		.picker-value {
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 72rpx;
			padding: 0 20rpx;
			background: #f0f2f5;
			border: 1px solid #e4e7ed;
			border-radius: 8rpx;
			font-size: 28rpx;
			color: #333;
			box-sizing: border-box;

			.placeholder { color: #909399; }
		}

		.input-control {
			height: 72rpx;
			padding: 0 20rpx;
			background: #f0f2f5;
			border: 1px solid #e4e7ed;
			border-radius: 8rpx;
			font-size: 28rpx;
			color: #333;
			box-sizing: border-box;
		}
	}
}

/* 所属灯杆：左侧上下两框，右侧定位图标垂直居中 */
.pole-row {
	align-items: center;
}

.pole-control {
	display: flex;
	align-items: center;
	gap: 12rpx;

	/* 左：输入框 + 选择框 */
	.pole-fields {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.pole-input {
		width: 100%;
		height: 72rpx;
		padding: 0 20rpx;
		background: #f0f2f5;
		border: 1px solid #e4e7ed;
		border-radius: 8rpx;
		font-size: 28rpx;
		color: #333;
		box-sizing: border-box;
	}

	.pole-picker {
		width: 100%;
	}

	.pole-picker-value {
		width: 100%;
		height: 72rpx;
		padding: 0 20rpx;
		background: #f0f2f5;
		border: 1px solid #e4e7ed;
		border-radius: 8rpx;
		font-size: 26rpx;
		color: #333;
		overflow: hidden;
		box-sizing: border-box;

		text {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			&.placeholder { color: #909399; }
		}
	}

	/* 右：定位图标（垂直居中） */
	.pole-location {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
}

/* 额定功率 */
.power-section {
	margin-bottom: 20rpx;

	.section-label {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 12rpx;
	}

	.power-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;

		.power-item {
			width: calc(50% - 8rpx);
			display: flex;
			align-items: center;
			background: #f0f2f5;
			border: 1px solid #e4e7ed;
			border-radius: 8rpx;
			padding: 4rpx 12rpx;
			box-sizing: border-box;

			.power-label {
				display: flex;
				align-items: center;
				flex-shrink: 0;
			}

			.power-name {
				font-size: 26rpx;
				color: #333;
			}

			.power-input {
				flex: 1;
				min-width: 0;
				height: 60rpx;
				text-align: right;
				font-size: 28rpx;
				color: #333;
				padding: 0 6rpx;
			}

			.power-unit {
				font-size: 26rpx;
				color: #666;
				flex-shrink: 0;
			}
		}
	}
}

/* 底部按钮 */
.popup-footer {
	display: flex;
	gap: 24rpx;
	padding: 20rpx 24rpx 30rpx;
	border-top: 1px solid #f0f0f0;
	flex-shrink: 0;

	.footer-btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		font-size: 30rpx;
		border-radius: 10rpx;
		border: none;
		padding: 0;

		&.cancel {
			background: #fff;
			color: #007aff;
			border: 1px solid #007aff;
		}

		&.confirm {
			background: #007aff;
			color: #fff;
		}
	}
}
</style>
