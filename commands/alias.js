const { Channel, Guild } = require("discord.js");
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
     * @param {Channel} channel 
     */
    async execute(connection, args, guild, conf, locale, channel)
    {
        switch(args[1])
        {
            case "create":
                if(args.length >= 4)
                {
                    console.log((await connection.query(`SELECT * FROM Aliases WHERE ServerID=? AND AliasName=?`, [guild.id, args[2]])).length);
                    if((await connection.query(`SELECT * FROM Aliases WHERE ServerID=? AND AliasName=?`, [guild.id, args[2]])).length)
                    {

                        break;
                    }
                    connection.query(`INSERT INTO Aliases (ServerID, AliasName, Commands, Comment) VALUES (?, ?, ?, 'Un alias, parce que ça me fait plaisir :wink:');`, [guild.id, args[2].toLowerCase(), args[3]]);
                }
                break;
            case "delete":
                break;
            case "show":
                if(args.length < 3)channel.send(JSON.stringify(await connection.query(`SELECT AliasName, Commands, Comment FROM Aliases WHERE ServerID=?;`, [guild.id])));
                else channel.send(JSON.stringify(await connection.query(`SELECT AliasName, Commands, Comment FROM Aliases WHERE ServerID=? AND AliasName LIKE ?;`, [guild.id, args[2]])));
                break;
        }
    }
}