// models/Player.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, enum: ['Team A', 'Team B'], required: true },
  battingStyle: { type: String, required: false },
  bowlingStyle: { type: String, required: false },
  balance: { type: Number, default: 0 }, // New field to track player's balance
});

module.exports = mongoose.model('Player', playerSchema);
