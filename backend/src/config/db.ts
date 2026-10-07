import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://btaruntej164_db_user:11223344@cluster0.pdtwng2.mongodb.net/quantex_mugen?retryWrites=true&w=majority&appName=Cluster0";

export const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      family: 4, // Force IPv4 on Windows to prevent dual-stack DNS timeout
      retryWrites: true,
      w: "majority",
    });
    console.log(`✅ MongoDB Atlas Connected with High-Concurrency Pool: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (retryCount < 5) {
      console.log(`🔄 Retrying MongoDB connection in 2s (Attempt ${retryCount + 1}/5)...`);
      setTimeout(() => connectDB(retryCount + 1), 2000);
    }
  }
};

