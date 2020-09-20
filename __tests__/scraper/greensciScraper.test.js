const greensciScraper = require("../../app/scraper/greensciScraper");

describe("should be able to fetch journal impact factor from clarivate", () => {
  it("should be able to get the IF of 2018 if year not exist ", async () => {
    const search = {
      journalName: "Mobile Information Systems",
      year: "2018",
      IF: "1.635",
    };

    const result = await greensciScraper.journalData({
      ...search,
    });

    expect(result.journal.IF).toBe(search.IF);
  }, 100000);

  it("Should skip special characters", async () => {
    const search = {
      journalName:
        "International Journal of Industrial Engineering : Theory Applications and Practice",
      year: "2018",
      IF: "0.532",
    };

    const result = await greensciScraper.journalData({
      ...search,
    });

    expect(result.journal.IF).toBe(search.IF);
  }, 100000);
});
