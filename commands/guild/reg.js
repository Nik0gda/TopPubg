const Discord = require('discord.js')
const fetch = require('node-fetch')
const pubg = require('../../API/pubg')
const config = require('../../botConfig.json')
const profile = require('../../MongoDB/Schema/profile')
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzZTFiMDQ5MC1kMTRjLTAxMzctOWU4OS0wNWYzMGFiNDJlNDIiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTcxMTI0OTEwLCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImthYnJrYWJyLWdtYWlsIn0.gobgBXy7OKOPIHQMs-TxxNsMByYuKG2TLmHRFMmScMs'
module.exports = {
    config: {
        name: 'reg',
        aliases: ['рег','куп','htu']
    },
    run: async (client, msg, args) => {
        if (msg.channel.id == '631210592434126862') {
            if (!args[0]) {
                msg.delete()
                message = await msg.reply.send(`${msg.author}, некорректно указан никнейм :warning: После команды !reg указывайте никнейм как в игре.`)
                return;
            }

            let id = await pubg.getId(args[0],token) 
            console.log(id.statusText)
            if(!id.ok){
                if(id.statusText == 'Not Found' || id.status == 404){
                    message = await msg.reply(`игрок с ником ${args[0]} не найден :disappointed_relieved: Проверьте правильность написания`)
                    return;
                }
                msg.reply(`**Произошла ошибка на стороне сервера, просим обратиться к администрации сервера.** \`Код ошибки: ${id.status}, с коментарием: ${id.statusText}\``)
                return;
            }
            id = await id.json()
            let embed = new Discord.RichEmbed()
                .setDescription(`**УВ. **${msg.author}\n \nВы успешно прошли регистрацию на сервере как:\n[${args[0]}](https://pubg.op.gg/user/${args[0]})\n `)
                .setFooter('Регистрация')
                .setTimestamp()
                .attachFiles([`./${config.reg_path}`])
	            .setThumbnail(`attachment://${config.reg_name}`);
            
            let user = await profile.findOne({id: msg.author.id}).exec()
            if(user == null){
                player = new user({
                    serverId: msg.guild.id,
                    id: msg.author.id,
                    username: msg.user.username,
                    nickname: (msg.member.nickname) ? (msg.member.nickname) : (null),
                    stats:{
                        inGameUsername: args[0],
                        inGameId: id.data[0].id
                    }
                })
                player.save().then(res =>console.log(res)).catch(err => console.log(err))
            }else{
                if(user.stats){
                    user.stats.inGameUsername = args[0],
                    user.stats.inGameId = id.data[0].id
                }else{
                    user.stats = {}
                    user.stats.inGameUsername = args[0],
                    user.stats.inGameId = id.data[0].id
                }
                user.save().then(res =>console.log(res)).catch(err => console.log(err))
            }
            msg.channel.send(embed)
	            


        }
    }
}