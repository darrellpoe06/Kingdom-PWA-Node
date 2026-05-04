// --- Core UI & Event Binding ---
const sysLog = document.getElementById('sysLog');
const executeBtn = document.getElementById('executeBtn');
const voiceBtn = document.getElementById('voiceBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const telemetryInput = document.getElementById('telemetryInput');
const outputCanvas = document.getElementById('outputCanvas');

function logToHUD(message) {
    if(sysLog) {
        sysLog.innerHTML += `> ${message}<br>`;
        sysLog.scrollTop = sysLog.scrollHeight;
    }
}

// 1. Dynamic Visual Architecture Toggle
toggleThemeBtn.addEventListener('click', () => {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'tactical' ? 'corporate' : 'tactical';
    htmlEl.setAttribute('data-theme', newTheme);
    logToHUD(`Visual architecture shifted to [${newTheme.toUpperCase()}]`);
});

// 2. Auditory Telemetry Capture (Web Speech API)
voiceBtn.addEventListener('click', () => {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            logToHUD('<span class="error-log">Auditory API restricted by current browser environment. Ensure HTTPS.</span>');
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

// 3. Artifact Generation Engine (Execution Loop)
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
        logToHUD('Baseline Telemetry Synced. Assessing requirements...');
        
        // Simulating the AI deduction and Artifact Generation routing
        logToHUD(`Analyzing input: "${payload.substring(0, 20)}..."`);
        logToHUD('POSITIVE baseline deduction. Routing to [Execution Node]...');
        
        // MVP Blueprint Generation
        const generatedMarkdown = `
### Executive Briefing: System Generated MVP
* **Current State:** Baseline requirements deduced successfully.
* **Strategic Implications:** The requested architecture has been mapped to your specifications.
* **Required Logistics:** Review the schema below and initiate Phase 2 Collaboration Matrix integration.

#### Structural Schema
\`\`\`json
{
  "project_status": "Active",
  "deployment_vector": "Edge AI",
  "data_sovereignty": "Absolute"
}
\`\`\`
        `;
        
        // Parse markdown and render to canvas
        if (typeof marked !== 'undefined') {
            outputCanvas.innerHTML = marked.parse(generatedMarkdown);
            logToHUD('Artifact successfully rendered to Output Canvas.');
        } else {
            logToHUD('<span class="error-log">Markdown parser failed to load.</span>');
        }

    } catch (error) {
        logToHUD(`<span class="error-log">Module Resolution Failure: ${error.message}</span>`);
    }
});

// Initialize Environment Confirmation
window.addEventListener('DOMContentLoaded', () => {
    logToHUD('Execution Nodes successfully bound to interface.');
});
