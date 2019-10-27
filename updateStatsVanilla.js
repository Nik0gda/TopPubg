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
// const sleep = require('system-sleep');

async function seasons() {
    let response = await fetch(`${link}/seasons`,{headers: params })
    if(!response.ok){  
        
        return false
    }
    response = await response.json()
    response = response.data.find(x => x.attributes.isCurrentSeason == true)
    return response.id
    
}
async function getIds(str,token_number,season) {
    let seaso = await season
    let tru = true
    let response = await fetch(`${link}/players/${str}/seasons/${seaso}`,{headers: {"Accept": "application/vnd.api+json","Authorization": `Bearer ${tokens[token_number]} `}}).catch(error => console.error)

    if(!response.ok){
        tru = false
        response = await fetch(`${link}/players/${str}/seasons/${seaso}`,{headers: {"Accept": "application/vnd.api+json","Authorization": `Bearer ${tokens[token_number]} `}}).catch(error => console.error)
    }
    response = await response.json().catch(error => console.error)
    return {response: response,truFal:tru}
}
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

const link = 'https://api.pubg.com/shards/steam'
const params = {"Accept": "application/vnd.api+json","Authorization": `Bearer ${tokens[0]}`} 
async function hello(Profile) {
        const season = seasons()
        let players = await Profile.find({})
        let token = 0
        let started = new Date()
        let finish = new Date(started.getTime() + 1000 * 63)
        console.log(finish,started)
        let i=3000
        for(i; i< players.length; i++){
                if(!players[i].stats.inGameId) continue;
                let str = `${players[i].stats.inGameId}`

                let result = await getIds(str,token,season)
                if(result.truFal == false){
                    token++
                    
                    i--
                    
                    if(token >=3){
                        
                        token = 0
                        await sleep(60000)
                    }
                    continue
                }
                players[i].stats.publicStats = {}
                players[i].stats.publicStats.duo = {}
                players[i].stats.publicStats.duo.teamKills = result.response.data.attributes.gameModeStats.duo.teamKills
                players[i].stats.publicStats.duo.roadKills = result.response.data.attributes.gameModeStats.duo.roadKills
                players[i].stats.publicStats.duo.kills = result.response.data.attributes.gameModeStats.duo.kills
                players[i].stats.publicStats.duo.assists = result.response.data.attributes.gameModeStats.duo.assists
                players[i].stats.publicStats.duo.headshotKills = result.response.data.attributes.gameModeStats.duo.headshotKills
                
                players[i].stats.publicStats.duo.damageDealt = result.response.data.attributes.gameModeStats.duo.damageDealt
                players[i].stats.publicStats.duo.dBNOs = result.response.data.attributes.gameModeStats.duo.dBNOs
                players[i].stats.publicStats.duo.revives = result.response.data.attributes.gameModeStats.duo.revives
                players[i].stats.publicStats.duo.suicides = result.response.data.attributes.gameModeStats.duo.suicides

                players[i].stats.publicStats.duo.boosts = result.response.data.attributes.gameModeStats.duo.boosts
                players[i].stats.publicStats.duo.heals = result.response.data.attributes.gameModeStats.duo.heals
                
                players[i].stats.publicStats.duo.longestKill = result.response.data.attributes.gameModeStats.duo.longestKill
                players[i].stats.publicStats.duo.longestTimeSurvived = result.response.data.attributes.gameModeStats.duo.longestTimeSurvived
                players[i].stats.publicStats.duo.maxKillStreaks = result.response.data.attributes.gameModeStats.duo.maxKillStreaks
                players[i].stats.publicStats.duo.mostSurvivalTime = result.response.data.attributes.gameModeStats.duo.mostSurvivalTime
                players[i].stats.publicStats.duo.roundMostKills = result.response.data.attributes.gameModeStats.duo.roundMostKills
                
                players[i].stats.publicStats.duo.weaponsAcquired = result.response.data.attributes.gameModeStats.duo.weaponsAcquired
                players[i].stats.publicStats.duo.vehicleDestroys = result.response.data.attributes.gameModeStats.duo.vehicleDestroys

                players[i].stats.publicStats.duo.walkDistance = result.response.data.attributes.gameModeStats.duo.walkDistance
                players[i].stats.publicStats.duo.rideDistance = result.response.data.attributes.gameModeStats.duo.rideDistance
                players[i].stats.publicStats.duo.swimDistance = result.response.data.attributes.gameModeStats.duo.swimDistance
                players[i].stats.publicStats.duo.timeSurvived = result.response.data.attributes.gameModeStats.duo.timeSurvived
                players[i].stats.publicStats.duo.roundsPlayed = result.response.data.attributes.gameModeStats.duo.roundsPlayed
                players[i].stats.publicStats.duo.days = result.response.data.attributes.gameModeStats.duo.days

                players[i].stats.publicStats.duo.top10 = result.response.data.attributes.gameModeStats.duo.top10s
                players[i].stats.publicStats.duo.wins = result.response.data.attributes.gameModeStats.duo.wins
                players[i].stats.publicStats.duo.losses = result.response.data.attributes.gameModeStats.duo.losses
                
                players[i].stats.publicStats.duo.dailyKills = result.response.data.attributes.gameModeStats.duo.dailyKills
                players[i].stats.publicStats.duo.dailyWins = result.response.data.attributes.gameModeStats.duo.dailyWins
                players[i].stats.publicStats.duo.weeklyKills = result.response.data.attributes.gameModeStats.duo.weeklyKills
                players[i].stats.publicStats.duo.weeklyWins = result.response.data.attributes.gameModeStats.duo.weeklyWins
                
                players[i].stats.publicStats.duo.killPoints = result.response.data.attributes.gameModeStats.duo.killPoints
                players[i].stats.publicStats.duo.winPoints = result.response.data.attributes.gameModeStats.duo.winPoints
                players[i].stats.publicStats.duo.rankPoints = result.response.data.attributes.gameModeStats.duo.rankPoints
                players[i].stats.publicStats.duo.rankPointsTitle = result.response.data.attributes.gameModeStats.duo.rankPointsTitle




                players[i].stats.publicStats.duoFPP = {}
                players[i].stats.publicStats.duoFPP.teamKills = result.response.data.attributes.gameModeStats["duo-fpp"].teamKills
                players[i].stats.publicStats.duoFPP.roadKills = result.response.data.attributes.gameModeStats["duo-fpp"].roadKills
                players[i].stats.publicStats.duoFPP.kills = result.response.data.attributes.gameModeStats["duo-fpp"].kills
                players[i].stats.publicStats.duoFPP.assists = result.response.data.attributes.gameModeStats["duo-fpp"].assists
                players[i].stats.publicStats.duoFPP.headshotKills = result.response.data.attributes.gameModeStats["duo-fpp"].headshotKills

                players[i].stats.publicStats.duoFPP.damageDealt = result.response.data.attributes.gameModeStats["duo-fpp"].damageDealt
                players[i].stats.publicStats.duoFPP.dBNOs = result.response.data.attributes.gameModeStats["duo-fpp"].dBNOs
                players[i].stats.publicStats.duoFPP.revives = result.response.data.attributes.gameModeStats["duo-fpp"].revives
                players[i].stats.publicStats.duoFPP.suicides = result.response.data.attributes.gameModeStats["duo-fpp"].suicides

                players[i].stats.publicStats.duoFPP.boosts = result.response.data.attributes.gameModeStats["duo-fpp"].boosts
                players[i].stats.publicStats.duoFPP.heals = result.response.data.attributes.gameModeStats["duo-fpp"].heals

                players[i].stats.publicStats.duoFPP.longestKill = result.response.data.attributes.gameModeStats["duo-fpp"].longestKill
                players[i].stats.publicStats.duoFPP.longestTimeSurvived = result.response.data.attributes.gameModeStats["duo-fpp"].longestTimeSurvived
                players[i].stats.publicStats.duoFPP.maxKillStreaks = result.response.data.attributes.gameModeStats["duo-fpp"].maxKillStreaks
                players[i].stats.publicStats.duoFPP.mostSurvivalTime = result.response.data.attributes.gameModeStats["duo-fpp"].mostSurvivalTime
                players[i].stats.publicStats.duoFPP.roundMostKills = result.response.data.attributes.gameModeStats["duo-fpp"].roundMostKills

                players[i].stats.publicStats.duoFPP.weaponsAcquired = result.response.data.attributes.gameModeStats["duo-fpp"].weaponsAcquired
                players[i].stats.publicStats.duoFPP.vehicleDestroys = result.response.data.attributes.gameModeStats["duo-fpp"].vehicleDestroys

                players[i].stats.publicStats.duoFPP.walkDistance = result.response.data.attributes.gameModeStats["duo-fpp"].walkDistance
                players[i].stats.publicStats.duoFPP.rideDistance = result.response.data.attributes.gameModeStats["duo-fpp"].rideDistance
                players[i].stats.publicStats.duoFPP.swimDistance = result.response.data.attributes.gameModeStats["duo-fpp"].swimDistance
                players[i].stats.publicStats.duoFPP.timeSurvived = result.response.data.attributes.gameModeStats["duo-fpp"].timeSurvived
                players[i].stats.publicStats.duoFPP.roundsPlayed = result.response.data.attributes.gameModeStats["duo-fpp"].roundsPlayed
                players[i].stats.publicStats.duoFPP.days = result.response.data.attributes.gameModeStats["duo-fpp"].days

                players[i].stats.publicStats.duoFPP.top10 = result.response.data.attributes.gameModeStats["duo-fpp"].top10s
                players[i].stats.publicStats.duoFPP.wins = result.response.data.attributes.gameModeStats["duo-fpp"].wins
                players[i].stats.publicStats.duoFPP.losses = result.response.data.attributes.gameModeStats["duo-fpp"].losses

                players[i].stats.publicStats.duoFPP.dailyKills = result.response.data.attributes.gameModeStats["duo-fpp"].dailyKills
                players[i].stats.publicStats.duoFPP.dailyWins = result.response.data.attributes.gameModeStats["duo-fpp"].dailyWins
                players[i].stats.publicStats.duoFPP.weeklyKills = result.response.data.attributes.gameModeStats["duo-fpp"].weeklyKills
                players[i].stats.publicStats.duoFPP.weeklyWins = result.response.data.attributes.gameModeStats["duo-fpp"].weeklyWins

                players[i].stats.publicStats.duoFPP.killPoints = result.response.data.attributes.gameModeStats["duo-fpp"].killPoints
                players[i].stats.publicStats.duoFPP.winPoints = result.response.data.attributes.gameModeStats["duo-fpp"].winPoints
                players[i].stats.publicStats.duoFPP.rankPoints = result.response.data.attributes.gameModeStats["duo-fpp"].rankPoints
                players[i].stats.publicStats.duoFPP.rankPointsTitle = result.response.data.attributes.gameModeStats["duo-fpp"].rankPointsTitle
                

                players[i].stats.publicStats.squad = {}
                players[i].stats.publicStats.squad.teamKills = result.response.data.attributes.gameModeStats.squad.teamKills
                players[i].stats.publicStats.squad.roadKills = result.response.data.attributes.gameModeStats.squad.roadKills
                players[i].stats.publicStats.squad.kills = result.response.data.attributes.gameModeStats.squad.kills
                players[i].stats.publicStats.squad.assists = result.response.data.attributes.gameModeStats.squad.assists
                players[i].stats.publicStats.squad.headshotKills = result.response.data.attributes.gameModeStats.squad.headshotKills

                players[i].stats.publicStats.squad.damageDealt = result.response.data.attributes.gameModeStats.squad.damageDealt
                players[i].stats.publicStats.squad.dBNOs = result.response.data.attributes.gameModeStats.squad.dBNOs
                players[i].stats.publicStats.squad.revives = result.response.data.attributes.gameModeStats.squad.revives
                players[i].stats.publicStats.squad.suicides = result.response.data.attributes.gameModeStats.squad.suicides

                players[i].stats.publicStats.squad.boosts = result.response.data.attributes.gameModeStats.squad.boosts
                players[i].stats.publicStats.squad.heals = result.response.data.attributes.gameModeStats.squad.heals

                players[i].stats.publicStats.squad.longestKill = result.response.data.attributes.gameModeStats.squad.longestKill
                players[i].stats.publicStats.squad.longestTimeSurvived = result.response.data.attributes.gameModeStats.squad.longestTimeSurvived
                players[i].stats.publicStats.squad.maxKillStreaks = result.response.data.attributes.gameModeStats.squad.maxKillStreaks
                players[i].stats.publicStats.squad.mostSurvivalTime = result.response.data.attributes.gameModeStats.squad.mostSurvivalTime
                players[i].stats.publicStats.squad.roundMostKills = result.response.data.attributes.gameModeStats.squad.roundMostKills

                players[i].stats.publicStats.squad.weaponsAcquired = result.response.data.attributes.gameModeStats.squad.weaponsAcquired
                players[i].stats.publicStats.squad.vehicleDestroys = result.response.data.attributes.gameModeStats.squad.vehicleDestroys

                players[i].stats.publicStats.squad.walkDistance = result.response.data.attributes.gameModeStats.squad.walkDistance
                players[i].stats.publicStats.squad.rideDistance = result.response.data.attributes.gameModeStats.squad.rideDistance
                players[i].stats.publicStats.squad.swimDistance = result.response.data.attributes.gameModeStats.squad.swimDistance
                players[i].stats.publicStats.squad.timeSurvived = result.response.data.attributes.gameModeStats.squad.timeSurvived
                players[i].stats.publicStats.squad.roundsPlayed = result.response.data.attributes.gameModeStats.squad.roundsPlayed
                players[i].stats.publicStats.squad.days = result.response.data.attributes.gameModeStats.squad.days

                players[i].stats.publicStats.squad.top10 = result.response.data.attributes.gameModeStats.squad.top10s
                players[i].stats.publicStats.squad.wins = result.response.data.attributes.gameModeStats.squad.wins
                players[i].stats.publicStats.squad.losses = result.response.data.attributes.gameModeStats.squad.losses

                players[i].stats.publicStats.squad.dailyKills = result.response.data.attributes.gameModeStats.squad.dailyKills
                players[i].stats.publicStats.squad.dailyWins = result.response.data.attributes.gameModeStats.squad.dailyWins
                players[i].stats.publicStats.squad.weeklyKills = result.response.data.attributes.gameModeStats.squad.weeklyKills
                players[i].stats.publicStats.squad.weeklyWins = result.response.data.attributes.gameModeStats.squad.weeklyWins

                players[i].stats.publicStats.squad.killPoints = result.response.data.attributes.gameModeStats.squad.killPoints
                players[i].stats.publicStats.squad.winPoints = result.response.data.attributes.gameModeStats.squad.winPoints
                players[i].stats.publicStats.squad.rankPoints = result.response.data.attributes.gameModeStats.squad.rankPoints
                players[i].stats.publicStats.squad.rankPointsTitle = result.response.data.attributes.gameModeStats.squad.rankPointsTitle






                players[i].stats.publicStats.squadFPP = {}
                players[i].stats.publicStats.squadFPP.teamKills = result.response.data.attributes.gameModeStats["squad-fpp"].teamKills
                players[i].stats.publicStats.squadFPP.roadKills = result.response.data.attributes.gameModeStats["squad-fpp"].roadKills
                players[i].stats.publicStats.squadFPP.kills = result.response.data.attributes.gameModeStats["squad-fpp"].kills
                players[i].stats.publicStats.squadFPP.assists = result.response.data.attributes.gameModeStats["squad-fpp"].assists
                players[i].stats.publicStats.squadFPP.headshotKills = result.response.data.attributes.gameModeStats["squad-fpp"].headshotKills

                players[i].stats.publicStats.squadFPP.damageDealt = result.response.data.attributes.gameModeStats["squad-fpp"].damageDealt
                players[i].stats.publicStats.squadFPP.dBNOs = result.response.data.attributes.gameModeStats["squad-fpp"].dBNOs
                players[i].stats.publicStats.squadFPP.revives = result.response.data.attributes.gameModeStats["squad-fpp"].revives
                players[i].stats.publicStats.squadFPP.suicides = result.response.data.attributes.gameModeStats["squad-fpp"].suicides

                players[i].stats.publicStats.squadFPP.boosts = result.response.data.attributes.gameModeStats["squad-fpp"].boosts
                players[i].stats.publicStats.squadFPP.heals = result.response.data.attributes.gameModeStats["squad-fpp"].heals

                players[i].stats.publicStats.squadFPP.longestKill = result.response.data.attributes.gameModeStats["squad-fpp"].longestKill
                players[i].stats.publicStats.squadFPP.longestTimeSurvived = result.response.data.attributes.gameModeStats["squad-fpp"].longestTimeSurvived
                players[i].stats.publicStats.squadFPP.maxKillStreaks = result.response.data.attributes.gameModeStats["squad-fpp"].maxKillStreaks
                players[i].stats.publicStats.squadFPP.mostSurvivalTime = result.response.data.attributes.gameModeStats["squad-fpp"].mostSurvivalTime
                players[i].stats.publicStats.squadFPP.roundMostKills = result.response.data.attributes.gameModeStats["squad-fpp"].roundMostKills

                players[i].stats.publicStats.squadFPP.weaponsAcquired = result.response.data.attributes.gameModeStats["squad-fpp"].weaponsAcquired
                players[i].stats.publicStats.squadFPP.vehicleDestroys = result.response.data.attributes.gameModeStats["squad-fpp"].vehicleDestroys

                players[i].stats.publicStats.squadFPP.walkDistance = result.response.data.attributes.gameModeStats["squad-fpp"].walkDistance
                players[i].stats.publicStats.squadFPP.rideDistance = result.response.data.attributes.gameModeStats["squad-fpp"].rideDistance
                players[i].stats.publicStats.squadFPP.swimDistance = result.response.data.attributes.gameModeStats["squad-fpp"].swimDistance
                players[i].stats.publicStats.squadFPP.timeSurvived = result.response.data.attributes.gameModeStats["squad-fpp"].timeSurvived
                players[i].stats.publicStats.squadFPP.roundsPlayed = result.response.data.attributes.gameModeStats["squad-fpp"].roundsPlayed
                players[i].stats.publicStats.squadFPP.days = result.response.data.attributes.gameModeStats["squad-fpp"].days

                players[i].stats.publicStats.squadFPP.top10 = result.response.data.attributes.gameModeStats["squad-fpp"].top10s
                players[i].stats.publicStats.squadFPP.wins = result.response.data.attributes.gameModeStats["squad-fpp"].wins
                players[i].stats.publicStats.squadFPP.losses = result.response.data.attributes.gameModeStats["squad-fpp"].losses

                players[i].stats.publicStats.squadFPP.dailyKills = result.response.data.attributes.gameModeStats["squad-fpp"].dailyKills
                players[i].stats.publicStats.squadFPP.dailyWins = result.response.data.attributes.gameModeStats["squad-fpp"].dailyWins
                players[i].stats.publicStats.squadFPP.weeklyKills = result.response.data.attributes.gameModeStats["squad-fpp"].weeklyKills
                players[i].stats.publicStats.squadFPP.weeklyWins = result.response.data.attributes.gameModeStats["squad-fpp"].weeklyWins

                players[i].stats.publicStats.squadFPP.killPoints = result.response.data.attributes.gameModeStats["squad-fpp"].killPoints
                players[i].stats.publicStats.squadFPP.winPoints = result.response.data.attributes.gameModeStats["squad-fpp"].winPoints
                players[i].stats.publicStats.squadFPP.rankPoints = result.response.data.attributes.gameModeStats["squad-fpp"].rankPoints
                players[i].stats.publicStats.squadFPP.rankPointsTitle = result.response.data.attributes.gameModeStats["squad-fpp"].rankPointsTitle
                                                


                players[i].save().then(res => console.log(i)).catch(err => console.log(err))
                await sleep(150)
               
                
        }
}
        hello(Profile)