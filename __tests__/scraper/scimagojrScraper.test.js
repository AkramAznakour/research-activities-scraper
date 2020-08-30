const scimagojrScraper = require("../../app/scraper/scimagojrScraper");

describe("SJR", () => {
  it("should be able to get the next year if year not exist ", async () => {
    const search = {
      journalName: "Journal of Theoretical and Applied Information Technology",
      year: "2009",
      SJR: "0.111",
    };

    const { journalName, year, SJR } = search;
    const result = await scimagojrScraper.journalData({
      journalName,
      year,
    });

    expect(result.journal.SJR).toEqual(SJR);
  }, 100000);

  it("should get the right year if exist ", async () => {
    const search = [
      {
        journalName:
          "Journal of Theoretical and Applied Information Technology",
        year: "2019",
        SJR: "0.229",
      },
      {
        journalName:
          "Journal of Theoretical and Applied Information Technology",
        year: "2018",
        SJR: "0.166",
      },
      {
        journalName:
          "Journal of Theoretical and Applied Information Technology",
        year: "2013",
        SJR: "0.175",
      },
    ];

    for (const journal of search) {
      const { journalName, year, SJR } = journal;
      const result = await scimagojrScraper.journalData({
        journalName,
        year,
      });
      expect(result.journal.SJR).toEqual(SJR);
    }
  }, 100000);
});
