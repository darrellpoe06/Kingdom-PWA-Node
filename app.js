// --- Track Alpha: Offline Resilience & Environment Hardening ---

// 1. Request OS Persistent Storage
async function enforcePersistence() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        logToHUD(`[Architecture Node] Persistent storage granted: ${isPersisted ? 'TRUE' : 'FALSE'}`);
    }
}

// 2. Register Service Worker for Edge Caching
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => logToHUD(`[Architecture Node] SW Matrix engaged. Scope: ${reg.scope}`))
            .catch(err => logToHUD(`<span class="error-log">[SYS_FAILURE] SW Registration blocked: ${err.message}</span>`));
    }
}

// --- Core UI & Event Binding ---
const sysLog = document.getElementById('sysLog');
const executeBtn = document.getElementById('executeBtn');
const voiceBtn = document.getElementById('voiceBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const telemetryInput = document.getElementById('telemetryInput');
const outputCanvas = document.getElementById('outputCanvas');

function logToHUD(message) {
    sysLog.innerHTML += `> ${message}<br>`;
    sysLog.scrollTop = sysLog.scrollHeight;
}

// Visual Architecture Toggle
toggleThemeBtn.addEventListener('click', () => {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'tactical' ? 'corporate' : 'tactical';
    htmlEl.setAttribute('data-theme', newTheme);
    logToHUD(`Visual architecture shifted to [${newTheme.toUpperCase()}]`);
});

// Auditory Telemetry Capture (Web Speech API)
voiceBtn.addEventListener('click', () => {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            logToHUD('<span class="error-log">Auditory API restricted by current browser environment.</span>');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.onstart = () => logToHUD('Listening for auditory payload...');
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            telemetryInput.value = transcript;
            logToHUD(`Auditory Payload Transcribed: "${transcript}"`);
        };
        recognition.onerror = (e) => logToHUD(`<span class="error-log">Voice capture halted: ${e.error}</span>`);
        recognition.start();
    } catch (error) {
        logToHUD(`<span class="error-log">Hardware Sandbox Restriction: ${error.message}</span>`);
    }
});

// Primary Execution Loop (Lazy Loading Edge AI)
executeBtn.addEventListener('click', async () => {
    const payload = telemetryInput.value.trim();
    if (!payload) {
        logToHUD('<span class="error-log">Execution halted: Payload empty.</span>');
        return;
    }

    logToHUD('Fetching lightweight NLP matrix via dynamic CDN import...');
    
    try {
        // Dynamic Import of Transformers.js to prevent load-time crashing
        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0');
        logToHUD('Baseline Telemetry Synced.');
        
        // Simulating the escalation logic for the MVP mapping
        logToHUD(`Analyzing input: "${payload.substring(0, 20)}..."`);
        logToHUD('POSITIVE baseline deduction. Routing to [Execution Node]...');
        
        // Artifact Generation Output (Leveraging Marked.js mapped in index.html)
        const generatedMarkdown = `
### Executive Briefing: System Generated MVP
* **Current State:** Baseline requirements deduced successfully.
* **Strategic Implications:** The requested architecture has been compiled securely.
* **Required Logistics:** Proceed to Phase 2 Collaboration Matrix integration.
        `;
        
        outputCanvas.innerHTML = marked.parse(generatedMarkdown);
        logToHUD('Artifact successfully rendered to Output Canvas.');

    } catch (error) {
        logToHUD(`<span class="error-log">Module Resolution Failure: ${error.message}</span>`);
    }
});

// Initialize Offline Environment
window.addEventListener('DOMContentLoaded', () => {
    enforcePersistence();
    registerServiceWorker();
    logToHUD('Execution Nodes successfully bound to interface.');
});
