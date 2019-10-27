const tokens = require('./auth.json').pubgApi
const fetch = require('node-fetch')
const mongoose = require('mongoose');
const mongoDB = `mongodb://localhost:27017/Top_PUBG`;
mongoose.connect(mongoDB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
});
const db = mongoose.connection;
const Profile = require('./MongoDB/Schema/profile')
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

async function faceit(inGameId){
    let id = await fetch(`https://open.faceit.com/data/v4/players?game=pubg&game_player_id=${inGameId}`,{headers: {"accept": `application/json`,"Authorization": `Bearer 29b9451a-23e3-4e9b-9852-246e78a7df99`}})
    if(!id.ok){
        return false
    }
    id = await id.json()
    let stats = await fetch(`https://open.faceit.com/data/v4/players/${id.player_id}/stats/pubg`,{headers: {"accept": `application/json`,"Authorization": `Bearer 29b9451a-23e3-4e9b-9852-246e78a7df99`}})
    if(!stats.ok){
        return false
    }
    stats = await stats.json()
    return {stats: stats, elo : id.games.pubg.faceit_elo}
}


async function hello(Profile) {
    let players = await Profile.find({})
    let i = 15574
    for(i; i< players.length; i++){
            if(!players[i].stats.inGameId) continue;
            let result = await faceit(players[i].stats.inGameId)
            if(!result){
                players[i].stats.faceitStats = undefined
                players[i].save().then(res => console.log(`${i} ${players[i].stats.inGameUsername} undefined`)).catch(err => console.log(err))
                await sleep(50)
                continue;
            }
            players[i].stats.faceitStats = {}
            players[i].stats.faceitStats.id = result.stats.player_id
            players[i].stats.faceitStats.elo = result.elo
            players[i].stats.faceitStats.kd = result.stats.lifetime["K/D Ratio"];
            players[i].stats.faceitStats.adr = result.stats.lifetime["Average Damage Dealt"];
            players[i].stats.faceitStats.avgAssists = result.stats.lifetime["Average Assists"];
            players[i].stats.faceitStats.avgDistance = result.stats.lifetime["Average Distance (m)"];
            players[i].stats.faceitStats.avgPlacement = result.stats.lifetime["Average Placement"];
            players[i].stats.faceitStats.avgTimeSurvived = result.stats.lifetime["Average Time Survived (s)"];
            players[i].stats.faceitStats.avgHeadshotKills = result.stats.lifetime["Average Headshot Kills"];
            players[i].stats.faceitStats.HeadshotProcent = result.stats.lifetime["Headshot (%)"];
            players[i].stats.faceitStats.kts = result.stats.lifetime["KTS"];
            players[i].stats.faceitStats.longestKill =result.stats.lifetime["Longest Kill (m)"];
            players[i].stats.faceitStats.mostKills = result.stats.lifetime["Most Kills"];
            players[i].stats.faceitStats.recentPlacement = result.stats.lifetime["Recent Placements"];
            players[i].stats.faceitStats.top10 = result.stats.lifetime["Top 10 (%)"];
            players[i].stats.faceitStats.top10Finish = result.stats.lifetime["Top 10 Finish"];
            players[i].stats.faceitStats.top5Finish = result.stats.lifetime["Top 5 Finish"];
            players[i].stats.faceitStats.winRate = result.stats.lifetime["Win Rate"];
            players[i].stats.faceitStats.wins = result.stats.lifetime["Wins"];
            players[i].stats.faceitStats.Assists = result.stats.lifetime["Total Assists"];
            players[i].stats.faceitStats.DNBOs = result.stats.lifetime["Total DBNOs"];
            players[i].stats.faceitStats.damage = result.stats.lifetime["Total Damage Dealt"];
            players[i].stats.faceitStats.distance = result.stats.lifetime["Total Distance (m)"];
            players[i].stats.faceitStats.headshotKills = result.stats.lifetime["Total Headshots Kills"];
            players[i].stats.faceitStats.kills = result.stats.lifetime["Total Kills"];
            players[i].stats.faceitStats.matches = result.stats.lifetime["Total Matches"];
            players[i].stats.faceitStats.revives = result.stats.lifetime["Total Revives"];
            players[i].stats.faceitStats.rideDistance = result.stats.lifetime["Total Ride Distance (m)"];
            players[i].stats.faceitStats.swimDistance = result.stats.lifetime["Total Swim Distance (m)"];
            players[i].stats.faceitStats.walkDistance = result.stats.lifetime["Total Walk Distance (m)"];
            players[i].stats.faceitStats.timePlayed = result.stats.lifetime["Total Time Played"];
            
            
            players[i].save().then(res => console.log(`${i} ${players[i].stats.inGameUsername} true`)).catch(err => console.log(err))
            await sleep(50)
            
    }
}
hello(Profile)