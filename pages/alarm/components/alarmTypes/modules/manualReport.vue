<template>
	<view class="page-container">
		<view class="report-card">
			<!-- 灯杆编号 -->
			<view class="form-item">
				<text class="label">灯杆编号</text>
				<uni-easyinput placeholder="输入" />
			</view>

			<!-- 故障类型 (多选) -->
			<view class="form-item">
				<text class="label">故障类型</text>
				<view class="type-grid">
					<view
						class="type-item"
						:class="{ 'active': selectedTypes.includes(item) }"
						@click="toggleType(item)"
						v-for="(item, index) in faultTypes"
						:key="index"
					>
						{{ item }}
					</view>
				</view>
			</view>

			<!-- 故障现象 -->
			<view class="form-item">
				<uni-easyinput type="textarea" placeholder="输入故障现象" class="textarea-input" />
			</view>

			<!-- 称呼 -->
			<view class="form-item">
				<uni-easyinput placeholder="输入称呼" class="normal-input" />
			</view>

			<!-- 联系方式 -->
			<view class="form-item">
				<uni-easyinput placeholder="输入联系方式,用于回访." class="normal-input" />
			</view>

			<!-- 拍照上传区 -->
			<view class="upload-area" @click="chooseImage">
				<!-- 无图片时显示相机图标 -->
				<view v-if="imageList.length === 0" class="upload-placeholder">
					<uni-icons type="camera" size="60rpx" color="#a0aab8"></uni-icons>
					<text class="upload-tip">点击上传</text>
				</view>
				<!-- 有图片时显示缩略图网格 -->
				<view v-else class="image-grid">
					<view class="image-item" v-for="(img, idx) in imageList" :key="idx">
						<image :src="img" mode="aspectFill" class="upload-image"></image>
						<view class="delete-btn" @click.stop="deleteImage(idx)">×</view>
					</view>
					<!-- 添加更多图片的按钮（最多9张） -->
					<view v-if="imageList.length < 9" class="add-item" @click.stop="chooseImage">
						<uni-icons type="plus" size="40rpx" color="#a0aab8"></uni-icons>
					</view>
				</view>
			</view>

			<!-- 底部按钮 -->
			<view class="btn-group">
				<view class="btn cancel" @click="backToAlarmWorker">取消</view>
				<view class="btn submit">提交</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			faultTypes: ['路灯不亮', '白天亮灯', '灯杆倾斜', '路灯损坏', '灯杆小广告', '其它'],
			selectedTypes: [],
			imageList: [] // 存储已选图片的本地路径
		};
	},
	methods: {
		toggleType(typeName) {
			const index = this.selectedTypes.indexOf(typeName);
			if (index > -1) {
				this.selectedTypes.splice(index, 1);
			} else {
				this.selectedTypes.push(typeName);
			}
		},
		// 选择图片（支持多选）
		chooseImage() {
			const remain = 9 - this.imageList.length;
			if (remain <= 0) {
				uni.showToast({
					title: '最多上传9张图片',
					icon: 'none'
				});
				return;
			}
			uni.chooseImage({
				count: remain, // 剩余可传数量
				sizeType: ['compressed'], // 可指定原图或压缩图
				sourceType: ['album', 'camera'], // 从相册或相机选择
				success: (res) => {
					const tempFiles = res.tempFilePaths;
					this.imageList = this.imageList.concat(tempFiles);
				},
				fail: (err) => {
					console.log('选择图片失败', err);
				}
			});
		},
		// 删除指定图片
		deleteImage(index) {
			this.imageList.splice(index, 1);
		},
		backToAlarmWorker() {
			uni.navigateBack();
		}
	}
}
</script>

<style lang="scss" scoped>
.page-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding: 40rpx;
}

.report-card {
	background: #ffffff;
	padding: 40rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
}

.form-item {
	margin-bottom: 30rpx;
}

.label {
	font-weight: bold;
	color: #333333;
	display: block;
	margin-bottom: 16rpx;
	font-size: 32rpx;
}

.type-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.type-item {
	flex: 1;
	min-width: calc((100% - 40rpx) / 3);
	background-color: #f4f8fb;
	color: #555555;
	text-align: center;
	padding: 16rpx 0;
	border-radius: 8rpx;
	font-size: 28rpx;
	box-sizing: border-box;
	transition: all 0.2s ease;
}

.type-item.active {
	background-color: #2b8bfe;
	color: #ffffff;
}

.textarea-input {
	margin-top: 10rpx;
}
.textarea-input ::v-deep .uni-easyinput__content {
	min-height: 280rpx;
	padding: 0 !important;
	align-items: flex-start;
}
.textarea-input ::v-deep textarea {
	padding: 20rpx 24rpx !important;
	width: 100%;
	box-sizing: border-box;
}

.normal-input {
	margin-top: 10rpx;
}

/* ===== 图片上传区域 ===== */
.upload-area {
	width: 100%;
	min-height: 160rpx;
	background-color: #f4f8fb;
	border-radius: 8rpx;
	padding: 20rpx;
	box-sizing: border-box;
	margin-top: 20rpx;
	margin-bottom: 50rpx;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
}

.upload-placeholder {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 20rpx 0;
}

.upload-tip {
	font-size: 24rpx;
	color: #a0aab8;
	margin-top: 10rpx;
}

.image-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	width: 100%;
}

.image-item,
.add-item {
	width: 160rpx;
	height: 160rpx;
	border-radius: 8rpx;
	overflow: hidden;
	position: relative;
	flex-shrink: 0;
}

.image-item {
	background-color: #e5e9f0;
}

.upload-image {
	width: 100%;
	height: 100%;
	display: block;
}

.delete-btn {
	position: absolute;
	top: 4rpx;
	right: 4rpx;
	width: 40rpx;
	height: 40rpx;
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	color: #ffffff;
	font-size: 32rpx;
	line-height: 40rpx;
	text-align: center;
	font-weight: bold;
	cursor: pointer;
	z-index: 2;
}

.add-item {
	border: 2rpx dashed #c0c8d4;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f4f8fb;
}

.btn-group {
	display: flex;
	justify-content: space-around;
	margin-top: 20rpx;
}

.btn {
	width: 40%;
	text-align: center;
	padding: 20rpx 0;
	border-radius: 12rpx;
	font-size: 32rpx;
	cursor: pointer;
}

.btn.cancel {
	border: 2rpx solid #2b8bfe;
	color: #2b8bfe;
	background: #ffffff;
}

.btn.submit {
	background: #2b8bfe;
	color: #ffffff;
}
</style>
