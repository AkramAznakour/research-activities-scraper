const dns = require("dns");

const hello = async (req, resp) => {
  console.log("hello :");
  resp.send({ message: "hello" });
};

const InternetCheckHelper = (callback) => {
  dns.lookup("scholar.google.com", (err) => {
    if (err && err.code == "ENOTFOUND") callback(false);
    else callback(true);
  });
};

const internetCheck = async (req, resp) => {
  InternetCheckHelper((isConnected) => {
    if (isConnected) {
      console.log("connected to the internet");
      resp.send("connected to the internet");
    } else {
      console.log("not connected to the internet");
      resp.send("not connected to the internet");
    }
  });
};

module.exports = { hello, internetCheck };
