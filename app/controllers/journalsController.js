const { scimagojrScraper } = require("../scraper");

const journalData = async (req, resp) => {
  const { journalName, year } = req.params;

  if (!journalName) {
    resp.status(200).send({ error: "No journal name" });
    return;
  }
  const journal = await scimagojrScraper.journalData({
    journalName,
    year,
  });

  if (journal.journal) resp.send({ journal: journal.journal });
  else if (journal.error) {
    resp.status(200).send({ error: journal.error });
  } else {
    resp.status(500).send({ error: "Unhandled error" });
  }
};

module.exports = { journalData };
