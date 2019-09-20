const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    config: {
        name: 'add',
        aliases: ['адд','фвв','friend','фриенд']
    },
    run: async (client, msg, args) => {
        console.log(3)
        if (msg.channel.id === '622737189364695040') {
            msg.delete()
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
            if(!guild.members.get(user.id).roles.has('562728244785315890')){
                msg.channel.send(`Чтоб использовать эту команду вам нужна роль \`Premium+\``).then(mssg => mssg.delete(15 * 1000))
                return
            }
            if (truFal == 0) {
                let message = await msg.reply('У вас нет своей комнаты!')
                message.delete(10 * 1000)
                return;
            }
            if(!msg.mentions.members.first()){
                let message = await msg.channel.send(`Пожалуйста укажите игрока которого вы хотите добавить в друзья, пример: \`!add @kr0cky#1337\`!`);
                message.delete(15 * 1000);
                return;
            }
            let mentioned_user = msg.mentions.members.first()
            let friends = 0
            let hasf = false
            guild.channels.get(truFal).permissionOverwrites.forEach( x  => {
                if (x.type == 'member'){
                    if(guild.channels.get(truFal).permissionsFor(guild.members.get(x.id))){
                        if (guild.channels.get(truFal).permissionsFor(guild.members.get(x.id)).has(['VIEW_CHANNEL','CONNECT']))
                        if(mentioned_user.id === x.id){
                            msg.channel.send(`Игрок ${mentioned_user} уже у вас в друзьях`).then(y => y.delete(15 * 1000))
                            hasf = true
                        }
                        friends++
                    } 
                }
            })
            if (hasf) return;
            if (friends >= 3){
                let message = await msg.channel.send(`У вас уже и так 3 друга, что является лимитом!`);
                message.delete(15 * 1000);
                return;
            }
            guild.channels.get(truFal).overwritePermissions(msg.mentions.members.first(), {
                'VIEW_CHANNEL': true,
                'CONNECT': true
                
            })
            let message = await msg.reply(`Вы успешно добавили игрока ${msg.mentions.members.first()} в друзья!`)
            message.delete(10*1000)
            guild.channels.get('563839723395874827').send(`${user} добавил себе в друзья игрока ${msg.mentions.members.first()}`)

        }
    }
}