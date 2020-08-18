const puppeteer = require("puppeteer-extra");

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

const setupBrowserPage = async ({ allowedRequests }) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  if (process.env.DEBUG == true)
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

  await page.mouse.move(100, 100);
  await page.mouse.down();
  await page.mouse.move(200, 200);
  await page.mouse.up();

  return { browser, page };
};

exports.setupBrowserPage = setupBrowserPage;
