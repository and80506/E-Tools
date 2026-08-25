const secid = '0.000333';
const numCode = '000333';
fetch(`http://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/xjllbDateAjaxNew?companyType=4&reportDateType=0&code=SZ000333`)
.then(r => r.json())
.then(datesJson => {
    const latestDateStr = datesJson.data[0].REPORT_DATE;
    const latestDateObj = new Date(latestDateStr);
    const latestYear = latestDateObj.getFullYear();
    const isQ4 = latestDateStr.includes('-12-31');
    const lastYearAnnualStr = `${latestYear - 1}-12-31 00:00:00`;
    const lastYearSamePeriodStr = `${latestYear - 1}-${latestDateStr.substring(5)}`;
    let requiredDates = [latestDateStr];
    if (!isQ4) {
      requiredDates.push(lastYearAnnualStr);
      requiredDates.push(lastYearSamePeriodStr);
    }
    const datesParam = requiredDates.map(d => d.split(' ')[0]).join('%2C');
    const dataUrl = `http://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/xjllbAjaxNew?companyType=4&reportDateType=0&reportType=1&dates=${datesParam}&code=SZ000333`;
    fetch(dataUrl).then(r=>r.json()).then(dataJson => {
        const dataMap = {};
        dataJson.data.forEach(item => {
            dataMap[item.REPORT_DATE] = {
                operate: parseFloat(item.NETCASH_OPERATE || 0),
                capex: parseFloat(item.CONSTRUCT_LONG_ASSET || 0)
            };
        });
        let opSum = 0;
        let capexSum = 0;
        if (isQ4) {
            opSum = dataMap[latestDateStr]?.operate || 0;
            capexSum = dataMap[latestDateStr]?.capex || 0;
        } else {
            const current = dataMap[latestDateStr] || { operate: 0, capex: 0 };
            const lastAnnual = dataMap[lastYearAnnualStr] || { operate: 0, capex: 0 };
            const lastSame = dataMap[lastYearSamePeriodStr] || { operate: 0, capex: 0 };
            opSum = current.operate + lastAnnual.operate - lastSame.operate;
            capexSum = current.capex + lastAnnual.capex - lastSame.capex;
        }
        console.log("opSum:", opSum);
    });
});
