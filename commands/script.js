const { Channel, Guild, TextChannel, User, Message, MessageEmbed } = require("discord.js");
const { typeScript } = require("../modules/scripting");
const ServerConfig = require("../modules/serverConfig");
const { bold } = require("../modules/textDecorations");

module.exports = {
    name: 'script',
    description: 'command scripts',
    /**
     * 
    * @param connection 
     * @param {Array} args 
     * @param {Guild} guild 
     * @param {ServerConfig} conf 
     * @param locale 
     * @param {TextChannel} channel 
     * @param {User} member
     */
    async execute(connection, args, guild, conf, locale, channel, member)
    {
        switch(args[1])
        {
            case "create":
                if(args.length === 3)
                {
                    if((await connection.query(`SELECT * FROM Scripts WHERE ServerID=? AND ScriptName=?`, [guild.id, args[2]])).length)
                    {
                        // channel.send(locale.)
                        break;
                    }
                    await typeScript(channel, member, conf, locale.script_input_start.replace("$scriptName", args[2]).replace("$prefix", conf.getPrefix()).replace("$prefix", conf.getPrefix()), locale.script_input_finish.replace("$scriptName", args[2]), locale.script_input_timeout, 120_000)
                    .then(async (commands) => await connection.query("INSERT INTO Scripts (ServerID, ScriptName, script) VALUES (?, ?, ?);", [guild.id, args[2].toLowerCase(), JSON.stringify(commands)]))
                    .catch(err => {if(err === "abort")channel.send("Abort!!")});
                }
                if(args.length >= 4)
                {
                    console.log((await connection.query(`SELECT * FROM Script WHERE ServerID=? AND ScriptName=?`, [guild.id, args[2]])).length);
                    if((await connection.query(`SELECT * FROM Scripts WHERE ServerID=? AND ScriptName=?`, [guild.id, args[2]])).length)
                    {

                        break;
                    }
                    await connection.query(`INSERT INTO Scripts (ServerID, ScriptName, Scripts) VALUES (?, ?, ?);`, [guild.id, args[2].toLowerCase(), args[3]]);
                }
                break;
            case "delete":
                break;
            case "edit":
                break;
            case "list":
                const scripts = await connection.query("SELECT ScriptName, Script FROM Scripts WHERE ServerID=?;", [guild.id]);
                var message = new MessageEmbed();
                let list = "";
                for(let i = 0; i < scripts.length; i++)list += `${i ? "\n" : ""} -${bold(scripts[i].ScriptName)} - ${scripts[i].Script.length} lines`;//hardcoded
                message.addField(bold("Scripts:"), list)//hardcoded
                .setColor("BLUE");
                channel.send(message);
                break;
            case "show":
                const script = await connection.query(`SELECT ScriptName, Script FROM Scripts WHERE ServerID=? AND ScriptName=?;`, [guild.id, args[2]]);
                var message = bold(`${script[0].ScriptName}:`);
                message += displayScript(script[0].Script)
                channel.send(message);
                break;
        }
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