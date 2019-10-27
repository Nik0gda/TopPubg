const Discord = require('discord.js');
const client = new Discord.Client();
const botConfig = require('./botConfig.json')
const auth = require('./auth.json');
const vk = require('./API/vk')
const always_True = true
const mongoose = require('mongoose');
const waiting_for_unban = require('./MongoDB/Schema/waiting_unban')
const mongoDB = `mongodb://localhost:27017/Top_PUBG`;
const pubgApi = require('./API/pubg')
const constants = require('./MongoDB/Schema/constants')
mongoose.connect(mongoDB, { useUnifiedTopology: true ,useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
const vk_post = async (public,channelId,roleId,client) =>{
    
    let guild = client.guilds.get('303793341529718784')
    let channel = guild.channels.get(channelId)
    let obj = await vk(public)
    if(!obj) return;
    let text = `${roleId}\`\`\`${obj.title}\`\`\`${obj.content}`
    if(!obj.content && !obj.title){
        text = ''
    }
    if(obj.dest == false){
        let msg = await channel.send(text)
        await msg.react('👍')
        await msg.react('👎')
    }else{
        let attachment = new Discord.Attachment(obj.dest);
        let msg = await channel.send(text,attachment)
        await msg.react('👍')
        await msg.react('👎')
    }
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await sleep(5000)
    let guild = client.guilds.get('303793341529718784')
    setInterval(async () => {
        let constanted = await constants.find({}).exec()
        if(constanted.length == 0){
            season = await pubgApi.seasons()
            let constant = new constants({
                "season": season
            })
            constant.save().then(res => console.log(res)).catch(err => console.log(err))
        }else{
            constanted[0].season = await pubgApi.seasons()
            constanted[0].save().then(res=> console.log(res)).catch(err => console.log(err))
        }
    }, 1000 * 60 * 60 );
    setInterval(() => {
        for(i in botConfig.publics){
            vk_post(botConfig.publics[i],botConfig.publics_channel[i],botConfig.to_mention[i],client)
        }
    }, 1000 * 60 * 10);
    setInterval(async () => {
        let waiting_users = await waiting_for_unban.find({})
        for(i in waiting_users){
            if(waiting_users[i].unbanned_at < new Date()){
                let member = guild.members.get(waiting_users[i].id)
                let type = `${waiting_users[i].type}_role`
                if(member.roles.has(botConfig[type])){
                    member.removeRole(guild.roles.get(botConfig[type]))
                }
                waiting_users[i].delete().then(res => console.log('removed ban and deleted form waiting')).catch(err => console.log(err))
            }
        }
    }, 1000 * 20 );
});

client.login(auth.token);

client.on('disconnect', () => {
    console.log("The BOT has been DISCONNECTED :(  Restarting...");
    client.login(auth.token);
    setTimeout(() => {
      if(bot.status != 0) client.login(auth.token);
    }, 30000);
  });

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
            var premRoleId = user.roles.find(x => x.name.toLowerCase().startsWith('prem ')).id
            console.log(premRoleId)
            let premCategory = guild.channels.get("371230249398173708");
            let channels = premCategory.children
            let truFal = 0
            channels.forEach(element => {
                if (element.permissionOverwrites.has(premRoleId)) {
                    truFal = element.id
                }
            });
            console.log(truFal)
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
                        channel.send('🔗 Роль `🔫Stats` была успешно присвоена!').then(mssg => mssg.delete(15 * 1000))
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
                    `).then(async (message) =>{
                        for(let i = 0; i < number; i++){
                            await message.react(emojis[i])
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
                `).then(async (message) =>{
                    for(let i = 0; i < number; i++){
                            await message.react(emojis[i])
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
                user.send(`🔅 Укажите 6-ти значный Hex-код после #. \`Пример: ${getRandomColor()}\``)
            }
         
            if (event.d.emoji.name === '🎯') {
                if (!checkForPrem(channel,user,guild)) return
                var premRoleId = user.roles.find(x => x.name.toLowerCase().startsWith('prem ')).id
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
                var premRoleId = user.roles.find(x => x.name.toLowerCase().startsWith('prem ')).id
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
                guild.channels.get(truFal).overwritePermissions(guild.roles.get('303793341529718784'),{'CONNECT':true})
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
['command', 'event'].forEach(x => require(`./handlers/${x}.js`).run(client));

class Search {
    constructor(msg, room, roomLimit, lang, query, type) {
        this.msg = msg
        this.room = room
        this.roomLimit = roomLimit
        this.query = query
        this.lang = lang
        this.type = type
        this.guild = client.guilds.get(botConfig.guild_id)
        this.category = this.guild.channels.find(x => x.id == '635172112117661706' && x.type == 'category')
        this.embedMessage
        this.embedTime
    }

    async createRoom() {
        let platform = ['635180979043958796', '635181054201692163', '635181093875613697']
        platform = this.msg.member.roles.some(x => platform.includes(x.id)) ? this.msg.member.roles.find(x => platform.includes(x.id)).name : ``
        this.room = await this.guild.createChannel(`${this.type} | ${this.lang} | ${platform ? platform : 'PC'}`, {
            type: 'voice'
        })
        let en = this.guild.roles.get('635172666629947402')
        let ru = this.guild.roles.get('635172644836212752')
        await this.room.setParent(this.category)
        await this.msg.member.setVoiceChannel(this.room)
        await this.room.setUserLimit(this.roomLimit)
        await this.room.overwritePermissions(this.lang.toLowerCase() == 'en' ? en : ru, {
            VIEW_CHANNEL: true,
            CONNECT: true,
            SPEAK: true,
        })
        await this.room.overwritePermissions(this.lang.toLowerCase() == 'en' ? ru : en, {
            VIEW_CHANNEL: false,
            CONNECT: false,
            SPEAK: false,
        })
        await this.room.overwritePermissions(this.msg.guild.roles.get('542244816340385802'), {
            VIEW_CHANNEL: false,
            CONNECT: false,
            SPEAK: false,
        })

    }

    async createEmbed() {
        let descriptionContent = ''
        let authorContent = this.lang == 'ru' ? `Играют в ${this.room.name}` : `Playing in ${this.room.name}`
        this.room.members.forEach((i, y) => {
            descriptionContent += y == 0 ? `${i}` : `\n${i}`
        })
        if (this.query.length > 0) {
            let query = ''
            for (let i in this.query) {
                query += i != 0 ? ` ${this.query[i]}` : `${this.query[i]}`
            }
            descriptionContent += `\n \n${this.msg.guild.emojis.get(botConfig.emojis.vnimanie)} ${query}\n `
        }
        console.log(this.room.userLimit, this.room.members.size, this.room.userLimit - this.room.members.size)
        if (!this.room.full) {
            let invite = await this.room.createInvite()
            authorContent = this.lang == 'ru' ? `В поисках +${this.room.userLimit - this.room.members.size} в ${this.room.name}` : `In search of +${this.room.userLimit - this.room.members.size} in ${this.room.name}`
            descriptionContent += this.lang == 'ru' ? `\nЗайти: ${invite.url} \n \n` : `\nJoin: ${invite.url} `

        }
        let hcArr = ['https://i.imgur.com/gdenjkD.png', 'https://i.imgur.com/uV9P92S.png', 'https://i.imgur.com/oLBfsPB.png', 'https://i.imgur.com/duUmmyg.png', 'https://i.imgur.com/B70iazN.png', 'https://i.imgur.com/XLvECLu.png', 'https://i.imgur.com/REVmU08.png', 'https://i.imgur.com/gwQmgcR.png', 'https://i.imgur.com/zfehSxc.png', 'https://i.imgur.com/zukYDtc.png', 'https://i.imgur.com/9I6ezvb.png', 'https://i.imgur.com/XGOlEke.png', 'https://i.imgur.com/FJ6udWw.png']
        let nmArr = ['https://i.imgur.com/pY3zgiu.png', 'https://i.imgur.com/79P9cqd.png', 'https://i.imgur.com/RRmFxr7.png', 'https://i.imgur.com/mYaDRXD.png', 'https://i.imgur.com/KVsgbg5.png', 'https://i.imgur.com/C1L4qbu.png', 'https://i.imgur.com/2MT800F.png', 'https://i.imgur.com/YIYVIOF.png', 'https://i.imgur.com/NJsl0p8.png', 'https://i.imgur.com/IqR8WbS.png', 'https://i.imgur.com/ZrOQtPQ.png', 'https://i.imgur.com/A1Xbc5Y.png', 'https://i.imgur.com/tcbmHWx.png']
        console.log(this.room.members.array()[0].user.avatarURL)
        return new Discord.RichEmbed()
            .setAuthor(authorContent, this.room.members.array()[0].user.avatarURL)
            .setDescription(descriptionContent)
            .setThumbnail(this.type.toLowerCase() == 'hc' ? hcArr[this.room.userLimit - this.room.members.size] : nmArr[this.room.userLimit - this.room.members.size])
    }

}
let search = []

client.on('message', async msg => {
    if (msg.author.id == '632625208586534922') return
    if (msg.content[0] === prefix) {
        var args = msg.content.slice(prefix.length).trim().split(/ +/g)
    } else {
        var args = msg.content.trim().split(/ +/g)
    }
    let cmd = args.shift().toLowerCase()
    if (['hc', 'hardcore', 'h', 'n', 'normal', 'nm'].includes(cmd.toLowerCase())) {
        if (msg.channel.id == '632638073364283392') {
            msg.delete()
            if (!msg.member.voiceChannel) {
                msg.author.send('Вы не надодитесь в голововой комнате чтоб искать напарников!')
                return
            }
            if(search.some(x => x.room.id == msg.member.voiceChannel.id)) return
            if (['607129343985975296', '635172112117661706'].includes(msg.member.voiceChannel.parentID)) {
                if (isNaN(args[0]) || args[0] <= 0) {
                    msg.author.send(`Вы не написали кол. мест которые будут в комнате, пример: \`!${['n','normal','nm'].includes(cmd.toLowerCase()) ? 'nm' : 'hc'} 4 От 3 кд\``)
                    return
                }
                if (args[0] >= 14) {
                    msg.author.send(`Вы превысили лимит кол. мест которые будут в комнате,макс. 13 мест, пример: \`!${['n','normal','nm'].includes(cmd.toLowerCase()) ? 'nm' : 'hc'} 4 От 3 кд\``)
                    return
                }
                if (args.slice(1).join(' ').length > 100) {
                    msg.author.send(`Вы превысили лимит символов в описании, макс. количество 100 символов, прнимер: \`!${['n','normal','nm'].includes(cmd.toLowerCase()) ? 'nm' : 'hc'} 4 От 3 кд\``)
                    return
                }

                var temp = ['n', 'normal', 'nm'].includes(cmd.toLowerCase()) ? new Search(msg, msg.member.voiceChannel, args[0], 'RU', args.slice(1), 'NM') :
                    new Search(msg, msg.member.voiceChannel, args[0], 'RU', args.slice(1), 'HC')
                await temp.createRoom()
            } else {
                if (args.join(' ').length > 100) {
                    msg.author.send(`Вы превысили лимит символов в описании, макс. количество 100 символов, прнимер: \`!${['n','normal','nm'].includes(cmd.toLowerCase()) ? 'nm' : 'hc'} 4 От 3 кд\``)
                    return
                }
                var temp = ['n', 'normal', 'nm'].includes(cmd.toLowerCase()) ? new Search(msg, msg.member.voiceChannel, args[0], 'RU', args, 'NM') :
                    new Search(msg, msg.member.voiceChannel, args[0], 'RU', args, 'HC')
            }

            msg = await msg.channel.send(await temp.createEmbed())
            this.embedTime = new Date()
            temp.embedMessage = msg
            search.push(temp)
            return
        }} else if (msg.channel.id == '632638073364283392' || msg.channel.id == '607135076483989524') {
        msg.delete()
        let ruText = `В канале ${msg.guild.channels.get('632638073364283392')} доступны только следующее команды:
            :black_small_square:!hc :black_small_square:!nm\nПервым параметром вы должны уточнить макс. количество пользователь которые смогут зайти в голосовую комнату: \`!hc 5kd 3+\`\n следуещее аргументы(в примере это **kd 3+**) будуть расчитыватся как примечание к поиску`
         msg.author.send(ruText)
    }

})

client.on('voiceStateUpdate', async (oldMember, newMember) => {
    let oldVoiceChannel = oldMember.voiceChannel
    let newVoiceChannel = newMember.voiceChannel
    if (oldVoiceChannel == newVoiceChannel) return;
    if (oldVoiceChannel) {
        if (oldVoiceChannel.members.size == 0) {
            if (oldVoiceChannel.parentID == '635172112117661706') oldVoiceChannel.delete()
            if (search.find(x => x.room.id == oldVoiceChannel.id)) {
                search.find(x => x.room.id == oldVoiceChannel.id).embedMessage.delete()
                search.splice(search.indexOf(x => x.room.id == oldVoiceChannel.id), 1)

            }
        }

    }
    if (oldVoiceChannel) {
        if (search.some(x => x.room.id == oldVoiceChannel.id)) {
            let find = search.find(x => x.room.id == oldVoiceChannel.id)
            let obj = find
            console.log(obj)
            console.log(new Date() - obj.embedTime)
            if (new Date() - obj.embedTime > 1000 * 60 * 15) {
                search.splice(search.indexOf(obj), 1)
            } else {
                await obj.embedMessage.edit(await obj.createEmbed())
            }
        }


    }
    if (newVoiceChannel) {
        if (search.some(x => x.room.id == newVoiceChannel.id)) {
            let find = search.find(x => x.room.id == newVoiceChannel.id)
            let obj = find
            console.log(obj)
            console.log(new Date() - obj.embedTime)
            if (new Date() - obj.embedTime > 1000 * 60 * 15) {
                search.splice(search.indexOf(obj), 1)
            } else {
                await obj.embedMessage.edit(await obj.createEmbed())
            }
        }
    }
})