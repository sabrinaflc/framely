// server.js - Backend com Node.js e Express

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const CAMPAIGNS_FILE = path.join(__dirname, 'campaigns.json');

app.use(bodyParser.json({ limit: '10mb' })); // Para suportar DataURLs grandes
app.use(cors()); // Para permitir requisições do front-end

// Carregar campanhas de arquivo JSON
let campaigns = [];
if (fs.existsSync(CAMPAIGNS_FILE)) {
    campaigns = JSON.parse(fs.readFileSync(CAMPAIGNS_FILE, 'utf8'));
}

// Salvar campanhas em arquivo JSON
function saveCampaigns() {
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
}

// API para listar todas as campanhas
app.get('/api/campaigns', (req, res) => {
    res.json(campaigns);
});

// API para obter uma campanha por ID
app.get('/api/campaigns/:id', (req, res) => {
    const campaign = campaigns.find(c => c.id === req.params.id);
    if (campaign) {
        res.json(campaign);
    } else {
        res.status(404).json({ error: 'Campanha não encontrada' });
    }
});

// API para criar uma nova campanha
app.post('/api/campaigns', (req, res) => {
    const campaign = req.body;
    campaigns.push(campaign);
    saveCampaigns();
    res.status(201).json(campaign);
});

// Servir arquivos estáticos (front-end)
app.use(express.static(__dirname));

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});