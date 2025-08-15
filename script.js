document.addEventListener('DOMContentLoaded', () => {
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
        if (section) section.style.display = 'block';
        if (sectionId === 'explore') loadCampaigns();
        if (sectionId === 'join') loadCampaignSelect();
    }

    function loadCampaigns() {
        const list = document.getElementById('campaignList');
        if (!list) return;
        list.innerHTML = '';
        campaigns.forEach(camp => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${camp.title}</strong><br>${camp.description}<br>Hashtag: ${camp.hashtag}`;
            list.appendChild(li);
        });
    }

    function loadCampaignSelect() {
        const select = document.getElementById('campaignSelect');
        if (!select) return;
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
        frameImg = new Image();
        frameImg.src = selectedCampaign.frame;
        drawPreview();
    }

    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', e => {
            e.preventDefault();
            const titleInput = document.getElementById('title');
            const descriptionInput = document.getElementById('description');
            const hashtagInput = document.getElementById('hashtag');
            const frameInput = document.getElementById('frame');

            if (!titleInput || !descriptionInput || !hashtagInput || !frameInput) {
                alert('Erro: Um ou mais elementos do formulário não foram encontrados.');
                return;
            }

            const title = titleInput.value;
            const description = descriptionInput.value;
            const hashtag = hashtagInput.value;
            const file = frameInput.files[0];

            if (!file) {
                alert('Por favor, selecione um frame PNG.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const id = Date.now().toString();
                campaigns.push({ id, title, description, hashtag, frame: event.target.result });
                localStorage.setItem('campaigns', JSON.stringify(campaigns));
                const link = `${window.location.origin}/campaign.html?id=${id}`;
                const campaignLink = document.getElementById('campaignLink');
                if (campaignLink) {
                    campaignLink.style.display = 'block';
                    campaignLink.innerHTML = `Link da campanha: <a href="${link}" target="_blank">${link}</a>`;
                }
                alert('Campanha criada com sucesso!');
                showSection('create');
            };
            reader.readAsDataURL(file);
        });
    } else {
        console.error('Formulário createForm não encontrado.');
    }

    const photoInput = document.getElementById('photo');
    if (photoInput) {
        photoInput.addEventListener('change', e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                photoImg = new Image();
                photoImg.src = event.target.result;
                photoImg.onload = drawPreview;
            };
            reader.readAsDataURL(file);
        });
    }

    const campaignSelect = document.getElementById('campaignSelect');
    if (campaignSelect) {
        campaignSelect.addEventListener('change', e => {
            selectCampaign(e.target.value);
        });
    }

    const canvas = document.getElementById('preview');
    if (canvas) {
        canvas.addEventListener('mousedown', startDragging);
        canvas.addEventListener('mousemove', drag);
        canvas.addEventListener('mouseup', stopDragging);
        canvas.addEventListener('mouseleave', stopDragging);
        canvas.addEventListener('wheel', zoomWithWheel);
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('touchend', stopDragging);
    }

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

    const generateButton = document.getElementById('generate');
    if (generateButton) {
        generateButton.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'twibbon.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        });
    }

    // Inicializar
    showSection('create');
});