const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { enableReact, singleEmojiRequest } = require("../modules/listener");//todo: move singleEmojiRequest in input the input module
const { toEmojiMention } = require("../modules/mention");

module.exports = {
    name: 'listener',
    description: '',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     * 
     */
    async execute(env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "bind":
                var ids = args[2].split("/").slice(-3);
                if(!(await env.connection.query(`SELECT * FROM reaction_listeners WHERE Server_ID=? AND Channel_ID=? AND Message_ID=?`, [ids[0], ids[1], ids[2]])).length)
                {
                    //hardcoded
                    break;
                }
                var message = await (await (await env.client.guilds.fetch(ids[0])).channels.cache.get(ids[1])).messages.fetch(ids[2]);
                env.connection.query("SELECT * FROM reaction_listeners WHERE Server_ID=? AND Channel_ID=? AND Message_ID=?", [ids[0], ids[1], ids[2]])
                .then(rows => {
                    let commands = JSON.parse(rows[0].Commands);
                    channel.send(env.serverLocale.prompt_emoji_reaction_listener)
                    .then(() => {
                        singleEmojiRequest(client, message, env.user, 15000)
                        .then(react => {
                            const emoji = (react.emoji.id === null ? react.emoji.name : toEmojiMention(react.emoji.name, react.emoji.id));
                            for(let command of commands)if(command[0] === emoji)return;
                            scriptCreator(env.channel, env.user, env.serverConfig, env.serverLocale.type_script_start_reaction_listener.replace("$emoji", emoji).replace("$prefix", env.serverConfig.getPrefix()).replace("$prefix", env.serverConfig.getPrefix()), env.serverLocale.type_script_finish_reaction_listener.replace("$emoji", emoji), env.serverLocale.timeout_reaction_listener, 60_000)
                            .then(script => {
                                commands.push([emoji, script]);
                                connection.query("UPDATE reaction_risteners SET Commands=? WHERE Listener_ID=?;", [JSON.stringify(commands), rows[0].Listener_ID])
                                .then(() => {
                                    env.send(env.serverLocale.succes_reaction_listener.replace("$emoji", emoji))
                                    .then(() => message.react(emoji)
                                    .then(reaction => reaction.users.remove(member.id)));
                                });
                            })
                            .catch(err => {if(err === "abort")env.send("Abort!!!")});
                        })
                        .catch(() => env.send(env.serverLocale.timeout_reaction_listener));
                    });
                })
                .catch(err => console.error(err));
                break;
            case "unbind":
                var ids = args[2].split("/").slice(-3);
                var message = await (await (await env.client.guilds.fetch(ids[0])).channels.cache.get(ids[1])).messages.fetch(ids[2]);
                singleEmojiRequest(client, message, env.user, 15000)
                .then(react => env.send(react.emoji.name))
                .catch();
                break;
            case "create":
                switch(args[2].toLowerCase())
                {
                    case "react":
                        ids = args[3].split("/").slice(-3);
                        if((await env.connection.query(`SELECT * FROM reaction_listeners WHERE Server_ID=? AND Channel_ID=? AND Message_ID=?`, [ids[0], ids[1], ids[2]])).length)
                        {
                            break;
                        }
                        await env.connection.query("INSERT INTO reaction_risteners (Server_ID, Channel_ID, Message_ID) VALUES(?, ?, ?);", [ids[0], ids[1], ids[2]]);
                        env.send(env.serverLocale.reaction_listener_enabled);
                        break;
                }
                break;
            case "enable":
                var ids = args[2].split("/").slice(-3);
                var message = await (await (await env.client.guilds.fetch(ids[0])).channels.cache.get(ids[1])).messages.fetch(ids[2]);
                await env.connection.query("SELECT Commands FROM reaction_listeners WHERE Server_ID=? AND Channel_ID=? AND Message_ID=?", [ids[0], ids[1], ids[2]])
                .then(rows => enableReact(env.client, env.connection, env.server, env.serverConfig, message, JSON.parse(rows[0].Commands)).then(() => env.send("This Listener Is Now Enabled!")));//hardcoded
                break;
            case "show":
                break;
            case "delete":
                break;
        }
        return env;
    }
}