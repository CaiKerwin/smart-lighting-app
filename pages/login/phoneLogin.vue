<template>
	<view :class="themeClass" class="login-page">
		<view class="login-card">
			<view class="title">欢迎登录</view>
			<view class="subtitle">智慧城市管理平台</view>

			<view class="input-group">
				<view class="input-label">手机号</view>
				<input
					class="input-field"
					type="number"
					v-model="phone"
					placeholder="请输入手机号"
					placeholder-style="color: #cbd2dc;"
				/>
				<text class="phone-hint">仅支持中国大陆地区手机号</text>
			</view>

			<view class="input-group">
				<view class="input-label">验证码</view>
				<view class="password-wrapper">
					<input
						class="input-field"
						type="text"
						v-model="verifyCode"
						placeholder="请输入验证码"
						placeholder-style="color: #cbd2dc;"
					/>
					<text class="code-button" @click="getCode">{{ codeText }}</text>
				</view>
			</view>

			<button class="login-button" type="primary" @click="handleLogin">登录</button>

			<view class="switch-login">
				<text class="switch-text" @click="goPasswordLogin">账号密码登录</text>
			</view>
		</view>
	</view>
</template>

<script>
import {base64Decode, setUserOperations, setLightShowColumns} from "@/utils/common";
import {request} from "@/utils/request";

export default {
	data() {
		return {
			phone: '',
			verifyCode: '',
			codeText: '获取验证码',
			counting: false
		};
	},
	methods: {
		validatePhone(phone) {
			const phoneRegex = /^1[3456789]\d{9}$/;
			return phoneRegex.test(phone);
		},
		getCode() {
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (this.counting) return;

			if (!this.validatePhone(this.phone)) {
				uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
				return;
			}

			//先获取短信登录码
			uni.request({
				url: 'https://www.amdm.top/api/center/common/auth/GetSmsCode',
				method: 'POST',
				data: { mobile: this.phone },
				success: (res) => {
					console.log(base64Decode(res.data.data));
					uni.showToast({ title: '验证码已发送', icon: 'success' });
				},
				fail: (err) => {
					uni.showToast({ title: '发送失败，请重试', icon: 'none' });
					console.error(err);
				}
			});

			// 启动倒计时
			this.counting = true;
			this.codeText = '60s';
			let seconds = 60;
			const timer = setInterval(() => {
				seconds--;
				this.codeText = `${seconds}s`;
				if (seconds <= 0) {
					clearInterval(timer);
					this.counting = false;
					this.codeText = '重新获取';
				}
			}, 1000);
		},
		handleLogin() {
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (!this.verifyCode) {
				uni.showToast({ title: '请输入验证码', icon: 'none' });
				return;
			}

			// 登录
			uni.request({
				url: 'https://www.amdm.top/api/center/common/auth/SMSLogin',
				method: 'POST',
				data: {
					mobile: this.phone,
					code: this.verifyCode
				},
				success: (res) => {
					console.log(base64Decode(res.data.data));
					const result = JSON.parse(base64Decode(res.data.data));
					if (result.token) {
						// 存储登录信息
						uni.setStorageSync('authToken', result.token);
						uni.setStorageSync('curCust', result.curCust);
						uni.setStorageSync('curApp', result.curApp);
						uni.setStorageSync('userId', result.id); // 用户ID
						uni.showToast({ title: '登录成功', icon: 'success' });
						setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1000);
					} else {
						const errMsg = result.message || result.msg;
						uni.showModal({
							title: '登录失败',
							content: errMsg,
							showCancel: false
						})
					}

					// 登录成功，获取用户权限
					this.getUserPrivilege();
				},
				fail: (err) => {
					uni.showToast({ title: '网络请求失败', icon: 'none' });
					console.error(err);
				}
			});
		},
		goPasswordLogin() {
			if (getCurrentPages().length > 1) {
				uni.navigateBack();
			} else {
				uni.redirectTo({ url: '/pages/login/login' });
			}
		},
		getUserPrivilege() {
			/**
			 * {
			 *   "operations": [
			 *     "9601",
			 *     "9602",
			 *     "9603",
			 *     "9604",
			 *     "9605",
			 *     "9606",
			 *     "sia",
			 *     "sid",
			 *     "9630",
			 *     "9631",
			 *     "9632",
			 *     "9633",
			 *     "9634",
			 *     "9635",
			 *     "9636",
			 *     "9637",
			 *     "9638",
			 *     "9639",
			 *     "9640",
			 *     "9641",
			 *     "9642",
			 *     "dcs",
			 *     "dcc",
			 *     "dco",
			 *     "dck",
			 *     "9650",
			 *     "spav",
			 *     "spsv",
			 *     "96503",
			 *     "96504",
			 *     "96505",
			 *     "96506",
			 *     "9651",
			 *     "9652",
			 *     "96520",
			 *     "96521",
			 *     "96522",
			 *     "96523",
			 *     "96524",
			 *     "96525",
			 *     "9653",
			 *     "slhd",
			 *     "9654",
			 *     "9655",
			 *     "9656",
			 *     "9657",
			 *     "9658",
			 *     "96581",
			 *     "96582",
			 *     "96583",
			 *     "96584",
			 *     "96585",
			 *     "96586",
			 *     "9659",
			 *     "ard1",
			 *     "9670",
			 *     "9671",
			 *     "9672",
			 *     "9673",
			 *     "9674",
			 *     "9675",
			 *     "9676",
			 *     "9677",
			 *     "9678",
			 *     "9679",
			 *     "9680",
			 *     "9681",
			 *     "9610",
			 *     "gv",
			 *     "ge",
			 *     "ga",
			 *     "gd",
			 *     "9611",
			 *     "sv",
			 *     "se",
			 *     "sa",
			 *     "sd",
			 *     "9612",
			 *     "dv",
			 *     "de",
			 *     "da",
			 *     "dd",
			 *     "9613",
			 *     "pv",
			 *     "pe",
			 *     "pa",
			 *     "pd",
			 *     "pv2",
			 *     "pe2",
			 *     "pa2",
			 *     "pd2",
			 *     "cbo1",
			 *     "pv31",
			 *     "pe31",
			 *     "pa31",
			 *     "pd31",
			 *     "pv3",
			 *     "pe3",
			 *     "pa3",
			 *     "pd3",
			 *     "pv4",
			 *     "pe4",
			 *     "pa4",
			 *     "pd4",
			 *     "pv5",
			 *     "pe5",
			 *     "pa5",
			 *     "pd5",
			 *     "pv16",
			 *     "pe16",
			 *     "pa16",
			 *     "pd16",
			 *     "pv6",
			 *     "pe6",
			 *     "pa6",
			 *     "pd6",
			 *     "pv7",
			 *     "pe7",
			 *     "pa7",
			 *     "pd7",
			 *     "pv8",
			 *     "pe8",
			 *     "pa8",
			 *     "pd8",
			 *     "pv9",
			 *     "pe9",
			 *     "pa9",
			 *     "pd9",
			 *     "A50412",
			 *     "A5041201",
			 *     "A5041202",
			 *     "A5041203",
			 *     "A5041204",
			 *     "A50413",
			 *     "A5041301",
			 *     "A5041302",
			 *     "A5041303",
			 *     "A5041304",
			 *     "A50414",
			 *     "A5041401",
			 *     "A5041402",
			 *     "A5041403",
			 *     "A5041404",
			 *     "A50415",
			 *     "A5041501",
			 *     "A5041502",
			 *     "A5041503",
			 *     "A5041504",
			 *     "A50416",
			 *     "A5041601",
			 *     "A5041602",
			 *     "A5041603",
			 *     "A5041604",
			 *     "9614",
			 *     "lgv",
			 *     "lge",
			 *     "lga",
			 *     "lgd",
			 *     "lpv2",
			 *     "lpe2",
			 *     "lpa2",
			 *     "lpd2",
			 *     "lv",
			 *     "le",
			 *     "la",
			 *     "ld",
			 *     "96144",
			 *     "9615",
			 *     "961501",
			 *     "961502",
			 *     "961503",
			 *     "961504",
			 *     "9616",
			 *     "961601",
			 *     "961602",
			 *     "961603",
			 *     "961604",
			 *     "9618",
			 *     "9617",
			 *     "961701",
			 *     "961702",
			 *     "961703",
			 *     "961704",
			 *     "9619",
			 *     "tpv",
			 *     "tpe",
			 *     "tpa",
			 *     "tpd",
			 *     "tlv",
			 *     "tle",
			 *     "tla",
			 *     "tld",
			 *     "tmv",
			 *     "tme",
			 *     "tma",
			 *     "tmd",
			 *     "9620",
			 *     "atv1",
			 *     "ate1",
			 *     "7900",
			 *     "7901",
			 *     "anv",
			 *     "ane",
			 *     "aov",
			 *     "aoe",
			 *     "aoa",
			 *     "aod",
			 *     "abv",
			 *     "abe",
			 *     "A51107",
			 *     "A5110701",
			 *     "A5110702",
			 *     "B1",
			 *     "ocv",
			 *     "occ",
			 *     "lvv",
			 *     "lvc",
			 *     "B101",
			 *     "B10101",
			 *     "B10102",
			 *     "B10103",
			 *     "B10104",
			 *     "B102",
			 *     "lrv",
			 *     "lre",
			 *     "lra",
			 *     "lrd",
			 *     "lsv",
			 *     "lsa",
			 *     "lse",
			 *     "lsd",
			 *     "ldv",
			 *     "lde",
			 *     "lda",
			 *     "ldd",
			 *     "lsd2",
			 *     "ldv2",
			 *     "lde2",
			 *     "lda2",
			 *     "ldd2",
			 *     "gsv",
			 *     "gsp",
			 *     "gsl",
			 *     "gsa",
			 *     "gslw",
			 *     "D001",
			 *     "wwov",
			 *     "wwoe",
			 *     "wdov",
			 *     "sftc",
			 *     "wdod",
			 *     "wotv",
			 *     "womv",
			 *     "wome",
			 *     "woma",
			 *     "womd",
			 *     "worv",
			 *     "wore",
			 *     "wora",
			 *     "word",
			 *     "wcov",
			 *     "wcoe",
			 *     "E1",
			 *     "E101",
			 *     "E10100",
			 *     "E101001",
			 *     "E101002",
			 *     "E10101",
			 *     "E102",
			 *     "E10200",
			 *     "E102001",
			 *     "E102002",
			 *     "E10201",
			 *     "E103",
			 *     "E10300",
			 *     "E103001",
			 *     "E103002",
			 *     "E10301",
			 *     "E104",
			 *     "E10400",
			 *     "E104001",
			 *     "E104002",
			 *     "E10401",
			 *     "E105",
			 *     "E10500",
			 *     "E105001",
			 *     "E105002",
			 *     "E105003",
			 *     "E105004",
			 *     "E10501",
			 *     "E1050101",
			 *     "E1050102",
			 *     "E1050103",
			 *     "E1050104",
			 *     "E10502",
			 *     "F001",
			 *     "aeuv",
			 *     "aeue",
			 *     "F00101",
			 *     "F0012",
			 *     "alrv",
			 *     "alre",
			 *     "F001201",
			 *     "F001202",
			 *     "F001203",
			 *     "F0013",
			 *     "aalv",
			 *     "aale",
			 *     "aatv",
			 *     "aate",
			 *     "G1",
			 *     "G101",
			 *     "G102",
			 *     "G103",
			 *     "G104",
			 *     "9500",
			 *     "9501",
			 *     "9502",
			 *     "9503",
			 *     "9510",
			 *     "9511",
			 *     "9512",
			 *     "9513",
			 *     "9515",
			 *     "G6",
			 *     "G601",
			 *     "G60101",
			 *     "G60102",
			 *     "G602",
			 *     "G603",
			 *     "G60301",
			 *     "G60302",
			 *     "G604",
			 *     "G60401",
			 *     "G60402",
			 *     "slcv",
			 *     "slce",
			 *     "slcmv",
			 *     "slcme",
			 *     "spcv",
			 *     "spce",
			 *     "socv",
			 *     "soce",
			 *     "sccv2",
			 *     "scce2",
			 *     "smcv",
			 *     "smce",
			 *     "9810",
			 *     "9811",
			 *     "9812",
			 *     "9813",
			 *     "c6",
			 *     "c1",
			 *     "c2",
			 *     "c3",
			 *     "c10",
			 *     "c11",
			 *     "ayv",
			 *     "aye",
			 *     "aya",
			 *     "ayd"
			 *   ],
			 *   "config": {
			 *     "appName": "内部测试城市照明",
			 *     "appLogo": "93777905ed554945a3b9f4aa58f7ff11",
			 *     "sysLogo": null,
			 *     "lang": "zh_cn",
			 *     "area": "佛山市",
			 *     "lat": 23.03434679178871,
			 *     "lng": 113.15462234344155,
			 *     "isOwner": false
			 *   },
			 *   "other": {
			 *     "homeCenterStype": 1,
			 *     "homeCenterImage": null,
			 *     "homeCenterGroups": null,
			 *     "deviceStatusStyle": 1,
			 *     "lightShowColumns": [
			 *       "nm",
			 *       "id",
			 *       "ol",
			 *       "u",
			 *       "c",
			 *       "p",
			 *       "f",
			 *       "q",
			 *       "lo",
			 *       "lux",
			 *       "op",
			 *       "oc",
			 *       "cl",
			 *       "tc",
			 *       "gx",
			 *       "gy",
			 *       "gz",
			 *       "hv",
			 *       "sv"
			 *     ],
			 *     "lightShowCommands": [
			 *       "forceRead",
			 *       "openSingle",
			 *       "closeSingle",
			 *       "handSingle",
			 *       "setOutputArgs",
			 *       "getOutputArgs",
			 *       "getclock",
			 *       "setclock",
			 *       "setRatedPower",
			 *       "getRatedPower",
			 *       "setUploadMode",
			 *       "getUploadMode",
			 *       "setVoltageOutputArgs",
			 *       "getVoltageOutputArgs",
			 *       "setPWMOutputArgs",
			 *       "getPWMOutputArgs",
			 *       "getOutputMode",
			 *       "getOutputPowerLimit",
			 *       "setOutputPowerLimit",
			 *       "setOutputVoltageCompensation",
			 *       "getOutputVoltageCompensation",
			 *       "getDayPlan1",
			 *       "setDayPlan1",
			 *       "getDayPlan2",
			 *       "setDayPlan2",
			 *       "getPlanType",
			 *       "getDayPlan3",
			 *       "setDayPlan3",
			 *       "setPlanType",
			 *       "setSigFlag",
			 *       "getSigFlag",
			 *       "getInfo",
			 *       "getSimInfo",
			 *       "getGroup",
			 *       "setGroup",
			 *       "getLuxOpenValue",
			 *       "setLuxOpenValue",
			 *       "setLatLng",
			 *       "getLatLng",
			 *       "setLatLngArgs",
			 *       "getLatLngArgs",
			 *       "getAlarmRange",
			 *       "setAlarmRange",
			 *       "setAlarmStatus",
			 *       "getAlarmStatus",
			 *       "setGyroLevel",
			 *       "getGyroLevel",
			 *       "getLeakageAlarmLevel",
			 *       "setLeakageAlarmLevel",
			 *       "getLeakageAlarmEnable",
			 *       "setLeakageAlarmEnable",
			 *       "getLeakageAlarmStatus",
			 *       "getLoraWork",
			 *       "setLoraWork",
			 *       "getNetwork",
			 *       "setNetwork",
			 *       "getNetArgs",
			 *       "setNetArgs",
			 *       "getAPN",
			 *       "setAPN",
			 *       "getDefaultNetwork",
			 *       "setDefaultNetwork",
			 *       "update",
			 *       "ftp",
			 *       "getftp",
			 *       "reset",
			 *       "init",
			 *       "clearEnergyNumber",
			 *       "getSNID",
			 *       "resetSNID",
			 *       "getRelayLevel",
			 *       "setRelayLevel",
			 *       "clearLog",
			 *       "getLog",
			 *       "getStationInfo",
			 *       "getBatteryParams",
			 *       "setBatteryParams",
			 *       "getChargeParams",
			 *       "setChargeParams",
			 *       "getPhotovoltaicArgs",
			 *       "setPhotovoltaicArgs",
			 *       "getCityChargeParams",
			 *       "setCityChargeParams",
			 *       "getPWMParams",
			 *       "setPWMParams"
			 *     ],
			 *     "powerBoxShowCommands": [
			 *       "forceRead",
			 *       "getclock",
			 *       "setclock",
			 *       "getCmdCount",
			 *       "clearCmds",
			 *       "getInfo",
			 *       "getSimInfo",
			 *       "getVoltageRange",
			 *       "setVoltageRange",
			 *       "getComArgs",
			 *       "setComArgs",
			 *       "getNetwork",
			 *       "setNetwork",
			 *       "getEnergyArgs",
			 *       "setEnergyArgs",
			 *       "getEnergyLog",
			 *       "getDefaultNetwork",
			 *       "setDefaultNetwork",
			 *       "update",
			 *       "reset",
			 *       "init",
			 *       "ftp",
			 *       "clearEnergyNumber",
			 *       "setCurrentType",
			 *       "getCurrentType",
			 *       "setCurrentUnionArgs",
			 *       "getCurrentUnionArgs",
			 *       "setInputUnionArgs",
			 *       "getInputUnionArgs"
			 *     ],
			 *     "outputShowCommands": [
			 *       "handControl",
			 *       "getYearPlan",
			 *       "setYearPlan",
			 *       "setWeekControl",
			 *       "getWeekControl",
			 *       "setTimeEnable",
			 *       "getTimeEnable"
			 *     ],
			 *     "currentShowCommands": [
			 *       "getCurrentRate",
			 *       "setCurrentRate",
			 *       "getCurrentRange",
			 *       "setCurrentRange"
			 *     ],
			 *     "monitorShowCommands": [
			 *       "getYearPlan",
			 *       "setYearPlan",
			 *       "forceRead",
			 *       "forceReadLight",
			 *       "handGroup11",
			 *       "handGroup10",
			 *       "handGroup1",
			 *       "handAll1",
			 *       "handAll0",
			 *       "handAll",
			 *       "getclock",
			 *       "setclock",
			 *       "setallclock",
			 *       "getWhite",
			 *       "setWhite",
			 *       "getCmdCount",
			 *       "clearCmds",
			 *       "getInfo",
			 *       "getSimInfo",
			 *       "getLoraWork",
			 *       "setLoraWork",
			 *       "startFindSlave",
			 *       "stopFindSlave",
			 *       "startReadWhiteFlag",
			 *       "stopReadWhiteFlag",
			 *       "getWhiteFlag",
			 *       "getMonitorSnId",
			 *       "getNetwork",
			 *       "setNetwork",
			 *       "startNet",
			 *       "update",
			 *       "setLightUpdate",
			 *       "getLightUpdate",
			 *       "setSaveOtaFile",
			 *       "getSaveOtaFile",
			 *       "startSaveOtaFile",
			 *       "reset",
			 *       "init",
			 *       "setLuxOutput",
			 *       "getLuxOutput",
			 *       "handAdjust"
			 *     ],
			 *     "mapType": null,
			 *     "mapKey": null
			 *   }
			 * }
			 */
			request({
				url: '/common/auth/QueryMyOperations',
				method: 'POST',
				data: {
					app: 'road', // 这里固定为road 路灯照明
					cust: uni.getStorageSync('curCust') // 当前客户id
				}
			}).then(res =>{
				const decoded = base64Decode(res.data.data);
				console.log(decoded);
				try {
					const privilege = JSON.parse(decoded);
					const operations = privilege && Array.isArray(privilege.operations) ? privilege.operations : [];
					setUserOperations(operations);
					// 保存单灯显示列权限（other.lightShowColumns）：含 p/op 显示功率亮度、含 pole 显示灯杆名称
					const other = privilege && privilege.other;
					setLightShowColumns(other && Array.isArray(other.lightShowColumns) ? other.lightShowColumns : null);
				} catch (e) {
					console.error('解析用户权限失败', e);
				}
			}).catch(err =>{
				console.error('查询我的权限失败', err.message);
			})
		},
	}
};
</script>

<style lang="scss" scoped>
.login-page {
	min-height: 100vh;
	background: var(--bg-page, #ffffff);
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 40rpx;
}

.login-card {
	width: 100%;
	max-width: 680rpx;
	background: transparent;
}

.title {
	font-size: 32px;
	font-weight: 700;
	color: var(--text-primary, #1f2d3d);
	margin-bottom: 8rpx;
}

.subtitle {
	font-size: 16px;
	font-weight: bold;
	color: var(--text-secondary, #64718a);
	margin-bottom: 64rpx;
}

.input-group {
	margin-bottom: 40rpx;
}

.input-label {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #1f2d3d);
	margin-bottom: 16rpx;
}

.input-field {
	width: 100%;
	height: 40rpx;
	padding: 12rpx 0;
	border: none;
	border-bottom: 1px solid var(--border-color, #e4e7ed);
	background: transparent;
	font-size: 28rpx;
	color: var(--text-primary, #1f2d3d);
	transition: border-color 0.3s;
}
.input-field:focus {
	border-bottom-color: #3075ff;
}

.phone-hint {
	margin-top: 12rpx;
	font-size: 22rpx;
	color: var(--text-quaternary, #909ba6);
	line-height: 1.4;
}

.password-wrapper {
	display: flex;
	align-items: center;
	width: 100%;
}

.password-wrapper .input-field {
	flex: 1;
	padding-right: 0;
}

.code-button {
	margin-left: 12rpx;
	padding: 8rpx 16rpx;
	font-size: 24rpx;
	color: #3075ff;
	white-space: nowrap;
}

.switch-login {
	margin-top: 24rpx;
	text-align: center;
}

.switch-text {
	font-size: 24rpx;
	color: var(--text-secondary, #6c7b92);
}

.login-button {
	width: 100%;
	height: 96rpx;
	line-height: 96rpx;
	border-radius: 24rpx;
	background: linear-gradient(90deg, #3d80ff 0%, #1ba6ff 100%);
	color: #ffffff;
	font-size: 32rpx;
	border: none;
}
.login-button::after {
	border: none;
}
</style>
