<template>
	<view :class="themeClass" class="edit8051BTimeTable-container">
		<!-- 时间表基本信息 -->
		<view class="section basic-section">
			<view class="section-header">
				<text class="section-title">基本信息</text>
			</view>
			<view class="info-card">
				<view class="info-row">
					<text class="label">时间表名</text>
					<view :class="['value-input-wrap', nameError ? 'input-error' : '']">
						<input
							:value="timeTableName"
							class="name-input"
							maxlength="20"
							placeholder="请输入时间表名称"
							placeholder-style="font-size:26rpx;color:#b8bfcc;"
							@blur="validateName"
							@input="onNameInput"
						/>
					</view>
				</view>
				<text v-if="nameError" class="name-error">{{ nameError }}</text>
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
				<text class="tip-text">只更新此日期范围内的时间计划</text>
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
			</view>
		</view>

		<!-- 时间表修改内容 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">修改内容</text>
				<text class="tip-text">范围内勾选启用的时段才会生效</text>
			</view>
			<!-- 日开灯计划 -->
			<view class="section day">
				<view v-for="(item, index) in daySchedules" :key="index" class="time-slot-card">
					<view class="card-header">
						<text class="slot-name">时段{{ index + 1 }}</text>
						<view class="enable-check">
							<text>是否启用</text>
							<checkbox-group @change="handleDayScheduleEnable(index, $event)">
								<label class="checkbox-label">
									<checkbox :checked="item.enable" color="#3a7bf7" style="transform:scale(0.8)" value="enable"/>
								</label>
							</checkbox-group>
						</view>
					</view>

					<view class="card-content">
						<text class="time-label">开灯时间</text>
						<picker :value="item.openTime" mode="time"
						        @change="handleDayScheduleTime(index, 'open', $event)">
							<view class="time-picker-box">{{ item.openTime }}</view>
						</picker>
						<text class="time-label">关灯时间</text>
						<picker :value="item.closeTime" mode="time"
						        @change="handleDayScheduleTime(index, 'close', $event)">
							<view class="time-picker-box">{{ item.closeTime }}</view>
						</picker>
					</view>
				</view>
			</view>

			<!-- 周开灯计划 -->
			<view class="section week">
				<scroll-view class="week-scroll" scroll-x show-scrollbar="false">
					<view class="week-list">
						<view v-for="(day, index) in weekSchedules" :key="index" class="week-card">
							<view class="day-title">{{ day.name }}</view>
							<view class="period-row">
								<text class="period-label">上午</text>
								<view class="switch-wrap">
									<switch :checked="day.am" color="#07c160" style="transform:scale(0.8)"
									        @change="handleWeekSwitch(index, 'am', $event)"/>
									<text :class="{ 'text-danger': !day.am }" class="switch-text">{{ day.am ? '允许' : '禁止' }}</text>
								</view>
							</view>
							<view class="period-row">
								<text class="period-label">下午</text>
								<view class="switch-wrap">
									<switch :checked="day.pm" color="#07c160" style="transform:scale(0.8)"
									        @change="handleWeekSwitch(index, 'pm', $event)"/>
									<text :class="{ 'text-danger': !day.pm }" class="switch-text">{{ day.pm ? '允许' : '禁止' }}</text>
								</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>


		<!-- 保存和取消按钮 -->
		<view class="footer-btn">
			<button class="btn cancel-btn" @click="cancel">取消</button>
			<button class="btn save-btn" @click="save8051BTimeTable">保存</button>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

// 无原数据日期时使用的默认值：四个时段全部禁用、时间 00:00
const DISABLED_DAY = {
	a1: '2', a2: '2', a3: '2', a4: '2',
	o1: '00:00', o2: '00:00', o3: '00:00', o4: '00:00',
	c1: '00:00', c2: '00:00', c3: '00:00', c4: '00:00'
};

export default {
	data() {
		return {
			// 基本信息
			timeTableId: null,
			timeTableName: '',
			nameError: '',
			isDefault: false,
			// 时间表原有全年内容：{ 月: { 日: { a1..a4, o1..o4, c1..c4 } } }
			originalContent: {},
			// 原有全年内容是否加载成功（未加载成功不允许保存，避免覆盖原数据）
			contentLoaded: false,
			// 日期范围
			startDate: '请选择开始日期',
			endDate: '请选择结束日期',
			today: this.formatDate(new Date()),
			weekdays: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
			// 日开灯计划默认值
			daySchedules: [
				{enable: false, openTime: '00:00', closeTime: '00:00'},
				{enable: false, openTime: '00:00', closeTime: '00:00'},
				{enable: false, openTime: '00:00', closeTime: '00:00'},
				{enable: false, openTime: '00:00', closeTime: '00:00'}
			],
			// 周开灯计划默认值
			weekSchedules: [
				{name: '星期一', am: true, pm: true},
				{name: '星期二', am: true, pm: true},
				{name: '星期三', am: true, pm: true},
				{name: '星期四', am: true, pm: true},
				{name: '星期五', am: true, pm: true},
				{name: '星期六', am: true, pm: true},
				{name: '星期日', am: true, pm: true}
			]
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
			return;
		}

		this.get8051BTimeTableDetail();
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
		// 获取8051B时间表原有详情内容
		get8051BTimeTableDetail() {
			request({
				url: '/station/plan/QueryBjYearDetail',
				method: 'POST',
				data: {
					id: this.timeTableId // 时间表id
				}
			}).then(res => {
				const payload = res.data;
				if (payload && payload.data) {
					try {
						// 兼容返回已解码对象的情况
						let detail = payload.data;
						if (typeof detail === 'string') {
							detail = JSON.parse(base64Decode(detail));
						}
						// 全年每天的时间表内容
						this.originalContent = (detail && detail.content) || {};
						if (detail && detail.name) {
							this.timeTableName = detail.name;
						}
						const def = detail && detail.isDefault;
						this.isDefault = def === true || def === 'true' || def === 1 || def === '1';
						// 每周允许/禁止开关灯（week 1-7 表示星期一到星期日）
						const extra = detail && detail.extra;
						if (extra && Array.isArray(extra.weeks) && extra.weeks.length > 0) {
							this.weekSchedules = this.parseWeekData(extra.weeks);
						}
						this.contentLoaded = true;
					} catch (e) {
						console.error('8051B时间表详情解析失败', e);
						uni.showToast({title: '获取8051B时间表详情异常', icon: 'none'});
					}
				} else {
					uni.showToast({title: '获取8051B时间表详情异常', icon: 'none'});
				}
			}).catch(err => {
				console.error('获取8051B时间表错误', err.message);
				uni.showToast({title: '获取8051B时间表详情异常', icon: 'none'});
			})
		},
		// 解析 extra.weeks，生成周开灯计划 UI 数据
		// week 1-7 表示星期一到星期日 am=true 上午 am=false 下午 enable=true 允许 enable=false 禁止
		parseWeekData(weeks) {
			const weekNames = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
			const weekMap = {};
			(weeks || []).forEach(item => {
				const week = Number(item.week);
				if (!week || week < 1 || week > 7) return;
				if (!weekMap[week]) {
					weekMap[week] = {};
				}
				weekMap[week][item.am ? 'am' : 'pm'] = item.enable === true || item.enable === 'true' || item.enable === 1;
			});

			return weekNames.map((name, index) => {
				const day = weekMap[index + 1] || {};
				return {
					name: name,
					am: day.am !== undefined ? day.am : false,
					pm: day.pm !== undefined ? day.pm : false
				};
			});
		},
		handleDefaultChange(e) {
			this.isDefault = e.detail.value.length > 0;
		},
		// 名称输入：同步数据；已提示错误时边输入边校验，通过后立即清除提示
		onNameInput(e) {
			this.timeTableName = e && e.detail ? e.detail.value : '';
			if (this.nameError) {
				this.validateName();
			}
		},
		// 名称校验：不能为空且长度不能超过 20 字符（与后端一致）
		validateName() {
			const name = String(this.timeTableName || '').trim();
			let message = '';
			if (!name) {
				message = '请输入时间表名称';
			} else if (name.length > 20) {
				message = '名称长度不能超过20字符';
			}
			this.nameError = message;
			return message === '';
		},
		bindStartDateChange(e) {
			this.startDate = e.detail.value;
		},
		bindEndDateChange(e) {
			this.endDate = e.detail.value;
		},
		// 日计划：处理启用复选框
		handleDayScheduleEnable(index, e) {
			this.daySchedules[index].enable = e.detail.value.length > 0;
		},
		// 日计划：处理时间选择（open为开灯，close为关灯）
		handleDayScheduleTime(index, type, e) {
			const val = e.detail.value;
			if (type === 'open') {
				this.daySchedules[index].openTime = val;
			} else {
				this.daySchedules[index].closeTime = val;
			}
		},
		// 周计划：处理上午/下午开关
		handleWeekSwitch(index, type, e) {
			const val = e.detail.value;
			if (type === 'am') {
				this.weekSchedules[index].am = val;
			} else {
				this.weekSchedules[index].pm = val;
			}
		},
		// 日期校验
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
			return true;
		},
		// 把原有某天的数据统一转成字符串格式（a1-a4、o1-o4、c1-c4），缺失字段补默认值
		normalizeDay(day) {
			const result = {};
			for (let i = 1; i <= 4; i++) {
				const a = day['a' + i];
				const o = day['o' + i];
				const c = day['c' + i];
				result['a' + i] = (a === undefined || a === null || a === '') ? '2' : String(a);
				result['o' + i] = (o === undefined || o === null || o === '') ? '00:00' : String(o);
				result['c' + i] = (c === undefined || c === null || c === '') ? '00:00' : String(c);
			}
			return result;
		},
		// 组装一整年的 content：
		// 1、以原有全年内容为基础，缺失日期补“全部禁用”默认值；
		// 2、仅在选择的时间范围内，把勾选了“是否启用”的时段覆盖为新的开关灯时间，
		//    未勾选的时段以及范围外的日期均保持原值不变
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
					content[monthKey][dayKey] = original ? this.normalizeDay(original) : {...DISABLED_DAY};
				}
			}

			const cursor = this.parseDate(this.startDate);
			const end = this.parseDate(this.endDate);
			while (cursor <= end) {
				const monthKey = String(cursor.getMonth() + 1);
				const dayKey = String(cursor.getDate());
				const dayContent = content[monthKey][dayKey];
				this.daySchedules.forEach((slot, index) => {
					const no = index + 1;
					// 只有勾选了“是否启用”的时段才会修改生效
					if (slot.enable) {
						dayContent['a' + no] = '1';
						dayContent['o' + no] = slot.openTime;
						dayContent['c' + no] = slot.closeTime;
					}
				});
				cursor.setDate(cursor.getDate() + 1);
			}
			return content;
		},
		// 组装 extra.weeks：每个星期生成上午/下午两条记录
		buildWeekExtra() {
			const weeks = [];
			this.weekSchedules.forEach((day, index) => {
				const week = index + 1;
				weeks.push({am: true, enable: day.am, week: week});
				weeks.push({am: false, enable: day.pm, week: week});
			});
			return weeks;
		},
		// 保存修改的时间表内容
		save8051BTimeTable() {
			if (!this.timeTableId) {
				uni.showToast({title: '缺少时间表ID', icon: 'none'});
				return;
			}
			if (!this.contentLoaded) {
				uni.showToast({title: '时间表详情未加载完成，请稍后重试', icon: 'none'});
				return;
			}
			if (!this.validateRange()) return;
			if (!this.validateName()) {
				uni.showToast({title: this.nameError, icon: 'none'});
				return;
			}

			/**
			 * 请求体
			 * {
			 *   "id": 246,                 // 时间表id
			 *   "name": "App北京时间表",    // 时间表名称
			 *   "isDefault": false,        // 是否默认时间表
			 *   "extra": {                 // 周开灯计划 week 1-7=星期一到星期日 am=true上午 am=false下午 enable=true允许
			 *     "weeks": [
			 *       { "am": true, "enable": true, "week": 1 },
			 *       { "am": false, "enable": true, "week": 1 }
			 *     ]
			 *   },
			 *   "content": {               // 年度开灯计划（一整年） a1-a4：1启用 2禁用 o1-o4开灯时间 c1-c4关灯时间
			 *     "1": {
			 *       "1": {
			 *         "a1": "1", "a2": "2", "a3": "2", "a4": "2",
			 *         "o1": "18:00", "o2": "00:00", "o3": "00:00", "o4": "00:00",
			 *         "c1": "05:30", "c2": "00:00", "c3": "00:00", "c4": "00:00"
			 *       }
			 *     }
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
						const weeks = this.buildWeekExtra();
						uni.showLoading({title: '保存中...', mask: true});

						request({
							url: '/station/plan/SaveBjYearDetail',
							method: 'POST',
							data: {
								id: this.timeTableId, // 时间表id
								name: String(this.timeTableName || '').trim(), // 时间表名称
								isDefault: this.isDefault, // 是否设置为默认
								extra: {weeks: weeks}, // 周开灯计划
								content: content // 年度开灯计划
							}
						}).then(res => {
							uni.hideLoading();
							const payload = res.data || {};
							if (payload.code === 0) {
								// 通知详情页刷新
								uni.$emit('8051BTimeTableUpdated', {id: this.timeTableId});
								uni.showToast({title: '修改成功', icon: 'success'});
								setTimeout(() => {
									uni.navigateBack();
								}, 1000);
							} else {
								const msg = typeof payload.data === 'string' ? base64Decode(payload.data) : '';
								uni.showToast({title: msg || '修改失败，请重试', icon: 'none'});
							}
						}).catch(err => {
							uni.hideLoading();
							console.error('保存8051B时间表错误', err.message);
							uni.showToast({title: '保存失败，请重试', icon: 'none'});
						})
					}
				}
			})
		},
		cancel() {
			uni.navigateBack();
		}
	},
}
</script>

<style lang="scss" scoped>
.edit8051BTimeTable-container {
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

		.value-input-wrap {
			flex: 1;
			min-width: 0;
			display: flex;
			align-items: center;
			height: 72rpx;
			padding: 0 20rpx;
			box-sizing: border-box;
			background-color: var(--bg-soft, #f2f4f8);
			border: 2rpx solid var(--border-color, #e6eaf2);
			border-radius: 12rpx;

			.name-input {
				flex: 1;
				min-width: 0;
				height: 72rpx;
				line-height: 72rpx;
				font-size: 28rpx;
				color: var(--text-primary, #333333);
				background-color: transparent;
			}
		}

		.value-input-wrap.input-error {
			border-color: #f56c6c;
			background-color: rgba(245, 108, 108, 0.08);
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

	.name-error {
		display: block;
		margin: 0 0 0 180rpx;
		padding: 4rpx 0 12rpx;
		font-size: 22rpx;
		color: #f56c6c;
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
}

/* ==================== 日开灯计划 ==================== */
.time-slot-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;

		.slot-name {
			font-size: 30rpx;
			font-weight: bold;
			color: var(--text-primary, #333);
		}

		.enable-check {
			display: flex;
			align-items: center;
			font-size: 26rpx;
			color: var(--text-secondary, #666);

			.checkbox-label {
				display: flex;
				align-items: center;
				margin-left: 10rpx;
			}
		}
	}

	.card-content {
		display: flex;
		align-items: center;
		gap: 10rpx;

		.time-label {
			width: 140rpx;
			font-size: 28rpx;
			color: var(--text-secondary, #666);
		}

		.time-picker-box {
			background-color: var(--bg-soft, #f2f4f8);
			border: 1px solid var(--border-color, #e5e5e5);
			border-radius: 10rpx;
			padding: 12rpx 20rpx;
			min-width: 160rpx;
			text-align: center;
			font-size: 28rpx;
			color: var(--text-primary, #333);
		}

	}
}

/* ==================== 周开灯计划 ==================== */
.week-scroll {
	width: 100%;
	white-space: nowrap;
}

.week-list {
	display: inline-flex;
	flex-direction: row;
	gap: 20rpx;
	padding-bottom: 20rpx;
}

.week-card {
	background-color: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	padding: 24rpx;
	width: 220rpx;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow, rgba(31, 56, 88, 0.06));
	flex-shrink: 0;

	.day-title {
		font-size: 28rpx;
		font-weight: bold;
		color: var(--text-primary, #333);
		text-align: center;
		margin-bottom: 24rpx;
	}

	.period-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		.period-label {
			font-size: 30rpx;
			color: var(--text-secondary, #666);
		}

		.switch-wrap {
			display: flex;
			flex-direction: row;
			align-items: flex-start;

			.switch-text {
				font-size: 24rpx;
				margin-top: 10rpx;
				color: var(--text-tertiary, #888);
			}

			.text-danger{
				color: #f56c6c;
			}
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
