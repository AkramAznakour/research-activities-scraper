const express = require('express');
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const app = express();

Sentry.init({ dsn: 'https://80a12083a1774420b431700d1d2cf56f@o433230.ingest.sentry.io/5387943' });
// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
app.use(express.json());
app.use(cors());


app.use("/screenshots", express.static(__dirname + "/public/screenshots"));

const router = require("./routes");
app.use("/", router);
// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.listen(process.env.PORT || 2000, () =>
  console.log("Server started on port :", process.env.PORT || 2000)
);