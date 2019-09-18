const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    config: {
        name: '#',
        prefix: ['#']

    },
    run: async (client, msg, args) => {
        msg.delete()
        if (msg.channel.id === '622737189364695040') {
            let code = msg.content.trim().split(/ +/g)[0]
            let guild = client.guilds.get("303793341529718784");
            let user = guild.members.get(msg.author.id)
            var premRole = user.roles.find(x => x.name.toLowerCase().startsWith('prem')).id
            console.log(premRole)
            if (isNaN(premRole)){
                let message = await msg.channel.send('У вас нет Премиум роли!');
                message.delete(1000 * 10)
                return;
            }
            var isOk  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(code)
            if(!isOk){
                let message = await msg.channel.send('Вы ввели код не правельного формата, он должен быть hex. `Пример: #996515`' )
                message.delete(1000 * 10)
                return;
            }
            guild.roles.get(premRole).setColor(code)
            let message = await msg.channel.send(`Вы успешно поменяли цвет роли на \`${code}\`!`) 
            message.delete(1000 * 10)
            guild.channels.get('563839723395874827').send(`${user} поменял цвет роли ${guild.roles.get(premRole)} на \`${code}\``)
        }
    }
}