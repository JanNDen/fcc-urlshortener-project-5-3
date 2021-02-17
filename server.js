require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

/****************** <JANNDEN> ****************/
// Connection
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;
const urlSchema = new Schema({
  url: String,
  hash: String
});
const UrlModel = mongoose.model("shortUrlDB", urlSchema);

// API
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
const dnsParser = require("dns");
const urlParser = require("url");
const shortHash = require('short-hash');
app.post("/api/shorturl/new", function (req, res) {
  if (mongoose.connection.readyState == 1) {
    const postedUrl = req.body.url;
    dnsParser.lookup(urlParser.parse(postedUrl).hostname, (err, addr) => {
      if (addr) {
        var hash = shortHash(postedUrl);
        const parsedUrl = new UrlModel({ url: postedUrl, hash: hash });
        parsedUrl.save((err, data) => {
          if (err) {
            return res.json({ error: err });;
          } else {
            return res.json({
              original_url: data.url,
              short_url: data.hash
            });
          }
        })
      } else {
        res.json({ error: 'invalid url' });
      }
    })
  } else {
    res.json({ error: 'Not connected to DB, error ' + mongoose.connection.readyState });
  }
});
app.get("/api/shorturl/:hash", (req, res) => {
  const hash = req.params.hash;
  urlModel.findOne({ hash: hash }, (err, data) => {
    if (err) {
      return res.json({ error: err });;
    } else {
      return res.redirect(data.url);
    }
  })
})
/****************** </JANNDEN> ****************/

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
