import express from "express";
import cors from "cors";
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
dotenv.config();
console.log(process.env.PORT, process.env.MONGODB_URI);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(express.json());
app.use(cors());

const mongoURI= process.env.MONGODB_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

// creating a collection
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// creating a user model for the schema
const User = mongoose.model('User', userSchema);

// Routes
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      const passwordMatch = await bcrypt.compare(password, existingUser.password);

      if (passwordMatch) {
        console.log("Login successful");
        res.send({ message: "Login successful", user: existingUser });
      } else {
        console.log("Incorrect password");
        res.send({ message: "Incorrect password", user: 0 });
      }
    } else {
      console.log("User not found");
      res.send({ message: "User not found", user: 0 });
    }
  } catch (error) {
    console.error(error);
    res.send({ message: "Internal Server Error" });
  }
});


app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check for missing fields
    if (!name || !email || !password) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      console.log("Already present")
      return res.send({ message: "User already registered" });
    }

    // Create a new user with the hashed password
    const newUser = new User({
      name,
      email,
      password:hashedPassword
    });

    // Save the user to the database
    await newUser.save();
    
    console.log(newUser);
    res.send({ message: "Successfully registered" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// static file 
app.use(express.static(path.join(__dirname,'./client/build')))
app.get('*',(req,res)=>{
  res.sendFile(path.join(__dirname,"./client/build/index.html"))
})

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
