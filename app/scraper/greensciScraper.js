const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const GREENSCI_SEARCH_URL = "https://www.greensci.net/search?";

const DIRECT_NAVIGATION_OPTIONS = {
  waitUntil: "load",
  timeout: 0,
};

const journalData = async ({ journalName, year }) => {
  const { browser, page } = await setupBrowserPage({
    allowedRequests: [],
  });

  try {
    await page.goto(
      GREENSCI_SEARCH_URL + "kw=" + journalName,
      DIRECT_NAVIGATION_OPTIONS
    );

    const matchingJournals = await page.evaluate(async () =>
      [...document.querySelector("tbody").querySelectorAll("tr")]
        .map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent))
        .filter((array) => array.length > 4)
        .map((array) => ({
          issn: array[0],
          name: array[1].split("   ")[1].trim(),
          2015: array[2],
          2016: array[3],
          2017: array[4],
          2018: array[5],
          2019: array[6],
        }))
    );

    if (matchingJournals.length === 0) throw new Error("no matching journals");

    const ExactNameJournals = matchingJournals.filter(
      (journal) => journal.name.toLowerCase() === journalName.toLowerCase()
    );

    if (ExactNameJournals.length == 0)
      throw new Error("journal not in  matching journals");

    const journal = ExactNameJournals[0];

    const IF = journal[year];

    return { journal: { IF } };
  } catch (error) {
    console.error(error);
    return { journal: { error } };
  } finally {
    await page.close();
    await browser.close();
  }
};

module.exports = {
  journalData: performanceWrapping(journalData),
};
