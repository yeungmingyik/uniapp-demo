// API基础地址 - 请根据实际情况修改
const API_BASE = 'https://boshangtech.xyz';

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
export function getUserHealthData(userId, field, timeRange = '', tags = {}, aiReport = false) {
	const requestBody = { user_id: userId };
	if (timeRange) requestBody.time_range = timeRange;
	requestBody.fields = field;
	// 确保 ai_report 字段被包含在请求体中
	if (aiReport) {
		requestBody.ai_report = true;
	}
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
			timeout: 20000, // AI 报告可能需要更长时间
			success: (res) => {
				if (res.statusCode === 200 && res.data.status === 'success') {
					if (aiReport) {
						// 根据用户反馈，ai_report 字段在 user_data 中
						resolve({
							data: res.data.user_data || [],
							aiReport: res.data.user_data?.ai_report || res.data.ai_report || ''
						});
					} else {
						resolve(res.data.user_data || []);
					}
				} else {
					resolve(aiReport ? { data: [], aiReport: '' } : []);
				}
			},
			fail: (err) => {
				console.error(`获取${field}数据失败:`, err);
				resolve(aiReport ? { data: [], aiReport: '' } : []);
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
export async function getUserHealthDataMultiple(userId, fields = ['heart_rate', 'temperature', 'blood_oxygen'], timeRange = '', tags = {}, aiReport = false) {
	const results = {
		aiReport: ''
	};
	
	// 如果需要 AI 报告，我们只在第一个字段请求中带上 ai_report 参数，避免重复生成
	const promises = fields.map((field, index) =>
		getUserHealthData(userId, field, timeRange, tags, aiReport && index === 0)
			.then((res) => {
				if (aiReport && index === 0) {
					results.aiReport = res.aiReport;
					return { field, data: res.data };
				}
				return { field, data: res };
			})
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

