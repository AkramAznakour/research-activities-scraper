const puppeteer = require("puppeteer");
const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const platform = "scopus";
const SCOPUS_SEARCH_URL =
  "https://www.scopus.com/results/authorNamesList.uri?sort=count-f" +
  "&src=al" +
  "&sid=ea647886136e8ebb1b9b68f063130655" +
  "&sot=al" +
  "&sdt=al" +
  "&sl=21" +
  "&s=AUTHLASTNAME%28lachgar%29" +
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
      authorName.split(" ").length > 1
        ? "&st1=" +
          authorName.split(" ")[0] +
          "&st2=" +
          authorName.split(" ")[1].replace(" ", "%20")
        : "&st1=" + authorName.split(" ")[0];

    await page.goto(SCOPUS_SEARCH_URL + params, DIRECT_NAVIGATION_OPTIONS);
   
    await page.waitForSelector("#srchResultsList", {
      timeout: 1000,
    });
    
    const authors = await page.evaluate(() => {
      const fildsToProperties = (array) => ({
        name: array[0].split('\n')[0],
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

      console.log(htmlAuthors.length);
      const authors = htmlAuthors.map((a) => {
        const htmlFilds = [...a.querySelectorAll("td")];
        const fildesArray = htmlFilds.map((b) => b.textContent.trim());
        const link = a.querySelector("a") ? a.querySelector("a").href : "";
        const authorId = link.includes("authorID")
          ? link
              .split("&")
              .filter((a) => a.indexOf("authorID=") != -1)[0]
              .split("=")[1]
          : "";

        return {
          authorId,
          ...fildsToProperties(fildesArray),
          profilePicture: "",
          interests: [],
          link,
        };
      });

      return authors.filter(({ authorId }) => authorId);
    });

    return {
      authors: authors.map((author) => ({ ...author, platform })),
    };
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
  authorSearch: performanceWrapping(authorSearch),
};
