<!-- 灯杆信息弹窗 -->
<template>
	<view v-if="visible" :class="themeClass" class="popup-mask" @click="onMaskClick">
		<view class="popup-panel" @click.stop>
			<!-- 标题 -->
			<view class="popup-head">
				<text class="popup-title">{{ isEdit ? '编辑灯杆' : '新增灯杆' }}</text>
			</view>

			<!-- 表单 -->
			<view class="form-area">
				<!-- 灯杆名称 -->
				<view class="form-row">
					<text class="form-label">灯杆名称</text>
					<input
						v-model="form.name"
						class="form-control input-control"
						placeholder="请输入灯杆名称"
						placeholder-class="placeholder"
						type="text"
					/>
				</view>

				<!-- 灯杆高度 -->
				<view class="form-row">
					<text class="form-label">灯杆高度</text>
					<view class="form-control height-control">
						<input
							v-model="form.height"
							class="height-input"
							placeholder="请输入灯杆高度"
							placeholder-class="placeholder"
							type="digit"
						/>
						<text class="height-unit">m</text>
					</view>
				</view>

				<!-- 灯杆类型 -->
				<view class="form-row">
					<text class="form-label">灯杆类型</text>
					<input
						v-model="form.poleType"
						class="form-control input-control"
						placeholder="请输入灯杆类型"
						placeholder-class="placeholder"
						type="text"
					/>
				</view>

				<!-- 灯臂类型 -->
				<view class="form-row">
					<text class="form-label">灯臂类型</text>
					<input
						v-model="form.armType"
						class="form-control input-control"
						placeholder="请输入灯臂类型"
						placeholder-class="placeholder"
						type="text"
					/>
				</view>

				<!-- 经纬度：右侧定位图标跳转地图选点，选点结果回填到表单 -->
				<view class="form-row">
					<text class="form-label">经纬度</text>
					<view class="form-control coord-control">
						<view class="coord-fields">
							<text :class="{ placeholder: !hasLocation }" class="coord-line">经度：{{ lngText }}</text>
							<text :class="{ placeholder: !hasLocation }" class="coord-line">纬度：{{ latText }}</text>
						</view>
						<view class="coord-location" @click="pickLocation">
							<uni-icons :color="primaryColor" size="22" type="location" />
						</view>
					</view>
				</view>
			</view>

			<!-- 底部按钮 -->
			<view class="popup-footer">
				<button class="footer-btn cancel" @click="close">取消</button>
				<button class="footer-btn confirm" @click="onConfirm">{{ isEdit ? '保存' : '新增' }}</button>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import {EVENT_LOCATION_RESULT, POS_TYPE_POLE} from "@/utils/map";

export default {
	name: 'PoleInfo',
	props: {
		// 当前站点ID（新增灯杆时使用；编辑时优先取灯杆自身的站点）
		stationId: {
			type: [Number, String],
			default: 0
		}
	},
	data() {
		return {
			visible: false,
			submitting: false,          // 是否正在提交（防止重复提交）
			mode: 'add',                // add 新增 / edit 编辑

			// 地图选点状态（跳转选择位置后，按 token 匹配本次回传结果）
			pendingLocationPick: false,
			pickToken: '',

			// 表单
			form: this.emptyForm()
		};
	},
	computed: {
		isEdit() {
			return this.mode === 'edit';
		},
		// 定位图标颜色：跟随主题
		primaryColor() {
			return this.isDarkMode ? '#5a97ff' : '#007aff';
		},
		// 是否已选择位置（经纬度有效且不同时为 0）
		hasLocation() {
			return this.isValidCoord(this.form.lat, this.form.lng);
		},
		lngText() {
			return this.hasLocation ? Number(this.form.lng).toFixed(5) : '未选择';
		},
		latText() {
			return this.hasLocation ? Number(this.form.lat).toFixed(5) : '未选择';
		}
	},
	created() {
		// 地图选点结果回传（showAndEditLocation 页面确认后触发）
		uni.$on(EVENT_LOCATION_RESULT, this.onLocationResult);
	},
	beforeDestroy() {
		uni.$off(EVENT_LOCATION_RESULT, this.onLocationResult);
	},
	methods: {
		// 空表单（新增）
		emptyForm() {
			return {
				id: 0,           // 灯杆ID，0 表示新增
				stationId: 0,
				code: '',        // 灯杆标识，新增为空、编辑回传原值
				name: '',
				height: '',
				poleType: '',
				armType: '',
				lat: 0,
				lng: 0
			};
		},

		// 坐标有效性：均为数值且不同时为 0
		isValidCoord(lat, lng) {
			const latNum = Number(lat);
			const lngNum = Number(lng);
			return Number.isFinite(latNum) && Number.isFinite(lngNum) && !(latNum === 0 && lngNum === 0);
		},

		// 灯杆高度：列表接口字段为 hight（兼容 height）
		poleHeightOf(pole) {
			if (!pole) return '';
			const value = (pole.hight === null || pole.hight === undefined) ? pole.height : pole.hight;
			return (value === null || value === undefined) ? '' : value;
		},

		/**
		 * 打开弹窗：传灯杆对象为编辑，不传为新增
		 * @param {Object} [item] 灯杆对象（列表项）
		 */
		open(item) {
			const pole = item || null;
			this.mode = pole ? 'edit' : 'add';
			this.visible = true;
			this.submitting = false;
			this.pendingLocationPick = false;
			this.pickToken = '';

			const form = this.emptyForm();
			if (pole) {
				const stationId = pole.stationId;
				form.id = pole.id || 0;
				form.stationId = (stationId === null || stationId === undefined || stationId === '')
					? (Number(this.stationId) || 0)
					: stationId;
				form.code = pole.code || pole.guidCode || '';
				form.name = pole.name || '';
				form.height = this.poleHeightOf(pole);
				form.poleType = pole.poleType || '';
				form.armType = pole.armType || '';
				form.lat = Number(pole.lat) || 0;
				form.lng = Number(pole.lng) || 0;
			} else {
				form.stationId = Number(this.stationId) || 0;
			}
			this.form = form;
		},

		close() {
			this.visible = false;
			this.pendingLocationPick = false;
			this.pickToken = '';
		},

		onMaskClick() {
			this.close();
		},

		/**
		 * 定位图标：跳转地图选点界面
		 * pick 模式只回传经纬度（不调用 SetPos 落库），选点确认后由 onLocationResult 回填表单，
		 * 最终随 SaveLampPole 一起提交
		 */
		pickLocation() {
			this.pickToken = `${Date.now()}`;
			this.pendingLocationPick = true;
			const query = [
				'mode=pick',
				`type=${POS_TYPE_POLE}`,
				`id=${this.form.id || 0}`,
				`name=${encodeURIComponent(this.form.name || '')}`,
				`token=${this.pickToken}`,
				`lat=${this.hasLocation ? this.form.lat : ''}`,
				`lng=${this.hasLocation ? this.form.lng : ''}`
			].join('&');
			uni.navigateTo({ url: `/pages/operation/components/showAndEditLocation?${query}` });
		},

		// 地图选点结果回传：按 token 匹配本次选点，回填经纬度
		onLocationResult(payload) {
			if (!payload || !this.pendingLocationPick) return;
			if (Number(payload.type) !== POS_TYPE_POLE) return;
			if (String(payload.token || '') !== this.pickToken) return;
			const lat = Number(payload.lat);
			const lng = Number(payload.lng);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
			this.form.lat = lat;
			this.form.lng = lng;
			this.pendingLocationPick = false;
			this.pickToken = '';
			uni.showToast({ title: '已选择位置', icon: 'none' });
		},

		// 校验并提交
		onConfirm() {
			if (this.submitting) return;
			const name = String(this.form.name || '').trim();
			if (!name) {
				uni.showToast({ title: '请输入灯杆名称', icon: 'none' });
				return;
			}
			const height = Number(this.form.height);
			if (!Number.isFinite(height) || height <= 0) {
				uni.showToast({ title: '请输入正确的灯杆高度', icon: 'none' });
				return;
			}
			if (!this.hasLocation) {
				uni.showToast({ title: '请选择灯杆位置', icon: 'none' });
				return;
			}
			if (!Number(this.form.stationId)) {
				uni.showToast({ title: '缺少站点信息', icon: 'none' });
				return;
			}
			this.savePole({ name, height });
		},

		/**
		 * 保存灯杆（新增 / 编辑共用接口）
		 *
		 * 请求体
		 * {
		 *   "id": 0,                        // 灯杆ID，0 表示新增
		 *   "stationId": 1880,
		 *   "code": "",                     // 灯杆标识（新增为空，编辑回传原值）
		 *   "name": "测试",
		 *   "lng": 113.15462234344155,      // 百度坐标（bd09ll）
		 *   "lat": 23.03434679178871,
		 *   "asset": {
		 *     "poleType": "1",
		 *     "armType": "1",
		 *     "height": 8
		 *   }
		 * }
		 *
		 * @param {{name: String, height: Number}} data 校验后的表单值
		 */
		savePole(data) {
			this.submitting = true;
			uni.showLoading({ title: '保存中...', mask: true });
			request({
				url: '/station/config/SaveLampPole',
				method: 'POST',
				data: {
					id: this.form.id || 0,
					stationId: Number(this.form.stationId) || 0,
					code: this.form.code || '',
					name: data.name,
					lng: Number(this.form.lng),
					lat: Number(this.form.lat),
					asset: {
						poleType: String(this.form.poleType || '').trim(),
						armType: String(this.form.armType || '').trim(),
						height: data.height
					}
				}
			}).then(res => {
				uni.hideLoading();
				this.submitting = false;
				const body = res && res.data;
				const code = body ? Number(body.code) : 0;
				if (!Number.isNaN(code) && code !== 0 && code !== 200) {
					uni.showToast({ title: this.decodeErrorMessage(body) || '保存失败', icon: 'none' });
					return;
				}
				if (body && body.data) {
					console.log('保存灯杆返回：', base64Decode(body.data));
				}
				const mode = this.mode;
				const id = this.form.id || 0;
				uni.showToast({ title: mode === 'edit' ? '保存成功' : '新增成功', icon: 'success' });
				this.close();
				// 通知父页面刷新灯杆列表（新增时回到第一页）
				this.$emit('saved', { mode, id });
			}).catch(err => {
				uni.hideLoading();
				this.submitting = false;
				console.error('保存灯杆失败', err && err.message);
				uni.showToast({ title: '保存失败', icon: 'none' });
			});
		},

		// 解析接口业务错误信息（msg / message，data 可能是 Base64 或 JSON）
		decodeErrorMessage(payload) {
			if (!payload) return '';
			let msg = payload.msg || payload.message || '';
			const data = payload.data;
			if (typeof data === 'string' && data) {
				if (/^[A-Za-z0-9+/=]+$/.test(data)) {
					const decoded = base64Decode(data);
					if (decoded) msg = decoded;
				}
				if (!msg) msg = data;
			}
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
}
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
	background: var(--bg-card, #ffffff);
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* 标题 */
.popup-head {
	flex-shrink: 0;
	padding: 30rpx 24rpx 20rpx;
	text-align: center;

	.popup-title {
		font-size: 32rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
	}
}

/* 表单区域 */
.form-area {
	flex: 1;
	overflow-y: auto;
	padding: 0 20rpx 20rpx;
}

.form-row {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;

	.form-label {
		width: 160rpx;
		font-size: 28rpx;
		color: var(--text-secondary, #666666);
		flex-shrink: 0;
	}

	.form-control {
		flex: 1;
		min-width: 0;
	}

	.input-control {
		height: 72rpx;
		padding: 0 20rpx;
		background: var(--bg-soft, #f0f2f5);
		border: 1px solid var(--border-color, #e4e7ed);
		border-radius: 8rpx;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		box-sizing: border-box;
	}

	/* 灯杆高度：输入框 + 单位 */
	.height-control {
		display: flex;
		align-items: center;
		height: 72rpx;
		padding: 0 20rpx;
		background: var(--bg-soft, #f0f2f5);
		border: 1px solid var(--border-color, #e4e7ed);
		border-radius: 8rpx;
		box-sizing: border-box;

		.height-input {
			flex: 1;
			min-width: 0;
			height: 100%;
			font-size: 28rpx;
			color: var(--text-primary, #333333);
		}

		.height-unit {
			flex-shrink: 0;
			margin-left: 10rpx;
			font-size: 28rpx;
			color: var(--text-secondary, #666666);
		}
	}

	/* 经纬度：左侧两行坐标，右侧定位图标 */
	.coord-control {
		display: flex;
		align-items: center;
		gap: 12rpx;

		.coord-fields {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 6rpx;
			height: 96rpx;
			padding: 12rpx 20rpx;
			background: var(--bg-soft, #f0f2f5);
			border: 1px solid var(--border-color, #e4e7ed);
			border-radius: 8rpx;
			box-sizing: border-box;
		}

		.coord-line {
			font-size: 26rpx;
			color: var(--text-primary, #333333);
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;

			&.placeholder {
				color: var(--text-tertiary, #909399);
			}
		}

		.coord-location {
			width: 72rpx;
			height: 72rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
	}
}

/* 输入框占位文字 */
.placeholder {
	color: var(--text-tertiary, #909399);
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
			background: var(--bg-card, #ffffff);
			color: var(--color-primary, #007aff);
			border: 1px solid var(--color-primary, #007aff);
		}

		&.confirm {
			background: var(--color-primary, #007aff);
			color: #ffffff;
		}
	}
}
</style>
