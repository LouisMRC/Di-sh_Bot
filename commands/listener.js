const { Message, Client, Guild, TextChannel, User } = require("discord.js");
const {enableReact, singleEmojiRequest} = require("../modules/listener");
const { toEmojiMention } = require("../modules/mention");
const { typeScript } = require("../modules/scripting");
const ServerConfig = require("../modules/serverConfig");

module.exports = {
    name: 'listener',
    description: '',
    /**
     * 
     * @param {Client} client 
     * @param {import("mariadb").PoolConnection} connection 
     * @param {Array<string>} args 
     * @param {Guild} guild 
     * @param {ServerConfig} conf 
     * @param {TextChannel} channel
     * @param {User} member
     * 
     */
    async execute(client, connection, args, guild, conf, locale, channel, member)
    {
        let message;
        let ids;
        switch(args[1].toLowerCase())
        {
            case "bind":
                ids = args[2].split("/").slice(-3);
                if(!(await connection.query(`SELECT * FROM ReactionListeners WHERE ServerID=? AND ChannelID=? AND MessageID=?`, [ids[0], ids[1], ids[2]])).length)
                {
                    break;
                }
                /**
                 * @type {Message} message
                 */
                message = await (await (await client.guilds.fetch(ids[0])).channels.cache.get(ids[1])).messages.fetch(ids[2]);
                connection.query("SELECT * FROM ReactionListeners WHERE ServerID=? AND ChannelID=? AND MessageID=?", [ids[0], ids[1], ids[2]])
                .then(rows => {
                    let commands = JSON.parse(rows[0].Commands);
                    channel.send(locale.prompt_emoji_reaction_listener)
                    .then(() => {
                        singleEmojiRequest(client, message, member, 15000)
                        .then(react => {
                            const emoji = (react.emoji.id === null ? react.emoji.name : toEmojiMention(react.emoji.name, react.emoji.id));
                            for(let command of commands)if(command[0] === emoji)return;
                            typeScript(channel, member, conf, locale.type_script_start_reaction_listener.replace("$emoji", emoji).replace("$prefix", conf.getPrefix()).replace("$prefix", conf.getPrefix()), locale.type_script_finish_reaction_listener.replace("$emoji", emoji), locale.timeout_reaction_listener, 60_000)
                            .then(script => {
                                commands.push([emoji, script]);
                                connection.query("UPDATE ReactionListeners SET Commands=? WHERE ListenerID=?;", [JSON.stringify(commands), rows[0].ListenerID])
                                .then(() => {
                                    channel.send(locale.succes_reaction_listener.replace("$emoji", emoji))
                                    .then(() => message.react(emoji)
                                    .then(reaction => reaction.users.remove(member.id)));
                                });
                            })
                            .catch(err => {if(err === "abort")channel.send("Abort!!!")});
                        })
                        .catch(err => channel.send(locale.timeout_reaction_listener));
                    });
                })
                .catch(err => console.error(err));
                delete message;
                break;
            case "unbind":
                ids = args[2].split("/").slice(-3);
                message = await (await (await client.guilds.fetch(ids[0])).channels.cache.get(ids[1])).messages.fetch(ids[2]);
                singleEmojiRequest(client, message, member, 15000)
                .then(react => channel.send(react.emoji.name))
                .catch();
                break;
            case "create":
                switch(args[2].toLowerCase())
                {
                    case "react":
                        ids = args[3].split("/").slice(-3);
                        if((await connection.query(`SELECT * FROM ReactionListeners WHERE ServerID=? AND ChannelID=? AND MessageID=?`, [ids[0], ids[1], ids[2]])).length)
                        {
                            break;
                        }
                        await connection.query("INSERT INTO ReactionListeners (ServerID, ChannelID, MessageID) VALUES(?, ?, ?);", [ids[0], ids[1], ids[2]]);
                        channel.send(locale.reaction_listener_enabled);
                        break;
                }
                break;
            case "enable":
                ids = args[2].split("/").slice(-3);
                message = await (await (await client.guilds.fetch(ids[0])).channels.cache.get(ids[1])).messages.fetch(ids[2]);
                await connection.query("SELECT Commands FROM ReactionListeners WHERE ServerID=? AND ChannelID=? AND MessageID=?", [ids[0], ids[1], ids[2]])
                .then(rows => enableReact(client, connection, guild, conf, message, JSON.parse(rows[0].Commands)).then(() => channel.send("This Listener Is Now Enabled!")));
                break;
            case "show":
                break;
            case "delete":
                break;
        }
    }
}