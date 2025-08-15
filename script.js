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

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    } else {
        console.error(`Seção com ID ${sectionId} não encontrada.`);
    }
    if (sectionId === 'explore') loadCampaigns();
    if (sectionId === 'join') loadCampaignSelect();
}

function loadCampaigns() {
    const list = document.getElementById('campaignList');
    if (!list) {
        console.error('Elemento campaignList não encontrado.');
        return;
    }
    list.innerHTML = '';
    campaigns.forEach(camp => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${camp.title}</strong><br>${camp.description}<br>Hashtag: ${camp.hashtag}`;
        list.appendChild(li);
    });
}

function loadCampaignSelect() {
    const select = document.getElementById('campaignSelect');
    if (!select) {
        console.error('Elemento campaignSelect não encontrado.');
        return;
    }
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
    if (!selectedCampaign) {
        console.error(`Campanha com ID ${id} não encontrada.`);
        return;
    }
    frameImg = new Image();
    frameImg.src = selectedCampaign.frame;
    frameImg.onerror = () => console.error('Erro ao carregar o frame da campanha.');
    drawPreview();
}

document.getElementById('createForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = document.getElementById('createForm');
    if (!form) {
        console.error('Formulário createForm não encontrado.');
        alert('Erro: Formulário não encontrado. Verifique o HTML.');
        return;
    }

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const hashtag = document.getElementById('hashtag').value;
    const fileInput = document.getElementById('frame');
    const file = fileInput.files[0];

    if (!file) {
        console.error('Nenhum arquivo selecionado.');
        alert('Por favor, selecione um arquivo PNG para o frame.');
        return;
    }

    if (!file.type.includes('image/png')) {
        console.error('Arquivo selecionado não é PNG.');
        alert('Por favor, selecione um arquivo no formato PNG.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const id = Date.now().toString();
            campaigns.push({ id, title, description, hashtag, frame: event.target.result });
            localStorage.setItem('campaigns', JSON.stringify(campaigns));
            console.log('Campanha salva:', { id, title, description, hashtag });
            const baseUrl = window.location.origin || 'http://localhost:8000'; // Fallback para testes locais
            const link = `${baseUrl}/campaign.html?id=${id}`;
            const campaignLink = document.getElementById('campaignLink');
            if (campaignLink) {
                campaignLink.style.display = 'block';
                campaignLink.innerHTML = `Link da campanha: <a href="${link}" target="_blank">${link}</a> <button onclick="copyLink('${link}')">Copiar</button>`;
                console.log('Link gerado:', link);
            } else {
                console.error('Elemento campaignLink não encontrado.');
            }
            alert('Campanha criada com sucesso! Copie o link abaixo para compartilhar.');
            showSection('create');
        } catch (error) {
            console.error('Erro ao salvar campanha:', error);
            alert('Erro ao criar campanha. Verifique o console para mais detalhes.');
        }
    };
    reader.onerror = () => {
        console.error('Erro ao ler o arquivo.');
        alert('Erro ao processar o arquivo PNG. Tente novamente.');
    };
    reader.readAsDataURL(file);
});

function copyLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        alert('Link copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar o link:', err);
        alert('Erro ao copiar o link. Copie manualmente.');
    });
}

document.getElementById('photo').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) {
        console.error('Nenhum arquivo de foto selecionado.');
        alert('Por favor, selecione uma foto.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        photoImg = new Image();
        photoImg.src = event.target.result;
        photoImg.onload = drawPreview;
        photoImg.onerror = () => console.error('Erro ao carregar a foto.');
    };
    reader.onerror = () => console.error('Erro ao ler a foto.');
    reader.readAsDataURL(file);
});

document.getElementById('campaignSelect').addEventListener('change', e => {
    selectCampaign(e.target.value);
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

// Inicializar
showSection('create');