const { Guild, TextChannel, MessageEmbed } = require("discord.js");
const { isRoleMention, roleExist, getRoleID } = require("../modules/mention");
const ServerConfig = require("../modules/serverConfig");
const {promptYesNo, execEnv} = require("../modules/scripting");
const { bold } = require("../modules/textDecorations");

module.exports = {
    name: 'role-group',
    description: 'role-group commands',
    /**
     * 
     * @param {import("mariadb").PoolConnection} connection 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(client, connection, env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "create":
                let roles = [];
                for(let arg of args.slice(3))
                    if(isRoleMention(arg) && roleExist(getRoleID(arg), guild))roles.push(getRoleID(arg));
                    else
                    {
                        env.channel.send(env.serverLocale.default_bad_input_message);
                        return;
                    }
                const row = await connection.query("SELECT Roles FROM RoleGroups WHERE ServerID=? AND GroupName=?;", [env.server.id, args[2]]);
                let overwrite = false;
                if(row.length)
                {
                    if(!(await promptYesNo(env.channel, env.user, env.serverConfig, env.serverLocale.default_overwrite_question, 10000)))return;
                    env.channel.send(env.serverLocale.default_overwrite_message);
                    overwrite = true;
                }
                if(overwrite)await connection.query("UPDATE RoleGroups SET Roles = ? WHERE ServerID=? AND GroupName=?;", [JSON.stringify(roles), env.server.id, args[2]]);
                else await connection.query("INSERT INTO RoleGroups (ServerID, GroupName, Roles) VALUES (?, ?, ?);", [env.server.id, args[2], JSON.stringify(roles)]);
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
                const groups = await connection.query("SELECT GroupName, Roles FROM RoleGroups WHERE ServerID=?;", [env.server.id]);
                let message = new MessageEmbed();
                let list = "";
                for(let i = 0; i < groups.length; i++)list += `${i ? "\n" : ""}${(await checkRoles(groups[i].Roles, env.server)) ? "🟢" : "⚠️"} -${bold(groups[i].GroupName)} - ${groups[i].Roles.length}`
                message.addField(bold(env.serverLocale.role_group_list_title), list+env.serverLocale.role_group_list_missing_role_warning)
                .setColor("BLUE");
                env.channel.send(message);
                break;
            case "show":
                break;
        }
        return env;
    }
}
async function checkRoles(roles, guild)
{
    for(let role of roles)
        if(!(await roleExist(role, guild)))return false;
    return true;
}