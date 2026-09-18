<template>
	<view :class="themeClass" class="page-wrapper">
		<!-- 工单基本信息卡片 -->
		<view class="header-card">
			<!-- 右上角状态标签 -->
			<view
				v-if="workOrderBase.alarmLevel && workOrderBase.alarmLevel !== 0"
				:style="{ backgroundColor: getLevelColor(workOrderBase.alarmLevel) }"
				class="status-badge"
			>
				{{ workOrderBase.statusName }}
			</view>

			<!-- 信息列表 -->
			<view class="info-row">
				<text class="label">工单ID</text>
				<text class="value">{{ workOrderBase.workOrderId }}</text>
			</view>
			<view class="info-row">
				<text class="label">所属站点</text>
				<text class="value">{{ workOrderBase.stationName }}</text>
			</view>
			<view class="info-row">
				<text class="label">报警属性</text>
				<text class="value">{{ workOrderBase.property }}</text>
			</view>
			<view class="info-row">
				<text class="label">描述内容</text>
				<text class="value">{{ workOrderBase.content }}</text>
			</view>
		</view>

		<!-- 工单详情卡片 -->
		<view class="detail-card">
			<!-- 顶部流程进度条 -->
			<view class="progress-steps">
				<view
					v-for="(step, index) in progressSteps"
					:key="index"
					class="step-group"
				>
					<!-- 步骤节点 -->
					<view class="step-item">
						<view :class="{ 'is-active': step.active }" class="step-icon">
							<image
								:src="step.active ? step.iconActive : step.icon"
								class="step-img"
								mode="aspectFit"
							/>
						</view>
						<text :class="{ 'is-active': step.active }" class="step-text">{{ step.label }}</text>
					</view>

					<!-- 箭头节点 -->
					<view v-if="index < progressSteps.length - 1" class="step-arrow">
						<image
							:src="step.active ? '/static/workOrder/back-active.png' : '/static/workOrder/back.png'"
							class="arrow-img"
							mode="aspectFit"
						/>
					</view>
				</view>
			</view>

			<!-- 人员与时间信息区 -->
			<view class="info-section">
				<!-- 左侧信息 -->
				<view class="info-left">
					<view class="info-item">
						<text class="info-label">发起人</text>
						<text class="info-value">系统</text>
					</view>
					<view class="info-item">
						<text class="info-label">管理员</text>
						<text class="info-value">{{ workOrderDetail.admin }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">责任人</text>
						<text class="info-value">{{ workOrderDetail.responsiblePerson }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">审核人</text>
						<text class="info-value">系统</text>
					</view>
					<view class="info-item">
						<text class="info-label">开始时间</text>
						<text class="info-value">{{ workOrderDetail.startTime }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">截止时间</text>
						<text class="info-value">{{ workOrderDetail.endTime }}</text>
					</view>
				</view>

				<!-- 右侧操作按钮 -->
				<view class="info-right">
					<view class="info-right">
						<!-- 接警 / 到达现场 / 故障判定 按钮 -->
						<view
							v-if="showCallBtn"
							class="action-btn"
							@click="openActionPopup('call')"
						>
							<image class="btn-icon" mode="aspectFit" src="/static/workOrder/resolve.png"/>
							<text>{{ callBtnText }}</text>
						</view>

						<!-- 延期申请按钮 -->
						<view
							v-if="showDelayBtn"
							class="action-btn"
							@click="openActionPopup('delay')"
						>
							<image class="btn-icon" mode="aspectFit" src="/static/workOrder/delay.png"/>
							<text>{{ delayBtnText }}</text>
						</view>

						<!-- 申领耗材按钮 -->
						<view
							v-if="showMaterialBtn"
							class="action-btn"
							@click="openActionPopup('material')"
						>
							<image class="btn-icon" mode="aspectFit" src="/static/workOrder/resolve.png"/>
							<text>申领耗材</text>
						</view>

						<!-- 误报反馈按钮 -->
						<view
							v-if="showMisreportBtn"
							class="action-btn"
							@click="openActionPopup('misreport')"
						>
							<image class="btn-icon" mode="aspectFit" src="/static/workOrder/alarm-bell.png"/>
							<text>误报反馈</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 底部时间线/日志区域 -->
			<view class="timeline-section">
				<!-- 循环渲染日志列表 -->
				<view
					v-for="(log, index) in logs"
					:key="log.id"
					class="timeline-item"
				>
					<!-- 时间线圆点（第一个蓝色/实心，后续灰色/空心） -->
					<view :class="['timeline-dot', index === 0 ? 'dot-blue' : 'dot-gray']"></view>

					<!-- 聊天气泡 -->
					<view class="timeline-bubble">
						<view class="bubble-header">
							<view class="header-left">
								<text class="user-name">{{ log.userName || '系统' }}</text>
								<text v-if="log.userId !== '00000000000000000000000000000000'" class="user-role">
									维修人员
								</text>
							</view>
							<!-- 动态计算日志状态标签，并应用颜色 -->
							<text :class="['status-text', getLogStatusColor(log.status, log.content)]">
								{{ getCommentFlag(log.status, log.content) }}
							</text>
						</view>

						<view class="content-desc">{{ log.content }}</view>

						<!-- 图片网格 -->
						<view v-if="log.imageIds && log.imageIds.length > 0" class="grid-wrap">
							<view v-for="(imgId, i) in log.imageIds" :key="i" class="grid-item">
								<image :src="getImageUrl(imgId)" class="grid-img" mode="aspectFill"
								       @click="previewImage(log.imageIds, i)"></image>
							</view>
						</view>

						<view class="bubble-bottom">
							<!-- 步骤进度显示 -->
							<text v-if="log.isOver" :style="{ color: log.isOver ? 'green' : 'red' }"
							      class="overtime-text">{{ log.isOver ? '已进行' : '未进行' }}
							</text>
							<view class="time-text">{{ log.endTime }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部操作按钮 -->
		<view class="operation-card">
			<view class="op-btn" @click="openDetailFeedbackPopup">
				<image class="op-icon" mode="aspectFit" src="/static/workOrder/detail-feedback.png"></image>
				<text>详情反馈</text>
			</view>
			<!-- TODO:如果处理人ID等于当前用户ID，则视为有权限 -->
			<!--			<view class="op-btn" v-if="isResponsible && orderStatus === 40" @click="openRepairPopup">-->
			<!--				<image class="op-icon" mode="aspectFit" src="/static/workOrder/restore.png"></image>-->
			<!--				<text>已修复</text>-->
			<!--			</view>-->
			<view v-if="orderStatus === 60" class="op-btn" @click="openRepairPopup">
				<image class="op-icon" mode="aspectFit" src="/static/workOrder/restore.png"></image>
				<text>已修复</text>
			</view>
			<view class="op-btn" @click="goToMaterialRecordPage">
				<image class="op-icon" mode="aspectFit" src="/static/workOrder/material.png"></image>
				<text>耗材记录</text>
			</view>
			<view class="op-btn" @click="openMapSelectionPopup">
				<image class="op-icon" mode="aspectFit" src="/static/workOrder/route.png"></image>
				<text>线路导航</text>
			</view>
		</view>

		<!-- ================== 动态操作弹窗 ================== -->
		<uni-popup ref="actionPopup" :mask-click="false" type="center">
			<view class="feedback-popup">
				<!-- 头部 -->
				<view class="popup-header">
					<text class="popup-title">{{ actionTitle }}</text>
					<view class="popup-close" @click="closeActionPopup">
						<uni-icons color="#999" size="24" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 主体内容：根据 actionType 动态切换 -->
				<view class="popup-body">

					<!-- === 接警/到达现场/故障判定 === -->
					<view v-if="actionType === 'call'">
						<!-- 故障判定 -->
						<view v-if="orderStatus === 30">
							<!-- 处理时间/提示信息展示 -->
							<view v-if="selectedFaultLevel" class="level-info">
								<uni-icons color="#2b6df6" size="18" style="margin-right: 10rpx;"
								           type="info"></uni-icons>
								<text class="level-info-text">{{ getLevelInfo(selectedFaultLevel) }}</text>
							</view>

							<!-- 特殊故障：延期时间选择 -->
							<view v-if="selectedFaultLevel === 4" class="delay-date-row">
								<uni-icons color="#2b6df6" size="18" style="margin-right: 10rpx;" type="calendar"/>
								<uni-datetime-picker v-model="pickedDelayDate" hide-second type="datetime">
									<view class="delay-date-text">
										{{ pickedDelayDate ? '延期至：' + pickedDelayDate : '请选择延期时间' }}
									</view>
								</uni-datetime-picker>
							</view>

							<!-- 四种故障固定标签 -->
							<view class="fault-tags">
								<view
									v-for="(lv, i) in faultLevels"
									:key="i"
									:class="{ 'active': selectedFaultLevel === lv.value }"
									class="fault-tag"
									@click="handleLevelSelect(lv.value)"
								>
									{{ lv.label }}
								</view>
							</view>

							<!-- 具体故障下拉选择 -->
							<view v-if="selectedFaultLevel" class="fault-select-row">
								<text class="fs-label">具体故障</text>
								<picker
									:range="getCurrentFaultOptions()"
									:value="selectedFaultIndex"
									class="fs-picker"
									@change="onFaultOptionChange"
								>
									<view class="picker-box">
										{{ selectedSpecificFault || '请选择' }}
									</view>
								</picker>
							</view>

							<!-- 故障现象输入框 -->
							<textarea
								v-model="actionContent"
								class="feedback-textarea"
								placeholder="输入故障现象"
								placeholder-class="feedback-placeholder"
							/>
						</view>

						<!-- 接警 / 到达现场 -->
						<view v-else>
							<textarea
								v-model="actionContent"
								:placeholder="actionPlaceholder"
								class="feedback-textarea"
								placeholder-class="feedback-placeholder"
							/>
						</view>
					</view>

					<!-- === 误报反馈 === -->
					<view v-if="actionType === 'misreport'">
						<textarea
							v-model="actionContent"
							class="feedback-textarea"
							placeholder="请输入误报的具体原因和现象..."
							placeholder-class="feedback-placeholder"
						/>
					</view>

					<!-- === 已修复 === -->
					<view v-if="actionType === 'repair'">
						<textarea
							v-model="actionContent"
							:placeholder="actionPlaceholder"
							class="feedback-textarea"
							placeholder-class="feedback-placeholder"
						/>
					</view>

					<!-- === 申领耗材 === -->
					<view v-if="actionType === 'material'">
						<!-- 耗材分类（大类型） -->
						<view class="material-row">
							<text class="mat-label">耗材分类</text>
							<picker :range="materialCategories" range-key="name" @change="onCategoryChange">
								<view class="picker-box">{{
										selectedCategory ? selectedCategory.name : '请选择'
									}}
								</view>
							</picker>
						</view>

						<!-- 具体物料（小类型） -->
						<view class="material-row">
							<text class="mat-label">具体物料</text>
							<picker
								:disabled="!materialList.length"
								:range="materialList"
								range-key="name"
								@change="onMaterialChange"
							>
								<view class="picker-box">
									<text v-if="selectedMaterial">{{ selectedMaterial.name }}</text>
									<text v-else-if="materialList.length">请选择</text>
									<text v-else>请先选择分类</text>
								</view>
							</picker>
						</view>
						<!-- 库存 -->
						<view v-if="selectedMaterial" class="material-row">
							<text class="mat-label">库存</text>
							<text class="mat-value">{{ selectedMaterial.amount }} {{ selectedMaterial.unit }}</text>
						</view>
						<view class="material-row">
							<text class="mat-label">申领数量</text>
							<input v-model="materialCount" class="mat-input" placeholder="输入数量" type="number"/>
						</view>
						<view class="material-row">
							<text class="mat-label">工单类型</text>
							<picker :range="orderTypes" @change="onOrderTypeChange">
								<view class="picker-box">{{ selectedOrderType || '请选择' }}</view>
							</picker>
						</view>
						<view class="material-row">
							<text class="mat-label">申领说明</text>
							<input v-model="materialDesc" class="mat-input" placeholder="输入说明" type="text"/>
						</view>
					</view>

					<!-- === 申请延期 === -->
					<view v-if="actionType === 'delay'">
						<view class="delay-date-row">
							<uni-icons color="#2b6df6" size="18" style="margin-right: 10rpx;" type="calendar"/>
							<uni-datetime-picker
								v-model="delayDate"
								hide-second
								type="datetime"
							>
								<view class="delay-date-text">延期至：{{ delayDate || '请选择延期时间' }}</view>
							</uni-datetime-picker>
						</view>
						<textarea
							v-model="actionContent"
							class="feedback-textarea"
							placeholder="请输入延期原因"
							placeholder-class="feedback-placeholder"
						/>
					</view>

					<!-- === 图片上传区域 === -->
					<view v-if="actionType !== 'material'" class="feedback-images">
						<view v-for="(img, index) in actionImages" :key="index" class="img-item">
							<image :src="img" class="img-preview" mode="aspectFill"></image>
							<view class="img-delete" @click="removeActionImage(index)">
								<uni-icons color="#fff" size="20" type="closeempty"></uni-icons>
							</view>
						</view>
						<view v-if="actionImages.length < 3" class="img-item add-box" @click="chooseActionImage">
							<uni-icons color="#86909c" size="32" type="camera-filled"></uni-icons>
						</view>
					</view>
				</view>

				<!-- 提交按钮 -->
				<button class="submit-btn" @click="submitActionPopup">提交</button>
			</view>
		</uni-popup>

		<!-- 详情反馈弹窗和线路导航弹窗 -->
		<DetailFeedbackPopup ref="detailFeedbackPopup" @submit="submitDetailFeedback"/>
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
	formatAlarmContent,
	bd09ToGcj02
} from "@/utils/common";
import { navigateWithMap, openMiniMap } from '@/utils/navigation';
import DetailFeedbackPopup from "@/pages/workOrder/components/woDetailComponents/detailFeedbackPopup.vue";
import MapSelectionPopup from "@/components/mapSelectionPopup.vue";

export default {
	name: 'WorkOrderDetail',
	components: {
		DetailFeedbackPopup,
		MapSelectionPopup
	},
	data() {
		return {
			statusNameMap: {
				0: ' ',
				1: '普通故障',
				2: '一般故障',
				3: '重大故障',
				4: '特殊故障'
			},
			paramTypeMap: {
				1: '配电柜总配电',
				2: '配电柜转换开关',
				3: '配电柜控制输出开关',
				4: '配电柜接触器',
				5: '配电柜支路配电',
				6: '配电柜柜门',
				7: '配电柜门锁',
				8: '配电柜烟雾监测',
				9: '配电柜水浸监测',
				10: '配电柜线缆',
				14: '灯杆',
				16: '电能表',
				199: '单灯'
			},
			orderId: '', // 存储从上一页传来的工单ID
			currentUserId: '', // 当前登录账号ID
			isResponsible: true, // 是否为责任人
			orderStatus: 0, // 当前工单状态
			workOrderBase: {
				workOrderId: '',
				stationName: '',
				property: '',
				content: '',
				statusName: '',
				alarmLevel: 0 // 用于颜色判断和显隐控制
			},
			// 工单流程数据
			progressSteps: [
				{
					label: '已接警',
					icon: '/static/workOrder/on-way.png',
					iconActive: '/static/workOrder/on-way-active.png',
					active: false
				},
				{
					label: '到达现场',
					icon: '/static/workOrder/scene.png',
					iconActive: '/static/workOrder/scene-active.png',
					active: false
				},
				{
					label: '故障判定',
					icon: '/static/workOrder/fault.png',
					iconActive: '/static/workOrder/fault-active.png',
					active: false
				},
				{
					label: '正在维修',
					icon: '/static/workOrder/repair.png',
					iconActive: '/static/workOrder/repair-active.png',
					active: false
				},
				{
					label: '工单结束',
					icon: '/static/workOrder/over.png',
					iconActive: '/static/workOrder/over-active.png',
					active: false
				}
			],
			workOrderDetail: {
				admin: '',
				responsiblePerson: '',
				startTime: '',
				endTime: '',
				dealUserId: 0, // 负责人ID
			},
			// 日志列表
			logs: [],
			// ========== 弹窗相关 ==========
			actionType: '', // call, delay, material, misreport
			actionTitle: '',
			actionPlaceholder: '',
			actionContent: '',
			actionImages: [],

			// 故障判定相关
			faultLevels: [
				{label: '简单故障', value: 1},
				{label: '一般故障', value: 2},
				{label: '重大故障', value: 3},
				{label: '特殊故障', value: 4}
			],
			selectedFaultLevel: 0,// 当前选中的故障级别
			allFaultTypes: [], // 存储全部故障列表
			selectedSpecificFault: '', // 选中的具体故障名称
			selectedFaultIndex: -1, // picker 选中索引
			pickedDelayDate: '', // 特殊故障选择的延期时间

			// 耗材相关
			materialCategories: [],
			selectedCategory: null,
			materialCount: '',
			orderTypes: ['旧工单，固定流程工单', '新工单，自定义流程工单'],
			selectedOrderType: '旧工单，固定流程工单',
			materialDesc: '',

			// 延期相关
			delayDate: '',
			delayTime: '', // 存储申请延期时填写的延期时间
			// 耗材类型
			materialList: [],          // 当前分类下的具体物料列表
			selectedMaterial: null,    // 选中的具体物料对象
			// 站点经纬度：stationLocation 为 GCJ-02（高德/腾讯/小程序内置地图用），stationLocationBd09 为接口原始 BD-09（百度地图用）
			stationLocation: {lat: 0, lng: 0},
			stationLocationBd09: {lat: 0, lng: 0}
		};
	},
	onLoad(options) {
		this.currentUserId = String(uni.getStorageSync('userId')) || ''; // 获取当前登录账号ID
		if (options && options.id) {
			this.orderId = options.id;
			this.getWorkOrderDetail();   // 获取到ID后再获取工单详情
		} else {
			uni.showToast({title: '缺少工单ID', icon: 'none'});
		}
	},
	computed: {
		// 接警/到达现场 按钮文字
		callBtnText() {
			switch (this.orderStatus) {
				case 10:
					return '接警';
				case 20:
					return '到达现场';
				case 30:
					return '故障判定';
				default:
					return '';
			}
		},
		// 接警/到达现场/故障判定 按钮显示规则
		showCallBtn() {
			// 接警按钮是工单状态为10时显示而到达现场以及故障判定按钮仅当处理人ID等于当前用户ID且或20或30时显示
			const idStatus = String(this.currentUserId) === String(this.workOrderDetail.dealUserId);
			return this.orderStatus === 10 || ((this.orderStatus === 20 || this.orderStatus === 30) && idStatus);
		},
		// 延期按钮显示规则
		showDelayBtn() {
			if (this.orderStatus === 60) {
				return true; // 申请延期
			} else if (this.orderStatus === 50) {
				// 确认延期：仅当当前用户非处理人（管理员）时显示
				return String(this.currentUserId) !== String(this.workOrderDetail.dealUserId);
			}
			return false;
		},
		// 延期按钮文字
		delayBtnText() {
			if (this.orderStatus === 60) return '申请延期';
			if (this.orderStatus === 50) return '确认延期';
			return '';
		},
		// 申领耗材按钮显示规则
		showMaterialBtn() {
			// 申领耗材按钮仅当处理人ID等于当前用户ID且工单状态为60时显示
			return this.orderStatus === 60 && String(this.currentUserId) === String(this.workOrderDetail.dealUserId);
		},
		// 误报反馈
		showMisreportBtn() {
			// 故障判定步骤才有
			return this.orderStatus === 30 || this.orderStatus === 40;
		}
	},
	methods: {
		// 根据 alarmLevel 返回对应背景色
		getLevelColor(level) {
			const colorMap = {
				1: '#52c41a',   // 普通故障
				2: '#faad14',   // 一般故障
				3: '#f5222d',   // 重大故障
				4: '#722ed1'    // 特殊故障
			};
			return colorMap[level] || 'transparent'; // 有其他故障情况默认透明色
		},
		// 根据状态更新进度条
		updateProgressSteps(status) {
			/**
			 * {
			 *   "id": 10,
			 *   "name": "工单已生成，待管养人员接警"
			 * },
			 * {
			 *   "id": 20,
			 *   "name": "管养人员已接警，待到达现场"
			 * },
			 * {
			 *   "id": 30,
			 *   "name": "管养人员已到达现场，待判定故障等级"
			 *},
			 *{
			 *   "id": 40,
			 *   "name": "管养人员判定误报，待厂家人员三遥确认"
			 *},
			 *{
			 *    "id": 50,
			 *    "name": "若特殊故障申请延期，待管理员审核"
			 *},
			 *{
			 *   "id": 60,
			 *   "name": "故障待处理"
			 *},
			 *{
			 *    "id": 80,
			 *    "name": "管养人员已处理故障，待系统确认"
			 *},
			 *{
			 *    "id": 99,
			 *    "name": "工单结束"
			 *}
			 */
				// 定义状态与激活步骤数的映射
			let activeCount = 0;
			switch (status) {
				case 10:  // 待接警
					activeCount = 1;
					break;
				case 20:  // 到达现场
					activeCount = 2;
					break;
				case 30:  // 故障判定
					activeCount = 3;
					break;
				case 99:  // 工单结束
					activeCount = 5;
					break;
				default:  // 其余均归为正在维修
					activeCount = 4;
					break;
			}
			// 更新每个步骤的激活状态
			this.progressSteps.forEach((step, index) => {
				step.active = index < activeCount;
			});
		},
		getWorkOrderDetail() {
			/**
			 * {
			 *   "order": {
			 *     "id": "c17aaba88967471387261635d898f694",
			 *     "paramType": 1,
			 *     "paramTypeName": "总配电",
			 *     "stationId": "0f217fdc69364eeeb89a6f8d6ae7a489",
			 *     "stationName": "海滨大道14号箱（罗马广场）",
			 *     "deviceId": "00000000000000000000000000000000",
			 *     "paramName": null,
			 *     "code": "202608050049",
			 *     "name": "失压",
			 *     "limit": false,
			 *     "limitTime": "2026-08-05 09:26:00",
			 *     "fireTime": "2026-08-05 09:26:00",
			 *     "dealUserId": "00000000000000000000000000000000",
			 *     "dealUserName": null,
			 *     "receiveTime": "0001-01-01 00:00:00",
			 *     "arriveTime": "0001-01-01 00:00:00",
			 *     "misReport": false,
			 *     "alarmLevel": 0,
			 *     "alarmLevelName": "",
			 *     "levelTime": "0001-01-01 00:00:00",
			 *     "remoteMisReport": false,
			 *     "remoteMisReportTime": "0001-01-01 00:00:00",
			 *     "remoteUserId": "00000000000000000000000000000000",
			 *     "remoteUserName": null,
			 *     "isDelay": false,
			 *     "delayDays": 0,
			 *     "delayContent": null,
			 *     "delayTime": "0001-01-01 00:00:00",
			 *     "dealContent": null,
			 *     "dealTime": "0001-01-01 00:00:00",
			 *     "confirmDelay": false,
			 *     "confirmDelayDays": 0,
			 *     "confirmDelayContent": null,
			 *     "confirmDelayUserId": "00000000000000000000000000000000",
			 *     "confirmDelayUserName": null,
			 *     "confirmDelayTime": "0001-01-01 00:00:00",
			 *     "systemConfirmDone": false,
			 *     "systemConfirmTime": "0001-01-01 00:00:00",
			 *     "status": 10,
			 *     "statusName": "已生成",
			 *     "alarmStart": "2026-08-05 09:25:09",
			 *     "alarmEnd": "2026-08-05 09:25:09",
			 *     "alarmContent": [
			 *       "失压"
			 *     ]
			 *   },
			 *   "logs": [
			 *     {
			 *       "id": "6e05e1d189724cbc8b364b12684dfab8",
			 *       "content": "系统生成工单，待管养人员接警",
			 *       "isComment": false,
			 *       "limit": false,
			 *       "limitTime": "2026-08-05 09:26:00",
			 *       "isOver": false,
			 *       "startTime": "2026-08-05 09:26:00",
			 *       "endTime": "2026-08-05 09:26:00",
			 *       "status": 10,
			 *       "statusName": "已生成",
			 *       "userId": "00000000000000000000000000000000",
			 *       "userName": null,
			 *       "imageIds": []
			 *     }
			 *   ],
			 *   "isDone": false,
			 *   "isWorker": true,
			 *   "alarms": [
			 *     {
			 *       "id": "2684776495364de7b9a3a10d1642693e",
			 *       "type": 11,
			 *       "name": "失压",
			 *       "extra": null,
			 *       "startTime": "2026-08-05 09:25:09",
			 *       "paramId": "47f0bd6949c84399a5dc42eafc68f09e",
			 *       "paramName": "总配电",
			 *       "paramType": 1,
			 *       "paramTypeName": null,
			 *       "done": false,
			 *       "doneTime": "0001-01-01 00:00:00",
			 *       "deviceId": "00000000000000000000000000000000"
			 *     }
			 *   ],
			 *   "pos": {
			 *     "lat": 22.776447069514028,
			 *     "lng": 115.36310643899265
			 *   },
			 *   "levels": {
			 *     "1": 0,
			 *     "2": 0,
			 *     "3": 0
			 *   }
			 * }
			 */
			return new Promise((resolve, reject) => {
				request({
					url: '/station/Maintance/FindWorkOrder',
					method: 'POST',
					data: {orderId: this.orderId}
				}).then(res => {
					console.log(base64Decode(res.data.data));
					const payload = res.data;
					if (payload && payload.data) {
						const data = JSON.parse(base64Decode(payload.data));
						this.workOrderBase.statusName = this.statusNameMap[data.order.alarmLevel] || '';
						this.workOrderBase.workOrderId = data.order.code || '';
						this.workOrderBase.stationName = data.order.stationName || '';
						this.workOrderBase.property = ((this.paramTypeMap[data.order.paramType] || '') + (data.order.paramName || '')) || '';
						this.workOrderBase.content = formatAlarmContent(data.alarms[0]?.extra, data.alarms[0]?.paramType) || '';
						this.workOrderBase.alarmLevel = data.order.alarmLevel || 0;
						this.workOrderDetail.admin = data.order.confirmDelayUserName || '';
						this.workOrderDetail.responsiblePerson = data.order.dealUserName || '';
						this.workOrderDetail.startTime = data.order.fireTime || '';
						this.workOrderDetail.endTime = data.order.limitTime || '';
						this.orderStatus = data.order.status; // 工单状态
						this.updateProgressSteps(data.order.status); // 更新进度条
						this.workOrderDetail.dealUserId = data.order.dealUserId || '';

						// 判断当前用户是否是处理人
						this.isResponsible = !this.workOrderDetail.dealUserId || (this.currentUserId === this.workOrderDetail.dealUserId);

						// 日志列表处理（倒序排列）
						let logs = data.logs || [];
						if (logs.length > 0) {
							logs.sort((a, b) => {
								const getTime = (timeStr) => {
									if (!timeStr || timeStr === '0001-01-01 00:00:00') return 0;
									return new Date(timeStr).getTime();
								};
								return getTime(b.endTime) - getTime(a.endTime);
							});
						}
						this.logs = logs;

						this.delayTime = data.order.delayTime || ''; // 延期时间用于申请延期按钮

						// 获取站点位置信息用于路线导航功能
						const posLat = Number(data.pos && data.pos.lat);
						const posLng = Number(data.pos && data.pos.lng);
						if (data.pos && Number.isFinite(posLat) && Number.isFinite(posLng)) {
							// 接口返回的是 BD-09 百度坐标：保留原始值（百度地图直接用），同时转 GCJ-02（高德/腾讯/小程序内置地图用）
							this.stationLocationBd09 = {lat: posLat, lng: posLng};
							const gcj = bd09ToGcj02(posLng, posLat);
							this.stationLocation = {lat: gcj.lat, lng: gcj.lng};
						}
						resolve(res);
					} else {
						uni.showToast({title: '获取工单详情数据失败，请重试', icon: 'none'});
						reject(new Error('获取工单详情数据失败'));
					}
				}).catch(err => {
					console.error('获取工单详情错误', err.message);
					reject(err);
				})
			});
		},
		// ========== 时间线日志辅助 ==========
		// 获取日志状态标签
		getCommentFlag(status, content) {
			if (status === 60) {
				if (content.includes('修复')) return '已修复';
				if (content.includes('延期')) return '延期申请';
			}
			const statusMap = {
				10: '接警', 20: '到达现场', 30: '故障判定',
				40: '误报', 50: '延期审核', 80: '已修复', 99: '已结束'
			};
			return statusMap[status] || '';
		},
		// 获取日志状态颜色 (status=30(故障判定)为红色，其他绿色)
		getLogStatusColor(status, content) {
			if (status === 30) return 'red';
			if (status === 60 && content.includes('修复')) return 'green';
			if (status === 60 && content.includes('延期')) return 'green';
			return 'green';
		},
		// 获取图片URL
		getImageUrl(imageId) {
			const token = uni.getStorageSync('authToken') || ''; // 从本地存储中获取 token
			if (!token) {
				console.warn('未获取到 token，图片可能无法显示');
			}
			return `https://www.amdm.top/api/center/station/config/ViewImage?id=${imageId}&auth=${token}`;
		},
		previewImage(imageIds, currentIndex) {
			// 构造所有图片的 URL 数组
			const urls = imageIds.map(id => this.getImageUrl(id));
			uni.previewImage({
				current: urls[currentIndex],  // 当前显示图片的 URL
				urls: urls,
				indicator: 'number'           // 显示页码
			});
		},

		// ========== 弹窗操作 ==========
		openActionPopup(type) {
			// 确认延期
			if (type === 'delay' && this.orderStatus === 50) {
				uni.showModal({
					title: '确认延期',
					content: '确定要同意该工单的延期申请吗？',
					success: (res) => {
						if (res.confirm) {
							this.submitDelayConfirm();
						}
					}
				});
				return;
			}

			this.actionType = type;
			this.actionImages = [];
			this.actionContent = '';
			this.selectedFaultLevel = 0;

			switch (type) {
				case 'call':
					if (this.orderStatus === 30) {
						this.actionTitle = '故障判定';
						this.actionPlaceholder = '输入故障现象';
						this.selectedFaultLevel = 0;
						this.selectedSpecificFault = '';
						this.pickedDelayDate = '';
						this.getFaultTypeList();
					} else {
						// 10 接警 / 20 到达现场
						this.actionTitle = this.callBtnText;
						this.actionPlaceholder = '';
						this.actionContent = this.callBtnText === '接警' ? '已接警' : '已到现场';
					}
					break;
				case 'delay':
					this.actionTitle = '申请延期';
					this.actionContent = '';
					this.delayDate = '';
					break;

				case 'material':
					this.actionTitle = '申领耗材';
					this.materialCount = '';
					this.materialDesc = '';
					this.selectedCategory = null;
					this.selectedMaterial = null;
					this.materialList = [];
					this.selectedOrderType = '旧工单，固定流程工单';
					this.getMaterialCategories();   // 请求分类
					break;

				case 'misreport':
					this.actionTitle = '误报反馈';
					this.actionContent = '误报反馈';
					break;

				default:
					break;

			}
			this.$refs.actionPopup.open();
		},
		closeActionPopup() {
			this.$refs.actionPopup.close();
		},
		// 图片上传
		chooseActionImage() {
			const count = 3 - this.actionImages.length;
			uni.chooseImage({
				count: count,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.actionImages = this.actionImages.concat(res.tempFilePaths);
				}
			});
		},
		removeActionImage(index) {
			this.actionImages.splice(index, 1);
		},
		//获取故障列表
		getFaultTypeList() {
			request({
				url: '/station/Maintance/QueryAlarmLevels',
				method: 'POST',
				data: {}
			}).then(res => {
				const payload = res.data;
				if (payload && payload.data) {
					const faultTypeData = JSON.parse(base64Decode(payload.data));
					this.allFaultTypes = faultTypeData.map(item => ({
						name: item.name,
						alarmLevel: item.alarmLevel,
						id: item.id
					}));
				}
			}).catch(err => {
				console.error('获取故障列表失败', err.message);
			});
		},
		// 点击故障等级标签
		handleLevelSelect(val) {
			this.selectedFaultLevel = val;
			this.selectedSpecificFault = '';
			this.selectedFaultIndex = -1;
			this.actionContent = '';
			this.pickedDelayDate = '';
		},
		// 动态生成当前等级的下拉选项 (故障名称 + 其它)
		getCurrentFaultOptions() {
			if (!this.selectedFaultLevel) return [];
			// 从 allFaultTypes 中过滤出对应等级的名称
			const list = this.allFaultTypes
				.filter(item => item.alarmLevel === this.selectedFaultLevel)
				.map(item => item.name);
			return [...list, '其他'];
		},
		// 下拉菜单选中事件
		onFaultOptionChange(e) {
			const options = this.getCurrentFaultOptions();
			const val = options[e.detail.value];
			this.selectedSpecificFault = val;
			this.selectedFaultIndex = e.detail.value;
			// 如果选择了 "其它"，textarea 内容清空；否则显示选中的具体故障
			this.actionContent = (val === '其他') ? '' : val;
		},
		// 获取故障处理时间提示文案
		getLevelInfo(level) {
			const map = {
				1: '工单处理时间6小时',
				2: '工单处理时间24小时',
				3: '工单处理时间72小时',
				4: '请向管理员说明情况，申请工单处理时间'
			};
			return map[level] || '';
		},
		//格式化时间
		formatDateTime(date) {
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			const h = String(date.getHours()).padStart(2, '0');
			const min = String(date.getMinutes()).padStart(2, '0');
			const s = String(date.getSeconds()).padStart(2, '0');
			return `${y}-${m}-${d} ${h}:${min}:${s}`;
		},
		// 耗材分类
		onCategoryChange(e) {
			this.selectedCategory = this.materialCategories[e.detail.value];
			if (this.selectedCategory) {
				this.getMaterialList(this.selectedCategory.id);
			} else {
				this.materialList = [];
				this.selectedMaterial = null;
			}
		},
		onMaterialChange(e) {
			this.selectedMaterial = this.materialList[e.detail.value] || null;
		},
		onOrderTypeChange(e) {
			this.selectedOrderType = this.orderTypes[e.detail.value];
		},
		// ========== 提交各类操作接口 ==========
		submitActionPopup() {
			if (!this.actionContent && this.actionImages.length === 0 && this.actionType !== 'material') {
				uni.showToast({title: '请填写内容或上传图片', icon: 'none'});
				return;
			}

			switch (this.actionType) {
				case 'call':
					/** 接警
					 * 到达现场
					 * 故障判定
					 * */
					if (this.orderStatus === 30 && !this.selectedFaultLevel) {
						uni.showToast({title: '请选择故障级别', icon: 'none'});
						return;
					}
					this.submitCallFlow();
					break;
				case 'delay':
					if (this.orderStatus === 60) {
						this.submitDelay(); // 申请延期
					} else if (this.orderStatus === 50) {
						this.submitDelayConfirm(); // 确认延期
					}
					break;
				case 'material':
					this.submitMaterial();
					break;
				case 'misreport':
					// 误报反馈
					this.submitMisreport();
					break;
				case 'repair':
					// 已修复
					this.submitRepair();
					break;
				default:
					break;
			}
		},

		// 提交接警/到达现场/故障判定
		submitCallFlow() {
			// 接警和到达现场
			if (this.orderStatus !== 30) {
				let url = '';
				let params = {id: this.orderId, content: this.actionContent};
				if (this.orderStatus === 10) url = '/station/Maintance/ReceiveOrder';
				else if (this.orderStatus === 20) url = '/station/Maintance/ArrivePlace';
				this.doActionRequest(url, params);
				return;
			}

			// 故障判定
			if (!this.selectedFaultLevel) {
				uni.showToast({title: '请选择故障级别', icon: 'none'});
				return;
			}

			// 特殊故障 (Level 4) 强制校验延期时间
			if (this.selectedFaultLevel === 4 && !this.pickedDelayDate) {
				uni.showToast({title: '特殊故障请选择延期时间', icon: 'none'});
				return;
			}

			// 计算 delay 值
			let delayVal = '';
			if (this.selectedFaultLevel === 4) {
				// 特殊故障取用户选择的时间
				delayVal = this.pickedDelayDate + ':00';
			} else {
				// 普通故障取 开始时间 + 对应处理时间(6/24/72小时)
				const startTime = new Date(this.workOrderDetail.startTime);
				let hoursToAdd = 0;
				if (this.selectedFaultLevel === 1) hoursToAdd = 6;
				else if (this.selectedFaultLevel === 2) hoursToAdd = 24;
				else if (this.selectedFaultLevel === 3) hoursToAdd = 72;
				startTime.setHours(startTime.getHours() + hoursToAdd);
				delayVal = this.formatDateTime(startTime);
			}

			// 组装参数
			const url = '/station/Maintance/AlarmCheck';
			const params = {
				id: this.orderId,
				content: this.actionContent,
				alarmLevel: this.selectedFaultLevel,
				misreport: false,
				delay: delayVal
			};
			this.doActionRequest(url, params);
		},

		// 提交申请延期
		submitDelay() {
			const url = '/station/Maintance/RequestDelay';
			this.doActionRequest(url, {
				orderId: this.orderId,
				content: this.actionContent,
				delay: this.delayDate + ':00'
			});
		},

		// 确认延期申请
		submitDelayConfirm() {
			if (!this.delayTime) {
				uni.showToast({title: '未获取到延期时间，请刷新重试', icon: 'none'});
				return;
			}
			const url = '/station/Maintance/ConfirmDelay';
			const params = {
				orderId: this.orderId,
				content: '管理员确认延期',
				confirm: true,
				delay: this.delayTime
			};
			this.doActionRequest(url, params);
		},

		// 提交申领耗材
		submitMaterial() {
			// 校验
			if (!this.selectedCategory) {
				uni.showToast({title: '请选择耗材分类', icon: 'none'});
				return;
			}
			if (!this.selectedMaterial) {
				uni.showToast({title: '请选择具体物料', icon: 'none'});
				return;
			}
			if (!this.materialCount || parseInt(this.materialCount) <= 0) {
				uni.showToast({title: '请输入有效的申领数量', icon: 'none'});
				return;
			}
			if (parseInt(this.materialCount) > this.selectedMaterial.amount) {
				uni.showToast({title: '库存不足，请重新输入', icon: 'none'});
				return;
			}

			const url = '/station/asset/UseMaterial';
			this.doActionRequest(url, {
				materialId: this.selectedMaterial.id,          // 物料ID
				amount: parseInt(this.materialCount),          // 申领数量（数字）
				orderFlag: this.selectedOrderType === '旧工单，固定流程工单' ? 1 : 2, // 工单类型
				orderId: this.orderId,                         // 工单ID
				remark: this.materialDesc || ''                // 说明
			});
		},

		// 提交误报反馈
		submitMisreport() {
			const url = '/station/Maintance/MisReport';
			this.doActionRequest(url, {
				orderId: this.orderId,
				content: this.actionContent
			});
		},

		// 提交已修复
		submitRepair() {
			if (!this.actionContent) {
				uni.showToast({title: '请填写修复情况', icon: 'none'});
				return;
			}

			const url = '/station/Maintance/WorkDone';
			this.doActionRequest(url, {
				orderId: this.orderId,
				content: this.actionContent
			});
		},

		// 通用提交封装
		async doActionRequest(url, params) {
			uni.showLoading({title: '提交中...'});
			try {
				const res = await request({
					url: url,
					method: 'POST',
					data: params
				});
				console.log(res);
				uni.hideLoading();
				if (res.data.code === 0) {
					uni.showToast({title: '操作成功', icon: 'success'});
					this.closeActionPopup();

					// 必须先等待详情刷新完毕，拿到最新的 logs
					await this.getWorkOrderDetail();

					// 处理图片上传
					if (this.actionImages.length > 0 && this.actionType !== 'material') {
						await this.uploadActionImages();
						// 图片上传成功后，再次刷新以显示图片
						await this.getWorkOrderDetail();
					}
					return true;
				} else {
					uni.showToast({title: res.data.message || '操作失败', icon: 'none'});
					return false;
				}
			} catch (err) {
				uni.hideLoading();
				console.error(err);
				uni.showToast({title: '网络异常', icon: 'none'});
				return false;
			}
		},
		async uploadActionImages() {
			// 没有图片直接退出
			if (this.actionImages.length === 0) return;

			// 从当前最新的 logs 中，找出 isOver===false 的记录，取第一条的 ID
			const targetLog = this.logs.find(log => log.isOver === false);

			if (!targetLog) {
				uni.showToast({title: '未找到关联的日志记录，图片无法上传', icon: 'none'});
				console.warn('未找到 isOver=false 的日志，无法关联图片');
				return;
			}

			const logId = targetLog.id;
			const images = [...this.actionImages];

			uni.showLoading({title: '上传图片中...'});
			try {
				const uploadTasks = images.map((imgPath) => {
					return new Promise((resolve, reject) => {
						uni.uploadFile({
							url: `https://www.amdm.top/api/center/station/Maintance/SaveWorkImage`,
							filePath: imgPath,
							name: 'pic',  // 文件流字段
							formData: {
								id: logId   // 填入刚找到的 logId
							},
							header: {
								'auth': uni.getStorageSync('authToken'),
								'Custid': String(uni.getStorageSync('curCust')),
								'Lang': 'zh_cn',
								'Apptype': uni.getStorageSync('curApp') || 'road'
							},
							success: (uploadRes) => {
								const data = JSON.parse(uploadRes.data);
								if (data.code === 0) {
									resolve(data);
								} else {
									reject(new Error(data.message || '图片上传失败'));
								}
							},
							fail: (err) => {
								reject(err);
							}
						});
					});
				});

				await Promise.all(uploadTasks);
				uni.hideLoading();
				uni.showToast({title: '图片上传成功', icon: 'success'});
				this.actionImages = []; // 上传成功后清空本地数组，防止重复提交

			} catch (e) {
				uni.hideLoading();
				uni.showToast({title: e.message || '部分图片上传失败', icon: 'none'});
				console.error('图片上传错误', e.message);
			}
		},

		// 获取耗材分类
		getMaterialCategories() {
			/**
			 * [
			 *   {
			 *     "id": "976c93d9ad6940408397c8e85d8c3135",
			 *     "parentId": "00000000000000000000000000000000",
			 *     "code": "1",
			 *     "name": "控制开关"
			 *   }
			 * ]
			 */
			request({
				url: '/station/asset/QueryCategorys',
				method: 'POST',
				data: {}
			}).then(res => {
				if (res.data.data) {
					this.materialCategories = JSON.parse(base64Decode(res.data.data));
				}
			}).catch(err => console.error('获取耗材分类失败', err.message));
		},
		getMaterialList(categoryId) {
			/**
			 * {
			 *   "count": 1,
			 *   "list": [
			 *     {
			 *       "id": "856ac03f93094a2ea3ce637660dc2ddc",
			 *       "categoryId": "976c93d9ad6940408397c8e85d8c3135",
			 *       "categoryName": "控制开关",
			 *       "code": "10",
			 *       "name": "小开关",
			 *       "model": "1002",
			 *       "unit": "个",
			 *       "amount": 100
			 *     }
			 *   ]
			 * }
			 */
			if (!categoryId) {
				this.materialList = [];
				this.selectedMaterial = null;
				return;
			}
			request({
				url: '/station/asset/QueryMaterial',
				method: 'POST',
				data: {categoryId: categoryId}
			}).then(res => {
				if (res.data.data) {
					const data = JSON.parse(base64Decode(res.data.data));
					this.materialList = data.list || [];
					this.selectedMaterial = this.materialList.length > 0 ? this.materialList[0] : null;
				}
			}).catch(err => console.error('获取物料列表失败', err));
		},
		// ========== 底部操作按钮 ==========
		// 已修复
		openRepairPopup() {
			this.actionType = 'repair';
			this.actionImages = [];
			this.actionContent = '';
			this.actionTitle = '确认修复';
			this.actionPlaceholder = '请输入故障修复情况说明';
			this.$refs.actionPopup.open();
		},
		// 打开详情反馈反馈弹窗
		openDetailFeedbackPopup() {
			this.$refs.detailFeedbackPopup.open();
		},
		// 提交详情反馈
		async submitDetailFeedback({content, images}) {
			/**
			 * [
			 *     {
			 *       "id": "6e05e1d189724cbc8b364b12684dfab8",
			 *       "content": "系统生成工单，待管养人员接警",
			 *       "isComment": false,
			 *       "limit": false,
			 *       "limitTime": "2026-08-05 09:26:00",
			 *       "isOver": false,
			 *       "startTime": "2026-08-05 09:26:00",
			 *       "endTime": "2026-08-05 09:26:00",
			 *       "status": 10,
			 *       "statusName": "已生成",
			 *       "userId": "00000000000000000000000000000000",
			 *       "userName": null,
			 *       "imageIds": []
			 *     }
			 *   ]
			 */
			if (!content && images.length === 0) {
				uni.showToast({title: '请填写内容或选择图片', icon: 'none'});
				return;
			}
			try {
				uni.showLoading({title: '提交中...'});
				const commentRes = await request({
					url: '/station/Maintance/SaveComment',
					method: 'POST',
					data: {
						id: this.orderId,    // 工单ID
						content: content.trim()
					}
				});

				if (commentRes.data.code !== 0) {
					uni.hideLoading();
					uni.showToast({title: commentRes.data.message || '提交反馈失败', icon: 'none'});
					return;
				}
				const feedbackData = JSON.parse(base64Decode(commentRes.data.data));
				// 取最后一项的id
				const feedbackId = feedbackData[feedbackData.length - 1].id;
				// 上传图片
				if (images.length > 0) {
					const uploadTasks = images.map((imgPath) => {
						return new Promise((resolve, reject) => {
							uni.uploadFile({
								url: `https://www.amdm.top/api/center/station/Maintance/SaveWorkImage`,
								filePath: imgPath,
								name: 'pic',  // 后端接收的文件字段名
								formData: {
									id: feedbackId  // 反馈记录ID
								},
								header: {
									'auth': uni.getStorageSync('authToken'),
									'Custid': String(uni.getStorageSync('curCust')),
									'Lang': 'zh_cn',
									'Apptype': uni.getStorageSync('curApp') || 'road'
								},
								success: (uploadRes) => {
									const data = JSON.parse(uploadRes.data);
									if (data.code === 0) {
										resolve(data);
									} else {
										reject(new Error(data.message || '图片上传失败'));
									}
								},
								fail: (err) => {
									reject(err);
								}
							});
						});
					});

					await Promise.all(uploadTasks);
				}

				uni.hideLoading();
				uni.showToast({title: '反馈提交成功', icon: 'success'});

				// 刷新工单详情界面
				await this.getWorkOrderDetail();

			} catch (e) {
				uni.hideLoading();
				uni.showToast({title: e.message || '提交失败', icon: 'none'});
				console.error('反馈提交错误', e.message);
			}
		},
		goToMaterialRecordPage() {
			uni.navigateTo({
				url: `/pages/workOrder/components/woDetailComponents/materialRecord?orderId=${this.orderId}`
			});
		},
		// 打开导航地图弹窗
		openMapSelectionPopup() {
			// #ifdef MP
			// 小程序端：直接打开内置地图
			if (!openMiniMap(this.stationLocation, this.workOrderBase.stationName || '站点位置')) {
				uni.showToast({ title: '未获取到站点位置', icon: 'none' });
			}
			// #endif

			// #ifndef MP
			// 非小程序端：弹出地图选择弹窗
			this.$refs.mapSelectionPopup.open();
			// #endif
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

			navigateWithMap(mapName, {
				dest: this.stationLocation,        // GCJ-02
				destBd: this.stationLocationBd09,  // BD-09（百度地图使用）
				destName: this.workOrderBase.stationName || '站点位置'
			});
		},
	}
}
</script>

<style lang="scss" scoped>
/* 页面整体浅色背景 */
.page-wrapper {
	min-height: 100vh;
	background-color: var(--bg-page);
	padding: 40rpx 40rpx 170rpx 40rpx;
	box-sizing: border-box;
}

/* 基本信息卡片主体 */
.header-card {
	background: var(--bg-card);
	border-radius: 32rpx;
	padding: 48rpx 40rpx;
	position: relative;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 32rpx;
}

/* 右上角状态标签  */
.status-badge {
	position: absolute;
	top: 0;
	right: 0;
	color: #ffffff;
	font-size: 26rpx;
	font-weight: 500;
	padding: 12rpx 32rpx 12rpx 24rpx;
	border-radius: 0 32rpx 0 32rpx;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.15);
}

/* 信息行布局 */
.info-row {
	display: flex;
	align-items: flex-start;
	margin-bottom: 14rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

/* 左侧标签 */
.label {
	width: 140rpx;
	color: var(--text-secondary);
	font-size: 28rpx;
	flex-shrink: 0;
	margin-right: 24rpx;
}

/* 右侧值 */
.value {
	flex: 1;
	color: var(--text-primary);
	font-size: 28rpx;
	line-height: 1.5;
	word-break: break-all;
}

/* ================== 工单详情卡片 ================== */
.detail-card {
	background: var(--bg-card);
	border-radius: 32rpx;
	padding: 40rpx 30rpx 20rpx 30rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 40rpx;
}

/* 进度条区域 */
.progress-steps {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 10rpx 0 40rpx 0;
	border-bottom: 2rpx solid var(--border-color);
	margin-bottom: 30rpx;
}

.step-group {
	display: flex;
	align-items: flex-start;
	justify-content: center;
}

.step-item {
	display: flex;
	flex-direction: column;
	align-items: center;

	.step-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: var(--bg-card);
		border: 2rpx solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
		transition: all 0.3s;

		&.is-active {
			background-color: #2b6df6;
			border-color: #2b6df6;
			box-shadow: 0 4rpx 12rpx rgba(43, 109, 246, 0.3);
		}

		.step-img {
			width: 44rpx;
			height: 44rpx;
		}
	}

	.step-text {
		font-size: 22rpx;
		color: var(--text-secondary);

		&.is-active {
			color: var(--text-primary);
			font-weight: 600;
		}
	}
}

.step-arrow {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 8rpx;
	margin-top: 26rpx;

	.arrow-img {
		width: 24rpx;
		height: 24rpx;
	}
}

/* 信息区域  */
.info-section {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: 0 0 30rpx 0;
	border-bottom: 2rpx solid var(--border-color);
	margin-bottom: 30rpx;

	.info-left {
		flex: 1;
		padding-right: 20rpx;

		.info-item {
			width: 100%;
			display: flex;
			align-items: center;
			margin-bottom: 24rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.info-label {
				width: 120rpx;
				color: var(--text-secondary);
				font-size: 28rpx;
				flex-shrink: 0;
			}

			.info-value {
				color: var(--text-primary);
				font-size: 28rpx;
			}
		}
	}

	.info-right {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-end;
		padding-top: 6rpx;
		gap: 20rpx;

		.action-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 10rpx 20rpx;
			background-color: var(--bg-accent);
			border-radius: 8rpx;
			white-space: nowrap;

			.btn-icon {
				width: 28rpx;
				height: 28rpx;
				margin-right: 8rpx;
				flex-shrink: 0;
			}

			text {
				font-size: 26rpx;
				color: var(--text-primary);
			}
		}
	}
}

/* 时间线区域 */
.timeline-section {
	padding: 0 10rpx;
	position: relative;

	.timeline-item {
		position: relative;
		padding-left: 60rpx;
		padding-bottom: 40rpx;
		z-index: 0;

		&:last-child {
			padding-bottom: 0;
		}

		&::before {
			content: '';
			position: absolute;
			left: 20rpx;
			top: 40rpx;
			bottom: -20rpx;
			width: 4rpx;
			background-color: var(--border-color);
			z-index: 1;
		}

		&:last-child::before {
			display: none;
		}
	}

	.timeline-dot {
		position: absolute;
		left: 6rpx;
		top: 20rpx;
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		z-index: 2;
		box-sizing: border-box;
		background-color: var(--bg-card);

		&.dot-blue {
			background-color: #2b6df6;
			border: 6rpx solid #dbe5f8;
		}

		&.dot-gray {
			background-color: var(--bg-soft);
			border: 6rpx solid var(--border-color);
		}
	}

	.timeline-bubble {
		position: relative;
		background: var(--bg-card);
		border-radius: 16rpx;
		padding: 24rpx;
		box-shadow: 0 4rpx 20rpx var(--bg-box-shadow);

		&::before {
			content: '';
			position: absolute;
			left: -16rpx;
			top: 30rpx;
			width: 0;
			height: 0;
			border-top: 10rpx solid transparent;
			border-bottom: 10rpx solid transparent;
			border-right: 16rpx solid var(--bg-card);
			z-index: 3;
		}
	}

	.bubble-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;

		.header-left {
			display: flex;
			align-items: center;

			.user-name {
				font-size: 30rpx;
				font-weight: 600;
				color: var(--text-primary);
				margin-right: 12rpx;
			}

			.user-role {
				font-size: 24rpx;
				color: var(--text-secondary);
			}
		}

		.status-text {
			font-size: 28rpx;
			font-weight: 500;

			&.green {
				color: #52c41a;
			}

			&.red {
				color: #f5222d;
			}
		}
	}

	.content-desc {
		font-size: 28rpx;
		color: var(--text-secondary);
		margin-bottom: 20rpx;
		line-height: 1.4;
	}

	.grid-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-bottom: 20rpx;

		.grid-item {
			position: relative;
			width: 160rpx;
			height: 160rpx;
			border-radius: 12rpx;
			background: var(--bg-soft);
			overflow: hidden;

			.grid-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			&.add-box {
				background: transparent;
				border: 4rpx dashed var(--border-color);
				display: flex;
				align-items: center;
				justify-content: center;
				box-sizing: border-box;

				.icon-plus {
					font-size: 48rpx;
					color: var(--text-secondary);
					line-height: 1;
					font-weight: 300;
				}
			}
		}
	}

	.bubble-bottom {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-top: 4rpx;

		.overtime-text {
			font-size: 26rpx;
			color: #f5222d;
		}

		.time-text {
			font-size: 24rpx;
			color: var(--text-secondary);
		}
	}
}

/* ================== 底部操作卡片 ================== */
.operation-card {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	margin-top: 10rpx;

	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	width: 100%;

	background-color: var(--bg-page);
	padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);

	.op-btn {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 16rpx 0;
		background: var(--bg-card);
		border-radius: 16rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
		border: 2rpx solid var(--border-color);
		margin: 0 10rpx;

		.op-icon {
			width: 34rpx;
			height: 34rpx;
			margin-right: 10rpx;
		}

		text {
			font-size: 24rpx;
			color: var(--text-primary);
			font-weight: 500;
		}
	}
}

.feedback-popup {
	width: 640rpx;
	background: var(--bg-card);
	border-radius: 24rpx;
	padding: 40rpx 32rpx 32rpx 32rpx;
	box-sizing: border-box;

	.popup-header {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 30rpx;

		.popup-title {
			font-size: 34rpx;
			font-weight: 600;
			color: var(--text-primary);
		}

		.popup-close {
			position: absolute;
			right: -10rpx;
			top: -10rpx;
			padding: 10rpx;
		}
	}

	.popup-body {
		.feedback-textarea {
			width: 100%;
			height: 240rpx;
			background: var(--bg-soft);
			border-radius: 12rpx;
			padding: 20rpx;
			box-sizing: border-box;
			font-size: 28rpx;
			color: var(--text-primary);
			border: 2rpx solid transparent;
			transition: all 0.3s;
			margin-bottom: 10rpx;

			&:focus {
				border-color: #2b6df6;
				background: var(--bg-card);
			}
		}

		.feedback-placeholder {
			color: var(--text-secondary);
		}

		/* === 故障判定标签 === */
		.fault-tags {
			display: flex;
			justify-content: center;
			flex-wrap: nowrap;
			gap: 16rpx;
			margin-bottom: 20rpx;

			.fault-tag {
				padding: 10rpx;
				background: var(--bg-soft);
				border-radius: 8rpx;
				color: var(--text-primary);
				font-size: 24rpx;

				&.active {
					background: #2b6df6;
					color: #fff;
				}
			}
		}

		/* === 申领耗材行 === */
		.material-row {
			display: flex;
			align-items: center;
			margin-bottom: 24rpx;

			.mat-label {
				width: 150rpx;
				color: var(--text-primary);
				font-size: 28rpx;
			}

			.picker-box {
				flex: 1;
				padding: 12rpx 20rpx;
				background: var(--bg-soft);
				border-radius: 8rpx;
				color: var(--text-primary);
				font-size: 28rpx;
			}

			.mat-input {
				flex: 1;
				background: var(--bg-soft);
				padding: 12rpx 20rpx;
				border-radius: 8rpx;
				font-size: 28rpx;
				color: var(--text-primary);
			}
		}

		/* === 延期时间选择 === */
		.delay-date-row {
			display: flex;
			align-items: center;
			background: var(--bg-soft);
			padding: 20rpx;
			border-radius: 12rpx;
			margin-bottom: 24rpx;

			.delay-date-text {
				color: var(--text-primary);
				font-size: 28rpx;
			}
		}

		/* === 图片网格 === */
		.feedback-images {
			display: flex;
			flex-wrap: wrap;
			gap: 20rpx;
			margin-top: 16rpx;

			.img-item {
				position: relative;
				width: 160rpx;
				height: 160rpx;
				border-radius: 12rpx;
				overflow: hidden;

				.img-preview {
					width: 100%;
					height: 100%;
					background: var(--bg-soft);
				}

				.img-delete {
					position: absolute;
					top: 0;
					right: 0;
					background: rgba(0, 0, 0, 0.6);
					width: 40rpx;
					height: 40rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 0 12rpx 0 12rpx;
				}

				&.add-box {
					background: transparent;
					border: 4rpx dashed var(--border-color);
					display: flex;
					align-items: center;
					justify-content: center;
					box-sizing: border-box;
				}
			}
		}
	}

	.submit-btn {
		margin-top: 40rpx;
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: #2b6df6;
		color: #ffffff;
		font-size: 32rpx;
		border-radius: 16rpx;

		&::after {
			border: none;
		}
	}
}

.level-info {
	display: flex;
	align-items: center;
	background: var(--bg-accent);
	padding: 12rpx 20rpx;
	border-radius: 8rpx;
	margin-bottom: 16rpx;

	.level-info-text {
		font-size: 26rpx;
		color: var(--text-primary);
	}
}

.delay-date-row {
	display: flex;
	align-items: center;
	background: var(--bg-soft);
	padding: 20rpx;
	border-radius: 12rpx;
	margin-bottom: 24rpx;

	.delay-date-text {
		color: var(--text-primary);
		font-size: 28rpx;
	}
}

.fault-tags {
	display: flex;
	justify-content: flex-start;
	flex-wrap: nowrap;
	gap: 16rpx;
	margin-bottom: 20rpx;

	.fault-tag {
		padding: 10rpx 20rpx;
		background: var(--bg-soft);
		border-radius: 8rpx;
		color: var(--text-primary);
		font-size: 24rpx;

		&.active {
			background: #2b6df6;
			color: #fff;
		}
	}
}

.fault-select-row {
	display: flex;
	align-items: center;
	background: var(--bg-soft);
	border-radius: 12rpx;
	padding: 10rpx 20rpx;
	margin-bottom: 16rpx;

	.fs-label {
		width: 120rpx;
		font-size: 28rpx;
		color: var(--text-primary);
	}

	.fs-picker {
		flex: 1;
	}

	.picker-box {
		font-size: 28rpx;
		color: var(--text-primary);
		padding: 10rpx 0;
	}
}
</style>
