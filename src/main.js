const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const app = express();
const path = require("path");
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
    const dub = req.query.dub;
    const episode = req.query.ep;
    const anime = await axios
      .get(`https://api.jikan.moe/v4/anime/${req.query.id}`)
      .then((anime) => {
        return anime.data.data;
      });
    // console.log(anime);
    const searchResults = await axios
      .get(`${scraper}/search?keyword=${anime.title}`)
      .then((res) => {
        return res.data.body;
      });
    const searchResult = searchResults.find((element) => {
      return anime.title.toLowerCase() === element.name.toLowerCase();
    });
    console.log(searchResults);
    const videoid = await axios
      .get(
        `${scraper}/videoid?path=${
          searchResult.href
        }&ep=${episode}&dub=${dub}`
      )
      .then((res) => {
        return res.data.body;
      });
    if (anime.airing == false) {
      res.render("anime.ejs", { source: `${scraper}/stream?videoid=${videoid}&player=default`, maxEpisodes: anime.episodes, anime, episode, dub });
    } else {
      const maxEpisodes = await axios
        .get(
          `${scraper}/episodes?path=${
            searchResult.href
          }&dub=${dub}`
        )
        .then((res) => {
          return res.data.body;
        });
      const page = await ejs.renderFile(path.join(__dirname, 'public/pages', 'anime.ejs'), data);
      res.send(page);
      // res.render("anime.ejs", { source: `${scraper}/stream?videoid=${videoid}&player=default`, maxEpisodes, anime, episode, dub });
    }
  } catch (error) {
    console.error("Error fetching anime details:", error);
  } finally {
    console.timeEnd();
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on http://localhost:3000");
});

module.exports = app;
