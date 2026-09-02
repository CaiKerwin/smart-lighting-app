<template>
	<view :class="themeClass" class="editCommonYearTimeTable-container">
		<!-- 时间表基本信息 -->
		<view class="section basic-section">
			<view class="section-header">
				<text class="section-title">基本信息</text>
			</view>
			<view class="info-card">
				<view class="info-row">
					<text class="label">时间表名</text>
					<text class="value-input">{{ timeTableName || '—' }}</text>
				</view>
				<view class="row-divider"></view>
				<view class="info-row">
					<text class="label">是否默认</text>
					<checkbox-group @change="handleDefaultChange">
						<label class="checkbox-label">
							<checkbox :checked="isDefault" color="#007AFF" style="transform:scale(0.8)"
							          value="default"/>
							<text class="checkbox-text">设为默认时间表</text>
						</label>
					</checkbox-group>
				</view>
			</view>
		</view>

		<!-- 日期范围 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">日期范围</text>
				<text class="tip-text">只更新此范围内勾选星期的时间计划</text>
			</view>
			<view class="date-card">
				<view class="date-range">
					<picker
						:end="isValidDate(endDate) ? endDate : ''"
						:value="isValidDate(startDate) ? startDate : today"
						mode="date"
						@change="bindStartDateChange"
					>
						<view :class="['date-box', isValidDate(startDate) ? '' : 'date-placeholder']">
							{{ startDate }}
						</view>
					</picker>
					<text class="to-text">至</text>
					<picker
						:start="isValidDate(startDate) ? startDate : ''"
						:value="isValidDate(endDate) ? endDate : today"
						mode="date"
						@change="bindEndDateChange"
					>
						<view :class="['date-box', isValidDate(endDate) ? '' : 'date-placeholder']">{{ endDate }}</view>
					</picker>
				</view>
				<!-- 星期勾选框 -->
				<view class="weekdays-wrap">
					<text class="weekdays-label">更新星期</text>
					<scroll-view :show-scrollbar="false" class="weekdays-scroll" scroll-x="true">
						<label v-for="(day, index) in weekdays" :key="index" class="week-item"
						       @tap="toggleWeekday(index)">
							<checkbox
								:checked="selectedWeekdays.includes(index)"
								:value="String(index)"
								color="#007AFF"
								style="transform:scale(0.8)"
							/>
							<text class="week-text">{{ day }}</text>
						</label>
					</scroll-view>
				</view>
			</view>
		</view>

		<!-- 时间表修改内容 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">修改内容</text>
				<text class="tip-text">将应用到所选日期内勾选的星期</text>
			</view>
			<view v-for="action in actions" :key="action.id" class="action-card">
				<view class="action-left">
					<view :style="{ backgroundColor: actionColor(action) }" class="action-icon"></view>
					<text class="action-name">{{ action.name }}</text>
				</view>
				<view class="action-right">
					<picker :value="action.time" mode="time" @change="bindTimeChange($event, action)">
						<view class="time-input">{{ action.time }}</view>
					</picker>
					<picker :range="statusRange" :value="action.status" mode="selector"
					        @change="handleStatusChange($event, action)">
						<view class="status-select">{{ statusMap[action.status] }}</view>
					</picker>
				</view>
			</view>
		</view>

		<!-- 保存和取消按钮 -->
		<view class="footer-btn">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="saveCommonYearTimeTable">保存</button>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 无原数据日期时使用的默认值：a1~a4 全部无效、时间 00:00
const INVALID_DAY = {
	a1: 2, a2: 2, a3: 2, a4: 2,
	t1: '00:00', t2: '00:00', t3: '00:00', t4: '00:00'
};

export default {
	data() {
		return {
			// 页面状态
			loading: true,
			loadError: false,

			// 基本信息
			timeTableId: null,
			timeTableName: '',
			isDefault: false,
			// 时间表原有全年内容：{ 月: { 日: { a1..a4, t1..t4 } } }
			originalContent: {},

			// 日期范围
			startDate: '请选择开始日期',
			endDate: '请选择结束日期',
			today: this.formatDate(new Date()),
			weekdays: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
			selectedWeekdays: [0, 1, 2, 3, 4, 5, 6], // 默认全选周一至周日

			// 动作
			actions: [
				{id: 1, name: '动作1', time: '18:03', status: 1},
				{id: 2, name: '动作2', time: '06:45', status: 0},
				{id: 3, name: '动作3', time: '18:30', status: 1},
				{id: 4, name: '动作4', time: '07:00', status: 0}
			],
			statusMap: {
				0: '关闭',
				1: '开启',
				2: '无效'
			},
			statusRange: ['关闭', '开启', '无效'],
		};
	},
	onLoad(options) {
		this.timeTableId = options && options.id ? Number(options.id) : null;
		if (options && options.name) {
			try {
				this.timeTableName = decodeURIComponent(options.name);
			} catch (e) {
				this.timeTableName = options.name;
			}
		}

		if (!this.timeTableId) {
			this.loading = false;
			this.loadError = true;
			return;
		}

		this.getCommonYearTimeTableDetail();
	},
	methods: {
		// 格式化日期为 YYYY-MM-DD
		formatDate(date) {
			const pad = (n) => (n < 10 ? '0' + n : '' + n);
			return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
		},
		// 是否为合法的 YYYY-MM-DD 日期
		isValidDate(str) {
			return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
		},
		// 解析 YYYY-MM-DD，手动构造 Date，避免 iOS 对 '-' 分隔日期的兼容问题
		parseDate(str) {
			const parts = String(str).split('-').map(Number);
			return new Date(parts[0], parts[1] - 1, parts[2]);
		},
		// 取原有时间表中某一天的数据（兼容数字/字符串键）
		getOriginalDay(month, day) {
			const src = this.originalContent || {};
			const monthData = src[month] || src[String(month)];
			if (!monthData) return null;
			return monthData[day] || monthData[String(day)] || null;
		},
		// 加载原有全年内容
		getCommonYearTimeTableDetail() {
			this.loading = true;
			this.loadError = false;
			request({
				url: '/station/plan/QueryCommonYearDetail',
				method: 'post',
				data: {
					id: this.timeTableId
				}
			}).then(res => {
				const payload = res.data;
				if (payload && payload.data) {
					try {
						let detail = payload.data;
						if (typeof detail === 'string') {
							const decoded = base64Decode(detail);
							detail = decoded ? JSON.parse(decoded) : {};
						}
						this.originalContent = (detail && detail.content) || {};
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}
						this.isDefault = !!detail.isDefault;
						this.loading = false;
					} catch (e) {
						console.error('常规年表详情解析失败', e);
						this.loading = false;
						this.loadError = true;
					}
				} else {
					this.loading = false;
					this.loadError = true;
					uni.showToast({title: '获取常规年表详情异常', icon: 'none'});
				}
			}).catch(err => {
				this.loading = false;
				this.loadError = true;
				console.error('获取常规年表详情错误', err.message);
			});
		},

		handleDefaultChange(e) {
			this.isDefault = e.detail.value.length > 0;
		},
		bindStartDateChange(e) {
			this.startDate = e.detail.value;
		},
		bindEndDateChange(e) {
			this.endDate = e.detail.value;
		},
		toggleWeekday(index) {
			const idx = this.selectedWeekdays.indexOf(index);
			if (idx > -1) {
				this.selectedWeekdays.splice(idx, 1);
			} else {
				this.selectedWeekdays.push(index);
			}
		},
		bindTimeChange(e, action) {
			action.time = e.detail.value;
		},
		handleStatusChange(e, action) {
			action.status = Number(e.detail.value);
		},
		actionColor(action) {
			const colors = ['#3a7bf7', '#f5a623', '#7b61ff', '#07c160'];
			return colors[(action.id - 1) % colors.length];
		},
		cancel() {
			uni.navigateBack();
		},

		// 日期与星期校验
		validateRange() {
			if (!this.isValidDate(this.startDate)) {
				uni.showToast({title: '请选择开始日期', icon: 'none'});
				return false;
			}
			if (!this.isValidDate(this.endDate)) {
				uni.showToast({title: '请选择结束日期', icon: 'none'});
				return false;
			}
			if (this.startDate > this.endDate) {
				uni.showToast({title: '开始日期不能大于结束日期', icon: 'none'});
				return false;
			}
			if (this.startDate.slice(0, 4) !== this.endDate.slice(0, 4)) {
				uni.showToast({title: '开始和结束日期不能跨年', icon: 'none'});
				return false;
			}
			if (this.selectedWeekdays.length === 0) {
				uni.showToast({title: '请至少勾选一个星期', icon: 'none'});
				return false;
			}
			return true;
		},

		// 组装一整年的 content：
		// 1、以原有全年内容为基础，缺失日期补“无效”默认值；
		// 2、仅在选择的时间范围内、且勾选了星期的日期，覆盖为新的动作1~动作4
		// 范围内未勾选星期以及范围外的日期均保持原值不变
		buildYearContent() {
			const year = Number(this.startDate.slice(0, 4));
			const content = {};

			for (let month = 1; month <= 12; month++) {
				const monthKey = String(month);
				const daysInMonth = new Date(year, month, 0).getDate();
				content[monthKey] = {};
				for (let day = 1; day <= daysInMonth; day++) {
					const dayKey = String(day);
					const original = this.getOriginalDay(month, day);
					if (original) {
						content[monthKey][dayKey] = {
							a1: original.a1, a2: original.a2, a3: original.a3, a4: original.a4,
							t1: original.t1, t2: original.t2, t3: original.t3, t4: original.t4
						};
					} else {
						content[monthKey][dayKey] = {...INVALID_DAY};
					}
				}
			}

			const cursor = this.parseDate(this.startDate);
			const end = this.parseDate(this.endDate);
			while (cursor <= end) {
				// JS getDay(): 0=周日...6=周六；换算成 0=星期一...6=星期日
				const weekdayIndex = (cursor.getDay() + 6) % 7;
				if (this.selectedWeekdays.includes(weekdayIndex)) {
					const monthKey = String(cursor.getMonth() + 1);
					const dayKey = String(cursor.getDate());
					const dayContent = {};
					this.actions.forEach(action => {
						dayContent['a' + action.id] = action.status;
						// 无效动作时间统一为 00:00，与后端格式保持一致
						dayContent['t' + action.id] = action.status === 2 ? '00:00' : action.time;
					});
					content[monthKey][dayKey] = dayContent;
				}
				cursor.setDate(cursor.getDate() + 1);
			}
			return content;
		},

		// 保存修改后的时间表
		saveCommonYearTimeTable() {
			if (!this.validateRange()) return;


			/**
			 * 请求体
			 * {
			 *   "id": 243,             // 时间表id
			 *   "name": "App常规年表", // 时间表名称
			 *   "isDefault": false,    // 是否默认时间表
			 *   "content": {           // 必须包含一整年的内容
			 *     "月": { "日": { "a1": 0, "t1": "07:08", ... } }
			 *   }
			 * }
			 * 返回结果：{ code: 0, data: "1", abab: true }
			 */
			uni.showModal({
				title: '提示',
				content: `确认修改${this.startDate}至${this.endDate}的时间计划？`,
				success: (res) => {
					if (res.confirm) {
						const content = this.buildYearContent();
						uni.showLoading({title: '保存中...', mask: true});

						request({
							url: '/station/plan/SaveCommonYearDetail',
							method: 'POST',
							data: {
								id: this.timeTableId,
								name: this.timeTableName,
								isDefault: this.isDefault,
								content: content
							}
						}).then(res => {
							uni.hideLoading();
							const payload = res.data || {};
							if (payload.code === 0) {
								// 通知详情页刷新
								uni.$emit('commonYearTimeTableUpdated', {id: this.timeTableId});
								uni.showToast({title: '保存成功', icon: 'success'});
								setTimeout(() => {
									uni.navigateBack();
								}, 800);
							} else {
								const msg = typeof payload.data === 'string' ? base64Decode(payload.data) : '';
								uni.showToast({title: msg || '保存失败，请重试', icon: 'none'});
							}
						}).catch(err => {
							uni.hideLoading();
							console.error('保存常规年表失败', err.message);
							uni.showToast({title: '保存失败，请重试', icon: 'none'});
						});
					}
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.editCommonYearTimeTable-container {
	min-height: 100vh;
	box-sizing: border-box;
	/* 底部预留固定按钮栏的空间，避免内容被遮挡 */
	padding: 24rpx 24rpx calc(200rpx + env(safe-area-inset-bottom));
	background-color: var(--bg-page, #f5f7fa);
}

/* ==================== 区块通用 ==================== */
.section {
	margin-bottom: 28rpx;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 18rpx;

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
		white-space: nowrap;
	}

	.tip-text {
		flex: 1;
		font-size: 22rpx;
		color: #f56c6c;
		margin-left: 16rpx;
	}
}

/* ==================== 时间表基本信息 ==================== */
.info-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 8rpx 28rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));

	.info-row {
		display: flex;
		align-items: center;
		min-height: 96rpx;

		.label {
			width: 180rpx;
			flex-shrink: 0;
			font-size: 28rpx;
			color: var(--text-secondary, #666666);
		}

		.value-input {
			flex: 1;
			font-size: 28rpx;
			color: var(--text-primary, #333333);
			font-weight: 500;
		}

		.checkbox-label {
			display: flex;
			align-items: center;
		}

		.checkbox-text {
			font-size: 26rpx;
			color: var(--text-quaternary, #999999);
		}
	}

	.row-divider {
		height: 1px;
		background-color: var(--border-color, #f0f2f5);
	}
}

/* ==================== 日期范围 ==================== */
.date-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 26rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));

	.date-range {
		display: flex;
		align-items: center;

		picker {
			flex: 1;
			min-width: 0;
		}

		.date-box {
			background-color: var(--bg-accent, #eaf2ff);
			color: var(--text-primary, #2f6fed);
			padding: 18rpx 0;
			border-radius: 12rpx;
			font-size: 28rpx;
			text-align: center;
		}

		.date-placeholder {
			background-color: var(--bg-soft, #f2f4f8);
			color: var(--text-tertiary, #9aa7bd);
		}

		.to-text {
			font-size: 26rpx;
			color: var(--text-quaternary, #999999);
			margin: 0 20rpx;
			flex-shrink: 0;
		}
	}

	.weekdays-wrap {
		display: flex;
		align-items: flex-start;
		margin-top: 26rpx;
		padding-top: 24rpx;
		border-top: 1px solid var(--border-color, #f0f2f5);

		.weekdays-label {
			flex-shrink: 0;
			font-size: 26rpx;
			color: var(--text-secondary, #666666);
			margin-right: 8rpx;
			line-height: 44rpx;
		}

		.weekdays-scroll {
			flex: 1;
			min-width: 0;
			white-space: nowrap;
		}

		.week-item {
			display: inline-flex;
			align-items: center;
			font-size: 26rpx;
			color: var(--text-primary, #333333);
			margin-right: 26rpx;

			.week-text {
				margin-left: 2rpx;
			}
		}
	}
}

/* ==================== 修改内容 ==================== */
.action-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 26rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));

	.action-left {
		display: flex;
		align-items: center;

		.action-icon {
			width: 10rpx;
			height: 44rpx;
			border-radius: 6rpx;
			margin-right: 16rpx;
		}

		.action-name {
			font-size: 30rpx;
			color: var(--text-primary, #333333);
			font-weight: 500;
		}
	}

	.action-right {
		display: flex;
		align-items: center;

		.time-input {
			background-color: var(--bg-soft, #f5f7fa);
			border: 1px solid var(--border-color, #e6eaf2);
			border-radius: 10rpx;
			padding: 12rpx 0;
			font-size: 28rpx;
			text-align: center;
			color: var(--text-primary, #333333);
			width: 150rpx;
			margin-right: 20rpx;
		}

		.status-select {
			background-color: var(--bg-accent, #eaf2ff);
			color: var(--text-primary, #2f6fed);
			border-radius: 10rpx;
			padding: 12rpx 30rpx;
			font-size: 28rpx;
			text-align: center;
		}
	}
}

/* ==================== 保存/取消按钮（固定在页面底部，始终可见） ==================== */
.footer-btn {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	display: flex;
	align-items: center;
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background-color: var(--bg-card, #ffffff);
	box-shadow: 0 -6rpx 20rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.08));

	.btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		padding: 0;
		margin: 0 12rpx;
		font-size: 30rpx;
		border-radius: 10rpx;

		&::after {
			border: none;
		}
	}

	.cancel-btn {
		background-color: var(--bg-soft, #f2f4f8);
		color: var(--text-secondary, #555555);
	}

	.save-btn {
		background: linear-gradient(90deg, #3a7bf7, #5a96ff);
		color: #ffffff;
	}
}
</style>
