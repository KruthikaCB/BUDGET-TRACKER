import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String }, // hashed password
    googleId: { type: String }, // optional for Google login
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

export default mongoose.model("User", userSchema);
