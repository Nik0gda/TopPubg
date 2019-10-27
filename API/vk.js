const fetch = require('node-fetch')
const {
    VK
} = require('vk-io');
const download = require('image-downloader')
const moongoose = require('mongoose')
const VkPage = require('../MongoDB/Schema/vk_page_DB')
const vk = new VK({
    token: '708048d8708048d8708048d82070ed65f077080708048d82d132ab4d22a034fb08f9b42'
});

module.exports = async (domain) => {
    let body = await vk.api.wall.get({
        domain: domain,
        count: 5
    });
    let last_item = body.items[0]
    if (body.items[0].is_pinned == 1) {
        for (i in body.items) {
            if (!body.items[i].is_pinned) {
                last_item = body.items[i]
                break
            }
        }
    }
    let response = await VkPage.findOne({
        communityName: domain
    }).exec()
    if (response == null) {
        let page = new VkPage({
            communityName: domain,
            postID: last_item.id
        })
       
        page.save().then(res => console.log(res)).catch(err => console.log(err))
    } else if (response.postID == last_item.id) {
        return false
    }else{
        console.log(3)
        response.updateOne({postID: last_item.id}).then(res => console.log('updated')).catch(err => console.log(err))
    }
    var options = {
        url: false,
        dest: false
    }
    
    if (last_item.attachments.find(x => x.type == 'photo')) {
        var last = last_item.attachments.find(x => x.type == 'photo').photo.sizes.find(x => x.type == 'r').url
        var options = {
            url: last,
            dest: `./${domain}.png`
        }
        await download.image(options)
    }
    title = last_item.text.slice(0, last_item.text.indexOf('\n'))
    content = last_item.text.slice(last_item.text.indexOf('\n'), last_item.length)
    if (last_item.attachments.find(x => x.type == 'video')) {
        content = `${content}\n\`Для просмотра видео зайдите в паблик по ссылке: vk.com/${domain}\``
        console.log(content)
    }
    return {
        title: title,
        content: content,
        dest: options.dest
    }

}