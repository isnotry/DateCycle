// 使用本地all.json数据实现公历农历节气转换

// 全局变量存储日历数据
let calendarData = [];

// 日期索引：key = year*10000 + month*100 + day，值是 all.json 里对应的条目
// 建索引之前每次换算都要线性扫 73,048 条，生成几年的对照表要卡十几秒；索引后是 O(1)
let calendarIndex = new Map();

// 假期数据缓存：year → Map(日期字符串 → 「名称（休/班）」)
let holidayIndex = {};

// 生成索引用的日期键
function dateKey(year, month, day) {
    return year * 10000 + month * 100 + day;
}

// 建索引：只在数据加载完成后跑一次
function buildCalendarIndex() {
    calendarIndex = new Map();
    for (const item of calendarData) {
        calendarIndex.set(
            dateKey(item.gregorian.year, item.gregorian.month, item.gregorian.date),
            item
        );
    }
}

// 按公历年月日取条目（索引查不到才退回线性扫描，兼容数据缺天的情况）
function findEntry(year, month, day) {
    const hit = calendarIndex.get(dateKey(year, month, day));
    if (hit) {
        return hit;
    }
    return calendarData.find(item =>
        item.gregorian.year === year &&
        item.gregorian.month === month &&
        item.gregorian.date === day
    );
}

// 加载日历数据
function loadCalendarData() {
    return fetch('database/all.json')
        .then(response => response.json())
        .then(data => {
            calendarData = data;
            buildCalendarIndex();
            console.log('Calendar data loaded successfully:', calendarData.length, 'entries');
        })
        .catch(error => {
            console.error('Failed to load calendar data:', error);
        });
}

// 初始化时加载数据
loadCalendarData();

// 加载某一年的假期并建索引（date → 「名称（休/班）」）
// 关键：年份文件不存在（holidays/ 只到 2027 年）时也要落一个空 Map，
// 否则每个日期都会再 fetch 一次 404 —— 默认范围 2025~2030 会因此发上千次请求，线上直接卡死
async function ensureHolidayYear(year) {
    if (holidayIndex[year]) {
        return holidayIndex[year];
    }

    let days = [];
    try {
        const response = await fetch(`database/holidays/${year}.json`);
        if (response.ok) {
            const data = await response.json();
            days = (data && data.days) || [];
        }
    } catch (error) {
        console.error(`Failed to load holiday data for ${year}:`, error);
    }

    const map = new Map();
    for (const item of days) {
        map.set(item.date, `${item.name}${item.isOffDay ? '（休）' : '（班）'}`);
    }
    holidayIndex[year] = map;
    return map;
}

// 生成前把范围内涉及到的年份一次性补齐，之后每一行就是同步查表
async function preloadHolidays(startDate, endDate) {
    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
        await ensureHolidayYear(year);
    }
}

// 取某天的假期文案（同步，索引查不到就是没有）
function getChineseHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    const map = holidayIndex[year];
    return map ? (map.get(dateStr) || "") : "";
}

// 公历转农历函数
function solarToLunar(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    try {
        // 查找对应日期的数据
        const entry = findEntry(year, month, day);
        
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
        const entry = findEntry(year, month, day);
        
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
    // 先把范围内涉及的年份假期补齐（每年最多一次请求，缺年份也不重复发）
    await preloadHolidays(startDate, endDate);

    // 让「处理中，请稍候...」先渲染出来，再做同步的建表（大范围时不会白屏无反馈）
    await new Promise(resolve => setTimeout(resolve, 0));

    // 清空表格
    tableBody.innerHTML = '';
    
    // 生成日期范围
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const hideWeekday = document.getElementById('hideWeekday').checked;
    // 先在内存里攒好再一次性插入，避免逐行 append 反复触发重排
    const fragment = document.createDocumentFragment();
    
    // 按顺序处理日期
    for (const date of dates) {
        const solarDate = date.toISOString().split('T')[0];
        const lunarDate = solarToLunar(date);
        const weekday = getWeekday(date);
        const solarTerm = getSolarTerm(date);
        const chineseHoliday = getChineseHoliday(date);
        
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
        fragment.appendChild(row);
    }

    tableBody.appendChild(fragment);
    
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
    // 与生成表格同一套路：先把涉及年份的假期补齐，再同步拼字符串
    await preloadHolidays(startDate, endDate);

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
    const lines = [];
    for (const date of dates) {
        const solarDate = date.toISOString().split('T')[0];
        const lunarDate = solarToLunar(date);
        const weekday = getWeekday(date);
        const solarTerm = getSolarTerm(date);
        const chineseHoliday = getChineseHoliday(date);
        
        if (hideWeekday) {
            lines.push(`${solarDate},${lunarDate},${solarTerm},${chineseHoliday}`);
        } else {
            lines.push(`${solarDate},${lunarDate},${weekday},${solarTerm},${chineseHoliday}`);
        }
    }
    csvContent += lines.join('\n') + '\n';
    
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