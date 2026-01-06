const valRaw = document.getElementById('val-raw');
const valOffset = document.getElementById('val-offset');
const valAngle = document.getElementById('val-angle');

const connectBtn = document.getElementById('connectBtn');
const calibrateBtn = document.getElementById('calibrateBtn');
const statusText = document.getElementById('status');
const canvas = document.getElementById('armCanvas');
const ctx = canvas.getContext('2d');

const bufferSize = 5;
let sensorBuffer = [];

let port;
let reader;
let keepReading = false;

let rawSensorValue = 0;
let calibrationOffset = 0;
let currentAngle = 0;
let targetAngle = 0; // For smooth animation

// Visualization parameters
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call

connectBtn.addEventListener('click', async () => {
    if (port && port.readable) {
        await disconnect();
    } else {
        await connect();
    }
});

calibrateBtn.addEventListener('click', () => {
    calibrate();
});

async function connect() {
    try {
        if ("serial" in navigator) {
            statusText.textContent = "Demande de port...";
            port = await navigator.serial.requestPort();

            statusText.textContent = "Ouverture...";
            await port.open({ baudRate: 9600 });

            statusText.textContent = "Connecté";
            statusText.classList.add('connected');
            connectBtn.textContent = "Déconnecter";
            calibrateBtn.disabled = false;

            keepReading = true;
            readSerialLoop();
            animate(); // Start animation loop
        } else {
            statusText.textContent = "Web Serial non supporté.";
        }
    } catch (error) {
        console.error(error);
        statusText.textContent = "Échec : " + error.message;
    }
}

async function disconnect() {
    keepReading = false;
    if (reader) {
        await reader.cancel();
    }
    if (port) {
        await port.close();
        port = null;
    }
    onDisconnected();
}

function onDisconnected() {
    statusText.textContent = "Déconnecté";
    statusText.classList.remove('connected');
    connectBtn.textContent = "Se connecter";
    calibrateBtn.disabled = true;
}

class LineBreakTransformer {
    constructor() {
        this.container = '';
    }

    transform(chunk, controller) {
        this.container += chunk;
        const lines = this.container.split('\r\n');
        this.container = lines.pop();
        lines.forEach(line => controller.enqueue(line));
    }

    flush(controller) {
        controller.enqueue(this.container);
    }
}

async function readSerialLoop() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .getReader();

    try {
        while (keepReading) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) handleSerialData(value);
        }
    } catch (error) {
        console.error(error);
    } finally {
        reader.releaseLock();
    }
}

function handleSerialData(dataString) {
    const raw = parseInt(dataString.trim());
    if (isNaN(raw)) return;

    sensorBuffer.push(raw);
    if (sensorBuffer.length > bufferSize) sensorBuffer.shift();

    const avgRaw = sensorBuffer.reduce((a, b) => a + b, 0) / sensorBuffer.length;
    rawSensorValue = Math.round(avgRaw);

    const diff = rawSensorValue - calibrationOffset;
    const sensitivity = 0.3;

    // Target for animation interlpolation
    let angle = Math.abs(diff * sensitivity);
    targetAngle = Math.min(Math.max(angle, 0), 180); // Limit finger flexion to 90 degrees

    updateSensorDisplay();
}

function calibrate() {
    calibrationOffset = rawSensorValue;
    alert("Calibrage effectué !");
}

function updateSensorDisplay() {
    valRaw.textContent = rawSensorValue;
    valOffset.textContent = calibrationOffset;
    valAngle.textContent = currentAngle.toFixed(1) + "°";
}

// --- VISUALIZATION ENGINE ---

function getColorForAngle(angle) {
    // 0-30: Green/Blue (Safe)
    // 30-60: Orange (Warning)
    // 60+: Red (Danger)
    if (angle < 30) return '#0ea5e9'; // Blue
    if (angle < 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
}

function animate() {
    if (!keepReading) return;

    // Smooth interpolation (Lerp)
    currentAngle = currentAngle + (targetAngle - currentAngle) * 0.1;

    drawScene();
    requestAnimationFrame(animate);
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 50;
    const scale = Math.min(canvas.width, canvas.height) / 600;

    const activeColor = getColorForAngle(currentAngle);

    // --- Palm dimensions ---
    const handWidth = 150 * scale;
    const handHeight = 90 * scale;

    // --- Finger segment dimensions ---
    const seg1Length = 80 * scale;   // proximal
    const seg2Length = 70 * scale;   // medial
    const seg3Length = 60 * scale;   // distal
    const fingerThickness = 25 * scale;
    const jointSize = fingerThickness * 0.9;

    // Hand position and knuckle pivot
    const handStartX = cx - handWidth / 1.5;
    const handStartY = cy - handHeight / 2;
    const pivotX = handStartX + handWidth; // MCP joint
    const pivotY = cy;

    // --- 1. Draw Palm ---
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(handStartX, handStartY, handWidth, handHeight, 15 * scale);
    ctx.fill();
    ctx.stroke();

    // --- Angles pour les 3 articulations (enroulement) ---
    const MCP_MAX = 80;   // base du doigt
    const PIP_MAX = 100;  // articulation du milieu
    const DIP_MAX = 60;   // extrémité

    const norm = Math.min(Math.max(currentAngle / 180, 0), 1); // 0..1 selon ton angle global

    const angle1 = (MCP_MAX * norm) * Math.PI / 180;         // MCP
    const angle2 = (PIP_MAX * Math.pow(norm, 1.2)) * Math.PI / 180; // PIP
    const angle3 = (DIP_MAX * Math.pow(norm, 1.5)) * Math.PI / 180; // DIP


    // --- 2. Draw 3‑segment finger ---
    ctx.save();
    ctx.translate(pivotX, pivotY);

    // Segment 1 (proximal)
    ctx.save();
    ctx.rotate(angle1);
    ctx.beginPath();
    ctx.roundRect(0, -fingerThickness / 2, seg1Length, fingerThickness, fingerThickness / 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

    // Neon core segment 1
    ctx.beginPath();
    ctx.moveTo(10 * scale, 0);
    ctx.lineTo(seg1Length - (10 * scale), 0);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Move to first interphalangeal joint
    ctx.translate(seg1Length, 0);

    // Segment 2 (medial)
    ctx.rotate(angle2);
    ctx.beginPath();
    ctx.roundRect(0, -fingerThickness / 2, seg2Length, fingerThickness, fingerThickness / 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

    // Neon core segment 2
    ctx.beginPath();
    ctx.moveTo(5 * scale, 0);
    ctx.lineTo(seg2Length - (5 * scale), 0);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Move to second interphalangeal joint
    ctx.translate(seg2Length, 0);

    // Segment 3 (distal)
    ctx.rotate(angle3);
    ctx.beginPath();
    ctx.roundRect(0, -fingerThickness / 2, seg3Length, fingerThickness, fingerThickness / 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

    // Neon core segment 3
    ctx.beginPath();
    ctx.moveTo(5 * scale, 0);
    ctx.lineTo(seg3Length - (5 * scale), 0);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore(); // end segments chain
    ctx.restore(); // end global finger transform

    // --- 3. Draw joints (MCP, PIP, DIP) ---

    // MCP joint (base at palm)
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, jointSize, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pivotX, pivotY, jointSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = activeColor;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Compute joint positions for PIP and DIP in world space
    // Recompute forward kinematics
    const dir1x = Math.cos(angle1);
    const dir1y = Math.sin(angle1);
    const pipX = pivotX + dir1x * seg1Length;
    const pipY = pivotY + dir1y * seg1Length;

    const dir2x = Math.cos(angle1 + angle2);
    const dir2y = Math.sin(angle1 + angle2);
    const dipX = pipX + dir2x * seg2Length;
    const dipY = pipY + dir2y * seg2Length;

    // PIP joint
    ctx.beginPath();
    ctx.arc(pipX, pipY, jointSize * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // DIP joint
    ctx.beginPath();
    ctx.arc(dipX, dipY, jointSize * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- 4. Draw Angle Text ---
    ctx.font = `bold ${16 * scale}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(currentAngle) + "°", pivotX, pivotY + (45 * scale));
}


// Initial draw
drawScene();
