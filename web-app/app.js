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

    let currentX = startX;
    let currentY = startY;
    let currentAngle = -Math.PI / 2; // Pointing up

    const points = [{ x: startX, y: startY, angle: currentAngle }];

    for (let i = 0; i < numSegments; i++) {
        // Map sensor values to bend angle
        // Center value (128) = straight, deviation creates bend
        const centerValue = 128;
        const deviation = (sensorValues[i] - centerValue) / 255;
        const bend = deviation * (Math.PI / 3); // Max ±60 degrees

        currentAngle += bend * 0.6; // Cumulative bending

        const nextX = currentX + Math.cos(currentAngle) * segmentLength;
        const nextY = currentY + Math.sin(currentAngle) * segmentLength;

        points.push({ x: nextX, y: nextY, angle: currentAngle });

        currentX = nextX;
        currentY = nextY;
    }

    // Draw spinal cord (thin line connecting vertebrae)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw vertebrae as rounded rectangles
    points.forEach((point, index) => {
        const vertebraWidth = 45;
        const vertebraHeight = 35;
        const radius = 8;

        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(point.angle + Math.PI / 2); // Perpendicular to spine direction

        // Vertebra body (main bone)
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;

        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(-vertebraWidth / 2 + radius, -vertebraHeight / 2);
        ctx.lineTo(vertebraWidth / 2 - radius, -vertebraHeight / 2);
        ctx.quadraticCurveTo(vertebraWidth / 2, -vertebraHeight / 2, vertebraWidth / 2, -vertebraHeight / 2 + radius);
        ctx.lineTo(vertebraWidth / 2, vertebraHeight / 2 - radius);
        ctx.quadraticCurveTo(vertebraWidth / 2, vertebraHeight / 2, vertebraWidth / 2 - radius, vertebraHeight / 2);
        ctx.lineTo(-vertebraWidth / 2 + radius, vertebraHeight / 2);
        ctx.quadraticCurveTo(-vertebraWidth / 2, vertebraHeight / 2, -vertebraWidth / 2, vertebraHeight / 2 - radius);
        ctx.lineTo(-vertebraWidth / 2, -vertebraHeight / 2 + radius);
        ctx.quadraticCurveTo(-vertebraWidth / 2, -vertebraHeight / 2, -vertebraWidth / 2 + radius, -vertebraHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Spinous process (the protruding part)
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(0, vertebraHeight / 2);
        ctx.lineTo(-8, vertebraHeight / 2 + 12);
        ctx.lineTo(8, vertebraHeight / 2 + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Spinal canal (hole in the middle)
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Sensor indicator (color based on flex)
        if (index > 0 && index <= numSegments) {
            const intensity = sensorValues[index - 1] / 255;
            ctx.fillStyle = `rgba(56, 189, 248, ${0.3 + intensity * 0.7})`;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

// Initial draw
drawSpine();
