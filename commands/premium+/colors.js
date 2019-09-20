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
            function getRandomColor() {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                  color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
              }
              
            let code = msg.content.trim().split(/ +/g)[0]
            let guild = client.guilds.get("303793341529718784");
            let user = guild.members.get(msg.author.id)
            var premRole = user.roles.find(x => x.name.toLowerCase().startsWith('prem')).id
            console.log(premRole)
            if (isNaN(premRole)){
                msg.author.send('У вас нет Премиум роли!');
                message.delete(1000 * 10)
                return;
            }
            if(!guild.members.get(user.id).roles.has('562728244785315890')){
                msg.author.send(`Чтоб использовать эту команду вам нужна роль \`Premium+\``)
                return
            }
            var isOk  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(code)
            if(!isOk){
                msg.author.send(`Вы ввели код не правельного формата, он должен быть hex. \`Пример: ${getRandomColor()}\`` )
                message.delete(1000 * 10)
                return;
            }
            guild.roles.get(premRole).setColor(code)
            msg.author.send(`Вы успешно поменяли цвет роли на \`${code}\`!`) 
            guild.channels.get('563839723395874827').send(`${user} поменял цвет роли ${guild.roles.get(premRole)} на \`${code}\``)
        }
    }
}