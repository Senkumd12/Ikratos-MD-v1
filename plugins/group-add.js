const {
	getBinaryNodeChild,
	getBinaryNodeChildren
} = (await import('@adiwajshing/baileys')).default

import fetch from 'node-fetch'

let handler = async (m, { conn, text, participants, usedPrefix, command }) => {
	if (!text) throw `_Enter the number!_\nExample:\n\n${usedPrefix + command} ${global.owner[0]}`
	m.reply('_Being processed..._')
    let _participants = participants.map(user => user.id)
    let users = (await Promise.all(
        text.split(',')
            .map(v => v.replace(/[^0-9]/g, ''))
            .filter(v => v.length > 4 && v.length < 20 && !_participants.includes(v + '@s.whatsapp.net'))
            .map(async v => [
                v,
                await conn.onWhatsApp(v + '@s.whatsapp.net')
            ])
    )).filter(v => v[1][0]?.exists).map(v => v[0] + '@c.us')
    
    const response = await conn.query({
        tag: 'iq',
        attrs: {
            type: 'set',
            xmlns: 'w:g2',
            to: m.chat,
        },
        content: users.map(jid => ({
            tag: 'add',
            attrs: {},
            content: [{ tag: 'participant', attrs: { jid } }]
        }))
    })
    const pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => null)
    const jpegThumbnail = pp ? await (await fetch(pp)).buffer() : Buffer.alloc(0)
    const add = getBinaryNodeChild(response, 'add')
    const participant = getBinaryNodeChildren(response, 'add')
    let anu = participant[0].content.filter(v => v)
    if (anu[0].attrs.error == 408) conn.sendButton(m.chat, `Unable to add @${anu[0].attrs.jid.split('@')[0]}!\nThe news is that @${anu[0].attrs.jid.split('@')[0]} just left this group :'v`, wm, 'link', usedPrefix + `link`, m)
    for (const user of participant[0].content.filter(item => item.attrs.error == 403)) {
    	const jid = user.attrs.jid
    	const content = getBinaryNodeChild(user, 'add_request')
    	const invite_code = content.attrs.code
    	const invite_code_exp = content.attrs.expiration
    	const txt = `Inviting @${jid.split('@')[0]} using invite...`
    	await m.reply(txt, null, {
    		mentions: await conn.parseMention(txt)
    	})
    	//await conn.delay(100)
    	//conn.sendButton(m.chat, txt, wm, 'ᴍᴇɴᴜ', '.menu', m)
    	await conn.sendGroupV4Invite(m.chat, jid, invite_code, invite_code_exp, await conn.getName(m.chat), 'Invitation to join my WhatsApp group', jpegThumbnail)
    }
}
handler.help = ['add', '+'].map(v => v + ' @user')
handler.tags = ['group']
handler.command = /^(اضافة|\+)$/i

handler.admin = true
handler.group = true
handler.botAdmin = true
handler.fail = null

export default handler
