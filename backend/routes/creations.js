const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Creation = require('../models/Creation');

const JWT_SECRET = "framezzySecret123"; // mesmo segredo do auth

// Middleware para validar token
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN
  if (!token) return res.status(401).json({ message: "Token necessário" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido" });
  }
};

// Criar nova criação
router.post('/', authMiddleware, async (req, res) => {
  const { title, data } = req.body;
  if (!title || !data) return res.status(400).json({ message: "Campos obrigatórios" });

  try {
    const creation = new Creation({ userId: req.userId, title, data });
    await creation.save();

    // Adiciona referência ao usuário
    await User.findByIdAndUpdate(req.userId, { $push: { creations: creation._id } });

    res.status(201).json({ message: "Criação salva com sucesso!", creation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// Listar criações do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const creations = await Creation.find({ userId: req.userId });
    res.json(creations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// Atualizar criação
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, data } = req.body;
  const { id } = req.params;

  try {
    const creation = await Creation.findOne({ _id: id, userId: req.userId });
    if (!creation) return res.status(404).json({ message: "Criação não encontrada" });

    if (title) creation.title = title;
    if (data) creation.data = data;

    await creation.save();
    res.json({ message: "Criação atualizada com sucesso", creation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// Deletar criação
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const creation = await Creation.findOneAndDelete({ _id: id, userId: req.userId });
    if (!creation) return res.status(404).json({ message: "Criação não encontrada" });

    // Remove referência do usuário
    await User.findByIdAndUpdate(req.userId, { $pull: { creations: id } });

    res.json({ message: "Criação deletada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

module.exports = router;
