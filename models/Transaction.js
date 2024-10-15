const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['fund', 'expenditure', 'manual_update'], required: true },
  playerName: { type: String },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  remarks: { type: String },
  currentTeamFund: { type: Number, required: true },
});

module.exports = mongoose.model('Transaction', transactionSchema);