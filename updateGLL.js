
const fetch = require('node-fetch')
const mongoose = require('mongoose');
const mongoDB = `mongodb://localhost:27017/Top_PUBG`;
mongoose.connect(mongoDB, { useUnifiedTopology: true ,useNewUrlParser: true});
const db = mongoose.connection;
const Profile = require('./MongoDB/Schema/profile')
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
const sleep = require('system-sleep');
async function Gll (nickname) {
    let response = await fetch(`https://play.gll.gg/api/pubg/stats/playerStats?pubgNick=${nickname}`)
    response = await response.json()
    return response
}

Profile.update({}, { $rename: { "stats.gllStats.headShotsRation": "stats.gllStats.headShotsRatio" } }, { multi: true }, function(err, blocks) {
    if(err) { throw err; }
    console.log('done!');
  });
// async function hello(Profile) {
//     let players = await Profile.find({})
//     for(i in players){
//         let name = players[i].stats.inGameUsername
//         let result = await Gll(name)
//         console.log(result,name)
//         console.log(1)
//         if(!result.error){
//             players[i].stats.gllStats = undefined
//             players[i].stats.gllStats = {}
//             players[i].stats.gllStats.matches = result.roundsPlayed
//             players[i].stats.gllStats.wins = result.numberOfWins
//             players[i].stats.gllStats.weapon = result.bestWeapon
//             players[i].stats.gllStats.top5 = result.topFivePlacements
//             players[i].stats.gllStats.shots = result.shotsFired
//             players[i].stats.gllStats.accuracy = result.accuracy
//             players[i].stats.gllStats.headShots = result.headshots
//             players[i].stats.gllStats.kills = result.totalKills
//             players[i].stats.gllStats.assists = result.assistedKills
//             players[i].stats.gllStats.damage = result.damageDone
//             players[i].stats.gllStats.takenDamage = result.damageTaken
//             players[i].stats.gllStats.knockouts = result.totalKnockoutsDealt
//             players[i].stats.gllStats.takenKnockouts = result.totalKnockoutsTaken
//             players[i].stats.gllStats.revives = result.totalRevivesDealt
//             players[i].stats.gllStats.takenRevives = result.totalRevivesTaken
//             players[i].stats.gllStats.medicineUsed = result.totalHealthKitsUsed
//             players[i].stats.gllStats.granadesUsed = result.totalGrenadesUsed
//             players[i].stats.gllStats.headShotsRation = result.headshotRatio
//             players[i].stats.gllStats.avg_kd = result.averageKillsPerRound
//             players[i].stats.gllStats.avg_assists = result.averageAssistsPerRound
//             players[i].stats.gllStats.avg_damate = result.averageDamageDonePerRound
//             players[i].stats.gllStats.avg_takenDamage = result.averageDamageTakenPerRound
//             players[i].stats.gllStats.avg_knockouts = result.averageKnockoutsDealtPerRound
//             players[i].stats.gllStats.avg_takenKnockouts = result.averageKnockoutsTakenPerRound
//             players[i].stats.gllStats.avg_revives = result.averageRevivesDealtPerRound
//             players[i].stats.gllStats.avg_takenRevives = result.averageRevivesTakenPerRound
//             players[i].stats.gllStats.avg_medicineUsed = result.averageHealthKitsUsedPerRound
//             players[i].stats.gllStats.avg_granades = result.averageGrenadesUsedPerRound
//             console.log(players[i])
//             players[i].save().then(res => console.log(res)).catch(err => console.log(err))
//         }
//     }
// }

// hello(Profile)

