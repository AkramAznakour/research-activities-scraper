const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const SCIMAGOJR_URL = "https://www.scimagojr.com/journalsearch.php?";
const POSSIBLE_JOURNALS_SELECTOR =
  "body > div.journaldescription.colblock > div.search_results > a";
const SJR_LIST_SELECTOR =
  "body > div.dashboard > div:nth-child(2) > div.cellcontent > div:nth-child(2) > table > tbody > tr";

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

    if (process.env.DEBUG == "true") {
      const fileName = Date.now() + ".png";
      console.log("screenshot : ", fileName);
      await page.screenshot({
        path: "./public/screenshots/" + fileName,
        fullPage: true,
      });
    }

    const matchingJournal = await page.evaluate(
      async (journalName, POSSIBLE_JOURNALS_SELECTOR) => {
        const trimJournalName = ({ journalName }) =>
          journalName.toLocaleLowerCase().replace(".", "").trim();

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

    await page.goto(matchingJournal.link, DIRECT_NAVIGATION_OPTIONS);

    const SJR = await page.evaluate(
      async (year, SJR_LIST_SELECTOR) => {
        try {
          const results = [...document.querySelectorAll(SJR_LIST_SELECTOR)]
            .map((a) => [...a.querySelectorAll("td")])
            .map((a) => ({ year: a[0].textContent, sjr: a[1].textContent }))
            .filter((result) => result.year === year);

          if (results.length === 0) return null;
          else return results[0].sjr;
          
        } catch (error) {
          console.error(error);
          return { error };
        }
      },
      year,
      SJR_LIST_SELECTOR
    );

    return { journal: { SJR } };
  } catch (error) {
    console.error(error);
    return { error };
  } finally {
    await page.close();
    console.log("Finally : Page closed");
    await browser.close();
    console.log("Finally : Browser closed");
  }
};

module.exports = {
  journalData: performanceWrapping(journalData),
};
