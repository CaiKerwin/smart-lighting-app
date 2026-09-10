<template>
	<view class="tree-node-wrap">
		<view :class="{ root: isRoot }" class="tree-node" @click="toggle">
			<view class="node-left">
				<!-- 站点叶子节点的状态图标（数据动态返回） -->
				<image v-if="data.icon" :src="data.icon" class="node-icon" />
				<!-- 展开时图标 -->
				<image v-else-if="hasChildren && expanded" class="node-icon" src="/static/operation/city.png" />
				<!-- 收起时图标 -->
				<image v-else-if="hasChildren" class="node-icon" src="/static/operation/street.png" />
				<!-- 其他项默认图标 -->
				<image v-else class="node-icon" src="/static/operation/city.png" />

				<text class="node-name">{{ data.name }}</text>
			</view>

			<view class="node-right">
				<!-- 群组控制按钮 -->
				<view
					v-if="type === 'powerbox' && hasChildren && !isRoot"
					class="group-btn"
					@click="batchOperatingStation"
					@click.stop
				>
					群组控制
				</view>

				<!-- 单灯数量 -->
				<view v-if="type === 'light' && isLeaf" class="light-count">
					{{ data.lightCount || 0 }} 盏
				</view>

				<!-- 搜索按钮 -->
				<view v-if="isRoot" class="search-node-icon" @click.stop="$emit('search')">
					<uni-icons :color="isDarkMode ? '#aab3c6' : '#3880FC'" size="20" type="search" />
				</view>

				<!-- 展开/收起箭头 -->
				<uni-icons
					v-if="hasChildren"
					:color="isDarkMode ? '#6d7689' : '#999'"
					:type="expanded ? 'top' : 'bottom'"
					class="node-arrow"
					size="16"
				/>
			</view>
		</view>

		<!--
			递归子级
			注意：该组件会递归调用自身，小程序端无法通过组件 name 隐式解析自身，
			必须已在 pages.json 的 globalStyle.usingComponents 中声明 "tree-node"，
			编译器才会把自身引用写入组件的 usingComponents，小程序端才能渲染出子级
		-->
		<view v-if="expanded && hasChildren" class="children-box">
			<TreeNode
				v-for="item in data.children"
				:key="item.key"
				:data="item"
				:type="type"
			/>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TreeNode',
	props: {
		data: { type: Object, required: true },
		type: { type: String, default: 'powerbox' },
		isRoot: { type: Boolean, default: false }
	},
	data() {
		return {
			expanded: this.data.expanded
		};
	},
	computed: {
		hasChildren() {
			return this.data.children && this.data.children.length > 0;
		},
		isLeaf() {
			return !this.hasChildren;
		}
	},
	methods: {
		toggle() {
			// 非叶子节点展开/收起子级
			if (this.hasChildren) {
				this.expanded = !this.expanded;
			}

			// 叶子节点跳转到站点详情界面
			let url = '';
			const data = this.data;

			if (this.type === 'light') { // 单灯标签页的站点直接跳转stationTwo
				url = '/pages/operation/components/stationTypes/stationTwo'
			} else { // 配电箱标签页
				const stationType = data.stationType;
				const hasLight = data.hasLight;
				const hasPower = data.hasPower;

				if (stationType === 4) { // 水浸
					url = '/pages/operation/components/stationTypes/stationThree'
				} else if (hasLight && !hasPower) { // 单灯 太阳能灯杆
					url = '/pages/operation/components/stationTypes/stationTwo'
				} else { // 配电箱 箱变 隧道
					url = '/pages/operation/components/stationTypes/stationOne'
				}
			}

			uni.navigateTo({
				url: `${url}?stationId=${data.id}&boxName=${encodeURIComponent(data.name || '')}`
			});
		},
		// 根据groupId跳转到群组控制界面
		batchOperatingStation(){
			uni.navigateTo({
				url: `/pages/operation/components/groupControl?groupId=${this.data.id}`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.tree-node-wrap {
	width: 100%;
	margin-bottom: 10rpx;
}
.tree-node {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx;
	/* 使用主题变量，适配暗色模式 */
	background: var(--bg-card, #ffffff);
	border-radius: 8rpx;
	margin-bottom: 8rpx;
}
.node-left {
	display: flex;
	align-items: center;
}
.node-icon {
	width: 45rpx;
	height: 50rpx;
	margin-right: 10rpx;
}
.node-name {
	font-size: 28rpx;
	/* 使用主题变量，适配暗色模式 */
	color: var(--text-primary, #333333);
}
.node-right {
	display: flex;
	align-items: center;
}
.group-btn {
	/* 按钮保持主色蓝，文字白色 */
	background: #3880FC;
	color: #ffffff;
	font-size: 24rpx;
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
	margin-right: 16rpx;
}
.light-count {
	/* 数量保持主色蓝，适配暗色模式 */
	color: #3880FC;
	font-size: 24rpx;
	margin-right: 16rpx;
}
.search-node-icon {
	padding: 8rpx;
	margin-right: 10rpx;
}
.node-arrow {
	margin-left: 10rpx;
	padding-left: 20rpx;
	border-left: solid var(--border-color, #333) 4rpx;
}
.children-box {
	padding-left: 30rpx;
}
</style>
