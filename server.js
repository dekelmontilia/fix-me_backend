require("dotenv").config({ path: "./config.env" });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRouter = require("./routes/userRoutes");
const barbershopRouter = require("./routes/productRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const app = express();

// Express App Config
app.use(express.json({ limit: "50mb" }));

if (!(process.env.NODE_ENV === "production")) {
  app.use(cors());
}

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

// routes
app.use("/api/user", userRouter);
app.use("/api/product", barbershopRouter);
app.use("/api/review", reviewRouter);

const port = process.env.PORT || 3030
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
