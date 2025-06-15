const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const authController = require('../controllers/auth.controller');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], authController.login);

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', authController.getUser);

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  check('email', 'Please include a valid email').isEmail()
], authController.forgotPassword);

// @route   POST api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  check('token', 'Token is required').not().isEmpty(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], authController.resetPassword);

module.exports = router;
