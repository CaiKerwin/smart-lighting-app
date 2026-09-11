<template>
	<view :class="themeClass" class="station-operation-container">
		<!-- 表格区域 -->
		<view class="table-wrap">
			<!-- 表头 -->
			<view class="table-row header">
				<view class="col col-check">
					<checkbox-group @change="checkAllChange">
						<label><checkbox :checked="isAllChecked" value="all" /></label>
					</checkbox-group>
				</view>
				<view class="col col-name">配电箱</view>
				<!-- 通道列 -->
				<view class="col col-channel" @click="openChannelPopup">
					<text class="header-text">通道(通道名称-通道号)</text>
					<uni-icons :color="isDarkMode ? '#aab3c6' : '#999'" class="icon-choose" size="16" type="compose" />
				</view>
				<!-- 时间表列 -->
				<view class="col col-timeTable" @click="openTimeTablePopup">
					<text class="header-text">时间表</text>
					<uni-icons :color="isDarkMode ? '#aab3c6' : '#999'" class="icon-choose" size="16" type="compose" />
				</view>
				<view class="col col-status">状态</view>
			</view>

			<!-- 数据行 -->
			<view v-if="loading" class="table-tip">加载中...</view>
			<view v-else-if="!tableData.length" class="table-tip">暂无数据</view>
			<view v-for="(item, index) in tableData" v-else :key="item.id" class="table-row">
				<view class="col col-check">
					<checkbox-group @change="rowCheckChange(index, $event)">
						<label><checkbox :checked="item.checked" :value="String(item.id)" /></label>
					</checkbox-group>
				</view>
				<view class="col col-name">{{ item.name }}</view>
				<view class="col col-channel">{{ item.channelName }}-K{{ item.channelId }}</view>
				<view class="col col-time-table">{{ item.timeTableName }}</view>
				<!-- 状态列 -->
				<view class="col col-status">{{ item.status }}</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view v-if="hasDco" class="bottom-bar">
			<!-- 开灯 -->
			<uni-datetime-picker
				ref="openLightPicker"
				:start="minLightTime"
				class="bar-picker"
				return-type="string"
				type="datetime"
				@change="onLightTimeChange"
			>
				<view class="btn" @click.stop="openLightTimePicker('开灯')">开灯</view>
			</uni-datetime-picker>

			<!-- 关灯 -->
			<uni-datetime-picker
				ref="closeLightPicker"
				:start="minLightTime"
				class="bar-picker"
				return-type="string"
				type="datetime"
				@change="onLightTimeChange"
			>
				<view class="btn" @click.stop="openLightTimePicker('关灯')">关灯</view>
			</uni-datetime-picker>

			<!-- 读取时间表 -->
			<view class="bar-picker-wrapper" @click="onReadTimeTableClick">
				<picker
					:range="monthDayRange"
					:value="monthDayIndex"
					class="bar-picker"
					mode="multiSelector"
					@change="onReadTimeTablePick"
					@columnchange="onColumnChange"
				>
					<view class="btn">读取时间表</view>
				</picker>
				<!-- 遮罩层 -->
				<view v-if="!hasCheckedDevices" class="picker-mask" @click.stop="onReadTimeTableClick"></view>
			</view>

			<!-- 下发时间表 -->
			<view class="btn" @click="operatingDevice('下发时间表')">下发时间表</view>
		</view>

		<!-- 弹窗遮罩 -->
		<view v-if="popupVisible" class="mask" @click="closePopup"></view>

		<!-- 选择通道弹窗 -->
		<view v-if="showChannelPopup" class="popup">
			<view class="popup-title">选择通道</view>
			<checkbox-group class="popup-list" @change="channelChange">
				<label v-for="item in channelOptions" :key="item.id" class="popup-item">
					<checkbox :checked="tempSelectedChannels.includes(Number(item.id))" :value="String(item.id)" />
					<text class="item-text">{{ item.name }}</text>
				</label>
			</checkbox-group>
			<view class="popup-btns">
				<view class="popup-btn cancel" @click="closePopup">取消</view>
				<view class="popup-btn confirm" @click="confirmPopup">确定</view>
			</view>
		</view>

		<!-- 选择时间表弹窗 -->
		<view v-if="showTimeTablePopup" class="popup">
			<view class="popup-title">选择时间表</view>
			<checkbox-group class="popup-list" @change="timeTableChange">
				<label v-for="item in timeTableOptions" :key="item.id" class="popup-item">
					<checkbox :checked="tempSelectedTimeTables.includes(Number(item.id))" :value="String(item.id)" />
					<text class="item-text">{{ item.name }}</text>
				</label>
			</checkbox-group>
			<view class="popup-btns">
				<view class="popup-btn cancel" @click="closePopup">取消</view>
				<view class="popup-btn confirm" @click="confirmPopup">确定</view>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode, hasOperation} from "@/utils/common";
import WebSocketManager from '@/utils/webSocket.js';

export default {
	data() {
		return {
			wsManager: null, // WebSocket 管理器实例
			groupId: 0,   // 当前分组id，0表示所有分组
			loading: false, // 列表加载状态
			rawList: [],  // 接口返回的完整列表（未过滤）

			// 通道/时间表选项
			channelOptions: [],
			timeTableOptions: [],

			// 已生效的过滤条件
			selectedChannelIds: [],   // 选中的通道id
			selectedTimeTableIds: [],  // 选中的时间表id

			// 弹窗中的临时选择（点确定后才生效）
			tempSelectedChannels: [],
			tempSelectedTimeTables: [],

			// 弹窗及遮罩控制
			showChannelPopup: false,
			showTimeTablePopup: false,
			popupVisible: false, // 遮罩层控制

			// 开关灯时间选择器
			minLightTime: '',       // 开关灯可选择的最小时间（当前时间）
			currentLightAction: '', // 当前开关灯操作类型：开灯/关灯

			// 读取时间表月份/天数选择器（不能选择年份）
			monthDayRange: [
				['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
				['1日', '2日', '3日', '4日', '5日', '6日', '7日', '8日', '9日', '10日', '11日', '12日', '13日', '14日', '15日', '16日', '17日', '18日', '19日', '20日', '21日', '22日', '23日', '24日', '25日', '26日', '27日', '28日', '29日', '30日', '31日']
			],
			monthDayIndex: [0, 0],  // 读取时间表选择器当前选中索引

			// websocket连接
			socketConnected: false,  // 连接状态
			socketConnecting: false, // 连接中状态
			// 待处理指令映射：commandId -> { rowId, type, month, day }
			pendingCommands: {}
		};
	},
	computed: {
		// 动态表格数据：按已选通道/时间表过滤 rawList
		tableData() {
			if (!this.selectedChannelIds.length && !this.selectedTimeTableIds.length) {
				return this.rawList;
			}
			return this.rawList.filter(item => {
				const matchChannel = !this.selectedChannelIds.length || this.selectedChannelIds.includes(item.channelId);
				const matchTimeTable = !this.selectedTimeTableIds.length || this.selectedTimeTableIds.includes(item.timeTableId);
				return matchChannel && matchTimeTable;
			});
		},
		isAllChecked() {
			return this.tableData.length > 0 && this.tableData.every(item => item.checked);
		},
		// 是否有选中设备
		hasCheckedDevices() {
			return this.tableData.some(item => item.checked);
		},
		// 是否有 dco 设备操作权限
		hasDco() {
			return hasOperation('dco');
		}
	},
	onLoad(options) {
		// 从路由读取分组id
		this.groupId = Number(options && options.groupId) || 0;

		const now = new Date();
		const monthIndex = now.getMonth();
		const dayIndex = now.getDate() - 1;
		this.monthDayIndex = [monthIndex, dayIndex];
		this.updateDaysForMonth(monthIndex); // 默认当前月份和天数

		// 初始化开关灯可选的最小时间
		this.refreshMinLightTime();

		this.wsManager = new WebSocketManager({
			onOpen: () => {
				this.socketConnected = true;
				this.socketConnecting = false;
				console.log('websocket已连接');
			},
			onMessage: (data) => {
				// console.log('websocket接收到数据', data);
				this.handleSocketMessage(data);
			},
			onError: (err) => {
				this.socketConnected = false;
				this.socketConnecting = false;
				console.error('websocket错误', err);
			},
			onClose: () => {
				this.socketConnected = false;
				this.socketConnecting = false;
				console.log('websocket已关闭');
			}
		});

		// 建立WebSocket连接，获取指令状态变化
		this.wsManager.connect();

		// 获取列表数据
		this.getGroupControlList();
	},
	onUnload() {
		if (this.wsManager) {
			this.wsManager.close(); // 关闭连接并解绑全局事件
			this.wsManager = null;
		}
	},
	methods: {
		// 全选/取消全选
		checkAllChange(e) {
			const checked = e.detail.value.includes('all');
			this.tableData.forEach(item => {
				item.checked = checked;
			});
		},
		// 单行勾选
		rowCheckChange(index, e) {
			this.tableData[index].checked = e.detail.value.includes(String(this.tableData[index].id));
		},
		// 打开通道弹窗（先备份当前生效条件）
		openChannelPopup() {
			this.tempSelectedChannels = [...this.selectedChannelIds];
			this.showChannelPopup = true;
			this.popupVisible = true;
		},
		// 打开时间表弹窗
		openTimeTablePopup() {
			this.tempSelectedTimeTables = [...this.selectedTimeTableIds];
			this.showTimeTablePopup = true;
			this.popupVisible = true;
		},
		// 关闭弹窗
		closePopup() {
			this.showChannelPopup = false;
			this.showTimeTablePopup = false;
			this.popupVisible = false;
		},
		// 确定弹窗
		confirmPopup() {
			if (this.showChannelPopup) {
				this.selectedChannelIds = [...this.tempSelectedChannels];
			}
			if (this.showTimeTablePopup) {
				this.selectedTimeTableIds = [...this.tempSelectedTimeTables];
			}
			this.closePopup();
		},
		// 通道选择事件（checkbox 的 value 为字符串，转回数字id）
		channelChange(e) {
			this.tempSelectedChannels = (e.detail.value || []).map(Number);
		},
		// 时间表选择事件
		timeTableChange(e) {
			this.tempSelectedTimeTables = (e.detail.value || []).map(Number);
		},
		// 获取群组控制列表
		getGroupControlList() {
			/**
			 * [
			 *   {
			 *     "id": 392966,
			 *     "name": "K1",
			 *     "stationId": 75,
			 *     "stationName": "AMDM演示柜",
			 *     "groupName": null,
			 *     "content": {
			 *       "mid": 392965,
			 *       "timeId": 891,
			 *       "oc": 1,
			 *       "version": 3
			 *     },
			 *     "mainName": "-",
			 *     "timeName": "公司演示箱时间表",
			 *     "lastData": {
			 *       "time": 1788750030000,
			 *       "ov": 0,
			 *       "es": true,
			 *       "sv": 2,
			 *       "tv": 0,
			 *       "version": 3
			 *     },
			 *     "extraData": {},
			 *     "type": 3,
			 *     "code": "",
			 *     "deviceId": 305162,
			 *     "typeName": null,
			 *     "devType": "3dms8051b",
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false
			 *   },
			 *   {
			 *     "id": 392967,
			 *     "name": "K2",
			 *     "stationId": 75,
			 *     "stationName": "AMDM演示柜",
			 *     "groupName": null,
			 *     "content": {
			 *       "mid": 392965,
			 *       "timeId": 891,
			 *       "oc": 2,
			 *       "version": 3
			 *     },
			 *     "mainName": "-",
			 *     "timeName": "公司演示箱时间表",
			 *     "lastData": {
			 *       "time": 1788750030000,
			 *       "ov": 0,
			 *       "es": true,
			 *       "sv": 2,
			 *       "tv": 0,
			 *       "version": 3
			 *     },
			 *     "extraData": {},
			 *     "type": 3,
			 *     "code": "",
			 *     "deviceId": 305162,
			 *     "typeName": null,
			 *     "devType": "3dms8051b",
			 *     "online": false,
			 *     "alarm": false,
			 *     "running": false
			 *   }
			 * ]
			 */
			// name表示通道列的名称  timeName表示时间表列的名称  stationName表示配电箱列的名称
			// oc 选择的通道id timeId表示选择的时间表id
			this.loading = true;
			request({
				url: '/station/config/QueryOutput',
				method: 'POST',
				data: {
					groupId: this.groupId, // 当前分组id groupId=0表示所有分组
					stationId: 0, // 当前分组下的站点id stationId=0表示所有站点
					channel: 0, // 通道id channel=0表示所有通道
					timeIds: [] // 多个时间表id timeIds=[]表示所有时间表
				}
			}).then(res => {
				console.log(base64Decode(res.data.data));

				const payload = res.data;
				let list = [];
				if (payload && payload.data) {
					try {
						list = JSON.parse(base64Decode(payload.data));
					} catch (e) {
						console.error('解析群组控制列表失败', e);
						list = [];
					}
				}
				this.rawList = (Array.isArray(list) ? list : [])
					.filter(item => item && typeof item === 'object')
					.map(item => this.formatRow(item));
				// 依据完整数据推导通道/时间表筛选选项
				this.buildFilterOptions();
			}).catch(err => {
				console.log('获取群组控制列表失败', err.message);
				this.rawList = [];
				uni.showToast({ title: '获取群组控制列表失败', icon: 'none' });
			}).finally(() => {
				this.loading = false;
			});
		},
		// 将接口返回项转换为表格行
		formatRow(item) {
			const content = item && item.content ? item.content : {};
			return {
				id: item.id,
				name: item.stationName || '-',   // 配电箱
				stationId: item.stationId,
				channelId: content.oc != null ? Number(content.oc) : null,   // 通道id
				channelName: item.name || '-',       // 通道名称
				timeTableId: content.timeId != null ? Number(content.timeId) : null, // 时间表id
				timeTableName: item.timeName || '-',  // 时间表名称
				status: '', // 状态
				online: item.online,
				alarm: item.alarm,
				running: item.running,
				deviceId: item.deviceId,
				checked: false,
				raw: item
			};
		},
		// 由完整列表推导通道、时间表筛选选项（去重，保留id与名称）
		buildFilterOptions() {
			const channelMap = {};
			const timeTableMap = {};
			this.rawList.forEach(item => {
				if (item.channelId && !channelMap[item.channelId]) {
					channelMap[item.channelId] = { id: item.channelId, name: item.channelName };
				}
				if (item.timeTableId && !timeTableMap[item.timeTableId]) {
					timeTableMap[item.timeTableId] = { id: item.timeTableId, name: item.timeTableName };
				}
			});
			this.channelOptions = Object.values(channelMap);
			this.timeTableOptions = Object.values(timeTableMap);
		},

		// 格式化日期时间为 yyyy-MM-dd HH:mm:ss
		formatDateTime(date) {
			const pad = n => (n < 10 ? '0' + n : '' + n);
			return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
		},
		// 刷新开关灯可选的最小时间
		refreshMinLightTime() {
			this.minLightTime = this.formatDateTime(new Date());
		},
		// 是否有选中设备（无则提示）
		checkSelectedAndToast() {
			if (this.tableData.some(item => item.checked)) {
				return true;
			}
			uni.showToast({ title: '请选择要操作的设备', icon: 'none' });
			return false;
		},
		// 点击开关灯按钮：先校验选中设备，再弹出时间选择器
		openLightTimePicker(type) {
			if (!this.checkSelectedAndToast()) {
				return;
			}
			this.currentLightAction = type;
			// 每次打开前刷新最小可选时间，保证大于等于当前时间
			this.refreshMinLightTime();
			const refName = type === '开灯' ? 'openLightPicker' : 'closeLightPicker';
			const picker = this.$refs[refName];
			if (picker) {
				picker.show();
			}
		},
		// 开关灯时间选择确认：校验时间需大于等于当前时间
		onLightTimeChange(value) {
			if (!value) {
				return;
			}
			if (!this.isTimeNotBeforeNow(value)) {
				uni.showToast({ title: `${this.currentLightAction || '开关灯'}时间不能早于当前时间`, icon: 'none' });
				return;
			}
			this.operatingDevice(this.currentLightAction, value);
		},
		// 校验时间是否不早于当前时间
		isTimeNotBeforeNow(value) {
			const selected = new Date(String(value).replace(/-/g, '/'));
			return !isNaN(selected.getTime()) && selected.getTime() >= Date.now();
		},
		// 读取时间表点击事件
		onReadTimeTableClick() {
			if (!this.hasCheckedDevices) {
				uni.showToast({ title: '请选择要操作的设备', icon: 'none' });
			}
		},
		// 读取时间表选择确认
		onReadTimeTablePick(e) {
			const value = e.detail.value || [];
			const monthIndex = Number(value[0]);
			const dayIndex = Number(value[1]);
			this.monthDayIndex = [monthIndex, dayIndex];
			this.operatingDevice('读取时间表', {
				month: monthIndex + 1,
				day: dayIndex + 1
			});
		},
		/**
		 * 根据月份索引获取该月天数（考虑闰年）
		 * @param {number} monthIndex - 0~11
		 * @returns {number} 天数
		 */
		getDaysInMonth(monthIndex) {
			const year = new Date().getFullYear(); // 使用当前年份判断闰年
			return new Date(year, monthIndex + 1, 0).getDate();
		},

		/**
		 * 更新天数列的范围，并修正选中的天数索引
		 * @param {number} monthIndex - 0~11
		 */
		updateDaysForMonth(monthIndex) {
			const days = this.getDaysInMonth(monthIndex);
			const dayRange = Array.from({ length: days }, (_, i) => (i + 1) + '日');
			// 更新
			this.$set(this.monthDayRange, 1, dayRange);
			// 如果当前选中的天数索引超出新范围，自动修正为最后一天
			const currentDayIndex = this.monthDayIndex[1];
			if (currentDayIndex >= days.length) {
				this.$set(this.monthDayIndex, 1, days.length - 1);
			}
		},

		/**
		 * 多列选择器列变化事件
		 */
		onColumnChange(e) {
			const { column, value } = e.detail;
			// 更新选中的列
			this.$set(this.monthDayIndex, column, value);
			if (column === 0) { // 只监听月份列变化
				this.updateDaysForMonth(value);
			}
		},

		// ==================== websocket 指令状态 ====================
		// 确保websocket已连接（连接断开后重新建立）
		ensureSocket() {
			if (this.wsManager) {
				this.wsManager.connect();
			}
		},
		// 处理指令返回结果：解析commandId并登记，用于匹配websocket消息
		handleCommandResponse(res, type, extra) {
			const decoded = base64Decode(res && res.data && res.data.data);
			let payload = null;
			if (decoded) {
				try {
					payload = JSON.parse(decoded);
				} catch (e) {
					payload = null;
				}
			}
			if (!payload || !Array.isArray(payload.list)) {
				console.error('解析指令返回结果失败', decoded);
				return;
			}
			// 保证socket可用，便于接收后续状态消息
			this.ensureSocket();
			payload.list.forEach(item => {
				if (!item || item.id == null) return;
				const rowId = Number(item.id);
				if (item.success && item.message) {
					// 记录 commandId -> 表格行 的映射
					this.pendingCommands[item.message] = {
						rowId: rowId,
						type: type,
						month: extra && extra.month,
						day: extra && extra.day
					};
					this.setRowStatus(rowId, '指令已发送');
				} else {
					this.setRowStatus(rowId, item.message || '指令发送失败');
				}
			});
		},
		// 更新指定行的status列
		setRowStatus(rowId, text) {
			const row = this.rawList.find(item => Number(item.id) === rowId);
			if (row) {
				this.$set(row, 'status', text);
			}
		},
		// 处理websocket消息
		handleSocketMessage(data) {
			let msg = data;
			if (typeof data === 'string') {
				try {
					msg = JSON.parse(data);
				} catch (e) {
					msg = null;
				}
			}
			/**
			 * 所有type值
			 * cmd 指令结果
			 * data 数据更新
			 * state 状态更新
			 * water 水浸指令结果
			 */
			if (!msg || msg.type !== 'cmd') return; // 只处理指令类消息
			const commandId = msg.commandId;
			const pending = this.pendingCommands[commandId];
			if (!pending) return;

			const statusNum = Number(msg.status);
			const statusText = msg.message || this.statusText(statusNum);

			// 读取时间表指令执行成功后，展示所选月份/天数对应的时间表信息
			if (pending.type === '读取时间表' && statusNum === 9) {
				this.setRowStatus(pending.rowId, this.formatTimeTableDay(msg.content, pending.month, pending.day));
				delete this.pendingCommands[commandId];
				return;
			}

			this.setRowStatus(pending.rowId, statusText);

			// 终端状态（成功/失败/超时）后清理映射
			if (statusNum === 9 || statusNum === 8 || statusNum === 7) {
				delete this.pendingCommands[commandId];
			}
		},
		// 状态码对应的文本
		statusText(status) {
			const map = { 2: '指令已发送', 4: '执行中', 5: '已重发', 7: '已超时', 8: '执行失败', 9: '执行成功' };
			return map[status] || `状态${status}`;
		},
		// 将读取时间表返回的某天数据格式化为可读文本
		/**
		 * 显示格式
		 * 执行成功：9月7日计划：18:00-06:00:开启, 19:00-05:00:无效, 00:00-00:00:无效, 00:00-00:00:无效
		 */
		formatTimeTableDay(content, month, day) {
			const dayData = content && content['day' + day];
			if (!dayData) {
				return `${month}月${day}日无时间表数据`;
			}
			const segs = [];
			// o1-c1、o2-c2、o3-c3、o4-c4 四段全部展示，动作标识：0-关闭 1-开启 2-无效
			for (let i = 1; i <= 4; i++) {
				const open = dayData['o' + i] || '';
				const close = dayData['c' + i] || '';
				const action = dayData['a' + i];
				let flag;
				if (Number(action) === 0) flag = '关闭';
				else if (Number(action) === 1) flag = '开启';
				else if (Number(action) === 2) flag = '无效';
				segs.push(`${open}-${close}:${flag}`);
			}
			return `执行成功：${month}月${day}日计划：${segs.join(', ')}`;
		},

		// 底部操作按钮
		// @param {string} type 操作类型：开灯/关灯/读取时间表/下发时间表
		// @param {*} timeOrArgs 开灯/关灯传入时间字符串，读取时间表传入 { month, day }
		operatingDevice(type, timeOrArgs) {
			const checkedItems = this.tableData.filter(item => item.checked);
			if (checkedItems.length === 0) {
				uni.showToast({
					title: '请选择要操作的设备',
					icon: 'none'
				});
				return;
			}
			const checkedIds = checkedItems.map(item => item.id);

			/**
			 * 接口返回的message表示commandId用于获取websocket数据
			 * websocket 网址 wss://www.amdm.top/api/center/data GET请求
			 *
			 * 消息格式
			 * {
			 *   "type": "cmd",
			 *   "appType": "road",
			 *   "customerId": 4,
			 *   "commandId": "01b70f115c8b482ebef2d45758dfd374",
			 *   "cmdCode": "getYearPlan",
			 *   "status": 9,
			 *   "cmdType": 12,
			 *   "message": "指令已完成",
			 *   "content": {
			 *     "mode": 4,
			 *     "channel": "1",
			 *     "month": "9",
			 *     "seq": "4",
			 *     "day1": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day2": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day3": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day4": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day5": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day6": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day7": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day8": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day9": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day10": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day11": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day12": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day13": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day14": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day15": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day16": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day17": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day18": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day19": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day20": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day21": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day22": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day23": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day24": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day25": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day26": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day27": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day28": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day29": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day30": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day31": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "time": "2026-09-07 15:23:15"
			 *   }
			 * }
			 *
			 */
			/**
			 * status字段值含义
			 *  2-指令已发送  4-执行中  5-已重发  7-已超时 8-执行失败  9-执行成功
			 */

			/**
			 * 读取时间表消息 返回这一个月的时间表信息
			 * {
			 *   "type": "cmd",
			 *   "appType": "road",
			 *   "customerId": 4,
			 *   "commandId": "01b70f115c8b482ebef2d45758dfd374",
			 *   "cmdCode": "getYearPlan",
			 *   "status": 9,
			 *   "cmdType": 12,
			 *   "message": "指令已完成",
			 *   "content": {
			 *     "mode": 4,
			 *     "channel": "1",
			 *     "month": "9",
			 *     "seq": "4",
			 *     "day1": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day2": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day3": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day4": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day5": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day6": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day7": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day8": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day9": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day10": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day11": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day12": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day13": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day14": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day15": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day16": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day17": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day18": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day19": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day20": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day21": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day22": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day23": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day24": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day25": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day26": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day27": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day28": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day29": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day30": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "day31": {
			 *       "o1": "18:00",
			 *       "c1": "06:00",
			 *       "a1": "1",
			 *       "o2": "19:00",
			 *       "c2": "05:00",
			 *       "a2": "2",
			 *       "o3": "00:00",
			 *       "c3": "00:00",
			 *       "a3": "2",
			 *       "o4": "00:00",
			 *       "c4": "00:00",
			 *       "a4": "2"
			 *     },
			 *     "time": "2026-09-07 15:23:15"
			 *   }
			 * }
			 */

			/**
			 * 下发时间表消息
			 * {
			 *   "type": "cmd",
			 *   "appType": "road",
			 *   "customerId": 4,
			 *   "commandId": "993e0e538c3842fb9373b185ade49345",
			 *   "cmdCode": "setYearPlan",
			 *   "status": 9,
			 *   "cmdType": 12,
			 *   "message": "指令已完成",
			 *   "content": {}
			 * }
			 */

			/**
			 * 开关灯消息
			 * {
			 *   "type": "cmd",
			 *   "appType": "road",
			 *   "customerId": 4,
			 *   "commandId": "df3e18a01d874eabaa4c52f49cf9fc43",
			 *   "cmdCode": "handControl",
			 *   "status": 9,
			 *   "cmdType": 12,
			 *   "message": "指令已完成",
			 *   "content": {}
			 * }
			 */

			/**
			 * status列需要展示的信息即为返回的消息中的content和message
			 * 先显示message变化直到指令完成后，对于读取时间表指令，显示选择的月份和天数对应在content中的时间表信息
			 *
			 */
			switch (type) {
				case '开灯':
					/**
					 * 请求体
					 * {
					 *   "code": "handControl",
					 *   "list": [
					 *     392966
					 *   ],
					 *   "checkUserId": 0,
					 *   "args": {
					 *     "open": true,
					 *     "enable": true,
					 *     "expire": "2026-09-07 15:08:11",
					 *     "point": false
					 *   }
					 * }
					 */

					/**
					 * 返回结果
					 * {
					 *   "flag": "00000000000000000000000000000000",
					 *   "list": [
					 *     {
					 *       "id": 392966,
					 *       "success": true,
					 *       "message": "ac21d86c9b7349839a3ca67237498f56"
					 *     }
					 *   ]
					 * }
					 */
					request({
						url: '/station/command/SendOutputOld',
						method: 'POST',
						data: {
							code: 'handControl', // 命令码 这里固定为通道开关handControl
							list: checkedIds, // 要操作的设备id列表
							checkUserId: 0, // 当前用户id，这里固定为0，表示没有权限限制
							args: {
								open: true, // 是否开灯
								enable: true, // 是否启用，默认true
								expire: timeOrArgs || '', // 开灯/关灯时间，格式为yyyy-MM-dd HH:mm:ss
								point: false // 是否启用点控，默认false
							}
						}
					}).then(res =>{
						console.log(base64Decode(res.data.data))
						this.handleCommandResponse(res, type, timeOrArgs);
					}).catch(err =>{
						console.error('发送控制通道指令错误', err.message);
					})
					break;
				case '关灯':
					request({
						url: '/station/command/SendOutputOld',
						method: 'POST',
						data: {
							code: 'handControl', // 命令码 这里固定为通道开关handControl
							list: checkedIds, // 要操作的设备id列表
							checkUserId: 0, // 当前用户id，这里固定为0，表示没有权限限制
							args: {
								open: false, // 是否开灯
								enable: true, // 是否启用，默认true
								expire: timeOrArgs || '', // 开灯/关灯时间，格式为yyyy-MM-dd HH:mm:ss
								point: false // 是否启用点控，默认false
							}
						}
					}).then(res =>{
						console.log(base64Decode(res.data.data))
						this.handleCommandResponse(res, type, timeOrArgs);
					}).catch(err =>{
						console.error('发送控制通道指令错误', err.message);
					})
					break;
				case '读取时间表':
					/**
					 * 请求体
					 * {
					 *   "code": "getYearPlan",
					 *   "list": [
					 *     392966
					 *   ],
					 *   "checkUserId": 0,
					 *   "args": {
					 *     "single": true,
					 *     "month": 9,
					 *     "day": 7
					 *   }
					 * }
					 */

					/**
					 * 返回结果
					 * {
					 *   "flag": "00000000000000000000000000000000",
					 *   "list": [
					 *     {
					 *       "id": 392966,
					 *       "success": true,
					 *       "message": "c293e41593c04069895045ca9a22370c"
					 *     }
					 *   ]
					 * }
					 */
					request({
						url: '/station/command/SendOutputOld',
						method: 'POST',
						data: {
							code: 'getYearPlan', // 命令码 这里固定为读取时间表getYearPlan
							list: checkedIds, // 要操作的设备id列表
							checkUserId: 0, // 当前用户id，这里固定为0，表示没有权限限制
							args: {
								single: true, // 是否唯一，默认为true
								month: (timeOrArgs && timeOrArgs.month) || '', // 选择的月份
								day: (timeOrArgs && timeOrArgs.day) || '' // 选择的天数
							}
						}
					}).then(res =>{
						console.log(base64Decode(res.data.data))
						this.handleCommandResponse(res, type, timeOrArgs);
					}).catch(err =>{
						console.error('发送控制通道指令错误', err.message);
					})
					break;
				case '下发时间表':
					/**
					 * 请求体
					 * {
					 *   "code": "sendYearPlan",
					 *   "list": [
					 *     392966
					 *   ],
					 *   "checkUserId": 0,
					 *   "args": {}
					 * }
					 */

					/**
					 * 返回结果
					 * {
					 *   "flag": "00000000000000000000000000000000",
					 *   "list": [
					 *     {
					 *       "id": 392966,
					 *       "success": true,
					 *       "message": "c293e41593c04069895045ca9a22370c"
					 *     }
					 *   ]
					 * }
					 */

					uni.showModal({
						title: '提示',
						content: '确定要向设备下发时间表吗？',
						success: (res) => {
							if (res.confirm) {
								request({
									url: '/station/command/SendOutputOld',
									method: 'POST',
									data: {
										code: 'setYearPlan', // 命令码 这里固定为设置时间表setYearPlan
										list: checkedIds, // 要操作的设备id列表
										checkUserId: 0, // 当前用户id，这里固定为0，表示没有权限限制
										args: {}
									}
								}).then(res =>{
									console.log(base64Decode(res.data.data))
									this.handleCommandResponse(res, type, timeOrArgs);
								}).catch(err =>{
									console.error('发送控制通道指令错误', err.message);
								})
							}
						}
					})
					break;
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.station-operation-container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: var(--bg-page, #f5f6f8);
	position: relative;
}

/* 表格区域 */
.table-wrap {
	flex: 1;
	overflow-y: auto;
	padding: 0;
	margin: 0;
}

.table-tip {
	padding: 40rpx 0;
	text-align: center;
	font-size: 28rpx;
	color: var(--text-quaternary, #999);
}

.table-row {
	display: flex;
	align-items: center;
	background-color: var(--bg-card, #ffffff);
	font-size: 28rpx;
	margin-bottom: 10rpx;
	padding: 20rpx 0;

	&.header {
		font-size: 32rpx;
		background-color: var(--bg-soft, #f9f9f9);
		font-weight: bold;
		color: var(--text-primary, #333);
		border-bottom: 2rpx solid var(--border-color, #eee);
		margin-bottom: 0;
	}
}

.col {
	display: flex;
	align-items: center;

	/* 五列宽度 */
	&.col-check {
		width: 10%;
		justify-content: center;
	}
	&.col-name {
		width: 20%;
		color: var(--text-primary, #333);
	}
	&.col-channel {
		width: 20%;
		justify-content: center;
		color: var(--text-secondary, #666);
	}
	&.col-time-table {
		width: 20%;
		justify-content: center;
		color: var(--text-secondary, #666);
	}
	&.col-status {
		width: 30%;
		justify-content: center;
		color: var(--text-secondary, #666);
	}
}

.header-text {
	margin-right: 6rpx;
}

/* 底部固定按钮 */
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	display: flex;
	justify-content: space-evenly;
	padding: 20rpx 30rpx;
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 -2rpx 10rpx var(--bg-box-shadow, rgba(0,0,0,0.05));
	box-sizing: border-box;
	z-index: 10;
}

.btn {
	background-color: #3b82f6;
	color: #ffffff;
	font-size: 30rpx;
	padding: 16rpx 30rpx;
	border-radius: 8rpx;
	font-weight: 500;
	display: inline-block;
	white-space: nowrap;
}

.bar-picker-wrapper {
	position: relative;
	display: inline-block;


	.bar-picker {
		width: auto;
		flex: none;
		margin-right: 16rpx;
	}

	.picker-mask {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 5;
	}
}


/* 弹窗样式 */
.mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 99;
}

.popup {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 80%;
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	z-index: 100;
	padding: 30rpx;
	box-shadow: 0 4rpx 20rpx var(--bg-box-shadow, rgba(0,0,0,0.2));

	.popup-title {
		font-size: 32rpx;
		font-weight: bold;
		color: var(--text-primary, #333);
		margin-bottom: 20rpx;
	}

	.popup-list {
		.popup-item {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;

			.item-text {
				margin-left: 10rpx;
				font-size: 30rpx;
				color: var(--text-primary, #333);
			}
		}
	}

	.popup-btns {
		display: flex;
		justify-content: flex-end;
		margin-top: 20rpx;

		.popup-btn {
			padding: 10rpx 30rpx;
			font-size: 30rpx;
			margin-left: 20rpx;
			border-radius: 8rpx;

			&.cancel {
				color: var(--text-secondary, #666);
			}

			&.confirm {
				color: #3880FC;
				font-weight: bold;
			}
		}
	}
}
</style>
