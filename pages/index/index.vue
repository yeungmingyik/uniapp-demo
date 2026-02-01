<template>
	<view class="page">
	<view class="content">
			<view class="user-header" v-if="activeTab === 'health'">
				<image class="avatar" src="/static/avatar.png" mode="aspectFill"></image>
				<view class="user-info">
					<view class="greeting-row">
						<text class="greeting">你好，{{ currentUser || '未设置用户' }}👋</text>
						<picker v-if="userList.length > 0" @change="onUserChange" :value="userIndex" :range="userList" range-key="label">
							<view class="user-picker">
								<text class="picker-text">{{ userList[userIndex] ? userList[userIndex].label : '选择用户' }}</text>
								<text class="picker-icon">▼</text>
							</view>
						</picker>
					</view>
					<text class="sub-info">当前设备：{{ currentDeviceLabel }}</text>
					<text class="date">{{ formattedDate }}</text>
				</view>
			</view>

			<view v-if="activeTab === 'health'" class="tab-panel">
				<view class="section-title">健康监测中心</view>
				<view class="cards">
					<view class="card" @click="goToDetail('temperature')">
						<view class="card-header-row">
							<text class="card-title">体温</text>
							<image class="card-icon" src="/static/temperature.png" mode="heightFix"></image>
						</view>
						<view class="card-value">
							<text class="value-text">
								{{ formatNumber(temperatureValue) }}
							</text>
							<text class="unit-text" v-if="temperatureValue !== null">℃</text>
						</view>
						<view class="card-time">{{ temperatureTimeText }}</view>
					</view>

					<view class="card" @click="goToDetail('heart_rate')">
						<view class="card-header-row">
							<text class="card-title">心率</text>
							<image class="card-icon" src="/static/heart.png" mode="heightFix"></image>
						</view>
						<view class="card-value">
							<text class="value-text">{{ formatNumber(heartRateValue) }}</text>
							<text class="unit-text" v-if="heartRateValue !== null">bpm</text>
						</view>
						<view class="card-time">{{ heartRateTimeText }}</view>
					</view>

					<view class="card" @click="goToDetail('blood_oxygen')">
						<view class="card-header-row">
							<text class="card-title">血氧饱和度</text>
							<image class="card-icon" src="/static/spo2.png" mode="heightFix"></image>
						</view>
						<view class="card-value">
							<text class="value-text">{{ formatNumber(spo2Value) }}</text>
							<text class="unit-text" v-if="spo2Value !== null">%</text>
						</view>
						<view class="card-time">{{ spo2TimeText }}</view>
					</view>
				</view>

				<view class="section-title ai-report-title">AI 健康分析报告</view>
				<view class="ai-report-card">
					<view class="ai-report-header">
						<text class="card-title">AI 智能分析报告</text>
						<text class="ai-time">{{ formattedDate }}</text>
					</view>
					<view class="ai-report-content">
						<view v-if="loadingAiReport" class="ai-loading">
							<text class="loading-text">AI 正在深度分析中...</text>
						</view>
						<rich-text v-else-if="aiReportContent" :nodes="renderMarkdown(aiReportContent)"></rich-text>
						<view v-else class="ai-empty">
							<text class="empty-text">暂无分析报告</text>
						</view>
					</view>
				</view>
			</view>

			<view v-else class="tab-panel">
				<view class="section-title">我的设备</view>
				<view v-if="devices.length === 0" class="empty-device">
					<image class="empty-image" src="/static/no-device.png" mode="aspectFit"></image>
					<text class="empty-text">您还未添加任何设备</text>
					<view class="primary-btn" @click="openAddDevice">添加设备</view>
				</view>
				<view v-else class="device-list">
					<view
						class="device-item"
						:class="{ active: selectedDeviceIndex === index }"
						v-for="(device, index) in devices"
						:key="deviceKey(device)"
						@click="selectDevice(index)"
					>
						<view class="device-main-row">
							<view class="device-main">
								<text class="device-name">{{ deviceDisplayName(device) }}</text>
								<text class="device-id">{{ device.id ? `ID：${device.id}` : '未提供ID' }}</text>
							</view>
						</view>
						<view class="device-actions">
							<view
								class="device-action-btn success"
								:class="{ disabled: selectedDeviceIndex === index }"
								@click.stop="selectDevice(index)"
								:disabled="selectedDeviceIndex === index"
							>
								{{ selectedDeviceIndex === index ? '当前设备' : '切换设备' }}
							</view>
							<view
								class="device-action-btn danger"
								@click.stop="unbindDevice(index)"
							>
								解绑设备
							</view>
						</view>
					</view>
					<view class="primary-btn outline" @click="openAddDevice">添加设备</view>
				</view>
			</view>
		</view>

		<view class="bottom-nav">
			<view class="nav-btn" :class="{ active: activeTab === 'health' }" @click="switchTab('health')">
				<image class="nav-icon" :src="activeTab === 'health' ? '/static/health-select.png' : '/static/health.png'" mode="aspectFit"></image>
				<text class="nav-text">健康</text>
			</view>
			<view class="nav-btn" :class="{ active: activeTab === 'device' }" @click="switchTab('device')">
				<image class="nav-icon" :src="activeTab === 'device' ? '/static/device-select.png' : '/static/device.png'" mode="aspectFit"></image>
				<text class="nav-text">设备</text>
			</view>
		</view>

		<view v-if="showAddDeviceModal" class="modal-mask">
			<view class="modal-card">
				<view class="modal-title">添加设备</view>
				<view class="modal-body">
					<view class="input-group">
						<text class="input-label">设备ID</text>
						<input class="input-field" placeholder="请输入设备ID" v-model="newDeviceId" />
					</view>
					<view class="input-group">
						<text class="input-label">设备名称</text>
						<input class="input-field" placeholder="请输入设备名称" v-model="newDeviceName" />
					</view>
				</view>
				<view class="modal-actions">
					<view class="action-btn ghost" @click="closeAddDevice">取消</view>
					<view class="action-btn primary" @click="confirmAddDevice">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getUserList, getUserHealthDataMultiple, getDeviceOptions } from '../../utils/api.js'
	
	export default {
		data() {
			return {
				formattedDate: '',
				activeTab: 'health',
				userList: [],
				userIndex: 0,
				currentUser: '',
				remoteDevices: [],
				customDevices: [],
				blockedDeviceKeys: [],
				devices: [],
				selectedDevice: null,
				selectedDeviceIndex: -1,
				selectedDeviceId: '',
				selectedDeviceName: '',
				temperatureValue: null,
				heartRateValue: null,
				spo2Value: null,
				temperatureTime: null,
				heartRateTime: null,
				spo2Time: null,
				temperatureTimeText: '加载中...',
				heartRateTimeText: '加载中...',
				spo2TimeText: '加载中...',
				timeUpdateTimer: null,
				showAddDeviceModal: false,
				newDeviceId: '',
				newDeviceName: '',
				aiReportContent: '',
				loadingAiReport: false
			}
		},
		computed: {
			currentDeviceLabel() {
				if (!this.selectedDevice) return '未选择设备'
				const { name, id } = this.selectedDevice
				if (name && id) return `${name}（${id}）`
				return name || id || '未命名设备'
			},
			showHealthCards() {
				return !!(this.selectedDevice && this.currentUser)
			},
			healthPrimaryHint() {
				if (!this.selectedDevice) return '请绑定设备'
				if (!this.currentUser) return '请设置用户'
				return '暂无数据'
			},
			healthSecondaryHint() {
				if (!this.selectedDevice && !this.currentUser) return '请设置用户'
				return ''
			}
		},
		async onLoad() {
			this.formattedDate = this.formatDate(new Date())
			this.loadCustomDevices()
			this.loadBlockedDevices()
			await Promise.all([
				this.loadUserList(false),
				this.loadDeviceOptions()
			])
			this.restoreSelectedDevice()
			this.loadHealthData()
			uni.setNavigationBarTitle({ title: '健康监测系统' })
		},
		onShow() {
			this.updateTimeTexts()
			this.timeUpdateTimer = setInterval(() => {
				this.updateTimeTexts()
			}, 1000)
		},
		onHide() {
			if (this.timeUpdateTimer) {
				clearInterval(this.timeUpdateTimer)
				this.timeUpdateTimer = null
			}
		},
		onUnload() {
			if (this.timeUpdateTimer) {
				clearInterval(this.timeUpdateTimer)
				this.timeUpdateTimer = null
			}
		},
		methods: {
			switchTab(tab) {
				this.activeTab = tab
				uni.setNavigationBarTitle({ title: '健康监测系统' })
			},
			deviceKey(device) {
				return `${device.id || 'noid'}__${device.name || 'noname'}`
			},
			deviceDisplayName(device) {
				if (device.name && device.id) return device.name
				if (device.name) return device.name
				if (device.id) return `设备 ${device.id}`
				return '未命名设备'
			},
			formatDate(date) {
				const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				const w = weekMap[date.getDay()]
				const m = date.getMonth() + 1
				const d = date.getDate()
				return `${w}，${m}月${d}日`
			},
			async loadUserList(autoLoad = true) {
				try {
					const users = await getUserList()
					if (users && users.length > 0) {
						this.userList = users.map(userId => ({
							label: userId,
							value: userId
						}))
						this.userIndex = 0
						this.currentUser = this.userList[this.userIndex].value
						if (autoLoad) {
							this.loadHealthData()
						}
					}
				} catch (error) {
					console.error('加载用户列表失败:', error)
					uni.showToast({
						title: '加载用户列表失败',
						icon: 'none'
					})
				}
			},
			loadCustomDevices() {
				const saved = uni.getStorageSync('customDevices')
				if (Array.isArray(saved)) {
					this.customDevices = saved.map(dev => ({
						id: (dev.id || '').trim(),
						name: (dev.name || '').trim()
					}))
				} else {
					this.customDevices = []
				}
			},
			loadBlockedDevices() {
				const saved = uni.getStorageSync('blockedDevices')
				this.blockedDeviceKeys = Array.isArray(saved) ? saved : []
			},
			saveBlockedDevices() {
				uni.setStorageSync('blockedDevices', this.blockedDeviceKeys)
			},
			saveCustomDevices() {
				uni.setStorageSync('customDevices', this.customDevices)
			},
			async loadDeviceOptions() {
				try {
					const { deviceIds, deviceNames } = await getDeviceOptions()
					const remote = []
					if (Array.isArray(deviceIds) && Array.isArray(deviceNames) && deviceIds.length === deviceNames.length) {
						deviceIds.forEach((id, idx) => {
							remote.push({
								id: (id || '').trim(),
								name: (deviceNames[idx] || '').trim()
							})
						})
					} else {
						if (Array.isArray(deviceIds)) {
							deviceIds.forEach(id => {
								remote.push({
									id: (id || '').trim(),
									name: ''
								})
							})
						}
						if (Array.isArray(deviceNames)) {
							deviceNames.forEach(name => {
								remote.push({
									id: '',
									name: (name || '').trim()
								})
							})
						}
					}
					this.remoteDevices = remote
					this.devices = this.mergeDeviceLists()
				} catch (error) {
					console.error('加载设备列表失败:', error)
					uni.showToast({
						title: '加载设备列表失败',
						icon: 'none'
					})
					this.remoteDevices = []
					this.devices = this.mergeDeviceLists()
				}
			},
			mergeDeviceLists() {
				const map = new Map()
				const add = (device) => {
					if (!device) return
					const id = (device.id || '').trim()
					const name = (device.name || '').trim()
					const key = `${id}__${name}`
					if (!this.blockedDeviceKeys.includes(key) && !map.has(key)) {
						map.set(key, { id, name })
					}
				}
				this.remoteDevices.forEach(add)
				this.customDevices.forEach(add)
				return Array.from(map.values())
			},
			restoreSelectedDevice() {
				const saved = uni.getStorageSync('selectedDevice')
				if (saved && typeof saved === 'object') {
					const index = this.devices.findIndex(dev => dev.id === saved.id && dev.name === saved.name)
					if (index >= 0) {
						this.selectDevice(index, false)
						return
					}
				}
				if (this.devices.length > 0) {
					this.selectDevice(0, false)
				} else {
					this.selectedDevice = null
					this.selectedDeviceIndex = -1
					this.selectedDeviceId = ''
					this.selectedDeviceName = ''
					this.setEmptyHealthData()
				}
			},
			onUserChange(e) {
				this.userIndex = e.detail.value
				this.currentUser = this.userList[this.userIndex].value
				this.loadHealthData()
			},
			selectDevice(index, refresh = true) {
				if (index < 0 || index >= this.devices.length) return
				if (this.selectedDeviceIndex === index) return
				this.selectedDeviceIndex = index
				const device = this.devices[index]
				this.selectedDevice = device
				this.selectedDeviceId = device.id || ''
				this.selectedDeviceName = device.name || ''
				uni.setStorageSync('selectedDevice', device)
				if (refresh) {
					this.loadHealthData()
				} else {
					this.updateTimeTexts()
				}
			},
			openAddDevice() {
				this.newDeviceId = ''
				this.newDeviceName = ''
				this.showAddDeviceModal = true
			},
			closeAddDevice() {
				this.showAddDeviceModal = false
			},
			confirmAddDevice() {
				const id = this.newDeviceId.trim()
				const name = this.newDeviceName.trim()
				if (!id) {
					uni.showToast({ title: '请输入设备ID', icon: 'none' })
					return
				}
				if (!name) {
					uni.showToast({ title: '请输入设备名称', icon: 'none' })
					return
				}
				const exists = this.devices.some(dev => dev.id === id && dev.name === name)
				if (exists) {
					uni.showToast({ title: '设备已存在', icon: 'none' })
					return
				}
				const newDevice = { id, name }
				this.customDevices.push(newDevice)
				this.saveCustomDevices()
				this.devices = this.mergeDeviceLists()
				this.closeAddDevice()
				const index = this.devices.findIndex(dev => dev.id === id && dev.name === name)
				if (index >= 0) {
					this.selectDevice(index)
				}
				uni.showToast({ title: '添加成功', icon: 'success' })
			},
			unbindDevice(index) {
				if (index < 0 || index >= this.devices.length) return
				const device = this.devices[index]
				const key = this.deviceKey(device)
				const customIdx = this.customDevices.findIndex(dev => this.deviceKey(dev) === key)
				if (customIdx !== -1) {
					this.customDevices.splice(customIdx, 1)
					this.saveCustomDevices()
				} else {
					if (!this.blockedDeviceKeys.includes(key)) {
						this.blockedDeviceKeys.push(key)
						this.saveBlockedDevices()
					}
				}
				this.devices = this.mergeDeviceLists()
				if (this.selectedDevice && this.deviceKey(this.selectedDevice) === key) {
					this.selectedDevice = null
					this.selectedDeviceIndex = -1
					this.selectedDeviceId = ''
					this.selectedDeviceName = ''
					if (this.devices.length > 0) {
						this.selectDevice(0)
					} else {
						this.setEmptyHealthData()
					}
				}
				uni.showToast({ title: '设备已解绑', icon: 'success' })
			},
			async loadHealthData() {
				if (!this.currentUser || !this.selectedDevice) {
					this.setEmptyHealthData()
					return
				}
				uni.showLoading({ title: '加载中...' })
				this.loadingAiReport = true
				try {
					const tags = {}
					if (this.selectedDeviceId) tags.device_id = this.selectedDeviceId
					if (this.selectedDeviceName) tags.device_name = this.selectedDeviceName
					const results = await getUserHealthDataMultiple(
						this.currentUser,
						['heart_rate', 'temperature', 'blood_oxygen'],
						'-365d',
						tags,
						true // 获取 AI 报告
					)
					this.applyHealthResults(results)
					this.aiReportContent = results.aiReport || ''
				} catch (error) {
					console.error('加载健康数据失败:', error)
					uni.showToast({ title: '加载数据失败', icon: 'none' })
					this.setEmptyHealthData()
					this.temperatureTimeText = '数据加载失败'
					this.heartRateTimeText = '数据加载失败'
					this.spo2TimeText = '数据加载失败'
				} finally {
					uni.hideLoading()
					this.loadingAiReport = false
				}
			},
			applyHealthResults(results) {
				const parseValue = (val) => {
					const num = parseFloat(val)
					return Number.isNaN(num) ? null : num
				}

				if (results.temperature) {
					const value = parseValue(results.temperature.value)
					this.temperatureValue = value
					this.temperatureTime = results.temperature.time || null
					this.temperatureTimeText = value !== null && this.temperatureTime
						? this.getTimeAgo(this.temperatureTime)
						: this.healthPrimaryHint
				} else {
					this.temperatureValue = null
					this.temperatureTime = null
					this.temperatureTimeText = this.healthPrimaryHint
				}

				if (results.heart_rate) {
					const value = parseValue(results.heart_rate.value)
					this.heartRateValue = value
					this.heartRateTime = results.heart_rate.time || null
					this.heartRateTimeText = value !== null && this.heartRateTime
						? this.getTimeAgo(this.heartRateTime)
						: this.healthPrimaryHint
				} else {
					this.heartRateValue = null
					this.heartRateTime = null
					this.heartRateTimeText = this.healthPrimaryHint
				}

				if (results.blood_oxygen) {
					const value = parseValue(results.blood_oxygen.value)
					this.spo2Value = value
					this.spo2Time = results.blood_oxygen.time || null
					this.spo2TimeText = value !== null && this.spo2Time
						? this.getTimeAgo(this.spo2Time)
						: this.healthPrimaryHint
				} else {
					this.spo2Value = null
					this.spo2Time = null
					this.spo2TimeText = this.healthPrimaryHint
				}
			},
			setEmptyHealthData() {
				this.temperatureValue = null
				this.heartRateValue = null
				this.spo2Value = null
				this.temperatureTime = null
				this.heartRateTime = null
				this.spo2Time = null
				const message = this.healthPrimaryHint
				this.temperatureTimeText = message
				this.heartRateTimeText = message
				this.spo2TimeText = message
			},
			formatNumber(num) {
				if (num === null || num === undefined) {
					return '--'
				}
				const numValue = parseFloat(num)
				if (Number.isNaN(numValue)) {
					return '--'
				}
				const fixed = numValue.toFixed(2)
				const parsed = parseFloat(fixed)
				if (parsed % 1 === 0) {
					return parsed.toString()
				}
				return parsed.toString()
			},
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
					if (diffSeconds < 60) return '刚刚'
					if (diffMinutes < 60) return `${diffMinutes}分钟前`
					if (diffHours < 24) return `${diffHours}小时前`
					if (diffDays < 365) return `${diffDays}天前`
					return dataTime.toLocaleDateString('zh-CN')
				} catch (error) {
					console.error('时间计算错误:', error)
					return '时间错误'
				}
			},
			updateTimeTexts() {
				if (!this.showHealthCards) {
					this.setEmptyHealthData()
					return
				}
				if (this.temperatureTime) {
					this.temperatureTimeText = this.getTimeAgo(this.temperatureTime)
				} else {
					this.temperatureTimeText = this.healthPrimaryHint
				}
				if (this.heartRateTime) {
					this.heartRateTimeText = this.getTimeAgo(this.heartRateTime)
				} else {
					this.heartRateTimeText = this.healthPrimaryHint
				}
				if (this.spo2Time) {
					this.spo2TimeText = this.getTimeAgo(this.spo2Time)
				} else {
					this.spo2TimeText = this.healthPrimaryHint
				}
			},
			goToDetail(field) {
				if (!this.showHealthCards) {
					uni.showToast({ title: this.healthPrimaryHint, icon: 'none' })
					return
				}
				let url = `/pages/detail/detail?userId=${this.currentUser}&field=${field}`
				if (this.selectedDeviceId) {
					url += `&deviceId=${this.selectedDeviceId}`
				}
				if (this.selectedDeviceName) {
					url += `&deviceName=${this.selectedDeviceName}`
				}
				uni.navigateTo({ url })
			},
			renderMarkdown(content) {
				if (!content) return ''
				
				// 简单的 Markdown 转 HTML 逻辑
				let html = content
					// 处理标题
					.replace(/^### (.*$)/gim, '<h3 style="font-size: 30rpx; font-weight: bold; margin: 20rpx 0 10rpx;">$1</h3>')
					.replace(/^## (.*$)/gim, '<h2 style="font-size: 34rpx; font-weight: bold; margin: 24rpx 0 12rpx;">$1</h2>')
					.replace(/^# (.*$)/gim, '<h1 style="font-size: 38rpx; font-weight: bold; margin: 28rpx 0 14rpx;">$1</h1>')
					// 处理粗体
					.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
					// 处理列表
					.replace(/^\* (.*$)/gim, '<div style="display: flex; margin-bottom: 8rpx;"><span style="margin-right: 10rpx;">•</span><span>$1</span></div>')
					.replace(/^- (.*$)/gim, '<div style="display: flex; margin-bottom: 8rpx;"><span style="margin-right: 10rpx;">•</span><span>$1</span></div>')
					// 处理换行
					.replace(/\n/gim, '<br />')
				
				return `<div style="line-height: 1.6; color: #333; font-size: 28rpx;">${html}</div>`
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		background: #f6f7fb;
		display: flex;
		flex-direction: column;
		padding-bottom: 130rpx;
	}

	.content {
		flex: 1;
		padding: 32rpx 48rpx 40rpx;
	}

	.user-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 48rpx;
		background-color: #F0F0F0;
	}

	.user-info {
		margin-left: 40rpx;
		display: flex;
		flex-direction: column;
	}

	.greeting-row {
		display: flex;
		align-items: center;
	}

	.greeting {
		font-size: 32rpx;
		color: #222;
		font-weight: 600;
	}

	.user-picker {
		display: flex;
		align-items: center;
		padding: 8rpx 16rpx;
		background-color: #F5F5F5;
		border-radius: 12rpx;
		margin-left: 16rpx;
	}

	.picker-text {
		font-size: 26rpx;
		color: #333333;
		margin-right: 6rpx;
	}

	.picker-icon {
		font-size: 22rpx;
		color: #999999;
	}

	.sub-info {
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #8F98A3;
	}

	.date {
		margin-top: 12rpx;
		font-size: 32rpx;
		font-weight: 700;
		color: #2E2E2E;
	}

	.tab-panel {
		margin-top: 32rpx;
	}

	.section-title {
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
		border-radius: 20rpx;
		padding: 24rpx;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
		position: relative;
		height: 200rpx;
	}

	.card-header-row { display: flex; align-items: center; justify-content: space-between; }
	.card-title { font-size: 28rpx; color: #333333; font-weight: 600; }
	.card-icon { height: 52rpx; width: 52rpx; }

	.card-value { position: absolute; left: 24rpx; bottom: 32rpx; display: flex; align-items: baseline; }
	.value-text { font-size: 68rpx; font-weight: 700; color: #111111; line-height: 1; }
	.unit-text { margin-left: 12rpx; font-size: 26rpx; color: #9AA1A9; line-height: 1; }
	
	.card-time {
		position: absolute;
		right: 24rpx;
		bottom: 32rpx;
		font-size: 24rpx;
		color: #9AA1A9;
	}

	.device-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.device-item {
		padding: 32rpx;
		border-radius: 20rpx;
		background: #fff;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.05);
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		border: 2rpx solid transparent;
	}

	.device-item.active {
		border-color: #37c189;
		box-shadow: 0 10rpx 24rpx rgba(55,193,137,0.15);
	}

	.device-main {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.device-main-row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.device-actions {
		display: flex;
		gap: 20rpx;
	}

	.device-action-btn {
		flex: 1;
		padding: 22rpx 0;
		text-align: center;
		border-radius: 999rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #fff;
	}

	.device-action-btn.success {
		background: linear-gradient(135deg, #40c78d, #1e8e5b);
		box-shadow: 0 8rpx 20rpx rgba(30, 142, 91, 0.2);
	}

	.device-action-btn.success.disabled {
		background: #c0c7cf;
		box-shadow: none;
		color: #fff;
		pointer-events: none;
	}

	.device-action-btn.danger {
		background: linear-gradient(135deg, #f36a6a, #dd4040);
		box-shadow: 0 8rpx 20rpx rgba(221, 64, 64, 0.25);
	}

	.empty-device {
		padding: 120rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.health-empty {
		padding: 80rpx 0;
	}

	.empty-image {
		width: 240rpx;
		height: 240rpx;
		margin-bottom: 32rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #8F98A3;
		margin-bottom: 32rpx;
	}

	.placeholder-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 48rpx 40rpx;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.placeholder-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #222;
	}

	.placeholder-sub {
		font-size: 26rpx;
		color: #8F98A3;
	}

	.primary-btn {
		min-width: 320rpx;
		padding: 24rpx 0;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #518dfc, #3c6ce6);
		color: #fff;
		font-size: 28rpx;
		font-weight: 600;
		text-align: center;
		box-shadow: 0 12rpx 30rpx rgba(60, 108, 230, 0.25);
		margin-top: 8rpx;
	}

	.primary-btn.outline {
		background: linear-gradient(135deg, #518dfc, #3c6ce6);
		color: #fff;
		border: none;
		box-shadow: 0 12rpx 30rpx rgba(60, 108, 230, 0.25);
	}

	.bottom-nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: 120rpx;
		background: #ffffff;
		box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.08);
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.nav-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #a4a4a4;
	}

	.nav-btn.active {
		color: #3c3c3c;
	}

	.nav-icon {
		width: 48rpx;
		height: 48rpx;
		margin-bottom: 6rpx;
	}

	.nav-text {
		font-size: 24rpx;
	}

	.modal-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.modal-card {
		width: 620rpx;
		background: #fff;
		border-radius: 28rpx;
		padding: 40rpx 36rpx;
		box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: 600;
		text-align: center;
		color: #222;
	}

	.modal-body {
		margin-top: 32rpx;
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.input-label {
		font-size: 26rpx;
		color: #666;
	}

	.input-field {
		height: 88rpx;
		background: #f5f5f5;
		border-radius: 16rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		color: #333;
	}

	.modal-actions {
		margin-top: 36rpx;
		display: flex;
		justify-content: flex-end;
		gap: 24rpx;
	}

	.action-btn {
		min-width: 160rpx;
		text-align: center;
		padding: 20rpx 0;
		border-radius: 999rpx;
		font-size: 28rpx;
		font-weight: 600;
	}

	.action-btn.ghost {
		background: #f1f2f5;
		color: #666;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #40c78d, #1e8e5b);
		color: #fff;
		box-shadow: 0 8rpx 24rpx rgba(30, 142, 91, 0.25);
	}

	.ai-report-title {
		margin-top: 40rpx;
	}

	.ai-report-card {
		background-color: #FFFFFF;
		border-radius: 20rpx;
		padding: 24rpx;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
		margin-bottom: 32rpx;
		min-height: 200rpx;
	}

	.ai-report-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.ai-badge {
		background: #f0f2f5;
		color: #666;
		font-size: 22rpx;
		padding: 4rpx 16rpx;
		border-radius: 8rpx;
		font-weight: 600;
	}

	.ai-time {
		font-size: 24rpx;
		color: #999;
	}

	.ai-report-content {
		word-break: break-all;
	}

	.ai-loading, .ai-empty {
		padding: 40rpx 0;
		text-align: center;
	}

	.loading-text, .empty-text {
		font-size: 26rpx;
		color: #999;
	}
</style>
