const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`Db Error${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1

const convertDbObjectToServerObjectPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToServerObjectMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const { playerId, playerName } = request.body;
  const getPlayerQuery = `
    SELECT *
    FROM player_details;`;
  const player = await db.all(getPlayerQuery);
  response.send(
    player.map((eachPlayer) => convertDbObjectToServerObjectPlayer(eachPlayer))
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetail = `
    SELECT 
    *
    FROM 
    player_details
    WHERE 
    player_id = ${playerId};`;
  const player = await db.get(getPlayerDetail);
  response.send(convertDbObjectToServerObjectPlayer(player));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
UPDATE 
    player_details
SET
    player_name = '${playerName}'
WHERE 
    player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const { match, year } = request.body;
  const getMatchDetailsQuery = `
    SELECT 
    *
    FROM 
        match_details
    WHERE 
        match_id  = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertDbObjectToServerObjectMatch(matchDetails));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
    SELECT *
    FROM
        player_match_score 
    NATURAL JOIN
        match_details
    WHERE
        player_id = ${playerId};`;
  const matchPlayer = await db.all(getMatchPlayerQuery);
  response.send(
    matchPlayer.map((eachPlayer) =>
      convertDbObjectToServerObjectMatch(eachPlayer)
    )
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
    SELECT *
    FROM
        player_match_score 
    NATURAL JOIN
        player_details
    WHERE
        match_id = ${matchId};`;
  const playerMatch = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatch.map((eachPlayer) =>
      convertDbObjectToServerObjectPlayer(eachPlayer)
    )
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT 
        player_id AS playerId,
        player_name As playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_match_score
    NATURAL JOIN 
        player_details
    WHERE 
    player_id = ${playerId};`;
  const playerScore = await db.get(getPlayerScoreQuery);
  response.send(playerScore);
});

module.exports = app;
