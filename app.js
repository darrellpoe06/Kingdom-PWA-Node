// --- Core UI Variables ---
const sysLog = document.getElementById('sysLog');
const executeBtn = document.getElementById('executeBtn');
const voiceBtn = document.getElementById('voiceBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const telemetryInput = document.getElementById('telemetryInput');
const outputCanvas = document.getElementById('outputCanvas');

// Chart Instances
let alignmentChart;
let flowChart;

function logToHUD(message) {
    if(sysLog) {
        sysLog.innerHTML += `> ${message}<br>`;
        sysLog.scrollTop = sysLog.scrollHeight;
    }
}

// --- Light / Dark Mode Global Toggle ---
// This checks the HTML class and flips it, then forcefully re-renders the ECharts to match the new color scheme.
themeToggleBtn.addEventListener('click', () => {
    const htmlEl = document.documentElement;
    htmlEl.classList.toggle('dark');
    
    const isDark = htmlEl.classList.contains('dark');
    logToHUD(`Global UI shifted to [${isDark ? 'TACTICAL DARK' : 'CORPORATE LIGHT'}]`);
    
    // Re-initialize charts to match the new theme
    initCharts();
});

// --- ECharts Data Visualization Engine ---
function initCharts() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeStr = isDark ? 'dark' : 'light';
    
    // Dispose old instances if they exist to prevent memory leaks on toggle
    if(alignmentChart) alignmentChart.dispose();
    if(flowChart) flowChart.dispose();

    alignmentChart = echarts.init(document.getElementById('alignmentChart'), themeStr);
    flowChart = echarts.init(document.getElementById('flowChart'), themeStr);

    // Widget 2: Concentric Radial Donut (Alignment vs Friction)
    const alignmentOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [
            {
                name: 'Operational Uptime (Spirit)',
                type: 'pie',
                radius: ['55%', '70%'],
                itemStyle: { borderColor: isDark ? '#111827' : '#fff', borderWidth: 2 },
                label: { show: false },
                data: [
                    { value: 85, name: 'Active Yield', itemStyle: { color: isDark ? '#00f2fe' : '#0052cc' } },
                    { value: 15, name: 'System Noise', itemStyle: { color: isDark ? '#374151' : '#e5e7eb' } }
                ]
            },
            {
                name: 'Systemic Friction (Might/Power)',
                type: 'pie',
                radius: ['35%', '50%'],
                itemStyle: { borderColor: isDark ? '#111827' : '#fff', borderWidth: 2 },
                label: { show: false },
                data: [
                    { value: 30, name: 'Flesh Operations', itemStyle: { color: isDark ? '#ef4444' : '#dc2626' } },
                    { value: 70, name: 'Mitigated Risk', itemStyle: { color: isDark ? '#374151' : '#e5e7eb' } }
                ]
            }
        ]
    };

    // Widget 4: Flow Line Graph (Interventions over time)
    const flowOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { 
            type: 'category', 
            boundaryGap: false, 
            data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] 
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Tactical Interventions',
                type: 'line',
                smooth: true,
                lineStyle: { width: 3, color: '#10b981' },
                data: [12, 18, 14, 25]
            },
            {
                name: 'Operational Stress',
                type: 'line',
                smooth: true,
                lineStyle: { width: 3, color: '#ef4444' },
                data: [20, 15, 22, 10]
            }
        ]
    };

    alignmentChart.setOption(alignmentOption);
    flowChart.setOption(flowOption);
}

// Window resize handler to keep charts responsive on mobile
window.addEventListener('resize', () => {
    if(alignmentChart) alignmentChart.resize();
    if(flowChart) flowChart.resize();
});

// --- Multimodal Intake & Artifact Execution ---
voiceBtn.addEventListener('click', () => {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            logToHUD('<span class="text-red-500">Auditory API restricted by current browser environment.</span>');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.onstart = () => logToHUD('Listening for auditory payload...');
        recognition.onresult = (event) => {
            telemetryInput.value = event.results[0][0].transcript;
            logToHUD('Auditory Payload Transcribed.');
        };
        recognition.start();
    } catch (error) {
        logToHUD(`<span class="text-red-500">Hardware Sandbox Restriction: ${error.message}</span>`);
    }
});

executeBtn.addEventListener('click', async () => {
    const payload = telemetryInput.value.trim();
    if (!payload) {
        logToHUD('<span class="text-red-500">Execution halted: Payload empty.</span>');
        return;
    }

    logToHUD('Baseline Telemetry Synced. Assessing requirements...');
    
    // Simulate n8n / Backend Processing
    setTimeout(() => {
        const generatedMarkdown = `
### ⚡ TACTICAL COUNTERMEASURE: YIELD PROTOCOL
* **Diagnostic:** 3rd-Dimensional operational friction detected.
* **Target Action:** Suspend reliance on human "might" or capital striving.
* **Documentation:** Zechariah 4:6 | "Not by might, nor by power, but by my spirit."
* **Status:** Awaiting integration of Supabase ledger to log lifecycle receipt.
        `;
        
        if (typeof marked !== 'undefined') {
            outputCanvas.innerHTML = marked.parse(generatedMarkdown);
            outputCanvas.classList.add('prose', 'prose-sm', 'dark:prose-invert', 'max-w-none');
            logToHUD('<span class="text-green-500">Artifact successfully rendered to Tactical Countermeasures.</span>');
        }
    }, 800); // Simulated execution delay
});

// Initialize Environment on Load
window.addEventListener('DOMContentLoaded', () => {
    logToHUD('Command Center Widgets Bound. System Active.');
    initCharts(); // Boot up the ECharts Engine
});
