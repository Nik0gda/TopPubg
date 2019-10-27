const Discord = require('discord.js')
const fetch = require('node-fetch')
const pubg = require('../../API/pubg')
const config = require('../../botConfig.json')
const statsImg = config.stats_img
const profile = require('../../MongoDB/Schema/profile')
const apiKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwY2ZlY2QyMC02NmMwLTAxMzctMjZhOS02YjhlZWYxYjg5MTEiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTU5NDA5ODc1LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6InRvcC1wdWJnLXJlYm9yIn0.T9emREb2lj6I_5AV_r0Acj_k5hrYaKoHA_LRKTaBivk"
const Bottleneck = require("bottleneck")
const limiter = new Bottleneck({
    reservoir: 10, // initial value
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
    highWater: 20, // max length of queue 
    strategy: Bottleneck.strategy.OVERFLOW, // stragedy of not queuing new requests
    // also use maxConcurrent and/or minTime for safety
    maxConcurrent: 1,
    minTime: 100 // pick a value that makes sense for your use case
});

let ranks = ['Begginer', 'Novice', 'Experienced', 'Skilled', 'Specialist', 'Expert', 'Survivor']

function romanize(num) {
    var lookup = {
            V: 5,
            IV: 4,
            I: 1
        },
        roman = '',
        i;
    for (i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}


module.exports = {
    config: {
        name: 'update',
        aliases: ['stats', 'стата', 'гзвфеу', 'статс', 'ыефеы']
    },
    run: async (client, msg, args) => {
        if (msg.channel.id == '631210592434126862') {
            let user = await profile.findOne({
                id: msg.author.id
            }).exec()
            let faceitMsg,
            gllMsg = '',
            fppMsg = '',
            tppMsg = '',
            gameMode = ''
            if (user == null) {
                let nick = (msg.member.nickname) ? (msg.member.nickname) : (msg.author.username)
                let res = await limiter.schedule(async () => await pubg.getId(nick, apiKey))
                if (!res.ok) {
                    msg.reply('Сначало зарегестрируйте свой аккаунт')
                    return
                }
                res = res.json()
                user = {
                    serverId: msg.guild.id,
                    id: author.id,
                    username: msg.user.username,
                    nickname: (msg.member.nickname) ? (msg.member.nickname) : (null),
                    stats: {
                        updated: new Date(),
                        ingGameUsername: nick,
                        inGameId: res.data[0].id
                    }
                }
            }
            let id = user.stats.inGameId
            let stats = await limiter.schedule(() => pubg.getStats(id, apiKey))
            if (stats.ok) {
                stats = await stats.json()
                if (stats.data.attributes.gameModeStats.duo.roundsPlayed != 0 || stats.data.attributes.gameModeStats.squad.roundsPlayed != 0) {
                    tppMsg = new Discord.RichEmbed()
                        .setDescription(`${client.emojis.get('563454876441378825')} Пользователь: ${msg.member}\n${client.emojis.get('563463703861919754')} Nickname: [${user.stats.inGameUsername}](https://pubg.op.gg/user/${user.stats.ingGameUsername})`)
                        .attachFiles([`./images/${statsImg}`])
                        .setThumbnail(`attachment://${statsImg}`);
                        console.log(stats.data.attributes.gameModeStats.duo,stats.data.attributes.gameModeStats.squad)
                }
                if (stats.data.attributes.gameModeStats["squad-fpp"].roundsPlayed != 0 || stats.data.attributes.gameModeStats["duo-fpp"].roundsPlayed != 0) {
                    fppMsg = new Discord.RichEmbed()
                        .setDescription(`${client.emojis.get('563454876441378825')} Пользователь: ${msg.member}\n${client.emojis.get('563463703861919754')} Nickname: [${user.stats.inGameUsername}](https://pubg.op.gg/user/${user.stats.ingGameUsername})`)
                        .attachFiles([`./images/${statsImg}`])
                        .setThumbnail(`attachment://${statsImg}`);

                }
                if (stats.data.attributes.gameModeStats.duo.roundsPlayed > 0) {
                    gameMode = stats.data.attributes.gameModeStats.duo
                    tppMsg.addField(`:black_small_square:Duo-TPP`, `**Rank:** ${ranks[parseInt(gameMode.rankPointsTitle.split('-')[0]) - 1]} ${romanize(gameMode.rankPointsTitle.split('-')[1])}\n${client.emojis.get('573245802269638686')}**ELO:** ${Math.floor(gameMode.rankPoints)}\n${client.emojis.get('563087403410128951')}**K/D:** ${Math.round(gameMode.kills/(gameMode.roundsPlayed- gameMode.wins) * 100)/100}\n${client.emojis.get('563094124010405898')}**ADR:** ${Math.round(gameMode.damageDealt/gameMode.roundsPlayed)}\n${client.emojis.get('563447674368688128')}**Matches:** ${gameMode.roundsPlayed}`, true)
                }

                if (stats.data.attributes.gameModeStats.squad.roundsPlayed > 0) {
                    gameMode = stats.data.attributes.gameModeStats.squad
                    tppMsg.addField(`:black_small_square:Squad-TPP`, `**Rank:** ${ranks[parseInt(gameMode.rankPointsTitle.split('-')[0]) - 1]} ${romanize(gameMode.rankPointsTitle.split('-')[1])}\n${client.emojis.get('573245802269638686')}**ELO:** ${Math.floor(gameMode.rankPoints)}\n${client.emojis.get('563087403410128951')}**K/D:** ${Math.round(gameMode.kills/(gameMode.roundsPlayed- gameMode.wins) * 100)/100}\n${client.emojis.get('563094124010405898')}**ADR:** ${Math.round(gameMode.damageDealt/gameMode.roundsPlayed)}\n${client.emojis.get('563447674368688128')}**Matches:** ${gameMode.roundsPlayed}`, true)
                }

                if (stats.data.attributes.gameModeStats["duo-fpp"].roundsPlayed > 0) {
                    gameMode = stats.data.attributes.gameModeStats["duo-fpp"]
                    fppMsg.addField(`:black_small_square:Duo-FPP`, `**Rank:** ${ranks[parseInt(gameMode.rankPointsTitle.split('-')[0]) - 1]} ${romanize(gameMode.rankPointsTitle.split('-')[1])}\n${client.emojis.get('573245802269638686')}**ELO:** ${Math.floor(gameMode.rankPoints)}\n${client.emojis.get('563087403410128951')}**K/D:** ${Math.round(gameMode.kills/(gameMode.roundsPlayed- gameMode.wins) * 100)/100}\n${client.emojis.get('563094124010405898')}**ADR:** ${Math.round(gameMode.damageDealt/gameMode.roundsPlayed)}\n${client.emojis.get('563447674368688128')}**Matches:** ${gameMode.roundsPlayed}`, true)

                }
                if (stats.data.attributes.gameModeStats["squad-fpp"].roundsPlayed > 0) {
                    gameMode = stats.data.attributes.gameModeStats["squad-fpp"]
                    fppMsg.addField(`:black_small_square:Squad-FPP`, `**Rank:** ${ranks[parseInt(gameMode.rankPointsTitle.split('-')[0]) - 1]} ${romanize(gameMode.rankPointsTitle.split('-')[1])}\n${client.emojis.get('573245802269638686')}**ELO:** ${Math.floor(gameMode.rankPoints)}\n${client.emojis.get('563087403410128951')}**K/D:** ${Math.round(gameMode.kills/(gameMode.roundsPlayed- gameMode.wins) * 100)/100}\n${client.emojis.get('563094124010405898')}**ADR:** ${Math.round(gameMode.damageDealt/gameMode.roundsPlayed)}\n${client.emojis.get('563447674368688128')}**Matches:** ${gameMode.roundsPlayed}`, true)

                }
                user.stats.publicStats = {}
                user.stats.publicStats.duo = {}
                user.stats.publicStats.duo.teamKills = stats.data.attributes.gameModeStats.duo.teamKills
                user.stats.publicStats.duo.roadKills = stats.data.attributes.gameModeStats.duo.roadKills
                user.stats.publicStats.duo.kills = stats.data.attributes.gameModeStats.duo.kills
                user.stats.publicStats.duo.assists = stats.data.attributes.gameModeStats.duo.assists
                user.stats.publicStats.duo.headshotKills = stats.data.attributes.gameModeStats.duo.headshotKills
                
                user.stats.publicStats.duo.damageDealt = stats.data.attributes.gameModeStats.duo.damageDealt
                user.stats.publicStats.duo.dBNOs = stats.data.attributes.gameModeStats.duo.dBNOs
                user.stats.publicStats.duo.revives = stats.data.attributes.gameModeStats.duo.revives
                user.stats.publicStats.duo.suicides = stats.data.attributes.gameModeStats.duo.suicides

                user.stats.publicStats.duo.boosts = stats.data.attributes.gameModeStats.duo.boosts
                user.stats.publicStats.duo.heals = stats.data.attributes.gameModeStats.duo.heals
                
                user.stats.publicStats.duo.longestKill = stats.data.attributes.gameModeStats.duo.longestKill
                user.stats.publicStats.duo.longestTimeSurvived = stats.data.attributes.gameModeStats.duo.longestTimeSurvived
                user.stats.publicStats.duo.maxKillStreaks = stats.data.attributes.gameModeStats.duo.maxKillStreaks
                user.stats.publicStats.duo.mostSurvivalTime = stats.data.attributes.gameModeStats.duo.mostSurvivalTime
                user.stats.publicStats.duo.roundMostKills = stats.data.attributes.gameModeStats.duo.roundMostKills
                
                user.stats.publicStats.duo.weaponsAcquired = stats.data.attributes.gameModeStats.duo.weaponsAcquired
                user.stats.publicStats.duo.vehicleDestroys = stats.data.attributes.gameModeStats.duo.vehicleDestroys

                user.stats.publicStats.duo.walkDistance = stats.data.attributes.gameModeStats.duo.walkDistance
                user.stats.publicStats.duo.rideDistance = stats.data.attributes.gameModeStats.duo.rideDistance
                user.stats.publicStats.duo.swimDistance = stats.data.attributes.gameModeStats.duo.swimDistance
                user.stats.publicStats.duo.timeSurvived = stats.data.attributes.gameModeStats.duo.timeSurvived
                user.stats.publicStats.duo.roundsPlayed = stats.data.attributes.gameModeStats.duo.roundsPlayed
                user.stats.publicStats.duo.days = stats.data.attributes.gameModeStats.duo.days

                user.stats.publicStats.duo.top10 = stats.data.attributes.gameModeStats.duo.top10s
                user.stats.publicStats.duo.wins = stats.data.attributes.gameModeStats.duo.wins
                user.stats.publicStats.duo.losses = stats.data.attributes.gameModeStats.duo.losses
                
                user.stats.publicStats.duo.dailyKills = stats.data.attributes.gameModeStats.duo.dailyKills
                user.stats.publicStats.duo.dailyWins = stats.data.attributes.gameModeStats.duo.dailyWins
                user.stats.publicStats.duo.weeklyKills = stats.data.attributes.gameModeStats.duo.weeklyKills
                user.stats.publicStats.duo.weeklyWins = stats.data.attributes.gameModeStats.duo.weeklyWins
                
                user.stats.publicStats.duo.killPoints = stats.data.attributes.gameModeStats.duo.killPoints
                user.stats.publicStats.duo.winPoints = stats.data.attributes.gameModeStats.duo.winPoints
                user.stats.publicStats.duo.rankPoints = stats.data.attributes.gameModeStats.duo.rankPoints
                user.stats.publicStats.duo.rankPointsTitle = stats.data.attributes.gameModeStats.duo.rankPointsTitle




                user.stats.publicStats.duoFPP = {}
                user.stats.publicStats.duoFPP.teamKills = stats.data.attributes.gameModeStats["duo-fpp"].teamKills
                user.stats.publicStats.duoFPP.roadKills = stats.data.attributes.gameModeStats["duo-fpp"].roadKills
                user.stats.publicStats.duoFPP.kills = stats.data.attributes.gameModeStats["duo-fpp"].kills
                user.stats.publicStats.duoFPP.assists = stats.data.attributes.gameModeStats["duo-fpp"].assists
                user.stats.publicStats.duoFPP.headshotKills = stats.data.attributes.gameModeStats["duo-fpp"].headshotKills

                user.stats.publicStats.duoFPP.damageDealt = stats.data.attributes.gameModeStats["duo-fpp"].damageDealt
                user.stats.publicStats.duoFPP.dBNOs = stats.data.attributes.gameModeStats["duo-fpp"].dBNOs
                user.stats.publicStats.duoFPP.revives = stats.data.attributes.gameModeStats["duo-fpp"].revives
                user.stats.publicStats.duoFPP.suicides = stats.data.attributes.gameModeStats["duo-fpp"].suicides

                user.stats.publicStats.duoFPP.boosts = stats.data.attributes.gameModeStats["duo-fpp"].boosts
                user.stats.publicStats.duoFPP.heals = stats.data.attributes.gameModeStats["duo-fpp"].heals

                user.stats.publicStats.duoFPP.longestKill = stats.data.attributes.gameModeStats["duo-fpp"].longestKill
                user.stats.publicStats.duoFPP.longestTimeSurvived = stats.data.attributes.gameModeStats["duo-fpp"].longestTimeSurvived
                user.stats.publicStats.duoFPP.maxKillStreaks = stats.data.attributes.gameModeStats["duo-fpp"].maxKillStreaks
                user.stats.publicStats.duoFPP.mostSurvivalTime = stats.data.attributes.gameModeStats["duo-fpp"].mostSurvivalTime
                user.stats.publicStats.duoFPP.roundMostKills = stats.data.attributes.gameModeStats["duo-fpp"].roundMostKills

                user.stats.publicStats.duoFPP.weaponsAcquired = stats.data.attributes.gameModeStats["duo-fpp"].weaponsAcquired
                user.stats.publicStats.duoFPP.vehicleDestroys = stats.data.attributes.gameModeStats["duo-fpp"].vehicleDestroys

                user.stats.publicStats.duoFPP.walkDistance = stats.data.attributes.gameModeStats["duo-fpp"].walkDistance
                user.stats.publicStats.duoFPP.rideDistance = stats.data.attributes.gameModeStats["duo-fpp"].rideDistance
                user.stats.publicStats.duoFPP.swimDistance = stats.data.attributes.gameModeStats["duo-fpp"].swimDistance
                user.stats.publicStats.duoFPP.timeSurvived = stats.data.attributes.gameModeStats["duo-fpp"].timeSurvived
                user.stats.publicStats.duoFPP.roundsPlayed = stats.data.attributes.gameModeStats["duo-fpp"].roundsPlayed
                user.stats.publicStats.duoFPP.days = stats.data.attributes.gameModeStats["duo-fpp"].days

                user.stats.publicStats.duoFPP.top10 = stats.data.attributes.gameModeStats["duo-fpp"].top10s
                user.stats.publicStats.duoFPP.wins = stats.data.attributes.gameModeStats["duo-fpp"].wins
                user.stats.publicStats.duoFPP.losses = stats.data.attributes.gameModeStats["duo-fpp"].losses

                user.stats.publicStats.duoFPP.dailyKills = stats.data.attributes.gameModeStats["duo-fpp"].dailyKills
                user.stats.publicStats.duoFPP.dailyWins = stats.data.attributes.gameModeStats["duo-fpp"].dailyWins
                user.stats.publicStats.duoFPP.weeklyKills = stats.data.attributes.gameModeStats["duo-fpp"].weeklyKills
                user.stats.publicStats.duoFPP.weeklyWins = stats.data.attributes.gameModeStats["duo-fpp"].weeklyWins

                user.stats.publicStats.duoFPP.killPoints = stats.data.attributes.gameModeStats["duo-fpp"].killPoints
                user.stats.publicStats.duoFPP.winPoints = stats.data.attributes.gameModeStats["duo-fpp"].winPoints
                user.stats.publicStats.duoFPP.rankPoints = stats.data.attributes.gameModeStats["duo-fpp"].rankPoints
                user.stats.publicStats.duoFPP.rankPointsTitle = stats.data.attributes.gameModeStats["duo-fpp"].rankPointsTitle
                

                user.stats.publicStats.squad = {}
                user.stats.publicStats.squad.teamKills = stats.data.attributes.gameModeStats.squad.teamKills
                user.stats.publicStats.squad.roadKills = stats.data.attributes.gameModeStats.squad.roadKills
                user.stats.publicStats.squad.kills = stats.data.attributes.gameModeStats.squad.kills
                user.stats.publicStats.squad.assists = stats.data.attributes.gameModeStats.squad.assists
                user.stats.publicStats.squad.headshotKills = stats.data.attributes.gameModeStats.squad.headshotKills

                user.stats.publicStats.squad.damageDealt = stats.data.attributes.gameModeStats.squad.damageDealt
                user.stats.publicStats.squad.dBNOs = stats.data.attributes.gameModeStats.squad.dBNOs
                user.stats.publicStats.squad.revives = stats.data.attributes.gameModeStats.squad.revives
                user.stats.publicStats.squad.suicides = stats.data.attributes.gameModeStats.squad.suicides

                user.stats.publicStats.squad.boosts = stats.data.attributes.gameModeStats.squad.boosts
                user.stats.publicStats.squad.heals = stats.data.attributes.gameModeStats.squad.heals

                user.stats.publicStats.squad.longestKill = stats.data.attributes.gameModeStats.squad.longestKill
                user.stats.publicStats.squad.longestTimeSurvived = stats.data.attributes.gameModeStats.squad.longestTimeSurvived
                user.stats.publicStats.squad.maxKillStreaks = stats.data.attributes.gameModeStats.squad.maxKillStreaks
                user.stats.publicStats.squad.mostSurvivalTime = stats.data.attributes.gameModeStats.squad.mostSurvivalTime
                user.stats.publicStats.squad.roundMostKills = stats.data.attributes.gameModeStats.squad.roundMostKills

                user.stats.publicStats.squad.weaponsAcquired = stats.data.attributes.gameModeStats.squad.weaponsAcquired
                user.stats.publicStats.squad.vehicleDestroys = stats.data.attributes.gameModeStats.squad.vehicleDestroys

                user.stats.publicStats.squad.walkDistance = stats.data.attributes.gameModeStats.squad.walkDistance
                user.stats.publicStats.squad.rideDistance = stats.data.attributes.gameModeStats.squad.rideDistance
                user.stats.publicStats.squad.swimDistance = stats.data.attributes.gameModeStats.squad.swimDistance
                user.stats.publicStats.squad.timeSurvived = stats.data.attributes.gameModeStats.squad.timeSurvived
                user.stats.publicStats.squad.roundsPlayed = stats.data.attributes.gameModeStats.squad.roundsPlayed
                user.stats.publicStats.squad.days = stats.data.attributes.gameModeStats.squad.days

                user.stats.publicStats.squad.top10 = stats.data.attributes.gameModeStats.squad.top10s
                user.stats.publicStats.squad.wins = stats.data.attributes.gameModeStats.squad.wins
                user.stats.publicStats.squad.losses = stats.data.attributes.gameModeStats.squad.losses

                user.stats.publicStats.squad.dailyKills = stats.data.attributes.gameModeStats.squad.dailyKills
                user.stats.publicStats.squad.dailyWins = stats.data.attributes.gameModeStats.squad.dailyWins
                user.stats.publicStats.squad.weeklyKills = stats.data.attributes.gameModeStats.squad.weeklyKills
                user.stats.publicStats.squad.weeklyWins = stats.data.attributes.gameModeStats.squad.weeklyWins

                user.stats.publicStats.squad.killPoints = stats.data.attributes.gameModeStats.squad.killPoints
                user.stats.publicStats.squad.winPoints = stats.data.attributes.gameModeStats.squad.winPoints
                user.stats.publicStats.squad.rankPoints = stats.data.attributes.gameModeStats.squad.rankPoints
                user.stats.publicStats.squad.rankPointsTitle = stats.data.attributes.gameModeStats.squad.rankPointsTitle






                user.stats.publicStats.squadFPP = {}
                user.stats.publicStats.squadFPP.teamKills = stats.data.attributes.gameModeStats["squad-fpp"].teamKills
                user.stats.publicStats.squadFPP.roadKills = stats.data.attributes.gameModeStats["squad-fpp"].roadKills
                user.stats.publicStats.squadFPP.kills = stats.data.attributes.gameModeStats["squad-fpp"].kills
                user.stats.publicStats.squadFPP.assists = stats.data.attributes.gameModeStats["squad-fpp"].assists
                user.stats.publicStats.squadFPP.headshotKills = stats.data.attributes.gameModeStats["squad-fpp"].headshotKills

                user.stats.publicStats.squadFPP.damageDealt = stats.data.attributes.gameModeStats["squad-fpp"].damageDealt
                user.stats.publicStats.squadFPP.dBNOs = stats.data.attributes.gameModeStats["squad-fpp"].dBNOs
                user.stats.publicStats.squadFPP.revives = stats.data.attributes.gameModeStats["squad-fpp"].revives
                user.stats.publicStats.squadFPP.suicides = stats.data.attributes.gameModeStats["squad-fpp"].suicides

                user.stats.publicStats.squadFPP.boosts = stats.data.attributes.gameModeStats["squad-fpp"].boosts
                user.stats.publicStats.squadFPP.heals = stats.data.attributes.gameModeStats["squad-fpp"].heals

                user.stats.publicStats.squadFPP.longestKill = stats.data.attributes.gameModeStats["squad-fpp"].longestKill
                user.stats.publicStats.squadFPP.longestTimeSurvived = stats.data.attributes.gameModeStats["squad-fpp"].longestTimeSurvived
                user.stats.publicStats.squadFPP.maxKillStreaks = stats.data.attributes.gameModeStats["squad-fpp"].maxKillStreaks
                user.stats.publicStats.squadFPP.mostSurvivalTime = stats.data.attributes.gameModeStats["squad-fpp"].mostSurvivalTime
                user.stats.publicStats.squadFPP.roundMostKills = stats.data.attributes.gameModeStats["squad-fpp"].roundMostKills

                user.stats.publicStats.squadFPP.weaponsAcquired = stats.data.attributes.gameModeStats["squad-fpp"].weaponsAcquired
                user.stats.publicStats.squadFPP.vehicleDestroys = stats.data.attributes.gameModeStats["squad-fpp"].vehicleDestroys

                user.stats.publicStats.squadFPP.walkDistance = stats.data.attributes.gameModeStats["squad-fpp"].walkDistance
                user.stats.publicStats.squadFPP.rideDistance = stats.data.attributes.gameModeStats["squad-fpp"].rideDistance
                user.stats.publicStats.squadFPP.swimDistance = stats.data.attributes.gameModeStats["squad-fpp"].swimDistance
                user.stats.publicStats.squadFPP.timeSurvived = stats.data.attributes.gameModeStats["squad-fpp"].timeSurvived
                user.stats.publicStats.squadFPP.roundsPlayed = stats.data.attributes.gameModeStats["squad-fpp"].roundsPlayed
                user.stats.publicStats.squadFPP.days = stats.data.attributes.gameModeStats["squad-fpp"].days

                user.stats.publicStats.squadFPP.top10 = stats.data.attributes.gameModeStats["squad-fpp"].top10s
                user.stats.publicStats.squadFPP.wins = stats.data.attributes.gameModeStats["squad-fpp"].wins
                user.stats.publicStats.squadFPP.losses = stats.data.attributes.gameModeStats["squad-fpp"].losses

                user.stats.publicStats.squadFPP.dailyKills = stats.data.attributes.gameModeStats["squad-fpp"].dailyKills
                user.stats.publicStats.squadFPP.dailyWins = stats.data.attributes.gameModeStats["squad-fpp"].dailyWins
                user.stats.publicStats.squadFPP.weeklyKills = stats.data.attributes.gameModeStats["squad-fpp"].weeklyKills
                user.stats.publicStats.squadFPP.weeklyWins = stats.data.attributes.gameModeStats["squad-fpp"].weeklyWins

                user.stats.publicStats.squadFPP.killPoints = stats.data.attributes.gameModeStats["squad-fpp"].killPoints
                user.stats.publicStats.squadFPP.winPoints = stats.data.attributes.gameModeStats["squad-fpp"].winPoints
                user.stats.publicStats.squadFPP.rankPoints = stats.data.attributes.gameModeStats["squad-fpp"].rankPoints
                user.stats.publicStats.squadFPP.rankPointsTitle = stats.data.attributes.gameModeStats["squad-fpp"].rankPointsTitle
            }
            id = await pubg.getFaceitId(id)
            if (id.ok) {
                id = await id.json()
                user.stats.faceitStats = {}
                user.stats.faceitStats.id = id.player_id
                user.stats.faceitStats.url = id.faceit_url
                if (id.games.pubg) {
                    user.stats.faceitStats.region = id.games.pubg.region
                    user.stats.faceitStats.lvl = id.games.pubg.skill_level
                    user.stats.faceitStats.elo = id.games.pubg.faceit_elo
                    stats = await pubg.getFaceitStats(user.stats.faceitStats.id)
                    if (stats.ok) {
                        stats = await stats.json()
                        faceitMsg = new Discord.RichEmbed()
                            .setDescription(`${client.emojis.get('563454876441378825')} Пользователь: ${msg.member}\n${client.emojis.get('563463703861919754')} Nickname: [${user.stats.inGameUsername}](${user.stats.faceitStats.url.replace('{lang}','ru')})`)
                            .attachFiles([`./images/${statsImg}`])
                            .setThumbnail(`attachment://${statsImg}`)
                            .addField(`${client.emojis.get('564377863973896192')} Faceit`, `**Rank:** ${user.stats.faceitStats.lvl}\n${client.emojis.get('573245802269638686')}**ELO:** ${user.stats.faceitStats.elo}\n${client.emojis.get('563087403410128951')}**K/D:** ${stats.lifetime['K/D Ratio']}\n${client.emojis.get('563094124010405898')}**ADR:** ${stats.lifetime['Average Damage Dealt']}\n${client.emojis.get('563447674368688128')}**AVG Rank:** ${stats.lifetime['Average Placement']}[${stats.lifetime['Total Matches']}]`, true)
                            user.stats.faceitStats.kd = stats.lifetime["K/D Ratio"];
                            user.stats.faceitStats.adr = stats.lifetime["Average Damage Dealt"];
                            user.stats.faceitStats.avgAssists = stats.lifetime["Average Assists"];
                            user.stats.faceitStats.avgDistance = stats.lifetime["Average Distance (m)"];
                            user.stats.faceitStats.avgPlacement = stats.lifetime["Average Placement"];
                            user.stats.faceitStats.avgTimeSurvived = stats.lifetime["Average Time Survived (s)"];
                            user.stats.faceitStats.avgHeadshotKills = stats.lifetime["Average Headshot Kills"];
                            user.stats.faceitStats.HeadshotProcent = stats.lifetime["Headshot (%)"];
                            user.stats.faceitStats.kts = stats.lifetime["KTS"];
                            user.stats.faceitStats.longestKill =stats.lifetime["Longest Kill (m)"];
                            user.stats.faceitStats.mostKills = stats.lifetime["Most Kills"];
                            user.stats.faceitStats.recentPlacement = stats.lifetime["Recent Placements"];
                            user.stats.faceitStats.top10 = stats.lifetime["Top 10 (%)"];
                            user.stats.faceitStats.top10Finish = stats.lifetime["Top 10 Finish"];
                            user.stats.faceitStats.top5Finish = stats.lifetime["Top 5 Finish"];
                            user.stats.faceitStats.winRate = stats.lifetime["Win Rate"];
                            user.stats.faceitStats.wins = stats.lifetime["Wins"];
                            user.stats.faceitStats.Assists = stats.lifetime["Total Assists"];
                            user.stats.faceitStats.DNBOs = stats.lifetime["Total DBNOs"];
                            user.stats.faceitStats.damage = stats.lifetime["Total Damage Dealt"];
                            user.stats.faceitStats.distance = stats.lifetime["Total Distance (m)"];
                            user.stats.faceitStats.headshotKills = stats.lifetime["Total Headshots Kills"];
                            user.stats.faceitStats.kills = stats.lifetime["Total Kills"];
                            user.stats.faceitStats.matches = stats.lifetime["Total Matches"];
                            user.stats.faceitStats.revives = stats.lifetime["Total Revives"];
                            user.stats.faceitStats.rideDistance = stats.lifetime["Total Ride Distance (m)"];
                            user.stats.faceitStats.swimDistance = stats.lifetime["Total Swim Distance (m)"];
                            user.stats.faceitStats.walkDistance = stats.lifetime["Total Walk Distance (m)"];
                            user.stats.faceitStats.timePlayed = stats.lifetime["Total Time Played"];

                    }
                }
            }
            stats = await pubg.getGllStats(user.stats.inGameUsername)
            if (stats.ok) {
                stats = await stats.json()
                gllMsg = new Discord.RichEmbed()
                    .setDescription(`${client.emojis.get('563454876441378825')} Пользователь: ${msg.member}\n${client.emojis.get('563463703861919754')} Nickname: ${user.stats.inGameUsername}`)
                    .addField(`${client.emojis.get('564378907080392743')} GLL`, `${client.emojis.get('563087403410128951')}**K/D:** ${stats.averageKillsPerRound}\n${client.emojis.get('563094124010405898')}**ADR:** ${stats.averageDamageDonePerRound}\n**Weapon:** ${stats.bestWeapon}\n${client.emojis.get('563464576025362472')}**TOP5:** ${Math.round(stats.topFivePlacements/stats.roundsPlayed * 100 * 100) / 100}% [${stats.roundsPlayed}]\n${client.emojis.get('563959519936249887')}**Wins:** ${stats.numberOfWins}`, true)
                    .attachFiles([`./images/${statsImg}`])
                    .setThumbnail(`attachment://${statsImg}`);
                    user.stats.gllStats = undefined
                    user.stats.gllStats = {}
                    user.stats.gllStats.matches = stats.roundsPlayed
                    user.stats.gllStats.wins = stats.numberOfWins
                    user.stats.gllStats.weapon = stats.bestWeapon
                    user.stats.gllStats.top5 = stats.topFivePlacements
                    user.stats.gllStats.shots = stats.shotsFired
                    user.stats.gllStats.accuracy = stats.accuracy
                    user.stats.gllStats.headShots = stats.headshots
                    user.stats.gllStats.kills = stats.totalKills
                    user.stats.gllStats.assists = stats.assistedKills
                    user.stats.gllStats.damage = stats.damageDone
                    user.stats.gllStats.takenDamage = stats.damageTaken
                    user.stats.gllStats.knockouts = stats.totalKnockoutsDealt
                    user.stats.gllStats.takenKnockouts = stats.totalKnockoutsTaken
                    user.stats.gllStats.revives = stats.totalRevivesDealt
                    user.stats.gllStats.takenRevives = stats.totalRevivesTaken
                    user.stats.gllStats.medicineUsed = stats.totalHealthKitsUsed
                    user.stats.gllStats.granadesUsed = stats.totalGrenadesUsed
                    user.stats.gllStats.headShotsRation = stats.headshotRatio
                    user.stats.gllStats.avg_kd = stats.averageKillsPerRound
                    user.stats.gllStats.avg_assists = stats.averageAssistsPerRound
                    user.stats.gllStats.avg_damate = stats.averageDamageDonePerRound
                    user.stats.gllStats.avg_takenDamage = stats.averageDamageTakenPerRound
                    user.stats.gllStats.avg_knockouts = stats.averageKnockoutsDealtPerRound
                    user.stats.gllStats.avg_takenKnockouts = stats.averageKnockoutsTakenPerRound
                    user.stats.gllStats.avg_revives = stats.averageRevivesDealtPerRound
                    user.stats.gllStats.avg_takenRevives = stats.averageRevivesTakenPerRound
                    user.stats.gllStats.avg_medicineUsed = stats.averageHealthKitsUsedPerRound
                    user.stats.gllStats.avg_granades = stats.averageGrenadesUsedPerRound
            }
            let objs = [{
                id: '567081951182192660',
                message: fppMsg,
                current: true
            },
            {
                id: '567082478062403609',
                message: tppMsg,
                current: false
            },
            {
                id: '564377863973896192',
                message: faceitMsg,
                current: false
            },
            {
                id: '564378907080392743',
                message: gllMsg,
                current: false
            }
        ]
            msg.channel.send(fppMsg).then(async message => {
                for(x in objs){
                    if(objs[x].message != ''){
                        await message.react(client.emojis.get(objs[x].id))
                    }
                }
                const filter = (reaction, user) => (reaction.emoji.id == '564377863973896192' || reaction.emoji.id == '564378907080392743' || reaction.emoji.id == '567081951182192660' || reaction.emoji.id == '567082478062403609') && !user.bot
                const collector = message.createReactionCollector(filter, {
                    time: 60 * 15 * 1000
                });
                collector.on('collect', async r => {
                    r.users.forEach((x) =>{
                        if(!x.bot){
                            console.log(x)
                            r.remove(x)
                        }
                    })
                       
                    if (objs.some(f => f.id == r.emoji.id && f.current == true)) {} else {
                        objs.forEach(x => x.current = false)
                        objs.forEach(x => {if(x.id == r.emoji.id) x.current = true})
                        if(objs.find(x => x.id == r.emoji.id).message != ''){
                            r.message.edit(objs.find(x => x.id == r.emoji.id).message)
                        }
                        
                    }
                });
                collector.on('end', collected => console.log(`Collected ${collected.size} items`));
            })
            user.save().then().catch(err => console.error(err))
        }

    }
}