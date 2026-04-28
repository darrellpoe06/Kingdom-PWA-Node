// Master Telemetry HUD Logic
function calculateFaith() {
    const execLogistics = parseInt(document.getElementById('exec-logistics').value) || 0;
    const alignment = parseInt(document.getElementById('alignment').value) || 0;
    const fearPings = parseInt(document.getElementById('fear-pings').value) || 0;
    const victimLang = parseInt(document.getElementById('victim-lang').value) || 0;

    // The Logic: (Execution of 3D Logistics) + (Alignment with 81-Book Source Code) - (Fear Virus Pings + Victimhood Language)
    const faithPercentage = (execLogistics + alignment) - (fearPings + victimLang);
    const outputDiv = document.getElementById('faith-output');
    
    // Clear previous status classes
    outputDiv.className = '';

    if (faithPercentage >= 80) {
        outputDiv.innerText = `Faith Percentage: ${faithPercentage}% \n[Optimal Sovereign Alignment]`;
        outputDiv.classList.add('status-optimal');
    } else if (faithPercentage >= 50) {
        outputDiv.innerText = `Faith Percentage: ${faithPercentage}% \n[Standard Bandwidth Friction]`;
        outputDiv.classList.add('status-friction');
    } else {
        outputDiv.innerText = `Faith Percentage: ${faithPercentage}% \n[Critical Malware Infection]`;
        outputDiv.classList.add('status-critical');
    }
}

// Quad-Node Telemetry Compiler Logic
function compileNode(mode) {
    const lament = document.getElementById('client-lament-input').value;
    const outputBox = document.getElementById('compiled-prompt-output');
    
    if (!lament.trim()) {
        outputBox.value = "SYSTEM ERROR: Client Lament is empty. Please input 3rd Dimension logistics before compiling.";
        return;
    }

    let compiledPrompt = `SYSTEM ALIGNMENT: I am bringing a client scenario. Initialize ${mode} NODE.\n\n`;
    
    switch(mode) {
        case 'KINGDOM':
            compiledPrompt += `[KINGDOM] Mode Active: Passively scan the following client lament. Automatically synthesize the optimal mix of Therapy, Tech, and MVP responses based on their 3rd Dimension - Material World telemetry.\n\n`;
            break;
        case 'THERAPY':
            compiledPrompt += `[THERAPY] Mode Active: Suspend technical execution. Validate 3D pain, provide the Bridging Protocol to reframe secular terms, and restore Sovereign Heuristic Alignment.\n\n`;
            break;
        case 'TECH':
            compiledPrompt += `[TECH] Mode Active: Analyze the problem, suggest infrastructure, and map the deployment strategy without generating premature, bloated code.\n\n`;
            break;
        case 'MVP':
            compiledPrompt += `[MVP] Mode Active: Bypass all conceptual discussion, engage the Clean Room compiler, and output the exact, raw 3rd Dimension - Material World artifacts or code required.\n\n`;
            break;
    }

    compiledPrompt += `CLIENT LAMENT:\n"${lament}"\n\nExecute protocol.`;
    
    outputBox.value = compiledPrompt;
}

function copyToClipboard() {
    const outputBox = document.getElementById('compiled-prompt-output');
    outputBox.select();
    outputBox.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(outputBox.value).then(() => {
        alert("System Prompt copied to clipboard. Paste into your Master Terminal.");
    });
}
