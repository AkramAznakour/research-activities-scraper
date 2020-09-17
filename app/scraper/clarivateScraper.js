const jsonfile = require("jsonfile");
const fs = require("fs");

const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const CLARIVATE_LOGIN_URL = "https://mjl.clarivate.com/login";
const CLARIVATE_LOGIN_FRAME_URL =
  "https://access.clarivate.com/login?app=censub";
const JOURNAL_BUTTON_SELECTOR_FIRST_PART =
  "body > cdx-app > mat-sidenav-container > mat-sidenav-content > main > can-home-page > div > div > div > mat-sidenav-container > mat-sidenav-content > app-journal-search-results > div:nth-child(3) > div:nth-child(";
const JOURNAL_BUTTON_SELECTOR_SECOND_PART =
  ") > mat-card > mat-card-content:nth-child(4) > div > div > div:nth-child(1) > div:nth-child(2) > button";

const EMAIL_INPUT_SELECTOR = "#mat-input-0";
const PASSWORD_INPUT_SELECTOR = "#mat-input-1";
const CLARIVATE_ACCOUNT_EMAIL = "nearwired@gmail.com";
const CLARIVATE_ACCOUNT_PASSWORD = "F)HbUAr(E~M6^PP";
const LOGIN_BUTTON_SELECTOR =
  "body > microui-app > section > microui-base > div:nth-child(1) > div > base-login > div > div.login-body.login-widget > div:nth-child(1) > login > steam-login > form > div:nth-child(4) > div:nth-child(2) > button";
const SEARCH_INPUT_SELECTOR = "#search-box";
const SEARCH_BUTTON_SELECTOR = "#search-button";
const SEARCH_RESULT_CARD_SELECTOR =
  "body > cdx-app > mat-sidenav-container > mat-sidenav-content > main > can-home-page > div > div > div > mat-sidenav-container > mat-sidenav-content > app-journal-search-results > div:nth-child(3) > div";
const IF_VALUE_SPAN_SELECTOR = "#minicard-body-value-lg";
const SEARCH_RESULT_CARD_TITLE_SELECTOR = "mat-card-title";
const WRITE_COOKIES_OBJECT_ERROR_MESSAGE = "The file could not be written.";
const WRITE_COOKIES_OBJECT_SUCCESS_MESSAGE =
  "Session has been successfully saved";

const NO_MATCHING_JOURNALS_EXCEPTION_MESSAGE =
  "No matching journals in CLARIVATE";
const COOKIES_FILE_PATH = "./cookiesObject.json";

const DIRECT_NAVIGATION_OPTIONS = {
  waitUntil: "load",
  timeout: 0,
};

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 10);
    });
  });
};

const journalData = async ({ journalName, year }) => {
  const { browser, page } = await setupBrowserPage({
    allowedRequests: ["script", "xhr"],
    useNativePuppeteer: true,
  });

  try {
    const previousSession = fs.existsSync(COOKIES_FILE_PATH);
    if (previousSession) {
      // If file exist load the cookies
      const cookiesArr = require("../../cookiesObject.json");
      if (cookiesArr.length !== 0) {
        for (let cookie of cookiesArr) {
          await page.setCookie(cookie);
        }
        console.log("Session has been loaded in the browser");
      }
    }

    await page.goto(CLARIVATE_LOGIN_URL, DIRECT_NAVIGATION_OPTIONS);

    await autoScroll(page);

    const frame = page
      .frames()
      .find((frame) => frame.url() === CLARIVATE_LOGIN_FRAME_URL);

    await frame.waitForSelector(EMAIL_INPUT_SELECTOR);
    await frame.type(EMAIL_INPUT_SELECTOR, CLARIVATE_ACCOUNT_EMAIL);

    await frame.waitForSelector(PASSWORD_INPUT_SELECTOR);
    await frame.type(PASSWORD_INPUT_SELECTOR, CLARIVATE_ACCOUNT_PASSWORD);

    await frame.waitForSelector(LOGIN_BUTTON_SELECTOR);
    await frame.hover(LOGIN_BUTTON_SELECTOR);

    await autoScroll(page);

    await frame.click(LOGIN_BUTTON_SELECTOR);
    await page.waitForNavigation();

    await autoScroll(page);

    await page.waitForSelector(SEARCH_INPUT_SELECTOR);
    await page.type(SEARCH_INPUT_SELECTOR, journalName);

    await page.waitForSelector(SEARCH_BUTTON_SELECTOR);
    await page.hover(SEARCH_BUTTON_SELECTOR);
    await page.click(SEARCH_BUTTON_SELECTOR);

    await page.waitForNavigation();

    await page.waitForSelector(SEARCH_RESULT_CARD_SELECTOR);

    const matchingJournals = await page.evaluate(
      async (SEARCH_RESULT_CARD_SELECTOR, SEARCH_RESULT_CARD_TITLE_SELECTOR) =>
        [...document.querySelectorAll(SEARCH_RESULT_CARD_SELECTOR)].map(
          (cardHtml) => ({
            title: cardHtml.querySelector(SEARCH_RESULT_CARD_TITLE_SELECTOR)
              ? cardHtml.querySelector(SEARCH_RESULT_CARD_TITLE_SELECTOR)
                  .textContent
              : "",
          })
        ),
      SEARCH_RESULT_CARD_SELECTOR,
      SEARCH_RESULT_CARD_TITLE_SELECTOR
    );

    const results = matchingJournals
      .map((journal, index) => ({ ...journal, index }))
      .filter(
        ({ title }) =>
          title.toLowerCase().trim() === journalName.toLowerCase().trim()
      );

    if (results.length === 0)
      throw new Error(NO_MATCHING_JOURNALS_EXCEPTION_MESSAGE);

    const index = results[0].index + 1;

    const JOURNAL_BUTTON_SELECTOR =
      JOURNAL_BUTTON_SELECTOR_FIRST_PART +
      index +
      JOURNAL_BUTTON_SELECTOR_SECOND_PART;

    await page.waitForSelector(JOURNAL_BUTTON_SELECTOR);

    await page.hover(JOURNAL_BUTTON_SELECTOR);
    await page.click(JOURNAL_BUTTON_SELECTOR);

    await page.waitForSelector(IF_VALUE_SPAN_SELECTOR);

    const element = await page.$(IF_VALUE_SPAN_SELECTOR);

    const IF = await page.evaluate((element) => element.textContent, element);

    const cookiesObject = await page.cookies();
    jsonfile.writeFile(
      COOKIES_FILE_PATH,
      cookiesObject,
      { spaces: 2 },
      function (err) {
        if (err) {
          console.log(WRITE_COOKIES_OBJECT_ERROR_MESSAGE, err);
        }
        console.log(WRITE_COOKIES_OBJECT_SUCCESS_MESSAGE);
      }
    );

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
