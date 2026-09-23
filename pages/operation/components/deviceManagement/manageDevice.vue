<template>
	<view :class="themeClass" class="page-container">
		<!-- ==================== 设备表格 ==================== -->
		<view v-if="deviceList.length" class="table-view">
			<!-- 固定列：序号 + 设备名称 -->
			<view class="zone-fixed-left">
				<view class="t-head">
					<view class="cell cell-index">
						<text class="cell-head-text">序号</text>
					</view>
					<view class="cell cell-name">
						<text class="cell-head-text">设备名称</text>
					</view>
				</view>
				<view v-for="(item, index) in deviceList" :key="item.id" class="t-row">
					<view class="cell cell-index">
						<text class="cell-text">{{ rowIndex(index) }}</text>
					</view>
					<view class="cell cell-name">
						<text class="cell-text">{{ cellText(item.name) }}</text>
					</view>
				</view>
			</view>

			<!-- 可左右滑动的列 -->
			<scroll-view :show-scrollbar="false" class="zone-scroll" scroll-x="true">
				<view class="scroll-inner">
					<view class="t-head">
						<view
							v-for="col in scrollColumns"
							:key="col.key"
							:style="{ width: col.width + 'rpx' }"
							class="cell"
						>
							<text class="cell-head-text">{{ col.label }}</text>
						</view>
					</view>
					<view v-for="item in deviceList" :key="item.id" class="t-row">
						<view
							v-for="col in scrollColumns"
							:key="col.key"
							:style="{ width: col.width + 'rpx' }"
							class="cell"
						>
							<text class="cell-text">{{ cellText(item[col.key]) }}</text>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 固定列：操作 -->
			<view class="zone-fixed-right">
				<view class="t-head">
					<view class="cell cell-op">
						<text class="cell-head-text">操作</text>
					</view>
				</view>
				<view v-for="item in deviceList" :key="item.id" class="t-row">
					<view class="cell cell-op">
						<!-- 功能暂未实现，仅提示敬请期待 -->
						<view class="op-btn op-btn-edit" @click="openDeviceInfoPopup(item)">编辑</view>
						<view class="op-btn op-btn-delete" @click="deleteDeviceInfo(item)">删除</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空数据 / 加载中 -->
		<view v-else class="empty-tip">
			<text class="empty-text">{{ loading ? '加载中...' : '暂无设备数据' }}</text>
		</view>

		<!-- ==================== 底部固定区域：分页器 + 悬浮按钮 ==================== -->
		<view class="fixed-bottom">
			<Pagination
				:current="currentPage"
				:pageSize="pageSize"
				:pageSizeOptions="pageSizeOptions"
				:total="total"
				@change="onPageChange"
				@pageSizeChange="onPageSizeChange"
			/>

			<!-- 悬浮按钮：位于分页器上方右下角，点击打开添加设备弹窗 -->
			<view class="fab-anchor">
				<view class="fab-btn" @click="openAddMenu">
					<uni-icons color="#ffffff" size="28" type="gear" />
				</view>
			</view>
		</view>

		<!-- ==================== 添加设备弹窗 ==================== -->
		<view v-if="showAddMenu" class="sheet-mask" @click="closeAddMenu">
			<view class="sheet-panel" @click.stop>
				<!-- 扫码新增设备 -->
				<view class="sheet-item" @click="onAddDevice('scan')">
					<uni-icons color="#4285f4" size="22" type="scan" />
					<text class="sheet-item-text">扫码新增设备</text>
				</view>

				<!-- 手动新增设备 -->
				<view class="sheet-item" @click="onAddDevice('manual')">
					<uni-icons color="#4285f4" size="22" type="compose" />
					<text class="sheet-item-text">手动新增设备</text>
				</view>

				<view class="sheet-cancel" @click="closeAddMenu">
					<text class="sheet-cancel-text">取消</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import Pagination from "@/components/pagination.vue";
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";

export default {
	name: 'manageDevice',
	components: {
		Pagination
	},
	data() {
		return {
			stationId: 0,

			// 设备列表数据
			deviceList: [],
			loading: false,

			// 分页相关
			currentPage: 1,  // 当前页码
			pageSize: 10,    // 每页条数
			total: 0,        // 总条数
			pageSizeOptions: [10, 20, 50, 100],

			// 需要左右滑动查看的列：key 为接口字段名，width 为列宽（rpx）
			scrollColumns: [
				{ key: 'bigName', label: '设备大类', width: 140 },            // 设备大类
				{ key: 'smallName', label: '设备小类', width: 186 },          // 设备小类
				{ key: 'type', label: '协议类型', width: 170 },               // 协议类型
				{ key: 'code', label: '通信ID', width: 180 },                 // 通信ID
				{ key: 'stationName', label: '所在站点', width: 220 },        // 所在站点
				{ key: 'parentName', label: '父级设备', width: 190 },         // 父级设备
				{ key: 'parentCode', label: '父级设备通信ID', width: 210 },   // 父级设备通信ID
				{ key: 'simCard', label: 'SIM卡号', width: 200 },             // SIM卡号
				{ key: 'imei', label: 'IMEI', width: 220 },                   // IMEI
				{ key: 'rssi', label: 'RSSI', width: 110 },                   // RSSI
				{ key: 'hardwareVersion', label: '硬件版本', width: 170 },    // 硬件版本
				{ key: 'softwareVersion', label: '软件版本', width: 170 }     // 软件版本
			],

			// 添加设备弹窗显隐
			showAddMenu: false
		};
	},
	onLoad(options) {
		// 获取传递的站点ID参数
		this.stationId = Number(options.stationId) || 0;
		// 获取站点设备列表
		this.getStationDeviceList();
	},
	methods: {
		getStationDeviceList(){
			/**
			 * {
			 *   "count": 1,
			 *   "list": [
			 *     {
			 *       "id": 288618,
			 *       "name": "A5080007-A",
			 *       "code": "A5080008",
			 *       "typeName": "Lt115n单灯控制器统一版",
			 *       "stationId": 2434,
			 *       "stationName": "App测试配电箱",
			 *       "bigType": 3,
			 *       "smallType": 165,
			 *       "type": "lt115nv1",
			 *       "bigName": "单灯控制器",
			 *       "smallName": "AMDM-118T（CAT.1）",
			 *       "simCard": "",
			 *       "channel": "2",
			 *       "hardwareVersion": null,
			 *       "imei": null,
			 *       "parentId": 0,
			 *       "rssi": 0,
			 *       "softwareVersion": null,
			 *       "timeout": 5,
			 *       "topId": 0,
			 *       "calOnline": true,
			 *       "parentName": null,
			 *       "parentCode": null,
			 *       "groupId": 1102
			 *     }
			 *   ]
			 * }
			 */
			this.loading = true;
			request({
				url: '/station/config/QueryDeviceByFilter',
				method: 'POST',
				data: {
					groupId: 0, // 设备分组ID，0表示所有设备
					stationId: this.stationId, // 站点ID，0表示所有站点
					// 分页
					size: this.pageSize, // 每页数量
					index: this.currentPage, // 当前页码
					// 按列过滤，这里不按列过滤，均为默认获取所有设备
					name: "",
					code: "",
					bigType: 0, // 设备大类，0表示所有设备
					smallType: 0, // 设备小类，0表示所有设备
					simCard: "",
					imei: "",
					hardware: "",
					software: ""
				}
			}).then(res => {
				this.loading = false;

				const payload = res.data;
				try {
					if (payload && payload.data) {
						// 将 Base64 的 JSON 字符串转换成对象
						const deviceData = JSON.parse(base64Decode(payload.data));
						this.total = Number(deviceData.count) || 0; // 总条数（用于分页）
						this.deviceList = deviceData.list || [];
					} else {
						this.total = 0;
						this.deviceList = [];
					}

					// 当前页超出最大页时（例如筛选后数据变少），回退到最后一页
					const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize));
					if (this.currentPage > maxPage) {
						this.currentPage = maxPage;
						this.getStationDeviceList();
					}
				} catch (e) {
					console.error('解析设备列表数据错误:', e.message);
					this.total = 0;
					this.deviceList = [];
					uni.showToast({ title: '数据解析失败', icon: 'none' });
				}
			}).catch(err => {
				this.loading = false;
				this.total = 0;
				this.deviceList = [];
				console.error('获取站点设备列表失败',err.message);
				uni.showToast({ title: '获取设备列表失败', icon: 'none' });
			})
		},

		// 序号：按当前页码与每页条数计算（跨页连续）
		rowIndex(index) {
			return (this.currentPage - 1) * this.pageSize + index + 1;
		},

		// 单元格内容：空值统一显示为 -
		cellText(value) {
			if (value === null || value === undefined || value === '') {
				return '-';
			}
			return value;
		},

		// 页码变化
		onPageChange(current) {
			if (current === this.currentPage) return;
			this.currentPage = current;
			this.getStationDeviceList();
		},

		// 每页条数变化
		onPageSizeChange(size) {
			if (size === this.pageSize) return;
			this.pageSize = size;
			this.currentPage = 1; // 每页条数变化后从第一页开始
			this.getStationDeviceList();
		},

		// 打开添加设备弹窗
		openAddMenu() {
			this.showAddMenu = true;
		},

		// 关闭添加设备弹窗
		closeAddMenu() {
			this.showAddMenu = false;
		},
		// 打开编辑设备信息弹窗
		openDeviceInfoPopup(item) {
			uni.showToast({ title: '敬请期待', icon: 'none' });
		},
		// 编辑设备
		modifyDeviceInfo(item) {
			//TODO: 编辑设备信息
			/**
			 * 请求体
			 * {
			 *   "id": 7064,
			 *   "stationId": 181,
			 *   "name": "000000000001",
			 *   "code": "000000000001",
			 *   "type": "lt115n",
			 *   "bigType": 3,
			 *   "smallType": 109,
			 *   "parentId": 0,
			 *   "channel": "2",
			 *   "simCard": null,
			 *   "timeout": 5,
			 *   "calOnline": true
			 * }
			 */
			// request({
			// 	url: '/station/config/SaveDevice',
			// 	method: 'POST',
			// 	data: {
			// 		stationId: this.stationId,
			// 		id: item.id,
			// 		name: item.name,
			// 		code: item.code,
			// 		type: item.type,
			// 		bigType: item.bigType,
			// 		smallType: item.smallType,
			// 		parentId: item.parentId,
			// 		channel: item.channel,
			// 		simCard: item.simCard,
			// 		timeout: item.timeout,
			// 		calOnline: item.calOnline
			// 	}
			// }).then(res =>{
			// 	console.log(base64Decode(res.data.data))
			// }).catch(err =>{
			// 	console.error('修改设备信息失败', err.message);
			// })
			uni.showToast({ title: '敬请期待', icon: 'none' });
		},
		// 删除设备
		deleteDeviceInfo(item) {
			uni.showModal({
				title: '删除设备',
				content: `是否确认删除${item.name || '该设备'}？`,
				confirmText: '确认',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						request({
							url: '/station/config/DeleteStationDevice',
							method: 'POST',
							data: {
								list: [item.id] //这里一个一个的删
							}
						}).then(res =>{
							console.log(base64Decode(res.data.data))
							if (res.data.code === 0 || res.statusCode === 200) {
								uni.showToast({ title: '删除成功', icon: 'success' });
							} else {
								uni.showToast({ title: '删除失败', icon: 'none' });
							}
						}).catch(err =>{
							console.error('删除设备失败', err.message);
						}).finally(() => {
							this.getStationDeviceList();
						});
					}
				}
			})
		},
		// 添加设备方式选择
		onAddDevice(mode) {
			this.closeAddMenu();
			switch (mode) {
				case 'scan':
					// TODO:扫码添加设备
					// uni.scanCode({
					// 	onlyFromCamera: false,
					// 	scanType: ['qrCode'],
					// 	success: (res) => {
					// 		request({
					// 			url: '/station/config/SaveDevice',
					// 			method: 'POST',
					// 			data: {
					// 				stationId: this.stationId,
					// 				id: item.id,
					// 				name: item.name,
					// 				code: item.code,
					// 				type: item.type,
					// 				bigType: item.bigType,
					// 				smallType: item.smallType,
					// 				parentId: item.parentId,
					// 				channel: item.channel,
					// 				simCard: item.simCard,
					// 				timeout: item.timeout,
					// 				calOnline: item.calOnline
					// 			}
					// 		}).then(res =>{
					// 			console.log(base64Decode(res.data.data))
					// 		}).catch(err =>{
					// 			console.error('修改设备信息失败', err.message);
					// 		})
					// 	}
					// })
					uni.showToast({ title: '敬请期待', icon: 'none' });
					break;
				case 'manual':
					// TODO:打开添加设备弹窗
					// this.openDeviceInfoPopup();
					uni.showToast({ title: '敬请期待', icon: 'none' });
					break;
			}
		},
	},
}
</script>

<style lang="scss" scoped>
/* 页面整体容器 */
.page-container {
	position: relative;
	min-height: 100vh;
	background-color: var(--bg-page, #f5f6fa);
	padding: 20rpx;
	/* 为底部固定区域（分页器）与悬浮按钮留出空间 */
	padding-bottom: calc(300rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	transition: background-color 0.3s ease;
}

/* ==================== 表格 ==================== */
.table-view {
	display: flex;
	align-items: stretch;
	background-color: var(--bg-card, #fff);
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 12rpx var(--bg-box-shadow, rgba(0, 0, 0, 0.06));
	transition: background-color 0.3s ease;
}

/* 左侧固定列：序号 + 设备名称 */
.zone-fixed-left {
	flex: none;
	width: 228rpx; /* 序号 68 + 设备名称 160（含 1rpx 右边框） */
	overflow: hidden;
	background-color: var(--bg-card, #fff);
	border-right: 1rpx solid var(--border-color, #eee);
	box-sizing: border-box;
}

/* 中间可横向滑动的列 */
.zone-scroll {
	flex: 1;
	min-width: 0;
	white-space: nowrap;
	background-color: var(--bg-card, #fff);
}

.scroll-inner {
	display: inline-block; /* 由内容宽度撑开，使 scroll-view 可以左右滑动 */
	flex: none; /* 兜底：部分平台会把 scroll-view 内容层变成 flex 容器，避免被压缩 */
}

/* 右侧固定列：操作 */
.zone-fixed-right {
	flex: none;
	width: 150rpx;
	overflow: hidden;
	background-color: var(--bg-card, #fff);
	border-left: 1rpx solid var(--border-color, #eee);
	box-sizing: border-box;
}

/* 表头与数据行：三个区域必须保持相同高度，否则固定列与滑动列会错位 */
.t-head {
	display: flex;
	align-items: center;
	height: 80rpx;
	background-color: var(--bg-table-header, #f8f9fc);
	border-bottom: 1rpx solid var(--border-color, #eee);
	box-sizing: border-box;
	transition: background-color 0.3s ease, border-color 0.3s ease;
}

.t-row {
	display: flex;
	align-items: center;
	height: 140rpx;
	border-bottom: 1rpx solid var(--border-color, #eee);
	box-sizing: border-box;
	transition: border-color 0.3s ease;

	&:last-child {
		border-bottom: none;
	}
}

/* 单元格 */
.cell {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: none;
	height: 100%;
	padding: 0 8rpx;
	box-sizing: border-box;
	overflow: hidden;
}

.cell-head-text {
	font-size: 24rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	white-space: nowrap;
}

.cell-text {
	display: -webkit-box;
	overflow: hidden;
	font-size: 24rpx;
	line-height: 1.35;
	color: var(--text-secondary, #666);
	text-align: center;
	word-break: break-all;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2; /* 最多两行，超出省略，保证每行高度一致 */
}

.cell-index {
	width: 68rpx;
}

.cell-name {
	width: 160rpx;
}

/* 操作列：两个按钮纵向排列 */
.cell-op {
	flex-direction: column;
	gap: 10rpx;
	width: 150rpx;
}

.op-btn {
	width: 104rpx;
	height: 52rpx;
	line-height: 52rpx;
	text-align: center;
	border-radius: 8rpx;
	color: #ffffff;
	font-size: 24rpx;
	&.op-btn-edit {
		background-color: var(--color-primary, #4285f4);
	}
	&.op-btn-delete {
		background-color: var(--color-danger, #ff4d4f);
	}
}

/* 空数据 / 加载中 */
.empty-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 400rpx;
	background-color: var(--bg-card, #fff);
	border-radius: 16rpx;
	transition: background-color 0.3s ease;

	.empty-text {
		font-size: 26rpx;
		color: var(--text-quaternary, #999999);
	}
}

/* ==================== 底部固定区域 ==================== */
.fixed-bottom {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 5;
	background-color: var(--bg-page, #f5f6fa);
	padding: 10rpx 20rpx calc(20rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	transition: background-color 0.3s ease;
}

/* 悬浮按钮锚点：绝对定位脱离文档流，始终悬在分页器上方右下角 */
.fab-anchor {
	position: absolute;
	right: 32rpx;
	bottom: calc(100% + 20rpx);
	z-index: 3;
}

.fab-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background-color: var(--color-primary, #4285f4);
	box-shadow: 0 8rpx 24rpx rgba(66, 133, 244, 0.4);
}

/* ==================== 添加设备弹窗 ==================== */
.sheet-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	background-color: var(--popup-mask, rgba(0, 0, 0, 0.5));
}

.sheet-panel {
	width: 100%;
	background-color: var(--bg-card, #fff);
	border-radius: 24rpx 24rpx 0 0;
	padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	transition: background-color 0.3s ease;
}

.sheet-item {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 96rpx;
	padding: 0 28rpx;
	margin-bottom: 20rpx;
	border-radius: 16rpx;
	background-color: var(--bg-soft, #f2f4f8);
	box-sizing: border-box;
	transition: background-color 0.3s ease;

	.sheet-item-text {
		margin-left: 16rpx;
		font-size: 30rpx;
		color: var(--text-primary, #333);
	}
}

.sheet-cancel {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 96rpx;
	border-radius: 16rpx;
	border: 1rpx solid var(--border-color, #eee);
	background-color: var(--bg-card, #fff);
	transition: background-color 0.3s ease, border-color 0.3s ease;

	.sheet-cancel-text {
		font-size: 30rpx;
		color: var(--text-secondary, #666);
	}
}
</style>
