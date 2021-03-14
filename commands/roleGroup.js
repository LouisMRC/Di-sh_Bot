const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { yesNo } = require("../modules/di-sh/interpreter/input");
const { MessageEmbed } = require("discord.js");
const { isRoleMention, roleExist, getRoleID } = require("../modules/mention");
const { bold } = require("../modules/textDecorations");

module.exports = {
    name: 'role-group',
    description: 'role-group commands',
    allowedContexts: ["user", "script"],
    permissionLevel: 0,
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "create":
                let roles = [];
                for(let arg of args.slice(3))
                    if(isRoleMention(arg) && roleExist(getRoleID(arg), guild))roles.push(getRoleID(arg));
                    else
                    {
                        env.send(env.serverLocale.default_bad_input_message);
                        return;
                    }
                const row = await env.connection.query("SELECT Roles FROM role_groups WHERE Server_ID=? AND GroupName=?;", [env.server.id, args[2]]);
                let overwrite = false;
                if(row.length)
                {
                    if(!(await yesNo(env, env.serverLocale.default_overwrite_question, 10000)))return;//hardcoded
                    env.send(env.serverLocale.default_overwrite_message);
                    overwrite = true;
                }
                if(overwrite)await env.connection.query("UPDATE role_groups SET Roles = ? WHERE Server_ID=? AND Group_name=?;", [JSON.stringify(roles), env.server.id, args[2]]);
                else await env.connection.query("INSERT INTO role_groups (Server_ID, Group_name, Roles) VALUES (?, ?, ?);", [env.server.id, args[2], JSON.stringify(roles)]);
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
                const groups = await env.connection.query("SELECT Group_name, Roles FROM role_groups WHERE Server_ID=?;", [env.server.id]);
                let message = new MessageEmbed();
                let list = "";
                for(let i = 0; i < groups.length; i++)list += `${i ? "\n" : ""}${(await checkRoles(groups[i].Roles, env.server)) ? "🟢" : "⚠️"} -${bold(groups[i].Group_name)} - ${groups[i].Roles.length}`
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