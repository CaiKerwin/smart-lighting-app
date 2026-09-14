<template>
	<view v-if="visible" class="popup-mask">
		<view class="popup-container">
			<!-- 头部 -->
			<view class="popup-header">
				<text class="popup-title">编辑名称</text>
			</view>

			<!-- 表单内容区 -->
			<view class="popup-body">
				<view class="form-row">
					<text class="form-label">名称</text>
					<input
						v-model="form.name"
						class="form-input"
						maxlength="20"
						placeholder="请输入名称"
						:placeholder-style="placeholderStyle"
					/>
				</view>
				<view class="form-row">
					<text class="form-label">通信ID</text>
					<input
						v-model="form.code"
						class="form-input"
						maxlength="20"
						placeholder="请输入通信ID"
						:placeholder-style="placeholderStyle"
					/>
				</view>
			</view>

			<!-- 底部按钮区 -->
			<view class="popup-footer">
				<button class="footer-btn cancel" @click="$emit('close')">取消</button>
				<button class="footer-btn confirm" @click="handleConfirm">确定</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'LightEditPopup',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		lightInfo: {
			type: Object,
			default: () => ({})
		}
	},
	data() {
		return {
			form: {
				name: '',
				code: ''
			}
		};
	},
	computed: {
		// 占位文字颜色跟随主题
		placeholderStyle() {
			return this.isDarkMode ? 'color:#6d7689' : 'color:#999999';
		}
	},
	watch: {
		// 弹窗打开时，初始化表单数据
		// 名称取不含灯杆前缀的单灯名 rawName，通信ID取 connectId
		visible(val) {
			if (val) {
				this.form.name = this.lightInfo.rawName || '';
				this.form.code = this.lightInfo.connectId || '';
			}
		}
	},
	methods: {
		handleConfirm() {
			if (!this.form.name.trim()) {
				uni.showToast({ title: '请输入名称', icon: 'none' });
				return;
			}
			if (!this.form.code.trim()) {
				uni.showToast({ title: '请输入通信ID', icon: 'none' });
				return;
			}
			// 将表单数据抛出给父组件
			this.$emit('confirm', { ...this.form });
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
	background-color: var(--popup-mask, rgba(0, 0, 0, 0.5));
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-container {
	width: 90%;
	background-color: var(--bg-card, #ffffff);
	border-radius: 20rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.popup-header {
	padding: 40rpx 0 20rpx;
	text-align: center;
}

.popup-title {
	font-size: 32rpx;
	font-weight: bold;
	color: var(--text-primary, #333333);
}

.popup-body {
	padding: 20rpx 40rpx 40rpx;
}

.form-row {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.form-label {
	width: 140rpx;
	font-size: 28rpx;
	color: var(--text-secondary, #666666);
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	background-color: var(--bg-soft, #f2f4f8);
	border-radius: 8rpx;
	padding: 16rpx 20rpx;
	font-size: 28rpx;
	color: var(--text-primary, #333333);
	height: 40rpx;
}

.popup-footer {
	display: flex;
	justify-content: space-between;
	padding: 20rpx 40rpx 40rpx;
	gap: 30rpx;
}

.footer-btn {
	flex: 1;
	font-size: 30rpx;
	border-radius: 8rpx;
	height: 80rpx;
	line-height: 80rpx;
	padding: 0;
	margin: 0;

	&.cancel {
		background-color: var(--bg-card, #ffffff);
		color: var(--color-primary, #3a7bf7);
		border: 2rpx solid var(--color-primary, #3a7bf7);
		line-height: 76rpx;
	}

	&.confirm {
		background-color: var(--color-primary, #3a7bf7);
		color: #ffffff;
		border: none;
	}
}
</style>
