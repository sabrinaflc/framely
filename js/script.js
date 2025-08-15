// ----------------- Variáveis -----------------
let photoImg = null;
let frameImg = new Image();
let zoom = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX, startY;
let lastPinchDistance = null;

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

// ----------------- Carregar frame fixo -----------------
frameImg.src = 'assets/frame.png'; // Caminho do seu frame fixo
frameImg.onload = drawPreview;

// ----------------- Carregamento da Foto -----------------
document.getElementById('photo').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        photoImg = new Image();
        photoImg.src = event.target.result;
        photoImg.onload = drawPreview;
    };
    reader.readAsDataURL(file);
});

// ----------------- Canvas: Drag e Zoom -----------------
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
    zoom = Math.max(1, Math.min(3, zoom + (e.deltaY > 0 ? -0.1 : 0.1)));
    drawPreview();
}

function handleTouch(e) {
    e.preventDefault();
    const touches = e.touches;
    if (touches.length === 1) {
        const touch = touches[0];
        if (isDragging) {
            posX = touch.clientX - canvas.getBoundingClientRect().left - startX;
            posY = touch.clientY - canvas.getBoundingClientRect().top - startY;
            drawPreview();
        } else {
            startX = touch.clientX - canvas.getBoundingClientRect().left - posX;
            startY = touch.clientY - canvas.getBoundingClientRect().top - posY;
            isDragging = true;
        }
    } else if (touches.length === 2) {
        const distance = Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
        if (lastPinchDistance) {
            zoom = Math.max(1, Math.min(3, zoom + (distance - lastPinchDistance) * 0.01));
            drawPreview();
        }
        lastPinchDistance = distance;
    }
}

// ----------------- Desenhar Preview -----------------
function drawPreview() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (photoImg) {
        const photoWidth = photoImg.width * zoom;
        const photoHeight = photoImg.height * zoom;
        const drawX = posX + (canvas.width - photoWidth) / 2;
        const drawY = posY + (canvas.height - photoHeight) / 2;
        ctx.drawImage(photoImg, drawX, drawY, photoWidth, photoHeight);
    }

    // Frame sempre por cima
    if (frameImg.complete) {
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
    }
}

// ----------------- Gerar e Baixar -----------------
document.getElementById('generate').addEventListener('click', (e) => {
    e.preventDefault();

    if (!photoImg) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Por favor, insira uma foto antes de baixar!' });
        return;
    }

    const link = document.createElement('a');
    link.download = 'framezzy.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
});