
const Discord = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
        config: {
            name: 'move',
            aliases: ['ьщму']
        },
        run: async (client, msg, args) => {
            if (msg.channel.id === '622737189364695040') {
                msg.delete()
                let guild = client.guilds.get("303793341529718784");
                if(!msg.mentions.members.first()){
                    let message = await msg.channel.send(`Укажите ник игрока которого вы хотите переместить (должен находится в комнате), привер: \`!move @kr0cky#1337\``);
                    message.delete(15 * 1000);
                    return;
                }
                let mentioned_user = msg.mentions.members.first()
                if(!mentioned_user.voiceChannel){
                    let message = await msg.channel.send(`Игрок которого вы хотите переместить не находится в голосовой комнате!`);
                    message.delete(15 * 1000);
                    return;
                }
                if(!guild.members.get(msg.author.id).voiceChannel){
                    let message = await msg.channel.send(`Вам надо находится в голосовой комнате чтоб использовать это команду!`);
                    message.delete(15 * 1000);
                    return;
                }
                guild.members.get(msg.author.id).setVoiceChannel(mentioned_user.voiceChannel)
                let message = await msg.channel.send(`Вы успешно переместили игрока ${mentioned_user} в комнату \`${mentioned_user.voiceChannel}\``)
                message.delete(15 * 1000)
                let embed = new Discord.RichEmbed()
                .setColor('#0099ff')
                .setTimestamp()
                .setDescription(`Игрок ${guild.members.get(msg.author.id)} успешно переместил пользователя ${mentioned_user} в комнату \`${mentioned_user.voiceChannel}\` `)
                guild.channels.get('563839723395874827').send(embed)
            }
        }
    }
