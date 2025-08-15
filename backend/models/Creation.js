const mongoose = require('mongoose');

const creationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  data: { type: Object, required: true }, // pode salvar os dados da criação em JSON
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Creation', creationSchema);
