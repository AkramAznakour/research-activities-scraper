const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
var fs = require("fs");
const scraper = require("./scraper");

const app = express();
app.use(express.json());
app.use(cors());

app.listen(process.env.PORT, () => {
  console.log("Server started on port :", process.env.PORT);
});

const router = express.Router();

router.get("/", async (req, resp) => {
  console.log("hello :");
  resp.send({ message: "hello" });
});

router.get("/author-search/:authorName", async (req, resp) => {
  const { authorName } = req.params;
  const authors = await scraper.authorSearch(authorName);
  resp.send(authors);
});

router.get("/author/:scholarId", async (req, resp) => {
  const { scholarId } = req.params;
  const author = await scraper.getAuthorData(scholarId);
  fs.writeFile(`./cache/${scholarId}.json`, JSON.stringify(author), (a) => {
    console.log(a);
  });

  resp.send(author);
});

router.get("/publication/:scholarId/:publicationName", async (req, resp) => {
  const { scholarId, publicationName } = req.params;
  const publication = await scraper.getPublicationData(
    scholarId,
    publicationName
  );
  resp.send(publication);
});

router.get(
  "/publication-details/:scholarId/:publicationName",
  async (req, resp) => {
    const { scholarId, publicationName } = req.params;
    const publication = await scraper.getPublicationDetails(
      scholarId,
      publicationName
    );
    resp.send(publication);
  }
);

router.get("/fake/author/:scholarId", async (req, resp) => {
  const { scholarId } = req.params;
  if (fs.existsSync(`./cache/${scholarId}.json`)) {
    const file = fs.readFileSync(`./cache/${scholarId}.json`, "utf8");
    const author = JSON.parse(file);
    resp.send(author);
  } else {
    resp.send({ error: "error" });
  }
});

app.use("/", router);
