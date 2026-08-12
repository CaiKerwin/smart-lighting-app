<template>
	<view class="login-page">
		<view class="login-card">
			<view class="title">修改密码</view>

			<view class="input-group">
				<view class="input-label">原密码</view>
				<view class="password-wrapper">
					<input
						class="input-field"
						:password="!oldPasswordVisible"
						v-model="oldPassword"
						placeholder="请输入原密码"
						placeholder-style="color: #cbd2dc;"
					/>
					<image
						class="eye-icon"
						:src="oldPasswordVisible ? '/static/login/eye-open.png' : '/static/login/eye-close.png'"
						@click="toggleOldPasswordVisible"
					/>
				</view>
			</view>

			<view class="input-group">
				<view class="input-label">新密码</view>
				<view class="password-wrapper">
					<input
						class="input-field"
						:password="!newPasswordVisible"
						v-model="newPassword"
						placeholder="请输入新密码"
						placeholder-style="color: #cbd2dc;"
					/>
					<image
						class="eye-icon"
						:src="newPasswordVisible ? '/static/login/eye-open.png' : '/static/login/eye-close.png'"
						@click="toggleNewPasswordVisible"
					/>
				</view>
				<text class="hint-text">*由数字、字母、特殊符号三种组成的8~16位字符，字母区分大小写。</text>
			</view>

			<view class="input-group">
				<view class="input-label">再次输入新密码</view>
				<view class="password-wrapper">
					<input
						class="input-field"
						:password="!confirmPasswordVisible"
						v-model="confirmPassword"
						placeholder="请输入新密码"
						placeholder-style="color: #cbd2dc;"
					/>
					<image
						class="eye-icon"
						:src="confirmPasswordVisible ? '/static/login/eye-open.png' : '/static/login/eye-close.png'"
						@click="toggleConfirmPasswordVisible"
					/>
				</view>
			</view>

			<button class="login-button" type="primary" @click="handleSubmit">修改密码</button>

			<view class="switch-login">
				<text class="switch-text" @click="goSmsModify">短信修改密码</text>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	name: 'ModifyPassword',
	data() {
		return {
			oldPassword: '',
			newPassword: '',
			confirmPassword: '',
			oldPasswordVisible: false,
			newPasswordVisible: false,
			confirmPasswordVisible: false
		};
	},
	methods: {
		goSmsModify() {
			uni.redirectTo({ url: '/pages/modifyPassword/phoneModifyPassword' });
		},
		toggleOldPasswordVisible() {
			this.oldPasswordVisible = !this.oldPasswordVisible;
		},
		toggleNewPasswordVisible() {
			this.newPasswordVisible = !this.newPasswordVisible;
		},
		toggleConfirmPasswordVisible() {
			this.confirmPasswordVisible = !this.confirmPasswordVisible;
		},
		validatePassword(password) {
			const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+~\-=[\]{};':"\\|,.<>/?]).{8,16}$/;
			return passwordRegex.test(password);
		},
		handleSubmit() {
			if (!this.oldPassword) {
				uni.showToast({ title: '请输入原密码', icon: 'none' });
				return;
			}
			if (!this.newPassword) {
				uni.showToast({ title: '请输入新密码', icon: 'none' });
				return;
			}
			if (!this.validatePassword(this.newPassword)) {
				uni.showToast({ title: '密码需包含数字、字母、特殊符号且长度8~16位', icon: 'none' });
				return;
			}
			if (!this.confirmPassword) {
				uni.showToast({ title: '请再次输入新密码', icon: 'none' });
				return;
			}
			if (this.newPassword !== this.confirmPassword) {
				uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
				return;
			}

			// 发起请求
			request({
				url: '/common/auth/Modify',
				method: 'POST',
				data: {
					old: this.oldPassword,
					pswd: this.newPassword
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data));
				if (res.data.code === 0 || res.statusCode === 200){
					uni.showModal({
						title: '提示',
						content: '修改成功，请重新登录',
						showCancel: false,
						success: (res) => {
							if (res.confirm) {
								uni.reLaunch({ url: '/pages/login/login' });
							}
						}
					});
				}

			}).catch(err =>{
				uni.showToast({ title: '修改密码失败，请重试', icon: 'none' });
				console.error(err.message);
			})

		}
	}
};
</script>

<style lang="scss" scoped>
.login-page {
	min-height: 100vh;
	background: #ffffff;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 40rpx;
	position: relative;
}


.login-card {
	width: 100%;
	max-width: 680rpx;
	background: transparent;
}

.title {
	font-size: 32px;
	font-weight: 700;
	color: #1f2d3d;
	margin-bottom: 64rpx;
}

.input-group {
	margin-bottom: 40rpx;
}

.input-label {
	font-size: 32rpx;
	font-weight: 600;
	color: #1f2d3d;
	margin-bottom: 16rpx;
}

.input-field {
	width: 100%;
	height: 40rpx;
	padding: 12rpx 0;
	border: none;
	border-bottom: 1px solid #e4e7ed;
	background: transparent;
	font-size: 28rpx;
	color: #1f2d3d;
	transition: border-color 0.3s;
}
.input-field:focus {
	border-bottom-color: #3075ff;
}

.password-wrapper {
	display: flex;
	align-items: center;
	width: 100%;
}

.password-wrapper .input-field {
	flex: 1;
	padding-right: 0;
}

.eye-icon {
	width: 24rpx;
	height: 12rpx;
	margin-left: 12rpx;
	opacity: 0.6;
	background-color: transparent;
}

.hint-text {
	margin-top: 16rpx;
	font-size: 22rpx;
	color: #909ba6;
	line-height: 34rpx;
}

.switch-login {
	margin-top: 24rpx;
	text-align: center;
}

.switch-text {
	font-size: 24rpx;
	color: #6c7b92;
}

.login-button {
	width: 100%;
	height: 96rpx;
	line-height: 96rpx;
	border-radius: 24rpx;
	background: linear-gradient(90deg, #3d80ff 0%, #1ba6ff 100%);
	color: #ffffff;
	font-size: 32rpx;
	border: none;
}
.login-button::after {
	border: none;
}
</style>
