// API基础地址 - 请根据实际情况修改
const API_BASE = 'http://localhost:3000';

// 获取用户列表
export function getUserList() {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${API_BASE}/api/users`,
			method: 'GET',
			timeout: 10000,
			success: (res) => {
				if (res.statusCode === 200 && res.data.status === 'success') {
					resolve(res.data.user_ids || []);
				} else {
					resolve([]);
				}
			},
			fail: (err) => {
				console.error('获取用户列表失败:', err);
				resolve([]);
			}
		});
	});
}

// 获取用户健康数据（单个字段）
export function getUserHealthData(userId, field, timeRange = '', tags = {}) {
	const requestBody = { user_id: userId };
	if (timeRange) requestBody.time_range = timeRange;
	requestBody.fields = field;
	if (Object.keys(tags).length > 0) {
		requestBody.tags = tags;
	}
	
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${API_BASE}/api/health/user`,
			method: 'POST',
			header: {
				'Content-Type': 'application/json'
			},
			data: requestBody,
			timeout: 10000,
			success: (res) => {
				if (res.statusCode === 200 && res.data.status === 'success') {
					resolve(res.data.user_data || []);
				} else {
					resolve([]);
				}
			},
			fail: (err) => {
				console.error(`获取${field}数据失败:`, err);
				resolve([]);
			}
		});
	});
}

// 获取设备选项
export function getDeviceOptions() {
	return new Promise((resolve) => {
		uni.request({
			url: `${API_BASE}/api/devices`,
			method: 'GET',
			timeout: 10000,
			success: (res) => {
				if (res.statusCode === 200 && res.data.status === 'success') {
					resolve({
						deviceIds: res.data.device_ids || [],
						deviceNames: res.data.device_names || []
					});
				} else {
					resolve({
						deviceIds: [],
						deviceNames: []
					});
				}
			},
			fail: (err) => {
				console.error('获取设备列表失败:', err);
				resolve({
					deviceIds: [],
					deviceNames: []
				});
			}
		});
	});
}

// 获取用户多个健康数据字段（分别请求）
export async function getUserHealthDataMultiple(userId, fields = ['heart_rate', 'temperature', 'blood_oxygen'], timeRange = '', tags = {}) {
	const results = {};
	const promises = fields.map((field) =>
		getUserHealthData(userId, field, timeRange, tags)
			.then((data) => ({ field, data }))
			.catch((error) => {
				console.error(`获取${field}数据失败:`, error);
				return { field, data: [] };
			})
	);

	const responses = await Promise.all(promises);

	responses.forEach(({ field, data }) => {
		if (Array.isArray(data) && data.length > 0) {
			const sortedData = [...data].sort((a, b) => {
				const timeA = a.time || a.timestamp || a.datetime || '';
				const timeB = b.time || b.timestamp || b.datetime || '';
				return new Date(timeB) - new Date(timeA);
			});

			results[field] = {
				value: sortedData[0].value,
				time: sortedData[0].time || sortedData[0].timestamp || sortedData[0].datetime,
				allData: data
			};
		} else {
			results[field] = null;
		}
	});

	return results;
}

// 获取用户健康数据历史（用于详情页图表）
export async function getUserHealthDataHistory(userId, field, timeRange = '-30d', tags = {}, limit = null) {
	try {
		const data = await getUserHealthData(userId, field, timeRange, tags);
		if (Array.isArray(data)) {
			const sortedData = [...data].sort((a, b) => {
				const timeA = a.time || a.timestamp || a.datetime || '';
				const timeB = b.time || b.timestamp || b.datetime || '';
				return new Date(timeA) - new Date(timeB);
			});
			
			if (typeof limit === 'number' && limit > 0) {
				return sortedData.slice(-limit);
			}
			
			return sortedData;
		}
		return [];
	} catch (error) {
		console.error(`获取${field}历史数据失败:`, error);
		return [];
	}
}

