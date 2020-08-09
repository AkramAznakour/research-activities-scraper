const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

app.listen(process.env.PORT || 2000, () =>
  console.log("Server started on port :", process.env.PORT || 2000)
);

app.use("/screenshots", express.static(__dirname + "/public/screenshots"));

const router = require("./routes");
app.use("/", router);
