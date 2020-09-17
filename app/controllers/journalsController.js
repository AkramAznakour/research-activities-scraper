const { scimagojrScraper, greensciScraper } = require("../scraper");

const journalData = async (req, resp) => {
  const { journalName, year } = req.params;

  if (!journalName) {
    resp.status(200).send({ error: "No journal name" });
    return;
  }
  
  const scimagojrResult = await scimagojrScraper.journalData({
    journalName,
    year,
  });

  const clarivateResult = await greensciScraper.journalData({
    journalName,
    year,
  });

  if (scimagojrResult.journal.SJR || clarivateResult.journal.IF)
    resp.send({
      journal: {
        SJR: scimagojrResult.journal.SJR ? scimagojrResult.journal.SJR : "",
        IF: clarivateResult.journal.IF ? clarivateResult.journal.IF : "",
      },
    });
  else if (journal.error) {
    resp.status(200).send({ error: journal.error });
  } else {
    resp.status(500).send({ error: "Unhandled error" });
  }
};

module.exports = { journalData };
