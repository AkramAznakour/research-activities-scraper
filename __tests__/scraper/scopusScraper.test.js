const scopusScraper = require("../../app/scraper/scopusScraper");

describe("Scopus scraper", () => {
  it("should be able to get the author information", async () => {
    const search = {
      authorId: "57204984089",
      publications: [
        {
          title:
            "A load-balancing approach using an improved simulated annealing algorithm",
          source: "Journal of Information Processing Systems",
          citation: "1",
          year: "2020",
          authors: ["Hanine, M.", " Benlahmar, E.-H."],
        },
        {
          title:
            "Qos in the cloud computing: A load balancing approach using simulated annealing algorithm",
          source: "Communications in Computer and Information Science",
          citation: "0",
          year: "2018",
          authors: ["Hanine, M.", " Benlahmar, E.H."],
        },
        {
          title:
            "Load balancing in cloud computing using meta-heuristic algorithm",
          source: "Journal of Information Processing Systems",
          citation: "10",
          year: "2018",
          authors: [
            "Fahim, Y.",
            " Rahhali, H.",
            " Hanine, M.",
            " (...), Hanoune",
            " M., Eddaoui",
          ],
        },
        {
          title:
            "A decision-making approach based on fuzzy AHP-TOPSIS methodology for selecting the appropriate cloud solution to manage big data projects",
          source:
            "International Journal of Systems Assurance Engineering and Management",
          citation: "8",
          year: "2017",
          authors: [
            "Boutkhoum, O.",
            " Hanine, M.",
            " Agouti, T.",
            " Tikniouine, A.",
          ],
        },
        {
          title:
            "A new integrated methodology using modified Delphi-fuzzy AHP-PROMETHEE for Geospatial Business Intelligence selection",
          source: "Information Systems and e-Business Management",
          citation: "5",
          year: "2017",
          authors: [
            "Hanine, M.",
            " Boutkhoum, O.",
            " Agouti, T.",
            " Tikniouine, A.",
          ],
        },
        {
          title:
            "An application of OLAP/GIS-Fuzzy AHP-TOPSIS methodology for decision making: Location selection for landfill of industrial wastes as a case study",
          source: "KSCE Journal of Civil Engineering",
          citation: "13",
          year: "2017",
          authors: [
            "Hanine, M.",
            " Boutkhoum, O.",
            " Tikniouine, A.",
            " Agouti, T.",
          ],
        },
        {
          title:
            "Selection problem of Cloud solution for big data accessing: Fuzzy AHP-PROMETHEE as a proposed methodology",
          source: "Journal of Digital Information Management",
          citation: "6",
          year: "2016",
          authors: [
            "Boutkhoum, O.",
            " Hanine, M.",
            " Agouti, T.",
            " Tikniouine, A.",
          ],
        },
        {
          title:
            "Decision making under uncertainty using PEES–fuzzy AHP–fuzzy TOPSIS methodology for landfill location selection",
          source: "Environment Systems and Decisions",
          citation: "7",
          year: "2016",
          authors: [
            "Hanine, M.",
            " Boutkhoum, O.",
            " Maknissi, A.E.",
            " Tikniouine, A.",
            " Agouti, T.",
          ],
        },
        {
          title:
            "Multi-criteria decision support framework for sustainable implementation of effective green supply chain management practices  Open Access",
          source: "SpringerPlus",
          citation: "10",
          year: "2016",
          authors: [
            "Boutkhoum, O.",
            " Hanine, M.",
            " Boukhriss, H.",
            " Agouti, T.",
            " Tikniouine, A.",
          ],
        },
        {
          title:
            "A new web-based framework development for fuzzy multi-criteria group decision-making  Open Access",
          source: "SpringerPlus",
          citation: "10",
          year: "2016",
          authors: [
            "Hanine, M.",
            " Boutkhoum, O.",
            " Tikniouine, A.",
            " Agouti, T.",
          ],
        },
      ],
    };

    const result = await scopusScraper.authorData({
      authorId: search.authorId,
    });

    const sortedStoredPublications = search.publications.sort(
      (a, b) => a.title.toUpperCase > b.title.toUpperCase
    );

    const sortedFetchedPublications = result.author.publications.sort(
      (a, b) => a.title.toUpperCase > b.title.toUpperCase
    );

    for (let i = 0; i < sortedStoredPublications.length; i++) {
      expect(sortedStoredPublications[i].title).toEqual(
        sortedFetchedPublications[i].title
      );
      expect(sortedStoredPublications[i].year).toEqual(
        sortedFetchedPublications[i].year
      );
      expect(sortedStoredPublications[i].citation).toEqual(
        sortedFetchedPublications[i].citation
      );
      expect(sortedStoredPublications[i].source).toEqual(
        sortedFetchedPublications[i].source
      );
    }
  }, 100000);
});
