import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ----------------- Firebase Config -----------------
const firebaseConfig = {
    apiKey: "AIzaSyCPO7rJZZjUVflMCr4T7h1URBhBvQ6bOKE",
    authDomain: "framezzy-io.firebaseapp.com",
    projectId: "framezzy-io",
    storageBucket: "framezzy-io.firebasestorage.app",
    messagingSenderId: "695075233111",
    appId: "1:695075233111:web:6c906973942c58ad86f212",
    measurementId: "G-1689TZ0RKX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----------------- Variáveis -----------------
let photoImg = null;
let frameImg = new Image();
let zoom = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX, startY;
let lastPinchDistance = null;
let currentFrame = null;

const previewCanvas = document.getElementById('preview');
const viewCanvas = document.getElementById('view-preview');
const previewCtx = previewCanvas.getContext('2d');
const viewCtx = viewCanvas.getContext('2d');

// ----------------- Comprimir Imagem -----------------
function compressImage(file, maxSizeKB, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let width = img.width;
            let height = img.height;
            const maxSizeBytes = maxSizeKB * 1024;

            // Reduzir qualidade até que o tamanho seja menor que maxSizeBytes
            let quality = 0.9;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            let dataUrl = canvas.toDataURL('image/jpeg', quality);

            while (dataUrl.length > maxSizeBytes && quality > 0.1) {
                quality -= 0.1;
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }

            if (dataUrl.length > maxSizeBytes) {
                Swal.fire({ icon: 'error', title: 'Erro', text: 'A imagem é muito grande mesmo após compressão. Tente uma imagem menor.' });
                return;
            }

            callback(dataUrl);
        };
    };
    reader.readAsDataURL(file);
}

// ----------------- Upload de Frame -----------------
function uploadFrame() {
    const frameInput = document.getElementById('frame-upload');
    const file = frameInput.files[0];
    if (!file) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Por favor, selecione um frame!' });
        return;
    }

    // Comprimir a imagem para caber no limite de 1 MiB do Firestore
    compressImage(file, 1000, (dataUrl) => {
        addDoc(collection(db, 'frames'), {
            imageBase64: dataUrl,
            createdAt: serverTimestamp()
        }).then(docRef => {
            currentFrame = { id: docRef.id, imageBase64: dataUrl };
            document.getElementById('upload-section').style.display = 'none';
            document.getElementById('preview-section').style.display = 'block';
            frameImg.src = dataUrl;
            frameImg.onload = drawPreview;
            Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Frame enviado com sucesso!' });
        }).catch(error => {
            Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha ao enviar o frame: ' + error.message });
        });
    });
}

// ----------------- Carregamento da Foto (Pré-visualização) -----------------
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

// ----------------- Carregamento da Foto (Visualização) -----------------
document.getElementById('view-photo').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        photoImg = new Image();
        photoImg.src = event.target.result;
        photoImg.onload = drawView;
    };
    reader.readAsDataURL(file);
});

// ----------------- Canvas: Drag e Zoom -----------------
previewCanvas.addEventListener('mousedown', startDragging);
previewCanvas.addEventListener('mousemove', drag);
previewCanvas.addEventListener('mouseup', stopDragging);
previewCanvas.addEventListener('mouseleave', stopDragging);
previewCanvas.addEventListener('wheel', zoomWithWheel);
previewCanvas.addEventListener('touchstart', handleTouch);
previewCanvas.addEventListener('touchmove', handleTouch);
previewCanvas.addEventListener('touchend', stopDragging);

viewCanvas.addEventListener('mousedown', startDragging);
viewCanvas.addEventListener('mousemove', drag);
viewCanvas.addEventListener('mouseup', stopDragging);
viewCanvas.addEventListener('mouseleave', stopDragging);
viewCanvas.addEventListener('wheel', zoomWithWheel);
viewCanvas.addEventListener('touchstart', handleTouch);
viewCanvas.addEventListener('touchmove', handleTouch);
viewCanvas.addEventListener('touchend', stopDragging);

function startDragging(e) {
    isDragging = true;
    const canvas = e.target.id === 'preview' ? previewCanvas : viewCanvas;
    startX = e.offsetX - posX;
    startY = e.offsetY - posY;
}

function drag(e) {
    if (!isDragging) return;
    const canvas = e.target.id === 'preview' ? previewCanvas : viewCanvas;
    posX = e.offsetX - startX;
    posY = e.offsetY - startY;
    if (canvas.id === 'preview') {
        drawPreview();
    } else {
        drawView();
    }
}

function stopDragging() {
    isDragging = false;
    lastPinchDistance = null;
}

function zoomWithWheel(e) {
    e.preventDefault();
    zoom = Math.max(1, Math.min(3, zoom + (e.deltaY > 0 ? -0.1 : 0.1)));
    const canvas = e.target.id === 'preview' ? previewCanvas : viewCanvas;
    if (canvas.id === 'preview') {
        drawPreview();
    } else {
        drawView();
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touches = e.touches;
    const canvas = e.target.id === 'preview' ? previewCanvas : viewCanvas;
    if (touches.length === 1) {
        const touch = touches[0];
        if (isDragging) {
            posX = touch.clientX - canvas.getBoundingClientRect().left - startX;
            posY = touch.clientY - canvas.getBoundingClientRect().top - startY;
            if (canvas.id === 'preview') {
                drawPreview();
            } else {
                drawView();
            }
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
            if (canvas.id === 'preview') {
                drawPreview();
            } else {
                drawView();
            }
        }
        lastPinchDistance = distance;
    }
}

// ----------------- Desenhar Preview -----------------
function drawPreview() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (photoImg) {
        const photoWidth = photoImg.width * zoom;
        const photoHeight = photoImg.height * zoom;
        const drawX = posX + (previewCanvas.width - photoWidth) / 2;
        const drawY = posY + (previewCanvas.height - photoHeight) / 2;
        previewCtx.drawImage(photoImg, drawX, drawY, photoWidth, photoHeight);
    }

    if (frameImg.complete) {
        previewCtx.drawImage(frameImg, 0, 0, previewCanvas.width, previewCanvas.height);
    }
}

// ----------------- Desenhar Visualização -----------------
function drawView() {
    viewCtx.clearRect(0, 0, viewCanvas.width, viewCanvas.height);

    if (photoImg) {
        const photoWidth = photoImg.width * zoom;
        const photoHeight = photoImg.height * zoom;
        const drawX = posX + (viewCanvas.width - photoWidth) / 2;
        const drawY = posY + (viewCanvas.height - photoHeight) / 2;
        viewCtx.drawImage(photoImg, drawX, drawY, photoWidth, photoHeight);
    }

    if (frameImg.complete) {
        viewCtx.drawImage(frameImg, 0, 0, viewCanvas.width, viewCanvas.height);
    }
}

// ----------------- Gerar e Baixar (Pré-visualização) -----------------
document.getElementById('generate').addEventListener('click', (e) => {
    e.preventDefault();
    if (!photoImg) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Por favor, insira uma foto antes de baixar!' });
        return;
    }
    const link = document.createElement('a');
    link.download = 'framezzy.png';
    link.href = previewCanvas.toDataURL('image/png', 1.0);
    link.click();
});

// ----------------- Gerar e Baixar (Visualização) -----------------
document.getElementById('view-generate').addEventListener('click', (e) => {
    e.preventDefault();
    if (!photoImg) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Por favor, insira uma foto antes de baixar!' });
        return;
    }
    const link = document.createElement('a');
    link.download = 'framezzy.png';
    link.href = viewCanvas.toDataURL('image/png', 1.0);
    link.click();
});

// ----------------- Gerar Link de Compartilhamento -----------------
function generateShareLink() {
    if (!currentFrame) {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Nenhum frame carregado!' });
        return;
    }
    const shareLink = `${window.location.origin}?frame=${currentFrame.id}`;
    Swal.fire({
        title: 'Link de Compartilhamento',
        html: `<input type="text" value="${shareLink}" readonly style="width: 80%; padding: 10px; margin-bottom: 10px;"><button onclick="navigator.clipboard.writeText('${shareLink}')">Copiar</button>`,
        icon: 'success'
    });
}

// ----------------- Carregar Frame a partir do Link -----------------
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const frameId = urlParams.get('frame');
    if (frameId) {
        getDoc(doc(db, 'frames', frameId)).then(docSnap => {
            if (docSnap.exists()) {
                currentFrame = { id: frameId, imageBase64: docSnap.data().imageBase64 };
                frameImg.src = docSnap.data().imageBase64;
                frameImg.onload = drawView;
                document.getElementById('upload-section').style.display = 'none';
                document.getElementById('preview-section').style.display = 'none';
                document.getElementById('view-section').style.display = 'block';
            } else {
                Swal.fire({ icon: 'error', title: 'Erro', text: 'Frame não encontrado!' });
            }
        }).catch(error => {
            Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao carregar o frame: ' + error.message });
        });
    } else {
        frameImg.src = 'assets/frame.png';
        frameImg.onload = drawPreview;
    }
};