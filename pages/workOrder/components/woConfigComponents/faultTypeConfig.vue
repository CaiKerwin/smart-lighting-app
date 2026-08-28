<template>
	<view :class="themeClass" class="fault-type-config-container">
		<!-- 故障分类过滤标签 -->
		<scroll-view :show-scrollbar="false" class="filter-scroll" scroll-x>
			<view class="filter-tabs">
				<view
					v-for="(item, index) in tabList"
					:key="index"
					:class="{ active: activeTab === index }"
					class="tab-item"
					@click="activeTab = index"
				>
					{{ item }}
				</view>
			</view>
		</scroll-view>

		<!-- 故障列表区域 -->
		<scroll-view class="list-scroll" scroll-y>
			<view v-for="(item, index) in faultTypeList" :key="index" class="fault-card">
				<view class="card-info">
					<view class="info-row">
						<text class="info-label">名称</text>
						<text class="info-value">{{ item.name }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">级别</text>
						<text class="info-value level-text">{{ item.level }}</text>
					</view>
				</view>
				<view class="card-action">
					<button class="delete-btn" @click="deleteFaultType(index)">删除</button>
				</view>
			</view>
		</scroll-view>

		<!-- 添加故障按钮 -->
		<view class="fab-add-btn" @click="openAddFaultTypePopup">
			<uni-icons color="#fff" size="30" type="plusempty" />
		</view>

		<!-- 添加故障弹窗 -->
		<uni-popup ref="addFaultTypePopup" :mask-click="false" type="center">
			<view class="popup-content">
				<view class="popup-title">添加故障类型</view>
				<view class="popup-form">
					<!-- 故障类型 -->
					<view class="form-item">
						<text class="form-label">故障类型</text>
						<picker
							:range="levelOptions"
							class="form-picker"
							mode="selector"
							@change="onLevelChange"
						>
							<view class="picker-value">
								{{ levelOptions[addForm.alarmLevel - 1] || '请选择' }}
							</view>
						</picker>
					</view>
					<!-- 故障名称 -->
					<view class="form-item">
						<text class="form-label">故障名称</text>
						<input
							v-model="addForm.name"
							class="form-input"
							placeholder="请输入故障名称"
							placeholder-style="color:#999;"
						/>
					</view>
					<!-- 按钮 -->
					<view class="form-actions">
						<button class="btn-cancel" @click="closeAddFaultTypePopup">取消</button>
						<button class="btn-confirm" @click="submitAddFaultTypePopup">提交</button>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	data() {
		return {
			// 标签列表
			tabList: ['全部', '简单故障', '一般故障', '重大故障', '特殊故障'],
			activeTab: 0,
			// 原始故障列表
			allFaultTypes: [],

			alarmLevelMap: {
				1: '简单故障',
				2: '一般故障',
				3: '重大故障',
				4: '特殊故障'
			},
			// 新增故障
			levelOptions: ['简单故障', '一般故障', '重大故障', '特殊故障'],
			addForm: {
				name: '',
				alarmLevel: 1 // 默认简单故障
			}
		};
	},
	computed: {
		// 根据 activeTab 过滤并转换显示格式
		faultTypeList() {
			if (this.activeTab === 0) {
				// 全部：直接转换
				return this.allFaultTypes.map(item => ({
					...item,
					level: this.alarmLevelMap[item.alarmLevel]
				}));
			}
			// 按级别过滤
			const level = this.activeTab;
			return this.allFaultTypes
				.filter(item => item.alarmLevel === level)
				.map(item => ({
					...item,
					level: this.alarmLevelMap[item.alarmLevel]
				}));
		}
	},
	onLoad() {
		this.getFaultTypeList();
	},
	methods: {
		// 获取故障列表
		getFaultTypeList() {
			/**
			 * [
			 *   {
			 *     "id": "86a1013482a84195bc703e17d6789abf",
			 *     "alarmLevel": 1,
			 *     "name": "AA"
			 *   },
			 *   {
			 *     "id": "54aa1920456444118dd1e26184f73d2d",
			 *     "alarmLevel": 1,
			 *     "name": "刮风"
			 *   },
			 *   {
			 *     "id": "3f82f76fdf864cbf9c5a08b17ebe9fd9",
			 *     "alarmLevel": 4,
			 *     "name": "暴雨"
			 *   },
			 *   {
			 *     "id": "60c3f4998d7c44a489ac21fd7ecdff1b",
			 *     "alarmLevel": 1,
			 *     "name": "跳闸"
			 *   }
			 * ]
			 */
			request({
				url: '/station/Maintance/QueryAlarmLevels',
				method: 'POST',
				data: {}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				const payload = res.data;
				if (payload && payload.data) {
					const faultTypeData = JSON.parse(base64Decode(payload.data));
					this.allFaultTypes = faultTypeData.map(item => ({
						name: item.name,
						alarmLevel: item.alarmLevel,
						id: item.id // 用于删除类型功能
					}));
				} else {
					uni.showToast({title: '获取故障列表失败', icon: 'none'});
					console.error('获取故障列表失败', err.message);
				}
			}).catch(err =>{
				console.error('获取故障列表错误', err.message);
			})
		},
		// 打开新增弹窗
		openAddFaultTypePopup() {
            // 重置表单
			this.addForm.name = '';
			this.addForm.alarmLevel = 1;
			this.$refs.addFaultTypePopup.open();
		},
		// 关闭新增弹窗
		closeAddFaultTypePopup() {
			this.$refs.addFaultTypePopup.close();
		},
		// 故障类型选择变更
		onLevelChange(e) {
			this.addForm.alarmLevel = e.detail.value + 1; // picker 索引从0开始，转为1~4
		},
		// 提交新增弹窗
		submitAddFaultTypePopup() {
			// 校验
			if (!this.addForm.name.trim()) {
				uni.showToast({ title: '请输入故障名称', icon: 'none' });
				return;
			}

			uni.showLoading({ title: '添加中', mask: true });
			request({
				url: '/station/Maintance/SaveAlarmLevel',
				method: 'POST',
				data: {
					name: this.addForm.name,
					alarmLevel: this.addForm.alarmLevel
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				uni.hideLoading();
				uni.showToast({ title: '添加成功', icon: 'success' });
				// 刷新列表
				this.getFaultTypeList();
				this.closeAddFaultTypePopup();
			}).catch(err =>{
				uni.hideLoading();
				console.error('添加故障错误', err.message);
				uni.showToast({ title: '添加失败，请重试', icon: 'none' });
			});

		},
		// 删除故障
		deleteFaultType(index) {
			uni.showModal({
				title: '提示',
				content: '确定要删除此故障类型吗？',
				confirmText: '确定',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中', mask: true });
						request({
							url: '/station/Maintance/DeleteAlarmLevel',
							method: 'POST',
							data: {
								// 注意：index 是过滤后列表的索引，取 id 需从 faultTypeList 获取
								id: this.faultTypeList[index].id
							}
						}).then(res =>{
							console.log(base64Decode(res.data.data));
							uni.hideLoading();
							uni.showToast({ title: '删除成功', icon: 'success' });
							// 刷新列表
							this.getFaultTypeList();
						}).catch(err =>{
							uni.hideLoading();
							console.error('删除故障错误', err.message);
							uni.showToast({ title: '删除失败，请重试', icon: 'none' });
						});
					}
				},
				fail: (res) => {
					console.error('删除故障错误', res.message);
				}
			})
		}
	},
}
</script>

<style lang="scss" scoped>
.fault-type-config-container {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: var(--bg-page, #F5F7FA); // 浅灰色背景
}

/* ---  筛选标签样式 --- */
.filter-scroll {
	width: 100%;
	white-space: nowrap;
	background-color: var(--bg-card, #FFFFFF);
	padding: 20rpx 0;
	box-sizing: border-box;
}
.filter-tabs {
	display: flex;
	padding: 0 20rpx;
}
.tab-item {
	display: inline-block;
	padding: 12rpx 30rpx;
	margin: 0 10rpx;
	background-color: var(--bg-soft, #F2F4F8);
	border-radius: 30rpx;
	font-size: 26rpx;
	color: var(--text-secondary, #666666);
	transition: all 0.3s;
}
.tab-item.active {
	background-color: var(--bg-accent, #E8F0FE); // 选中态浅蓝背景
	color: #007AFF; // 选中态蓝色文字
}

/* --- 列表卡片样式 --- */
.list-scroll {
	flex: 1;
	padding: 30rpx;
	box-sizing: border-box;
	/* 留出底部安全距离 */
	padding-bottom: 100rpx;
}

.fault-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: var(--bg-card, #FFFFFF);
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
}

.card-info {
	flex: 1;
}
.info-row {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
}
.info-row:last-child {
	margin-bottom: 0;
}
.info-label {
	color: var(--text-quaternary, #999999);
	font-size: 28rpx;
	width: 80rpx; // 统一对齐标签
}
.info-value {
	color: var(--text-primary, #333333);
	font-size: 28rpx;
}
.level-text {
	color: #007AFF; // 级别文字蓝色
}

.card-action {
	margin-left: 20rpx;
}
.delete-btn {
	background-color: #E64A4A;
	color: #FFFFFF;
	font-size: 26rpx;
	line-height: 2.2;
	padding: 0 30rpx;
	border-radius: 8rpx;
	margin: 0;
	border: none;
}
.delete-btn::after {
	border: none;
}

.fab-add-btn {
	position: fixed;
	bottom: 120rpx;
	right: 40rpx;
	width: 100rpx;
	height: 100rpx;
	background-color: #007AFF;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.4);
	z-index: 999;
}

/* --- 新增弹窗样式 --- */
.popup-content {
	width: 560rpx;
	background-color: var(--bg-card, #FFFFFF);
	border-radius: 24rpx;
	padding: 40rpx 30rpx 30rpx;
	box-sizing: border-box;
}
.popup-title {
	text-align: center;
	font-size: 34rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-bottom: 40rpx;
}
.popup-form {
	display: flex;
	flex-direction: column;
}
.form-item {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}
.form-label {
	width: 140rpx;
	font-size: 28rpx;
	color: var(--text-secondary, #666);
	flex-shrink: 0;
}
.form-picker {
	flex: 1;
	height: 72rpx;
	background: var(--bg-soft, #F5F7FA);
	border-radius: 8rpx;
	padding: 0 20rpx;
	display: flex;
	align-items: center;
}
.picker-value {
	font-size: 28rpx;
	color: var(--text-primary, #333);
}
.form-input {
	flex: 1;
	height: 72rpx;
	background: var(--bg-soft, #F5F7FA);
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333);
}
.form-actions {
	display: flex;
	justify-content: space-between;
	margin-top: 20rpx;
}
.btn-cancel,
.btn-confirm {
	width: 46%;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 30rpx;
	border-radius: 40rpx;
	margin: 0;
}
.btn-cancel {
	background-color: var(--bg-soft, #F2F4F8);
	color: var(--text-secondary, #666);
}
.btn-cancel::after {
	border: none;
}
.btn-confirm {
	background-color: #007AFF;
	color: #fff;
}
.btn-confirm::after {
	border: none;
}
</style>
