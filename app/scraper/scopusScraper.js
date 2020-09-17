const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const PLATFORM = "scopus";
const SCOPUS_PROFILE_URL = "https://www.scopus.com/authid/detail.uri?";

const SCOPUS_SEARCH_URL =
  "https://www.scopus.com/results/authorNamesList.uri?sort=count-f" +
  "&src=al" +
  "&sid=ea647886136e8ebb1b9b68f063130655" +
  "&sot=al" +
  "&sdt=al" +
  "&sl=44" +
  "&orcidId=" +
  "&selectionPageSearch=anl" +
  "&reselectAuthor=false" +
  "&activeFlag=true" +
  "&showDocument=false" +
  "&resultsPerPage=20" +
  "&offset=1" +
  "&jtp=false" +
  "&currentPage=1" +
  "&previousSelectionCount=0" +
  "&tooManySelections=false" +
  "&previousResultCount=0" +
  "&authSubject=LFSC" +
  "&authSubject=HLSC" +
  "&authSubject=PHSC" +
  "&authSubject=SOSC" +
  "&exactAuthorSearch=false" +
  "&showFullList=false" +
  "&authorPreferredName=" +
  "&origin=searchauthorfreelookup" +
  "&affiliationId=" +
  "&txGid=da4b13b8b82d35f517bbdfe31d48fe71";

const DIRECT_NAVIGATION_OPTIONS = {
  waitUntil: "load",
  timeout: 0,
};

const authorSearch = async ({ authorName }) => {
  const { browser, page } = await setupBrowserPage({
    allowedRequests: [],
  });

  try {
    const params =
      authorName.trim().split(" ").length > 1
        ? "&st1=" +
          authorName.split(" ")[0] +
          "&st2=" +
          authorName.split(" ")[1].replace(" ", "%20")
        : "&st1=" + authorName.split(" ")[0];

    await page.goto(SCOPUS_SEARCH_URL + params, DIRECT_NAVIGATION_OPTIONS);

    if (process.env.DEBUG == "true") {
      const fileName = Date.now() + ".png";
      console.log("screenshot : ", fileName);
      await page.screenshot({
        path: "./public/screenshots/" + fileName,
        fullPage: true,
      });
    }

    await page.waitForSelector("#srchResultsList", {
      timeout: 2000,
    });

    if (process.env.DEBUG == "true") {
      const fileName = Date.now() + ".png";
      console.log("screenshot : ", fileName);
      await page.screenshot({
        path: "./public/screenshots/" + fileName,
        fullPage: true,
      });
    }

    const authors = await page.evaluate(() => {
      const fieldsToProperties = (array) => ({
        name: array[0].split("\n")[0],
        documents: array[1],
        hIndex: array[2],
        affiliation: array[3],
        city: array[4],
        territory: array[5],
      });

      const htmlAuthors = [
        ...document
          .getElementById("srchResultsList")
          .querySelectorAll("tr.searchArea"),
      ];

      const authors = htmlAuthors.map((a) => {
        const htmlFields = [...a.querySelectorAll("td")];
        const fieldsArray = htmlFields.map((b) => b.textContent.trim());
        const link = a.querySelector("a") ? a.querySelector("a").href : "";
        const authorId = link.includes("authorID")
          ? link
              .split("&")
              .filter((a) => a.indexOf("authorID=") != -1)[0]
              .split("=")[1]
          : "";

        return {
          authorId,
          ...fieldsToProperties(fieldsArray),
          profilePicture: "",
          interests: [],
          link,
        };
      });

      return authors.filter(({ authorId }) => authorId);
    });

    return {
      authors: authors.map((author) => ({ ...author, platform: PLATFORM })),
    };
  } catch (error) {
    console.error(error);
    return { error };
  } finally {
    await page.close();
    await browser.close();
  }
};

const authorData = async ({ authorId }) => {
  const { browser, page } = await setupBrowserPage({
    allowedRequests: ["xhr", "script", "fetch"],
  });

  try {
    await page.goto(
      SCOPUS_PROFILE_URL + "authorId=" + authorId,
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

    await page.waitForSelector(".highcharts-root path");

    let author = await page.evaluate(() => {
      const infosHtml = document.querySelector(".authInfoSection");
      const name = infosHtml.querySelector("h2").textContent.replace(",", "");
      const university = infosHtml
        .querySelector("#affilCountryText li")
        .innerText.replace("View more", "")
        .trim();

      const interests = [
        ...infosHtml.querySelectorAll("#subjectAreaBadges span"),
      ]
        .map((i) => i.textContent)
        .map((i) => i.trim())
        .filter((i) => i !== "")
        .filter((i) => !i.toLowerCase().includes("view all"));
      const publications = [
        ...document.querySelectorAll("#srchResultsList tr "),
      ]
        .map((tr) =>
          [...tr.querySelectorAll("td")].map((span) => span.textContent.trim())
        )
        .filter((sections) => sections.length > 2)
        .map((publication) => ({
          title: publication[0] ? publication[0].replace(/\n/g, "") : null,
          source: publication[3] ? publication[3].split("\n")[0] : null,
          citation: publication[4],
          year: publication[2],
          authors: publication[1].match(/[^,]+,[^,]+/g),
        }))
        .filter(({ title }) => title);

      const citationsPerYear = [
        ...document.querySelectorAll(".highcharts-root path"),
      ]
        .filter((a) => a.attributes["aria-label"])
        .map((a) =>
          a.attributes["aria-label"].textContent
            .split(/[ ,]+/)
            .map((a) => a.replace(".", ""))
        ).map((a) => ({ year: a[1], citations: a[2] }));

      const indexes = [
        {
          name: "citations",
          total: document.querySelector("#totalCiteCount").textContent,
          lastFiveYears: citationsPerYear.reduce(
            (a, b) => a + parseInt(b["citations"] || 0),
            0
          ),
        },
        {
          name: "h-index",
          total: document.querySelector(
            "#authorDetailsHindex > div.panel-body > div > span"
          ).textContent,
          lastFiveYears: "",
        },
      ];

      return {
        name,
        profilePicture: "",
        university,
        email: "",
        indexes,
        interests,
        publications,
        coauthors: [],
        citationsPerYear,
      };
    });

    if (!author) throw "Exception : No author data";

    return { author: { authorId, platform: PLATFORM, ...author } };
  } catch (error) {
    console.error(error);
    return { error };
  } finally {
    await page.close();
    await browser.close();
  }
};

module.exports = {
  authorSearch: performanceWrapping(authorSearch),
  authorData: performanceWrapping(authorData),
};
