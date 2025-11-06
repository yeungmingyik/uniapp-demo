<template>
	<view class="page">
		<view class="user-header">
			<image class="avatar" src="/static/avatar.png" mode="aspectFill"></image>
			<view class="user-texts">
				<view class="greeting-row">
					<text class="greeting">你好，{{ currentUser }}👋</text>
					<picker @change="onUserChange" :value="userIndex" :range="userList" range-key="label" v-if="userList.length > 0">
						<view class="user-picker">
							<text class="picker-text">{{ userList[userIndex] ? userList[userIndex].label : '选择用户' }}</text>
							<text class="picker-icon">▼</text>
						</view>
					</picker>
				</view>
				<text class="date">{{ formattedDate }}</text>
			</view>
		</view>

		<view class="section-title">我的设备</view>
		<view class="device-filter">
			<view class="filter-row">
				<view class="filter-item">
					<text class="filter-label">设备ID</text>
					<picker @change="onDeviceIdChange" :value="deviceIdIndex" :range="deviceIdList" range-key="label" v-if="deviceIdList.length > 0">
						<view class="filter-picker">
							<text class="picker-text">{{ deviceIdList[deviceIdIndex] ? deviceIdList[deviceIdIndex].label : '全部' }}</text>
							<text class="picker-icon">▼</text>
						</view>
					</picker>
				</view>
				<view class="filter-item">
					<text class="filter-label">设备名称</text>
					<picker @change="onDeviceNameChange" :value="deviceNameIndex" :range="deviceNameList" range-key="label" v-if="deviceNameList.length > 0">
						<view class="filter-picker">
							<text class="picker-text">{{ deviceNameList[deviceNameIndex] ? deviceNameList[deviceNameIndex].label : '全部' }}</text>
							<text class="picker-icon">▼</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="section-title">健康数据</view>
		<view class="cards">
			<view class="card" @click="goToDetail('temperature')">
				<view class="card-header-row">
					<text class="card-title">体温</text>
					<image class="card-icon" src="/static/temperature.png" mode="heightFix"></image>
				</view>
				<view class="card-value">
					<text class="value-text">{{ temperatureValue > 0 ? temperatureValue.toFixed(1) : '--' }}</text>
					<text class="unit-text" v-if="temperatureValue > 0">℃</text>
				</view>
				<view class="card-time">{{ temperatureTimeText }}</view>
			</view>

			<view class="card" @click="goToDetail('heart_rate')">
				<view class="card-header-row">
					<text class="card-title">心率</text>
					<image class="card-icon" src="/static/heart.png" mode="heightFix"></image>
				</view>
				<view class="card-value">
					<text class="value-text">{{ heartRateValue > 0 ? heartRateValue : '--' }}</text>
					<text class="unit-text" v-if="heartRateValue > 0">bpm</text>
				</view>
				<view class="card-time">{{ heartRateTimeText }}</view>
			</view>

			<view class="card" @click="goToDetail('blood_oxygen')">
				<view class="card-header-row">
					<text class="card-title">血氧饱和度</text>
					<image class="card-icon" src="/static/spo2.png" mode="heightFix"></image>
				</view>
				<view class="card-value">
					<text class="value-text">{{ spo2Value > 0 ? spo2Value : '--' }}</text>
					<text class="unit-text" v-if="spo2Value > 0">%</text>
				</view>
				<view class="card-time">{{ spo2TimeText }}</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getUserList, getUserHealthDataMultiple } from '../../utils/api.js'
	
	export default {
		data() {
			return {
				formattedDate: '',
				currentUser: 'user_0',
				userList: [],
				userIndex: 0,
				// 设备筛选
				deviceIdList: [
					{ label: '全部', value: '' },
					...Array.from({ length: 10 }, (_, i) => ({ label: `device_${i}`, value: `device_${i}` }))
				],
				deviceIdIndex: 0,
				selectedDeviceId: '',
				deviceNameList: [
					{ label: '全部', value: '' },
					{ label: 'esp32', value: 'esp32' },
					{ label: 'esp8266', value: 'esp8266' }
				],
				deviceNameIndex: 0,
				selectedDeviceName: '',
				// 健康数据值
				temperatureValue: 0,
				heartRateValue: 0,
				spo2Value: 0,
				// 健康数据时间
				temperatureTime: null,
				heartRateTime: null,
				spo2Time: null,
				// 时间文本
				temperatureTimeText: '加载中...',
				heartRateTimeText: '加载中...',
				spo2TimeText: '加载中...',
				// 定时器
				timeUpdateTimer: null
			}
		},
		onLoad() {
			this.formattedDate = this.formatDate(new Date())
			this.loadUserList()
		},
		onShow() {
			// 页面显示时刷新时间显示
			this.updateTimeTexts()
			// 启动定时器，每秒更新一次时间显示
			this.timeUpdateTimer = setInterval(() => {
				this.updateTimeTexts()
			}, 1000)
		},
		onHide() {
			// 页面隐藏时清除定时器
			if (this.timeUpdateTimer) {
				clearInterval(this.timeUpdateTimer)
				this.timeUpdateTimer = null
			}
		},
		onUnload() {
			// 页面卸载时清除定时器
			if (this.timeUpdateTimer) {
				clearInterval(this.timeUpdateTimer)
				this.timeUpdateTimer = null
			}
		},
		methods: {
			formatDate(date) {
				const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				const w = weekMap[date.getDay()]
				const m = date.getMonth() + 1
				const d = date.getDate()
				return `${w}，${m}月${d}日`
			},
			// 加载用户列表
			async loadUserList() {
				try {
					const users = await getUserList()
					if (users && users.length > 0) {
						this.userList = users.map(userId => ({
							label: userId,
							value: userId
						}))
						// 查找默认用户 user_0 的索引
						const defaultIndex = this.userList.findIndex(u => u.value === 'user_0' || u.value === 'user_id_0')
						if (defaultIndex >= 0) {
							this.userIndex = defaultIndex
						} else {
							this.userIndex = 0
						}
						this.currentUser = this.userList[this.userIndex].value
						// 加载用户数据
						this.loadHealthData()
					}
				} catch (error) {
					console.error('加载用户列表失败:', error)
					uni.showToast({
						title: '加载用户列表失败',
						icon: 'none'
					})
				}
			},
			// 用户选择改变
			onUserChange(e) {
				this.userIndex = e.detail.value
				this.currentUser = this.userList[this.userIndex].value
				this.loadHealthData()
			},
			// 设备ID选择改变
			onDeviceIdChange(e) {
				this.deviceIdIndex = e.detail.value
				this.selectedDeviceId = this.deviceIdList[this.deviceIdIndex].value
				this.loadHealthData()
			},
			// 设备名称选择改变
			onDeviceNameChange(e) {
				this.deviceNameIndex = e.detail.value
				this.selectedDeviceName = this.deviceNameList[this.deviceNameIndex].value
				this.loadHealthData()
			},
			// 加载健康数据
			async loadHealthData() {
				if (!this.currentUser) return
				
				uni.showLoading({
					title: '加载中...'
				})
				
				try {
					// 构建设备筛选标签
					const tags = {}
					if (this.selectedDeviceId) {
						tags.device_id = this.selectedDeviceId
					}
					if (this.selectedDeviceName) {
						tags.device_name = this.selectedDeviceName
					}
					
					// 分别获取三个字段的数据
					const results = await getUserHealthDataMultiple(this.currentUser, ['heart_rate', 'temperature', 'blood_oxygen'], '', tags)
					
					// 更新体温数据
					if (results.temperature) {
						this.temperatureValue = results.temperature.value
						this.temperatureTime = results.temperature.time
						this.temperatureTimeText = this.getTimeAgo(results.temperature.time)
					} else {
						this.temperatureValue = 0
						this.temperatureTime = null
						this.temperatureTimeText = '暂无数据'
					}
					
					// 更新心率数据
					if (results.heart_rate) {
						this.heartRateValue = results.heart_rate.value
						this.heartRateTime = results.heart_rate.time
						this.heartRateTimeText = this.getTimeAgo(results.heart_rate.time)
					} else {
						this.heartRateValue = 0
						this.heartRateTime = null
						this.heartRateTimeText = '暂无数据'
					}
					
					// 更新血氧数据
					if (results.blood_oxygen) {
						this.spo2Value = results.blood_oxygen.value
						this.spo2Time = results.blood_oxygen.time
						this.spo2TimeText = this.getTimeAgo(results.blood_oxygen.time)
					} else {
						this.spo2Value = 0
						this.spo2Time = null
						this.spo2TimeText = '暂无数据'
					}
					
					// 立即更新一次时间显示
					this.updateTimeTexts()
					
				} catch (error) {
					console.error('加载健康数据失败:', error)
					uni.showToast({
						title: '加载数据失败',
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
				}
			},
			// 计算时间间隔
			getTimeAgo(timeStr) {
				if (!timeStr) return '暂无数据'
				
				try {
					const dataTime = new Date(timeStr)
					const now = new Date()
					const diffMs = now - dataTime
					const diffSeconds = Math.floor(diffMs / 1000)
					const diffMinutes = Math.floor(diffSeconds / 60)
					const diffHours = Math.floor(diffMinutes / 60)
					const diffDays = Math.floor(diffHours / 24)
					
					if (diffSeconds < 60) {
						return '刚刚'
					} else if (diffMinutes < 60) {
						return `${diffMinutes}分钟前`
					} else if (diffHours < 24) {
						return `${diffHours}小时前`
					} else if (diffDays < 7) {
						return `${diffDays}天前`
					} else {
						return dataTime.toLocaleDateString('zh-CN')
					}
				} catch (error) {
					console.error('时间计算错误:', error)
					return '时间错误'
				}
			},
			// 更新所有时间文本
			updateTimeTexts() {
				if (this.temperatureTime) {
					this.temperatureTimeText = this.getTimeAgo(this.temperatureTime)
				}
				if (this.heartRateTime) {
					this.heartRateTimeText = this.getTimeAgo(this.heartRateTime)
				}
				if (this.spo2Time) {
					this.spo2TimeText = this.getTimeAgo(this.spo2Time)
				}
			},
			// 跳转到详情页
			goToDetail(field) {
				let url = `/pages/detail/detail?userId=${this.currentUser}&field=${field}`
				if (this.selectedDeviceId) {
					url += `&deviceId=${this.selectedDeviceId}`
				}
				if (this.selectedDeviceName) {
					url += `&deviceName=${this.selectedDeviceName}`
				}
				uni.navigateTo({
					url: url
				})
			}
		}
	}
</script>

<style>
	.page {
		padding: 32rpx 48rpx;
		background-color: #FFFFFF;
	}

	.user-header {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 48rpx;
		background-color: #F0F0F0;
	}

	.user-texts {
		margin-left: 40rpx;
		display: flex;
		flex-direction: column;
	}

	.greeting {
		font-size: 28rpx; 
		color: #8F98A3;
		line-height: 40rpx;
	}

	.date {
		margin-top: 2rpx;
		font-size: 36rpx;
		font-weight: 700;
		color: #2E2E2E;
		line-height: 56rpx;
	}

	.section-title {
		margin-top: 50rpx;
		margin-bottom: 20rpx;
		font-size: 40rpx;
		font-weight: 700;
		color: #111111;
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.card {
		background-color: #FFFFFF;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
		position: relative;
		height: 200rpx;
	}

	.card-header-row { display: flex; align-items: center; justify-content: space-between; }
	.card-title { font-size: 26rpx; color: #333333; font-weight: 600; }
	.card-icon { height: 48rpx; width: 48rpx; }

	.card-value { position: absolute; left: 20rpx; bottom: 20rpx; display: flex; align-items: baseline; }
	.value-text { font-size: 65rpx; font-weight: 700; color: #111111; line-height: 1; }
	.unit-text { margin-left: 12rpx; font-size: 25rpx; color: #9AA1A9; line-height: 1; }
	
	.card-time {
		position: absolute;
		right: 20rpx;
		bottom: 20rpx;
		font-size: 22rpx;
		color: #9AA1A9;
	}
	
	.greeting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.user-picker {
		display: flex;
		align-items: center;
		padding: 4rpx 12rpx;
		background-color: #F5F5F5;
		border-radius: 8rpx;
		margin-left: 16rpx;
	}
	
	.picker-text {
		font-size: 24rpx;
		color: #333333;
		margin-right: 4rpx;
	}
	
	.picker-icon {
		font-size: 20rpx;
		color: #999999;
	}
	
	.device-filter {
		margin-bottom: 32rpx;
	}
	
	.filter-row {
		display: flex;
		gap: 24rpx;
	}
	
	.filter-item {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.filter-label {
		font-size: 24rpx;
		color: #666666;
		margin-bottom: 12rpx;
	}
	
	.filter-picker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx 20rpx;
		background-color: #F5F5F5;
		border-radius: 8rpx;
	}
</style>
