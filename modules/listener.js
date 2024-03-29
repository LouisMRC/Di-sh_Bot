const {Message, Channel, Client, Guild, User} = require("discord.js");
const ExecEnv = require("./di-sh/interpreter/execEnv");
const { toEmojiMention } = require("./mention");
const { spawnProcess } = require("./di-sh/interpreter/interpreter");

let reactionListeners = new Map();
/**
 * 
 * @param {ExecEnv} env
 * @param {Message} message 
 * @param {Array<string, Array<Array>} commands
 */
async function enableReact(env, message, commands)
{
    let emojis = [], scripts = [];
    for(command of commands)
    {
        emojis.push(command[0]);
        scripts.push(command[1]);
    }
    const filter = reaction => emojis.includes((reaction.emoji.id === null ? reaction.emoji.name : toEmojiMention(reaction.emoji.name, reaction.emoji.id)));
    const collector = message.createReactionCollector(filter);
    collector.on("collect", async (reaction, user) => {
        console.log(reaction.emoji.name);
        for(let i in emojis)
        {
            if(emojis[i] === (reaction.emoji.id === null ? reaction.emoji.name : toEmojiMention(reaction.emoji.name, reaction.emoji.id)))
                spawnProcess(env, "reactProc", scripts[i])//hardcoded
        }
        reaction.users.remove(user.id);
    });
    reactionListeners.set(message.channel.id + message.id, collector);
}
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @param {User} member 
 * @param {number} timeout 
 */
function singleEmojiRequest(client, message, member, timeout)
{
    return new Promise((resolve, reject) => {
        const filter = (reaction, user) => user.id === member.id;
        const collector = message.createReactionCollector(filter, {max: 1, time: timeout});
        // collector.on("collect", collected => console.log(collected));
        collector.on("end", (collected, reason) => {
            if(reason === "limit")resolve(collected.array()[0]);
            else reject(reason);
        })
    });
}
function enableMessage(type, collectorArgs)
{

}

module.exports = {
    enableReact,
    singleEmojiRequest
}