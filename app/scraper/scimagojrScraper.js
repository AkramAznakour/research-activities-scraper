const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const SCIMAGOJR_URL = "https://www.scimagojr.com/journalsearch.php?";
const POSSIBLE_JOURNALS_SELECTOR =
  "body > div.journaldescription.colblock > div.search_results > a";
const SJR_LIST_SELECTOR =
  "body > div.dashboard > div:nth-child(2) > div.cellcontent > div:nth-child(2) > table > tbody > tr";
const PUBLICATION_TYPE_SELECTOR =
  "body > div.journaldescription.colblock > table > tbody > tr:nth-child(4) > td:nth-child(2)";

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
      `${SCIMAGOJR_URL}q=${journalName}`,
      DIRECT_NAVIGATION_OPTIONS
    );

    const matchingJournal = await page.evaluate(
      async (journalName, POSSIBLE_JOURNALS_SELECTOR) => {
        const trimJournalName = ({ journalName }) =>
          journalName.toLowerCase().replace(/[-_: #]/g, "");
        try {
          const possibleJournals = [
            ...document.querySelectorAll(POSSIBLE_JOURNALS_SELECTOR),
          ].map((a) => ({
            link: a.href,
            name: a.querySelector("span").textContent,
          }));

          const matchingJournals = possibleJournals.filter(({ name }) => {
            return (
              trimJournalName({ journalName }) ===
              trimJournalName({ journalName: name })
            );
          });

          if (matchingJournals.length === 0) return null;
          else return matchingJournals[0];
        } catch (error) {
          return error;
        }
      },
      journalName,
      POSSIBLE_JOURNALS_SELECTOR
    );

    if (matchingJournal && matchingJournal.link)
      await page.goto(matchingJournal.link, DIRECT_NAVIGATION_OPTIONS);
    else return { error: matchingJournal };

    const publicationType = await page.evaluate(
      async (PUBLICATION_TYPE_SELECTOR) =>
        document.querySelector(PUBLICATION_TYPE_SELECTOR).textContent,
      PUBLICATION_TYPE_SELECTOR
    );

    if (publicationType.toLocaleLowerCase().includes("conference"))
      return { error: "conference" };

    const SJR = await page.evaluate(
      async (year, SJR_LIST_SELECTOR) => {
        try {
          const results = [...document.querySelectorAll(SJR_LIST_SELECTOR)]
            .map((a) => [...a.querySelectorAll("td")])
            .filter((tds) => tds.length === 2)
            .map((a) => ({ year: a[0].textContent, sjr: a[1].textContent }))
            .sort((a, b) => (parseInt(a.year) < parseInt(b.year) ? 1 : -1))
            .sort(
              (a, b) =>
                Math.abs(parseInt(a.year) - parseInt(year)) -
                Math.abs(parseInt(b.year) - parseInt(year))
            );
          if (results.length === 0) return null;
          else return results[0].sjr;
          
        } catch (error) {
          return { error };
        }
      },
      year,
      SJR_LIST_SELECTOR
    );

    return { journal: { SJR } };
  } catch (error) {
    return { error };
  } finally {
    await page.close();
    await browser.close();
  }
};

module.exports = {
  journalData: performanceWrapping(journalData),
};
