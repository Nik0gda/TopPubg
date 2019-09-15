const Discord = require('discord.js');
const client = new Discord.Client();
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
                    }
                }

            }
            let every = guild.roles.get('303793341529718784')

            if (type === 'MESSAGE_REACTION_ADD') {
                if (event.d.emoji.name === '🗣') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'USE_VAD': false
                    })
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
                }
                if (event.d.emoji.name === '🏠') {
                    guild.channels.get(truFal).overwritePermissions(every, {
                        'VIEW_CHANNEL': false
                    })
                }
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
})


client.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel
    let channel = client.channels.find(x => x.id === '565765408578207744')
    let guild = client.guilds.get("303793341529718784");
    let user = guild.members.find(user => user.id === newMember.id)
    if (oldUserChannel !== undefined && newUserChannel !== undefined) {
        if (oldUserChannel == newUserChannel) {} else {
            let typicalJump = {
                jump: ':left_right_arrow: Участник ' + newMember + ' переместился из канала ' + '`' + oldUserChannel.name + '` в канал `' + newUserChannel.name + '`'
            }
            let notTypical = {
                jump: {
                    embed: {
                        description: typicalJump.jump
                    }
                }
            }
            if (user.roles.find(r => r.id === "365485162466770956") || user.roles.find(r => r.id === "317322435751837697")) {
                channel.send(notTypical.jump)
            } else {
                channel.send(typicalJump.jump)
            }
        }
    } else if (oldUserChannel === undefined && newUserChannel !== undefined) {
        if (oldUserChannel == newUserChannel) {} else {
            let typicalEnter = {
                enter: ':mans_shoe: Участник' + newMember + ' вошёл в канал ' + '`' + newUserChannel.name + '`'
            }
            let notTypical = {
                jump: {
                    embed: {
                        description: typicalEnter.enter
                    }
                }
            }
            if (user.roles.find(r => r.id === "365485162466770956") || user.roles.find(r => r.id === "317322435751837697")) {
                channel.send(notTypical.jump)
            } else {
                channel.send(typicalEnter.enter)
            }
        }
    } else if (newUserChannel === undefined) {
        if (oldUserChannel == newUserChannel) {} else {
            let typicalLeave = {
                leave: ':runner: Участник' + newMember + ' вышел из канал ' + '`' + oldUserChannel.name + '`'
            }
            let notTypical = {
                jump: {
                    embed: {
                        description: typicalLeave.leave
                    }
                }
            }
            if (user.roles.find(r => r.id === "365485162466770956") || user.roles.find(r => r.id === "317322435751837697")) {
                channel.send(notTypical.jump)
            } else {
                channel.send(typicalLeave.leave)
            }
        }
    }
})