
const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
        config: {
            name: 'move',
            aliases: ['ьщму']
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
                    msg.author.send(`Укажите ник игрока которого вы хотите переместить (должен находится в комнате), привер: \`!move @kr0cky#1337\``);
                    return;
                }
                let mentioned_user = msg.mentions.members.first()
                if(!mentioned_user.voiceChannel){
                    msg.author.send(`Игрок которого вы хотите переместить не находится в голосовой комнате!`);
                    return;
                }
                if(!guild.members.get(msg.author.id).voiceChannel){
                    msg.author.send(`Вам надо находится в голосовой комнате чтоб использовать это команду!`);
                    return;
                }
                mentioned_user.setVoiceChannel(guild.members.get(msg.author.id).voiceChannel)
                msg.author.send(`Вы успешно переместили игрока ${mentioned_user} в комнату \`${guild.members.get(msg.author.id).voiceChannel.name}\``)
                let embed = new Discord.RichEmbed()
                .setColor('#0099ff')
                .setTimestamp()
                .setDescription(`Игрок ${guild.members.get(msg.author.id)} успешно переместил пользователя ${mentioned_user} в комнату \`${guild.members.get(msg.author.id).voiceChannel.name}\` `)
                guild.channels.get('563839723395874827').send(embed)
            }
        }
    }
