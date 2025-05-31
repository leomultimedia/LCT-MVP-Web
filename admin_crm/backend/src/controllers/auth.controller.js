const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Mock user model for zero-cost implementation
// In production, this would use a real database
const users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'libinpkurian@gmail.com',
    password: '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', // 'password123'
    role: 'admin',
    created: Date.now()
  }
];

// Controller methods for authentication
const authController = {
  // Register user
  register: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      const userExists = users.find(user => user.email === email);
      
      if (userExists) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: '',
        role: email === 'libinpkurian@gmail.com' ? 'admin' : 'user',
        created: Date.now()
      };

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // Add to users array (in production, would save to database)
      users.push(newUser);

      // Create JWT payload
      const payload = {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'learcybertechsecret',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  // Login user
  login: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const user = users.find(user => user.email === email);
      
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'learcybertechsecret',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  // Get user data
  getUser: async (req, res) => {
    try {
      // Find user by ID from token
      const user = users.find(user => user.id === req.user.id);
      
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Return user data without password
      const { password, ...userData } = user;
      res.json(userData);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // Find user
      const user = users.find(user => user.email === email);
      
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Create reset token
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'learcybertechsecret',
        { expiresIn: '1h' }
      );

      // In production, would send email with reset link
      console.log(`Reset token for ${email}: ${resetToken}`);

      res.json({ msg: 'Password reset email sent' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'learcybertechsecret');
      
      // Find user
      const userIndex = users.findIndex(user => user.id === decoded.id);
      
      if (userIndex === -1) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Encrypt new password
      const salt = await bcrypt.genSalt(10);
      users[userIndex].password = await bcrypt.hash(password, salt);

      res.json({ msg: 'Password reset successful' });
    } catch (err) {
      console.error(err.message);
      res.status(400).json({ msg: 'Invalid or expired token' });
    }
  }
};

module.exports = authController;
