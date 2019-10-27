const Discord = require('discord.js')
const fetch = require('node-fetch')
const botConfig = require('../../botConfig')
const mongoose = require('mongoose')
const ban_mute = require('../../MongoDB/Schema/ban_mute')
const waiting = require('../../MongoDB/Schema/waiting_unban')

function hours(time) {
    const lastDigit = parseInt(time.toString().split('').pop())
    if (lastDigit == '1') {
        return 'час'
    }
    if (lastDigit > 1 && lastDigit < 5) {
        return 'часа'
    }
    if (lastDigit > 5 || lastDigit == 0) {
        return 'часов'
    }
}

module.exports = {
    config: {
        name: 'chatmute',
        aliases: ['cm', 'mute', 'мут', 'чатмут', 'сь', 'срфеьгеу', 'мгеу']
    },
    run: async (client, msg, args) => {
        msg.delete().catch(error => console.error)
        let guild = client.guilds.get("303793341529718784");
        let author = guild.members.get(msg.author.id)
        if (msg.channel.id != '623224862227300372') return;
        if (!author.roles.has('317322435751837697') && !author.roles.has('365485162466770956') && !author.roles.has('562581648428892160') && !author.roles.has('567060199731625997')) return;
        if (isNaN(args[0])) return;
        if (args[0] <= 0 || args[0] > 999) return;
        if (!msg.mentions.members.first()) return;
        let reason = args.slice(2).join(' ');
        if (reason.length < 4) return;
        console.log(reason, reason.length)
        let mentioned_user = msg.mentions.members.first();
        let unbannedAt = new Date();
        unbannedAt.setHours(unbannedAt.getHours() + parseInt(args[0]));
        let embed = new Discord.RichEmbed()
            .addField(':raised_hand: Chat Mute!', `${mentioned_user} отправлен в мут на ${args[0]} ${hours(args[0])}. \n \nby ${author} : ${reason}\n\n`)
            .setColor(0x8B0000)
            .setTimestamp(unbannedAt)
            .setFooter('Будет разбанен', msg.member.user.avatarURL)
            .attachFiles([`${botConfig.chat_mute}`])
            .setThumbnail(`attachment://${botConfig.chat_mute}`)
        msg.channel.send(embed)
        let mute_obj = {
            banned_at: new Date(),
            unbanned_at: unbannedAt,
            total_time_hours: parseInt(args[0]),
            reason: reason,
            by_id: author.id,
            by_username: author.user.username,
        }

        let response = await ban_mute.findOne({
            id: mentioned_user.id
        }).exec()
        if (response == null) {
            console.log(1)
            let user = new ban_mute({
                id: mentioned_user.id,
                mutes: [mute_obj],
                bans: [],
                bansGlobal: []
            })
            user.save().then(res => console.log(res)).catch(err => console.log(err))
        } else {
            response.updateOne({
                $push: {
                    mutes: mute_obj
                }
            }).then(res => console.log('pushed')).catch(err => console.log(err))
        }
        response = await waiting.findOne({
            id: mentioned_user.id
        }).exec()
        if (response != null) {
            if (response.type == 'chat_mute') {
                response.deleteOne().then(res => console.log('deleted')).catch(err => console.log(err))
            }
        }
        let waiting_user = new waiting({
            id: mentioned_user.id,
            unbanned_at: unbannedAt,
            banned_by: author.id,
            type: 'chat_mute'
        })
        waiting_user.save().then(res => console.log(res)).catch(err => console.log(err))
        mentioned_user.addRole(guild.roles.get(botConfig.chat_mute_role))
    }
}