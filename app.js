const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const scraper = require("./scraper");

const app = express();
app.use(express.json());
app.use(cors());

app.listen(process.env.PORT || 2000, () => {
console.log("Server started on port :", process.env.PORT || 2000);
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


app.use("/", router);
