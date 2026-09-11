<!-- 配电箱、箱变、隧道站点详情界面 -->
<template>
	<view :class="[themeClass, { 'white-bg': !hasDevices }]" class="station-detail-container">
		<!-- 加载中 -->
		<view v-if="loading" class="loading-state">
			<text>加载中...</text>
		</view>

		<!-- 站点没有设备时的内容 -->
		<view v-else-if="!hasDevices" class="empty-state">
			<image class="empty-img" mode="widthFix" src="/static/operation/detail/empty.webp" />
			<text class="empty-text">当前站点没有设备，请先添加设备</text>
			<view class="empty-btns">
				<button class="empty-btn primary" @click="onComingSoon">扫码添加设备</button>
				<button class="empty-btn primary" @click="onComingSoon">手动添加设备</button>
			</view>
		</view>

		<!-- 站点有设备时的内容 -->
		<view v-else class="content-area">
			<!-- 最近召测时间：总配电 fireTime 不为 0 时显示 -->
			<view v-if="lastTestTime" class="last-test-time">
				<text class="time-text">最近召测时间：{{ lastTestTime }}</text>
			</view>

			<!-- 总配电 -->
			<block v-if="mains.length">
				<!-- 名称 -->
				<view class="section-title">{{ main.name }}</view>
				<view class="main-power-card">
					<!-- 三相表头 -->
					<view class="power-row power-header">
						<view class="row-label"></view>
						<view class="col">A相</view>
						<view class="col">B相</view>
						<view class="col">C相</view>
					</view>
					<!-- 电压 -->
					<view class="power-row">
						<view class="row-label">电压</view>
						<view v-for="ph in phases" :key="'u'+ph" class="col">
							<view :class="voltageClass(ph)" class="data-box">{{ mainVoltage(ph) }}</view>
						</view>
					</view>

					<!-- enp=true 完整总配电行 -->
					<block v-if="mainIsFull">
						<view class="power-row">
							<view class="row-label">电流</view>
							<view v-for="ph in phases" :key="'i'+ph" class="col">
								<view class="data-box">{{ mainField(ph, 'i') }}</view>
							</view>
						</view>
						<view class="power-row">
							<view class="row-label">额定电流</view>
							<view v-for="ph in phases" :key="'r'+ph" class="col">
								<view class="data-box">{{ mainField(ph, 'r') }}</view>
							</view>
						</view>
						<view class="power-row">
							<view class="row-label">有功功率</view>
							<view v-for="ph in phases" :key="'p'+ph" class="col">
								<view class="data-box">{{ mainField(ph, 'p') }}</view>
							</view>
						</view>
<!--						<view class="power-row">-->
<!--							<view class="row-label">无功功率</view>-->
<!--							<view class="col" v-for="ph in phases" :key="'q'+ph">-->
<!--								<view class="data-box">{{ reactivePower(ph) }}</view>-->
<!--							</view>-->
<!--						</view>-->
<!--						<view class="power-row">-->
<!--							<view class="row-label">功率因数</view>-->
<!--							<view class="col" v-for="ph in phases" :key="'f'+ph">-->
<!--								<view class="data-box">{{ mainField(ph, 'f') }}</view>-->
<!--							</view>-->
<!--						</view>-->

<!--						<view class="power-row">-->
<!--							<view class="row-label">额定容量</view>-->
<!--							<view class="col" v-for="ph in phases" :key="'cap'+ph">-->
<!--								<view class="data-box">{{ mainField(ph, 'cap') }}</view>-->
<!--							</view>-->
<!--						</view>-->
					</block>

					<!-- 分割线 -->
					<view class="divider-line"></view>

					<!--下半部分双列 -->
					<block v-if="mainIsFull">
						<view class="power-row">
							<view class="row-label">电能表</view>
							<view class="col"><view class="data-box">{{ fmt(mainLastData.e) }}</view></view>
							<view class="row-label">当日能耗</view>
							<view class="col"><view class="data-box">{{ fmt(energyToday) }}</view></view>
						</view>
						<view class="power-row">
							<view class="row-label">漏电电流</view>
							<view class="col"><view class="data-box">{{ fmt(mainLastData.cl) }}</view></view>
							<view class="row-label">电池电压</view>
							<view class="col"><view class="data-box">{{ fmt(mainLastData.battery) }}</view></view>
						</view>
						<view class="power-row">
							<view class="row-label">峰值负载</view>
							<view class="col"><view class="data-box">{{ fmt(mainExtraData.hpv) }}</view></view>
							<view class="row-label">内外控</view>
							<view class="col"><view class="data-box">{{ fmt(ctrlText) }}</view></view>
						</view>
					</block>
					<!-- enp=false 电压行（无电表）：三相电压 + 内外控 -->
					<block v-else>
						<view class="power-row">
							<view class="row-label">内外控</view>
							<view class="col"><view class="data-box">{{ fmt(ctrlText) }}</view></view>
							<view class="row-label"></view>
							<view class="col"></view>
						</view>
					</block>
				</view>
			</block>

			<!-- 漏电监测 -->
			<block v-if="leakages.length">
				<view class="section-title">漏电监测</view>
				<view class="leakage-card">
					<view v-for="(item, index) in leakages" :key="'leak'+item.id" class="leakage-block">
						<view class="leakage-title">{{ item.name }}</view>

						<!-- 漏电参数行 -->
						<view class="leakage-row">
							<view class="leak-cell">
								<view class="leak-label">漏电值</view>
								<view class="data-box">{{ fmt(item.lastData ? item.lastData.cl : 0) }}</view>
							</view>
							<view class="leak-cell">
								<view class="leak-label">轻微漏电</view>
								<view class="data-box">{{ fmt(item.content ? item.content.ll : 0) }}</view>
							</view>
							<view class="leak-cell">
								<view class="leak-label">严重漏电</view>
								<view class="data-box">{{ fmt(item.content ? item.content.lh : 0) }}</view>
							</view>
							<view class="leak-cell">
								<view class="leak-label">跳闸阈值</view>
								<view class="data-box">{{ fmt(item.content ? item.content.lx : 0) }}</view>
							</view>
						</view>

						<!-- 报警级别行 -->
						<view class="leakage-row alarm-row">
							<view class="leak-cell">
								<view class="leak-label">报警级别</view>
								<view :class="leakLevelClass(item)" class="data-box">{{ leakLevel(item) }}</view>
							</view>
						</view>

						<!-- 分隔线 -->
						<view v-if="index !== leakages.length - 1" class="divider-line"></view>
					</view>
				</view>
			</block>

			<!-- 转换开关 -->
			<block v-if="switchs.length">
				<view class="section-title">转换开关（{{ switchs.length }}）</view>
				<scroll-view class="horizontal-scroll" scroll-x="true">
					<view class="scroll-wrapper">
						<view v-for="item in switchs" :key="'switch'+item.id" class="switch-card">
							<image :src="switchImg(item)" mode="aspectFit"></image>
							<text class="switch-name">{{ item.name }}</text>
							<text class="switch-status">{{ switchText(item) }}</text>
						</view>
					</view>
				</scroll-view>
			</block>

			<!-- 柜门 -->
			<block v-if="doors.length">
				<view class="section-title">柜门（{{ doors.length }}）</view>
				<scroll-view class="horizontal-scroll" scroll-x="true">
					<view class="scroll-wrapper">
						<view v-for="item in doors" :key="'door'+item.id" class="device-card">
							<image :src="doorState(item).img" mode="aspectFit"></image>
							<text class="device-name">{{ item.name }}</text>
							<text v-if="doorState(item).show" :class="doorState(item).alarm ? 'red' : 'green'" class="status-text">{{ doorState(item).text }}</text>
						</view>
					</view>
				</scroll-view>
			</block>

			<!-- 门锁 -->
			<block v-if="locks.length">
				<view class="section-title">门锁（{{ locks.length }}）</view>
				<scroll-view class="horizontal-scroll" scroll-x="true">
					<view class="scroll-wrapper">
						<view v-for="item in locks" :key="'lock'+item.id" class="device-card">
							<image :src="lockState(item).img" mode="aspectFit"></image>
							<text class="device-name">{{ item.name }}</text>
							<text :class="lockState(item).alarm ? 'red' : 'green'" class="status-text">{{ lockState(item).text }}</text>
						</view>
					</view>
				</scroll-view>
			</block>

			<!-- 烟雾监测 -->
			<block v-if="smokes.length">
				<view class="section-title">烟雾监测（{{ smokes.length }}）</view>
				<scroll-view class="horizontal-scroll" scroll-x="true">
					<view class="scroll-wrapper">
						<view v-for="item in smokes" :key="'smoke'+item.id" class="device-card">
							<image :src="smokeState(item).img" mode="aspectFit"></image>
							<text class="device-name">{{ item.name }}</text>
							<text :class="smokeState(item).alarm ? 'red' : 'green'" class="status-text">{{ smokeState(item).text }}</text>
						</view>
					</view>
				</scroll-view>
			</block>

			<!-- 水浸监测 -->
			<block v-if="waters.length">
				<view class="section-title">水浸监测（{{ waters.length }}）</view>
				<scroll-view class="horizontal-scroll" scroll-x="true">
					<view class="scroll-wrapper">
						<view v-for="item in waters" :key="'water'+item.id" class="device-card">
							<image :src="waterState(item).img" mode="aspectFit"></image>
							<text class="device-name">{{ item.name }}</text>
							<text :class="waterState(item).alarm ? 'red' : 'green'" class="status-text">{{ waterState(item).text }}</text>
						</view>
					</view>
				</scroll-view>
			</block>

			<!--控制输出 -->
			<block v-if="outputs.length">
				<view class="section-title">控制输出</view>
				<view class="all-channel-check">
					<view class="check-left">
						<checkbox-group @change="onAllChannelChange">
							<label class="check-label">
								<checkbox :checked="allChannelChecked" color="#007aff" style="transform: scale(0.7);" value="all" />
								<text>向所有通道发送开关灯指令</text>
							</label>
						</checkbox-group>
					</view>
					<!-- 开关灯按钮：始终显示，无 dco 权限时点击提示无权限 -->
					<view class="check-right">
						<button :disabled="!allChannelChecked" class="mini-btn" @click="onControlAllLight('off')">关灯</button>
						<button :disabled="!allChannelChecked" class="mini-btn primary" @click="onControlAllLight('on')">开灯</button>
					</view>
				</view>
				<scroll-view class="horizontal-scroll" scroll-x="true">
					<view class="scroll-wrapper">
						<view v-for="item in outputs"
						      :key="item.id"
						      :class="{ 'active': item.id === selectedOutputId }"
						      class="channel-card"
						      @click="selectOutput(item)">
							<view class="channel-header">
								<text class="channel-name">{{ outputName(item) }}</text>
								<text :class="isOutputOn(item) ? 'on' : 'off'" class="channel-status">{{ isOutputOn(item) ? '开' : '关' }}</text>
							</view>
							<!-- 时间表摘要 -->
							<view class="channel-times">
								<text v-for="(t, ti) in parseTimeContent(item.timeContent).times" :key="'t'+ti">{{ t }}</text>
								<text v-if="!parseTimeContent(item.timeContent).times.length">-</text>
							</view>
							<view class="channel-perm">
								<text v-for="(p, pi) in parseTimeContent(item.timeContent).perms" :key="'p'+pi">{{ p }}</text>
								<text v-if="!parseTimeContent(item.timeContent).perms.length">-</text>
							</view>
							<!--  开关灯按钮：始终显示，无 dco 权限时点击提示无权限，仅选中行可点击 -->
							<view class="channel-btns">
								<button :disabled="item.id !== selectedOutputId"
										class="mini-btn"
										@click.stop="onOutputLight(item, 'off')"
								>
									关灯
								</button>
								<button :disabled="item.id !== selectedOutputId"
										class="mini-btn primary"
										@click.stop="onOutputLight(item, 'on')"
								>
									开灯
								</button>
							</view>
						</view>
					</view>
				</scroll-view>
			</block>

			<!-- 接触器 -->
			<block v-if="visibleContacts.length">
				<view class="section-title">接触器（{{ visibleContacts.length }}）</view>
				<scroll-view class="horizontal-scroll" scroll-x="true">
					<view class="scroll-wrapper">
						<view v-for="item in visibleContacts"
						      :key="item.id"
						      :class="{ 'active': item.id === selectedContactId }"
						      class="device-card"
						      @click="selectContact(item)">
							<image :src="contactState(item).img" mode="aspectFit"></image>
							<text class="device-name">{{ item.name }}</text>
							<text :class="contactState(item).on ? 'green' : 'red'" class="status-text">{{ contactState(item).text }}</text>
						</view>
					</view>
				</scroll-view>
			</block>

			<!-- 支路配电 -->
			<block v-if="visibleBranchs.length">
				<view class="section-title">支路配电</view>
				<view class="branch-list">
					<view v-for="item in visibleBranchs" :key="'branch'+item.id" class="branch-card">
						<view class="branch-header">
							<view :class="branchIsTt(item) ? 'blue' : 'gray'" class="tag">{{ branchIsTt(item) ? '总' : '分' }}</view>
							<text class="branch-name">{{ item.name }}</text>
						</view>
						<view class="data-grid">
							<text>亮灯情况</text><text class="data-box">{{ branchTvText(item) }}</text>
							<text>A相</text><text class="data-box">{{ branchCurrent(item, 'a') }}</text>
							<text>B相</text><text class="data-box">{{ branchCurrent(item, 'b') }}</text>
							<text>C相</text><text class="data-box">{{ branchCurrent(item, 'c') }}</text>
							<text>漏电状态</text><text class="data-box">{{ branchLeakStatus(item) }}</text>
							<text>漏电电流</text><text class="data-box">{{ branchLeak(item) }}</text>
							<text>电缆防盗</text><text class="data-box">-</text>
						</view>
					</view>
				</view>
			</block>
		</view>

		<!-- 开关灯时间选择 -->
		<uni-datetime-picker
			ref="lightPicker"
			:start="minLightDate"
			return-type="string"
			type="datetime"
			@change="onLightDateTimeChange"
		>
			<view class="light-picker-trigger"></view>
		</uni-datetime-picker>

		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="bar-item" @click="sendOutputCommand('召测')">
				<image mode="aspectFit" src="/static/operation/detail/remote-testing.png" />
				<text>召测</text>
			</view>
			<view class="bar-item" @click="sendOutputCommand('查询时钟')">
				<image mode="aspectFit" src="/static/operation/detail/check-clock.png" />
				<text>查询时钟</text>
			</view>
			<view class="bar-item" @click="sendOutputCommand('校准时钟')">
				<image mode="aspectFit" src="/static/operation/detail/fix-clock.png" />
				<text>校准时钟</text>
			</view>
			<view class="bar-item" @click="openMapSelectionPopup">
				<image mode="aspectFit" src="/static/operation/detail/navigation.png" />
				<text>线路导航</text>
			</view>
		</view>

		<!-- 线路导航弹窗 -->
		<!-- #ifndef MP -->
		<MapSelectionPopup ref="mapSelectionPopup" @select="onMapSelected"/>
		<!-- #endif -->
	</view>
</template>

<script>
import {request} from "@/utils/request";
import
{
	base64Decode,
	hasOperation,
	wgs84ToGcj02,
	gcj02ToWgs84,
	gcj02ToBd09,
	bd09ToGcj02
} from "@/utils/common";
import WebSocketManager from '@/utils/webSocket.js';
import MapSelectionPopup from "@/components/mapSelectionPopup.vue";

// 三相字段映射
const PHASES = {
	a: { u: 'ua', i: 'ca', p: 'pa', f: 'fa', r: 'car', cap: 'par', ur: 'uar', ul: 'ual', uh: 'uah' },
	b: { u: 'ub', i: 'cb', p: 'pb', f: 'fb', r: 'cbr', cap: 'pbr', ur: 'ubr', ul: 'ubl', uh: 'ubh' },
	c: { u: 'uc', i: 'cc', p: 'pc', f: 'fc', r: 'ccr', cap: 'pcr', ur: 'ucr', ul: 'ucl', uh: 'uch' }
};

//  转换开关状态
const SWITCH_STATE = {
	0: { img: '/static/operation/detail/switch/stop.png', text: '停止' },
	1: { img: '/static/operation/detail/switch/manual.png', text: '手动' },
	2: { img: '/static/operation/detail/switch/remote-control.png', text: '遥控' },
	3: { img: '/static/operation/detail/switch/time-control.png', text: '时控' }
};

// 状态图标
const IMG = {
	doorClose: '/static/operation/detail/door/door-close.png',
	doorOpen: '/static/operation/detail/door/door-open.png',
	lockNormal: '/static/operation/detail/lock/lock-off.png',
	lockOpen: '/static/operation/detail/lock/lock-on.png',
	smokeNormal: '/static/operation/detail/smoke/smoke-off.png',
	smokeAlarm: '/static/operation/detail/smoke/smoke-on.png',
	waterNormal: '/static/operation/detail/water/water-off.png',
	waterAlarm: '/static/operation/detail/water/water-on.png',
	contactorOn: '/static/operation/detail/contactor/contactor-on.png',
	contactorOff: '/static/operation/detail/contactor/contactor-off.png'
};

export default {
	components: {MapSelectionPopup},
	data() {
		return {
			loading: true,          // 加载状态
			hasDevices: true,       // 是否有设备（无设备显示空态）
			stationId: null,        // 入口参数：站点 id
			boxName: '',            // 入口参数：站点名
			energyToday: null,      // 当日能耗（EnergyTotal 接口 today）
			lastTestTime: '',       // 最近召测时间（总配电 fireTime）
			// 站点经纬度：stationLocation 为 GCJ-02（高德/腾讯/小程序内置地图用），stationLocationBd09 为接口原始 BD-09（百度地图用）
			stationLocation: {lat: 0, lng: 0},
			stationLocationBd09: {lat: 0, lng: 0},

			mains: [],              // 总配电
			leakages: [],           // 漏电（branchs 中 !enp && enl）
			switchs: [],            // 转换开关（按 id 升序）
			doors: [],              // 柜门
			locks: [],              // 门锁
			smokes: [],             // 烟雾
			waters: [],             // 水浸
			outputs: [],            // 控制输出
			contacts: [],           // 接触器（全部，渲染时按选中输出过滤）
			branchs: [],            // 支路（全部，渲染时按选中接触器过滤）

			selectedOutputId: null,   // 选中的输出通道 id
			selectedContactId: null,  // 选中的接触器 id
			allChannelChecked: false, // 「向所有通道发送开关灯指令」勾选状态

			wsManager: null,          // WebSocket 管理器实例
			pendingCmdIds: {},        // 待回执的指令 id 集合（commandId -> true）
			lightSending: false,      // 开关灯指令发送中
			lightPopupAction: '',     // 当前开关灯动作：'on' / 'off'
			lightPopupIds: [],        // 当前开关灯要操作的通道 id 列表
			minLightDate: '',         // 日期时间可选择的最小值（当前时间）

			phases: ['a', 'b', 'c']
		};
	},
	computed: {
		main() { return this.mains[0] || {}; },
		mainContent() { return this.main.content || {}; },
		mainLastData() { return this.main.lastData || {}; },
		mainExtraData() { return this.main.extraData || {}; },
		//  enp 为 true 则总配电显示完整内容，否则只显示 ABC 相电压和内外控
		mainIsFull() { return !!this.mainContent.enp; },
		//  当前输出通道下的接触器
		visibleContacts() {
			if (this.selectedOutputId === null || this.selectedOutputId === undefined) return [];
			return this.contacts.filter(c => c.content && c.content.oid === this.selectedOutputId);
		},
		//  当前接触器下的支路（isTt 降序）
		visibleBranchs() {
			if (this.selectedContactId === null || this.selectedContactId === undefined) return [];
			return this.branchs
				.filter(b => b.content && b.content.cid === this.selectedContactId)
				.sort((a, b) => (this.branchIsTt(b) ? 1 : 0) - (this.branchIsTt(a) ? 1 : 0));
		}
	},
	onLoad(options) {
		this.stationId = Number(options.stationId);
		if (isNaN(this.stationId)) this.stationId = options.stationId;
		this.boxName = options.boxName ? decodeURIComponent(options.boxName) : '';
		//  标题显示站点名
		if (this.boxName) {
			uni.setNavigationBarTitle({ title: this.boxName });
		}
		//  开关灯按钮无 dco 设备操作权限时在点击处 toast「你没有权限」
		this.connectSocket();
		this.loadAllData();
	},
	//  设备分区列表支持下拉刷新
	onPullDownRefresh() {
		this.loadAllData();
	},
	onUnload() {
		if (this.wsManager) {
			this.wsManager.close();
			this.wsManager = null;
		}
	},
	methods: {
		// 数据加载顺序：当日能耗 → 配电箱设备详情（能耗失败则跳过，继续加载详情）
		loadAllData() {
			this.loading = true;
			this.getMainDBEnergyToday()
				.catch(err => console.error('获取当日能耗失败', err.message))
				.then(() => this.getStationOtherData())
				.then(() => this.finishLoad())
				.catch(() => this.finishLoad());
		},
		finishLoad() {
			this.loading = false;
			uni.stopPullDownRefresh();
		},
		// 解析响应 payload.data（可能是 Base64 字符串）
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
		//  当日能耗
		getMainDBEnergyToday() {
			/**
			 * {"year":54.88,"month":0.51,"week":0.5,"yestoday":0.5,"today":0.0}
			 */
			return request({
				url: '/station/analyse/EnergyTotal',
				method: 'POST',
				data: {
					groupId: 0,          // 站点所在分组Id，0表示根分组
					stationId: this.stationId // 站点Id
				}
			}).then(res => {
				const data = this.parseResponseData(res);
				this.energyToday = data && typeof data === 'object' ? data.today : null;
				return this.energyToday;
			});
		},
		//  配电箱完整设备详情
		getStationOtherData() {
			/**
			 * {
			 *   "lat": 22.72815237100679,
			 *   "lng": 113.82992351034443,
			 *   "mainId": 392965,
			 *   "energyDevType": "3dms8051b",
			 *   "deviceIds": [
			 *     305162
			 *   ],
			 *   "mains": [
			 *     {
			 *       "id": 392965,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 1,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "总配电",
			 *       "asset": null,
			 *       "content": {
			 *         "ec": "",
			 *         "exta": 0,
			 *         "extb": 0,
			 *         "extc": 0,
			 *         "cat1": 1,
			 *         "cbt1": 1,
			 *         "cct1": 1,
			 *         "abc": false,
			 *         "abr": true,
			 *         "count": 0,
			 *         "power": 100,
			 *         "ctrlc": 0,
			 *         "ctrlv": 1,
			 *         "showe": true,
			 *         "utid": 607,
			 *         "uar": "220",
			 *         "uah": 120,
			 *         "ual": 80,
			 *         "ubr": 220,
			 *         "ubh": 120,
			 *         "ubl": 80,
			 *         "ucr": 220,
			 *         "uch": 120,
			 *         "ucl": 80,
			 *         "uae": true,
			 *         "ube": true,
			 *         "uce": true,
			 *         "enp": true,
			 *         "ptid": 891,
			 *         "par": "300",
			 *         "pbr": "300",
			 *         "pcr": "300",
			 *         "pah": "100",
			 *         "pbh": "100",
			 *         "pch": "100",
			 *         "paf": 0.8,
			 *         "pbf": 0.8,
			 *         "pcf": 0.8,
			 *         "cac": 1,
			 *         "cat": 3000,
			 *         "car": 1,
			 *         "cal": 80,
			 *         "cah": 120,
			 *         "cbc": 2,
			 *         "cbt": 3000,
			 *         "cbr": 1,
			 *         "cbl": 80,
			 *         "cbh": 120,
			 *         "ccc": 3,
			 *         "cct": 3000,
			 *         "ccr": 1,
			 *         "ccl": 80,
			 *         "cch": 120,
			 *         "enl": false,
			 *         "ltid": 0,
			 *         "lc": 0,
			 *         "lt": 1,
			 *         "ll": 100,
			 *         "chl": 0,
			 *         "cmdl": false,
			 *         "openl": false,
			 *         "expirel": 100,
			 *         "lh": 1000,
			 *         "chh": 0,
			 *         "cmdh": false,
			 *         "openh": false,
			 *         "expireh": 100,
			 *         "lx": 2000,
			 *         "chx": 0,
			 *         "cmdx": false,
			 *         "openx": false,
			 *         "expirex": 100,
			 *         "ens": false,
			 *         "sc": 0,
			 *         "sh": 30,
			 *         "chs": 0,
			 *         "cmds": false,
			 *         "opens": false,
			 *         "expires": 100,
			 *         "version": 11
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "e": 0,
			 *         "t": 40.3,
			 *         "temp": 0,
			 *         "hum": 0,
			 *         "lux": -1,
			 *         "ua": 226.1,
			 *         "ub": 225.9,
			 *         "uc": 226.2,
			 *         "ca": 0,
			 *         "cb": 0,
			 *         "cc": 0,
			 *         "pa": 0,
			 *         "fa": 0,
			 *         "ha": -1,
			 *         "pb": 0,
			 *         "fb": 0,
			 *         "hb": -1,
			 *         "pc": 0,
			 *         "fc": 0,
			 *         "hc": -1,
			 *         "cl": -2,
			 *         "cs": -2,
			 *         "ctrl": -2,
			 *         "utv": 1,
			 *         "ptv": 0,
			 *         "ltv": 2,
			 *         "battery": 0,
			 *         "version": 11
			 *       },
			 *       "extraData": {
			 *         "hpv": 528.41,
			 *         "hpt": "2026-04-27 20:16:16"
			 *       },
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2025-06-19 10:56:22",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": true,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": true,
			 *       "alarm": true,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "总配电"
			 *     }
			 *   ],
			 *   "energys": [],
			 *   "switchs": [
			 *     {
			 *       "id": 361312,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 2,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "全夜转换",
			 *       "asset": null,
			 *       "content": {
			 *         "mid": 392965,
			 *         "hc": 1,
			 *         "rc": 2,
			 *         "tc": "0",
			 *         "version": 2
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "hv": 1,
			 *         "rv": 0,
			 *         "tv": -2,
			 *         "v": 1,
			 *         "version": 2
			 *       },
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2024-12-26 10:58:30",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": false,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": false,
			 *       "alarm": true,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "转换开关"
			 *     },
			 *     {
			 *       "id": 361313,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 2,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "半夜转换",
			 *       "asset": null,
			 *       "content": {
			 *         "mid": 392965,
			 *         "hc": 3,
			 *         "rc": 4,
			 *         "tc": "0",
			 *         "version": 2
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "hv": 0,
			 *         "rv": 1,
			 *         "tv": -2,
			 *         "v": 2,
			 *         "version": 2
			 *       },
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2024-12-26 10:58:47",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": false,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": false,
			 *       "alarm": false,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "转换开关"
			 *     }
			 *   ],
			 *   "outputs": [
			 *     {
			 *       "id": 392966,
			 *       "name": "K1",
			 *       "content": {
			 *         "mid": 392965,
			 *         "timeId": 891,
			 *         "oc": 1,
			 *         "version": 3
			 *       },
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "ov": 0,
			 *         "es": true,
			 *         "sv": 2,
			 *         "tv": 0,
			 *         "version": 3
			 *       },
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "alarm": false,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "groupId": 0,
			 *       "keepTime": 1428,
			 *       "online": true,
			 *       "running": false,
			 *       "stationId": 75,
			 *       "type": 3,
			 *       "typeName": "控制输出",
			 *       "timeContent": "公司演示箱时间表 [ 18:00开灯, 06:00关灯; 上午: 允许; 下午: 允许 ]"
			 *     },
			 *     {
			 *       "id": 392967,
			 *       "name": "K2",
			 *       "content": {
			 *         "mid": 392965,
			 *         "timeId": 891,
			 *         "oc": 2,
			 *         "version": 3
			 *       },
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "ov": 0,
			 *         "es": true,
			 *         "sv": 2,
			 *         "tv": 0,
			 *         "version": 3
			 *       },
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "alarm": false,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "groupId": 0,
			 *       "keepTime": 1428,
			 *       "online": true,
			 *       "running": false,
			 *       "stationId": 75,
			 *       "type": 3,
			 *       "typeName": "控制输出",
			 *       "timeContent": "公司演示箱时间表 [ 18:00开灯, 06:00关灯; 上午: 允许; 下午: 允许 ]"
			 *     }
			 *   ],
			 *   "contacts": [
			 *     {
			 *       "id": 392963,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 4,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "接触器1",
			 *       "asset": null,
			 *       "content": {
			 *         "oid": 392966,
			 *         "sc": 5,
			 *         "version": 5
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "sv": 0,
			 *         "ov": 0,
			 *         "version": 5
			 *       },
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2025-06-19 10:55:10",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": false,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": false,
			 *       "alarm": false,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "接触器"
			 *     },
			 *     {
			 *       "id": 392964,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 4,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "接触器2",
			 *       "asset": null,
			 *       "content": {
			 *         "oid": 392967,
			 *         "sc": 6,
			 *         "version": 5
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "sv": 0,
			 *         "ov": 0,
			 *         "version": 5
			 *       },
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2025-06-19 10:55:22",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": false,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": false,
			 *       "alarm": false,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "接触器"
			 *     }
			 *   ],
			 *   "branchs": [
			 *     {
			 *       "id": 392968,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 5,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "1",
			 *       "asset": null,
			 *       "content": {
			 *         "exta": 0,
			 *         "extb": 0,
			 *         "extc": 0,
			 *         "tt": false,
			 *         "mid": 392965,
			 *         "cid": 392963,
			 *         "abc": false,
			 *         "abr": true,
			 *         "count": 0,
			 *         "power": 100,
			 *         "enp": true,
			 *         "par": "220",
			 *         "pbr": 220,
			 *         "pcr": 220,
			 *         "pah": 80,
			 *         "pbh": 80,
			 *         "pch": 80,
			 *         "paf": 0.8,
			 *         "pbf": 0.8,
			 *         "pcf": 0.8,
			 *         "cac": 1,
			 *         "cat": 3000,
			 *         "car": 1,
			 *         "cal": 80,
			 *         "cah": 120,
			 *         "cbc": 2,
			 *         "cbt": 3000,
			 *         "cbr": 1,
			 *         "cbl": 80,
			 *         "cbh": 120,
			 *         "ccc": 3,
			 *         "cct": 3000,
			 *         "ccr": 1,
			 *         "ccl": 80,
			 *         "cch": 120,
			 *         "enl": false,
			 *         "ltid": 0,
			 *         "lc": 0,
			 *         "lt": 1,
			 *         "ll": 100,
			 *         "chl": 0,
			 *         "cmdl": false,
			 *         "openl": false,
			 *         "expirel": 100,
			 *         "lh": 1000,
			 *         "chh": 0,
			 *         "cmdh": false,
			 *         "openh": false,
			 *         "expireh": 100,
			 *         "lx": 2000,
			 *         "chx": 0,
			 *         "cmdx": false,
			 *         "openx": false,
			 *         "expirex": 100,
			 *         "ens": false,
			 *         "sc": 0,
			 *         "sh": 30,
			 *         "chs": 0,
			 *         "cmds": false,
			 *         "opens": false,
			 *         "expires": 100,
			 *         "cat1": 1,
			 *         "cbt1": 1,
			 *         "cct1": 1,
			 *         "lt1": 1,
			 *         "version": 8
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "ua": 226.1,
			 *         "ub": 225.9,
			 *         "uc": 226.2,
			 *         "ca": 0,
			 *         "cb": 0,
			 *         "cc": 0,
			 *         "pa": 0,
			 *         "fa": 0,
			 *         "ha": -1,
			 *         "pb": 0,
			 *         "fb": 0,
			 *         "hb": -1,
			 *         "pc": 0,
			 *         "fc": 0,
			 *         "hc": -1,
			 *         "cl": -2,
			 *         "cs": -1,
			 *         "tv": 0,
			 *         "ltv": 2,
			 *         "version": 8
			 *       },
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2025-06-19 11:01:15",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": true,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": true,
			 *       "alarm": true,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "支路配电"
			 *     },
			 *     {
			 *       "id": 392969,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 5,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "2",
			 *       "asset": null,
			 *       "content": {
			 *         "exta": 0,
			 *         "extb": 0,
			 *         "extc": 0,
			 *         "tt": false,
			 *         "mid": 392965,
			 *         "cid": 392964,
			 *         "abc": true,
			 *         "abr": true,
			 *         "count": 0,
			 *         "power": 100,
			 *         "enp": true,
			 *         "par": 220,
			 *         "pbr": 220,
			 *         "pcr": 220,
			 *         "pah": 80,
			 *         "pbh": 80,
			 *         "pch": 80,
			 *         "paf": 0.8,
			 *         "pbf": 0.8,
			 *         "pcf": 0.8,
			 *         "cac": 1,
			 *         "cat": 3000,
			 *         "car": 1,
			 *         "cal": 80,
			 *         "cah": 120,
			 *         "cbc": 2,
			 *         "cbt": 3000,
			 *         "cbr": 1,
			 *         "cbl": 80,
			 *         "cbh": 120,
			 *         "ccc": 3,
			 *         "cct": 3000,
			 *         "ccr": 1,
			 *         "ccl": 80,
			 *         "cch": 120,
			 *         "enl": false,
			 *         "ltid": 0,
			 *         "lc": 0,
			 *         "lt": 1,
			 *         "ll": 100,
			 *         "chl": 0,
			 *         "cmdl": false,
			 *         "openl": false,
			 *         "expirel": 100,
			 *         "lh": 1000,
			 *         "chh": 0,
			 *         "cmdh": false,
			 *         "openh": false,
			 *         "expireh": 100,
			 *         "lx": 2000,
			 *         "chx": 0,
			 *         "cmdx": false,
			 *         "openx": false,
			 *         "expirex": 100,
			 *         "ens": false,
			 *         "sc": 0,
			 *         "sh": 30,
			 *         "chs": 0,
			 *         "cmds": false,
			 *         "opens": false,
			 *         "expires": 100,
			 *         "version": 2
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "ua": 226.1,
			 *         "ub": 225.9,
			 *         "uc": 226.2,
			 *         "ca": 0,
			 *         "cb": 0,
			 *         "cc": 0,
			 *         "pa": 0,
			 *         "fa": 0,
			 *         "ha": -1,
			 *         "pb": 0,
			 *         "fb": 0,
			 *         "hb": -1,
			 *         "pc": 0,
			 *         "fc": 0,
			 *         "hc": -1,
			 *         "cl": -2,
			 *         "cs": -1,
			 *         "tv": 0,
			 *         "ltv": 2,
			 *         "version": 2
			 *       },
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2025-06-19 11:01:29",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": true,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": true,
			 *       "alarm": true,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "支路配电"
			 *     }
			 *   ],
			 *   "doors": [
			 *     {
			 *       "id": 375845,
			 *       "guidCode": "00000000000000000000000000000000",
			 *       "customerId": 4,
			 *       "appType": "road",
			 *       "stationId": 75,
			 *       "groupId": 0,
			 *       "connectType": 0,
			 *       "deviceId": 305162,
			 *       "allowSameDevice": false,
			 *       "code": "",
			 *       "type": 6,
			 *       "lat": 0,
			 *       "lng": 0,
			 *       "buildDate": "0001-01-01 00:00:00",
			 *       "name": "门开",
			 *       "asset": null,
			 *       "content": {
			 *         "mid": 392965,
			 *         "sc": 9,
			 *         "av": 0,
			 *         "version": 1
			 *       },
			 *       "usedId": 0,
			 *       "lastData": {
			 *         "time": 1788856230000,
			 *         "sv": 1,
			 *         "av": 0,
			 *         "version": 1
			 *       },
			 *       "extraData": {},
			 *       "fireTime": 1788856230000,
			 *       "currentStartCompareTime": "0001-01-01 00:00:00",
			 *       "powerStartCompareTime": "0001-01-01 00:00:00",
			 *       "energyCalcFlag": 0,
			 *       "lastEnergyTime": "0001-01-01 00:00:00",
			 *       "lastEnergyValue": 0,
			 *       "lastLightOnTime": 0,
			 *       "newEnergyTime": "0001-01-01 00:00:00",
			 *       "newEnergyValue": 0,
			 *       "newLightOnTime": 0,
			 *       "extraStartTime": "0001-01-01 00:00:00",
			 *       "extraStartValue": 0,
			 *       "extraEndTime": "0001-01-01 00:00:00",
			 *       "extraEndValue": 0,
			 *       "planModeUpdateTime": "0001-01-01 00:00:00",
			 *       "planContentUpdateTime": "0001-01-01 00:00:00",
			 *       "firstForceReadTime": "0001-01-01 00:00:00",
			 *       "createTime": "2025-03-17 15:35:30",
			 *       "updateTime": "2026-04-28 14:49:50",
			 *       "sort": 0,
			 *       "isDeleted": false,
			 *       "tickTime": "0001-01-01 00:00:00",
			 *       "keepTime": 1428,
			 *       "stateCheckTime": "0001-01-01 00:00:00",
			 *       "online": false,
			 *       "hasOnline": false,
			 *       "running": false,
			 *       "hasRunning": false,
			 *       "alarm": true,
			 *       "count": 0,
			 *       "lastDataChanged": false,
			 *       "typeName": "柜门"
			 *     }
			 *   ],
			 *   "locks": [],
			 *   "smokes": [],
			 *   "waters": []
			 * }
			 */
			return request({
				url: '/station/config/QueryPowerBox',
				method: 'POST',
				data: {
					groupId: 0,          // 站点所在分组Id，0表示根分组
					stationId: this.stationId // 站点Id
				}
			}).then(res => {
				const data = this.parseResponseData(res);
				if (!data || typeof data !== 'object') {
					this.hasDevices = false;
					return;
				}
				const listOf = key => (Array.isArray(data[key]) ? data[key] : []);
				this.mains = listOf('mains');
				//  转换开关按 id 升序
				this.switchs = listOf('switchs').slice().sort((a, b) => (a.id || 0) - (b.id || 0));
				this.outputs = listOf('outputs');
				this.contacts = listOf('contacts');
				this.branchs = listOf('branchs');
				this.doors = listOf('doors');
				this.locks = listOf('locks');
				this.smokes = listOf('smokes');
				this.waters = listOf('waters');
				// 漏电数据源：branchs 中 !content.enp && content.enl
				this.leakages = this.branchs.filter(b => b.content && !b.content.enp && b.content.enl);
				// 站点坐标：总配电 mains 中 lat/lng（BD-09 百度坐标），
				// 保留原始值（百度地图直接用），同时转 GCJ-02（高德/腾讯/小程序内置地图用）
				const validCoord = (lat, lng) => Number.isFinite(Number(lat))
					&& Number.isFinite(Number(lng))
					&& !(Number(lat) === 0 && Number(lng) === 0);
				const mainItem = this.mains[0] || {};
				let posLat;
				let posLng;
				if (validCoord(mainItem.lat, mainItem.lng)) {
					posLat = Number(mainItem.lat);
					posLng = Number(mainItem.lng);
				} else if (validCoord(data.lat, data.lng)) {
					// 兜底：mains 无有效坐标时回退到顶层 lat/lng
					posLat = Number(data.lat);
					posLng = Number(data.lng);
				}
				if (posLat !== undefined && posLng !== undefined) {
					this.stationLocationBd09 = {lat: posLat, lng: posLng};
					const gcj = bd09ToGcj02(posLng, posLat);
					this.stationLocation = {lat: gcj.lat, lng: gcj.lng};
				}
				// 最近召测时间：总配电 fireTime 不为 0 时显示
				const main = this.mains[0];
				this.lastTestTime = main && main.fireTime ? this.formatTime(main.fireTime) : '';
				// 无任何设备 → 空态
				const arrays = [this.mains, this.switchs, this.outputs, this.contacts,
					this.branchs, this.doors, this.locks, this.smokes, this.waters];
				const hasIds = Array.isArray(data.deviceIds) && data.deviceIds.length > 0;
				this.hasDevices = arrays.some(arr => arr.length > 0) || hasIds;
				// 初始联动
				this.initLinkage();
			}).catch(err => {
				console.error('获取站点设备数据失败', err.message);
				this.hasDevices = false;
			});
		},
		// 初始状态：接触器=第一个输出通道下的接触器并默认选中第一个；支路=该接触器下支路
		initLinkage() {
			this.selectedOutputId = null;
			this.selectedContactId = null;
			if (!this.outputs.length) return;
			this.selectedOutputId = this.outputs[0].id;
			const cts = this.contacts.filter(c => c.content && c.content.oid === this.selectedOutputId);
			this.selectedContactId = cts.length ? cts[0].id : null;
		},
		//  点击输出通道：切换接触器列表并默认选中第一个
		selectOutput(item) {
			this.selectedOutputId = item.id;
			const cts = this.contacts.filter(c => c.content && c.content.oid === item.id);
			this.selectedContactId = cts.length ? cts[0].id : null;
		},
		//  点击接触器：联动刷新支路列表
		selectContact(item) {
			this.selectedContactId = item.id;
		},
		//  控制所有通道勾选
		onAllChannelChange(e) {
			const v = e.detail && e.detail.value;
			if (typeof v === 'boolean') {
				this.allChannelChecked = v;
			} else {
				this.allChannelChecked = Array.isArray(v) && v.length > 0;
			}
		},

		// ==================== 总配电 ====================
		// 通用数值格式化：小于0/空值/非法值显示 '-'
		fmt(v, digits) {
			if (v === undefined || v === null || v === '') return '-';
			const n = Number(v);
			if (isNaN(n)) return '-';
			if (digits !== undefined) return n.toFixed(digits);
			if (v < 0) return '-'
			return String(n);
		},
		// 三相电压（保留 1 位小数）
		mainVoltage(phase) {
			const v = this.mainLastData[PHASES[phase].u];
			return this.fmt(v, 1);
		},
		// 三相电压颜色判定：下限=uar×ual÷100，上限=uar×uah÷100，越界报警色
		voltageClass(phase) {
			const ph = PHASES[phase];
			const u = this.mainLastData[ph.u];
			if (u === undefined || u === null || u === '') return '';
			const r = Number(this.mainContent[ph.ur]);
			const l = Number(this.mainContent[ph.ul]);
			const h = Number(this.mainContent[ph.uh]);
			if (r > 0 && l > 0 && h > 0) {
				const low = r * l / 100;
				const high = r * h / 100;
				return Number(u) >= low && Number(u) <= high ? '' : 'alarm';
			}
			return '';
		},
		// 三相电流/有功功率/功率因数（lastData）；额定电流/额定容量（content）
		mainField(phase, kind) {
			const ph = PHASES[phase];
			const keyMap = { i: ph.i, p: ph.p, f: ph.f, r: ph.r, cap: ph.cap };
			const key = keyMap[kind];
			const src = (kind === 'r' || kind === 'cap') ? this.mainContent : this.mainLastData;
			return this.fmt(src[key]);
		},
		// 无功功率 = ua×ca − pa（B/C 同理）
		reactivePower(phase) {
			const ph = PHASES[phase];
			const ld = this.mainLastData;
			const u = ld[ph.u], c = ld[ph.i], p = ld[ph.p];
			if (u === undefined || u === null || c === undefined || c === null || p === undefined || p === null) return '-';
			const v = Number(u) * Number(c) - Number(p);
			return isNaN(v) ? '-' : v.toFixed(1);
		},
		// 内外控：ctrlc>0 且 ctrl>=0 时 ctrl==ctrlv→内控，否则外控；其余→默认
		ctrlText() {
			const c = this.mainContent;
			const ld = this.mainLastData;
			if (Number(c.ctrlc) > 0 && ld.ctrl !== undefined && ld.ctrl !== null && Number(ld.ctrl) >= 0) {
				return Number(ld.ctrl) === Number(c.ctrlv) ? '内控' : '外控';
			}
			return '默认';
		},

		// ==================== 漏电 ====================
		// 判定：cl≥lh 严重漏电；ll≤cl<lh 轻微漏电；cl<ll 正常
		leakLevel(item) {
			const ld = item.lastData || {};
			const c = item.content || {};
			const cl = ld.cl;
			if (cl === undefined || cl === null) return '正常';
			if (Number(cl) >= Number(c.lh)) return '严重漏电';
			if (Number(cl) >= Number(c.ll)) return '轻微漏电';
			return '正常';
		},
		leakLevelClass(item) {
			const lv = this.leakLevel(item);
			if (lv === '严重漏电') return 'alarm-text';
			if (lv === '轻微漏电') return 'warn-text';
			return 'normal-text';
		},

		// ==================== 转换开关 ====================
		switchImg(item) {
			const v = (item.lastData || {}).v;
			const s = SWITCH_STATE[v];
			return s ? s.img : SWITCH_STATE[2].img;
		},
		switchText(item) {
			const v = (item.lastData || {}).v;
			const s = SWITCH_STATE[v];
			return s ? s.text : SWITCH_STATE[2].text;
		},

		// ==================== 柜门 / 门锁 / 烟雾 / 水浸 ====================
		// 柜门：content.sc>0 才显示状态；av!=sv 闭合；av==sv 开
		doorState(item) {
			const ld = item.lastData || {};
			const c = item.content || {};
			if (c.sc <= 0) {
				return { text: '', alarm: false, show: false, img: IMG.doorClose };
			}
			if (!ld.time || ld.av !== ld.sv) {
				return { text: '闭合', alarm: false, show: true, img: IMG.doorClose };
			}
			return { text: '开', alarm: true, show: true, img: IMG.doorOpen };
		},
		// 门锁：av==1 闭合，其它打开
		lockState(item) {
			const ld = item.lastData || {};
			if (!ld.time || ld.av === 1) {
				return { text: '闭合', alarm: false, img: IMG.lockNormal };
			}
			return { text: '打开', alarm: true, img: IMG.lockOpen };
		},
		// 烟雾：sv==1 正常，其它报警
		smokeState(item) {
			const ld = item.lastData || {};
			if (!ld.time || ld.sv === 1) {
				return { text: '正常', alarm: false, img: IMG.smokeNormal };
			}
			return { text: '报警', alarm: true, img: IMG.smokeAlarm };
		},
		// 水浸：s1==a1 或 s2==a2 或 s3==a3 报警，否则正常
		waterState(item) {
			const ld = item.lastData || {};
			if (ld.time) {
				const pairs = [['s1', 'a1'], ['s2', 'a2'], ['s3', 'a3']];
				for (let i = 0; i < pairs.length; i++) {
					const s = pairs[i][0], a = pairs[i][1];
					if (ld[s] !== undefined && ld[s] !== null && ld[s] === ld[a]) {
						return { text: '报警', alarm: true, img: IMG.waterAlarm };
					}
				}
			}
			return { text: '正常', alarm: false, img: IMG.waterNormal };
		},

		// ==================== 控制输出 ====================
		// 名称：K{content.oc} {name}
		outputName(item) {
			const oc = item.content ? item.content.oc : '';
			return `K${oc} ${item.name}`;
		},
		// 状态：lastData.ov==1 开，否则关
		isOutputOn(item) {
			return !!(item.lastData && item.lastData.ov === 1);
		},
		// 时间表摘要：解析 timeContent 形如「[ 18:00开灯, 06:00关灯; 上午: 允许; 下午: 允许 ]」
		parseTimeContent(timeContent) {
			const result = { times: [], perms: [] };
			if (!timeContent || typeof timeContent !== 'string') return result;
			const m = timeContent.match(/\[([^\]]*)\]/);
			if (!m) return result;
			const parts = m[1].split(';').map(s => s.trim()).filter(Boolean);
			parts.forEach(p => {
				if (p.indexOf(':') >= 0) {
					result.perms.push(p.replace(/\s+/g, ''));
				} else {
					p.split(',').forEach(t => {
						t = t.trim();
						if (t) result.times.push(t);
					});
				}
			});
			return result;
		},
		// ==================== 控制输出：开关灯指令 ====================
		// 全部输出通道 id
		allOutputIds() {
			return this.outputs.map(o => o.id);
		},
		// 单个通道卡片上的开关灯按钮：始终只下发到当前通道
		onOutputLight(item, action) {
			this.startLightControl(action, [item.id]);
		},
		// 顶部「控制所有通道」行的开关灯按钮（仅在勾选后可点击）
		onControlAllLight(action) {
			if (!this.allChannelChecked) return;
			this.startLightControl(action, this.allOutputIds());
		},
		// 开关灯流程入口：无 dco 设备操作权限时提示无权限，开灯先检查水浸报警，关灯直接进入时间选择
		startLightControl(action, ids) {
			if (!hasOperation('dco')) {
				uni.showToast({ title: '你没有权限', icon: 'none' });
				return;
			}
			if (!ids || !ids.length) return;
			this.lightPopupAction = action;
			this.lightPopupIds = ids;
			if (action === 'on') {
				this.checkOutputHasWaterAlarm(ids)
					.then(hasWater => {
						if (hasWater) {
							uni.showModal({
								title: '提示',
								content: '发现水浸报警,确定执行开灯操作?',
								confirmText: '确定',
								cancelText: '取消',
								success: (res) => {
									if (res.confirm) this.openLightPicker();
								}
							});
						} else {
							this.openLightPicker();
						}
					})
					.catch(err => {
						// 检查失败时不阻断操作，按无水浸报警继续弹出时间选择
						console.error('获取水浸报警消息失败', err.message);
						this.openLightPicker();
					});
			} else {
				this.openLightPicker();
			}
		},
		// 开灯前检查控制通道是否存在水浸报警
		checkOutputHasWaterAlarm(ids) {
			return request({
				url: '/station/command/CheckOutputHasWaterAlarm',
				method: 'POST',
				data: { ids: ids }
			}).then(res => this.toBoolean(this.parseResponseData(res)));
		},
		// 归一化为布尔值（兼容 boolean / 0/1 / 'true' / 对象包裹）
		toBoolean(v) {
			if (typeof v === 'boolean') return v;
			if (typeof v === 'number') return v === 1;
			if (typeof v === 'string') {
				const s = v.trim().toLowerCase();
				return s === 'true' || s === '1';
			}
			if (v && typeof v === 'object') {
				const inner = v.data !== undefined ? v.data : (v.result !== undefined ? v.result : v.value);
				return this.toBoolean(inner);
			}
			return false;
		},
		// 刷新开关灯可选的最小时间（当前时间，含秒）
		refreshMinLightTime() {
			const now = new Date();
			const pad = n => (n < 10 ? '0' + n : '' + n);
			this.minLightDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
		},
		// 直接弹出开关灯时间选择器（uni-datetime-picker，精确到秒）
		openLightPicker() {
			this.refreshMinLightTime();
			if (this.$refs.lightPicker) {
				this.$refs.lightPicker.show();
			}
		},
		// 时间选择确认：校验不得早于当前时间，然后发送指令
		onLightDateTimeChange(value) {
			if (!value) return;
			if (!this.isTimeNotBeforeNow(value)) {
				uni.showToast({ title: '保持时间不能早于当前时间', icon: 'none' });
				return;
			}
			this.sendLightOnOffCommand(this.lightPopupAction, this.lightPopupIds, value);
		},
		// 发送开关灯指令，成功后等待 WebSocket 回执
		sendLightOnOffCommand(action, ids, expire) {
			const isOpen = action === 'on';
			this.lightSending = true;
			this.pendingCmdIds = {};
			uni.showLoading({ title: '发送中...', mask: true });
			request({
				url: '/station/command/SendOutputOld',
				method: 'POST',
				data: {
					code: 'handControl',              // 命令码，固定为通道开关
					list: ids,                        // 通道 id 列表
					checkUserId: 0, // 当前用户 id
					args: {
						isOpen: isOpen,                // 是否开灯
						isEnable: true,                // 是否启用
						isPoint: false,                // 是否点控
						expire: expire                 // 保持到何时，格式 yyyy-MM-dd HH:mm:ss
					}
				}
			}).then(res => {
				const data = this.parseResponseData(res);
				const list = data && data.list;
				if (Array.isArray(list) && list.length) {
					let accepted = false;
					list.forEach(item => {
						if (item && item.success && item.message) {
							// message 即 cmdId，登记后等待 WebSocket 回执
							this.pendingCmdIds[item.message] = true;
							accepted = true;
						}
					});
					if (!accepted) {
						uni.hideLoading();
						this.lightSending = false;
						const first = list[0];
						uni.showToast({ title: (first && first.message) || '指令发送失败', icon: 'none' });
					}
				} else {
					uni.hideLoading();
					this.lightSending = false;
					uni.showToast({ title: '指令发送失败', icon: 'none' });
				}
			}).catch(err => {
				console.error('发送开关灯指令失败', err.message);
				uni.hideLoading();
				this.lightSending = false;
				uni.showToast({ title: '指令发送失败', icon: 'none' });
			});
		},
		// 校验所选时间不早于当前时间
		isTimeNotBeforeNow(value) {
			const t = new Date(String(value).replace(/-/g, '/'));
			return !isNaN(t.getTime()) && t.getTime() >= Date.now();
		},

		// ==================== WebSocket 指令回执 ====================
		// 建立 WebSocket 连接（监听开关灯指令回执）
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
		// 处理 WebSocket 消息：仅处理本页发出指令的 cmd 回执
		handleSocketMessage(data) {
			let msg = data;
			if (typeof data === 'string') {
				try { msg = JSON.parse(data); } catch (e) { msg = null; }
			}
			if (!msg || msg.type !== 'cmd') return;
			if (!msg.commandId || !this.pendingCmdIds[msg.commandId]) return;
			// 仅处理本页可下发的指令码（开关灯 / 召测 / 查询时钟 / 校准时钟）
			const SUPPORTED_CODES = ['handControl', 'forceRead', 'getclock', 'setclock'];
			if (SUPPORTED_CODES.indexOf(msg.cmdCode) < 0) return;
			const status = Number(msg.status);
			if (status === 9) {
				this.finishCommand('success', msg);
			} else if (status === 7) {
				this.finishCommand('timeout', msg);
			} else if (status === 8) {
				this.finishCommand('fail', msg);
			}
		},
		// 结束指令：成功弹「执行结果」（查询时钟显示设备当前时间）并刷新整页，超时/失败 toast
		finishCommand(type, msg) {
			uni.hideLoading();
			this.lightSending = false;
			this.pendingCmdIds = {};
			if (type === 'success') {
				let content = '执行成功';
				// 查询时钟成功回执：content 携带设备当前时间
				if (msg && msg.cmdCode === 'getclock') {
					const nowTime = this.extractNowTime(msg.content);
					content = nowTime ? `设备当前时间：${nowTime}` : '执行成功';
				}
				uni.showModal({
					title: '执行结果',
					content: content,
					showCancel: false,
					success: () => this.loadAllData()
				});
			} else if (type === 'timeout') {
				uni.showToast({ title: '指令超时', icon: 'none' });
			} else {
				uni.showToast({ title: '执行失败', icon: 'none' });
			}
		},
		// 解析 getclock 回执 content 中的设备当前时间（content 可能为 JSON 字符串或对象）
		extractNowTime(content) {
			if (!content) return '';
			if (typeof content === 'string') {
				try { content = JSON.parse(content); } catch (e) { return ''; }
			}
			return (content && content.nowTime) || '';
		},
		// ==================== 接触器 ====================
		// sv：1 闭合 / 0 断开 / -1 未测量 / -2 未配置
		contactState(item) {
			const sv = (item.lastData || {}).sv;
			if (sv === 1) return { text: '闭合', on: true, img: IMG.contactorOn };
			if (sv === 0) return { text: '断开', on: false, img: IMG.contactorOff };
			if (sv === -1) return { text: '未测量', on: false, img: IMG.contactorOff };
			return { text: '未配置', on: false, img: IMG.contactorOff };
		},

		// ==================== 支路 ====================
		// 总/分标志：content.isTt（老接口字段 tt 兜底）
		branchIsTt(item) {
			const c = item.content || {};
			return !!(c.isTt !== undefined ? c.isTt : c.tt);
		},
		// A/B/C 相电流：{ca}[{car}]；-1 未测量、-2 未配置
		branchCurrent(item, phase) {
			const ld = item.lastData || {};
			const c = item.content || {};
			const keys = { a: ['ca', 'car'], b: ['cb', 'cbr'], c: ['cc', 'ccr'] };
			const k = keys[phase][0];
			const rk = keys[phase][1];
			const val = ld[k];
			if (val === -1) return '未测量';
			if (val === -2) return '未配置';
			return `${val}[${c[rk]}]`;
		},
		branchLeakStatus(item) {
			const cl = (item.lastData || {}).cl;
			const ll = (item.content || {}).ll;
			const lh = (item.content || {}).lh;
			if (cl >= 0) { // 漏电电流有值时才判断
				if (cl >= lh) return '严重漏电'
				else if (cl >= ll && cl < lh) return '轻微漏电'
				else if (cl < ll) return '正常'
			}
			return '-'
		},
		// 漏电：-1 未测量 / -2 未配置 / 0 无漏电 / 其它数值
		branchLeak(item) {
			const cl = (item.lastData || {}).cl;
			if (cl === -1) return '未测量';
			if (cl === -2) return '未配置';
			if (cl === 0) return '无漏电';
			return cl;
		},
		// 时间表状态：-1 未设置 / -2 已删除 / 0 灭灯时段 / 1 亮灯时段 / 2 未启用
		branchTvText(item) {
			const tv = (item.lastData || {}).tv;
			if (tv === -1) return '未设置';
			if (tv === -2) return '已删除';
			if (tv === 0) return '灭灯时段';
			if (tv === 1) return '亮灯时段';
			return '未启用';
		},

		// ==================== 通用 ====================
		// 时间戳 → yyyy-MM-dd HH:mm:ss
		formatTime(ts) {
			if (!ts) return '';
			const d = new Date(Number(ts));
			if (isNaN(d.getTime())) return '';
			const pad = n => (n < 10 ? '0' + n : '' + n);
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
				+ `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
		},
		// ==================== 发送指令（召测 / 查询时钟 / 校准时钟） ====================
		// 底部操作栏指令入口：前置校验（已配置总配电）→ 确认框 → 发送 → 等待 WebSocket 回执
		sendOutputCommand(type) {
			// 前置判断：召测/时钟类操作要求已配置总配电
			const mainId = Number(this.main.id);
			if (!mainId || mainId <= 0) {
				uni.showToast({ title: '请先配置总配电', icon: 'none' });
				return;
			}
			const CMD_MAP = {
				'召测': { code: 'forceRead', confirm: '确定发送召测指令吗？', loading: '正在执行召测命令...' },
				'查询时钟': { code: 'getclock', confirm: '确定发送查询时钟指令吗？', loading: '正在执行查询时钟命令...' },
				'校准时钟': { code: 'setclock', confirm: '确定发送校准时钟指令吗？', loading: '正在执行校准时钟命令...' }
			};
			const cfg = CMD_MAP[type];
			if (!cfg) return;
			uni.showModal({
				title: type,
				content: cfg.confirm,
				success: (res) => {
					if (res.confirm) this.sendPowerboxCommand(cfg.code, cfg.loading);
				}
			});
		},
		// 发送配电箱指令（召测/时钟）：成功后登记 cmdId，等待 WebSocket 回执
		sendPowerboxCommand(code, loadingText) {
			this.pendingCmdIds = {};
			uni.showLoading({ title: loadingText, mask: true });
			request({
				url: '/station/command/SendPowerboxOld',
				method: 'POST',
				data: {
					code: code,             // 指令码：forceRead / getclock / setclock
					list: [this.main.id],   // 总配电设备 id
					checkUserId: 0,         // 当前用户 id（固定 0 表示无限制）
					args: {}
				}
			}).then(res => {
				const data = this.parseResponseData(res);
				const list = data && data.list;
				if (Array.isArray(list) && list.length) {
					let accepted = false;
					list.forEach(item => {
						if (item && item.success && item.message) {
							// message 即 cmdId，登记后等待 WebSocket 回执
							this.pendingCmdIds[item.message] = true;
							accepted = true;
						}
					});
					if (!accepted) {
						uni.hideLoading();
						const first = list[0];
						uni.showToast({ title: (first && first.message) || '指令发送失败', icon: 'none' });
					}
				} else {
					uni.hideLoading();
					uni.showToast({ title: '指令发送失败', icon: 'none' });
				}
			}).catch(err => {
				console.error('发送配电箱指令失败', err.message);
				uni.hideLoading();
				uni.showToast({ title: '指令发送失败', icon: 'none' });
			});
		},
		// ==================== 线路导航 ====================
		// 打开导航地图弹窗
		openMapSelectionPopup() {
			// #ifdef MP
			// 小程序端：直接打开内置地图
			this.openMiniMap();
			// #endif

			// #ifndef MP
			// 非小程序端：弹出地图选择弹窗
			this.$refs.mapSelectionPopup.open();
			// #endif
		},
		openMiniMap() {
			// 小程序端：打开内置地图并定位到站点，
			// 页面内点击站点标记/“到这去”即可基于当前定位展示驾车路线
			const dest = this.stationLocation;
			if (!dest || !dest.lat || !dest.lng) {
				uni.showToast({title: '未获取到站点位置', icon: 'none'});
				return;
			}
			uni.openLocation({
				latitude: dest.lat,     // GCJ-02 坐标，小程序内置地图使用
				longitude: dest.lng,
				scale: 16,
				name: this.boxName || '站点位置',
				address: '',
				success: () => {
					// 成功打开
				},
				fail: (err) => {
					uni.showToast({title: '打开地图失败', icon: 'none'});
					console.error('打开地图失败', err);
				}
			});
		},
		// 处理地图选择
		onMapSelected(mapName) {
			// 关闭弹窗
			this.$refs.mapSelectionPopup.$refs.popup.close();

			// 检查目的地坐标（GCJ-02）
			const dest = this.stationLocation;
			if (!dest || !dest.lat || !dest.lng) {
				uni.showToast({title: '未获取到站点位置', icon: 'none'});
				return;
			}

			// #ifdef H5
			// 在点击事件的同步调用栈中预先打开空窗口，
			// 避免异步定位回调里的 window.open 被浏览器弹窗拦截
			let navWindow = null;
			try {
				navWindow = window.open('about:blank', '_blank');
			} catch (e) {
				navWindow = null;
			}

			uni.showLoading({title: '获取位置中...'});
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					uni.hideLoading();
					// 浏览器定位返回 WGS-84，转换为 GCJ-02 作为起点
					const gcj = wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude);
					const urls = this.buildMapUrls(mapName, {lat: gcj.lat, lng: gcj.lng}, dest);
					if (!urls || !urls.webUrl) {
						if (navWindow) navWindow.close();
						return;
					}
					if (navWindow) {
						navWindow.location.href = urls.webUrl;
					} else {
						window.open(urls.webUrl, '_blank');
					}
				},
				(err) => {
					uni.hideLoading();
					console.error('定位失败:', err);
					// 定位失败时降级为仅展示站点位置，保证地图页面仍可打开
					const urls = this.buildMapUrls(mapName, null, dest);
					if (urls && urls.webUrl) {
						if (navWindow) {
							navWindow.location.href = urls.webUrl;
						} else {
							window.open(urls.webUrl, '_blank');
						}
					} else if (navWindow) {
						navWindow.close();
					}
				},
				{timeout: 10000, enableHighAccuracy: true, maximumAge: 60000}
			);
			// #endif

			// #ifndef H5
			uni.showLoading({title: '获取位置中...'});
			uni.getLocation({
				type: 'gcj02', // 获取火星坐标系
				success: (location) => {
					uni.hideLoading();
					const origin = {lat: location.latitude, lng: location.longitude};
					this.openMapUrl(this.buildMapUrls(mapName, origin, dest));
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('定位失败', err);
					uni.showToast({title: '获取当前位置失败，请检查定位权限', icon: 'none'});
				}
			});
			// #endif
		},
		/**
		 * 根据地图类型构建导航链接（起点 + 终点，默认驾车，路线直接展示）
		 * @param {string} mapName - 地图名称
		 * @param {{lat:number,lng:number}|null} origin - 起点坐标（GCJ-02），为空时仅展示终点位置
		 * @param {{lat:number,lng:number}} dest - 终点坐标（GCJ-02）
		 * @returns {{webUrl:string, appUrl:string}} webUrl 网页链接 / appUrl 客户端跳转链接
		 */
		buildMapUrls(mapName, origin, dest) {
			const destName = this.boxName || '站点位置';
			const originName = '我的位置';
			const hasOrigin = origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng);

			switch (mapName) {
				case '百度地图': {
					// 百度地图使用 BD-09
					const bdDest = (this.stationLocationBd09.lat && this.stationLocationBd09.lng)
						? this.stationLocationBd09
						: gcj02ToBd09(dest.lng, dest.lat);
					const bdDestStr = `${bdDest.lat},${bdDest.lng}`;

					if (!hasOrigin) {
						return {
							webUrl: `https://api.map.baidu.com/marker?location=${bdDestStr}&title=${encodeURIComponent(destName)}&content=${encodeURIComponent('')}&output=html&src=smartlighting`,
							appUrl: `baidumap://map/marker?location=${bdDestStr}&title=${encodeURIComponent(destName)}&content=${encodeURIComponent('')}&src=smartlighting`
						};
					}
					const bdOrigin = gcj02ToBd09(origin.lng, origin.lat);
					const bdOriginStr = `${bdOrigin.lat},${bdOrigin.lng}`;
					return {
						webUrl: `https://api.map.baidu.com/direction?origin=${bdOriginStr}&destination=${bdDestStr}&mode=driving&coord_type=bd09ll&output=html&src=smartlighting`,
						appUrl: `baidumap://map/direction?origin=${bdOriginStr}&destination=${bdDestStr}&mode=driving&coord_type=bd09ll&src=smartlighting`
					};
				}
				case '高德地图': {
					// 高德地图使用 GCJ-02，网页 URI 坐标格式为 lng,lat
					const destStr = `${dest.lng},${dest.lat}`;
					const fromPart = hasOrigin
						? `from=${origin.lng},${origin.lat},${encodeURIComponent(originName)}&`
						: '';
					const appFromPart = hasOrigin
						? `slat=${origin.lat}&slon=${origin.lng}&sname=${encodeURIComponent(originName)}&`
						: '';
					return {
						webUrl: `https://uri.amap.com/navigation?${fromPart}to=${destStr},${encodeURIComponent(destName)}&mode=car&policy=0&src=smartlighting&coordinate=gaode&callnative=0`,
						appUrl: `amapuri://route/plan/?sourceApplication=smartlighting&${appFromPart}dlat=${dest.lat}&dlon=${dest.lng}&dname=${encodeURIComponent(destName)}&dev=0&t=0`
					};
				}
				case '腾讯地图': {
					// 腾讯地图使用 GCJ-02，fromcoord/tocoord 格式为 lat,lng
					const destStr = `${dest.lat},${dest.lng}`;
					const fromPart = hasOrigin
						? `from=${encodeURIComponent(originName)}&fromcoord=${origin.lat},${origin.lng}&`
						: '';
					if (!hasOrigin) {
						return {
							webUrl: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${destStr};title:${encodeURIComponent(destName)};addr:${encodeURIComponent('')}&referer=smartlighting`,
							appUrl: `qqmap://map/marker?marker=coord:${destStr};title:${encodeURIComponent(destName)}&referer=smartlighting`
						};
					}
					return {
						webUrl: `https://apis.map.qq.com/uri/v1/routeplan?type=drive&${fromPart}to=${encodeURIComponent(destName)}&tocoord=${destStr}&policy=0&referer=smartlighting`,
						appUrl: `qqmap://map/routeplan?type=drive&${fromPart}to=${encodeURIComponent(destName)}&tocoord=${destStr}&policy=0&referer=smartlighting`
					};
				}
				case '谷歌地图': {
					// 谷歌地图使用 WGS-84
					const wgsDest = gcj02ToWgs84(dest.lng, dest.lat);
					const destStr = `${wgsDest.lat},${wgsDest.lng}`;
					if (!hasOrigin) {
						return {
							webUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destStr)}`,
							appUrl: `comgooglemaps://?q=${destStr}`
						};
					}
					const wgsOrigin = gcj02ToWgs84(origin.lng, origin.lat);
					const originStr = `${wgsOrigin.lat},${wgsOrigin.lng}`;
					return {
						webUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&travelmode=driving`,
						appUrl: `comgooglemaps://?saddr=${originStr}&daddr=${destStr}&directionsmode=driving`
					};
				}
				default:
					uni.showToast({ title: '暂不支持该地图', icon: 'none' });
					return {webUrl: '', appUrl: ''};
			}
		},
		// 打开地图：App 端跳转对应地图客户端，H5 端打开网页版
		openMapUrl(urls) {
			if (!urls || (!urls.webUrl && !urls.appUrl)) return;
			// #ifdef APP-PLUS
			plus.runtime.openURL(urls.appUrl, (err) => {
				uni.showToast({ title: '打开地图失败，请确认是否已安装对应APP', icon: 'none' });
				console.error('打开地图失败', err);
			});
			// #endif
			// #ifdef H5
			window.open(urls.webUrl, '_blank');
			// #endif
		},

		onComingSoon() {
			uni.showToast({ title: '功能开发中，敬请期待', icon: 'none' });
		}
	}
}
</script>

<style lang="scss" scoped>
.station-detail-container {
	padding-bottom: 140rpx;
	background-color: var(--bg-page, #f5f6fa);
	min-height: 100vh;

	&.white-bg {
		background-color: var(--bg-card, #fff);
	}
}

/* 隐藏 uni-datetime-picker 的触发区（仅用于程序化 show 弹出） */
.light-picker-trigger {
	display: none;
}

/* 加载状态 */
.loading-state {
	padding-top: 200rpx;
	text-align: center;
	color: var(--text-quaternary, #909399);
	font-size: 28rpx;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 100rpx;
	.empty-img { width: 100%; height: auto; }
	.empty-text {
		color: var(--text-quaternary, #909399);
		font-size: 28rpx;
		margin: 40rpx 0;
	}
	.empty-btns {
		display: flex;
		gap: 30rpx;
		.empty-btn {
			background-color: #007aff;
			color: #fff;
			font-size: 28rpx;
			border-radius: 10rpx;
			padding: 0 30rpx;
			line-height: 70rpx;
			height: 70rpx;
		}
	}
}

/* 内容区 */
.content-area {
	padding: 20rpx 20rpx 180rpx;

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: var(--text-primary, #333);
		margin: 30rpx 0 10rpx;
	}

	/* 上次召测时间样式 */
	.last-test-time {
		background-color: var(--bg-card, #fff);
		padding: 10rpx;
		margin: 0;
		.time-text {
			display: block;
			text-align: center;
			font-size: 24rpx;
			color: var(--text-quaternary, #909399);
		}
	}

	/* 横向滑动容器样式 */
	.horizontal-scroll {
		white-space: nowrap;
		width: 100%;
		margin-bottom: 30rpx;
	}
	.scroll-wrapper {
		display: inline-flex;
		align-items: flex-start;
		padding-bottom: 5rpx; /* 防止选中边框被裁剪 */
	}

	/* 总配电卡片样式 */
	.main-power-card {
		background: var(--bg-card, #ffffff);
		border-radius: 12rpx;
		padding: 20rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 8rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.05));

		.power-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 15rpx;
			&.power-header {
				font-weight: bold;
				font-size: 26rpx;
				color: var(--text-primary, #333);
				margin-bottom: 10rpx;
			}
			.row-label {
				width: 120rpx;
				font-size: 28rpx;
				color: var(--text-secondary, #666);
				text-align: right;
				margin-right: 10rpx;
				flex-shrink: 0;
			}
			.col {
				flex: 1;
				text-align: center;
				font-size: 32rpx;
				color: var(--text-primary, #333);
			}
			.data-box {
				background: var(--bg-soft, #f0f2f5);
				border: 1px solid var(--border-color, #e4e7ed);
				border-radius: 6rpx;
				padding: 8rpx 0;
				margin: 0 10rpx;
				font-size: 28rpx;
				color: var(--text-primary, #333);
				/* 电压越界报警色 */
				&.alarm { color: #ff4d4f; }
			}
		}
		.divider-line {
			height: 1px;
			background: var(--border-color, #eee);
			margin: 20rpx 0;
		}
	}

	/* 漏电监测卡片样式 */
	.leakage-card {
		background: var(--bg-card, #ffffff);
		border-radius: 12rpx;
		padding: 20rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 8rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.05));

		.leakage-block {
			margin-bottom: 20rpx;
			&:last-child { margin-bottom: 0; }

			.leakage-title {
				font-size: 30rpx;
				color: var(--text-primary, #333);
				margin-bottom: 15rpx;
			}

			.leakage-row {
				display: flex;
				justify-content: space-between;
				margin-bottom: 15rpx;

				.leak-cell {
					flex: 1;
					display: flex;
					flex-direction: column;
					align-items: center;

					.leak-label {
						font-size: 24rpx;
						color: var(--text-secondary, #666);
						margin-bottom: 5rpx;
					}

					.data-box {
						width: 90%;
						background: var(--bg-soft, #f0f2f5);
						border: 1px solid var(--border-color, #e4e7ed);
						border-radius: 6rpx;
						padding: 8rpx 0;
						text-align: center;
						font-size: 28rpx;
						color: var(--text-primary, #333);
						&.normal-text { color: #2bd472; }
						&.warn-text { color: #ff9f43; }
						&.alarm-text { color: #ff4d4f; }
					}
				}
			}

			.alarm-row {
				.leak-cell {
					align-items: flex-start;
					padding-left: 10rpx;
					.leak-label { margin-bottom: 8rpx; }
					.data-box { width: 140rpx; }
				}
			}

			.divider-line {
				height: 1px;
				background: var(--border-color, #eee);
				margin: 20rpx 0 0 0;
			}
		}
	}

	/* 五列卡片通用样式（柜门、门锁、烟雾、水浸、接触器） */
	.device-card {
		width: 180rpx;
		background: var(--bg-card, #fff);
		border: 1px solid var(--border-color, #eee);
		border-radius: 8rpx;
		padding: 10rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 20rpx;
		flex-shrink: 0;
		box-sizing: border-box;
		position: relative;

		image { width: 120rpx; height: 120rpx; margin-bottom: 10rpx; }
		.device-name {
			font-size: 32rpx;
			color: var(--text-primary, #333);
			margin-bottom: 5rpx;
		}
		.status-text {
			font-size: 24rpx;
			font-weight: bold;
			&.green { color: #2bd472; }
			&.red { color: #ff4d4f; }
		}

		/* 接触器选中变蓝 */
		&.active {
			border: 2px solid #007aff;
		}
	}

	/* 转换开关 */
	.switch-card {
		width: 180rpx;
		background: var(--bg-card, #fff);
		border: 1px solid var(--border-color, #eee);
		border-radius: 8rpx;
		padding: 10rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 20rpx;
		flex-shrink: 0;
		box-sizing: border-box;
		position: relative;

		image { width: 160rpx; height: 160rpx; margin-bottom: 10rpx; }
		.switch-name { font-size: 24rpx; color: #007aff; }
		.switch-status {
			font-size: 22rpx;
			color: var(--text-secondary, #666);
			margin-top: 4rpx;
		}
	}

	/* 控制输出 */
	.channel-card {
		width: 300rpx;
		background: var(--bg-card, #fff);
		border: 1px solid var(--border-color, #eee);
		border-radius: 8rpx;
		padding: 15rpx;
		box-sizing: border-box;
		margin-right: 20rpx;
		flex-shrink: 0;
		position: relative;

		&.active {
			border: 2px solid #007aff;
		}

		.channel-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 10rpx;
			.channel-name {
				font-weight: bold;
				font-size: 26rpx;
				color: var(--text-primary, #333);
			}
			.channel-status {
				font-size: 24rpx;
				padding: 2rpx 14rpx;
				border-radius: 6rpx;
				&.on { background: rgba(43, 212, 114, 0.12); color: #2bd472; }
				&.off {
					background: var(--bg-soft, #f0f2f5);
					color: var(--text-quaternary, #909399);
				}
			}
		}
		.channel-times {
			display: flex;
			flex-direction: column;
			font-size: 24rpx;
			color: var(--text-primary, #333);
		}
		.channel-perm {
			display: flex;
			flex-direction: column;
			font-size: 24rpx;
			color: var(--text-primary, #333);
			margin-bottom: 10rpx;
		}
		.channel-btns {
			display: flex;
			justify-content: space-between;
			.mini-btn {
				width: 45%; height: 50rpx; line-height: 50rpx; font-size: 22rpx;
				background: var(--bg-soft, #eee);
				color: var(--text-primary, #333);
				margin: 0;
				&.primary { background: #007aff; color: #fff; }
				&[disabled] {
					opacity: 0.5;
					color: var(--text-quaternary, #999) !important;
					cursor: not-allowed;
				}
			}
		}
	}

	.all-channel-check {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: nowrap;
		padding: 10rpx;
		margin-bottom: 10rpx;

		.check-left {
			display: flex;
			align-items: center;
			flex: 1;
			white-space: nowrap;
			.check-label {
				display: flex;
				align-items: center;
			}
			checkbox {
				margin-right: 10rpx;
			}
			text {
				font-size: 24rpx;
				color: var(--text-primary, #333);
			}
		}

		.check-right {
			display: flex;
			gap: 10rpx;
			flex-shrink: 0;

			.mini-btn {
				width: 110rpx;
				height: 50rpx;
				line-height: 50rpx;
				font-size: 22rpx;
				background: var(--bg-soft, #eee);
				color: var(--text-primary, #333);
				border-radius: 6rpx;
				padding: 0;
				text-align: center;
				border: none;

				&.primary {
					background: #007aff;
					color: #fff;
				}

				&[disabled],
				&.is-disabled {
					color: var(--text-quaternary, #999) !important;
					opacity: 0.5;
					cursor: not-allowed;
				}
			}
		}
	}

	/* 分支 */
	.branch-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		.branch-card {
			background: var(--bg-card, #fff);
			border: 1px solid var(--border-color, #eee);
			border-radius: 10rpx;
			padding: 20rpx;
			.branch-header {
				display: flex;
				align-items: center;
				margin-bottom: 15rpx;
				.tag {
					padding: 4rpx 10rpx; border-radius: 4rpx; color: #fff; font-size: 22rpx; margin-right: 10rpx;
					&.blue { background: #3880FC; }
					&.gray { background: #68737D; }
				}
				.branch-name {
					font-size: 28rpx;
					font-weight: bold;
					color: var(--text-primary, #333);
				}
			}
			.data-grid {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10rpx;
				margin-bottom: 15rpx;
				font-size: 32rpx;
				color: var(--text-primary, #333);
				&:last-child { margin-bottom: 0; }
				.data-box {
					background: var(--bg-soft, #f0f2f5);
					text-align: center;
					padding: 10rpx;
					border-radius: 4rpx;
					color: var(--text-primary, #333);
				}
			}
		}
	}
}

/* 底部操作栏（固定定位） */
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 120rpx;
	background: var(--bg-card, #fff);
	border-top: 1px solid var(--border-color, #eee);
	display: flex;
	justify-content: space-around;
	align-items: center;
	z-index: 1;
	.bar-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		image { width: 40rpx; height: 40rpx; margin-bottom: 5rpx; }
		text {
			font-size: 24rpx;
			color: var(--text-primary, #333);
		}
	}
}

// 夜间主题将图片不显示
.theme-dark .empty-img {
	filter: brightness(0) invert(1);
	opacity: 0;
}
</style>
