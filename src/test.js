const { ANIME } = require("@consumet/extensions");

// Create a new instance of the Gogoanime provider
const anime = new ANIME.NineAnime();
// Search for an anime. In this case, "One Piece"
const results = anime.search("One Piece").then(data => {
  // print results
  console.log(data);
}).catch(err => console.log(err))