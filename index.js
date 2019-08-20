const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Set responce
function setResponce(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

// Make requiest to Github for data
async function getRepos(req, res, next) {
  try {
    console.log("Fetching Data...");

    const { username } = req.params;

    const responce = await fetch(`https://api.github.com/users/${username}`);

    const data = await responce.json();

    const repos = data.public_repos;

    // Set data to Redis
    client.setex(username, 3, repos);

    res.send(setResponce(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

// Cache middkeware
function cache(req, res, next) {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponce(username, data));
    } else {
      next();
    }
  });
}

app.get("/repos/:username", cache, getRepos);

app.listen(5000, () => {
  console.log(`App listning on port ${PORT}`);
});
