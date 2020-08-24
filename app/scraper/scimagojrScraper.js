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
};

module.exports = {
  journalData: performanceWrapping(journalData),
};
