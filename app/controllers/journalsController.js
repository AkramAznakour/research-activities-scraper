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

  const greensciResult = await greensciScraper.journalData({
    journalName,
    year,
  });

  if (
    (scimagojrResult.journal && scimagojrResult.journal.SJR) ||
    (greensciResult.journal && greensciResult.journal.IF)
  )
    resp.send({
      journal: {
        SJR:
          scimagojrResult.journal && scimagojrResult.journal.SJR
            ? scimagojrResult.journal.SJR
            : "",
        IF:
          greensciResult.journal && greensciResult.journal.IF
            ? greensciResult.journal.IF
            : "",
      },
    });
  else if (greensciResult.journal.error) {
    resp
      .status(200)
      .send({
        error: { ...scimagojrResult.journal, ...greensciResult.journal },
      });
  } else {
    resp.status(500).send({ error: "Unhandled error" });
  }
};

module.exports = { journalData };
