<template>
	<view :class="themeClass" class="station-image-container">
		<!-- 列表区域 -->
		<scroll-view class="content-scroll" scroll-y>
			<view class="card-list">
				<view v-for="item in stationImageList" :key="item.imageId" class="card">
					<!-- 标题 -->
					<view class="card-title">{{ item.title || ' ' }}</view>

					<!-- 图片区域 -->
					<view class="card-image-box">
						<image
							v-if="item.imageId"
							:src="getStationImageUrl(item.imageId)"
							class="image-item"
							mode="aspectFill"
							@click="previewStationImage(item.imageId)"
						/>
					</view>

					<!-- 底部操作按钮 -->
					<view class="card-actions">
						<view class="btn btn-edit" @click="openEditModal(item)">编辑</view>
						<view class="btn btn-delete" @click="deleteStationImage(item)">删除</view>
					</view>
				</view>
			</view>
			<!-- 底部留出空间，避免被固定按钮遮挡 -->
			<view class="bottom-spacer"></view>
		</scroll-view>

		<!-- 底部固定按钮 -->
		<view class="footer-fixed">
			<view class="upload-btn" @click="chooseStationImages">上传图片</view>
		</view>

		<!-- 选中图片后的上传弹窗 -->
		<image-upload-preview
			ref="uploadPreview"
			:max-count="9"
			@cancel="handleCancelUpload"
			@confirm="handleUploadImages"
		/>

		<!-- 编辑名称弹窗 -->
		<view v-if="editModalVisible" class="modal-mask" @click="closeEditModal">
			<view class="modal-box" @click.stop>
				<view class="modal-title">编辑图片名称</view>
				<input
					v-model="editName"
					:focus="editModalVisible"
					class="modal-input"
					maxlength="30"
					placeholder="请输入图片名称"
					placeholder-class="modal-input-placeholder"
					type="text"
				/>
				<view class="modal-actions">
					<view class="modal-btn modal-btn-cancel" @click="closeEditModal">取消</view>
					<view class="modal-btn modal-btn-confirm" @click="confirmEdit">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import ImageUploadPreview from "@/pages/operation/components/deviceManagement/components/imageUploadPreview.vue";

export default {
	components: {
		ImageUploadPreview
	},
	data() {
		return {
			stationId: 0,
			// 站点图片列表
			stationImageList: [],
			// 编辑弹窗相关
			editModalVisible: false,
			editImageId: '',
			editName: '',

			imageList: [], // 存储已选图片的本地路径
			uploading: false, // 是否正在上传图片（防止重复提交）
			uploadFailedCount: 0, // 本次上传失败的图片数量
			pageInited: false // 首次进入由 onLoad 加载，onShow 只负责从图库返回后的刷新
		};
	},
	onLoad(options) {
		// 站点ID：新版平台可能为 GUID 字符串，老平台为纯数字；
		// 纯数字按数字提交，其它原样按字符串提交，避免 Number() 把 GUID 转成 0 导致查询/绑定失败
		const rawStationId = options && options.stationId != null ? String(options.stationId) : '';
		this.stationId = /^\d+$/.test(rawStationId) ? Number(rawStationId) : rawStationId;
		this.getStationImages();
	},
	// 从图库页面关联图片返回后刷新列表（首次进入由 onLoad 负责，避免重复请求）
	onShow() {
		if (this.pageInited) {
			this.getStationImages();
		} else {
			this.pageInited = true;
		}
	},
	// 下拉刷新
	onPullDownRefresh() {
		this.getStationImages();
	},
	methods: {
		// 获取站点图片列表
		getStationImages() {
			/**
			 * [{"key":"4cb782984a3d4c7f925fc7c1e4a21ee1","value":null}]
			 */
			request({
				url: '/station/config/QueryStationImages',
				method: 'POST',
				data: {
					stationId: this.stationId
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				const payload = res.data;
				if (payload && payload.data){
					const data = JSON.parse(base64Decode(payload.data))
					this.stationImageList = data.map(item => ({
						title: item.value,
						imageId: item.key
					}));
				}
			}).catch(err => {
				console.error('获取站点图片列表失败', err.message);
			}).finally(()=>{
				// 停止下拉刷新动画
				setTimeout(()=>{
					uni.stopPullDownRefresh();
				}, 1000)
			})
		},
		getStationImageUrl(imageId) {
			const token = uni.getStorageSync('authToken') || ''; // 从本地存储中获取 token
			if (!token) {
				console.warn('未获取到 token，图片可能无法显示');
			}
			return `https://www.amdm.top/api/center/station/config/ViewImage?id=${imageId}&auth=${token}`;
		},
		previewStationImage(imageId) {
			const url = this.getStationImageUrl(imageId);
			uni.previewImage({
				urls: [url]
			});
		},
		// 打开编辑弹窗
		openEditModal(item) {
			this.editImageId = item.imageId;
			this.editName = item.title || '';
			this.editModalVisible = true;
		},
		// 关闭编辑弹窗
		closeEditModal() {
			this.editModalVisible = false;
			this.editImageId = '';
			this.editName = '';
		},
		// 弹窗「确定」按钮
		confirmEdit() {
			const name = (this.editName || '').trim();
			if (!name) {
				uni.showToast({
					title: '请输入图片名称',
					icon: 'none'
				});
				return;
			}
			this.modifyStationImageName(this.editImageId, name);
		},
		// 修改图片名称
		modifyStationImageName(id, name) {
			request({
				url: '/station/config/SetCustImageName',
				method: 'POST',
				data: {
					id: id,
					name: name // 新的图片名称
				}
			}).then(res => {
				console.log(base64Decode(res.data.data));
				this.closeEditModal();
				uni.showToast({
					title: '修改成功',
					icon: 'success'
				});
				// 同步更新本地列表，避免整页刷新
				const target = this.stationImageList.find(item => item.imageId === id);
				if (target) {
					target.title = name;
				} else {
					this.getStationImages();
				}
			}).catch(err => {
				console.error('修改图片名称失败', err.message);
				uni.showToast({
					title: err.message || '修改失败',
					icon: 'none'
				});
			})
		},
		// 删除
		deleteStationImage(item) {
			uni.showModal({
				title: '删除图片',
				content: `确定要删除 ${item.title || '此图片'} 吗？`,
				success: (res) => {
					if (res.confirm) {
						request({
							url: '/station/config/UnbindStationImage',
							method: 'POST',
							data: {
								imageId: item.imageId,
								stationId: this.stationId
							}
						}).then(res => {
							console.log(base64Decode(res.data.data));
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							});
						}).catch(err => {
							console.error('删除图片失败', err.message);
							uni.showToast({
								title: '删除失败',
								icon: 'none'
							});
						}).finally(()=>{
							// 关闭弹窗并刷新图片列表
							this.closeEditModal();
							this.getStationImages();
						});
					}
				}
			});
		},
		/* ==================== 上传图片 ==================== */
		chooseStationImages() {
			if (this.uploading) return;
			uni.chooseImage({
				count: 9,                        // 单次最多可选 9 张
				sizeType: ['compressed'],        // 压缩图片
				sourceType: ['album', 'camera'], // 相册或拍照
				success: (res) => {
					const paths = ((res && res.tempFilePaths) || []).filter(Boolean);
					if (paths.length === 0) return;
					// 打开预览层（取消 / 图片 / 上传图片）
					if (this.$refs.uploadPreview) {
						this.$refs.uploadPreview.open(paths);
					}
				},
				fail: (err) => {
					console.log('选择图片失败', err && err.errMsg);
				}
			})
		},
		// 预览层「取消」：清空已选图片
		handleCancelUpload() {
			this.imageList = [];
		},
		// 预览层「确定」：先逐张上传图片，拿到图片ID后统一绑定到当前站点
		async handleUploadImages(paths) {
			this.imageList = (paths || []).slice();
			if (this.imageList.length === 0) {
				uni.showToast({ title: '请先选择图片', icon: 'none' });
				return;
			}
			if (!this.stationId) {
				uni.showToast({ title: '缺少站点ID，无法上传图片', icon: 'none' });
				return;
			}

			const preview = this.$refs.uploadPreview;
			this.uploading = true;
			if (preview) preview.setUploading(true);
			try {
				// 上传图片，拿到图片ID列表
				const ids = await this.uploadStationImages();
				if (ids.length === 0) {
					throw new Error('图片上传失败，请重试');
				}
				// 把上传成功的图片绑定到当前站点
				await this.bindStationImage(ids);

				// 成功：关闭预览层、刷新列表
				if (preview) preview.close();
				this.imageList = [];
				const failed = this.uploadFailedCount;
				uni.showToast({
					title: failed > 0 ? `成功${ids.length}张，失败${failed}张` : '上传成功',
					icon: failed > 0 ? 'none' : 'success'
				});
				this.getStationImages();
			} catch (err) {
				console.log('上传站点图片失败', err && err.message);
				uni.showToast({ title: (err && err.message) || '上传失败', icon: 'none' });
			} finally {
				this.uploading = false;
				if (preview) preview.setUploading(false);
			}
		},
		/**
		 * 上传站点图片
		 * 说明：服务端每次只处理一个文件，因此逐张串行上传，并收集返回的图片ID
		 * @returns {Promise<Array<String>>} 上传成功的图片ID列表
		 */
		async uploadStationImages() {
			const paths = this.imageList || [];
			if (paths.length === 0) {
				uni.showToast({ title: '请先选择图片', icon: 'none' });
				return [];
			}

			const imageIds = [];
			this.uploadFailedCount = 0;

			for (let i = 0; i < paths.length; i++) {
				uni.showLoading({ title: `上传中 ${i + 1}/${paths.length}`, mask: true });
				try {
					const imageId = await this.uploadSingleStationImage(paths[i]);
					if (imageId) {
						imageIds.push(imageId);
					} else {
						this.uploadFailedCount++;
					}
				} catch (err) {
					this.uploadFailedCount++;
					console.log('上传图片失败', err && err.message);
				}
				uni.hideLoading();
			}

			return imageIds;
		},
		/**
		 * 上传单张图片到图片库
		 * @param {String} path 图片本地路径
		 * @returns {Promise<String>} 新图片ID
		 */
		uploadSingleStationImage(path) {
			const date = new Date();
			const name = String(date.getFullYear()) + '-' + String(date.getMonth() + 1) + '-' + String(date.getDate()) + ' ' + String(date.getHours()) + ':' + String(date.getMinutes()) + ':' + String(date.getSeconds());
			return new Promise((resolve, reject) => {
				uni.uploadFile({
					url: 'https://www.amdm.top/api/center/station/config/UploadCustImage',
					filePath: path,      // file：图片本地路径
					name: 'file',        // 文件字段名固定为 file
					formData: {
						name: name,        // name：图片名称，固定为当前时间
						type: 1            // type：图片类型，1-站点图片 2-灯杆图片
					},
					header: {
						'auth': uni.getStorageSync('authToken') || '',
						'Custid': String(uni.getStorageSync('curCust')),
						'Lang': 'zh_cn',
						'Apptype': uni.getStorageSync('curApp') || 'road'
					},
					timeout: 30000,
					success: (res) => {
						try {
							resolve(this.parseUploadedImageId(res));
						} catch (err) {
							reject(err);
						}
					},
					fail: (err) => {
						reject(new Error((err && err.errMsg) || '图片上传失败'));
					}
				});
			});
		},
		/**
		 * 解析上传接口返回，取出新图片ID
		 * 响应形如：{ "code": 0, "data": Base64(图片ID 或 JSON) }
		 * @param {Object|String} res uni.uploadFile 的返回值
		 * @returns {String} 图片ID
		 */
		parseUploadedImageId(res) {
			let body = res && res.data;
			if (typeof body === 'string') {
				try {
					body = JSON.parse(body);
				} catch (e) {
					body = null;
				}
			}
			if (!body || typeof body !== 'object') {
				throw new Error('图片上传失败');
			}
			const code = Number(body.code);
			if (!Number.isNaN(code) && code !== 0 && code !== 200) {
				throw new Error(this.decodeErrorMessage(body) || '图片上传失败');
			}
			return this.pickImageId(body.data);
		},
		/**
		 * 从 data 字段中取出图片ID（兼容 Base64(JSON)、纯JSON、字符串、数组等返回形式）
		 * @param {any} data
		 * @returns {String} 图片ID，取不到返回空串
		 */
		pickImageId(data) {
			let value = data;
			if (typeof value === 'string') {
				const text = value.trim();
				if (text && /^[A-Za-z0-9+/]+={0,2}$/.test(text)) {
					const decoded = base64Decode(text);
					if (decoded) {
						try {
							// 解码出 JSON：说明 data 确实是 Base64(JSON)
							value = JSON.parse(decoded);
						} catch (e) {
							// 不是 JSON：仅当解码结果形似图片ID时才按 Base64 处理，
							// 否则说明原文本身就是图片ID（Base64 解出来的是乱码）
							if (this.isImageIdLike(decoded) && !this.isImageIdLike(text)) {
								value = decoded;
							}
						}
					}
				}
			}

			if (value === null || value === undefined) return '';
			if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					const id = this.pickImageId(value[i]);
					if (id) return id;
				}
				return '';
			}
			if (typeof value === 'object') {
				const keys = ['imageId', 'ImageId', 'id', 'Id', 'key', 'fid'];
				for (let i = 0; i < keys.length; i++) {
					const id = value[keys[i]];
					if (id !== null && id !== undefined && id !== '') return String(id);
				}
				return '';
			}
			return String(value).trim().replace(/^"|"$/g, '');
		},
		// 判断字符串是否形似图片ID（GUID / 32位十六进制 / 纯数字）
		isImageIdLike(text) {
			return /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/.test(text) ||
				/^[0-9a-fA-F]{32}$/.test(text) ||
				/^\d+$/.test(text);
		},
		/**
		 * 绑定站点图片
		 * 请求体：stationIds 站点ID列表（只传当前站点）、ids 图片ID列表（可多张）
		 * @param {String|Number|Array} ids 单个或多个图片ID
		 * @returns {Promise<Boolean>}
		 */
		async bindStationImage(ids) {
			const imageIds = (Array.isArray(ids) ? ids : [ids])
				.filter(id => id !== null && id !== undefined && id !== '')
				.map(id => String(id));
			if (imageIds.length === 0) {
				return Promise.reject(new Error('请先选择图片'));
			}
			if (!this.stationId) {
				return Promise.reject(new Error('缺少站点ID，无法绑定图片'));
			}
			return await request({
				url: '/station/config/BindStationImages',
				method: 'POST',
				data: {
					stationIds: [this.stationId],
					ids: imageIds
				}
			}).then(res => {
				const body = res && res.data;
				const code = body ? Number(body.code) : 0;
				if (!Number.isNaN(code) && code !== 0 && code !== 200) {
					throw new Error(this.decodeErrorMessage(body) || '绑定图片失败');
				}
				console.log('绑定站点图片成功', imageIds);
				return true;
			});
		},
		// 解析业务错误提示（失败时 data 为提示文案，可能是 Base64）
		decodeErrorMessage(payload) {
			if (!payload) return '';
			let msg = payload.msg || payload.message || '';
			const data = payload.data;
			if (!msg && typeof data === 'string' && data) {
				msg = /^[A-Za-z0-9+/=]+$/.test(data) ? (base64Decode(data) || data) : data;
			}
			return String(msg || '');
		}
	}
};
</script>

<style lang="scss" scoped>
.station-image-container {
	min-height: 100vh;
	background-color: var(--bg-page);
	display: flex;
	flex-direction: column;
}

.content-scroll {
	flex: 1;
	height: 100vh;
	box-sizing: border-box;
}

.card-list {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	padding: 24rpx 30rpx;
}

.card {
	width: 48%; /* 每行2张 */
	background-color: var(--bg-card);
	border-radius: 16rpx;
	padding: 16rpx;
	margin-bottom: 24rpx;
	box-sizing: border-box;
	box-shadow: 0 4rpx 16rpx var(--bg-box-shadow);
	display: flex;
	flex-direction: column;
}

.card-title {
	font-size: 28rpx;
	font-weight: 500;
	color: var(--text-primary);
	margin-bottom: 12rpx;
	min-height: 40rpx;
	line-height: 40rpx;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.card-image-box {
	width: 100%;
	height: 240rpx;
	background-color: var(--bg-soft);
	border-radius: 12rpx;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16rpx;
}

.image-item {
	width: 100%;
	height: 100%;
}

.card-actions {
	display: flex;
	justify-content: space-between;
	gap: 16rpx;
}

.btn {
	flex: 1;
	height: 56rpx;
	line-height: 56rpx;
	text-align: center;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.btn-edit {
	background-color: var(--bg-accent);
	color: var(--color-primary);
}

/* 删除按钮 */
.btn-delete {
	background-color: rgba(245, 108, 108, 0.1);
	color: #f56c6c;
}

.theme-dark .btn-delete {
	background-color: rgba(245, 108, 108, 0.2);
}

.bottom-spacer {
	height: 180rpx; /* 为底部固定按钮留出空间 */
}

.footer-fixed {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
	background-color: var(--bg-page);
	box-sizing: border-box;
	z-index: 10;
}

.upload-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;
	background-color: var(--color-primary);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 500;
	border-radius: 16rpx;
	transition: opacity 0.2s;

	&:active {
		opacity: 0.8;
	}
}

/* ============ 编辑弹窗 ============ */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.modal-box {
	width: 560rpx;
	background-color: var(--bg-card);
	border-radius: 20rpx;
	padding: 40rpx 30rpx 30rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary);
	text-align: center;
	margin-bottom: 30rpx;
}

.modal-input {
	width: 100%;
	height: 80rpx;
	line-height: 80rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	font-size: 30rpx;
	color: var(--text-primary);
	background-color: var(--bg-soft);
	border-radius: 12rpx;
	margin-bottom: 40rpx;
}

.modal-input-placeholder {
	color: var(--text-quaternary);
	font-size: 28rpx;
}

.modal-actions {
	display: flex;
	gap: 20rpx;
}

.modal-btn {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border-radius: 12rpx;
	font-size: 30rpx;
}

.modal-btn-cancel {
	background-color: var(--bg-soft);
	color: var(--text-primary);
}

.modal-btn-confirm {
	background-color: var(--color-primary);
	color: #ffffff;
}
</style>
