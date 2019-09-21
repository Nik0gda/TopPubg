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
    if (user.bot) return
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
                        user.send('🔗 Роль `🔫Stats` была успешно присвоена!')
                        channel.send('🔗 Роль `🔫Stats` была успешно присвоена!')
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
                        user.send('🔗 Роль `🔫Stats` была успешно снята!')
                        channel.send('🔗 Роль `🔫Stats` была успешно снята!').then(mssg => mssg.delete(15 * 1000))
                    }
                }

            }
            let every = guild.roles.get('303793341529718784')

            if (type === 'MESSAGE_REACTION_ADD') {
                if (event.d.emoji.name === '🗣') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'USE_VAD': false
                    })
                    user.send(`🗣 Активация по голосу в \`${guild.channels.get(truFal).name}\` была активирована!`)
                    channel.send(`🗣 Активация по голосу в \`${guild.channels.get(truFal).name}\` была активирована!`).then(mssg => mssg.delete(15 * 1000))
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
                    user.send(`🗣 Активация по голосу в \`${guild.channels.get(truFal).name}\` была деактивирована!`)
                    channel.send(`🗣 Активация по голосу в \`${guild.channels.get(truFal).name}\` была деактивирована!`).then(mssg => mssg.delete(15 * 1000))
                }
                if (event.d.emoji.name === '🏠') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'VIEW_CHANNEL': false
                    })
                }
            }
     function pagination(obj,guild,author_id){
                    let text = ``
                    for (i in obj){
                        if(author_id.id === obj[i].id) {}else{
                            text+= `\n       ${obj[i].number}: ${guild.members.get(obj[i].id)}`
                        }
                           
                    }
                    return text
                    
                }
                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
            if (event.d.emoji.name === '📛') {
           
                let user_obj = []
                let number = 0
                let channel = guild.channels.get(truFal)
                let numbers = [':one:' , ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:']
                let emojis = ['1⃣','2⃣','3⃣','3⃣','4⃣','5⃣','6⃣','7⃣','8⃣','9⃣']
                channel.members.forEach(x => {
                   if(number > 8){
                       return
                   }
                   if(x.id === user.id){

                   }else{
                    user_obj.push({
                       'number' : emojis[number],
                       'id' : x.id
                    })
                    number++
                }
                })
                
                client.channels.get(data.channel_id).send(`📛 Выберите, кого вы хотите забанить:${pagination(user_obj,guild,user.id)}\nили напишите \`!ban @kr0cky#1337\`
                    `).then(message =>{
                        for(let i = 0; i < number; i++){
                        message.react(emojis[i]);
                        sleep(200)
                        }
                        let member = user
                        console.log(member.id)
                        
                        const filter = (reaction,action_member) => action_member.id === member.id
                        console.log(filter)
                        const collector = message.createReactionCollector(filter, { time: 20000 });
                        message.delete(20*1000)
                        collector.on('collect', r => {console.log(`Collected ${r.emoji.name},banned ${user_obj.find(x => x.number === r.emoji.name).id}`)
                                        if(guild.members.get(user_obj.find(x => x.number === r.emoji.name).id).voiceChannel){
                                            guild.members.get(user_obj.find(x => x.number === r.emoji.name).id).setVoiceChannel(guild.channels.get('372491862100934658'))
                                            guild.channels.get(truFal).overwritePermissions(guild.members.get(user_obj.find(x => x.number === r.emoji.name).id),{
                                                'CONNECT': false
                                                
                                            })
                                            user.send(`Вы успешно забанили ${guild.members.get(user_obj.find(x => x.number === r.emoji.name).id)} в комнате ${guild.channels.get(truFal).name}`)
                                        }   
                    });
                        collector.on('end', collected => console.log(`Collected ${collected.size} items`));
                    })
                    // Create a reaction collector
              
                console.log(user_obj)
            }



            if (event.d.emoji.name === '🛑') {
               let emojis = ['1⃣','2⃣','3⃣','3⃣','4⃣','5⃣','6⃣','7⃣','8⃣','9⃣']
               let banned_players = []
               let number = 0
               let user_obj = []
               guild.channels.get(truFal).permissionOverwrites.forEach(x => {
                   if(number > 8){
                        return
                    } 
                   if(x.type === 'member'){
                    banned_players.push(x.id)
                    if(!guild.channels.get(truFal).permissionsFor(guild.members.get(x.id)).has('CONNECT',false)){
                        if(x.id === user.id){}else{
          
                            user_obj.push({
                               'number' : emojis[number],
                               'id' : x.id
                            })
                            number++
                        }
                    }
                    
                   }
               })
               console.log(user_obj)
                client.channels.get(data.channel_id).send(`📛 Выберите, кого вы хотите разбанить:${pagination(user_obj,guild,user.id)}\nили напишите \`!unban @kr0cky#1337\`
                `).then(message =>{
                    for(let i = 0; i < number; i++){
                    message.react(emojis[i]);
                    sleep(200)
                    }
                    let member = user
                    console.log(member.id)
                    
                    const filter = (reaction,action_member) => action_member.id === member.id
                    console.log(filter)
                    const collector = message.createReactionCollector(filter, { time: 20000 });
                    message.delete(20*1000)
                    collector.on('collect', r => {console.log(`Collected ${r.emoji.name},unbanned ${user_obj.find(x => x.number === r.emoji.name).id}`);
                    guild.channels.get(truFal).permissionOverwrites.get(user_obj.find(x => x.number === r.emoji.name).id).delete()
                    user.send(`Вы успешно разбанили ${guild.members.get(user_obj.find(x => x.number === r.emoji.name).id)} в комнате ${guild.channels.get(truFal).name}`)
                });
                    collector.on('end', collected => console.log(`Collected ${collected.size} items`));
                })
                // Create a reaction collector
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
                function getRandomColor() {
                    var letters = '0123456789ABCDEF';
                    var color = '#';
                    for (var i = 0; i < 6; i++) {
                      color += letters[Math.floor(Math.random() * 16)];
                    }
                    return color;
                  }
                channel.send(`🔅 Укажите 6-ти значный Hex-код после #. \`Пример: ${getRandomColor()}\``)
            }
         
            if (event.d.emoji.name === '🎯') {
                if (!checkForPrem(channel,user,guild)) return
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
                    channel.send('У вас нет своей комнаты!').then(message =>{
                        message.delete(10 * 1000)
                    })
                    return;
                }
                user.send('🎯 Чтобы установить ограничения на вход в премиум комнату `' + guild.channels.get(truFal).name + '` по ADR напишите `t`(для режима tpp) или `f`(для режима fpp) для быбора режима и после них количество ADR. Пример: `f350`.')
            }
            if (event.d.emoji.name === '✅') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('✅ Чтоб добавить друга в премиум комнаты (игрок будет всегда ее видеть, даже тогда когда там никого нет). Пример: `!friend @kr0cky#1337`').then(msg => msg.delete(1000 * 25))
            }
            if (event.d.emoji.name === '🚷') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('🚷 Чтоб удалить друга из премиум комнаты (игрок больше не будет ее видеть когда в ней никого нет). Пример: `!un friend @kr0cky#1337`').then(msg => msg.delete(1000 * 25))
            }
            if (event.d.emoji.name === '⚜') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send(':fleur_de_lis: Чтоб зайти в комнату к игроку напишите `!join @Игрок`. Пример: `!join @kr0cky#1337`').then(msg => msg.delete(1000 * 25))
            }
            if (event.d.emoji.name === '🔃') {
                if (!checkForPrem(channel,user,guild)) return
                channel.send('🔃 Чтоб переместить другого игрока себе в руму напишите `!move @Игрок`. Пример: `!move @kr0cky#1337`').then(msg => msg.delete(1000 * 25))
                
            }
            if (event.d.emoji.name === '♨') {
                if (!checkForPrem(channel,user,guild)) return
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
                    channel.send('У вас нет своей комнаты!').then(message =>{
                        message.delete(10 * 1000)
                    })
                    return;
                }
                let roles_fpp = [{adr:200,id:"412985225660989450"},{adr:250,id:"412985247827755008"},{adr:300,id:"412985257722118144"},{adr:350,id:"412985270594568202"},{adr:400,id:"412985280451313667"},
                {adr:450,id:"412985292191039498"},{adr:500,id:"412985304006262784"}]
                let roles_tpp = [{adr:200,id:"412984749909344256"},{adr:250,id:"412984935805091862"},{adr:300,id:"412985073307090945"},{adr:350,id:"412985087483707394"},{adr:400,id:"412985097998958592"},
                {adr:450,id:"412985109088698369"},{adr:500,id:"412985121180745728"}]
                guild.channels.get(truFal).permissionOverwrites.forEach(x => {
                    if (roles_tpp.find(y => y.id === x.id || roles_fpp.find(y => y.id === x.id))) {
                        x.delete()
                    }
                })
                channel.send(`:hotsprings: Все ограничения по ADR с \`${guild.channels.get(truFal).name}\` сняты.`).then(msg => msg.delete(1000 * 15))
       
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

