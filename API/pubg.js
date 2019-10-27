const fetch = require('node-fetch')
const constants = require('../MongoDB/Schema/constants')
const link = 'https://api.pubg.com/shards/steam'
const faceitLink = 'https://open.faceit.com/data/v4'
const faceitKey = require('../auth.json').faceitApi

async function seasons(token) {
    const params = {"Accept": "application/vnd.api+json","Authorization": `Bearer ${token}`} 
    let response = await fetch(`${link}/seasons`,{headers: params })
    if(!response.ok){  
        return response
    }
    response = await response.json()
    response = response.data.find(x => x.attributes.isCurrentSeason == true)
    return response.id
    
}


async function getId(nickName,token) {
    const params = {"Accept": "application/vnd.api+json","Authorization": `Bearer ${token}`} 
    let season = await constants.find({}).exec()
    season = season[0].season
    console.log(season)
    let response = await fetch(`${link}/players?filter[playerNames]=${nickName}`,{headers: params})
    return response
}

async function getStats(id,token) {
    const params = {"Accept": "application/vnd.api+json","Authorization": `Bearer ${token}`} 
    let season = await constants.find({}).exec()
    season = season[0].season
    let response = await fetch(`${link}/players/${id}/seasons/${season}`,{headers:params})
    return response
}

async function getFaceitId(id) {
    const params = {"accept": "application/vnd.api+json","Authorization": `Bearer ${faceitKey}`} 
    let response = await fetch(`${faceitLink}/players?game=pubg&game_player_id=${id}`,{headers:params})
    return response
}

async function getFaceitStats(id) {
    const params = {"accept": "application/vnd.api+json","Authorization": `Bearer ${faceitKey}`} 
    let response = await fetch(`${faceitLink}/players/${id}/stats/pubg`,{headers:params})
    return response
}

async function getGllStats(nickName) {
    let response = await fetch(`https://play.gll.gg/api/pubg/stats/playerStats?pubgNick=${nickName}`)
    return response
}


module.exports = {seasons, getId, getStats, getFaceitId, getFaceitStats, getGllStats}