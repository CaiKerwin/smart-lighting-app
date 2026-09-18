<template>
	<view v-if="visible" :class="themeClass" class="popup-mask" @click="onMaskClick">
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
							<uni-icons :color="arrowColor" size="14" type="bottom" />
						</view>
					</picker>
				</view>

				<!-- 时间表 -->
				<view class="form-row">
					<text class="form-label">时间表</text>
					<picker :range="timeTableDisplayOptions" class="form-control" mode="selector" @change="onTimeTableChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.timeTable }">{{ form.timeTable || '无' }}</text>
							<uni-icons :color="arrowColor" size="14" type="bottom" />
						</view>
					</picker>
				</view>

				<!-- 单灯类型 -->
				<view class="form-row">
					<text class="form-label">单灯类型</text>
					<picker :range="lampTypeDisplayOptions" class="form-control" mode="selector" @change="onLampTypeChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.lampType }">{{ form.lampType || '无' }}</text>
							<uni-icons :color="arrowColor" size="14" type="bottom" />
						</view>
					</picker>
				</view>

				<!-- 控制输出 -->
				<view class="form-row">
					<text class="form-label">控制输出</text>
					<picker :range="outputDisplayOptions" class="form-control" mode="selector" @change="onOutputChange">
						<view class="picker-value">
							<text :class="{ placeholder: !form.output }">{{ form.output || '无' }}</text>
							<uni-icons :color="arrowColor" size="14" type="bottom" />
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
									<uni-icons :color="arrowColor" size="14" type="bottom" />
								</view>
							</view>
						</view>
						<!-- 右：定位图标 -->
						<view class="pole-location" @click="modifyPoleLocation">
							<uni-icons :color="primaryColor" size="22" type="location" />
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
									<checkbox :checked="p.checked" :color="primaryColor" style="transform: scale(0.7);" />
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
							<uni-icons :color="arrowColor" size="14" type="bottom" />
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
import { EVENT_LOCATION_RESULT, POS_TYPE_POLE, toAddressBean } from "@/utils/map";

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
			submitting: false,
			optionsLoaded: false,
			location: {
				lat: 0,
				lng: 0,
				address: '',
				components: null
			},
			pendingLocationPick: false,
			pickToken: '',
			deviceCode: '',
			deviceModelName: '',
			isTop: false,
			deviceInfo: {
				id: '',
				name: '',
				type: '',
				batchNo: ''
			},
			concentratorOptions: [],
			timeTableOptions: [],
			lampTypeOptions: [
				{ id: 101, name: '市电常规性单灯' },
				{ id: 102, name: '市电太阳能混合单灯' },
				{ id: 103, name: '市电带倾斜单灯' },
				{ id: 104, name: '双色温单灯' },
				{ id: 105, name: '485单灯' }
			],
			outputOptions: [],
			poleOptions: [],
			poleList: [],
			groupOptions: [],
			form: {
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
			},
			powerList: [
				{ name: '一路', checked: true, value: '100' },
				{ name: '二路', checked: false, value: '100' },
				{ name: '三路', checked: false, value: '100' },
				{ name: '四路', checked: false, value: '100' }
			],
			polePickerVisible: false
		};
	},
	watch: {
		stationId(val) {
			if (val && this.visible) {
				this.loadOptions();
			}
		}
	},
	computed: {
		// 箭头图标颜色：跟随主题
		arrowColor() {
			return this.isDarkMode ? '#6d7689' : '#909399';
		},
		// 主色图标：跟随主题
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#007aff';
		},
		concentratorDisplayOptions() {
			return this.concentratorOptions.map(item => item.name);
		},
		timeTableDisplayOptions() {
			return this.timeTableOptions.map(item => {
				const type = (item && item.type) || '';
				const name = (item && item.name) || '';
				return type ? `${type} ${name}` : name;
			});
		},
		lampTypeDisplayOptions() {
			return this.lampTypeOptions.map(item => item.name);
		},
		outputDisplayOptions() {
			return this.outputOptions.map(item => item.name);
		},
		groupDisplayOptions() {
			return this.groupOptions.map(item => item.name);
		}
	},
	created() {
		uni.$on(EVENT_LOCATION_RESULT, this.onLocationResult);
	},
	beforeDestroy() {
		uni.$off(EVENT_LOCATION_RESULT, this.onLocationResult);
	},
	methods: {
		/* 方法体保持不变，此处省略以节省篇幅，与原始一致 */
		openPolePicker() { this.polePickerVisible = true; },
		onPolePickerClose() {},
		onPoleConfirm(item) {
			this.form.polePick = item;
			this.form.pole = '';
			const found = this.poleList.find(p => p.name === item);
			this.form.poleId = found ? found.id : null;
			this.setLocationFromPole(found);
			this.$emit('poleChange', item);
		},
		setLocationFromPole(pole) {
			if (!pole) return;
			const lat = Number(pole.lat);
			const lng = Number(pole.lng);
			if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
			this.location = { lat, lng, address: '', components: null };
		},
		onLocationResult(payload) {
			if (!payload || !this.pendingLocationPick) return;
			if (Number(payload.type) !== POS_TYPE_POLE) return;
			if (String(payload.token || '') !== this.pickToken) return;
			const lat = Number(payload.lat);
			const lng = Number(payload.lng);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
			this.pendingLocationPick = false;
			this.pickToken = '';
			this.location = {
				lat, lng,
				address: payload.address || '',
				components: payload.components || null
			};
			uni.showToast({ title: '已选择位置', icon: 'none' });
		},
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
			this.resetForm();
			if (this.deviceModelName.indexOf('PLC') > -1) {
				this.form.channelParam = '6';
			}
			this.loadOptions().then(() => {
				this.applyReuseCache();
				this.optionsLoaded = true;
			});
		},
		close() { this.visible = false; },
		onMaskClick() { this.close(); },
		resetForm() {
			this.form = {
				concentrator: '', concentratorId: null, concentratorCode: '',
				timeTable: '', timeTableId: null,
				lampType: '', lampTypeId: null,
				output: '', outputId: null,
				channelParam: '2',
				pole: '', poleId: null, polePick: '',
				name: '', group: '', groupId: null
			};
			this.powerList = [
				{ name: '一路', checked: true, value: '100' },
				{ name: '二路', checked: false, value: '100' },
				{ name: '三路', checked: false, value: '100' },
				{ name: '四路', checked: false, value: '100' }
			];
			this.polePickerVisible = false;
			this.optionsLoaded = false;
			this.location = { lat: 0, lng: 0, address: '', components: null };
			this.pendingLocationPick = false;
			this.pickToken = '';
		},
		getQrDeviceType(type) {
			const map = { 1: '采集控制器', 2: '集中管理器', 3: '单灯控制器' };
			return map[Number(type)] || '';
		},
		buildBatchNo(bean) {
			const parts = [bean.year, bean.batch, bean.no].map(v =>
				(v === undefined || v === null) ? '' : String(v)
			);
			const text = parts.join('-');
			return text === '--' ? '' : text;
		},
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
		applyReuseCache() {
			const key = this.isTop ? QR_LIGHT_TOP_JSON : QR_LIGHT_JSON;
			let cached = null;
			try {
				const raw = uni.getStorageSync(key);
				if (raw) cached = JSON.parse(raw);
			} catch (e) { cached = null; }
			const sameStation = !!(cached && String(cached.stationId) === String(this.stationId));
			if (sameStation && cached.groupId !== undefined && cached.groupId !== null && cached.groupId !== 0) {
				const g = this.groupOptions.find(o => Number(o.id) === Number(cached.groupId));
				if (g) { this.form.group = g.name; this.form.groupId = g.id; }
				else { this.setDefaultGroup(); }
			} else { this.setDefaultGroup(); }
			if (sameStation && cached.poleId !== undefined && cached.poleId !== null && cached.poleName) {
				const p = this.poleList.find(o => Number(o.id) === Number(cached.poleId));
				if (p) {
					this.form.polePick = p.name;
					this.form.pole = '';
					this.form.poleId = p.id;
					this.setLocationFromPole(p);
				} else {
					this.form.pole = cached.poleName;
					this.form.polePick = '';
					this.form.poleId = cached.poleId || 0;
				}
			}
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
			if (cached.type !== undefined && cached.type !== null && cached.type !== 0) {
				const t = this.lampTypeOptions.find(o => Number(o.id) === Number(cached.type));
				if (t) { this.form.lampType = t.name; this.form.lampTypeId = t.id; }
				else if (cached.typeName) { this.form.lampType = cached.typeName; this.form.lampTypeId = cached.type; }
			}
			if (cached.channel !== undefined && cached.channel !== null) {
				this.form.channelParam = String(cached.channel);
			}
			if (cached.timeId !== undefined && cached.timeId !== null && cached.timeId !== 0 && cached.timetableName) {
				this.form.timeTable = cached.timetableName;
				this.form.timeTableId = cached.timeId;
			}
			if (cached.oc !== undefined && cached.oc !== null && cached.oc !== 0) {
				const o = this.outputOptions.find(item => Number(item.id) === Number(cached.oc));
				if (o) { this.form.output = o.name; this.form.outputId = o.id; }
			}
			if (cached.lightName) { this.form.name = cached.lightName; }
			for (let i = 1; i <= 4; i++) {
				if (cached['pr' + i] !== undefined && cached['pr' + i] !== null) {
					this.powerList[i - 1].value = String(cached['pr' + i]);
				}
				if (cached['en' + i] !== undefined) {
					this.powerList[i - 1].checked = !!cached['en' + i];
				}
			}
		},
		clearReuseCache() {
			const key = this.isTop ? QR_LIGHT_TOP_JSON : QR_LIGHT_JSON;
			try { uni.removeStorageSync(key); } catch (e) { console.error('清除复用缓存失败', e); }
			uni.showToast({ title: '配置已清除', icon: 'none' });
		},
		onConcentratorChange(e) {
			const item = this.concentratorOptions[e.detail.value];
			this.form.concentrator = item ? item.name : '';
			this.form.concentratorId = item ? item.id : null;
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
		modifyPoleLocation() {
			const poleKey = (this.form.pole || this.form.polePick || '').trim();
			const bd = this.location || {};
			this.pickToken = `${Date.now()}`;
			this.pendingLocationPick = true;
			const query = [
				'mode=pick',
				`type=${POS_TYPE_POLE}`,
				`id=${this.form.poleId || 0}`,
				`name=${encodeURIComponent(poleKey)}`,
				`token=${this.pickToken}`,
				`lat=${bd.lat || ''}`,
				`lng=${bd.lng || ''}`
			].join('&');
			uni.navigateTo({ url: `/pages/operation/components/showAndEditLocation?${query}` });
		},
		onCancel() { this.close(); this.$emit('cancel'); },
		finishSubmit() { this.submitting = false; },
		onConfirm() {
			if (this.submitting) return;
			if (!this.optionsLoaded) {
				uni.showToast({ title: '正在加载选项，请稍候', icon: 'none' });
				return;
			}
			const poleKey = (this.form.pole || this.form.polePick || '').trim();
			if (!this.isTop && !this.form.concentrator) { uni.showToast({ title: '请选择集中器', icon: 'none' }); return; }
			if (!this.form.lampType) { uni.showToast({ title: '请选择单灯类型', icon: 'none' }); return; }
			if (!String(this.form.channelParam || '').trim()) { uni.showToast({ title: '请输入通道参数', icon: 'none' }); return; }
			if (!poleKey) { uni.showToast({ title: '添加灯杆ID或者输入灯杆名称', icon: 'none' }); return; }
			for (let i = 0; i < this.powerList.length; i++) {
				if (this.powerList[i].checked && !String(this.powerList[i].value || '').trim()) {
					uni.showToast({ title: '请选输入功率', icon: 'none' }); return;
				}
			}
			if (!this.powerList.some(p => p.checked)) { uni.showToast({ title: '至少启用一路控制', icon: 'none' }); return; }
			if (!String(this.form.name || '').trim()) { uni.showToast({ title: '请输入单灯名称', icon: 'none' }); return; }
			if (this.groupOptions.length && !this.form.group) { uni.showToast({ title: '请选择单灯分组', icon: 'none' }); return; }

			const addressBean = toAddressBean(this.location.components, this.location.address);
			const powerEn = {};
			const powerPr = {};
			this.powerList.forEach((p, idx) => {
				const checked = !!p.checked;
				powerEn['en' + (idx + 1)] = checked;
				powerPr['pr' + (idx + 1)] = checked ? (parseFloat(p.value) || 0) : 0;
			});
			const params = {
				address: addressBean,
				stationId: Number(this.stationId) || 0,
				name: `${poleKey}-${this.form.name.trim()}`,
				code: this.deviceCode || '',
				monitorId: this.isTop ? '0' : (this.form.concentratorCode || ''),
				areaId: this.form.groupId || 0,
				timeId: this.form.timeTableId || 0,
				type: this.form.lampTypeId || 0,
				channel: Number(this.form.channelParam) || 0,
				oid: this.form.outputId || 0,
				pr1: powerPr.pr1, pr2: powerPr.pr2, pr3: powerPr.pr3, pr4: powerPr.pr4,
				en1: powerEn.en1, en2: powerEn.en2, en3: powerEn.en3, en4: powerEn.en4,
				lat: this.location.lat || 0,
				lng: this.location.lng || 0,
				pole: poleKey,
				poleId: this.form.poleId || 0
			};
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
			} catch (e) { console.error('保存参数复用缓存失败', e); }

			this.submitting = true;
			this.$emit('confirm', {
				deviceCode: this.deviceCode,
				isTop: this.isTop,
				poleKey: poleKey,
				lightName: this.form.name.trim(),
				params: params
			});
		},
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
		parseResponseData(res) {
			const body = res && res.data;
			if (!body) return null;
			let data = body.data;
			if (typeof data === 'string') {
				try { data = JSON.parse(base64Decode(data)); }
				catch (e) { console.error('解析接口数据失败', e); return null; }
			}
			return data;
		},
		getConcentratorOptions() {
			return request({
				url: '/station/config/GetStationDevice',
				method: 'POST',
				data: { stationId: this.stationId, type: 2 }
			}).then(res => {
				const data = this.parseResponseData(res);
				this.concentratorOptions = Array.isArray(data) ? data : [];
			}).catch(err => {
				console.error('获取集中器列表错误', err.message);
				this.concentratorOptions = [];
				if (!this.isTop) {
					uni.showToast({ title: '当前站点没有集中器,请先添加。', icon: 'none' });
					setTimeout(() => { if (this.visible) this.close(); }, 1500);
				}
			});
		},
		getTimeTableOptions() {
			return request({
				url: '/station/plan/QueryLightPlan',
				method: 'POST',
				data: {}
			}).then(res => {
				const data = this.parseResponseData(res);
				this.timeTableOptions = Array.isArray(data) ? data : [];
			}).catch(err => {
				console.error('获取时间表选项错误', err.message);
				this.timeTableOptions = [];
			});
		},
		getOutputOptions() {
			return request({
				url: '/station/config/QueryOutput',
				method: 'POST',
				data: { stationId: this.stationId, groupId: 0 }
			}).then(res => {
				const data = this.parseResponseData(res);
				this.outputOptions = Array.isArray(data) ? data : [];
			}).catch(err => {
				console.error('获取控制通道选择框选项错误', err.message);
				this.outputOptions = [];
			});
		},
		getPoleOptions() {
			return request({
				url: '/station/config/QueryLampPole',
				method: 'POST',
				data: { stationId: this.stationId }
			}).then(res => {
				const data = this.parseResponseData(res);
				const list = Array.isArray(data) ? data : [];
				this.poleList = list;
				this.poleOptions = list.map(item => item.name);
			}).catch(err => {
				console.error('获取所属灯杆选择项错误', err.message);
				this.poleList = [];
				this.poleOptions = [];
			});
		},
		getGroupOptions() {
			return request({
				url: '/station/config/QueryArea',
				method: 'POST',
				data: { groupId: 0, stationId: this.stationId }
			}).then(res => {
				const data = this.parseResponseData(res);
				this.groupOptions = Array.isArray(data) ? data.map(item => ({id: item.id, name: item.name})) : [];
			}).catch(err => {
				console.error('获取分组列表错误', err.message);
				this.groupOptions = [];
			});
		}
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
	background: var(--popup-mask, rgba(0, 0, 0, 0.45));
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-panel {
	width: 92%;
	max-width: 700rpx;
	max-height: 88vh;
	background: var(--bg-card, #fff);
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* 二维码设备信息卡片 */
.device-info-card {
	background: var(--bg-accent, #e8f1ff);
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
		color: var(--text-primary, #333);
	}

	.info-hint {
		font-size: 22rpx;
		color: var(--text-tertiary, #909399);
	}

	.info-row {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;

		&:last-child { margin-bottom: 0; }

		.info-label {
			width: 180rpx;
			font-size: 26rpx;
			color: var(--text-secondary, #666);
			flex-shrink: 0;
		}

		.info-value {
			font-size: 26rpx;
			color: var(--text-primary, #333);
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
			color: var(--text-secondary, #666);
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
			background: var(--bg-soft, #f0f2f5);
			border: 1px solid var(--border-color, #e4e7ed);
			border-radius: 8rpx;
			font-size: 28rpx;
			color: var(--text-primary, #333);
			box-sizing: border-box;

			.placeholder { color: var(--text-tertiary, #909399); }
		}

		.input-control {
			height: 72rpx;
			padding: 0 20rpx;
			background: var(--bg-soft, #f0f2f5);
			border: 1px solid var(--border-color, #e4e7ed);
			border-radius: 8rpx;
			font-size: 28rpx;
			color: var(--text-primary, #333);
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
		background: var(--bg-soft, #f0f2f5);
		border: 1px solid var(--border-color, #e4e7ed);
		border-radius: 8rpx;
		font-size: 28rpx;
		color: var(--text-primary, #333);
		box-sizing: border-box;
	}

	.pole-picker {
		width: 100%;
	}

	.pole-picker-value {
		width: 100%;
		height: 72rpx;
		padding: 0 20rpx;
		background: var(--bg-soft, #f0f2f5);
		border: 1px solid var(--border-color, #e4e7ed);
		border-radius: 8rpx;
		font-size: 26rpx;
		color: var(--text-primary, #333);
		overflow: hidden;
		box-sizing: border-box;

		text {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			&.placeholder { color: var(--text-tertiary, #909399); }
		}
	}

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
		color: var(--text-secondary, #666);
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
			background: var(--bg-soft, #f0f2f5);
			border: 1px solid var(--border-color, #e4e7ed);
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
				color: var(--text-primary, #333);
			}

			.power-input {
				flex: 1;
				min-width: 0;
				height: 60rpx;
				text-align: right;
				font-size: 28rpx;
				color: var(--text-primary, #333);
				padding: 0 6rpx;
			}

			.power-unit {
				font-size: 26rpx;
				color: var(--text-secondary, #666);
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
	border-top: 1px solid var(--border-color, #f0f0f0);
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
			background: var(--bg-card, #fff);
			color: var(--color-primary, #007aff);
			border: 1px solid var(--color-primary, #007aff);
		}

		&.confirm {
			background: var(--color-primary, #007aff);
			color: #fff;
		}
	}
}
</style>
