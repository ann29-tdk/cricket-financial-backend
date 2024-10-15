const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Player = require('../models/Player');
const axios = require('axios'); // Using axios to call internal API for balance adjustments

// Get all matches (populate players)
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find().populate('players.player');
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve matches. Please try again later.' });
  }
});

// Get a single match by ID (populate players)
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate('players.player');
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve match details. Please try again later.' });
  }
});

// Create a new match
router.post('/', async (req, res) => {
  const { groundName, groundLocation, googleMapLink, bookingFee, feePerPerson, dateTime } = req.body;

  const match = new Match({
    groundName,
    groundLocation,
    googleMapLink,
    bookingFee,
    feePerPerson,
    dateTime,
  });

  try {
    const savedMatch = await match.save();
    res.status(201).json(savedMatch);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create a new match. Please check the input fields.' });
  }
});

// Update a match
router.put('/:id', async (req, res) => {
  try {
    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(updatedMatch);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update the match. Please check the input fields.' });
  }
});

// Update player payments in the match and adjust player balances
router.put('/:id/players', async (req, res) => {
  const { players } = req.body;

  try {
    const match = await Match.findById(req.params.id).populate('players.player');
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Iterate through each player and adjust their balance and payment details
    for (const playerData of players) {
      const player = await Player.findById(playerData.player);
      if (!player) {
        return res.status(404).json({ message: `Player with ID ${playerData.player} not found` });
      }

      // Calculate balance adjustment (increment or decrement balance)
      const currentBalance = player.balance || 0;
      const matchFee = match.feePerPerson;
      const paidAmount = playerData.paidAmount;
      const adjustmentAmount = paidAmount - matchFee;

      // Use the balance adjustment endpoint instead of manually calculating and updating
      await axios.patch(`http://localhost:5000/players/${playerData.player}/balance`, {
        amount: adjustmentAmount
      });
    }

    // Update payments in the Match model
    match.players = players.map(player => ({
      player: player.player,
      paidAmount: player.paidAmount,
    }));

    const updatedMatch = await match.save();

    // Populate the players after saving
    await updatedMatch.populate('players.player');

    res.json(updatedMatch);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update player payments. Please try again.' });
  }
});

// Remove a player from a match
router.delete('/:id/players/:playerId', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.players = match.players.filter(
      player => player.player.toString() !== req.params.playerId
    );

    const updatedMatch = await match.save();

    // Populate the players after saving
    await updatedMatch.populate('players.player');

    res.json(updatedMatch);
  } catch (err) {
    res.status(400).json({ message: 'Failed to remove player from match. Please try again.' });
  }
});

// Delete a match
router.delete('/:id', async (req, res) => {
  try {
    const deletedMatch = await Match.findByIdAndRemove(req.params.id);
    if (!deletedMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(deletedMatch);
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete match. Please try again later.' });
  }
});

module.exports = router;
