const fs = require("fs");
const { scholarScraper, scopusScraper } = require("./../scraper");
var getDirName = require("path").dirname;

const AUTHOR_STORAGE_PATH = "app/storage/authors/";

const authorSearch = async (req, resp) => {
  const { authorName } = req.params;

  if (!authorName) {
    resp.status(200).send({ error: "No author name" });
    return;
  }

  const scholarAuthors = await scholarScraper.authorSearch({ authorName });
  const scopusAuthors = await scopusScraper.authorSearch({ authorName });

  if (scholarAuthors.authors && scopusAuthors.authors) {
    const authors = [...scholarAuthors.authors, ...scopusAuthors.authors];
    resp.send({ authors });
  }

  if (scholarAuthors.error || scopusAuthors.error) {
    resp.status(200).send({ error: "No scholar id" });
  }
};

const author = async (req, resp) => {
  const { platform, authorId } = req.params;

  if (!authorId) {
    resp.status(200).send({ error: "No scholar id" });
    return;
  }

  if (
    process.env.USING_STORED_AUTHOR_DATA &&
    process.env.USING_STORED_AUTHOR_DATA === "true"
  ) {
    if (fs.existsSync(`${AUTHOR_STORAGE_PATH}/${authorId}.json`)) {
      const file = fs.readFileSync(`${AUTHOR_STORAGE_PATH}/${authorId}.json`, "utf8");
      const author = JSON.parse(file);
      console.log(author.publications.length);
      resp.send({author});
      return;
    }
  }

  const scrapingResult =
    platform === "scholar"
      ? await scholarScraper.authorData({ authorId })
      : platform === "scopus"
      ? await scopusScraper.authorData({ authorId })
      : { error: "unsupported platform" };

  if (scrapingResult.author) {
    const { author } = scrapingResult;

    resp.send({ author });

    if (
      process.env.STORING_AUTHORS_DATA &&
      process.env.STORING_AUTHORS_DATA === "true"
    )
    console.log("here");
      fs.writeFileSync(
        `${AUTHOR_STORAGE_PATH}/${authorId}.json`,
        JSON.stringify(author)
      );
  } else if (scrapingResult.error) {
    const { error } = scrapingResult;
    resp.status(200).send({ error });
  } else {
    resp.send({ error: "unkonwn issue" });
  }
};

module.exports = { authorSearch, author };
