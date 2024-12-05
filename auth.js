import mongoose from "mongoose";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
const jwtPass = process.env.JWT_SECRET;

// Connect to MongoDB
const { connect, connection, Schema, model } = mongoose;
const connectDB = async () => {
  try {
    await connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

connection.on("disconnected", () => {
  console.log("MongoDB disconnected! Reconnecting...");
  setTimeout(connectDB, 5000);
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("Users", userSchema);

app.post("/signup", async function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return res.status(400).send("Username already exists!!");
  }

  await User.create({ name, email: email, password });

  res.json({
    msg: "User created successfully!",
  });
});

app.post("/signin", async function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  const userExists = await User.findOne({
    email: email,
    password: password,
  });

  if (!userExists) {
    return res.status(403).json({
      msg: "Invalid username or password.",
    });
  }

  var token = jwt.sign({ email: email }, jwtPass);
  res.json({
    token,
    msg: "Logged in successfully!!",
  });
  console.log("token : ", token);
});

app.get("/users", async function (req, res) {
  const token = req.headers.authorization;

  try {
    //Verify token
    const decoded = jwt.verify(token, jwtPass);
    const email = decoded.email;

    // Query the database to exclude the current user
    const users = await User.find({ email: { $ne: email } });

    res.json({
      msg: "These are all the users looser",
      users,
    });
  } catch (err) {
    return res.status(403).json({
      msg: "Invalid Token",
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
