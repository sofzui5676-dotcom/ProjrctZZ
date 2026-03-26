import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./authRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Auth server running on port ${PORT}`));
