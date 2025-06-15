// MongoDB connection configuration with increased timeout
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MongoDB Atlas free tier with increased timeout settings
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://learcybertech:learcybertech@cluster0.mongodb.net/learcybertech?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased from default 10000ms
      socketTimeoutMS: 45000, // Increased from default 30000ms
      connectTimeoutMS: 30000, // Increased from default 10000ms
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // Implement retry logic
    console.log('Retrying connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectDB(); // Recursive retry
  }
};

module.exports = connectDB;
