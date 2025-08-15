// ----------------- Variáveis -----------------
let campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
let selectedCampaign = null;
let photoImg = null;
let frameImg = null;
let zoom = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX, startY;
let lastPinchDistance = null;

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

// ----------------- Funções de Navegação -----------------
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
    if (sectionId === 'explore') loadCampaigns();
    if (sectionId === 'join') loadCampaignSelect();
}

// ----------------- Campanhas -----------------
function loadCampaigns() {
    const list = document.getElementById('campaignList');
    list.innerHTML = '';
    campaigns.forEach(camp => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${camp.title}</strong><br>${camp.description}<br>Hashtag: ${camp.hashtag || ''}`;
        list.appendChild(li);
    });
}

function loadCampaignSelect() {
    const select = document.getElementById('campaignSelect');
    select.innerHTML = '';
    campaigns.forEach(camp => {
        const option = document.createElement('option');
        option.value = camp.id;
        option.textContent = camp.title;
        select.appendChild(option);
    });
    if (campaigns.length > 0) selectCampaign(campaigns[0].id);
}

function selectCampaign(id) {
    selectedCampaign = campaigns.find(c => c.id === id);
    if (!selectedCampaign) return;
    frameImg = new Image();
    frameImg.src = selectedCampaign.frame;
    frameImg.onload = drawPreview;
}

// ----------------- Criação de Campanha -----------------
document.getElementById('createForm').addEventListener('submit', e => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const description = document.getElementById('description')?.value || '';
    const hashtag = document.getElementById('hashtag')?.value || '';
    const fileInput = document.getElementById('frame');
    const file = fileInput.files[0];

    if (!file || !file.type.includes('image/png')) {
        Swal.fire({ icon: 'warning', title: 'Erro', text: 'Selecione um arquivo PNG válido!' });
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const id = Date.now().toString();
        campaigns.push({ id, title, description, hashtag, frame: event.target.result });
        localStorage.setItem('campaigns', JSON.stringify(campaigns));

        const baseUrl = window.location.origin;
        const link = `${baseUrl}/campaign.html?id=${id}`;
        const campaignLink = document.getElementById('campaignLink');
        campaignLink.style.display = 'block';
        campaignLink.innerHTML = `Link da campanha: <a href="${link}" target="_blank">${link}</a> <button onclick="copyLink('${link}')">Copiar</button>`;

        Swal.fire({ icon: 'success', title: 'Campanha criada!', text: 'Link gerado para compartilhar.' });
    };
    reader.readAsDataURL(file);
});

function copyLink(link) {
    navigator.clipboard.writeText(link)
        .then(() => Swal.fire({ icon: 'success', title: 'Copiado!', text: 'Link copiado para a área de transferência.' }))
        .catch(() => Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível copiar o link.' }));
}

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
        const distance = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
        if (lastPinchDistance) {
            zoom = Math.max(1, Math.min(3, zoom + (distance - lastPinchDistance) * 0.01));
            drawPreview();
        }
        lastPinchDistance = distance;
    }
}

// ----------------- Desenhar Preview -----------------
function drawPreview() {
    if (!frameImg) return; // Frame obrigatório
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (photoImg) {
        const photoWidth = photoImg.width * zoom;
        const photoHeight = photoImg.height * zoom;
        const drawX = posX + (canvas.width - photoWidth) / 2;
        const drawY = posY + (canvas.height - photoHeight) / 2;
        ctx.drawImage(photoImg, drawX, drawY, photoWidth, photoHeight);
    }

    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
}

// ----------------- Gerar e Baixar -----------------
document.getElementById('generate').addEventListener('click', (e) => {
    e.preventDefault();

    if (!photoImg) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Por favor, insira uma foto antes de gerar o frame!' });
        return;
    }

    if (!frameImg) {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Frame da campanha não carregado!' });
        return;
    }

    const link = document.createElement('a');
    link.download = 'framezzy.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
});

// ----------------- Inicializar -----------------
showSection('create');