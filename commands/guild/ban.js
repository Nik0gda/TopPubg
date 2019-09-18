const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    config: {
        name: 'ban',
        aliases: ['бан']
    },
    run: async (client, msg, args) => {
        if (msg.channel.id === '622737189364695040') {
            msg.delete()
            if (!msg.mentions.members.first()) {
                let message = await msg.channel.send('Пожалуйста уточните человека которого вы хотите забанить у себя в руме. Пример: `!ban @kr0cky#1337`')
                message.delete(15 * 1000)
            } else {
                let guild = client.guilds.get("303793341529718784");
                let user = guild.members.get(msg.author.id)
                var premRoleId = user.roles.find(x => x.name.toLowerCase().startsWith('prem')).id
                let premCategory = guild.channels.get("371230249398173708");
                let channels = premCategory.children
                let truFal = 0
                channels.forEach(element => {
                    if (element.permissionOverwrites.has(premRoleId)) {
                        truFal = element.id
                    }
                });
                if (truFal == 0) {
                    let message = await msg.reply('У вас нет своей комнаты!')
                    message.delete(10 * 1000)
                }else{
                    guild.channels.get(truFal).overwritePermissions(msg.mentions.members.first(), {
                        'VIEW_CHANNEL': false,
                        'CONNECT': false
                        
                    })
                    let message = await msg.reply(`Вы успешно забанили игрока ${msg.mentions.members.first()} у себя в комнате!`)
                    message.delete(10*1000)
                    guild.channels.get('563839723395874827').send(`${user} забанил у себя в комнате игрока ${msg.mentions.members.first()}`)
                }
               
            }
        }

    }
}