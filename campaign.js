let campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
let photoImg = null;
let frameImg = null;
let zoom = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX, startY;
let lastPinchDistance = null;

const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('id');
const selectedCampaign = campaigns.find(c => c.id === campaignId);

if (selectedCampaign) {
    frameImg = new Image();
    frameImg.src = selectedCampaign.frame;
}

document.getElementById('photo').addEventListener('change', e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        photoImg = new Image();
        photoImg.src = event.target.result;
        photoImg.onload = drawPreview;
    };
    reader.readAsDataURL(file);
});

const canvas = document.getElementById('preview');
canvas.addEventListener('mousedown', startDragging);
canvas.addEventListener('mousemove', drag);
canvas.addEventListener('mouseup', stopDragging);
canvas.addEventListener('mouseleave', stopDragging);
canvas.addEventListener('wheel', zoomWithWheel);
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', stopDragging);

function startDragging(e) {
    isDragging = true;
    startX = e.offsetX - posX;
    startY = e.offsetY - posY;
}

function drag(e) {
    if (!isDragging) return;
    posX = e.offsetX - startX;
    posY = e.offsetY - startY;
    drawPreview();
}

function stopDragging() {
    isDragging = false;
    lastPinchDistance = null;
}

function zoomWithWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoom = Math.max(1, Math.min(3, zoom + delta));
    drawPreview();
}

function handleTouch(e) {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1) {
        if (isDragging) {
            const touch = touches[0];
            posX = touch.clientX - canvas.getBoundingClientRect().left - startX;
            posY = touch.clientY - canvas.getBoundingClientRect().top - startY;
            drawPreview();
        } else {
            const touch = touches[0];
            startX = touch.clientX - canvas.getBoundingClientRect().left - posX;
            startY = touch.clientY - canvas.getBoundingClientRect().top - posY;
            isDragging = true;
        }
    } else if (touches.length === 2) {
        const touch1 = touches[0];
        const touch2 = touches[1];
        const distance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
        
        if (lastPinchDistance) {
            const delta = distance - lastPinchDistance;
            zoom = Math.max(1, Math.min(3, zoom + delta * 0.01));
            drawPreview();
        }
        lastPinchDistance = distance;
    }
}

function drawPreview() {
    if (!photoImg || !frameImg) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar foto ajustada
    const photoWidth = photoImg.width * zoom;
    const photoHeight = photoImg.height * zoom;
    const drawX = posX + (canvas.width - photoWidth) / 2;
    const drawY = posY + (canvas.height - photoHeight) / 2;
    ctx.drawImage(photoImg, drawX, drawY, photoWidth, photoHeight);

    // Desenhar frame por cima
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
}

document.getElementById('generate').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'twibbon.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
});