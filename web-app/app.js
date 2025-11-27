const serviceUUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
const charUUID = "19b10001-e8f2-537e-4f6c-d104768a1214";

const connectBtn = document.getElementById('connectBtn');
const statusText = document.getElementById('statusText');
const sensorDataContainer = document.getElementById('sensorData');
const canvas = document.getElementById('spineCanvas');
const ctx = canvas.getContext('2d');

let device;
let server;
let characteristic;
let sensorValues = [0, 0, 0, 0, 0]; // 5 sensors

// Visualization parameters
const numSegments = 5;
const segmentLength = 60; // Length of each spine segment in pixels

// Resize canvas to fit container
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawSpine();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

connectBtn.addEventListener('click', async () => {
    if (device && device.gatt.connected) {
        disconnect();
    } else {
        connect();
    }
});

async function connect() {
    try {
        statusText.textContent = "Requesting Bluetooth Device...";
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [serviceUUID] }]
        });

        device.addEventListener('gattserverdisconnected', onDisconnected);

        statusText.textContent = "Connecting to GATT Server...";
        server = await device.gatt.connect();

        statusText.textContent = "Getting Service...";
        const service = await server.getPrimaryService(serviceUUID);

        statusText.textContent = "Getting Characteristic...";
        characteristic = await service.getCharacteristic(charUUID);

        statusText.textContent = "Starting Notifications...";
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleNotifications);

        statusText.textContent = "Connected";
        statusText.classList.add('connected');
        connectBtn.textContent = "Disconnect";

    } catch (error) {
        console.error('Connection failed!', error);
        statusText.textContent = "Connection Failed: " + error.message;
    }
}

function disconnect() {
    if (device) {
        if (device.gatt.connected) {
            device.gatt.disconnect();
        }
    }
}

function onDisconnected(event) {
    const device = event.target;
    statusText.textContent = "Disconnected";
    statusText.classList.remove('connected');
    connectBtn.textContent = "Connect to Spine";
    console.log(`Device ${device.name} is disconnected.`);
}

function handleNotifications(event) {
    const value = event.target.value;
    // We expect 5 bytes
    for (let i = 0; i < 5; i++) {
        // value.getUint8(i) returns 0-255
        // We can normalize this to a range, e.g., -45 to +45 degrees
        // Assuming 128 is straight (0 degrees)
        sensorValues[i] = value.getUint8(i);
    }
    updateSensorDisplay();
    drawSpine();
}

function updateSensorDisplay() {
    sensorDataContainer.innerHTML = sensorValues.map((v, i) => `<span>S${i + 1}: ${v}</span>`).join('');
}

function drawSpine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Start drawing from the bottom center
    const startX = canvas.width / 2;
    const startY = canvas.height - 50;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let currentX = startX;
    let currentY = startY;
    let currentAngle = -Math.PI / 2; // Pointing up

    // Draw segments
    // We can use a simple forward kinematics approach
    // Or draw a bezier curve through points. Let's do segments first for visualization clarity, then smooth it.

    const points = [{ x: startX, y: startY }];

    for (let i = 0; i < numSegments; i++) {
        // Map 0-255 to an angle deflection
        // 0 -> -30 degrees (bent left/back)
        // 255 -> +30 degrees (bent right/forward)
        // Adjust these mappings based on physical sensor mounting
        // Let's assume 0 is straight, and increasing value bends it.
        // Actually, usually flex sensors increase resistance when bent.
        // Let's assume input 0-255 maps to curvature.

        // A simple model: each segment adds to the angle of the previous one relative to the "straight" line
        // But physically, the spine is a continuous curve.
        // Let's treat sensorValues as "local curvature" or "deflection angle" for that segment.

        // Normalize 0-255 to -0.5 to 0.5 radians (approx -30 to 30 degrees)
        // Let's assume 0 is straight for now.
        const bend = (sensorValues[i] / 255) * (Math.PI / 2); // 0 to 90 degrees max bend

        // For a spine, usually we want to visualize the cumulative shape.
        // Let's just add the bend to the current angle.
        // Note: This is a simplification.
        currentAngle += (bend * 0.5); // Dampen the effect slightly

        const nextX = currentX + Math.cos(currentAngle) * segmentLength;
        const nextY = currentY + Math.sin(currentAngle) * segmentLength;

        points.push({ x: nextX, y: nextY });

        currentX = nextX;
        currentY = nextY;
    }

    // Draw the spine as a smooth curve
    // Using quadratic curves between midpoints
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#38bdf8'; // Accent color

    if (points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        // Connect to the last point
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
    } else {
        // Fallback for straight line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    // Draw "vertebrae" or nodes
    ctx.fillStyle = '#f8fafc';
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Initial draw
drawSpine();
