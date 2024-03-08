const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const app = express();
const path = require('path');
require("dotenv/config")

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/pages'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send({coming: 'soon'});
});

app.get('/modules', (req, res) => {
  res.render('modules.ejs');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard.ejs');
});

app.get("/watch/:title", async (req, res) => {
  try {
    const { movie_results, tv_results } = (await axios.get(`https://api.themoviedb.org/3/find/tt${(req.params.title).split("-").pop()}?external_source=imdb_id&api_key=${process.env.TMDB_API_KEY}`)).data;
    if (movie_results.length === 1) {
      const content = (await axios.get(`https://api.themoviedb.org/3/movie/${movie_results[0].id}?api_key=${process.env.TMDB_API_KEY}`)).data;
      res.render('movie.ejs', {
        init: {
          id: {tmdb: content.id, imdb: (req.params.title.split("-").pop())}
        },
        content,
      })
    } else if (tv_results.length === 1) {
      const content = (await axios.get(`https://api.themoviedb.org/3/tv/${tv_results[0].id}?api_key=${process.env.TMDB_API_KEY}`)).data;
      const episodes = (await axios.get(`https://api.themoviedb.org/3/tv/${tv_results[0].id}/season/${req.query.s}?api_key=${process.env.TMDB_API_KEY}`)).data;
      res.render('tvshow.ejs', {
        init: {
          s: req.query.s,
          ep: req.query.ep,
          id: {tmdb: content.id, imdb: (req.params.title.split("-").pop())}
        },
        content,
        episodes
      })
    }
  } catch (error) {
    // console.log(error);
    res.send(error);
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on http://localhost:3000");
});

module.exports = app;