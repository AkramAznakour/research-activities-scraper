const { guidejournalScraper } = require("../scraper");

const journalData = async (req, resp) => {
  const { journalName } = req.params;

  console.log("journalName:", journalName);
  if (!journalName) {
    resp.status(200).send({ error: "No journal name" });
    return;
  }
  const journal = await guidejournalScraper.journalData({
    journalName,
  });

  if (journal.journal) resp.send({ journal: journal.journal });
  else if (journal.error) {
    resp.status(200).send({ error: "No journal data" });
  } else {
    resp.status(500).send({ error: "Unhandled error" });
  }
};

module.exports = { journalData };
