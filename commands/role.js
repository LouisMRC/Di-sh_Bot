const { Guild, Channel } = require("discord.js");
const Mention = require("../modules/mention");
const TextDecorations = require("../modules/textDecorations");
module.exports = {
    name: 'role',
    description: 'some usefull commands to manipulate roles',
    /**
     * 
     * @param {Array} args 
     * @param {Guild} guild 
     * @param locale 
     * @param {Channel} channel 
     * @param {boolean} ping 
     */
    async execute(args, guild, locale, channel, ping)
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
                    guild.roles.fetch()
                        .then(roles => channel.send(locale.guild_rolecount.replace("$roleCount", roles.cache.size)))
        
                }
                else if(Mention.isUserMention(args[2]))
                {
                    guild.members.fetch(Mention.getUserID(args[2]))
                        .then(member => channel.send(locale.member_rolecount.replace("$member", ping ? Mention.toUserMention(member.id) : TextDecorations.bold(member.nickname === null ? member.user.username : member.nickname)).replace("$roleCount", member.roles.cache.size)))
                        .catch(console.error);
                }
                else
                {
                    guild.members.fetch()
                        .then(members => {
                            console.log(guild);
                            const member = members.find(mem => mem.user.username === args[2] || mem.nickname === args[2]);
                            console.log(member.user.name);
                            if(member === undefined)channel.send(locale.undefined_member.replace("$member", args[2]));
                            else channel.send(locale.member_rolecount.replace("$member", ping ? Mention.toUserMention(member.id) : TextDecorations.bold(member.nickname === null ? member.user.username : member.nickname)).replace("$roleCount", member.roles.cache.size));
                        })
                        .catch(console.error);
                }
                break;
            case "show":
                break;
        }
    }
}
function searchUnusedRoles()
{

}