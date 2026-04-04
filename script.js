// 使用本地all.json数据实现公历农历节气转换

// 全局变量存储日历数据
let calendarData = [];

// 假期数据缓存
let holidayData = {};

// 加载日历数据
function loadCalendarData() {
    return fetch('database/all.json')
        .then(response => response.json())
        .then(data => {
            calendarData = data;
            console.log('Calendar data loaded successfully:', calendarData.length, 'entries');
        })
        .catch(error => {
            console.error('Failed to load calendar data:', error);
        });
}

// 初始化时加载数据
loadCalendarData();

// 获取中国假期
async function getChineseHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    try {
        // 检查假期数据是否已缓存
        if (!holidayData[year]) {
            // 加载对应年份的假期数据
            try {
                const response = await fetch(`database/holidays/${year}.json`);
                if (response.ok) {
                    const data = await response.json();
                    holidayData[year] = data;
                }
            } catch (error) {
                console.error(`Failed to load holiday data for ${year}:`, error);
                holidayData[year] = { days: [] };
            }
        }
        
        // 查找对应日期的假期
        if (holidayData[year] && holidayData[year].days) {
            const holiday = holidayData[year].days.find(day => day.date === dateStr);
            if (holiday) {
                if (holiday.isOffDay) {
                    return `${holiday.name}（休）`;
                } else {
                    return `${holiday.name}（班）`;
                }
            }
        }
        
        return "";
    } catch (error) {
        console.error('Chinese holiday calculation error:', error);
        return "";
    }
}

// 公历转农历函数
function solarToLunar(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    try {
        // 查找对应日期的数据
        const entry = calendarData.find(item => 
            item.gregorian.year === year && 
            item.gregorian.month === month && 
            item.gregorian.date === day
        );
        
        if (entry) {
            // 检查是否隐藏农历年份
            const hideLunarYear = document.getElementById('hideLunarYear').checked;
            let lunarMonth = entry.lunar.month;
            // 将"閏"改为"闰"
            lunarMonth = lunarMonth.replace('閏', '闰');
            
            if (hideLunarYear) {
                return `${lunarMonth}${entry.lunar.date}`;
            } else {
                return `${entry.lunar.year}年${lunarMonth}${entry.lunar.date}`;
            }
        } else {
            return "未找到数据";
        }
    } catch (error) {
        console.error('Solar to lunar conversion error:', error);
        return "转换失败";
    }
}

// 计算节气函数
function getSolarTerm(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    try {
        // 查找对应日期的数据
        const entry = calendarData.find(item => 
            item.gregorian.year === year && 
            item.gregorian.month === month && 
            item.gregorian.date === day
        );
        
        if (entry && entry.solarTerm) {
            // 将繁体字节气转换为简体字
            let solarTerm = entry.solarTerm;
            const traditionalToSimplified = {
                '處暑': '处暑',
                '驚蟄': '惊蛰',
                '穀雨': '谷雨',
                '小滿': '小满',
                '芒種': '芒种'
            };
            
            if (traditionalToSimplified[solarTerm]) {
                solarTerm = traditionalToSimplified[solarTerm];
            }
            
            return solarTerm;
        } else {
            return "";
        }
    } catch (error) {
        console.error('Solar term calculation error:', error);
        return "";
    }
}

// 获取星期函数
function getWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
}

// 生成对照表
function generateTable() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const tableBody = document.getElementById('tableBody');
    const loading = document.getElementById('loading');
    const resultDiv = document.querySelector('.result');
    const hideWeekday = document.getElementById('hideWeekday').checked;
    
    // 显示结果区域
    resultDiv.style.display = 'block';
    
    // 更新表头
    const tableHead = document.querySelector('#resultTable thead tr');
    if (hideWeekday) {
        tableHead.innerHTML = `
            <th>公历日期</th>
            <th>农历日期</th>
            <th>节气</th>
            <th>中国假期</th>
        `;
    } else {
        tableHead.innerHTML = `
            <th>公历日期</th>
            <th>农历日期</th>
            <th>星期</th>
            <th>节气</th>
            <th>中国假期</th>
        `;
    }
    
    // 清空表格
    tableBody.innerHTML = '';
    loading.style.display = 'block';
    
    // 确保数据加载完成
    if (calendarData.length === 0) {
        loadCalendarData().then(() => {
            processGenerateTable(startDate, endDate, tableBody, loading);
        });
    } else {
        processGenerateTable(startDate, endDate, tableBody, loading);
    }
}

// 处理生成表格的逻辑
async function processGenerateTable(startDate, endDate, tableBody, loading) {
    // 清空表格
    tableBody.innerHTML = '';
    
    // 生成日期范围
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 按顺序处理日期
    for (const date of dates) {
        const solarDate = date.toISOString().split('T')[0];
        const lunarDate = solarToLunar(date);
        const weekday = getWeekday(date);
        const solarTerm = getSolarTerm(date);
        const chineseHoliday = await getChineseHoliday(date);
        const hideWeekday = document.getElementById('hideWeekday').checked;
        
        // 添加行
        const row = document.createElement('tr');
        if (hideWeekday) {
            row.innerHTML = `
                <td>${solarDate}</td>
                <td>${lunarDate}</td>
                <td>${solarTerm}</td>
                <td>${chineseHoliday}</td>
            `;
        } else {
            row.innerHTML = `
                <td>${solarDate}</td>
                <td>${lunarDate}</td>
                <td>${weekday}</td>
                <td>${solarTerm}</td>
                <td>${chineseHoliday}</td>
            `;
        }
        tableBody.appendChild(row);
    }
    
    loading.style.display = 'none';
}

// 下载CSV
function downloadCSV() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const loading = document.getElementById('loading');
    const resultDiv = document.querySelector('.result');
    
    // 显示结果区域
    resultDiv.style.display = 'block';
    loading.style.display = 'block';
    
    // 确保数据加载完成
    if (calendarData.length === 0) {
        loadCalendarData().then(() => {
            processDownloadCSV(startDate, endDate, loading);
        });
    } else {
        processDownloadCSV(startDate, endDate, loading);
    }
}

// 处理下载CSV的逻辑
async function processDownloadCSV(startDate, endDate, loading) {
    const hideWeekday = document.getElementById('hideWeekday').checked;
    // 生成CSV内容
    let csvContent = hideWeekday ? "公历日期,农历日期,节气,中国假期\n" : "公历日期,农历日期,星期,节气,中国假期\n";
    
    // 生成日期范围
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 按顺序处理日期
    for (const date of dates) {
        const solarDate = date.toISOString().split('T')[0];
        const lunarDate = solarToLunar(date);
        const weekday = getWeekday(date);
        const solarTerm = getSolarTerm(date);
        const chineseHoliday = await getChineseHoliday(date);
        
        if (hideWeekday) {
            csvContent += `${solarDate},${lunarDate},${solarTerm},${chineseHoliday}\n`;
        } else {
            csvContent += `${solarDate},${lunarDate},${weekday},${solarTerm},${chineseHoliday}\n`;
        }
    }
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `公历农历节气假期对照表_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    loading.style.display = 'none';
}