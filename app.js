const uiLog = document.getElementById('systemLog');
const uiStatus = document.getElementById('statusIndicator');
const intakeInput = document.getElementById('intakeInput');

// ==========================================
// CORE TELEMETRY MATRIX (DYNAMIC IMPORTS)
// ==========================================
class TelemetryRoutingMatrix {
    constructor() {
        this.lightweightClassifier = null;
        this.robustEngine = null;
        this.escalationThreshold = 0.65; 
    }

    logToHUD(message) {
        console.log(message);
        uiLog.textContent += `\n> ${message}`;
        uiLog.scrollTop = uiLog.scrollHeight;
    }

    updateStatus(status) {
        uiStatus.textContent = status;
    }

    async initializeBaseline() {
        try {
            this.updateStatus("Initializing Baseline Telemetry...");
            this.logToHUD("Fetching lightweight NLP matrix via dynamic CDN import...");
            
            // LAZY LOADING: Only imports when called, preventing mobile load crashes
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
            env.allowLocalModels = false; // Security Protocol

            this.lightweightClassifier = await pipeline(
                'text-classification', 
                'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
            );
            this.logToHUD("Baseline Telemetry Synced.");
            return true;
        } catch (error) {
            this.logToHUD(`Baseline Initialization Failure: ${error.message}`);
            return false;
        }
    }

    async initializeEscalation() {
        if (!this.robustEngine) {
            this.updateStatus("Booting Robust Architecture...");
            this.logToHUD("Systemic Complexity Detected. Engaging WebGPU...");
            
            try {
                if (!navigator.gpu) throw new Error("WebGPU not supported on this mobile architecture.");

                // LAZY LOADING: Robust Engine
                const { CreateWebWorkerMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');

                this.robustEngine = await CreateWebWorkerMLCEngine(
                    new Worker(new URL('./llm-worker.js', import.meta.url), { type: 'module' }),
                    'Llama-3-8B-Instruct-q4f32_1-MLC',
                    { initProgressCallback: (progress) => this.logToHUD(progress.text) }
                );
                this.logToHUD("Robust Architecture Synced.");
            } catch (error) {
                this.logToHUD(`Hardware Fallback Triggered: ${error.message}.`);
                return false;
            }
        }
        return true;
    }

    async processIntake(userInput) {
        try {
            this.logToHUD("Processing payload...");
            this.updateStatus("Analyzing...");

            if (!this.lightweightClassifier) {
                const initialized = await this.initializeBaseline();
                if (!initialized) throw new Error("Failed to construct semantic architecture.");
            }

            const baselineResult = await this.lightweightClassifier(userInput);
            const classification = baselineResult[0];

            this.logToHUD(`Baseline Deduction: ${classification.label} (Confidence: ${(classification.score * 100).toFixed(2)}%)`);

            if (classification.score >= this.escalationThreshold && classification.label === "POSITIVE") {
                this.updateStatus("Optimal Alignment Confirmed.");
                this.logToHUD("Routing to: [Execution Node]");
            } else {
                this.updateStatus("Escalating to Advanced Analysis...");
                this.logToHUD("Systemic friction detected. Requesting advanced context...");
                
                const canEscalate = await this.initializeEscalation();
                if (canEscalate) {
                    const advancedContext = await this.robustEngine.chat.completions.create({
                        messages: [
                            { role: "system", content: "You are an elite enterprise architect. Deduce the operational friction." },
                            { role: "user", content: userInput }
                        ]
                    });
                    this.updateStatus("Strategic Synthesis Complete.");
                    this.logToHUD(`Action Output:\n${advancedContext.choices[0].message.content}`);
                } else {
                    this.updateStatus("Execution Halted.");
                    this.logToHUD("Hardware constraints prevented escalation. Manual intervention required.");
                }
            }
        } catch (error) {
            this.updateStatus("Systemic Failure.");
            this.logToHUD(`Critical Exception Encountered: ${error.message}`);
        }
    }
}

// ==========================================
// EVENT BINDINGS & EXECUTION
// ==========================================
const systemHUD = new TelemetryRoutingMatrix();

// 1. Primary Execution Node (Text)
document.getElementById('processBtn').addEventListener('click', async (e) => {
    e.preventDefault(); 
    const input = intakeInput.value;
    if (!input.trim()) {
        systemHUD.logToHUD("Error: Please provide operational requirements before executing.");
        return;
    }
    document.getElementById('processBtn').disabled = true;
    await systemHUD.processIntake(input);
    document.getElementById('processBtn').disabled = false;
});

// 2. Visual Architecture Toggle Logic
document.getElementById('themeToggleBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeToggleBtn');
    
    if (root.hasAttribute('data-theme')) {
        root.removeAttribute('data-theme');
        themeBtn.textContent = "Engage High-Legibility Mode";
        systemHUD.logToHUD("Tactical Mode Engaged.");
    } else {
        root.setAttribute('data-theme', 'light');
        themeBtn.textContent = "Revert to Tactical Mode";
        systemHUD.logToHUD("High-Legibility Mode Engaged.");
    }
});

// 3. Auditory Telemetry Capture (Web Speech API)
const voiceBtn = document.getElementById('voiceBtn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
            recognition.start();
            systemHUD.updateStatus("Listening for Auditory Telemetry...");
            voiceBtn.textContent = "🔴 Recording...";
            voiceBtn.style.color = "#ff5555";
            voiceBtn.style.borderColor = "#ff5555";
        } catch (error) {
            systemHUD.logToHUD(`Microphone Exception: ${error.message}. Server must run on HTTPS or pure localhost.`);
            resetVoiceBtn();
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        intakeInput.value += (intakeInput.value ? ' ' : '') + transcript;
        systemHUD.logToHUD(`Auditory Payload Transcribed: "${transcript}"`);
        resetVoiceBtn();
    };

    recognition.onerror = (event) => {
        systemHUD.logToHUD(`Auditory Intake Error: ${event.error}. Verify browser permission matrices.`);
        resetVoiceBtn();
    };

    recognition.onend = () => resetVoiceBtn();

    function resetVoiceBtn() {
        voiceBtn.textContent = "🎤 Engage Voice";
        voiceBtn.style.color = "var(--accent-primary)";
        voiceBtn.style.borderColor = "var(--accent-primary)";
    }
} else {
    voiceBtn.disabled = true;
    voiceBtn.textContent = "🎤 Voice (Unsupported)";
    systemHUD.logToHUD("Warning: Web Speech API is structurally unsupported on this mobile browser.");
}

// Initial binding confirmation
systemHUD.logToHUD("Execution Nodes successfully bound to interface.");
