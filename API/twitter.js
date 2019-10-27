const fetch = require('node-fetch')
const Twitter = require('twitter');
module.exports = async () => {
    let client = new Twitter({
        consumer_key: 'CwPVkFG1JnM8FDT0Q4QlZrBIw',
        consumer_secret: 'VyI7Dhx0tEV5qztbTsnNDjz8kuyNGcwWZryh4XSIFJ6RqwnDRw',
        access_token_key: '980015673744162817-HtyoLYmWSmY4w5gEzUvRe1XX9bflWSa',
        access_token_secret: 'xckxqVAvMzuC9qdwtmeP07BWeYEZ5YrqhD2Zzqw0h2vO0'
      });
    let params = {screen_name: 'PUBG_RU', count: '1'};
    let body = await client.get('statuses/user_timeline', params)
    return body
}