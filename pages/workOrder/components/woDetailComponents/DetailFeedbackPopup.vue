<template>
	<uni-popup ref="popup" :class="themeClass" :mask-click="true" type="center">
		<view class="feedback-popup">
			<!-- 头部 -->
			<view class="popup-header">
				<text class="popup-title">详情反馈</text>
				<view class="popup-close" @click="closePopup">
					<uni-icons :color="isDarkMode ? '#6d7689' : '#999'" size="24" type="closeempty"></uni-icons>
				</view>
			</view>

			<!-- 输入区 -->
			<view class="popup-body">
				<textarea
					v-model="content"
					class="feedback-textarea"
					placeholder="请输入需要反馈的内容"
					placeholder-class="feedback-placeholder"
				/>

				<!-- 图片上传网格 -->
				<view class="feedback-images">
					<!-- 已上传的图片 -->
					<view v-for="(img, index) in images" :key="index" class="img-item">
						<image :src="img" class="img-preview" mode="aspectFill"></image>
						<!-- 删除按钮 -->
						<view class="img-delete" @click="removeImage(index)">
							<uni-icons color="#fff" size="20" type="closeempty"></uni-icons>
						</view>
					</view>

					<!-- 加号占位/拍照框 (最多3张) -->
					<view v-if="images.length < 3" class="img-item add-box" @click="chooseImage">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#888'" size="32" type="camera-filled"></uni-icons>
					</view>
				</view>
			</view>

			<!-- 提交按钮 -->
			<button class="submit-btn" @click="submitFeedback">提交</button>
		</view>
	</uni-popup>
</template>

<script>
export default {
	name: 'DetailFeedbackPopup',
	components: {},
	data() {
		return {
			content: '',
			images: []
		};
	},
	methods: {
		// 供父组件调用的打开方法
		open() {
			// 每次打开清空数据
			this.content = '';
			this.images = [];
			this.$refs.popup.open();
		},
		// 内部关闭方法
		closePopup() {
			this.$refs.popup.close();
		},
		// 选择图片
		chooseImage() {
			const count = 3 - this.images.length;
			uni.chooseImage({
				count: count,
				sizeType: ['compressed'], // 默认压缩图，节省流量
				sourceType: ['album', 'camera'], // 从相册选择，或拍照
				success: (res) => {
					this.images = this.images.concat(res.tempFilePaths);
				},
				fail: (err) => {
					console.error('用户取消或选择失败', err);
				}
			});
		},
		// 删除图片
		removeImage(index) {
			this.images.splice(index, 1);
		},
		// 提交事件
		submitFeedback() {
			if (!this.content && this.images.length === 0) {
				uni.showToast({ title: '请填写反馈或上传图片', icon: 'none' });
				return;
			}
			// 向外抛出提交事件，将数据传给父组件
			this.$emit('submit', {
				content: this.content,
				images: this.images
			});
			this.$refs.popup.close();
		}
	}
}
</script>

<style lang="scss" scoped>
.feedback-popup {
	width: 640rpx;
	background: var(--bg-card, #ffffff);
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
			color: var(--text-primary, #1d2129);
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
			background: var(--bg-soft, #f2f3f5);
			border-radius: 12rpx;
			padding: 20rpx;
			box-sizing: border-box;
			font-size: 28rpx;
			color: var(--text-primary, #1d2129);
			border: 2rpx solid transparent;
			transition: all 0.3s;

			&:focus {
				border-color: #2b6df6;
				background: var(--bg-card, #ffffff);
			}
		}
		.feedback-placeholder {
			color: #86909c;
		}

		.feedback-images {
			display: flex;
			flex-wrap: wrap;
			gap: 20rpx;
			margin-top: 24rpx;

			.img-item {
				position: relative;
				width: 160rpx;
				height: 160rpx;
				border-radius: 12rpx;
				overflow: hidden;

				.img-preview {
					width: 100%;
					height: 100%;
					background: var(--bg-soft, #f2f3f5);
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
					border: 4rpx dashed var(--border-color, #c9cdd4);
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
		&::after { border: none; }
	}
}
</style>
