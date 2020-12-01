const { Channel, Guild, TextChannel, User, Message } = require("discord.js");
const { typeScript } = require("../modules/scripting");
const ServerConfig = require("../modules/serverConfig");

module.exports = {
    name: 'alias',
    description: 'create and manipulate command aliases',
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
                    if((await connection.query(`SELECT * FROM Aliases WHERE ServerID=? AND AliasName=?`, [guild.id, args[2]])).length)
                    {
                        // channel.send(locale.)
                        break;
                    }
                    await typeScript(channel, member, conf, locale.type_script_start_alias.replace("$alias", args[2]).replace("$prefix", conf.getPrefix()).replace("$prefix", conf.getPrefix()), locale.type_script_finish_alias.replace("$alias", args[2]), locale.type_script_timeout_alias, 120_000)
                    .then(async (commands) => await connection.query("INSERT INTO Aliases (ServerID, AliasName, Commands) VALUES (?, ?, ?);", [guild.id, args[2].toLowerCase(), JSON.stringify(commands)]))
                    .catch(err => {if(err === "abort")channel.send("Abort!!")});
                }
                if(args.length >= 4)
                {
                    console.log((await connection.query(`SELECT * FROM Aliases WHERE ServerID=? AND AliasName=?`, [guild.id, args[2]])).length);
                    if((await connection.query(`SELECT * FROM Aliases WHERE ServerID=? AND AliasName=?`, [guild.id, args[2]])).length)
                    {

                        break;
                    }
                    await connection.query(`INSERT INTO Aliases (ServerID, AliasName, Commands) VALUES (?, ?, ?);`, [guild.id, args[2].toLowerCase(), args[3]]);
                }
                break;
            case "delete":
                break;
            case "edit":
                break;
            case "show":
                if(args.length < 3)channel.send(JSON.stringify(await connection.query(`SELECT AliasName, Commands, Comment FROM Aliases WHERE ServerID=?;`, [guild.id])));
                else channel.send(JSON.stringify(await connection.query(`SELECT AliasName, Commands, Comment FROM Aliases WHERE ServerID=? AND AliasName LIKE ?;`, [guild.id, args[2]])));
                break;
        }
    }
}