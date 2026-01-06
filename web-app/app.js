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
    targetAngle = Math.min(Math.max(angle, 0), 90); // Limit finger flexion to 90 degrees

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

    // --- Palm and Finger Dimensions ---
    const handWidth = 150 * scale;
    const handHeight = 90 * scale;
    const fingerLength = 120 * scale;
    const fingerThickness = 25 * scale;
    const jointSize = fingerThickness * 0.9;

    // The hand is drawn centered horizontally. The pivot for the finger is on the right.
    const handStartX = cx - handWidth / 1.5;
    const handStartY = cy - handHeight / 2;
    const pivotX = handStartX + handWidth; // Knuckle position
    const pivotY = cy; 

    // --- 1. Draw Palm ---
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(handStartX, handStartY, handWidth, handHeight, 15 * scale);
    ctx.fill();
    ctx.stroke();

    // --- 2. Draw Finger (Rotates) ---
    ctx.save();
    ctx.translate(pivotX, pivotY);

    // Rotation: 0 degrees angle = straight finger.
    const rotation = (currentAngle * Math.PI / 180);
    ctx.rotate(rotation);

    // Finger Shape
    ctx.beginPath();
    // Centering the finger on its rotation axis
    ctx.roundRect(0, -fingerThickness / 2, fingerLength, fingerThickness, fingerThickness / 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

    // "Neon" Core for the finger
    ctx.beginPath();
    ctx.moveTo(10 * scale, 0);
    ctx.lineTo(fingerLength - (10 * scale), 0);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();


    // --- 3. Draw Joint (Knuckle) ---
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, jointSize, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner Glow Dot
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, jointSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = activeColor;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // --- 4. Draw Angle Text ---
    ctx.font = `bold ${16 * scale}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(currentAngle) + "°", pivotX, pivotY + (45 * scale));
}

// Initial draw
drawScene();
