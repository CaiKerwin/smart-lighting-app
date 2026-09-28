<template>
	<view v-if="visible" :class="themeClass" class="group-edit-root">
		<!-- 分组管理菜单 -->
		<block v-if="currentView === 'menu'">
			<view class="ge-mask" @click="close" @touchmove.stop.prevent></view>
			<view class="ge-menu-card" @click.stop>
				<!-- 标题栏 -->
				<view class="ge-header">
					<text class="ge-title">分组管理</text>
					<view class="ge-close" hover-class="ge-close-hover" @click="close">
						<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
					</view>
				</view>

				<!-- 当前长按的分组 -->
				<view class="ge-current-box">
					<text class="ge-current-name">{{ groupName }}</text>
				</view>

				<!-- 菜单项 -->
				<view class="ge-menu">
					<view class="ge-menu-item" hover-class="ge-menu-item-hover" @click="openAdd">
						<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="plusempty" />
						<text class="ge-menu-text">添加分组</text>
					</view>
					<view class="ge-menu-item" hover-class="ge-menu-item-hover" @click="openEdit">
						<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="compose" />
						<text class="ge-menu-text">编辑分组</text>
					</view>
					<view class="ge-menu-item" hover-class="ge-menu-item-hover" @click="openMove">
						<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="redo" />
						<text class="ge-menu-text">移动分组</text>
					</view>
					<view class="ge-menu-item ge-menu-item-danger" hover-class="ge-menu-item-hover" @click="openDelete">
						<uni-icons color="#ff3b30" size="16" type="trash" />
						<text class="ge-menu-text">删除分组</text>
					</view>
					<view class="ge-menu-item" hover-class="ge-menu-item-hover" @click="openAddStation">
						<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="plus" />
						<text class="ge-menu-text">新增站点</text>
					</view>
				</view>
			</view>
		</block>

		<!-- 添加分组弹窗 -->
		<AddGroupPopup
			:parent-name="parentDisplayName"
			:visible="currentView === 'add'"
			@close="onAddClose"
			@confirm="onAddConfirm"
		/>

		<!-- 编辑分组弹窗 -->
		<EditGroupPopup
			:group-name="groupName"
			:visible="currentView === 'edit'"
			@close="backToMenu"
			@confirm="onEditConfirm"
		/>

		<!-- 移动分组弹窗 -->
		<MoveGroupPopup
			:group-name="groupName"
			:targets="moveTargets"
			:visible="currentView === 'move'"
			@close="backToMenu"
			@confirm="onMoveConfirm"
		/>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode, hasOperation} from "@/utils/common";
import AddGroupPopup from "./components/addGroupPopup.vue";
import EditGroupPopup from "./components/editGroupPopup.vue";
import MoveGroupPopup from "./components/moveGroupPopup.vue";

export default {
	name: 'GroupEditPopup',
	components: { AddGroupPopup, EditGroupPopup, MoveGroupPopup },
	props: {
		visible: { type: Boolean, default: false },
		// 打开时的初始视图：menu-分组管理菜单 / add-添加分组（根分组长按直接进添加）
		mode: { type: String, default: 'menu' },
		// 长按的分组节点 { id, name, parentId, isRoot }；根分组长按传 { id:0, name:根节点名, parentId:0, isRoot:true }
		group: { type: Object, default: null },
		// 全量分组列表（平铺）[ { id, name, parentId } ]，用于构建移动目标层级树
		groups: { type: Array, default: () => [] }
	},
	data() {
		return {
			currentView: 'menu', // menu / add / edit / move
			rootGroupName: ''    // 根分组名称（移动分组顶层目标行显示用）
		};
	},
	computed: {
		// 当前长按的分组名称
		groupName() {
			return (this.group && this.group.name) || '';
		},
		// 添加分组弹窗展示的「所属分组」：长按分组为该分组名；根分组为根节点名
		parentDisplayName() {
			return this.groupName || '顶级分组';
		},
		// 移动目标位置列表：顶级选项置顶 + 除自身及后代外的所有分组（带层级）
		moveTargets() {
			const list = Array.isArray(this.groups) ? this.groups : [];
			const group = this.group;
			const movingId = group && group.id !== undefined && group.id !== null ? group.id : null;

			// 排除被移动分组自身及其所有后代，避免移动到自身/子分组形成环
			const excluded = {};
			if (movingId !== null) {
				excluded[String(movingId)] = true;
				const collect = (pid) => {
					list.forEach(g => {
						if (g && String(g.parentId) === String(pid) && !excluded[String(g.id)]) {
							excluded[String(g.id)] = true;
							collect(g.id);
						}
					});
				};
				collect(movingId);
			}

			// 建树：parentId 指向的父分组不存在（被排除/孤儿）时视为顶层
			const map = {};
			list.forEach(g => {
				if (!g || excluded[String(g.id)]) return;
				map[String(g.id)] = { id: g.id, name: g.name || '', parentId: g.parentId, children: [], attached: false };
			});
			list.forEach(g => {
				if (!g || excluded[String(g.id)]) return;
				const node = map[String(g.id)];
				const parent = map[String(g.parentId)];
				if (node && parent && String(g.parentId) !== String(g.id)) {
					parent.children.push(node);
					node.attached = true;
				}
			});

			// 递归平铺，记录层级用于左侧缩进展示层级关系
			const flattened = [];
			const walk = (node, level) => {
				flattened.push({ id: node.id, name: node.name, level: level });
				node.children.forEach(child => walk(child, level + 1));
			};
			list.forEach(g => {
				const node = g && map[String(g.id)];
				if (node && !node.attached) walk(node, 0);
			});

			// 顶层目标置顶（parentId=0），显示根分组名称
			return [{ id: 0, name: this.rootGroupName, level: -1 }].concat(flattened);
		}
	},
	watch: {
		visible(val) {
			// 打开时按 mode 决定初始视图
			if (val) {
				this.currentView = this.mode === 'add' ? 'add' : 'menu';
				// 预取根分组名称，供「移动分组」顶层目标行显示
				this.getRootGroupName();
			}
		}
	},
	methods: {
		close() {
			this.$emit('close');
		},
		// 返回分组管理菜单
		backToMenu() {
			this.currentView = 'menu';
		},
		// 添加分组弹窗关闭：根分组长按直接进添加弹窗时关闭即整体关闭；否则返回菜单
		onAddClose() {
			if (this.group && this.group.isRoot) {
				this.close();
			} else {
				this.backToMenu();
			}
		},
		openAdd() {
			this.currentView = 'add';
		},
		openEdit() {
			this.currentView = 'edit';
		},
		openMove() {
			this.currentView = 'move';
		},
		openAddStation(){
			uni.showToast({ title: '敬请期待', icon: 'none' })
		},
		// 获取根分组名称
		getRootGroupName() {
			request({
				url: '/common/auth/QueryMyCust',
				method: 'POST',
				data: {}
			}).then(res => {
				const payload = res.data;
				if (payload && payload.data) {
					let list;
					try {
						list = JSON.parse(base64Decode(payload.data));
					} catch (e) {
						console.error('解析根分组数据失败', e);
						list = [];
					}
					if (!Array.isArray(list)) list = [];

					// 先判断当前用户所在的平台(curApp)，再获取其 appName 的值
					const currentApp = uni.getStorageSync('curApp') || 'road';
					const currentCust = uni.getStorageSync('curCust');
					const matched = list.find(item => item && item.appType === currentApp && String(item.id) === String(currentCust))
						|| list.find(item => item && item.appType === currentApp)
						|| list.find(item => item && item.appName)
						|| null;
					if (matched) {
						this.rootGroupName = matched.appName || matched.name || '';
					}
				}
			}).catch(err => {
				console.error('获取根分组名称错误', err.message);
			});
		},
		// 删除分组：需 gd 权限
		openDelete() {
			if (!hasOperation('gd')) {
				uni.showToast({ title: '没有相关权限', icon: 'none' });
				return;
			}
			const group = this.group;
			if (!group || group.id === undefined || group.id === null) {
				uni.showToast({ title: '未获取到分组信息', icon: 'none' });
				return;
			}
			uni.showModal({
				title: '提示',
				content: `确定要删除分组 ${this.groupName} 吗?`,
				success: (res) => {
					if (!res.confirm) return;
					this.deleteGroup(group.id);
				}
			});
		},
		// 组装 SaveGroupOld 请求体
		buildSaveGroupBody(id, name, parentId) {
			return {
				id: id,
				name: name,
				parentId: parentId,
				chirpStackEnabled: false,
				chirpStackServerId: '',
				chirpStackGroupId: '',
				chirpStackTenantId: '',
				chirpStackApplicationId: '',
				chirpStackDeviceProfileId: ''
			};
		},
		// 保存分组
		saveGroup(id, name, parentId, successText, failText) {
			uni.showLoading({ title: '保存中...', mask: true });
			request({
				url: '/sys/auth/SaveGroupOld',
				method: 'POST',
				data: this.buildSaveGroupBody(id, name, parentId)
			}).then(res => {
				const payload = res && res.data;
				// 业务失败 → 提示并退出
				if (payload && payload.code !== undefined && payload.code !== null && Number(payload.code) !== 0) {
					uni.showToast({ title: this.decodeErrorMessage(payload) || failText, icon: 'none' });
					return;
				}
				uni.showToast({ title: successText, icon: 'success' });
				// 通知父组件刷新树并关闭弹窗
				this.$emit('refresh');
				this.$emit('close');
			}).catch(err => {
				console.error(failText, err.message);
				uni.showToast({ title: failText, icon: 'none' });
			}).finally(() => {
				uni.hideLoading();
			});
		},
		// 校验分组名称是否已存在：同一父分组（parentId 相同）下已有同名分组视为重名；
		// excludeId 用于编辑时排除自身（未改名重新提交不算重名）
		isGroupNameExist(name, parentId, excludeId) {
			const target = (name || '').trim();
			if (!target) return false;
			const list = Array.isArray(this.groups) ? this.groups : [];
			return list.some(g => {
				if (!g) return false;
				if (excludeId !== undefined && excludeId !== null && String(g.id) === String(excludeId)) return false;
				return String(g.parentId) === String(parentId) && String(g.name || '').trim() === target;
			});
		},
		// 添加分组：id=0，parentId=长按的分组 id（根分组为 0，即顶级分组）
		onAddConfirm({ name }) {
			const group = this.group;
			const parentId = group && !group.isRoot && group.id !== undefined && group.id !== null ? group.id : 0;
			// 名称查重：同一父分组下已存在同名分组时提示
			if (this.isGroupNameExist(name, parentId)) {
				uni.showToast({ title: '名称已存在', icon: 'none' });
				return;
			}
			this.saveGroup(0, name, parentId, '添加成功', '添加失败');
		},
		// 编辑分组：保留原 parentId，仅修改名称
		onEditConfirm({ name }) {
			const group = this.group;
			if (!group || group.id === undefined || group.id === null) {
				uni.showToast({ title: '未获取到分组信息', icon: 'none' });
				return;
			}
			const parentId = group.parentId !== undefined && group.parentId !== null ? group.parentId : 0;
			// 名称查重：同一父分组下（排除自身）已存在同名分组时提示
			if (this.isGroupNameExist(name, parentId, group.id)) {
				uni.showToast({ title: '名称已存在', icon: 'none' });
				return;
			}
			this.saveGroup(group.id, name, parentId, '修改成功', '修改失败');
		},
		// 移动分组：目标分组 id 作为新 parentId（顶级为 0）
		onMoveConfirm({ parentId }) {
			const group = this.group;
			if (!group || group.id === undefined || group.id === null) {
				uni.showToast({ title: '未获取到分组信息', icon: 'none' });
				return;
			}
			const targetId = parentId !== undefined && parentId !== null ? parentId : 0;
			uni.showModal({
				title: '提示',
				content: `确定要将分组 ${this.groupName} 移动到分组 ${this.moveTargets.find(t => t.id === targetId)?.name} 吗?`,
				success: (res) => {
					if (res.confirm)
						this.saveGroup(group.id, this.groupName, targetId, '移动成功', '移动失败');
				}
			});
		},
		// 删除分组
		deleteGroup(id) {
			uni.showLoading({ title: '删除中...', mask: true });
			request({
				url: '/sys/auth/DeleteGroupOld',
				method: 'POST',
				data: { id: id }
			}).then(res => {
				const payload = res && res.data;
				// 业务失败 → 提示并退出
				if (payload && payload.code !== undefined && payload.code !== null && Number(payload.code) !== 0) {
					uni.showToast({ title: this.decodeErrorMessage(payload) || '删除失败', icon: 'none' });
					return;
				}
				uni.showToast({ title: '删除成功', icon: 'success' });
				this.$emit('refresh');
				this.$emit('close');
			}).catch(err => {
				console.error('删除分组失败', err.message);
				uni.showToast({ title: '删除失败', icon: 'none' });
			}).finally(() => {
				uni.hideLoading();
			});
		},
		// 解析接口业务错误信息（与单灯详情页保持一致）
		decodeErrorMessage(payload) {
			let msg = (payload && (payload.msg || payload.message)) || '';
			const data = payload && payload.data;
			if (typeof data === 'string' && data) {
				// 形似 Base64 的字符串先尝试解码
				if (/^[A-Za-z0-9+/=]+$/.test(data)) {
					const decoded = base64Decode(data);
					if (decoded) msg = decoded;
				}
				if (!msg) msg = data;
			}
			// 解码结果本身是 JSON（形如 {"code":500,"msg":"..."}）时取出其中的提示信息
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
.group-edit-root {
	position: relative;
}

/* 遮罩（分组管理菜单） */
.ge-mask {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 9;
	background: rgba(0, 0, 0, 0.55);
}

/* 分组管理菜单卡片 */
.ge-menu-card {
	position: fixed;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	z-index: 10;
	width: 560rpx;
	max-width: 86%;
	box-sizing: border-box;
	padding: 0 32rpx 32rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 24rpx;
	box-shadow: 0 16rpx 48rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.2));
}

/* 标题栏 */
.ge-header {
	height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.ge-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.ge-close {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.ge-close-hover {
	opacity: 0.7;
}

/* 当前分组展示 */
.ge-current-box {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 8rpx 20rpx;
}


.ge-current-name {
	min-width: 0;
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

/* 菜单列表 */
.ge-menu {
	background: var(--bg-soft, #f2f4f8);
	border-radius: 20rpx;
	overflow: hidden;
}

.ge-menu-item {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24rpx;
	gap: 16rpx;
	position: relative;

	&:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 24rpx;
		right: 24rpx;
		bottom: 0;
		height: 1rpx;
		background: var(--border-color, #e5e5e5);
	}
}

.ge-menu-item-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.ge-menu-text {
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.ge-menu-item-danger .ge-menu-text {
	color: #ff3b30;
}
</style>
