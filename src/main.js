const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const { connectToDatabase, find, insert } = require("./database");

require("dotenv/config");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public/pages"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send({ coming: "soon" });
});

app.get("/modules", (req, res) => {
  res.render("modules.ejs");
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard.ejs");
});

app.get("/watch/:title", async (req, res) => {
  try {
    const { movie_results, tv_results } = (
      await axios.get(
        `https://api.themoviedb.org/3/find/tt${req.params.title
          .split("-")
          .pop()}?external_source=imdb_id&api_key=${process.env.TMDB_API_KEY}`
      )
    ).data;
    if (movie_results.length === 1) {
      const content = (
        await axios.get(
          `https://api.themoviedb.org/3/movie/${movie_results[0].id}?api_key=${process.env.TMDB_API_KEY}`
        )
      ).data;
      res.render("movie.ejs", {
        init: {
          id: { tmdb: content.id, imdb: req.params.title.split("-").pop() },
        },
        content,
      });
    } else if (tv_results.length === 1) {
      const content = (
        await axios.get(
          `https://api.themoviedb.org/3/tv/${tv_results[0].id}?api_key=${process.env.TMDB_API_KEY}`
        )
      ).data;
      const episodes = (
        await axios.get(
          `https://api.themoviedb.org/3/tv/${tv_results[0].id}/season/${req.query.s}?api_key=${process.env.TMDB_API_KEY}`
        )
      ).data;
      res.render("tvshow.ejs", {
        init: {
          s: req.query.s,
          ep: req.query.ep,
          id: { tmdb: content.id, imdb: req.params.title.split("-").pop() },
        },
        content,
        episodes,
      });
    }
  } catch (error) {
    // console.log(error);
    res.send(error);
  }
});

let scraper;
app.get("/anime/:title", async (req, res) => {
  console.time();
  process.env.PROD ? scraper = process.env.SCRAPER : "http://localhost:8888";
  try {
    const { dub, ep: episode, id: mal_id } = req.query;
    // const exists = await find(`${mal_id}-${episode}-${dub}`, "pages");
    // if (exists) return res.send(exists.html);
    const anime = (await axios.get(`https://api.jikan.moe/v4/anime/${mal_id}`)).data.data;
    // console.log(anime);
    let searchResult;
    searchResult = ((await axios.get(`${scraper}/search?keyword=${anime.title}`)).data.body).find(element => anime.title.toLowerCase() === element.name.toLowerCase());
    if (!searchResult) {
      searchResult = ((await axios.get(`${scraper}/search?keyword=${anime.title_english}`)).data.body).find(element => anime.title_english.toLowerCase() === element.name.toLowerCase());
    }
    // console.log(searchResult);
    let maxEpisodes;
    if (!anime.airing) {
      maxEpisodes = anime.episodes;
    } else {
      maxEpisodes = await axios.get(`${scraper}/episodes?path=${searchResult.href}&dub=${dub}`).data.body;
    }
      const page = await ejs.renderFile(path.join(__dirname, 'public/pages', 'anime.ejs'), { baseUrl: req.protocol + '://' + req.get('host'), source: `https://player.mangafrenzy.net/streaming/${searchResult.href.replace("/category/", "")}${dub == 'true' ? "-dub" : ""}-episode-${episode}`, maxEpisodes, anime, episode, dub });
      // const doc = {
      //   _id: `${mal_id}-${episode}-${dub}`,
      //   html: page
      // };
      // if (doc.html.length != 0) {
      //   await insert(doc, 'pages');
      // }
      res.send(page);
  } catch (error) {
    console.error("Error fetching anime details:", error);
  } finally {
    console.timeEnd();
  }
});

app.listen(process.env.PORT || 3000, async () => {
  // await connectToDatabase();
  console.log("Server is running on http://localhost:3000");
});

module.exports = app;
