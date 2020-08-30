const { performanceWrapping } = require("./helper/performanceWrapping");
const { setupBrowserPage } = require("./helper/setupBrowserPage");

const PLATFORM = "scholar";
const SCHOLAR_BASE_URL = "https://scholar.google.com/citations?hl=en&";
const PROFILES_SEARCH_URL =
  SCHOLAR_BASE_URL + "view_op=search_authors&mauthors=";

const DIRECT_NAVIGATION_OPTIONS = {
  waitUntil: "load",
  timeout: 0,
};

const authorSearch = async ({ authorName }) => {
  const { browser, page } = await setupBrowserPage({ allowedRequests: [] });

  try {
    await page.goto(
      PROFILES_SEARCH_URL + authorName,
      DIRECT_NAVIGATION_OPTIONS
    );

    if (process.env.DEBUG == "true") {
      const fileName = Date.now() + ".png";
      console.log("screenshot : ", fileName);
      await page.screenshot({ path: "./public/screenshots/"+fileName ,fullPage: true });
    }

    const authors = await page.evaluate(() => {
      const authorHtmlToObject = (authorHtml) => {
        const profilePicture = authorHtml.querySelector("img").src;
        const link = authorHtml.querySelector("a").href;
        const name = authorHtml.querySelector("h3").textContent;
        const interestsHtml = [...authorHtml.querySelectorAll("div > a")];

        const interests = interestsHtml
          .map((interest) => interest.textContent)
          .filter((interest) => interest.length);

        const authorId = link
          .split("&")
          .filter((a) => a.indexOf("user=") != -1)[0]
          .split("=")[1];

        return { authorId, name, link, profilePicture, interests };
      };

      const authorsHtml = [...document.querySelectorAll("div.gsc_1usr")];

      return authorsHtml.map(authorHtmlToObject);
    });

    if (!authors || !authors.length) throw "Exception : No authors";

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
    allowedRequests: ["xhr", "script"],
  });

  try {
    await page.goto(
      SCHOLAR_BASE_URL + "user=" + authorId,
      DIRECT_NAVIGATION_OPTIONS
    );

    if (process.env.DEBUG == "true") {
      const fileName = Date.now() + ".png";
      console.log("screenshot : ", fileName);
      await page.screenshot({ path: "./public/screenshots/"+fileName ,fullPage: true });
    }

    while ((await page.$("button#gsc_bpf_more[disabled]")) == null) {
      await page.click("button#gsc_bpf_more");
      await page.waitFor(500);
    }

    let author = await page.evaluate(() => {
      const profilePicture = document.querySelector("#gsc_prf_w img").src;
      const bioHtml = document.getElementById("gsc_prf_i");
      const name = bioHtml.childNodes[0].textContent;
      const university = bioHtml.childNodes[1].textContent;
      const email = bioHtml.childNodes[2].textContent;
      const interestsHtml = bioHtml.childNodes[3].childNodes;
      const interests = [...interestsHtml].map((a) => a.textContent);

      let publications = [
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
        ...document.querySelectorAll("div.gsc_md_hist_b > a"),
      ].map((span) => span.textContent);

      const citationsYears = [
        ...document.querySelectorAll("div.gsc_md_hist_b > span"),
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

    if (!author) throw "Exception : No author data";

    const getPublicationExtraInformation = async ({ title }) => {
      const publicationNameQuery = title
        .replace("'", "@")
        .replace('"', "@")
        .split("@")[0];

      const [a] = await page.$x(
        "//a[contains(., '" + publicationNameQuery + "')]"
      );

      if (a) {
        await a.click();
        await page.waitForSelector("#gsc_ocd_bdy", {
          timeout: 1000,
        });
      } else {
        return {};
      }

      const extraInformation = await page.evaluate(() =>
        [...document.querySelectorAll("#gsc_ocd_bdy div.gs_scl")]
          .map((div) => {
            const name = div.querySelector(".gsc_vcd_field").textContent;
            const value = div.querySelector(".gsc_vcd_value").textContent;
            return {
              [name]: value,
            };
          })
          .reduce(
            (accumulator, currentValue) => ({
              ...accumulator,
              ...currentValue,
            }),
            {}
          )
      );

      await page.keyboard.press("Escape");
      await page.waitForSelector("#gsc_ocd_bdy", {
        timeout: 1000,
        visible: false,
      });
      return extraInformation;
    };

    for (let index = 0; index < author.publications.length; index++) {
      const publication = author.publications[index];
      try {
        const extraInformation = await getPublicationExtraInformation(
          publication
        );

        author.publications[index] = {
          ...publication,
          extraInformation,
        };
      } catch (error) {
        console.log({ error });
      }
    }

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
