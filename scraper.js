const puppeteer = require("puppeteer");
const { performance } = require("perf_hooks");

const guideJournalURL = "https://guidejournal.net/";
const scholarBaseUrl = "https://scholar.google.com/citations?";
const profilesSearchURL = scholarBaseUrl + "view_op=search_authors&mauthors=";

const performanceWrapping = (jobFunction) => async (...args) => {
  const t0 = performance.now();
  const result = await jobFunction(args);
  const t1 = performance.now();
  console.log("calling :", jobFunction.name);
  console.log("args :", args);
  console.log("took :", parseInt(t1 - t0), "ms \n");
  return result;
};

const authorSearch = async ([authorName]) => {
  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    //browser = await puppeteer.launch({ devtools: true });
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    const forbiddenRequests = [
      "image",
      "stylesheet",
      "font",
      "script",
      "other",
    ];

    page.on("request", (request) =>
      forbiddenRequests.indexOf(request.resourceType()) !== -1
        ? request.abort()
        : request.continue()
    );

    await page.goto(profilesSearchURL + authorName, {
      waitUntil: "load",
      timeout: 0,
    });

    const possibleAuthors = await page.evaluate(() => {
      const possibleAuthorHtmlToObject = (possibleAuthorHtml) => {
        const profilePicture = possibleAuthorHtml.querySelector("img").src;
        const link = possibleAuthorHtml.querySelector("a").href;
        const name = possibleAuthorHtml.querySelector("h3").textContent;
        const interestsHtml = [
          ...possibleAuthorHtml.querySelectorAll("div > a"),
        ];

        const interests = interestsHtml
          .map((interest) => interest.textContent)
          .filter((interest) => interest.length);

        const scholarId = link
          .split("&")
          .filter((a) => a.indexOf("user=") != -1)[0]
          .split("=")[1];

        return { scholarId, name, link, profilePicture, interests };
      };

      const possibleAuthorsHtml = [
        ...document.querySelectorAll("div.gsc_1usr"),
      ];
      return possibleAuthorsHtml.map(possibleAuthorHtmlToObject);
    });

    await browser.close();

    if (possibleAuthors.length > 0) return possibleAuthors;
  } catch (error) {
    console.error({ error }, "Something happened!");
    browser.close();
    return { error: "No result", line: 175 };
  }
};

const getAuthorData = async ([scholarId]) => {
  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    //browser = await puppeteer.launch({ devtools: true });
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    const forbiddenRequests = [
      "image",
      "stylesheet",
      "font",
      "script",
      "other",
    ];

    page.on("request", (request) =>
      forbiddenRequests.indexOf(request.resourceType()) !== -1
        ? request.abort()
        : request.continue()
    );

    console.log(scholarId);

    await page.goto(scholarBaseUrl + "user=" + scholarId, {
      waitUntil: "load",
      timeout: 0,
    });

    while ((await page.$("button#gsc_bpf_more[disabled]")) == null) {
      await page.click("button#gsc_bpf_more");
      await page.waitFor(300);
      console.log("fetching next page");
    }

    const author = await page.evaluate(() => {
      const profilePicture = document.querySelector("#gsc_prf_w img").src;
      const bioHtml = document.getElementById("gsc_prf_i");
      const name = bioHtml.childNodes[0].textContent;
      const university = bioHtml.childNodes[1].textContent;
      const email = bioHtml.childNodes[2].textContent;
      const interestsHtml = bioHtml.childNodes[3].childNodes;
      const interests = [...interestsHtml].map((a) => a.textContent);

      const publications = [
        ...document.querySelectorAll("tbody tr.gsc_a_tr"),
      ].map((td) => {
        const title = td.childNodes[0].childNodes[0].textContent;
        const citation = td.childNodes[1].textContent;
        const year = td.childNodes[2].textContent;
        const authors = td.childNodes[0].childNodes[1].textContent
          .split(",")
          .map((a) => a.trim());

        return { title, authors, citation, year };
      });

      const indexes = [
        ...document.querySelectorAll("#gsc_rsb_st tbody tr"),
      ].map((tr) => ({
        name: tr.childNodes[0].textContent,
        total: tr.childNodes[1].textContent,
        lastFiveYears: tr.childNodes[2].textContent,
      }));

      const coauthors = [...document.querySelectorAll("div#gsc_rsb_co li")].map(
        (li) => ({
          name: li.getElementsByTagName("a")[0].textContent,
          profilePicture: li.getElementsByTagName("img")[0].src,
          bio: li.getElementsByTagName("a")[0].nextSibling.textContent,
        })
      );

      const citations = [
        ...document.querySelectorAll("div.gsc_md_hist_b > span"),
      ].map((span) => span.textContent);

      const citationsYears = [
        ...document.querySelectorAll("div.gsc_md_hist_b > a"),
      ].map((span) => span.textContent);

      const citationsPerYear = citations.map((citationsCount, index) => ({
        year: citationsYears[index],
        citations: citationsCount,
      }));

      return {
        name,
        profilePicture,
        university,
        email,
        indexes,
        interests,
        publications,
        coauthors,
        citationsPerYear,
      };
    });

    await browser.close();

    if (author) return { scholarId, ...author };
  } catch (error) {
    console.error({ error }, "Something happened!");
    browser.close();
    return { error: "No result", line: 175 };
  }
};

const getPublicationData = async ([scholarId, publicationName]) => {
  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    //browser = await puppeteer.launch({ devtools: true });
    const page = await browser.newPage();

    const forbiddenRequests = [
      "image",
      "stylesheet",
      "font",
      "script",
      "other",
    ];

    page.on("request", (request) =>
      forbiddenRequests.indexOf(request.resourceType()) !== -1
        ? request.abort()
        : request.continue()
    );

    await page.goto(scholarBaseUrl + "&hl=en&user=" + scholarId, {
      waitUntil: "load",
      timeout: 0,
    });

    const [a] = await page.$x("//a[contains(., '" + publicationName + "')]");
    if (a) await a.click();
    await page.waitFor(300);

    const sections = await page.evaluate(() =>
      [...document.querySelectorAll("#gsc_ocd_bdy div.gs_scl")]
        .map((div) => ({
          name: div.querySelector(".gsc_vcd_field").textContent,
          value: div.querySelector(".gsc_vcd_value").textContent,
        }))
        .filter(({ name }) => name == "Journal")
    );

    if (sections.length == 0) {
      if (browser) await browser.close();
      return { error: "No result", line: 190 };
    }

    const journalName = sections[0].value;

    await page.goto(`${guideJournalURL}query?searchValue=${journalName}`, {
      waitUntil: "load",
      timeout: 0,
    });

    const publicationData = await page.evaluate(async () => {
      const cards = [
        ...document.querySelectorAll("div.col-md-8 > div.card-body"),
      ];

      if (cards.length == 0) {
        await browser.close();
        return { error: "No result", line: 235 };
      }

      const list = [...document.querySelectorAll(".col-md-8 .col-sm-6 h6 ")];

      if (list.length == 0) {
        await browser.close();
        return { error: "No result", line: 242 };
      }

      const arrayData = list.map((element) => {
        const data = [...element.getElementsByTagName("span")].map((span) =>
          span.textContent.replace(":", "").trim()
        );
        return { [data[0]]: data[1] };
      });

      const data = arrayData.reduce((accumulator, currentValue) => ({
        ...accumulator,
        ...currentValue,
      }));

      return data;
    });

    await browser.close();

    return publicationData;
  } catch (error) {
    console.error({ error }, "Something happened!");
    browser.close();

    return { error: "No result", line: 267 };
  }
};

const getPublicationDetails = async ([scholarId, publicationName]) => {
  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    //browser = await puppeteer.launch({ devtools: true });
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    const forbiddenRequests = ["image", "stylesheet", "font", "other"];

    page.on("request", (request) =>
      forbiddenRequests.indexOf(request.resourceType()) !== -1
        ? request.abort()
        : request.continue()
    );

    await page.goto(scholarBaseUrl + "user=" + scholarId, {
      waitUntil: "load",
      timeout: 0,
    });

    const [a] = await page.$x("//a[contains(., '" + publicationName + "')]");
    if (a) await a.click();
    await page.waitFor(300);

    const sections = await page.evaluate(() =>
      [...document.querySelectorAll("#gsc_ocd_bdy div.gs_scl")].map((div) => ({
        name: div.querySelector(".gsc_vcd_field").textContent,
        value: div.querySelector(".gsc_vcd_value").textContent,
      }))
    );

    await browser.close();

    return sections;
  } catch (error) {
    console.error({ error }, "Something happened!");
    browser.close();
    return { error: "No result", line: 308 };
  }
};

module.exports = {
  authorSearch: performanceWrapping(authorSearch),
  getAuthorData: performanceWrapping(getAuthorData),
  getPublicationData: performanceWrapping(getPublicationData),
  getPublicationDetails: performanceWrapping(getPublicationDetails),
};
