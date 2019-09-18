const {
    prefix
} = require('../../botconfig.json');

module.exports = async (client, msg) => {
    if (msg.author.bot || msg.channel.type === 'dm') return;
    if (msg.content[0] === prefix){
        var args = msg.content.slice(prefix.length).trim().split(/ +/g)
    }else{
        var args = msg.content.trim().split(/ +/g)
    }
    
    
    let cmd = args.shift().toLowerCase()
    let commandFile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd)) || client.commands.get(client.prefix.get(cmd[0]))
    if (commandFile) commandFile.run(client, msg, args)
}