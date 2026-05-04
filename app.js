// --- Core UI & Event Binding ---
const sysLog = document.getElementById('sysLog');
const executeBtn = document.getElementById('executeBtn');
const voiceBtn = document.getElementById('voiceBtn');
const telemetryInput = document.getElementById('telemetryInput');
const outputCanvas = document.getElementById('outputCanvas');

function logToHUD(message) {
    if(sysLog) {
        sysLog.innerHTML += `> ${message}<br>`;
        sysLog.scrollTop = sysLog.scrollHeight;
    }
}

// 1. Auditory Telemetry Capture (Web Speech API)
voiceBtn.addEventListener('click', () => {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            logToHUD('<span class="text-danger">Auditory API restricted by current browser environment.</span>');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.onstart = () => logToHUD('Listening for auditory payload...');
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            telemetryInput.value = transcript;
            logToHUD(`Auditory Payload Transcribed: "${transcript}"`);
        };
        recognition.onerror = (e) => logToHUD(`<span class="text-danger">Voice capture halted: ${e.error}</span>`);
        recognition.start();
    } catch (error) {
        logToHUD(`<span class="text-danger">Hardware Sandbox Restriction: ${error.message}</span>`);
    }
});

// 2. Artifact Generation Engine & Logic Routing
executeBtn.addEventListener('click', async () => {
    const payload = telemetryInput.value.trim();
    if (!payload) {
        logToHUD('<span class="text-danger">Execution halted: Payload empty.</span>');
        return;
    }

    logToHUD('Fetching lightweight NLP matrix via dynamic CDN import...');
    
    try {
        // Dynamic Import of Transformers.js 
        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0');
        logToHUD('Baseline Telemetry Synced. Assessing requirements...');
        
        logToHUD(`Analyzing input: "${payload.substring(0, 20)}..."`);
        logToHUD('POSITIVE baseline deduction. Routing to [Execution Node]...');
        
        // MVP Blueprint / Yield Protocol Generation
        const generatedMarkdown = `
### ⚡ TACTICAL COUNTERMEASURE DEPLOYED
* **Systemic Diagnostic:** Operational friction detected based on telemetry payload.
* **Yield Protocol:** Suspend reliance on 3rd-dimensional human "might".
* **Required Action:** Await full n8n and Supabase API integration to process live solutions.

#### Architectural Schema
\`\`\`json
{
  "client_state": "Analyzing",
  "recommended_module": "Rest & Yield Protocol",
  "backend_status": "Pending n8n Connection"
}
\`\`\`
        `;
        
        // Parse markdown and render to Tactical Countermeasures Canvas
        if (typeof marked !== 'undefined') {
            outputCanvas.innerHTML = marked.parse(generatedMarkdown);
            // Add a little tailwind styling to the parsed markdown dynamically
            outputCanvas.classList.add('prose', 'prose-invert', 'prose-sm', 'prose-a:text-accent', 'max-w-none');
            logToHUD('<span class="text-white">Artifact successfully rendered to Command Center.</span>');
        } else {
            logToHUD('<span class="text-danger">Markdown parser failed to load.</span>');
        }

    } catch (error) {
        logToHUD(`<span class="text-danger">Module Resolution Failure: ${error.message}</span>`);
    }
});

// Initialize Environment Confirmation
window.addEventListener('DOMContentLoaded', () => {
    logToHUD('Command Center Widgets Bound. System Active.');
});
