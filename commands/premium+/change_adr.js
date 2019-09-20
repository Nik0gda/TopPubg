const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    config: {
        name: 't',
        prefix: ['t', 'f']

    },
    run: async (client, msg, args) => {
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
            if (truFal == 0) {
                let message = await msg.reply('У вас нет своей комнаты!')
                message.delete(10 * 1000)
                return;
            }
            if(!guild.members.get(user.id).roles.has('562728244785315890')){
                msg.channel.send(`Чтоб использовать эту команду вам нужна роль \`Premium+\``).then(mssg => mssg.delete(15 * 1000))
                return
            }
            let roles_fpp = [{adr:200,id:"412985225660989450"},{adr:250,id:"412985247827755008"},{adr:300,id:"412985257722118144"},{adr:350,id:"412985270594568202"},{adr:400,id:"412985280451313667"},
            {adr:450,id:"412985292191039498"},{adr:500,id:"412985304006262784"}]
            let roles_tpp = [{adr:200,id:"412984749909344256"},{adr:250,id:"412984935805091862"},{adr:300,id:"412985073307090945"},{adr:350,id:"412985087483707394"},{adr:400,id:"412985097998958592"},
            {adr:450,id:"412985109088698369"},{adr:500,id:"412985121180745728"}]
            guild.channels.get(truFal).permissionOverwrites.forEach(x => {if(roles_tpp.find(y => y.id === x.id || roles_fpp.find(y => y.id === x.id))){x.delete()}} )
            
            if (msg.content[0] == 't' || msg.content[1] == 't') {
                let index = msg.content.trim().split(/ +/g)[0].indexOf('t')+1
                    let adr = msg.content.slice(index).trim().split(/ +/g)
                    if(isNaN(adr)){
                        let message = await msg.reply('Вы ввели неправельное сообщение. Пример `f300`')
                        message.delete(10 * 1000)
                        return;
                    }
                guild.channels.get(truFal).overwritePermissions(guild.roles.get('303793341529718784'),{'CONNECT':false})
                roles_tpp.forEach(obj => {
                    if (obj.adr >= adr || obj.adr == 500) guild.channels.get(truFal).overwritePermissions(guild.roles.get(obj.id),{'VIEW_CHANNEL':true,'CONNECT':true})
                });
                let message = await msg.reply('Вы успешно поменяли ADR в своей комнате, теперь только люди с адром TPP ' + adr + '+')
                message.delete(10 * 1000)
                return;
            } else if (msg.content[0] == 'f' || msg.content[1] == 'f') {
                let index = msg.content.trim().split(/ +/g)[0].indexOf('f')+1
                    let adr = msg.content.slice(index).trim().split(/ +/g)
                    if(isNaN(adr)){
                        let message = await msg.reply('Вы ввели неправельное сообщение. Пример `f300`')
                        message.delete(10 * 1000)
                        return;
                    }
                    guild.channels.get(truFal).overwritePermissions(guild.roles.get('303793341529718784'),{'CONNECT':false})
                roles_fpp.forEach(obj => {
                    if (obj.adr >= adr || obj.adr == 500) guild.channels.get(truFal).overwritePermissions(guild.roles.get(obj.id),{'VIEW_CHANNEL':true,'CONNECT':true})
                });
                let message = await msg.author.reply('Вы успешно поменяли ADR в своей комнате, теперь только люди с адром FPP ' + adr + '+')
                return;
            }
        }
    }
}