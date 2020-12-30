const { Channel, Guild, TextChannel, User, Message, MessageEmbed } = require("discord.js");
const { scriptEditor, execEnv } = require("../modules/scripting");
const ServerConfig = require("../modules/serverConfig");
const { bold } = require("../modules/textDecorations");

module.exports = {
    name: 'script',
    description: 'command scripts',
    allowedContexts: ["user", "script"],
    /**
     * 
    * @param {import("mariadb").PoolConnection} connection 
    * @param {execEnv} env
    * @param {Array} args 
    */
    async execute(client, connection, env, args)
    {
        switch(args[1])
        {
            case "create":
                if(args.length === 3)
                {
                    if((await connection.query(`SELECT * FROM scripts WHERE Server_ID=? AND Script_name=?`, [env.server.id, args[2]])).length)
                    {
                        // env.channel.send(env.serverLocale.)
                        break;
                    }
                    await scriptCreator(env.channel, env.user, env.serverConfig, env.serverLocale.script_input_start.replace("$scriptName", args[2]).replace("$prefix", env.serverConfig.getPrefix()).replace("$prefix", env.serverConfig.getPrefix()), env.serverLocale.script_input_finish.replace("$scriptName", args[2]), env.serverLocale.script_input_timeout, 120_000)
                    .then(async (script) => await connection.query("INSERT INTO scripts (Server_ID, Script_name, Script) VALUES (?, ?, ?);", [env.server.id, scriptName, JSON.stringify(script)]))
                    .catch(err => {if(err === "abort")env.channel.send("Abort!!")});
                }
                if(args.length >= 4)
                {
                    if((await connection.query(`SELECT * FROM scripts WHERE Server_ID=? AND Script_name=?`, [env.server.id, args[2]])).length)
                    {
                        //hardcoded
                        break;
                    }
                    await connection.query(`INSERT INTO scripts (Server_ID, Script_name, Scripts) VALUES (?, ?, ?);`, [env.server.id, args[2].toLowerCase(), args[3]]);
                }
                break;
            case "delete":
                break;
            case "edit":
                break;
            case "editor":
                await env.channel.send("Script Editor:")
                    .then(async () => {
                        await scriptEditor(client, connection, env, 120_000)
                        .then(async () => await env.channel.send("finished"))
                        .catch(async () => await env.channel.send("timeout"));
                    })
                break;
            case "list":
                const scripts = await connection.query("SELECT Script_name, Script FROM scripts WHERE Server_ID=?;", [env.server.id]);
                var message = new MessageEmbed();
                let list = "";
                for(let i = 0; i < scripts.length; i++)list += (i ? "\n" : "") + env.serverLocale.script_list_item.replace("$scriptName", bold(scripts[i].Script_name)).replace("$scriptSize", scripts[i].Script.length);
                message.addField(bold(env.serverLocale.script_show_title), list)
                .setColor("BLUE");
                env.channel.send(message);
                break;
            case "show":
                const script = await connection.query(`SELECT Script_name, Script FROM scripts WHERE Server_ID=? AND Script_name=?;`, [env.server.id, args[2]]);
                var message = bold(`${script[0].Script_name}:`);
                message += displayScript(script[0].Script)
                env.channel.send(message);
                break;
        }
        return env;
    }
}
/**
 * 
 * @param {Array<string>} script
 */
function displayScript(script)
{
    let message = "\n```";
    for(let i = 0; i < script.length; i++)message += `\n${i+1}  ${script[i]}`;
    message += "\n```";
    return message
}