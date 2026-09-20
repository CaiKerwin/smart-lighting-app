<template>
	<view :class="themeClass" class="page-container">
		<!-- 分组列表 -->
		<view class="group-list">
			<view v-for="item in groupList" :key="item.id" class="group-item">
				<view class="item-info">
					<view class="info-row">
						<text class="label">名称</text>
						<text class="value">{{ item.name }}</text>
					</view>
					<view class="info-row">
						<text class="label">编号</text>
						<text class="value">{{ item.number }}</text>
					</view>
				</view>
				<view class="item-actions">
					<view class="btn btn-edit" @click="openEditModal(item)">编辑</view>
					<view class="btn btn-delete" @click="deleteGroup(item)">删除</view>
				</view>
			</view>
		</view>

		<!-- 右下角悬浮按钮 -->
		<view class="fab-btn" @click="openAddModal">
			<uni-icons color="#ffffff" size="28" type="plusempty" />
		</view>

		<!-- 弹窗遮罩 -->
		<view v-if="showModal" class="modal-mask" @click="closeModal">
			<!-- 弹窗内容 -->
			<view class="modal-content" @click.stop>
				<view class="modal-title">{{ modalTitle }}</view>

				<view class="form-item">
					<text class="form-label">名称</text>
					<input
						v-model="formData.name"
						class="form-input"
						placeholder="输入名称"
						placeholder-class="input-placeholder"
						type="text"
					/>
				</view>

				<view class="form-item">
					<text class="form-label">分组编号</text>
					<input
						v-model="formData.number"
						class="form-input"
						placeholder="1 ~ 255之间"
						placeholder-class="input-placeholder"
						type="number"
					/>
				</view>

				<view class="modal-actions">
					<view class="modal-btn btn-cancel" @click="closeModal">取消</view>
					<view class="modal-btn btn-confirm" @click="addOrModifyGroup">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	props: {
		stationId: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			groupList: [],
			showModal: false,
			modalTitle: '添加分组',
			isEdit: false,
			formData: {
				id: null,
				name: '',
				number: ''
			}
		};
	},
	onLoad() {
		this.getGroupList();
	},
	methods: {
		// 获取分组列表
		getGroupList() {
			/**
			 * [
			 *   {
			 *     "id": 901,
			 *     "name": "App单灯分组",
			 *     "code": 5,
			 *     "planId": 2,
			 *     "planName": "公司测试"
			 *   }
			 * ]
			 */
			request({
				url: '/station/config/QueryArea',
				method: 'POST',
				data: {
					groupId: 0, // 分组ID，0表示所有分组
					stationId: this.stationId // 站点ID，0表示所有站点
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data))
				const payload = res.data
				if (payload && payload.data){
					const data = JSON.parse(base64Decode(payload.data))
					this.groupList = data.map(item => ({
						id: item.id,
						name: item.name,
						number: item.code
					}))
				}
			}).catch(err =>{
				console.error('获取分组列表失败', err.message)
			})
		},
		// 打开添加弹窗
		openAddModal() {
			this.isEdit = false;
			this.modalTitle = '添加分组';
			this.formData = { id: null, name: '', number: '' };
			this.showModal = true;
		},

		// 打开编辑弹窗
		openEditModal(item) {
			this.isEdit = true;
			this.modalTitle = '编辑分组';
			this.formData = { ...item };
			this.showModal = true;
		},

		// 关闭弹窗
		closeModal() {
			this.showModal = false;
		},

		// 提交表单
		addOrModifyGroup() {
			const name = this.formData.name.trim();
			const numberStr = String(this.formData.number).trim();

			// 校验名称
			if (!name) {
				uni.showToast({ title: '请输入名称', icon: 'none' });
				return;
			}

			// 校验编号
			if (!numberStr) {
				uni.showToast({ title: '请输入分组编号', icon: 'none' });
				return;
			}

			const number = Number(numberStr);
			if (!Number.isInteger(number) || number < 1 || number > 255) {
				uni.showToast({ title: '分组编号需为1~255之间的整数', icon: 'none' });
				return;
			}

			// 新增时编号和名称不能重复
			if (!this.isEdit && this.formData.number && this.formData.name) {
				const exists = this.groupList.some(
					g => Number(g.number) === number || g.name.trim() === name
				);
				if (exists) { // 编号或名称已存在
					uni.showToast({ title: '分组编号或名称已存在', icon: 'none' });
					return;
				}
			}

			request({
				url: '/station/config/SaveArea',
				method: 'POST',
				data: {
					id: this.isEdit ? this.formData.id : 0,
					name: this.formData.name,
					code: this.formData.number,
					// planId: 0,
					bright: 0,
					color: 0
				}
			}).then(res =>{
				console.log(base64Decode(res.data.data))
				if (this.isEdit) uni.showToast({ title: '修改成功', icon: 'success' });
				else uni.showToast({ title: '添加成功', icon: 'success' });
				// 刷新分组列表
				this.getGroupList();
				this.closeModal();
			}).catch(err=>{
				console.error('修改或者新增分组失败', err.message);
				if (this.isEdit) uni.showToast({ title: '修改失败', icon: 'none' });
				else uni.showToast({ title: '添加失败', icon: 'none' });
				// 刷新分组列表
				this.getGroupList();
				this.closeModal();
			})

		},

		// 删除分组
		deleteGroup(item) {
			uni.showModal({
				title: '提示',
				content: `确定要删除分组 ${item.name} 吗？`,
				success: (res) => {
					if (res.confirm) {
						request({
							url: '/station/config/DeleteArea',
							method: 'POST',
							data: {
								list: [item.id] // 一个一个删
							}
						}).then(res =>{
							console.log(base64Decode(res.data.data))
							this.getGroupList();
							uni.showToast({ title: '删除成功', icon: 'success' });
						}).catch(err =>{
							this.getGroupList();
							uni.showToast({ title: '删除失败', icon: 'none' });
							console.error('删除分组失败', err.message)
						})

					}
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	background-color: var(--bg-page);
	padding: 20rpx;
	box-sizing: border-box;
	position: relative;
}

/* 列表样式 */
.group-list {
	padding-bottom: 120rpx; /* 为悬浮按钮留出空间 */
}

.group-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: var(--bg-card);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 12rpx var(--bg-box-shadow);
}

.item-info {
	flex: 1;
}

.info-row {
	display: flex;
	margin-bottom: 12rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.label {
	width: 100rpx;
	font-size: 28rpx;
	color: var(--text-secondary);
}

.value {
	font-size: 28rpx;
	color: var(--text-primary);
	font-weight: 500;
}

.item-actions {
	display: flex;
	gap: 16rpx;
}

.btn {
	padding: 10rpx 30rpx;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #ffffff;
	text-align: center;
	background-color: var(--color-primary);
}

/* 悬浮按钮 */
.fab-btn {
	position: fixed;
	right: 40rpx;
	bottom: 80rpx;
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background-color: var(--color-primary);
	display: flex;
	justify-content: center;
	align-items: center;
	box-shadow: 0 8rpx 20rpx rgba(66, 133, 244, 0.4);
	z-index: 99;
}


/* 弹窗样式 */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: var(--popup-mask);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 10;
}

.modal-content {
	width: 600rpx;
	background-color: var(--bg-card);
	border-radius: 20rpx;
	padding: 40rpx;
	box-sizing: border-box;
}

.modal-title {
	font-size: 34rpx;
	font-weight: bold;
	color: var(--text-primary);
	text-align: center;
	margin-bottom: 40rpx;
}

.form-item {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.form-label {
	width: 140rpx;
	font-size: 28rpx;
	color: var(--text-secondary);
}

.form-input {
	flex: 1;
	height: 70rpx;
	background-color: var(--bg-soft);
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: var(--text-primary);
}

.input-placeholder {
	color: var(--text-quaternary);
}

.modal-actions {
	display: flex;
	justify-content: space-between;
	margin-top: 50rpx;
	gap: 30rpx;
}

.modal-btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	border-radius: 12rpx;
	font-size: 30rpx;
}

.btn-cancel {
	background-color: transparent;
	border: 2rpx solid var(--color-primary);
	color: var(--color-primary);
	box-sizing: border-box;
}

.btn-confirm {
	background-color: var(--color-primary);
	color: #ffffff;
}
</style>
