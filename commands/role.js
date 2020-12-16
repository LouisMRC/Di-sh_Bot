const { Guild, Channel } = require("discord.js");
const { isUserMention, toUserMention, getUserID } = require("../modules/mention");
const { execEnv } = require("../modules/scripting");
const { bold } = require("../modules/textDecorations");
module.exports = {
    name: 'role',
    description: 'some usefull commands to manipulate roles',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(env, args, ping)//todo: add ping to env vars (scripting.js)
    {
        switch(args[1].toLowerCase())
        {
            case "add":
                break;
            case "role":
                break;
            case "replace":
                break;
            case "count":
                if(args.length < 3 || args[2].toLowerCase() === "all")
                {
                    env.server.roles.fetch()
                        .then(roles => env.channel.send(env.serverLocale.guild_rolecount.replace("$roleCount", roles.cache.size)))
        
                }
                else if(isUserMention(args[2]))
                {
                    env.server.members.fetch(getUserID(args[2]))
                        .then(member => env.channel.send(env.serverLocale.member_rolecount.replace("$member", ping ? toUserMention(member.id) : bold(member.nickname === null ? member.user.username : member.nickname)).replace("$roleCount", member.roles.cache.size)))
                        .catch(console.error);
                }
                else
                {
                    env.server.members.fetch()
                        .then(members => {
                            const member = members.find(mem => mem.user.username === args[2] || mem.nickname === args[2]);
                            console.log(member.user.name);
                            if(member === undefined)env.channel.send(env.serverLocale.undefined_member.replace("$member", args[2]));
                            else env.channel.send(env.serverLocale.member_rolecount.replace("$member", ping ? toUserMention(member.id) : bold(member.nickname === null ? member.user.username : member.nickname)).replace("$roleCount", member.roles.cache.size));
                        })
                        .catch(console.error);
                }
                break;
            case "show":
                break;
        }
        return env;
    }
}
function searchUnusedRoles()
{

}