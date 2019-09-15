const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
const download = require('image-downloader')
const {
    imgDiff
} = require('img-diff-js');
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    let guild = client.guilds.get("303793341529718784");
    console.log(guild.roles.find(x => x.id === '362694794117513219'))
    for (i in guild.roles.find(x => x.id === '362694794117513219').members.map(m => m.user.avatarURL)) {
        const options = {
            url: guild.roles.find(x => x.id === '362694794117513219').members.map(m => m.user.avatarURL)[i],
            dest: `/Users/Nik0gda/Desktop/top pubg/images/${i}.png`
        }
        if (options.url === null) continue
        download.image(options)
            .then(({
                filename,
                image
            }) => {
                console.log('Saved to', filename)
                imgDiff({
                    actualFilename: `${filename}`,
                    expectedFilename: './compare.png',
                }).then(result => {
                    if (result.imagesAreSame) {
                        guild.roles.find(x => x.id === '362694794117513219').members.map(m => m)[i].ban({
                            'days': 7
                        })
                    }
                })
            })
            .catch((err) => console.error(err))


    }

});

client.login(auth.token);