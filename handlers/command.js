const {readdirSync} = require('fs');

module.exports.run = (client) =>{
    const load = dirs =>{
        const commands = readdirSync(`./commands/${dirs}`).filter(d => d.endsWith('.js'))
        for (let file of commands){
            const pull = require(`../commands/${dirs}/${file}`)
            client.commands.set(pull.config.name,pull)
            if(pull.config.aliases) pull.config.aliases.forEach(a => client.aliases.set(a,pull.config.name))
            
            if(pull.config.prefix) pull.config.prefix.forEach(a => client.prefix.set(a,pull.config.name))
        }
    };
    ['guild','premium+','moderation'].forEach(x => load(x))
}