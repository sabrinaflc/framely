const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Rota de cadastro
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "Email já cadastrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ msg: "Cadastro realizado com sucesso!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Email ou senha incorretos" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Email ou senha incorretos" });

    // Cria token JWT
    const token = jwt.sign({ id: user._id }, 'SECRET_KEY', { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});

module.exports = router;  // ✅ MUITO IMPORTANTE

// ROTA DE REGISTRO

const JWT_SECRET = "framezzySecret123"; // depois podemos colocar no .env

// Rota de cadastro
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email já cadastrado" });
  }

  // Criptografar senha
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    creations: []
  });

  await newUser.save();

  res.status(201).json({ message: "Cadastro realizado com sucesso!" });
});

module.exports = router;

//ROTA DE LOGIN

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Email ou senha incorretos" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Email ou senha incorretos" });
  }

  // Gerar token JWT
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

  res.json({
    message: `Bem-vindo, ${user.name}!`,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      creations: user.creations
    }
  });
});

module.exports = router;
