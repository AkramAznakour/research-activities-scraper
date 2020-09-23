const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const GREENSCI_SEARCH_URL = "http://www.greensci.net/search?";

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

    const trimJournalName = (journalName) =>
      journalName.toLowerCase().replace(/[-_: #]/g, "").replace("&","and");

    const ExactNameJournals = matchingJournals.filter(
      (journal) =>
        trimJournalName(journal.name) === trimJournalName(journalName)
    );

    if (ExactNameJournals.length == 0)
      throw new Error("journal not in  matching journals");

    const IFS = Object.keys(ExactNameJournals[0])
      .filter((a) => /^[0-9]/.test(a))
      .map((y) => ({
        year: y,
        IF: ExactNameJournals[0][y],
      }))
      .filter((a) => a.IF.trim() !== "")
      .sort((a, b) => (parseInt(a.year) < parseInt(b.year) ? 1 : -1))
      .sort(
        (a, b) =>
          Math.abs(parseInt(a.year) - parseInt(year)) -
          Math.abs(parseInt(b.year) - parseInt(year))
      );

    const IF = IFS[0].IF;

    return { journal: { IF } };
  } catch (error) {
    return { journal: { error } };
  } finally {
    await browser.close();
  }
};

module.exports = {
  journalData: performanceWrapping(journalData),
};
