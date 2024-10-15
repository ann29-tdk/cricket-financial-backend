const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new transaction
router.post('/', async (req, res) => {
  const { type, playerName, amount, date, remarks } = req.body;

  try {
    const lastTransaction = await Transaction.findOne().sort({ date: -1 });
    let currentTeamFund = lastTransaction ? lastTransaction.currentTeamFund : 0;

    if (type === 'fund') {
      currentTeamFund += Number(amount);
    } else if (type === 'expenditure') {
      currentTeamFund -= Number(amount);
    }

    const transaction = new Transaction({
      type,
      playerName,
      amount: Number(amount),
      date,
      remarks,
      currentTeamFund,
    });

    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a transaction and update the fund value
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await Transaction.deleteOne({ _id: req.params.id });

    // Recalculate all transactions
    const allTransactions = await Transaction.find().sort({ date: 1 });
    let currentTeamFund = 0;

    for (let tx of allTransactions) {
      if (tx.type === 'fund') {
        currentTeamFund += tx.amount;
      } else if (tx.type === 'expenditure') {
        currentTeamFund -= tx.amount;
      } else if (tx.type === 'manual_update') {
        currentTeamFund = tx.currentTeamFund;
      }
      await Transaction.updateOne({ _id: tx._id }, { currentTeamFund });
    }

    res.json({
      message: 'Transaction deleted successfully',
      currentTeamFund,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update the current team fund manually
router.post('/update-fund', async (req, res) => {
  const { currentTeamFund } = req.body;

  try {
    const manualTransaction = new Transaction({
      type: 'manual_update',
      playerName: 'System',
      amount: 0,
      date: new Date(),
      remarks: 'Manual fund update',
      currentTeamFund: Number(currentTeamFund),
    });

    await manualTransaction.save();

    // Recalculate all transactions
    const allTransactions = await Transaction.find().sort({ date: 1 });
    let updatedFund = Number(currentTeamFund);

    for (let tx of allTransactions) {
      if (tx.type === 'fund') {
        updatedFund += tx.amount;
      } else if (tx.type === 'expenditure') {
        updatedFund -= tx.amount;
      } else if (tx.type === 'manual_update') {
        updatedFund = tx.currentTeamFund;
      }
      await Transaction.updateOne({ _id: tx._id }, { currentTeamFund: updatedFund });
    }

    res.status(200).json({
      message: 'Fund updated manually',
      currentTeamFund: updatedFund,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update fund', error: err.message });
  }
});

module.exports = router;