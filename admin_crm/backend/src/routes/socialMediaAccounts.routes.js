const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const socialMediaAccountController = require('../controllers/socialMediaAccount.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/social/accounts
// @desc    Get all social media accounts
// @access  Private
router.get('/accounts', auth, socialMediaAccountController.getAccounts);

// @route   GET api/social/accounts/:id
// @desc    Get social media account by ID
// @access  Private
router.get('/accounts/:id', auth, socialMediaAccountController.getAccountById);

// @route   POST api/social/accounts
// @desc    Create a new social media account
// @access  Private
router.post('/accounts', [
  auth,
  [
    check('platform', 'Platform is required').not().isEmpty(),
    check('name', 'Name is required').not().isEmpty(),
    check('handle', 'Handle is required').not().isEmpty(),
    check('url', 'URL is required').isURL()
  ]
], socialMediaAccountController.createAccount);

// @route   PUT api/social/accounts/:id
// @desc    Update a social media account
// @access  Private
router.put('/accounts/:id', auth, socialMediaAccountController.updateAccount);

// @route   DELETE api/social/accounts/:id
// @desc    Delete a social media account
// @access  Private
router.delete('/accounts/:id', auth, socialMediaAccountController.deleteAccount);

// @route   POST api/social/accounts/:id/check-connection
// @desc    Check connection status of a social media account
// @access  Private
router.post('/accounts/:id/check-connection', auth, socialMediaAccountController.checkConnection);

// @route   GET api/social/accounts/platform/:platform
// @desc    Get social media accounts by platform
// @access  Private
router.get('/accounts/platform/:platform', auth, socialMediaAccountController.getAccountsByPlatform);

// @route   GET api/social/accounts/connected
// @desc    Get all connected social media accounts
// @access  Private
router.get('/accounts/connected', auth, socialMediaAccountController.getConnectedAccounts);

module.exports = router;
