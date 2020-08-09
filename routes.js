const {
  helpersController,
  publicationsController,
  authorsController,
} = require("./app/controllers");

const router = require("express").Router();

router.get("/", helpersController.hello);
router.get("/internet-check", helpersController.internetCheck);

router.get("/author-search/:authorName", authorsController.authorSearch);
router.get("/author/:platform/:authorId", authorsController.author);

router.get(
  "/publication/:authorId/:publicationName",
  publicationsController.publicationData
);

module.exports = router;
