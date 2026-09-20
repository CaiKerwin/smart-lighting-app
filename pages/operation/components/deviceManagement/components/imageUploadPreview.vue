<template>
	<view v-if="visible" :class="themeClass" class="popup-mask" @click="handleMaskClick">
		<!-- 弹窗容器 -->
		<view class="popup-box" @click.stop>
			<!-- 头部标题 -->
			<view class="popup-header">
				<text class="popup-title">{{ title }}</text>
			</view>

			<!-- 已选图片卡片 -->
			<scroll-view :style="{ height: bodyHeight }" class="popup-body" scroll-y>
				<view class="image-grid">
					<view v-for="(path, index) in images" :key="path + '_' + index" class="image-card">
						<view class="image-box">
							<image
								:src="path"
								class="image-thumb"
								mode="aspectFill"
								@click="previewImage(index)"/>
						</view>
						<view class="image-delete" @click="removeImage(index)">删除</view>
					</view>

					<!-- 继续添加（未达到上限时显示） -->
					<view v-if="images.length < maxCount" class="image-card image-card-add" @click="chooseMore">
						<view class="image-box image-add">
							<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="40" type="plusempty"></uni-icons>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 底部固定操作按钮 -->
			<view class="popup-footer">
				<view class="footer-btn btn-cancel" @click="handleCancel">取消</view>
				<view :class="{ 'btn-disabled': uploading }" class="footer-btn btn-confirm" @click="handleConfirm">上传图片</view>
			</view>
		</view>
	</view>
</template>

<script>
// 卡片尺寸（rpx）：与下方样式保持一致，用于计算内容区高度
const IMAGE_HEIGHT = 240;    // 图片高度
const DELETE_HEIGHT = 64;    // 删除按钮高度
const DELETE_MARGIN = 16;    // 删除按钮与图片的间距
const CARD_PADDING = 16;     // 卡片内边距
const GRID_GAP = 20;         // 卡片间距
const GRID_PADDING = 20;     // 网格内边距
const MAX_BODY_HEIGHT = 820; // 内容区最大高度（超出后上下滑动）
const ROW_HEIGHT = IMAGE_HEIGHT + DELETE_MARGIN + DELETE_HEIGHT + CARD_PADDING * 2; // 单行卡片高度

/**
 * 图片上传预览弹窗
 *
 * 用法：父组件通过 ref 调用 open(paths) 打开弹窗，用户确认后触发 confirm 事件，
 * 由父组件负责真正的上传/绑定请求（本组件只负责选图、预览、删除与交互）。
 *
 *   <image-upload-preview ref="uploadPreview" :max-count="9"
 *       @confirm="handleUploadImages" @cancel="handleCancelUpload" />
 *
 * 布局：头部标题「上传图片」，中间图片卡片区可上下滑动，底部固定「取消 / 上传图片」。
 */
export default {
	name: 'ImageUploadPreview',
	props: {
		// 头部标题文案
		title: {
			type: String,
			default: '上传图片'
		},
		// 最多可选图片数量
		maxCount: {
			type: Number,
			default: 9
		}
	},
	data() {
		return {
			visible: false,   // 是否显示弹窗
			images: [],       // 已选图片的本地路径
			uploading: false  // 上传中：禁用确认按钮与删除/添加操作
		};
	},
	computed: {
		// 内容区高度：按图片行数自适应，超过上限后内部滚动，保证底部按钮始终可见
		bodyHeight() {
			const total = this.images.length + (this.images.length < this.maxCount ? 1 : 0); // 含「继续添加」卡片
			const rows = Math.max(1, Math.ceil(total / 2));
			const height = rows * (ROW_HEIGHT + GRID_GAP) - GRID_GAP + GRID_PADDING * 2;
			return Math.min(height, MAX_BODY_HEIGHT) + 'rpx';
		}
	},
	methods: {
		/**
		 * 打开弹窗
		 * @param {Array<String>} paths 已选图片的本地路径数组
		 */
		open(paths) {
			this.images = (Array.isArray(paths) ? paths : []).filter(Boolean).slice(0, this.maxCount);
			this.uploading = false;
			this.visible = true;
		},
		// 关闭弹窗并清空已选图片
		close() {
			this.visible = false;
			this.uploading = false;
			this.images = [];
		},
		/**
		 * 设置上传状态（由父组件在上传/绑定过程中调用，避免重复提交）
		 * @param {Boolean} flag
		 */
		setUploading(flag) {
			this.uploading = !!flag;
		},
		// 点击「取消」：关闭弹窗并通知父组件
		handleCancel() {
			if (this.uploading) return; // 上传中禁止取消，防止请求结果丢失
			this.close();
			this.$emit('cancel');
		},
		// 点击遮罩：等同于取消
		handleMaskClick() {
			this.handleCancel();
		},
		// 点击「上传图片」：把已选图片路径交给父组件去上传/绑定
		handleConfirm() {
			if (this.uploading) return; // 防止重复点击
			if (this.images.length === 0) {
				uni.showToast({ title: '请先选择图片', icon: 'none' });
				return;
			}
			this.$emit('confirm', this.images.slice());
		},
		// 点击预览图：全屏查看
		previewImage(index) {
			uni.previewImage({
				urls: this.images,
				current: this.images[index]
			});
		},
		// 删除单张图片
		removeImage(index) {
			if (this.uploading) return;
			this.images.splice(index, 1);
		},
		// 继续从相册/相机添加图片
		chooseMore() {
			if (this.uploading) return;
			const remain = this.maxCount - this.images.length;
			if (remain <= 0) {
				uni.showToast({ title: `最多选择${this.maxCount}张图片`, icon: 'none' });
				return;
			}
			uni.chooseImage({
				count: remain,
				sizeType: ['compressed'],          // 压缩图，节省流量
				sourceType: ['album', 'camera'],   // 相册或拍照
				success: (res) => {
					const paths = (res && res.tempFilePaths) || [];
					this.images = this.images.concat(paths.filter(Boolean)).slice(0, this.maxCount);
				},
				fail: (err) => {
					console.log('选择图片失败', err && err.errMsg);
				}
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* ============ 弹窗遮罩 ============ */
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 990;
	background-color: var(--popup-mask, rgba(0, 0, 0, 0.5));
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-box {
	width: 640rpx;
	background-color: var(--bg-card);
	border-radius: 24rpx;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}

/* ============ 头部标题 ============ */
.popup-header {
	flex-shrink: 0;
	height: 100rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 30rpx;
	border-bottom: 2rpx solid var(--border-color);
	box-sizing: border-box;
}

.popup-title {
	font-size: 34rpx;
	font-weight: 600;
	color: var(--text-primary);
}

/* ============ 图片卡片区（可上下滑动） ============ */
.popup-body {
	width: 100%;
	box-sizing: border-box;
}

.image-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding: 20rpx;
	box-sizing: border-box;
}

.image-card {
	background-color: var(--bg-card);
	border-radius: 16rpx;
	border: 2rpx solid var(--border-color);
	padding: 16rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

/* 继续添加卡片：下方留出与「删除」按钮等高的空间，保证网格高度一致 */
.image-card-add {
	padding-bottom: 96rpx;
}

.image-box {
	width: 100%;
	height: 240rpx;
	border-radius: 12rpx;
	overflow: hidden;
	background-color: var(--bg-soft);
	border: 2rpx solid var(--border-color);
	box-sizing: border-box;
}

.image-thumb {
	width: 100%;
	height: 100%;
	display: block;
}

.image-add {
	display: flex;
	align-items: center;
	justify-content: center;
	border-style: dashed;
}

.image-delete {
	margin-top: 16rpx;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 8rpx;
	background-color: #e53935; /* 红色删除按钮 */
	color: #ffffff;
	font-size: 28rpx;
	text-align: center;
}

/* ============ 底部固定按钮 ============ */
.popup-footer {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx 24rpx;
	border-top: 2rpx solid var(--border-color);
	box-sizing: border-box;
}

.footer-btn {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border-radius: 12rpx;
	font-size: 32rpx;
}

.btn-cancel {
	background-color: var(--color-primary);
	color: #ffffff;
}

.btn-confirm {
	background-color: var(--color-primary);
	color: #ffffff;
}

.btn-disabled {
	opacity: 0.6;
}
</style>
