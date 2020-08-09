const { scholarScraper } = require("./../scraper");

const publicationData = async (req, resp) => {
  const { authorId, publicationName } = req.params;

  if (!authorId || !publicationName) {
    resp.status(200).send({ error: "No author id or no publication name" });
    return;
  }
  const scholarPublication = await scholarScraper.publicationData({
    authorId,
    publicationName,
  });

  if (scholarPublication.publication)
    resp.send({ publication: scholarPublication.publication });
  else if (scholarPublication.error) {
    resp.status(200).send({ error: "No publicatoin data" });
  } else {
    resp.status(500).send({ error: "Unhandled error" });
  }
};

module.exports = { publicationData };
