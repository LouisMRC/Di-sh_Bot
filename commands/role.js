const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { isUserMention, toUserMention, getUserID } = require("../modules/mention");
const { bold } = require("../modules/textDecorations");
module.exports = {
    name: 'role',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [
        {
            name: 'add',
            illegalContextes: [],
            permissionLevel: 1,
            subCommands: [],
            execute: 1
        },
        {
            name: 'remove',
            illegalContextes: [],
            permissionLevel: 1,
            subCommands: [],
            async execute: 1
        },
        {
            name: 'replace',
            illegalContextes: [],
            permissionLevel: 1,
            subCommands: [],
            execute: 1
        },
        {
            name: 'delete',
            illegalContextes: [],
            permissionLevel: 1,
            subCommands: [],
            execute: 1
        },
        {
            name: 'count',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
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
            }
        },
        {
            name: 'show',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute: 1
        }
    ],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    execute: null
}

function searchUnusedRoles()
{

}