const sysLog = document.getElementById('sysLog');
const executeBtn = document.getElementById('executeBtn');
const voiceBtn = document.getElementById('voiceBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const telemetryInput = document.getElementById('telemetryInput');
const outputCanvas = document.getElementById('outputCanvas');

let alignmentChart;
let flowChart;

function logToHUD(message) {
    if(sysLog) {
        sysLog.innerHTML += `> ${message}<br>`;
        sysLog.scrollTop = sysLog.scrollHeight;
    }
}

themeToggleBtn.addEventListener('click', () => {
    const htmlEl = document.documentElement;
    htmlEl.classList.toggle('dark');
    initCharts();
});

function initCharts() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeStr = isDark ? 'dark' : 'light';
    
    if(alignmentChart) alignmentChart.dispose();
    if(flowChart) flowChart.dispose();

    alignmentChart = echarts.init(document.getElementById('alignmentChart'), themeStr);
    flowChart = echarts.init(document.getElementById('flowChart'), themeStr);

    // Graphic Design Enhancement: Linear Gradients for the Donut Chart
    const outerGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: isDark ? '#00f2fe' : '#0052cc' },
        { offset: 1, color: isDark ? '#4facfe' : '#003d99' }
    ]);
    
    const innerGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: isDark ? '#10b981' : '#16a34a' },
        { offset: 1, color: isDark ? '#047857' : '#15803d' }
    ]);

    const alignmentOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [
            {
                name: 'Liquid Capital (Spirit)',
                type: 'pie',
                radius: ['60%', '75%'], // Thicker rings like the mockup
                itemStyle: { borderColor: isDark ? '#050810' : '#fff', borderWidth: 4 },
                label: { show: false },
                data: [
                    { value: 85, name: 'Active Yield', itemStyle: { color: outerGradient } },
                    { value: 15, name: 'System Noise', itemStyle: { color: isDark ? '#1f2937' : '#e5e7eb' } }
                ]
            },
            {
                name: 'Property Equity (Might)',
                type: 'pie',
                radius: ['40%', '55%'],
                itemStyle: { borderColor: isDark ? '#050810' : '#fff', borderWidth: 4 },
                label: { show: false },
                data: [
                    { value: 65, name: 'Mitigated Risk', itemStyle: { color: innerGradient } },
                    { value: 35, name: 'Flesh Operations', itemStyle: { color: isDark ? '#ef4444' : '#dc2626' } }
                ]
            }
        ]
    };

    // Graphic Design Enhancement: Glowing Line Charts with Area Fills
    const flowOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: isDark ? 'rgba(17,24,39,0.9)' : '#fff', borderColor: '#00f2fe' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { 
            type: 'category', 
            boundaryGap: false, 
            data: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
            axisLine: { lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' } }
        },
        yAxis: { 
            type: 'value',
            splitLine: { lineStyle: { color: isDark ? '#1f2937' : '#e5e7eb', type: 'dashed' } }
        },
        series: [
            {
                name: 'Project Bids Cash Velocity',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 3, color: '#00f2fe', shadowColor: 'rgba(0,242,254,0.5)', shadowBlur: 10 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0,242,254,0.4)' },
                        { offset: 1, color: 'rgba(0,242,254,0.0)' }
                    ])
                },
                data: [100, 250, 400, 550, 700, 850, 1000]
            },
            {
                name: 'High-Stakes Contract',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 3, color: '#10b981', shadowColor: 'rgba(16,185,129,0.5)', shadowBlur: 10 },
                data: [100, 200, 250, 400, 450, 600, 750]
            }
        ]
    };

    alignmentChart.setOption(alignmentOption);
    flowChart.setOption(flowOption);
}

window.addEventListener('resize', () => {
    if(alignmentChart) alignmentChart.resize();
    if(flowChart) flowChart.resize();
});

voiceBtn.addEventListener('click', () => {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return logToHUD('<span class="text-red-500">API Restricted.</span>');
        const recognition = new SpeechRecognition();
        recognition.onstart = () => logToHUD('Listening for auditory payload...');
        recognition.onresult = (e) => {
            telemetryInput.value = e.results[0][0].transcript;
            logToHUD('Auditory Payload Transcribed.');
        };
        recognition.start();
    } catch (err) {
        logToHUD(`<span class="text-red-500">Error: ${err.message}</span>`);
    }
});

executeBtn.addEventListener('click', () => {
    const payload = telemetryInput.value.trim();
    if (!payload) return logToHUD('<span class="text-red-500">Execution halted: Payload empty.</span>');

    logToHUD('Evaluating Operational Parameters...');
    executeBtn.innerHTML = "PROCESSING...";
    
    setTimeout(() => {
        const generatedMarkdown = `
### ⚡ YIELD PROTOCOL DEPLOYED
* **Diagnostic:** 3rd-Dimensional operational friction detected.
* **Target Action:** Suspend reliance on human "might" or capital striving.
* **Documentation:** Zechariah 4:6 | "Not by might, nor by power, but by my spirit."
* **Status:** Awaiting integration of Supabase ledger to log lifecycle receipt.
        `;
        if (typeof marked !== 'undefined') {
            outputCanvas.innerHTML = marked.parse(generatedMarkdown);
            outputCanvas.classList.add('prose', 'prose-sm', 'dark:prose-invert', 'max-w-none');
            logToHUD('<span class="text-[#00f2fe]">Artifact successfully rendered.</span>');
            executeBtn.innerHTML = "EXECUTE";
        }
    }, 800);
});

window.addEventListener('DOMContentLoaded', () => {
    logToHUD('Command Center Widgets Bound. System Active.');
    initCharts();
});
