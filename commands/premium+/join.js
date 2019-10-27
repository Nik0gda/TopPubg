
const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
        config: {
            name: 'join',
            aliases: ['ощшт']
        },
        run: async (client, msg, args) => {
            if (msg.channel.id === '622737189364695040') {
                msg.delete().catch(error => console.error)
                let guild = client.guilds.get("303793341529718784");
                if(!guild.members.get(msg.author.id).roles.has('562728244785315890')){
                    msg.author.send(`Чтоб использовать эту команду вам нужна роль \`Premium+\``)
                    return
                }
                if(!msg.mentions.members.first()){
                    msg.author.send(`Пожалуйста укажите игрока в комнату к которому вы хотите зайти , пример: \`!join @kr0cky#1337\`!`);
                    return;
                }
                
                let mentioned_user = msg.mentions.members.first()
                if(!mentioned_user.voiceChannel){
                    msg.author.send(`Игрок в комнату к которому вы хотите зайти не находится на сервере!`);
                    return;
                }
                if(!guild.members.get(msg.author.id).voiceChannel){
                    msg.author.send(`Вам надо находится в голосовой комнате чтоб использовать это команду!`);
                    return;
                }
                guild.members.get(msg.author.id).setVoiceChannel(mentioned_user.voiceChannel)
                msg.author.send(`:fleur_de_lis: Вы успешно переместились в комнату \`${mentioned_user.voiceChannel.name}\` к игроку ${mentioned_user}`)
                let embed = new Discord.RichEmbed()
                .setColor('#0099ff')
                .setTimestamp()
                .setDescription(`Игрок ${guild.members.get(msg.author.id)} успешно переместился в комнату \`${mentioned_user.voiceChannel.name}\` к игроку ${mentioned_user}`)
                guild.channels.get('563839723395874827').send(embed)
            }
        }
    }
