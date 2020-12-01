const Discord = require("discord.js");

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

// function verifyUserMention(str)
// {
//     return ;
// }
// function verifyRoleMention(str)
// {
//     return str.startsWith("<@&") && str.endsWith(">");
// }
// function verifyChannelMention(str)
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
    
    toUserMention,
    toRoleMention,
    toChannelMention,
    toEmojiMention,

    getUserID,
    getRoleID,
    getChannelID
};