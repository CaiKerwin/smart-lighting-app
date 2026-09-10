<!-- 单灯、太阳能灯杆站点详情界面 -->
<template>
	<view class="station-detail-container">
		<!-- 主内容可滚动区域 -->
		<view :style="{ paddingBottom: isExpanded ? '360rpx' : '260rpx' }" class="main-content">
			<!-- 筛选区域 (展开状态显示) -->
			<view v-if="isExpanded" class="filter-section">
				<view class="filter-row">
					<view class="filter-item">
						<text class="label">名称</text>
						<input v-model="filterName" class="input-box" maxlength="13" placeholder="输入名称" type="text" />
					</view>
					<view class="filter-item">
						<text class="label">分组</text>
						<picker :range="groupOptionLabels" :value="groupIndex" class="picker-box" mode="selector" @change="onGroupChange">
							<view class="picker-text">{{ groupOptionLabels[groupIndex] || '选择分组' }} <uni-icons color="#999" size="12" type="bottom" /></view>
						</picker>
					</view>
				</view>
				<view class="filter-row">
					<view class="filter-item time-table-item">
						<text class="label">日表</text>
						<view class="dual-picker">
							<!-- 亮灯计时日表 timeId1 -->
							<picker :range="timeId1Labels" :value="timeId1Index" class="picker-box half" mode="selector" @change="onTimeId1Change">
								<view class="picker-text">{{ timeId1Labels[timeId1Index] || '全部计时日表' }} <uni-icons color="#999" size="12" type="bottom" /></view>
							</picker>
							<!-- 准时日表 timeId2 -->
							<picker :range="timeId2Labels" :value="timeId2Index" class="picker-box half" mode="selector" @change="onTimeId2Change">
								<view class="picker-text">{{ timeId2Labels[timeId2Index] || '全部准时日表' }} <uni-icons color="#999" size="12" type="bottom" /></view>
							</picker>
						</view>
					</view>
				</view>
				<view class="filter-row query-row">
					<button class="query-btn clear-btn" @click="clearFilterConditions">清除条件</button>
					<button class="query-btn" @click="queryLightInfo">查询</button>
				</view>
			</view>

			<!-- 状态统计与视图切换行 -->
			<view class="status-row">
				<!-- 总数气泡+勾选框 -->
				<view class="total-badge" @click="toggleSelectAll">
					<checkbox :checked="isAllSelected" color="#3a7bf7" />
					<text class="badge-text">总数 {{ totalCount }}</text>
				</view>

				<!-- 单灯状态气泡（横向滑动，单选，可再次点击取消） -->
				<scroll-view class="status-scroll" scroll-x>
					<view
						v-for="(item, index) in statusList"
						:key="index"
						:class="{ 'status-badge-active': activeStatusIndex === index }"
						class="status-badge"
						@click="handleStatusClick(index)"
					>
						<image :src="item.icon" class="status-icon" mode="aspectFit" />
						<text class="badge-text">{{ item.count }}</text>
					</view>
				</scroll-view>

				<!-- 视图切换按钮 -->
				<view class="view-toggle">
					<view class="toggle-btn" @click="toggleExpand">
						<uni-icons :type="isExpanded ? 'up' : 'down'" color="#333" size="20" />
					</view>
					<view class="toggle-btn" @click="toggleView">
						<uni-icons :type="viewMode === 'card' ? 'list' : 'bars'" color="#333" size="20" />
					</view>
				</view>
			</view>

			<!-- 卡片视图 -->
			<view v-if="viewMode === 'card'" class="card-grid">
				<view
					v-for="(item, index) in listData"
					:key="item.id"
					:class="{ 'card-selected': item.selected }"
					class="card"
					@click="toggleSelect(item)"
				>
					<text class="card-name" @click.stop="openEditLightNamePopup(item)">{{ item.name }}</text>
					<image :src="getLampIcon(item)" class="card-icon" mode="aspectFit" @click.stop="openLightDetailPopup(item)" />
					<!-- 功率/亮度（show_power 关闭时显示占位） -->
					<view v-if="showPower" class="card-footer">
						<text class="card-power">{{ item.power }}</text>
						<text class="card-brightness">{{ item.brightness }}</text>
					</view>
					<view v-else class="card-footer">
						<text class="card-placeholder">--</text>
					</view>
				</view>
			</view>

			<!-- 表格视图 -->
			<view v-else class="table-view">
				<!-- 表头 -->
				<view class="table-header">
					<view class="col col-check">
						<checkbox :checked="isAllSelected" color="#3a7bf7" @click="toggleSelectAll" />
					</view>
					<view class="col col-name">名称</view>
					<view class="col col-status">状态</view>
					<view class="col col-voltage" @click="sortBy('voltage')">
						电压V
						<image :src="getSortIcon('voltage')" class="sort-icon" mode="aspectFit" />
					</view>
					<view class="col col-power">功率W</view>
					<view class="col col-brightness">亮度%</view>
					<view class="col col-time" @click="sortBy('time')">
						最后通讯时间
						<image :src="getSortIcon('time')" class="sort-icon" mode="aspectFit" />
					</view>
				</view>
				<!-- 表格内容 -->
				<view
					v-for="(item, index) in listData"
					:key="item.id"
					:class="{ 'row-selected': item.selected }"
					class="table-row"
					@click="toggleSelect(item)"
				>
					<view class="col col-check">
						<checkbox :checked="item.selected" color="#3a7bf7" @click.stop="toggleSelect(item)" />
					</view>
					<view class="col col-name" @click.stop="openEditLightNamePopup(item)">{{ item.name }}</view>
					<view class="col col-status" @click.stop="openLightDetailPopup(item)">
						<image :src="getStatusIcon(item.status)" class="table-status-icon" mode="aspectFit" />
					</view>
					<view class="col col-voltage">{{ item.voltage }}</view>
					<!-- 表头已有单位，这里显示不带单位的数值 -->
					<view class="col col-power">{{ item.powerValue }}</view>
					<view class="col col-brightness">{{ item.brightnessValue }}</view>
					<view class="col col-time">{{ item.lastCommTime }}</view>
				</view>
			</view>

			<!-- 空数据提示 -->
			<view v-if="!loading && !listData.length" class="empty-tip">
				<text class="empty-text">暂无单灯数据</text>
			</view>
		</view>

		<!-- 底部固定区域 -->
		<view class="fixed-bottom">
			<!-- 分页器 -->
			<Pagination
				v-if="totalCount > 100"
				:current="currentPage"
				:pageSize="pageSize"
				:pageSizeOptions="pageSizeOptions"
				:total="totalCount"
				@change="onPageChange"
				@pageSizeChange="onPageSizeChange"
			/>

			<!-- 底部操作按钮 -->
			<view class="action-buttons">
				<view class="btn-row">
					<button class="action-btn" @click="handleAction('召测')">
						<image class="btn-icon" mode="aspectFit" src="/static/operation/detail/remote-testing.png" />
						召测
					</button>
					<button class="action-btn" @click="handleAction('开灯')">
						<image class="btn-icon" mode="aspectFit" src="/static/operation/detail/light-on.png" />
						开灯
					</button>
					<button class="action-btn" @click="handleAction('关灯')">
						<image class="btn-icon" mode="aspectFit" src="/static/operation/detail/light-off.png" />
						关灯
					</button>
					<button class="action-btn" @click="handleAction('调光')">
						<image class="btn-icon" mode="aspectFit" src="/static/operation/detail/light-control.png" />
						调光
					</button>
					<button class="action-btn" @click="handleAction('调色')">
						<image class="btn-icon" mode="aspectFit" src="/static/operation/detail/color-grading.png" />
						调色
					</button>
				</view>
				<!-- 第二行按钮仅在展开状态显示 -->
				<view v-if="isExpanded" class="btn-row">
					<button class="action-btn text-only" @click="handleAction('查询时钟')">查询时钟</button>
					<button class="action-btn text-only" @click="handleAction('校准时钟')">校准时钟</button>
					<button class="action-btn text-only" @click="handleAction('设置日表')">设置日表</button>
					<button class="action-btn text-only" @click="handleAction('控制模式')">控制模式</button>
					<button class="action-btn text-only" @click="handleAction('清除指令')">清除指令</button>
				</view>
			</view>
		</view>

		<!-- 开灯 / 关灯 / 调光 / 调色弹窗 -->
		<LightControlPopup
			:action="lightPopupAction"
			:channels="commandChannels"
			:mode="lightPopupMode"
			:title="lightPopupTitle"
			:visible="lightPopupVisible"
			@close="lightPopupVisible = false"
			@confirm="onLightPopupConfirm"
		/>

		<!-- 设置控制模式弹窗 -->
		<CommandModePopup
			:visible="modePopupVisible"
			@close="modePopupVisible = false"
			@confirm="onModePopupConfirm"
		/>

		<!-- 设置日表弹窗 -->
		<DayPlanPopup
			:visible="dayPlanPopupVisible"
			@close="dayPlanPopupVisible = false"
			@confirm="onDayPlanPopupConfirm"
		/>

		<!-- 指令发送结果弹窗（操作列表） -->
		<CommandResultPopup
			:list="commandResults"
			:visible="resultPopupVisible"
			@close="resultPopupVisible = false"
		/>
	</view>
</template>

<script>
import Pagination from "@/components/pagination.vue";
// 指令弹窗组件
import LightControlPopup from "../lightCommands/lightControlPopup.vue";
import CommandModePopup from "../lightCommands/commandModePopup.vue";
import DayPlanPopup from "../lightCommands/dayPlanPopup.vue";
import CommandResultPopup from "../lightCommands/commandResultPopup.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import WebSocketManager from '@/utils/webSocket.js';

export default {
	name: 'stationTwo',
	components: {
		Pagination,
		LightControlPopup,
		CommandModePopup,
		DayPlanPopup,
		CommandResultPopup
	},
	data() {
		return {
			// 入口参数
			stationId: 0,   // 站点 id
			boxName: '',    // 站点名（导航栏标题）
			parentId: 0,    // 分组 id（作为 groupId 传给列表接口）

			// 通用设置项
			showPower: true,  // show_power：单灯是否显示功率/亮度
			showPole: false,  // show_pole：单灯名称是否带灯杆名前缀

			isExpanded: false, // 控制展开/收缩状态，默认不展开
			viewMode: 'card', // 'card' | 'table'
			isAllSelected: false,
			loading: false,   // 列表加载中

			// 分页
			currentPage: 1,
			pageSize: 100,
			pageSizeOptions: [100, 200, 500, 1000, 2000],
			totalCount: 0,   // 左上角总数 / 分页总数
			stateTotal: 0,   // 状态统计接口返回的 total
			queryCount: 0,   // 列表接口返回的 count

			// 排序
			sortKey: '', // 当前排序字段，空字符串表示未排序
			sortOrder: 'default', // 'default' | 'asc' | 'desc'

			// 筛选卡片条件
			filterName: '',          // 名称关键字
			groupOptions: [],        // 分组下拉
			groupIndex: 0,
			selectedGroupId: 0,      // 分组 id（请求参数 group）
			timeId1Options: [],      // 亮灯计时日表下拉（type=6）
			timeId1Index: 0,
			selectedTimeId1: 0,
			timeId2Options: [],      // 准时日表下拉（type=8）
			timeId2Index: 0,
			selectedTimeId2: 0,

			// 状态筛选栏
			activeStatusIndex: -1,   // 当前选中的状态下标，-1 表示全部
			onlineFilter: 0,         // 0全部 1在线 2离线
			runningFilter: 0,        // 0全部 1亮灯 2关灯
			alarmFilter: 0,          // 0全部 1报警 2无报警
			// 顺序与 statusList 一一对应：开灯 / 开灯报警 / 离线 / 关灯 / 关灯报警
			statusFilterMap: [
				{ online: 1, running: 1, alarm: 2 },
				{ online: 1, running: 1, alarm: 1 },
				{ online: 2, running: 0, alarm: 0 },
				{ online: 1, running: 2, alarm: 2 },
				{ online: 1, running: 2, alarm: 1 }
			],
			// 状态统计列表（数量字段对应 QueryLightStateByStationId 的 on/onAlarm/offline/off/offAlarm）
			statusList: [
				{ icon: '/static/operation/lightStatus/turn-on.png', count: 0 },
				{ icon: '/static/operation/lightStatus/turn-on-alarm.png', count: 0 },
				{ icon: '/static/operation/lightStatus/offline.png', count: 0 },
				{ icon: '/static/operation/lightStatus/turn-off.png', count: 0 },
				{ icon: '/static/operation/lightStatus/turn-off-alarm.png', count: 0 }
			],

			// 单灯列表（动态数据）
			listData: [],

			// 总配电设备 id（清除指令队列用）
			mainDeviceId: 0,

			// 指令弹窗
			commandChannels: [],         // 弹窗通道列表（已选单灯启用通道的并集）
			lightPopupVisible: false,
			lightPopupMode: 'switch',    // switch 开灯/关灯；bright 调光；color 调色
			lightPopupTitle: '开灯控制',
			lightPopupAction: 'on',      // switch 模式下的动作：on / off
			modePopupVisible: false,     // 设置控制模式弹窗
			dayPlanPopupVisible: false,  // 设置日表弹窗

			// 指令发送结果（操作列表弹窗）
			commandResults: [],          // [{ id, code, status }]
			resultPopupVisible: false,
			pendingCmdRows: {},          // cmdId -> commandResults 行下标

			// WebSocket
			wsManager: null              // WebSocket 管理器实例
		};
	},
	computed: {
		// 分组下拉显示文案
		groupOptionLabels() {
			return this.groupOptions.map(item => item.name);
		},
		// 计时日表下拉显示文案
		timeId1Labels() {
			return this.timeId1Options.map(item => item.label);
		},
		// 准时日表下拉显示文案
		timeId2Labels() {
			return this.timeId2Options.map(item => item.label);
		},
		// 是否填写了筛选卡片条件（名称/分组/日表）
		hasCardFilter() {
			return !!(this.filterName.trim() || this.selectedGroupId || this.selectedTimeId1 || this.selectedTimeId2);
		}
	},
	onLoad(options) {
		this.stationId = Number(options.stationId);
		if (isNaN(this.stationId)) this.stationId = options.stationId;
		this.boxName = options.boxName ? decodeURIComponent(options.boxName) : '';
		this.parentId = Number(options.parentId) || 0;

		// 标题显示站点名
		if (this.boxName) {
			uni.setNavigationBarTitle({ title: this.boxName });
		}

		// 读取显示设置：show_power 默认开启，show_pole 默认关闭
		const showPower = uni.getStorageSync('show_power');
		this.showPower = showPower === '' ? true : (showPower === true || showPower === 1 || showPower === '1');
		const showPole = uni.getStorageSync('show_pole');
		this.showPole = showPole === '' ? false : (showPole === true || showPole === 1 || showPole === '1');

		// 加载筛选下拉选项
		this.getLightGroupList();
		this.getTimingTimeTableList();
		this.getOnTimeTimeTableList();

		// 加载状态分类数量
		this.getLightCount();

		// 加载列表
		this.getLightList();

		// 总配电（清除指令队列用）
		this.getMainDevice();

		// 建立 WebSocket 连接（指令回执 + 单灯数据/状态实时更新）
		this.connectSocket();
	},
	onPullDownRefresh() {
		// 下拉刷新 = 清除条件后重新加载
		this.resetFilterConditions();
		this.getLightList();
	},
	onUnload() {
		if (this.wsManager) {
			this.wsManager.close();
			this.wsManager = null;
		}
	},
	methods: {
		/*  ==================== 工具方法 ====================  */
		// 解析响应 payload.data
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
		// 解析接口业务错误信息
		decodeErrorMessage(payload) {
			let msg = payload.msg || payload.message || '';
			const data = payload.data;
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
		},
		// 数值格式化：负数一律显示 '-'；电压保留 1 位小数，整数值去掉小数点
		formatMeasure(val, decimals = 0) {
			if (val === null || val === undefined || val === '') return '-';
			const num = Number(val);
			if (isNaN(num)) return '-';
			if (num < 0) return '-';
			if (decimals === 0) return String(Math.round(num));
			return Number.isInteger(num) ? String(num) : num.toFixed(decimals);
		},
		// 毫秒时间戳 → yyyy-MM-dd HH:mm:ss
		formatDateTime(ms) {
			if (!ms) return '-';
			const d = new Date(Number(ms));
			if (isNaN(d.getTime())) return '-';
			const pad = n => (n < 10 ? '0' + n : '' + n);
			return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
				+ ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
		},
		// 当天日期 yyyy-MM-dd
		getTodayStr() {
			const d = new Date();
			const pad = n => (n < 10 ? '0' + n : '' + n);
			return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
		},
		// 原始单灯数据 → 显示对象（7.4 SingleDataUtil 包装规则）
		wrapLightItem(raw) {
			const content = raw.content || {};
			const lastData = raw.lastData || {};

			// 启用通道（en1~en4）
			const channels = [];
			[1, 2, 3, 4].forEach(i => {
				if (content['en' + i]) {
					channels.push(i);
				}
			});
			const channelNames = ['一路', '二路', '三路', '四路'];

			// 多通道字段用 \n 连接（每行一个通道的值）
			const joinMeasure = (key, decimals, suffix) => {
				const lines = channels.map(i => {
					const text = this.formatMeasure(lastData[key + i], decimals);
					return text === '-' ? '-' : text + suffix;
				});
				return lines.length ? lines.join('\n') : '-';
			};
			const joinPlain = (key, decimals) => {
				const lines = channels.map(i => this.formatMeasure(lastData[key + i], decimals));
				return lines.length ? lines.join('\n') : '-';
			};

			// 五态判定
			let status;
			if (!raw.online) status = 'offline';
			else if (raw.running && raw.alarm) status = 'turn-on-alarm';
			else if (raw.running) status = 'turn-on';
			else if (raw.alarm) status = 'turn-off-alarm';
			else status = 'turn-off';

			const name = raw.name || '';
			const poleName = raw.poleName || '';

			return {
				id: raw.id,
				// show_pole 开启时名称显示为「灯杆名 + 单灯名」
				name: this.showPole && poleName ? poleName + name : name,
				rawName: name,
				poleName: poleName,
				status: status,
				voltage: this.formatMeasure(lastData.u, 1),
				ampere: joinPlain('c', 1),
				power: joinMeasure('p', 0, 'W'),       // 带单位，卡片视图使用
				powerValue: joinPlain('p', 0),          // 不带单位，表格视图使用
				brightness: joinMeasure('op', 0, '%'),
				brightnessValue: joinPlain('op', 0),
				lastCommTime: this.formatDateTime(raw.fireTime),
				online: !!raw.online,
				running: !!raw.running,
				alarm: !!raw.alarm,
				type: raw.type != null ? raw.type : content.type,
				pole: raw.pole != null ? raw.pole : raw.poleId,
				connectId: raw.code,
				channelList: channels.map(i => ({ channel: i - 1, name: channelNames[i - 1] })),
				selected: false,
				// WebSocket 局部刷新时用于重新包装该行
				_raw: raw,
				// 排序用的数值缓存
				_voltageNum: Number(lastData.u) || 0,
				_timeNum: Number(raw.fireTime) || 0
			};
		},
		// 更新左上角总数（状态筛选选中时显示该状态数量）
		updateTotalCount() {
			if (this.activeStatusIndex > -1) {
				this.totalCount = this.statusList[this.activeStatusIndex].count;
			} else if (this.hasCardFilter) {
				this.totalCount = this.queryCount;
			} else {
				this.totalCount = this.stateTotal;
			}
		},
		// 清空选中
		clearSelection() {
			this.listData.forEach(item => {
				item.selected = false;
			});
			this.isAllSelected = false;
		},
		// 排序后重新渲染列表
		applySort() {
			const list = this.listData.slice();
			if (!this.sortKey) {
				// 默认恢复按名称排序
				list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
			} else if (this.sortKey === 'voltage') {
				list.sort((a, b) => this.sortOrder === 'asc'
					? a._voltageNum - b._voltageNum
					: b._voltageNum - a._voltageNum);
			} else if (this.sortKey === 'time') {
				list.sort((a, b) => this.sortOrder === 'asc'
					? a._timeNum - b._timeNum
					: b._timeNum - a._timeNum);
			}
			this.listData = list;
			// 排序后清空选中
			this.clearSelection();
		},

		/*  ==================== 交互方法 ====================  */
		// 展开/收缩
		toggleExpand() {
			this.isExpanded = !this.isExpanded;
		},
		// 切换卡片/表格视图（重置排序状态并整体刷新）
		toggleView() {
			this.viewMode = this.viewMode === 'card' ? 'table' : 'card';
			this.sortKey = '';
			this.sortOrder = 'default';
			this.listData = this.listData.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
		},
		// 全选/反选（全选 = 当前列表的全部条目）
		toggleSelectAll() {
			if (!this.listData.length) {
				uni.showToast({ title: '没有单灯数据', icon: 'none' });
				return;
			}
			this.isAllSelected = !this.isAllSelected;
			this.listData.forEach(item => {
				item.selected = this.isAllSelected;
			});
		},
		// 单选/取消单选
		toggleSelect(item) {
			item.selected = !item.selected;
			this.isAllSelected = this.listData.every(data => data.selected);
		},
		// 排序：电压 升序 → 降序 → 默认；时间 降序 → 升序 → 默认
		sortBy(key) {
			if (key !== 'voltage' && key !== 'time') return;
			if (this.sortKey !== key) {
				// 切换到新列：电压从升序开始，时间从降序开始
				this.sortKey = key;
				this.sortOrder = key === 'time' ? 'desc' : 'asc';
			} else if (key === 'voltage') {
				if (this.sortOrder === 'asc') this.sortOrder = 'desc';
				else if (this.sortOrder === 'desc') {
					this.sortOrder = 'default';
					this.sortKey = '';
				} else this.sortOrder = 'asc';
			} else if (key === 'time') {
				if (this.sortOrder === 'desc') this.sortOrder = 'asc';
				else if (this.sortOrder === 'asc') {
					this.sortOrder = 'default';
					this.sortKey = '';
				} else this.sortOrder = 'desc';
			}
			this.applySort();
		},
		// 获取排序图标
		getSortIcon(key) {
			if (this.sortKey !== key || this.sortOrder === 'default') {
				return '/static/operation/detail/sequence-default.png';
			}
			return this.sortOrder === 'asc'
				? '/static/operation/detail/sequence-asc.png'
				: '/static/operation/detail/sequence-desc.png';
		},
		openEditLightNamePopup(item) {
			console.log('打开编辑弹窗:', item.name);
		},
		openLightDetailPopup(item) {
			console.log('打开详情弹窗:', item.name);
		},
		getLampIcon(item) {
			return this.getStatusIcon(item.status);
		},
		getStatusIcon(status) {
			const iconMap = {
				'offline': '/static/operation/lightStatus/offline.png',
				'turn-off': '/static/operation/lightStatus/turn-off.png',
				'turn-off-alarm': '/static/operation/lightStatus/turn-off-alarm.png',
				'turn-on': '/static/operation/lightStatus/turn-on.png',
				'turn-on-alarm': '/static/operation/lightStatus/turn-on-alarm.png'
			};
			return iconMap[status] || '/static/operation/lightStatus/turn-on.png';
		},
		// 状态筛选栏点击：单选、可再次点击取消
		handleStatusClick(index) {
			const statusItem = this.statusList[index];
			if (!statusItem) return;

			// 再次点击当前选中项 → 取消，恢复全部
			if (this.activeStatusIndex === index) {
				this.activeStatusIndex = -1;
				this.onlineFilter = 0;
				this.runningFilter = 0;
				this.alarmFilter = 0;
				this.currentPage = 1;
				this.updateTotalCount();
				this.getLightList();
				return;
			}

			// 选中 → 用对应参数重新请求列表
			const filter = this.statusFilterMap[index];
			this.activeStatusIndex = index;
			this.onlineFilter = filter.online;
			this.runningFilter = filter.running;
			this.alarmFilter = filter.alarm;
			this.currentPage = 1;

			// 该状态数量为 0 → 不发请求，直接清空列表、总数显示 0
			if (statusItem.count === 0) {
				this.listData = [];
				this.queryCount = 0;
				this.clearSelection();
				this.updateTotalCount();
				return;
			}
			this.getLightList();
		},
		// 分组下拉选择
		onGroupChange(e) {
			const index = Number(e.detail.value);
			this.groupIndex = index;
			const item = this.groupOptions[index];
			this.selectedGroupId = item ? item.id : 0;
		},
		// 计时日表下拉选择
		onTimeId1Change(e) {
			const index = Number(e.detail.value);
			this.timeId1Index = index;
			const item = this.timeId1Options[index];
			this.selectedTimeId1 = item ? item.id : 0;
		},
		// 准时日表下拉选择
		onTimeId2Change(e) {
			const index = Number(e.detail.value);
			this.timeId2Index = index;
			const item = this.timeId2Options[index];
			this.selectedTimeId2 = item ? item.id : 0;
		},
		// 按条件查询单灯信息
		queryLightInfo() {
			// 名称、分组、日表至少填一项
			if (!this.filterName.trim() && !this.selectedGroupId && !this.selectedTimeId1 && !this.selectedTimeId2) {
				uni.showToast({ title: '未选择查询条件', icon: 'none' });
				return;
			}
			this.currentPage = 1;
			this.getLightList();
		},
		// 清除条件：重置全部筛选/排序/分页状态并重新加载
		clearFilterConditions() {
			this.resetFilterConditions();
			this.getLightList();
		},
		resetFilterConditions() {
			this.filterName = '';
			this.groupIndex = 0;
			this.selectedGroupId = 0;
			this.timeId1Index = 0;
			this.selectedTimeId1 = 0;
			this.timeId2Index = 0;
			this.selectedTimeId2 = 0;
			this.activeStatusIndex = -1;
			this.onlineFilter = 0;
			this.runningFilter = 0;
			this.alarmFilter = 0;
			this.currentPage = 1;
			this.pageSize = 100;
			this.sortKey = '';
			this.sortOrder = 'default';
			this.queryCount = 0;
		},
		// 翻页（翻页后清空选中并重新加载）
		onPageChange(page) {
			this.currentPage = page;
			this.getLightList();
		},
		// 每页条数变化
		onPageSizeChange(size) {
			this.pageSize = size;
			this.currentPage = 1;
			this.getLightList();
		},

		/*  ==================== 接口方法 ====================  */
		// 获取单灯分组列表（筛选下拉「分组」）
		getLightGroupList() {
			request({
				url: '/station/config/QueryArea',
				method: 'POST',
				data: {
					stationId: this.stationId // 站点ID
				}
			}).then(res => {
				const data = this.parseResponseData(res);
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : []);
				// 首位插入伪选项「全部分组」（id=0），其余记录分组 id
				this.groupOptions = [{ id: 0, name: '全部分组' }].concat(
					list.map(item => ({
						id: item.id != null ? item.id : (item.areaId != null ? item.areaId : 0),
						name: item.name || item.areaName || ''
					})).filter(item => item.name)
				);
			}).catch(err => {
				console.error('获取单灯分组错误', err.message);
			});
		},
		// 获取计时日表列表（亮灯计时日表 timeId1，type=6）
		getTimingTimeTableList() {
			/**
			 * [
			 *   { "id": 313, "name": "TEST-2", "type": 6, "createTime": "2023-03-09 11:31:16" },
			 *   { "id": 460, "name": "联动测试----现场表", "type": 6, "createTime": "2023-06-06 10:21:58" },
			 *   { "id": 701, "name": "全亮", "type": 6, "createTime": "2023-12-18 16:17:30" },
			 *   { "id": 763, "name": "N706测试计时表 白天亮 晚上灭", "type": 6, "createTime": "2024-05-13 14:58:16" },
			 *   { "id": 829, "name": "印_计时日表0", "type": 6, "createTime": "2024-10-15 17:08:40" },
			 *   { "id": 911, "name": "全灭", "type": 6, "createTime": "2025-01-03 14:56:59" },
			 *   { "id": 981, "name": "周洪蛟_8011_计时时间表", "type": 6, "createTime": "2025-03-31 18:33:58" },
			 *   { "id": 1071, "name": "色温计时_周洪蛟", "type": 6, "createTime": "2025-06-27 18:34:48" },
			 *   { "id": 1072, "name": "115B_周洪蛟", "type": 6, "createTime": "2025-06-27 18:39:38" },
			 *   { "id": 1387, "name": "循环调光", "type": 6, "createTime": "2026-06-03 10:23:58" },
			 *   { "id": 1388, "name": "2", "type": 6, "createTime": "2026-06-03 15:42:38" }
			 * ]
			 */
			request({
				url: '/station/plan/QueryLight6List',
				method: 'POST',
				data: {}
			}).then(res => {
				const data = this.parseResponseData(res);
				const list = Array.isArray(data) ? data : [];
				// 列表首位插入伪选项「全部计时日表」（id=0）
				this.timeId1Options = [{ id: 0, label: '全部计时日表' }].concat(
					list.map(item => ({ id: item.id, label: (item.name || '')}))
				);
			}).catch(err => {
				console.error('获取计时日表列表错误', err.message);
			});
		},
		// 获取准时日表列表（准时日表 timeId2，type=8）
		getOnTimeTimeTableList() {
			/**
			 * [
			 *   { "id": 827, "name": "测试11", "type": 8, "createTime": "2024-10-14 09:35:53" },
			 *   { "id": 969, "name": "888", "type": 8, "createTime": "2025-03-18 14:49:06" },
			 *   { "id": 976, "name": "App-115B-A", "type": 8, "createTime": "2025-03-25 17:05:15" },
			 *   { "id": 980, "name": "周洪蛟_8011时间表", "type": 8, "createTime": "2025-03-31 18:30:15" },
			 *   { "id": 1000, "name": "李测试-全灭", "type": 8, "createTime": "2025-04-17 09:58:15" },
			 *   { "id": 1056, "name": "李测试-全亮", "type": 8, "createTime": "2025-06-19 15:53:54" },
			 *   { "id": 1063, "name": "115B_周洪蛟", "type": 8, "createTime": "2025-06-20 18:42:56" },
			 *   { "id": 1070, "name": "色温准时_周洪蛟", "type": 8, "createTime": "2025-06-27 18:34:04" },
			 *   { "id": 1326, "name": "ly1025", "type": 8, "createTime": "2026-04-02 17:51:01" }
			 * ]
			 */
			request({
				url: '/station/plan/QueryLight8List',
				method: 'POST',
				data: {}
			}).then(res => {
				const data = this.parseResponseData(res);
				const list = Array.isArray(data) ? data : [];
				// 列表首位插入伪选项「全部准时日表」（id=0）
				this.timeId2Options = [{ id: 0, label: '全部准时日表' }].concat(
					list.map(item => ({ id: item.id, label: (item.name || '')}))
				);
			}).catch(err => {
				console.error('获取准时日表列表错误', err.message);
			});
		},
		// 获取单灯总数和各种状态单灯数量
		getLightCount() {
			/**
			 * {"total":226,"on":0,"off":0,"onAlarm":0,"offAlarm":0,"offline":226}
			 */
			request({
				url: '/station/config/QueryLightStateByStationId',
				method: 'POST',
				data: {
					stationId: this.stationId // 站点ID
				}
			}).then(res => {
				const data = this.parseResponseData(res);
				if (!data || typeof data !== 'object') return;
				this.stateTotal = data.total || 0;
				this.statusList[0].count = data.on || 0;
				this.statusList[1].count = data.onAlarm || 0;
				this.statusList[2].count = data.offline || 0;
				this.statusList[3].count = data.off || 0;
				this.statusList[4].count = data.offAlarm || 0;
				this.updateTotalCount();
			}).catch(err => {
				console.error('获取单灯总数和各种状态单灯数量错误', err.message);
			});
		},
		// 获取单灯列表（7.3 主请求）
		getLightList() {
			/**
			 * {
			 *   "count": 668,
			 *   "list": [
			 *     {
			 *       "id": 449718,
			 *       "name": "001",
			 *       "stationId": 2944,
			 *       "stationName": "单灯展示2",
			 *       "poleId": 430738,
			 *       "poleName": "L01",
			 *       "connectType": 0,
			 *       "content": { "oid": 0, "type": 101, "timeId": 0, "area": 5, "pole": 430738, "enu": true, "en1": true, "nm1": "主灯", ... },
			 *       "lastData": { "time": 1766383433000, "tv": 2, "tc": 27, "op1": 100, "p1": 0, "q1": 0.3, "u": 0.93, "c1": 0, ... },
			 *       "deviceType": 176,
			 *       "code": "B0103D52",
			 *       "online": false,
			 *       "alarm": true,
			 *       "running": false,
			 *       "fireTime": 1766383433000,
			 *       "hardware": "5019_V010",
			 *       "software": "115B_V110",
			 *       "fireTimeName": "2025-12-22 14:03:53"
			 *     }
			 *   ]
			 * }
			 */
			this.loading = true;
			this.clearSelection();
			uni.showLoading({ title: '加载中...', mask: true });

			return request({
				url: '/station/config/QueryLightByFilter',
				method: 'POST',
				data: {
					stationId: this.stationId,       // 站点Id
					group: this.selectedGroupId,     // 单灯分组筛选，默认0
					code: "",                        // 设备Id，这里固定为空
					name: this.filterName.trim(),    // 设备名称关键字
					timeId1: this.selectedTimeId1,   // 亮灯计时日表 id
					timeId2: this.selectedTimeId2,   // 准时日表 id
					online: this.onlineFilter,       // 0全部 1在线 2离线
					alarm: this.alarmFilter,         // 0全部 1报警 2无报警
					running: this.runningFilter,     // 0全部 1亮灯 2关灯
					index: this.currentPage,         // 页码
					size: this.pageSize,             // 每页数量
					startTime: "0001-01-01",         // 格式：YYYY-MM-DD，开始日期（固定）
					endTime: this.getTodayStr(),     // 格式：YYYY-MM-DD，结束日期为今天
					groupId: this.parentId           // 所在分组id（入口参数 parentId）
				}
			}).then(res => {
				const payload = res && res.data;
				if (!payload) {
					this.listData = [];
					this.queryCount = 0;
					this.updateTotalCount();
					return;
				}

				// 业务失败（如空结果后端返回「未查到相关数据」）→ 清空列表
				if (payload.code !== undefined && payload.code !== null && payload.code !== 0) {
					const msg = this.decodeErrorMessage(payload);
					this.listData = [];
					this.queryCount = 0;
					if (msg.indexOf('未查到相关数据') === -1) {
						uni.showToast({ title: msg || '查询失败', icon: 'none' });
					}
					this.updateTotalCount();
					return;
				}

				const data = this.parseResponseData(res);
				const list = data && Array.isArray(data.list) ? data.list : [];
				this.queryCount = data && typeof data.count === 'number' ? data.count : list.length;
				this.listData = list.map(item => this.wrapLightItem(item));
				this.updateTotalCount();
			}).catch(err => {
				console.error('获取单灯列表错误', err.message);
				uni.showToast({ title: '获取单灯列表失败', icon: 'none' });
			}).finally(() => {
				this.loading = false;
				uni.hideLoading();
				uni.stopPullDownRefresh();
			});
		},
		/*  ==================== 底部指令操作（7.11） ====================  */
		// 已选中的单灯集合
		getSelectedLights() {
			return this.listData.filter(item => item.selected);
		},
		// 已选单灯启用通道的并集（一路~四路，去重升序）
		getSelectedChannels() {
			const map = {};
			this.getSelectedLights().forEach(light => {
				(light.channelList || []).forEach(ch => {
					map[ch.channel] = ch.name;
				});
			});
			const channels = Object.keys(map)
				.map(key => ({ channel: Number(key), name: map[key] }))
				.sort((a, b) => a.channel - b.channel);
			// 兜底：通道信息缺失时按四路处理，避免弹窗无通道可选
			if (!channels.length) {
				return ['一路', '二路', '三路', '四路'].map((name, index) => ({ channel: index, name: name }));
			}
			return channels;
		},
		// 统一前置校验：离线筛选拦截 → 必须选中单灯（无网络提示暂不处理）
		preCheckCommand(needSelection = true) {
			if (this.onlineFilter === 2) {
				uni.showToast({ title: '设备离线状态,无法发送指令.', icon: 'none' });
				return false;
			}
			if (needSelection && !this.getSelectedLights().length) {
				uni.showToast({ title: '请选择要操作的单灯设备', icon: 'none' });
				return false;
			}
			return true;
		},
		// 底部操作按钮统一入口
		handleAction(type) {
			switch (type) {
				case '召测':
					if (!this.preCheckCommand()) return;
					this.confirmAndSend(type, '确定召测选中设备？', 'forceRead', {});
					break;
				case '查询时钟':
					if (!this.preCheckCommand()) return;
					this.confirmAndSend(type, '确定查询时钟？', 'getclock', {});
					break;
				case '校准时钟':
					if (!this.preCheckCommand()) return;
					this.confirmAndSend(type, '确定校准时钟？', 'setclock', {});
					break;
				case '开灯':
					if (!this.preCheckCommand()) return;
					this.openLightPopup('switch', '开灯控制', 'on');
					break;
				case '关灯':
					if (!this.preCheckCommand()) return;
					this.openLightPopup('switch', '关灯控制', 'off');
					break;
				case '调光':
					if (!this.preCheckCommand()) return;
					this.openLightPopup('bright', '调光控制', '');
					break;
				case '调色':
					if (!this.preCheckCommand()) return;
					this.openLightPopup('color', '调色控制', '');
					break;
				case '设置日表':
					if (!this.preCheckCommand()) return;
					this.dayPlanPopupVisible = true;
					break;
				case '控制模式':
					if (!this.preCheckCommand()) return;
					this.modePopupVisible = true;
					break;
				case '清除指令':
					// 清除指令队列针对总配电，不需要选中单灯
					this.clearCommandQueue();
					break;
			}
		},
		// 确认框 → 发送指令
		confirmAndSend(title, content, code, args) {
			uni.showModal({
				title: title,
				content: content,
				success: (res) => {
					if (res.confirm) this.sendLampCommand(code, args);
				}
			});
		},
		// 打开开灯/关灯/调光/调色弹窗
		openLightPopup(mode, title, action) {
			this.lightPopupMode = mode;
			this.lightPopupTitle = title;
			this.lightPopupAction = action;
			this.commandChannels = this.getSelectedChannels();
			this.lightPopupVisible = true;
		},
		// 开灯/关灯/调光/调色弹窗确认 → 组装 handSingle 参数
		onLightPopupConfirm(payload) {
			this.lightPopupVisible = false;
			// 弹窗回传 mode/action，避免依赖父组件保存的弹窗状态
			const mode = payload.mode || this.lightPopupMode;
			const brightMap = {};
			const colorMap = {};
			if (mode === 'switch') {
				// 勾选通道：开灯 100 / 关灯 0；未勾选通道不参与本次操作
				const action = payload.action || this.lightPopupAction;
				(payload.channels || []).forEach(channel => {
					brightMap[channel] = action === 'on' ? 100 : 0;
				});
			} else {
				Object.assign(brightMap, payload.brights || {});
				if (mode === 'color') Object.assign(colorMap, payload.colors || {});
			}
			this.sendLampCommand('handSingle', this.buildHandSingleArgs(brightMap, colorMap, payload.expireMinutes));
		},
		// handSingle 参数：参与操作的通道写入数值，其余通道传 -1（保持该通道原状态）
		buildHandSingleArgs(brightMap, colorMap, expireMinutes) {
			const args = {
				// expire：本次操作的保持时长（分钟），到点后恢复日表自动运行
				//（7.11：handSingle 的 expire 为「时长」，与 handControl 的「保持到何时」不同）
				expire: Math.max(0, Math.round(Number(expireMinutes) || 0))
			};
			for (let i = 1; i <= 4; i++) {
				args['bright' + i] = brightMap[i - 1] !== undefined ? brightMap[i - 1] : -1;
			}
			for (let i = 1; i <= 4; i++) {
				args['color' + i] = colorMap[i - 1] !== undefined ? colorMap[i - 1] : -1;
			}
			return args;
		},
		// 设置控制模式弹窗确认 → setPlanType
		onModePopupConfirm(payload) {
			this.modePopupVisible = false;
			this.sendLampCommand('setPlanType', { ch: payload.ch, type: 0 });
		},
		// 设置日表弹窗确认：计时日表 → setDayPlan1，准时日表 → setDayPlan2（可同时下发）
		onDayPlanPopupConfirm(payload) {
			this.dayPlanPopupVisible = false;
			const codes = [];
			if (payload.timing) codes.push('setDayPlan1');
			if (payload.onTime) codes.push('setDayPlan2');
			if (codes.length) this.sendLampCommand(codes, {});
		},
		// 发送单灯指令（SendLampOld）：成功后弹出「操作列表」并等待 WebSocket 回执
		sendLampCommand(code, args) {
			const codes = Array.isArray(code) ? code : [code];
			const lights = this.getSelectedLights();
			if (!lights.length) return;
			const ids = lights.map(light => light.id);
			this.pendingCmdRows = {};
			uni.showLoading({ title: '发送中...', mask: true });

			const tasks = codes.map(item => request({
				url: '/station/command/SendLampOld',
				method: 'POST',
				data: {
					code: item,          // 命令码
					list: ids,           // 单灯设备 id 列表
					checkUserId: 0,      // 固定为 0
					args: args || {}     // 指令参数
				}
			}).then(res => ({ code: item, res: res }))
				.catch(err => {
					console.error('发送单灯指令失败', err.message);
					return { code: item, res: null };
				}));

			Promise.all(tasks).then(results => {
				uni.hideLoading();
				const rows = this.buildCommandRows(lights, results);
				if (!rows.length) {
					uni.showToast({ title: '指令发送失败', icon: 'none' });
					return;
				}
				this.commandResults = rows;
				this.resultPopupVisible = true;
			});
		},
		// 发送结果 → 操作列表行（同一单灯多条指令时合并为一行）
		buildCommandRows(lights, results) {
			const rowMap = {};
			const rows = lights.map(light => {
				const row = {
					id: light.id,
					code: light.name || light.connectId || '-',
					status: '正在执行...',
					cmdIds: [],
					settled: 0,
					total: 0,
					failed: ''
				};
				rowMap[light.id] = row;
				return row;
			});

			results.forEach(result => {
				const payload = result.res ? result.res.data : null;
				// 请求级失败（网络异常 / 业务错误码）→ 该次指令全部标记失败
				if (!payload || (payload.code !== undefined && payload.code !== null && payload.code !== 0)) {
					const reason = payload ? (this.decodeErrorMessage(payload) || '指令发送失败') : '指令发送失败';
					rows.forEach(row => {
						if (!row.failed) row.failed = reason;
					});
					return;
				}
				const data = this.parseResponseData(result.res);
				const list = data && Array.isArray(data.list) ? data.list : [];
				lights.forEach((light, index) => {
					const row = rowMap[light.id];
					const item = this.pickCommandItem(list, light.id, index);
					const success = item ? (item.success !== undefined ? item.success : item.isSuccess) : false;
					if (!success) {
						if (!row.failed) row.failed = (item && item.message) || '指令发送失败';
						return;
					}
					// message 即 cmdId，用于匹配后续 WebSocket 回执
					if (item.message) row.cmdIds.push(item.message);
				});
			});

			rows.forEach((row, index) => {
				if (row.failed) {
					row.status = row.failed;
					row.cmdIds = [];
					return;
				}
				if (!row.cmdIds.length) {
					row.status = '指令发送失败';
					return;
				}
				row.total = row.cmdIds.length;
				// 登记 cmdId → 行下标，等待 WebSocket 回执更新状态
				row.cmdIds.forEach(cmdId => {
					this.pendingCmdRows[cmdId] = index;
				});
			});

			// 行内保留 cmdId / 计数等字段，供 WebSocket 回执累计更新
			return rows;
		},
		// 从发送结果中取当前单灯对应的条目：优先按 id 匹配，其次按顺序匹配
		pickCommandItem(list, lightId, index) {
			if (!Array.isArray(list) || !list.length) return null;
			const matched = list.filter(item => item && String(item.id) === String(lightId));
			if (matched.length) return matched[0];
			return list.length > index ? list[index] : null;
		},
		// 解析 getclock 回执 content 中的设备当前时间
		extractNowTime(content) {
			if (!content) return '';
			if (typeof content === 'string') {
				try {
					content = JSON.parse(content);
				} catch (e) {
					return '';
				}
			}
			return (content && content.nowTime) || '';
		},

		/*  ==================== 清除指令队列 ====================  */
		// 获取总配电设备 id
		getMainDevice() {
			request({
				url: '/station/config/QueryMain',
				method: 'POST',
				data: {
					groupId: 0,
					stationId: this.stationId
				}
			}).then(res => {
				const payload = res && res.data;
				if (!payload || (payload.code !== undefined && payload.code !== null && payload.code !== 0)) return;
				const data = this.parseResponseData(res);
				const mains = Array.isArray(data) ? data : (data && Array.isArray(data.mains) ? data.mains : []);
				const main = mains[0] || {};
				this.mainDeviceId = Number(main.deviceId) || 0;
			}).catch(err => {
				console.error('获取总配电错误', err.message);
			});
		},
		// 清除当前所有指令（QueenClear）
		clearCommandQueue() {
			if (!this.mainDeviceId) {
				uni.showToast({ title: '请先配置总配电', icon: 'none' });
				return;
			}
			uni.showModal({
				title: '清除指令',
				content: '确定清除当前所有指令？',
				success: (res) => {
					if (!res.confirm) return;
					uni.showLoading({ title: '清除中...', mask: true });
					request({
						url: '/station/command/QueenClear',
						method: 'POST',
						data: { ids: [this.mainDeviceId] }
					}).then(res2 => {
						uni.hideLoading();
						const payload = res2 && res2.data;
						if (payload && payload.code !== undefined && payload.code !== null && payload.code !== 0) {
							uni.showToast({ title: this.decodeErrorMessage(payload) || '清除失败', icon: 'none' });
							return;
						}
						uni.showToast({ title: '清除成功', icon: 'none' });
					}).catch(err => {
						uni.hideLoading();
						console.error('清除指令失败', err.message);
						uni.showToast({ title: '清除失败', icon: 'none' });
					});
				}
			});
		},

		/*  ==================== WebSocket 指令回执与实时更新 ====================  */
		// 建立 WebSocket 连接
		connectSocket() {
			if (this.wsManager) return;
			this.wsManager = new WebSocketManager({
				onOpen: () => {},
				onMessage: (data) => this.handleSocketMessage(data),
				onError: (err) => console.error('websocket错误', err),
				onClose: () => {}
			});
			this.wsManager.connect();
		},
		// 消息分发：cmd 指令回执 / data 遥测推送 / state 状态推送
		handleSocketMessage(data) {
			let msg = data;
			if (typeof msg === 'string') {
				try {
					msg = JSON.parse(msg);
				} catch (e) {
					return;
				}
			}
			if (!msg || !msg.type) return;
			if (msg.type === 'cmd') {
				this.handleCommandResult(msg);
			} else if (msg.type === 'data') {
				this.handleLightDataPush(msg);
			} else if (msg.type === 'state') {
				this.handleLightStatePush(msg);
			}
		},
		// 本页列表中查找单灯下标
		findLightIndex(id) {
			if (id === undefined || id === null) return -1;
			return this.listData.findIndex(item => String(item.id) === String(id));
		},
		// 指令回执：按 cmdId 更新「操作列表」对应条目
		handleCommandResult(msg) {
			const rowIndex = this.pendingCmdRows[msg.commandId];
			if (rowIndex === undefined || rowIndex === null) return;
			const status = Number(msg.status);
			// 2 已发送 / 4 执行中 / 5 已重发：保持「正在执行...」
			if (status !== 7 && status !== 8 && status !== 9) return;
			const row = this.commandResults[rowIndex];
			if (!row) return;
			delete this.pendingCmdRows[msg.commandId];

			let text;
			if (status === 9) {
				text = '执行成功';
				// 查询时钟成功回执：显示设备当前时间
				if (msg.cmdCode === 'getclock') {
					const nowTime = this.extractNowTime(msg.content);
					if (nowTime) text = '设备当前时间：' + nowTime;
				}
			} else if (status === 7) {
				text = '指令超时';
			} else {
				text = '执行失败';
			}

			const settled = row.settled || 0;
			const total = row.total || 1;
			if (status !== 9) {
				// 失败 / 超时：直接覆盖该行状态
				this.$set(this.commandResults, rowIndex, Object.assign({}, row, { status: text, settled: settled + 1 }));
				return;
			}
			// 成功：同一单灯多条指令全部成功后才显示「执行成功」
			if (settled + 1 >= total) {
				this.$set(this.commandResults, rowIndex, Object.assign({}, row, { status: text, settled: settled + 1 }));
			} else {
				this.$set(this.commandResults, rowIndex, Object.assign({}, row, { settled: settled + 1 }));
			}
		},
		// 遥测推送：命中本页单灯 → 用新的 lastData 重新包装该行并局部刷新
		handleLightDataPush(msg) {
			const id = (msg.paramId !== undefined && msg.paramId !== null) ? msg.paramId : msg.id;
			const index = this.findLightIndex(id);
			if (index < 0) return;
			const row = this.listData[index];
			if (!row._raw) return;
			let lastData = msg.lastData !== undefined ? msg.lastData : msg.data;
			if (typeof lastData === 'string') {
				try {
					lastData = JSON.parse(lastData);
				} catch (e) {
					return;
				}
			}
			if (!lastData || typeof lastData !== 'object') return;
			const merged = Object.assign({}, row._raw, {
				lastData: Object.assign({}, row._raw.lastData, lastData)
			});
			if (lastData.time) merged.fireTime = lastData.time;
			const wrapped = this.wrapLightItem(merged);
			wrapped.selected = row.selected;
			this.$set(this.listData, index, wrapped);
		},
		// 状态推送：isIsParam 为真且 isIsPole 为假时更新该行在线/亮灯/报警，并重新统计状态数量
		handleLightStatePush(msg) {
			const isParam = msg.isIsParam === true || msg.isIsParam === 'true';
			const isPole = msg.isIsPole === true || msg.isIsPole === 'true';
			if (!isParam || isPole) return;
			const id = (msg.id !== undefined && msg.id !== null) ? msg.id : msg.paramId;
			const index = this.findLightIndex(id);
			if (index < 0) return;
			const row = this.listData[index];
			if (!row._raw) return;
			const source = (msg.data && typeof msg.data === 'object') ? msg.data : msg;
			const merged = Object.assign({}, row._raw);
			if (source.online !== undefined && source.online !== null) merged.online = source.online;
			if (source.running !== undefined && source.running !== null) merged.running = source.running;
			if (source.alarm !== undefined && source.alarm !== null) merged.alarm = source.alarm;
			const wrapped = this.wrapLightItem(merged);
			wrapped.selected = row.selected;
			this.$set(this.listData, index, wrapped);
			// 状态分类数量重新统计
			this.getLightCount();
		}
	}
};
</script>

<style lang="scss" scoped>
/* 页面整体容器：不再使用 flex 撑满，改为普通流式布局 */
.station-detail-container {
	position: relative;
	min-height: 100vh;
	background-color: #f5f6fa;
	box-sizing: border-box;
}

/* 主内容区：留出底部固定区的高度，通过内联样式动态调整 */
.main-content {
	padding: 20rpx;
	/* padding-bottom 由模板中的 :style 动态控制 */
}

/* 底部固定区域：使用 fixed 固定在视口底部，类似 tabbar */
.fixed-bottom {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1;
	background-color: #f5f6fa;
	padding: 10rpx 20rpx 20rpx;
	box-sizing: border-box;
	/* 可添加阴影或上边框，使其更明显 */
	// box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 筛选区域 */
.filter-section {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.filter-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.filter-item {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
	gap: 12rpx;

	&.time-table-item {
		flex-direction: row;
		align-items: center;
	}
}

.label {
	font-size: 28rpx;
	color: #333;
	white-space: nowrap;
}

.input-box {
	background-color: #f2f4f8;
	border-radius: 8rpx;
	padding: 12rpx 20rpx;
	font-size: 26rpx;
	flex: 1;
}

.picker-box {
	background-color: #f2f4f8;
	border-radius: 8rpx;
	padding: 12rpx 20rpx;
	flex: 1;
	min-width: 0;

	.picker-text {
		font-size: 24rpx;
		color: #999;
		display: flex;
		align-items: center;
		justify-content: space-between;
		white-space: nowrap;
		overflow: hidden;
	}
}

.dual-picker {
	display: flex;
	gap: 16rpx;
	flex: 1;
	min-width: 0;

	.half {
		flex: 1;
		min-width: 0;
	}
}

.query-row {
	justify-content: center;
	align-items: center;
}

.query-btn {
	background-color: #3a7bf7;
	color: #fff;
	font-size: 28rpx;
	border-radius: 8rpx;
	height: 72rpx;
	line-height: 72rpx;
	flex: 1;
	padding: 0;
	margin: 0;
	text-align: center;
	border: none;
	box-sizing: border-box;

	&.clear-btn {
		background-color: #fff;
		color: #3a7bf7;
		border: 2rpx solid #3a7bf7;
		line-height: 68rpx;
	}

	&::after {
		border: none;
	}
}

/* --- 状态统计与视图切换行 --- */
.status-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	gap: 16rpx;
	height: 64rpx; /* 保证在同一水平线上，统一高度 */
}

/* 统一右侧、左侧和中间单个气泡的尺寸视觉 */
.total-badge,
.status-badge,
.view-toggle {
	height: 60rpx;
	background-color: #fff;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	padding: 0 16rpx;
}

.total-badge {
	flex-shrink: 0;
	gap: 6rpx;

	/* 缩小复选框尺寸以适配统一高度 */
	checkbox {
		transform: scale(0.7);
		margin-right: -6rpx;
	}
}

.status-scroll {
	flex: 1;
	min-width: 0;
	height: 60rpx;
	white-space: nowrap; /* 保证内部元素横向排列不换行 */
	overflow: hidden;

	/* 隐藏横向滚动条 */
	::-webkit-scrollbar {
		display: none;
		width: 0 !important;
		height: 0 !important;
		-webkit-appearance: none;
		background: transparent;
	}
}

.status-badge {
	display: inline-flex;
	vertical-align: middle;
	margin-right: 16rpx;
	gap: 8rpx;

	&:last-child {
		margin-right: 0;
	}

	/* 选中的状态气泡高亮 */
	&.status-badge-active {
		background-color: #eef3ff;

		.badge-text {
			color: #3a7bf7;
		}
	}
}

.status-icon {
	width: 32rpx;
	height: 32rpx;
}

.badge-text {
	font-size: 24rpx;
	color: #333;
	line-height: 1;
}

.view-toggle {
	flex-shrink: 0;
	padding: 0 8rpx;
	gap: 0;
}

.toggle-btn {
	width: 52rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 卡片视图 */
.card-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
	margin-bottom: 20rpx;
}

.card {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border: 4rpx solid transparent;
	transition: all 0.2s;
	position: relative;
}

.card-selected {
	border-color: #3a7bf7;
}

.card-name {
	font-size: 26rpx;
	color: #333;
	font-weight: bold;
	margin-bottom: 16rpx;
}

.card-icon {
	width: 80rpx;
	height: 80rpx;
	margin-bottom: 16rpx;
}

.card-footer {
	width: 100%;
	display: flex;
	justify-content: space-between;
	font-size: 24rpx;
	color: #666;
}

.card-power,
.card-brightness {
	white-space: pre-line; /* 多通道数据每行显示一个通道的值 */
}

.card-placeholder {
	font-size: 24rpx;
	color: #c0c4cc;
}

/* 表格视图 */
.table-view {
	background-color: #fff;
	border-radius: 16rpx;
	overflow: hidden;
	margin-bottom: 20rpx;
}

.table-header {
	display: flex;
	align-items: center;
	background-color: #f8f9fc;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;
	font-size: 24rpx;
	color: #333;
	font-weight: bold;
}

.table-row {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;
	font-size: 24rpx;
	color: #666;
	transition: background-color 0.2s;
}

.row-selected {
	background-color: #f0f5ff;
}

.col {
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
}

.col-check {
	width: 80rpx;
	flex-shrink: 0;
}

.col-name {
	flex: 1.5;
	justify-content: flex-start;
	padding-left: 10rpx;
}

.col-status {
	width: 80rpx;
}

.col-voltage {
	flex: 1;
}

.col-power {
	width: 80rpx;
	white-space: pre-line; /* 多通道数据每行显示一个通道的值 */
}

.col-brightness {
	width: 80rpx;
	white-space: pre-line;
}

.col-time {
	flex: 1.8;
	justify-content: flex-end;
	padding-right: 20rpx;
	font-size: 22rpx;
}

.sort-icon {
	width: 22rpx;
	height: 22rpx;
	margin-left: 4rpx;
	flex-shrink: 0;
}

.table-status-icon {
	width: 32rpx;
	height: 32rpx;
}

/* 空数据提示 */
.empty-tip {
	padding: 60rpx 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-text {
	font-size: 26rpx;
	color: #999;
}

/* 底部操作按钮 */
.action-buttons {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-top: 16rpx;
}

.btn-row {
	display: flex;
	justify-content: space-between;
	gap: 12rpx;
}

.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #fff;
	color: #3a7bf7;
	font-size: 24rpx;
	border-radius: 8rpx;
	padding: 12rpx 0;
	line-height: 1;
	margin: 0;
	border: none;

	&.text-only {
		background-color: #fff;
	}
}

.action-btn::after {
	border: none;
}

.btn-icon {
	width: 32rpx;
	height: 32rpx;
	margin-right: 8rpx;
}
</style>
