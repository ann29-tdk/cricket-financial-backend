const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Get all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new player
router.post('/', async (req, res) => {
  const { name, team, battingStyle, bowlingStyle } = req.body;
  const player = new Player({ name, team, battingStyle, bowlingStyle });
  try {
    const savedPlayer = await player.save();
    res.status(201).json(savedPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a player's information (including balance if necessary)
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body; // Allow all fields to be updated

    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedPlayer) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(updatedPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Adjust player's balance by adding or subtracting an amount
router.patch('/:id/balance', async (req, res) => {
  try {
    const { amount } = req.body; // `amount` can be positive or negative

    if (typeof amount !== 'number') {
      return res.status(400).json({ message: 'Invalid balance amount' });
    }

    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Update the player's balance
    player.balance += amount;

    await player.save();

    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a player
router.delete('/:id', async (req, res) => {
  try {
    const deletedPlayer = await Player.findByIdAndRemove(req.params.id);
    if (!deletedPlayer) return res.status(404).json({ message: 'Player not found' });
    res.json(deletedPlayer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
