// Fallback for roundRect (for older browsers/mobile)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (typeof radius === 'undefined') radius = 0;
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        }
        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}

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

    // Target for animation interpolation
    let angle = Math.abs(diff * sensitivity);
    targetAngle = Math.min(Math.max(angle, 0), 180);

    updateSensorDisplay();
    // PC SENDS TO PHONE
    broadcastToMirrors({
        angle: targetAngle,
        raw: rawSensorValue,
        offset: calibrationOffset
    });
}

function calibrate() {
    calibrationOffset = rawSensorValue;
    alert("Calibrage effectué !");
    // Also notify mirrors of new offset
    broadcastToMirrors({ offset: calibrationOffset });
}

function updateSensorDisplay() {
    valRaw.textContent = Math.round(rawSensorValue);
    valOffset.textContent = Math.round(calibrationOffset);
    valAngle.textContent = currentAngle.toFixed(1) + "°";
}

// --- MIRROR MODE (PEERJS) ---
const mirrorIdDisplay = document.getElementById('mirror-id-display');
const mirrorIdInput = document.getElementById('mirrorIdInput');
const joinMirrorBtn = document.getElementById('joinMirrorBtn');

let peer = null;
let connections = [];
let mirrorConnection = null;

function initPeer() {
    const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
    peer = new Peer(shortId);

    peer.on('open', (id) => {
        if (mirrorIdDisplay) {
            mirrorIdDisplay.textContent = "Code Miroir : " + id;
            mirrorIdDisplay.style.color = "#0ea5e9";
        }
    });

    peer.on('connection', (c) => {
        connections.push(c);
        // Special UI for PC when a mirror connects
        statusText.textContent = "Mode Maître (Miroir connecté)";
        statusText.classList.add('connected');
        c.on('close', () => {
            connections = connections.filter(conn => conn !== c);
        });
    });

    peer.on('error', (err) => {
        console.error("PeerJS Error:", err);
        if (err.type === 'unavailable-id') {
            peer = new Peer();
        }
    });
}

function broadcastToMirrors(data) {
    if (connections.length > 0) {
        connections.forEach(c => {
            if (c.open) c.send(data);
        });
    }
}

if (joinMirrorBtn) {
    joinMirrorBtn.addEventListener('click', () => {
        const targetId = mirrorIdInput.value.trim().toUpperCase();
        if (!targetId) return;

        mirrorIdDisplay.textContent = "Connexion au PC...";
        mirrorConnection = peer.connect(targetId);

        mirrorConnection.on('open', () => {
            mirrorIdDisplay.textContent = "Connecté au PC (Miroir)";
            mirrorIdDisplay.style.color = "#10b981";
            keepReading = true;
            if (!isAnimating) {
                isAnimating = true;
                animate();
            }
        });

        mirrorConnection.on('data', (data) => {
            // PHONE RECEIVES FROM PC
            console.log("Data received from PC:", data);

            if (data.angle !== undefined) targetAngle = data.angle;
            if (data.raw !== undefined) rawSensorValue = data.raw;
            if (data.offset !== undefined) calibrationOffset = data.offset;

            // Force values if we are in mirror mode
            if (!keepReading) {
                // Ensure animation is running
                if (!isAnimating) {
                    isAnimating = true;
                    animate();
                }
            }
            updateSensorDisplay();
        });

        mirrorConnection.on('close', () => {
            mirrorIdDisplay.textContent = "Déconnecté du PC";
            mirrorIdDisplay.style.color = "#ef4444";
            isAnimating = false;
        });
    });
}

initPeer();

let isAnimating = false;

function getColorForAngle(angle) {
    if (angle < 30) return '#0ea5e9'; // Blue
    if (angle < 45) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
}

function animate() {
    if (!keepReading && !mirrorConnection) {
        isAnimating = false;
        return;
    }
    isAnimating = true;

    currentAngle = currentAngle + (targetAngle - currentAngle) * 0.1;
    drawScene();
    updateSensorDisplay();
    requestAnimationFrame(animate);
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 50;
    const scale = Math.min(canvas.width, canvas.height) / 600;

    const activeColor = getColorForAngle(currentAngle);

    const handWidth = 150 * scale;
    const handHeight = 50 * scale;

    const seg1Length = 80 * scale;
    const seg2Length = 70 * scale;
    const seg3Length = 60 * scale;
    const fingerThickness = 25 * scale;
    const jointSize = fingerThickness * 0.9;

    const handStartX = cx - handWidth / 1.5;
    const handStartY = cy - handHeight / 2;
    const pivotX = handStartX + handWidth;
    const pivotY = cy;

    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(handStartX, handStartY, handWidth, handHeight, 15 * scale);
    ctx.fill();
    ctx.stroke();

    const MCP_MAX = 80;
    const PIP_MAX = 100;
    const DIP_MAX = 100;

    const norm = Math.min(Math.max(currentAngle / 180, 0), 1);

    const angle1 = (MCP_MAX * norm) * Math.PI / 180;
    const angle2 = (PIP_MAX * Math.pow(norm, 1.2)) * Math.PI / 180;
    const angle3 = (DIP_MAX * Math.pow(norm, 1.5)) * Math.PI / 180;

    ctx.save();
    ctx.translate(pivotX, pivotY);

    // Segment 1
    ctx.save();
    ctx.rotate(angle1);
    ctx.beginPath();
    ctx.roundRect(0, -fingerThickness / 2, seg1Length, fingerThickness, fingerThickness / 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

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

    ctx.translate(seg1Length, 0);

    // Segment 2
    ctx.rotate(angle2);
    ctx.beginPath();
    ctx.roundRect(0, -fingerThickness / 2, seg2Length, fingerThickness, fingerThickness / 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

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

    ctx.translate(seg2Length, 0);

    // Segment 3
    ctx.rotate(angle3);
    ctx.beginPath();
    ctx.roundRect(0, -fingerThickness / 2, seg3Length, fingerThickness, fingerThickness / 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

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

    ctx.restore();
    ctx.restore();

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

    const dir1x = Math.cos(angle1);
    const dir1y = Math.sin(angle1);
    const pipX = pivotX + dir1x * seg1Length;
    const pipY = pivotY + dir1y * seg1Length;

    const dir2x = Math.cos(angle1 + angle2);
    const dir2y = Math.sin(angle1 + angle2);

    const trueDipX = pipX + dir2x * seg2Length;
    const trueDipY = pipY + dir2y * seg2Length;

    ctx.beginPath();
    ctx.arc(pipX, pipY, jointSize * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(trueDipX, trueDipY, jointSize * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `bold ${16 * scale}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(currentAngle) + "°", pivotX, pivotY + (45 * scale));
}

drawScene();
