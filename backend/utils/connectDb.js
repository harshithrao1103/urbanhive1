import mongoose from "mongoose";

export default function connectDb(){
    mongoose
  .connect(process.env.MONGO_URI )
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Database connection failed:", err));
}