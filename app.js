import { pipeline } from '@xenova/transformers';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

class TelemetryRoutingMatrix {
    constructor() {
        this.lightweightClassifier = null;
        this.robustEngine = null;
        this.escalationThreshold = 0.65; // Confidence score required to avoid escalation
        this.uiLog = document.getElementById('systemLog');
        this.uiStatus = document.getElementById('statusIndicator');
    }

    logToHUD(message) {
        console.log(message);
        this.uiLog.textContent += `\n> ${message}`;
        // Auto-scroll to the bottom of the log
        this.uiLog.scrollTop = this.uiLog.scrollHeight;
    }

    updateStatus(status) {
        this.uiStatus.textContent = status;
    }

    // Initialize Transformers.js (Lightweight Baseline)
    async initializeBaseline() {
        this.updateStatus("Initializing Baseline Telemetry...");
        this.logToHUD("Downloading/Loading lightweight classification matrix...");
        
        this.lightweightClassifier = await pipeline(
            'text-classification', 
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        );
        this.logToHUD("Baseline Telemetry Synced.");
    }

    // Initialize WebLLM (Robust Conversational Escalation)
    async initializeEscalation() {
        if (!this.robustEngine) {
            this.updateStatus("Booting Robust Architecture...");
            this.logToHUD("Systemic Complexity Detected. Engaging WebGPU and initializing WebLLM...");
            
            try {
                if (!navigator.gpu) throw new Error("WebGPU not supported on this hardware.");

                // Utilizes a Web Worker to prevent freezing the main UI thread
                this.robustEngine = await CreateWebWorkerMLCEngine(
                    new Worker(new URL('./llm-worker.js', import.meta.url), { type: 'module' }),
                    'Llama-3-8B-Instruct-q4f32_1-MLC',
                    { initProgressCallback: (progress) => this.logToHUD(progress.text) }
                );
                this.logToHUD("Robust Architecture Synced.");
            } catch (error) {
                this.logToHUD(`Hardware Fallback Triggered: ${error.message}. Downgrading to Baseline Protocol.`);
                return false;
            }
        }
        return true;
    }

    // Primary Input Processor
    async processIntake(userInput) {
        this.uiLog.textContent = "> Processing payload...";
        this.updateStatus("Analyzing...");

        if (!this.lightweightClassifier) await this.initializeBaseline();

        // Step 1: Perform lightweight semantic parsing
        const baselineResult = await this.lightweightClassifier(userInput);
        const classification = baselineResult[0];

        this.logToHUD(`Baseline Deduction: ${classification.label} (Confidence: ${(classification.score * 100).toFixed(2)}%)`);

        // Step 2: Evaluate Operational Confidence
        if (classification.score >= this.escalationThreshold && classification.label === "POSITIVE") {
            this.updateStatus("Optimal Alignment Confirmed.");
            this.logToHUD("Routing to: [Execution Node]");
            this.logToHUD("Action: Generating standard MVP mapping based on high operational confidence.");
        } else {
            this.updateStatus("Escalating to Advanced Analysis...");
            this.logToHUD("Low confidence or high systemic friction detected. Requesting advanced context...");
            
            const canEscalate = await this.initializeEscalation();
            
            if (canEscalate) {
                const advancedContext = await this.robustEngine.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are an elite enterprise architect. Deduce the deep operational friction in the following client request. Output a brief, professional response." },
                        { role: "user", content: userInput }
                    ]
                });

                this.updateStatus("Strategic Synthesis Complete.");
                this.logToHUD("Routing to: [Empathy / Architecture Node]");
                this.logToHUD(`Action Output:\n${advancedContext.choices[0].message.content}`);
            } else {
                this.updateStatus("Execution Halted.");
                this.logToHUD("Hardware constraints prevented escalation. Manual intervention required.");
            }
        }
    }
}

// System Execution Bindings
const systemHUD = new TelemetryRoutingMatrix();

// Execute Payload Event
document.getElementById('processBtn').addEventListener('click', async () => {
    const input = document.getElementById('intakeInput').value;
    if (!input.trim()) {
        alert("Please provide operational requirements before executing.");
        return;
    }
    
    document.getElementById('processBtn').disabled = true;
    await systemHUD.processIntake(input);
    document.getElementById('processBtn').disabled = false;
});

// Visual Architecture Toggle Logic
const themeBtn = document.getElementById('themeToggleBtn');
themeBtn.addEventListener('click', () => {
    const body = document.body;
    body.classList.toggle('light-mode');
    
    if (body.classList.contains('light-mode')) {
        themeBtn.textContent = "Revert to Tactical Mode";
    } else {
        themeBtn.textContent = "Engage High-Legibility Mode";
    }
});
