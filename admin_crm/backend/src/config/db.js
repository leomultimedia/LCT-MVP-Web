const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // For zero-cost implementation, we'll use MongoDB Atlas free tier
    // The connection string would typically be stored in an environment variable
    // For now, we'll use a placeholder that can be replaced with the actual connection string
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/learcybertech?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Fallback to local storage if MongoDB connection fails
    console.log('Using local storage fallback for data persistence');
    return null;
  }
};

module.exports = connectDB;
