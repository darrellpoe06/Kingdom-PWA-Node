const uiLog = document.getElementById('systemLog');
const uiStatus = document.getElementById('statusIndicator');
const intakeInput = document.getElementById('intakeInput');
const outputCanvas = document.getElementById('outputCanvas');

// ==========================================
// CORE TELEMETRY & GENERATION MATRIX 
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

    renderOutput(markdownData) {
        // Render generated artifacts using marked.js
        outputCanvas.innerHTML = marked.parse(markdownData);
        outputCanvas.style.display = 'block';
    }

    async initializeBaseline() {
        try {
            this.updateStatus("Initializing Baseline Telemetry...");
            this.logToHUD("Fetching lightweight NLP matrix via dynamic CDN import...");
            
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
            env.allowLocalModels = false; 

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
            this.updateStatus("Booting Generative Architecture...");
            this.logToHUD("Engaging WebGPU and initializing LLM for artifact generation...");
            
            try {
                if (!navigator.gpu) throw new Error("WebGPU not supported on this architecture.");

                const { CreateWebWorkerMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');

                this.robustEngine = await CreateWebWorkerMLCEngine(
                    new Worker(new URL('./llm-worker.js', import.meta.url), { type: 'module' }),
                    'Llama-3-8B-Instruct-q4f32_1-MLC',
                    { initProgressCallback: (progress) => this.logToHUD(progress.text) }
                );
                this.logToHUD("Generative Architecture Synced.");
            } catch (error) {
                this.logToHUD(`Hardware Fallback Triggered: ${error.message}.`);
                return false;
            }
        }
        return true;
    }

    async processIntake(userInput) {
        try {
            outputCanvas.style.display = 'none'; // Reset canvas
            this.logToHUD("Processing payload...");
            this.updateStatus("Analyzing Requirements...");

            if (!this.lightweightClassifier) {
                const initialized = await this.initializeBaseline();
                if (!initialized) throw new Error("Failed to construct semantic architecture.");
            }

            const baselineResult = await this.lightweightClassifier(userInput);
            const classification = baselineResult[0];

            this.logToHUD(`Baseline Deduction: ${classification.label} (Confidence: ${(classification.score * 100).toFixed(2)}%)`);

            // Always escalate to the generator for this phase to produce tangible systems
            this.updateStatus("Generating Artifacts...");
            this.logToHUD("Routing payload to [Execution Node]. Compiling business logic...");
            
            const canEscalate = await this.initializeEscalation();
            if (canEscalate) {
                const systemPrompt = `You are an elite enterprise ITIL/PMP Project Manager and Systems Architect. 
                Based on the user's input, automatically deduce their operational requirements and generate a scalable business system or MVP blueprint.
                
                You must format your response strictly using Markdown. Include the following sections:
                1. **Executive Briefing**: Summarize the current state, strategic implications, and the required decisions.
                2. **Step-by-Step Deployment Roadmap**: Actionable logistics to deploy the requested system.
                3. **Core Architecture / Code Artifacts**: Provide raw database schemas (JSON/SQL), structural layouts, or workflow mapping required to execute the vision.
                
                Maintain strict, professional, corporate IT terminology.`;

                const advancedContext = await this.robustEngine.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userInput }
                    ]
                });
                
                this.updateStatus("Artifact Compilation Complete.");
                this.logToHUD("Blueprint successfully compiled. Rendering to Output Canvas...");
                
                // Render the payload visually for the client
                this.renderOutput(advancedContext.choices[0].message.content);
                
            } else {
                this.updateStatus("Execution Halted.");
                this.logToHUD("Hardware constraints prevented artifact generation. Manual intervention required.");
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
            systemHUD.logToHUD(`Microphone Exception: ${error.message}.`);
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
        systemHUD.logToHUD(`Auditory Intake Error: ${event.error}. Verify browser permissions.`);
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
    systemHUD.logToHUD("Warning: Web Speech API unsupported on this browser.");
}

systemHUD.logToHUD("Execution Nodes successfully bound to interface.");
