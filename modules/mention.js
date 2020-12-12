const { Guild } = require("discord.js");

function isUserMention(str)
{
    return (str.startsWith("<@!") || str.startsWith("<@")) && str.endsWith(">");
}
function isRoleMention(str)
{
    return str.startsWith("<@&") && str.endsWith(">");
}
function isChannelMention(str)
{
    return str.startsWith("<#") && str.endsWith(">");
}

// function userExist(str)
// {
//     return ;
// }
// function memberExist(str)
// {
//     return ;
// }
/**
 * 
 * @param {string} str 
 * @param {Guild} guild 
 */
async function roleExist(str, guild)
{
    return (await guild.roles.fetch()).cache.has(getRoleID(str));
}
// function channelExist(str)
// {
//     return str.startsWith("<#") && str.endsWith(">");
// }

function toUserMention(userID)
{
    return "<@" + userID + ">";
}
function toRoleMention(roleID)
{
    return "<@&" + roleID + ">";
}
function toChannelMention(channelID)
{
    return "<#" + channelID + ">";
}
function toEmojiMention(emojiName, emojiID)
{
    return `<:${emojiName}:${emojiID}>`;
}

function getUserID(mention)
{
    if(mention.startsWith("<@!"))return mention.slice(3, -1);
    else return mention.slice(2, -1);
}
function getRoleID(mention)
{
    return mention.slice(3, -1);
}
function getChannelID(mention)
{
    return mention.slice(2, -1);
}

module.exports = {
    isUserMention,
    isRoleMention,
    isChannelMention,

    roleExist,
    
    toUserMention,
    toRoleMention,
    toChannelMention,
    toEmojiMention,

    getUserID,
    getRoleID,
    getChannelID
};