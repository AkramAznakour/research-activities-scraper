const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");
const DIRECT_NAVIGATION_OPTIONS = {
  waitUntil: "load",
  timeout: 0,
};
const journalData = async ({ journalName, year }) => {
};

module.exports = {
  journalData: performanceWrapping(journalData),
};
