const Discord = require('discord.js');
const client = new Discord.Client();
const botConfig = require('./botConfig.json')
const auth = require('./auth.json');


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(auth.token);

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove'
};
client.on('raw', async event => {
    if (!events.hasOwnProperty(event.t)) return;

    const {
        d: data
    } = event;
    let type = event.t
    let user = client.users.get(data.user_id);
    const channel = client.channels.get(data.channel_id)
    channel.fetchMessage(data.message_id).then(message => {
        if (channel.id === '622358203614625792') {
            let guild = client.guilds.get("303793341529718784");
            user = guild.members.find(userr => userr.id == user.id);
            let news = guild.roles.find(role => role.id === '622357937012342784')
            console.log(event.d.emoji.id == '622365605198299136', type == 'MESSAGE_REACTION_REMOVE')
            if (type === 'MESSAGE_REACTION_ADD') {
                console.log(3)
                if (event.d.emoji.id === '622365605198299136') {
                    console.log(1)
                    if (user.roles.has(news.id)) {
                        return
                    } else {
                        user.addRole(news.id)
                    }
                }
            }
            if (type == 'MESSAGE_REACTION_REMOVE') {
                if (event.d.emoji.id === '622365605198299136') {
                    console.log(1)
                    if (!user.roles.has(news.id)) {
                        console.log(2)
                        return
                    } else {
                        console.log(3)
                        user.removeRole(news.id)
                    }
                }

            }


        }

        if (channel.id === '622737189364695040') {
            let guild = client.guilds.get("303793341529718784");
            user = guild.members.find(userr => userr.id == user.id);
            var premRoleId = user.roles.find(x => x.name.toLowerCase().startsWith('prem')).id
            let premCategory = guild.channels.get("371230249398173708");
            let channels = premCategory.children
            let truFal = 0
            channels.forEach(element => {
                if (element.permissionOverwrites.has(premRoleId)) {
                    truFal = element.id
                }
            });
            if (truFal == 0) return
            if (type === 'MESSAGE_REACTION_ADD') {
                console.log(3)
                if (event.d.emoji.name === '🔗') {
                    let stats = '564358627859628042'
                    if (user.roles.has(stats)) {
                        return
                    } else {
                        user.addRole(stats)
                    }
                }
            }
            if (type == 'MESSAGE_REACTION_REMOVE') {
                if (event.d.emoji.name === '🔗') {
                    let stats = '564358627859628042'
                    if (!user.roles.has(stats)) {
                        console.log(2)
                        return
                    } else {
                        console.log(3)
                        user.removeRole(stats)
                    }
                }

            }
            let every = guild.roles.get('303793341529718784')

            if (type === 'MESSAGE_REACTION_ADD') {
                if (event.d.emoji.name === '🗣') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'USE_VAD': false
                    })
                }
                if (event.d.emoji.name === '🏠') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'VIEW_CHANNEL': true
                    })
                }

            }
            if (type == 'MESSAGE_REACTION_REMOVE') {
                if (event.d.emoji.name === '🗣') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'USE_VAD': true
                    })
                }
                if (event.d.emoji.name === '🏠') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'VIEW_CHANNEL': false
                    })
                }
            }

            if (event.d.emoji.name === '📛') {
                channel.send('Чтоб заблокировать доступ к своей комнате игроку напишите `!ban @Игрок`. Пример: `!ban @kr0cky#1337`').then(msg => msg.delete(1000 * 45))
            }
            if (event.d.emoji.name === '🛑') {
                channel.send('Чтоб разблокировать доступ к своей комнате игроку напишите `!ban @Игрок`. Пример: `!ban @kr0cky#1337`').then(msg => msg.delete(1000 * 45))
            }


            function checkForPrem(channel,user,guild){
                if(!guild.members.get(user.id).roles.has('562728244785315890')){
                    channel.send(`Чтоб использовать эту команду вам нужна роль \`Premium+\``).then(mssg => mssg.delete(15 * 1000))
                    return false
                }else{
                    return true
                }
            }


            if (event.d.emoji.name === '🔅') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('Укажите 6ти значный Hex-код после #. `Пример:#89df63`').then(msg => msg.delete(1000 * 45))
            }
            if (event.d.emoji.name === '🎯') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('Чтобы установить ограничения на вход в премиум комнату по адр напишите `t`(для режима tpp) или `f`(для режима fpp) для быбора режима и после них количество адр. Пример: `f350`.').then(msg => msg.delete(1000 * 45))
            }
            if (event.d.emoji.name === '✅') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('Чтоб добавить друга в премиум комнаты (игрок будет всегда ее видеть, даже тогда когда там никого нет). Пример: `!friend @kr0cky#1337`').then(msg => msg.delete(1000 * 45))
            }
            if (event.d.emoji.name === '🚷') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('Чтоб удалить друга из премиум комнаты (игрок больше не будет ее видеть когда в ней никого нет). Пример: `!un friend @kr0cky#1337``').then(msg => msg.delete(1000 * 45))
            }
            if (event.d.emoji.name === '⚜') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('Чтоб зайти в полную руму к игроку напишите `!join @Игрок`. Пример: `!join @kr0cky#1337`').then(msg => msg.delete(1000 * 45))
            }
            if (event.d.emoji.name === '🔃') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('Чтоб переместить другого игрока себе в руму напишите `!move @Игрок`. Пример: `!move @kr0cky#1337`').then(msg => msg.delete(1000 * 45))
                
            }

            
        }
    })
})

client.on('guildMemberUpdate', async (msg) => {
    let entry = await msg.guild.fetchAuditLogs({
        type: 'MEMBER_ROLE_UPDATE'
    }).then(audit => audit.entries.first())
    if (entry.action === 'MEMBER_ROLE_UPDATE') {
        let type = entry.changes[0].key;
        if (type === '$add') {
            if (entry.changes[0].new[0].id === '569130239641387023') {
                let guild = client.guilds.get("303793341529718784");
                let user = guild.members.find(user => user.id === entry.target.id)
                let news = guild.roles.find(role => role.id === '564358627859628042')
                user.addRole(news)
            }
        }
    }
});




['commands', 'aliases','prefix'].forEach(x => client[x] = new Discord.Collection());
['console', 'command', 'event'].forEach(x => require(`./handlers/${x}.js`).run(client));

