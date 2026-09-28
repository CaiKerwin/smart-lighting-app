<template>
	<view v-if="visible" :class="themeClass" class="station-edit-root">
		<!-- 站点管理菜单 -->
		<view class="se-mask" @click="close" @touchmove.stop.prevent></view>
		<view class="se-menu-card" @click.stop>
			<!-- 标题栏 -->
			<view class="se-header">
				<text class="se-title">站点管理</text>
				<view class="se-close" hover-class="se-close-hover" @click="close">
					<uni-icons :color="isDarkMode ? '#8b94a8' : '#999999'" size="22" type="closeempty"></uni-icons>
				</view>
			</view>

			<!-- 当前长按的站点 -->
			<view class="se-current-box">
				<text class="se-current-name">{{ stationName }}</text>
			</view>

			<!-- 菜单项 -->
			<view class="se-menu">
				<view class="se-menu-item" hover-class="se-menu-item-hover" @click="openEdit">
					<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="compose" />
					<text class="se-menu-text">编辑站点</text>
				</view>
				<view class="se-menu-item" hover-class="se-menu-item-hover" @click="openMove">
					<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="redo" />
					<text class="se-menu-text">移动站点</text>
				</view>
				<view class="se-menu-item se-menu-item-danger" hover-class="se-menu-item-hover" @click="openDelete">
					<uni-icons color="#ff3b30" size="16" type="trash" />
					<text class="se-menu-text">删除站点</text>
				</view>
				<view class="se-menu-item" hover-class="se-menu-item-hover" @click="openModifyLocation">
					<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="location" />
					<text class="se-menu-text">修改位置</text>
				</view>
				<view class="se-menu-item" hover-class="se-menu-item-hover" @click="openCopy">
					<uni-icons :color="isDarkMode ? '#6d7689' : '#333333'" size="16" type="loop" />
					<text class="se-menu-text">复制站点</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { request } from "@/utils/request";
import { base64Decode, hasOperation } from "@/utils/common";

export default {
	name: 'StationEditPopup',
	props: {
		visible: { type: Boolean, default: false },
		// 长按的站点节点 { id, name, lat, lng, ... }
		station: { type: Object, default: null }
	},
	computed: {
		// 当前长按的站点名称
		stationName() {
			return (this.station && this.station.name) || '';
		}
	},
	methods: {
		close() {
			this.$emit('close');
		},
		// 编辑站点
		openEdit() {
			uni.showToast({ title: '敬请期待', icon: 'none' });
		},
		// 移动站点
		openMove() {
			uni.showToast({ title: '敬请期待', icon: 'none' });
		},
		// 复制站点
		openCopy() {
			uni.showToast({ title: '敬请期待', icon: 'none' });
		},
		// 修改位置
		openModifyLocation() {
			this.$emit('modify-location', this.station);
		},
		// 删除站点：需 sd 权限
		openDelete() {
			if (!hasOperation('sd')) {
				uni.showToast({ title: '没有相关权限', icon: 'none' });
				return;
			}
			const station = this.station;
			if (!station || station.id === undefined || station.id === null) {
				uni.showToast({ title: '未获取到站点信息', icon: 'none' });
				return;
			}
			uni.showModal({
				title: '提示',
				content: `确定要删除站点 ${station.name || ''} ?`,
				success: (res) => {
					if (!res.confirm) return;
					this.deleteStation(station.id);
				}
			});
		},
		// 删除站点
		deleteStation(id) {
			uni.showLoading({ title: '删除中...', mask: true });
			request({
				url: '/station/config/DeleteStation',
				method: 'POST',
				data: { list: [id] }
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
				console.error('删除站点失败', err.message);
				uni.showToast({ title: '删除失败', icon: 'none' });
			}).finally(() => {
				uni.hideLoading();
			});
		},
		// 解析接口业务错误信息（与分组管理弹窗保持一致）
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
.station-edit-root {
	position: relative;
}

/* 遮罩（站点管理菜单） */
.se-mask {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 9;
	background: rgba(0, 0, 0, 0.55);
}

/* 站点管理菜单卡片 */
.se-menu-card {
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
.se-header {
	height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.se-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
}

.se-close {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	padding: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.se-close-hover {
	opacity: 0.7;
}

/* 当前站点展示 */
.se-current-box {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 8rpx 20rpx;
}

.se-current-name {
	min-width: 0;
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-primary, #333333);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

/* 菜单列表 */
.se-menu {
	background: var(--bg-soft, #f2f4f8);
	border-radius: 20rpx;
	overflow: hidden;
}

.se-menu-item {
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

.se-menu-item-hover {
	background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.se-menu-text {
	font-size: 28rpx;
	color: var(--text-primary, #333333);
}

.se-menu-item-danger .se-menu-text {
	color: #ff3b30;
}
</style>
