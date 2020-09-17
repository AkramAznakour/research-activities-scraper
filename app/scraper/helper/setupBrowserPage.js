const puppeteer = require("puppeteer-extra");
const nativePuppeteer = require("puppeteer");

puppeteer.use(require("puppeteer-extra-plugin-stealth")());

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

const setupBrowserPage = async ({ allowedRequests, useNativePuppeteer }) => {
  const browser = useNativePuppeteer && useNativePuppeteer === true
      ? await nativePuppeteer.launch({
          args: ["--no-sandbox"],
          headless: true,
        })
      : await puppeteer.launch({
          args: ["--no-sandbox"],
          headless: true,
        });

  const page = await browser.newPage();
  await page.setRequestInterception(true);


  if (useNativePuppeteer && useNativePuppeteer === true )
    page.setViewport({ width: "1200", height: "1000" });

  await page.evaluateOnNewDocument(() => {
    const newProto = navigator.__proto__;
    delete newProto.webdriver;
    navigator.__proto__ = newProto;
  });

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
