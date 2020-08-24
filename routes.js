const {
  helpersController,
  journalsController,
  authorsController,
} = require("./app/controllers");

const router = require("express").Router();

router.get("/", helpersController.hello);
router.get("/internet-check", helpersController.internetCheck);

router.get("/author-search/:authorName", authorsController.authorSearch);
router.get("/author/:platform/:authorId", authorsController.author);

router.get("/journal/:journalName/:year", journalsController.journalData);

module.exports = router;
