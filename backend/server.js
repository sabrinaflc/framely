const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const creationsRoutes = require('./routes/creations');

const app = express();
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/framezzy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB conectado!"))
  .catch(err => console.log(err));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/creations', creationsRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
