const puppeteer = require("puppeteer");

const allRequestsTypes = [
  "stylesheet",
  "image",
  "media",
  "font",
  "script",
  "texttrack",
  "xhr",
  "fetch",
  "eventsource",
  "websocket",
  "manifest",
  "other",
];

const setupBrowserPage = async ({ allowedRequests }) => {
  const browser =
    process.env.USE_DEVTOOLS == "true"
      ? await puppeteer.launch({ devtools: true })
      : await puppeteer.launch({ args: ["--no-sandbox"] });

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  // Pass the User-Agent Test.
  const userAgent =
    "Mozilla/5.0 (X11; Linux x86_64)" +
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36";
  await page.setUserAgent(userAgent);
  
  if (process.env.DEBUG == true)
    page.setViewport({ width: "1200", height: "1000" });

  if (process.env.DEBUG == true)
    page.setViewport({ width: "1200", height: "1000" });

  const forbiddenRequestsTypes = allRequestsTypes.filter(
    (requestType) => !allowedRequests.includes(requestType)
  );

  page.on("request", (request) =>
    forbiddenRequestsTypes.includes(request.resourceType())
      ? request.abort()
      : request.continue()
  );

  return { browser, page };
};

exports.setupBrowserPage = setupBrowserPage;
