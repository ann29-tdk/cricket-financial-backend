// models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  groundName: { type: String, required: true },
  groundLocation: { type: String, required: true },
  googleMapLink: { type: String },
  bookingFee: { type: Number, required: true },
  feePerPerson: { type: Number, required: true },
  dateTime: { type: Date, required: true },
  players: [
    {
      player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, // Link to Player model
      paidAmount: { type: Number, default: 0 }, // Payment made by the player
    },
  ],
});

module.exports = mongoose.model('Match', matchSchema);
