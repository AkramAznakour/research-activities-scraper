const clarivateScraper = require("../../app/scraper/clarivateScraper");

describe("should be able to fetch journal impact factor from clarivate", () => {
  it("should be able to get the IF of 2018 if year not exist ", async () => {
    const search = {
      journalName: "Mobile Information Systems",
      year: "2018",
      IF: "1.635",
    };

    const result = await clarivateScraper.journalData({
      ...search,
    });

    expect(result.journal.IF).toBe(search.IF);
  }, 100000);

  it("should return null incase of no data ", async () => {
    const search = {
      journalName: "Communications in Computer and Information Science",
      year: "2018",
    };

    const result = await clarivateScraper.journalData({
      ...search,
    });
    expect(result.journal.IF).toBe(undefined);
  }, 100000);
});
