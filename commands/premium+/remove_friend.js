const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
        config: {
            name: 'remove',
            aliases: ['un','удалить','гт','куьщму','delete@']
        },
        run: async (client, msg, args) => {
            if (msg.channel.id === '622737189364695040') {
                msg.delete().catch(error => console.error)
                let guild = client.guilds.get("303793341529718784");
                let user = guild.members.get(msg.author.id)
                var premRoleId = user.roles.find(x => x.name.toLowerCase().startsWith('prem ')).id
                let premCategory = guild.channels.get("371230249398173708");
                let channels = premCategory.children
                let truFal = 0
                channels.forEach(element => {
                    if (element.permissionOverwrites.has(premRoleId)) {
                        truFal = element.id
                    }
                });
                if(!guild.members.get(user.id).roles.has('562728244785315890')){
                    msg.author.send(`Чтоб использовать эту команду вам нужна роль \`Premium+\``)
                    return
                }
                if (truFal == 0) {
                    msg.author.send('У вас нет своей комнаты!')
                    return;
                }
                if(!msg.mentions.members.first()){
                    msg.author.send(`Пожалуйста укажите игрока которого вы хотите удалить из друзей, пример: \`!un friend @kr0cky#1337\`!`);
                    return;
                }
                let mentioned_user = msg.mentions.members.first()
                if(guild.channels.get(truFal).permissionsFor(guild.members.get(mentioned_user.id))){
                    guild.channels.get(truFal).permissionOverwrites.get(mentioned_user.id).delete()
                    msg.author.send('Вы успешно удалили из друзей игрока ' + mentioned_user)
                    guild.channels.get('563839723395874827').send(`${user} удалил из друзей игрока ${msg.mentions.members.first()}`)
                }else{
                    msg.author.send('Этого человека нету у вас в друзьях ' + mentioned_user)
                }
            }
        }
    }