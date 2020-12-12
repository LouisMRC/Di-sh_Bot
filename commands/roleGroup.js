const { Guild, TextChannel } = require("discord.js");
const { isRoleMention, roleExist, getRoleID } = require("../modules/mention");
const ServerConfig = require("../modules/serverConfig");

module.exports = {
    name: 'role-group',
    description: 'role-group commands',
    /**
     * 
     * @param {import("mariadb").PoolConnection} connection 
     * @param {Array<string>} args 
     * @param {Guild} guild 
     * @param {ServerConfig} conf 
     * @param locale 
     * @param {TextChannel} channel 
     */
    async execute(connection, args, guild, conf, locale, channel)
    {
        switch(args[1].toLowerCase())
        {
            case "create"://$rolegroup create foobar .....
                const row = await connection.query("SELECT Roles FROM RoleGroups WHERE ServerID=? AND GroupName=?;", [guild.id, args[2]]);
                if(row.length)
                {
                    return;
                }
                let roles = [];
                for(let arg of args.slice(3))
                    if(isRoleMention(arg) && roleExist(arg))roles.push(getRoleID(arg));
                    else
                    {
                        channel.send("Bad Input!!!");//hardcoded
                        return;
                    }

                break;
            case "delete":
                break;
            case "add":
                break;
            case "update":
                break;
            case "remove":
                break;
            case "list":
                break;
            case "show":
                break;
        }
    }
}