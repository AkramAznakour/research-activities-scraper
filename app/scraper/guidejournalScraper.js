const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const GUIDE_JOURNAL_URL = "https://guidejournal.net/";

const DIRECT_NAVIGATION_OPTIONS = {
  waitUntil: "load",
  timeout: 0,
};

const journalData = async ({ journalName }) => {
  const { browser, page } = await setupBrowserPage({
    allowedRequests: [""],
  });

  try {
    await page.goto(
      `${GUIDE_JOURNAL_URL}query?searchValue=${journalName}`,
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

    const journal = await page.evaluate(async () => {
      try {
        const list = [...document.querySelectorAll(".col-md-8 .col-sm-6 h6")];

        if (!list || list.length == 0) throw "Exception : list.length == 0";

        const arrayData = list.map((element) => {
          const data = [...element.getElementsByTagName("span")].map((span) =>
            span.textContent.replace(":", "").trim()
          );
          return { [data[0]]: data[1] };
        });

        return arrayData.reduce(
          (accumulator, currentValue) => ({
            ...accumulator,
            ...currentValue,
          }),
          {}
        );
      } catch (error) {
        console.error(error);
        return null;
      }
    });

    if (!journal) throw "Exception : No journal data ";

    return { journal };
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
