<template>
	<view :class="themeClass" class="pole-gallery-container">
		<!-- 网格列表区域 -->
		<view class="grid-list">
			<view
				v-for="item in poleGalleryList"
				:key="item.imageId"
				:class="{ 'card-selected': selectedIds.includes(item.imageId) }"
				class="card"
			>
				<view class="card-title" @click="selectCard(item.imageId)">{{ item.title }}</view>
				<view class="pole-image-container">
					<image
						:src="getPoleGalleryImageUrl(item.imageId)"
						class="pole-gallery-image"
						mode="aspectFill"
						@click="previewPoleGalleryImage(item.imageId)"
					/>
				</view>
				<view class="card-actions">
					<view class="btn btn-edit" @click.stop="openEditModal(item)">编辑</view>
					<view class="btn btn-delete" @click.stop="deletePoleGalleryImage(item.imageId)">删除</view>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="footer-bar">
			<view
				:class="{ 'footer-btn-disabled': batchDeleting || associating }"
				class="footer-btn btn-danger"
				@click="batchDeletePoleGalleryImage"
			>
				批量删除
			</view>
			<view
				:class="{ 'footer-btn-disabled': batchDeleting || associating }"
				class="footer-btn btn-primary"
				@click="batchAssociatePoleImages"
			>
				关联图片
			</view>
		</view>

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

export default {
	data() {
		return {
			// 记录当前选中的多个卡片 ID 数组
			selectedIds: [],

			// 图库列表
			poleGalleryList: [],

			// 批量删除 / 关联图片进行中，用于防止重复提交
			batchDeleting: false,
			associating: false,

			// 编辑弹窗相关
			editModalVisible: false,
			editImageId: '',
			editName: '',

			poleId: 0, // 单灯对应灯杆ID
		};
	},
	onLoad(options) {
		const rawPoleId = options && options.poleId != null ? String(options.poleId) : '';
		this.poleId = /^\d+$/.test(rawPoleId) ? Number(rawPoleId) : rawPoleId;
		this.getPoleGalleryList();
	},
	// 下拉刷新
	onPullDownRefresh() {
		this.getPoleGalleryList();
	},
	methods: {
		getPoleGalleryImageUrl(imageId){
			const token = uni.getStorageSync('authToken') || ''; // 从本地存储中获取 token
			if (!token) {
				console.warn('未获取到 token，图片可能无法显示');
			}
			return `https://www.amdm.top/api/center/station/config/ViewImage?id=${imageId}&auth=${token}`;
		},
		previewPoleGalleryImage(imageId) {
			uni.previewImage({
				urls: [this.getPoleGalleryImageUrl(imageId)]
			});
		},

		// 获取图库列表
		getPoleGalleryList() {
			/**
			 * [
			 *   {
			 *     "imageId": "77cebcc5d48f410ab386ea7cb77bcb63",
			 *     "type": 2,
			 *     "name": "Dog",
			 *     "stationCount": 1,
			 *     "poleCount": 3
			 *   }
			 * ]
			 */
			request({
				url: '/station/config/QueryCustImages',
				method: 'POST',
				data: {}
			}).then(res =>{
				const payload = res.data
				if (payload && payload.data){
					const decoded = base64Decode(payload.data);
					console.log(decoded);
					let data = [];
					try {
						data = JSON.parse(decoded);
					} catch (e) {
						console.error('图库列表解析失败', e && e.message);
					}
					if (!Array.isArray(data)) data = [];
					// 过滤显示灯杆（type=2）图片并反转顺序
					this.poleGalleryList = data
						.filter(item => item.type === 2)
						.reverse()
						.map(item => ({
							title: item.name !== null ? item.name : ' ',
							imageId: item.imageId,
							// 用于删除图片时显示
							stationCount: item.stationCount || 0,
							poleCount: item.poleCount || 0
						}))
					// 丢弃列表中已不存在的选中项（例如在其它端已删除的图片）
					const validIds = this.poleGalleryList.map(item => item.imageId);
					this.selectedIds = this.selectedIds.filter(id => validIds.includes(id));
				}

			}).catch(err =>{
				console.error('获取图库列表失败:', err.message);
			}).finally(() => {
				// 停止下拉刷新动画
				setTimeout(()=>{
					uni.stopPullDownRefresh();
				}, 1000)
			})
		},
		// 点击卡片切换选中状态
		selectCard(id) {
			const index = this.selectedIds.indexOf(id);
			if (index > -1) {
				// 已选中，则从数组中移除（取消选中）
				this.selectedIds.splice(index, 1);
			} else {
				// 未选中，则添加到数组中（选中）
				this.selectedIds.push(id);
			}
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
			this.modifyPoleGalleryImageName(this.editImageId, name);
		},
		// 修改图片名称
		modifyPoleGalleryImageName(id, name) {
			request({
				url: '/station/config/SetCustImageName',
				method: 'POST',
				data: {
					id: id,
					name: name // 新的图片名称
				}
			}).then(res => {
				console.log(base64Decode(res.data.data))
				this.closeEditModal();
				uni.showToast({
					title: '修改成功',
					icon: 'success'
				});
				// 同步更新本地列表，避免整页刷新
				const target = this.poleGalleryList.find(item => item.imageId === id);
				if (target) {
					target.title = name;
				} else {
					this.getPoleGalleryList();
				}
			}).catch(err => {
				console.log('修改图片名称失败', err.message);
				uni.showToast({
					title: err.message || '修改失败',
					icon: 'none'
				});
			})
		},
		/* ==================== 删除图片 ==================== */
		// 单张删除
		deletePoleGalleryImage(id) {
			if (this.batchDeleting || this.associating) return;
			const target = this.poleGalleryList.find(item => item.imageId === id);
			uni.showModal({
				title: `删除 ${(target && target.title) || '该灯杆图片'}`,
				content: this.buildDeleteConfirmContent([target]),
				success: (res) => {
					if (res.confirm) {
						this.doDeleteImages([id]);
					}
				}
			})
		},
		// 批量删除
		batchDeletePoleGalleryImage() {
			if (this.batchDeleting || this.associating) return;
			// 校验
			if (this.selectedIds.length === 0) {
				uni.showToast({
					title: '请选择要删除的图片',
					icon: 'none'
				});
				return;
			}
			// 按列表顺序取出选中的图片，保证删除顺序与提示文案稳定
			const targets = this.poleGalleryList.filter(item => this.selectedIds.includes(item.imageId));
			if (targets.length === 0) {
				uni.showToast({
					title: '请选择要删除的图片',
					icon: 'none'
				});
				return;
			}
			uni.showModal({
				title: '批量删除图片',
				content: this.buildBatchDeleteConfirmContent(targets),
				success: (res) => {
					if (res.confirm) {
						this.doDeleteImages(targets.map(item => item.imageId));
					}
				}
			})
		},
		// 单张删除的确认文案
		buildDeleteConfirmContent(targets) {
			const binding = this.buildBindingText(targets);
			return binding ? `图片已经绑定${binding}（强制删除会同时解除绑定），确认删除吗?` : '确认删除吗?';
		},
		// 批量删除的确认文案
		buildBatchDeleteConfirmContent(targets) {
			const list = (targets || []).filter(Boolean);
			const binding = this.buildBindingText(list);
			return binding
				? `选中的${list.length}张图片已经绑定${binding}（强制删除会同时解除绑定），确认删除吗？`
				: `确认删除选中的${list.length}张图片吗？`;
		},
		// 累加选中图片已绑定的站点/灯杆数量，未绑定返回空串
		buildBindingText(targets) {
			const list = (targets || []).filter(Boolean);
			const stationCount = list.reduce((sum, item) => sum + (item.stationCount || 0), 0);
			const poleCount = list.reduce((sum, item) => sum + (item.poleCount || 0), 0);
			if (stationCount > 0 && poleCount > 0) return `${stationCount}个站点和${poleCount}个灯杆`;
			if (poleCount > 0) return `${poleCount}个灯杆`;
			if (stationCount > 0) return `${stationCount}个站点`;
			return '';
		},
		/**
		 * 删除图片（单张 / 批量共用）
		 * DeleteCustImage 一次只能删除一张图片，所以按选中顺序逐张串行调用：
		 * 每张成功后先本地移除，全部结束后统一提示、只刷新一次列表，
		 * 避免并发请求互相覆盖列表结果、连续弹出多个提示、以及失败也被当成成功
		 * @param {Array<String>} ids 图片ID列表
		 */
		async doDeleteImages(ids) {
			const imageIds = (ids || []).filter(id => id !== null && id !== undefined && id !== '');
			if (imageIds.length === 0 || this.batchDeleting || this.associating) return;

			this.batchDeleting = true;
			const total = imageIds.length;
			const failedIds = [];
			let successCount = 0;
			try {
				for (let i = 0; i < total; i++) {
					const id = imageIds[i];
					uni.showLoading({
						title: total > 1 ? `删除中 ${i + 1}/${total}` : '删除中...',
						mask: true
					});
					try {
						await this.deleteSingleImage(id);
						successCount++;
						// 本地先移除，界面立即反馈；删除失败的仍保留选中状态，方便重试
						this.poleGalleryList = this.poleGalleryList.filter(item => item.imageId !== id);
						this.selectedIds = this.selectedIds.filter(selectedId => selectedId !== id);
					} catch (err) {
						failedIds.push(id);
						console.error('删除图片失败', id, err && err.message);
					}
				}
			} finally {
				uni.hideLoading();
				this.batchDeleting = false;
			}

			// 汇总结果，只提示一次
			if (successCount === total) {
				uni.showToast({
					title: total > 1 ? `已删除${total}张图片` : '删除成功',
					icon: 'success'
				});
			} else if (successCount === 0) {
				uni.showToast({
					title: '删除失败',
					icon: 'none'
				});
			} else {
				uni.showToast({
					title: `成功${successCount}张，失败${failedIds.length}张`,
					icon: 'none'
				});
			}
			// 批量删除结束后统一刷新一次列表
			this.getPoleGalleryList();
		},
		/**
		 * 删除单张图片
		 * @param {String} id 图片ID
		 * @returns {Promise<Boolean>} 业务失败时 reject
		 */
		deleteSingleImage(id) {
			return request({
				url: '/station/config/DeleteCustImage',
				method: 'POST',
				data: {
					imageId: id,
					force: true // 是否强制删除，强制删除会同时删除已绑定的站点和灯杆
				}
			}).then(res => {
				const payload = res && res.data;
				const code = payload ? Number(payload.code) : 0;
				if (!Number.isNaN(code) && code !== 0 && code !== 200) {
					throw new Error(this.decodeErrorMessage(payload) || '删除失败');
				}
				console.log('删除图片成功', id, this.decodeDataText(payload));
				return true;
			});
		},

		/* ==================== 关联图片 ==================== */
		// 批量关联图片到当前灯杆
		batchAssociatePoleImages() {
			if (this.associating || this.batchDeleting) return;
			// 校验
			if (this.selectedIds.length === 0) {
				uni.showToast({
					title: '请选择要关联的图片',
					icon: 'none'
				});
				return;
			}
			if (!this.poleId) {
				uni.showToast({
					title: '缺少灯杆ID，无法关联图片',
					icon: 'none'
				});
				return;
			}
			// 取出选中的图片ID（按列表顺序，且必须是当前列表中真实存在的图片）
			const ids = this.poleGalleryList
				.filter(item => this.selectedIds.includes(item.imageId))
				.map(item => String(item.imageId));
			if (ids.length === 0) {
				uni.showToast({
					title: '请选择要关联的图片',
					icon: 'none'
				});
				return;
			}
			uni.showModal({
				title: '批量关联图片',
				content: `确认将选中的${ids.length}张图片关联到当前灯杆吗？`,
				success: (res) => {
					if (res.confirm) {
						this.doAssociatePoleImages(ids);
					}
				}
			})
		},
		/**
		 * 关联图片到当前灯杆
		 * BindPoleImages 支持一次绑定多张图片，所以只发一次请求：
		 * poleIds 为灯杆ID数组、ids 为图片ID数组（不能再包一层数组）
		 * @param {Array<String>} ids 图片ID列表
		 */
		async doAssociatePoleImages(ids) {
			const imageIds = (ids || [])
				.filter(id => id !== null && id !== undefined && id !== '')
				.map(id => String(id));
			if (imageIds.length === 0 || this.associating || this.batchDeleting) return;

			this.associating = true;
			uni.showLoading({ title: '关联中...', mask: true });
			try {
				const res = await request({
					url: '/station/config/BindPoleImages',
					method: 'POST',
					data: {
						poleIds: [this.poleId],
						ids: imageIds
					}
				});
				const payload = res && res.data;
				const code = payload ? Number(payload.code) : 0;
				if (!Number.isNaN(code) && code !== 0 && code !== 200) {
					throw new Error(this.decodeErrorMessage(payload) || '关联图片失败');
				}
				console.log('关联图片成功', imageIds, this.decodeDataText(payload));
				this.selectedIds = [];
				uni.hideLoading();
				uni.showToast({
					title: '关联成功',
					icon: 'success'
				});
				// 等提示展示完再返回上一页（上一页在 onShow 中刷新列表）
				setTimeout(() => {
					this.associating = false;
					uni.navigateBack();
				}, 800);
			} catch (err) {
				uni.hideLoading();
				this.associating = false;
				console.error('关联图片失败', err && err.message);
				uni.showToast({
					title: '关联失败',
					icon: 'none'
				});
			}
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
		},
		// 解析返回的 data 文本（Base64 编码，仅用于日志）
		decodeDataText(payload) {
			const data = payload && payload.data;
			return typeof data === 'string' && data ? (base64Decode(data) || data) : '';
		}
	}
}
</script>

<style lang="scss" scoped>
.pole-gallery-container {
	min-height: 100vh;
	background-color: var(--bg-page);
	/* 留出底部操作栏的空间 */
	padding: 20rpx 20rpx 140rpx;
	box-sizing: border-box;
}

.grid-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
}

.card {
	background-color: var(--bg-card);
	border-radius: 16rpx;
	padding: 16rpx;
	box-shadow: 0 4rpx 12rpx var(--bg-box-shadow);
	display: flex;
	flex-direction: column;
	/* 预留边框位置，防止选中时出现布局抖动 */
	border: 4rpx solid transparent;
	/* 添加过渡动画，让变蓝过程更平滑 */
	transition: border-color 0.2s ease;
	box-sizing: border-box;
}

/* 卡片选中状态 */
.card-selected {
	border-color: var(--color-primary);
}

.card-title {
	height: 40rpx;
	font-size: 28rpx;
	color: var(--text-primary);
	margin-bottom: 16rpx;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pole-image-container {
	width: 100%;
	height: 260rpx;
	background-color: var(--bg-soft);
	color: var(--text-quaternary);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	margin-bottom: 16rpx;

	.pole-gallery-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.card-actions {
	display: flex;
	justify-content: space-between;
	gap: 10rpx;
}

.btn {
	flex: 1;
	padding: 10rpx 0;
	border-radius: 8rpx;
	font-size: 26rpx;
	text-align: center;
}

.btn-edit {
	background-color: var(--bg-soft);
	color: var(--color-primary);
}

.btn-delete {
	background-color: #e53935;
	color: #ffffff;
}

.footer-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	background-color: var(--bg-card);
	padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	box-shadow: 0 -2rpx 10rpx var(--bg-box-shadow);
}

.footer-btn {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border-radius: 12rpx;
	font-size: 32rpx;
}

/* 操作进行中：置灰并避免重复点击 */
.footer-btn-disabled {
	opacity: 0.5;
}

.btn-primary {
	background-color: var(--color-primary);
	color: #ffffff;
}

.btn-danger {
	background-color: #e53935;
	color: #ffffff;
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
