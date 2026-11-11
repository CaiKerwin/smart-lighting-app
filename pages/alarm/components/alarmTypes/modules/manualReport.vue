<template>
	<view :class="themeClass" class="page-container">
		<view class="report-card">
			<!-- 灯杆编号 -->
			<view class="form-item">
				<view class="label">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333333'" size="20" type="flag" />
					灯杆编号
				</view>
				<uni-easyinput
					v-model="lampCode"
					:placeholder-style="placeholderStyle"
					:primary-color="focusColor"
					:styles="inputStyles"
					class="normal-input"
					placeholder="输入灯杆编号"
				/>
			</view>

			<!-- 故障类型 (多选) -->
			<view class="form-item">
				<view class="label">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333333'" size="20" type="more" />
					故障类型
				</view>
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

			<view class="form-item">
				<view class="label">
					<uni-icons :color="isDarkMode ? '#e8ecf4' : '#333333'" size="20" type="chat" />
					故障描述以及联系信息
				</view>
			</view>

			<!-- 故障现象 -->
			<view class="form-item">
				<uni-easyinput
					v-model="faultDesc"
					:placeholder-style="placeholderStyle"
					:primary-color="focusColor"
					:styles="inputStyles"
					autoHeight
					class="textarea-input"
					placeholder="输入故障现象"
					type="textarea"
				/>
			</view>

			<!-- 称呼 -->
			<view class="form-item">
				<uni-easyinput
					v-model="reportName"
					:placeholder-style="placeholderStyle"
					:primary-color="focusColor"
					:styles="inputStyles"
					class="normal-input"
					placeholder="输入称呼"
				/>
			</view>

			<!-- 联系方式 -->
			<view class="form-item">
				<uni-easyinput
					v-model="reportMobile"
					:placeholder-style="placeholderStyle"
					:primary-color="focusColor"
					:styles="inputStyles"
					class="normal-input"
					placeholder="输入联系方式，用于回访"
				/>
			</view>

			<!-- 拍照上传区 -->
			<view class="upload-area" @click="chooseImage">
				<!-- 无图片时显示相机图标 -->
				<view v-if="imageList.length === 0" class="upload-placeholder">
					<uni-icons type="camera" size="60rpx" color="#a0aab8"></uni-icons>
					<text class="upload-tip">点击上传故障图片</text>
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
				<view class="btn submit" @click="submitManualReport">提交</view>
			</view>
		</view>
	</view>
</template>

<script>
import {request} from "@/utils/request";
import {base64Decode} from "@/utils/common";
import {getBaseUrl} from "@/utils/platform";

export default {
	data() {
		return {
			faultTypes: ['路灯不亮', '白天亮灯', '灯杆倾斜', '路灯损坏', '灯杆小广告', '其它'],
			selectedTypes: [],
			imageList: [], // 存储已选图片的本地路径
			lampCode: '',      // 灯杆编号
			faultDesc: '',     // 故障现象
			reportName: '',    // 称呼
			reportMobile: ''   // 联系方式
		};
	},
	computed: {
		inputStyles() {
			if (this.isDarkMode) {
				return {
					color: '#e8ecf4',           // 输入文字：夜间主文字色
					backgroundColor: '#252c3d', // 输入框底色：夜间浅块色
					disableColor: '#252c3d',
					borderColor: '#2c3447'      // 输入框描边：夜间分隔线色
				};
			}
			return {
				color: '#333333',
				backgroundColor: '#f2f4f8',
				disableColor: '#f2f4f8',
				borderColor: '#e5e5e5'
			};
		},
		// 占位文字
		placeholderStyle() {
			return this.isDarkMode ? 'color:#6d7689;font-size:30rpx;' : 'color:#999999;font-size:30rpx;';
		},
		// 聚焦时的边框/清除图标高亮色
		focusColor() {
			return this.isDarkMode ? '#5a97ff' : '#2b8bfe';
		}
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
			const remain = 3 - this.imageList.length;
			if (remain <= 0) {
				uni.showToast({
					title: '最多上传3张图片',
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
		},
		async submitManualReport() {
			// ----- 表单校验 -----
			if (!this.lampCode.trim()) {
				uni.showToast({title: '请输入灯杆编号', icon: 'none'});
				return;
			}
			if (this.selectedTypes.length === 0 && !this.faultDesc.trim()) {
				uni.showToast({title: '请选择故障类型或输入故障现象', icon: 'none'});
				return;
			}
			if (this.imageList.length === 0) {
				uni.showToast({ title: '请上传故障图片', icon: 'none' });
				return;
			} else if (this.imageList.length > 3){
				uni.showToast({ title: '最多上传3张图片', icon: 'none' });
				return;
			}

			try {
				// 先获取到source
				/**
				 * {"redirectCode":"amdm","redirectUrl":"https://www.amdm.top/alarm/upload1?source=amdm"}
				 */
				const codeRes = await request({
					url: '/station/alarm/QueryRedirect',
					method: 'POST',
					data: {}
				});

				const redirectData = JSON.parse(base64Decode(codeRes.data.data));
				const source = redirectData.redirectCode;
				if (!source) {
					throw new Error('获取 source 失败');
				}

				// 上传图片
				const uploadFiles = this.imageList.map(path => ({
					name: 'files',          // 字段名必须为 'files'
					uri: path               // 图片本地路径
				}));

				// 构造content
				let content = this.selectedTypes.join(';');
				if (this.faultDesc.trim()) {
					content += (content ? ';' : '') + this.faultDesc.trim();
				}

				// 再提交表单
				const formData = {
					source: source,
					code: this.lampCode.trim(),
					content: content,
					name: this.reportName.trim(),
					mobile: this.reportMobile.trim()
				};
				console.log('提交数据:', { formData, files: uploadFiles });

				uni.showLoading({ title: '提交中...', mask: true });
				const uploadRes = await new Promise((resolve, reject) => {
					uni.uploadFile({
						url: `${getBaseUrl()}/station/alarm/SaveUploadAlarmByCode`,
						files: uploadFiles,                 // 多文件上传
						formData: formData,                 // 其他字段
						header: {
							'auth': uni.getStorageSync('authToken') || '',
							'Custid': String(uni.getStorageSync('curCust')),
							'Lang': 'zh_cn',
							'Apptype': uni.getStorageSync('curApp') || 'road',
						},
						success: (res) => resolve(res),
						fail: (err) => reject(err)
					});
				});

				uni.hideLoading();
				console.log('响应原始数据:', uploadRes);

				// 处理提交结果
				const resp = JSON.parse(uploadRes.data);
				if (resp.code === 0) {
					uni.showToast({ title: '提交成功', icon: 'success' });
					// 返回并刷新列表
					const pages = getCurrentPages();
					const prevPage = pages[pages.length - 2];
					if (prevPage && prevPage.route === 'pages/alarm/components/alarmTypes/alarmWorker') {
						if (typeof prevPage.$vm.fetchWorkerAlarmList === 'function') {
							prevPage.$vm.fetchWorkerAlarmList();
						}
					}
					setTimeout(() => uni.navigateBack(), 1000);
				} else {
					throw new Error(resp.msg || '提交失败');
				}

			} catch (e) {
				uni.hideLoading();
				console.error('提交人工报障单失败:', e.message);
				uni.showToast({ title: e.message || '提交失败，请重试', icon: 'none' });
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.page-container {
	background-color: var(--bg-page);
	min-height: 100vh;
	padding: 40rpx;
	/* 输入框聚焦边框/光标高亮色 */
	--input-focus-color: #2b8bfe;
	--input-focus-shadow: rgba(43, 139, 254, 0.14);
}

/* 夜间模式下输入框的高亮色 */
.page-container.theme-dark {
	--input-focus-color: #5a97ff;
	--input-focus-shadow: rgba(90, 151, 255, 0.22);
}

.report-card {
	background: var(--bg-card);
	padding: 40rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
}

.form-item {
	margin-bottom: 30rpx;
}

.label {
	font-weight: bold;
	color: var(--text-primary, #333333);
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
	background-color: var(--bg-soft);
	color: var(--text-secondary, #999999);
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

/* ===== 输入框（uni-easyinput）内容样式 =====
 * 文字/背景/边框颜色由组件内部的 :styles 行内样式给出（见 script 里的 inputStyles），
 * 这里只负责尺寸、圆角、间距、字号以及聚焦/光标等细节，昼夜配色统一走 --input-* 变量。
 */
.textarea-input,
.normal-input {
	display: block;
	width: 100%;
	margin-top: 10rpx;
}

/* ---- 单行输入框（灯杆编号 / 称呼 / 联系方式） ---- */
.normal-input ::v-deep .uni-easyinput__content {
	min-height: 88rpx;
	padding: 0 24rpx;
	border-radius: 12rpx;
	box-sizing: border-box;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.normal-input ::v-deep .uni-easyinput__content-input {
	height: 84rpx;
	/* 组件默认给 input 加了 10px 内边距，这里统一交给内容区 padding 控制 */
	padding: 0 !important;
	font-size: 32rpx;
	line-height: 1.4;
	color: var(--text-primary, #333333);
	caret-color: var(--input-focus-color, #2b8bfe);
}

/* ---- 多行输入框（故障现象） ---- */
.textarea-input ::v-deep .uni-easyinput__content {
	min-height: 280rpx;
	padding: 20rpx 24rpx;
	align-items: flex-start;
	border-radius: 12rpx;
	box-sizing: border-box;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.textarea-input ::v-deep .uni-easyinput__content-textarea {
	width: 100%;
	min-height: 240rpx;
	margin: 0;
	padding: 0 !important;
	font-size: 32rpx;
	line-height: 1.6;
	color: var(--text-primary, #333333);
	caret-color: var(--input-focus-color, #2b8bfe);
	box-sizing: border-box;
}

/* ---- 聚焦态：边框已由 primaryColor 高亮，再叠一层柔光强化“正在输入” ---- */
.normal-input ::v-deep .uni-easyinput__content.is-focused,
.textarea-input ::v-deep .uni-easyinput__content.is-focused {
	box-shadow: 0 0 0 4rpx var(--input-focus-shadow, rgba(43, 139, 254, 0.14));
}

/* ===== 图片上传区域 ===== */
.upload-area {
	width: 100%;
	min-height: 160rpx;
	background-color: var(--bg-soft);
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
	color: var(--text-quaternary, #cccccc);
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
	background-color: var(--bg-soft);
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
	border: 2rpx dashed var(--border-color);
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--bg-soft);
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
	background: transparent;
}

.btn.submit {
	background: #2b8bfe;
	color: #ffffff;
}
</style>
