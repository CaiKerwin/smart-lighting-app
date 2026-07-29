<template>
	<view class="alarm-exception-container">
		<AlarmCenter :initialTab="tab" @change="onTabChange" />
		<view class="alarm-exception-sequence">
			<view class="title">排序</view>

			<!-- 滑动气泡 -->
			<scroll-view scroll-x class="sort-scroll" :show-scrollbar="false">
				<view class="sort-flex-row">
					<view
						class="sort-item"
						v-for="(item, index) in sortItems"
						:key="index"
						:class="{ 'active': selectedSort === item }"
						@click="handleSortSelect(item)"
					>
						{{ item }}
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import AlarmCenter from "@/pages/alarm/components/alarmCenter.vue";
export default {
	components: {
		AlarmCenter
	},
	data() {
		return {
			tab: '线路供电异常报警',
			tabMap: {
				'配电箱报警': '/pages/alarm/components/alarmTypes/alarmPowerbox',
				'单灯报警': '/pages/alarm/components/alarmTypes/alarmLight',
				'离线报警': '/pages/alarm/components/alarmTypes/alarmOffline',
				'线路供电异常报警': '/pages/alarm/components/alarmTypes/alarmException',
				'线路供电异常报警记录': '/pages/alarm/components/alarmTypes/alarmExceptionRecord',
				'水浸报警': '/pages/alarm/components/alarmTypes/alarmWater',
				'人工报障': '/pages/alarm/components/alarmTypes/alarmWorker'
			},
			// 排序选项
			sortItems: ['单灯总数', '离线数', '离线异常数', '灭灯数', '灭灯异常数', '过压数', '欠压数'],
			selectedSort: ''
		};
	},
	methods:{
		onTabChange(tabName) {
			const url = this.tabMap[tabName];
			if (url) {
				uni.navigateTo({ url });
			} else {
				console.warn('未知标签:', tabName);
				uni.showToast({ title: '未知标签', icon: 'none' });
			}
		},
		handleSortSelect(item) {
			if (this.selectedSort === item) {
				// 如果点击的是当前已选中的项，则取消选中（置空）
				this.selectedSort = '';
			} else {
				// 如果点击的是未选中的项，则切换为选中
				this.selectedSort = item;
			}
			console.log('当前选择的排序方式：', this.selectedSort || '无');
		}
	}
}
</script>

<style lang="scss">
.alarm-exception-container {
	width: 100%;
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 0 0 30rpx 0;
	display: flex;
	flex-direction: column;
}

/* 排序区域 */
.alarm-exception-sequence {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	width: 100%;
	box-sizing: border-box;
	background-color: #f5f7fa;

	.title {
		flex-shrink: 0;
		font-size: 30rpx;
		font-weight: 500;
		color: #333;
		margin-right: 20rpx;
		white-space: nowrap;
	}

	.sort-scroll {
		flex: 1;
		width: 0;
		white-space: nowrap;
	}

	.sort-flex-row {
		display: inline-flex;
		gap: 20rpx;
		padding-right: 20rpx;
	}
}

/* 排序气泡样式  */
.sort-item {
	display: inline-block;
	padding: 12rpx 32rpx;
	border-radius: 40rpx;
	background-color: #F2F4F8;
	color: #666666;
	font-size: 28rpx;
	line-height: 1.2;
	white-space: nowrap;
	cursor: pointer;
	transition: all 0.2s ease;
}

/* 气泡选中状态  */
.sort-item.active {
	background-color: #3A7BF7;
	color: #FFFFFF;
}
</style>
