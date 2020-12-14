const { TextChannel, Collection, Client, Guild, User, Message } = require("discord.js");
const {languages, loadLanguages} = require("./lang");
const {removeQuote} = require("./textTransformations");
const ServerConfig = require("./serverConfig");
const { windowedText } = require("./textDecorations");
const { roleExist } = require("./mention");

/**
 * 
 * @param {TextChannel} channel 
 * @param {User} member
 * @param {ServerConfig} conf
 * @param {string} startMessage
 * @param {string} finishMessage
 * @param {string} timeoutMessage
 * @param {number} idleTimeout
 */

function typeScript(channel, member, conf, startMessage, finishMessage, timeoutMessage, idleTimeout)
{
    return new Promise((resolve, reject) => {
        const filter = msg => msg.author.id === member.id;
        channel.send(startMessage);
        const collector = channel.createMessageCollector(filter, {max: 100, idle: idleTimeout});

        collector.on("collect", message => {
            if(message.content.startsWith(`${conf.getPrefix()}save`))collector.stop("save");
            else if(message.content.startsWith(`${conf.getPrefix()}cancel`))collector.stop("abort");
        })

        collector.on("end", async (collected, reason) => {

            switch(reason)
            {
                case "abort":
                    reject(reason);
                    break;
                case "idle":
                    await channel.send(timeoutMessage);
                    reject(reason);
                    break;
                case "save":
                    await channel.send(finishMessage);
                    resolve(commandFilter(conf.getPrefix(), collected.array()));
                    break;
                default:
                    reject(reason);
                    break;
            }
        });
    })
}

/**
 * 
 * @param {Textchannel} channel 
 * @param {User} member 
 * @param {serverconfig} conf 
 * @param {string} text 
 * @param {number} timeout 
 * @param {string} defaultAnswer 
 */
async function promptYesNo(channel, member, conf, text, timeout, defaultAnswer="no")
{
    channel.send(text + (defaultAnswer === "yes" ? " [Y/n]" : " [y/N]"));
    const answer = new Promise((resolve, reject) => {
        const filter = msg => msg.author.id === member.id && ["y", "yes", "n", "no"].includes(msg.content.toLowerCase());
        const collector = channel.createMessageCollector(filter, {max: 1, time: timeout});

        collector.on("end", async (collected, reason) => {
            if(reason === "limit")resolve(collected.array()[0].content.toLowerCase());
            else if(reason === "time")resolve(defaultAnswer);
        });
    });

    switch(await answer)
    {
        case "y":
        case "yes":
            return true;
        case "n":
        case "no":
            return false;
    }
}
/**
 * 
 * @param {Client} client 
 * @param {import("mariadb").PoolConnection} connection 
 * @param {Guild} guild 
 * @param {ServerConfig} conf 
 * @param {TextChannel} channel 
 * @param {User} member 
 * @param {Array<string>} script 
 */
async function interpretScript(client, connection, guild, conf, channel, member, script)
{
    //todo: syntax check
    for(let instruction of script)
    {
        console.log(`Executing ${instruction} :`);
        commandExe(client, connection, guild, conf, instruction, channel, member);
    }
}

/**
 * 
 * @param {string} prefix 
 * @param {Collection} commands 
 */
function commandFilter(prefix, commands)
{
    let output = [];
    commands.forEach(command => {if(!command.content.startsWith(prefix))output.push(command.content)});
    return output;
}

function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 
 * @param connection 
 * @param {Guild} guild 
 * @param {string} command 
 * @param {Message} message 
 */
async function prepareCommand(client, connection, guild, conf, command, message, scriptArgs = null)
{
    const guildPrefix = conf.getPrefix();
    let channel;
    if(message === null)channel = guild.systemChannel;
    else
    {
        if(!command.startsWith(guildPrefix))return;
        channel = message.channel;
    }
    if(command.startsWith(guildPrefix))command = command.slice(guildPrefix.length);
    await commandExe(client, connection, guild, conf, command, channel, message.author , scriptArgs);

}

async function commandExe(client, connection, guild, conf, command, channel, member, scriptArgs = null)
{
    await matchCommand(client, connection, guild, (scriptArgs === null ? splitCommand(command) : splitCommand(command).concat(scriptArgs)), conf, languages.get(conf.getLanguage()), channel, member);
}

/**
 * 
 * @param {import("mariadb").PoolConnection} connection 
 * @param {Guild} guild 
 * @param {Array} args 
 * @param {ServerConfig} conf 
 * @param locale 
 * @param {TextChannel} channel 
 */
async function matchCommand(client, connection, guild, args, conf, locale, channel, member)
{
    const ping = (args[args.length -1] === "noping" || conf.isAutoNOPING()) ? false : true;
    const comOutput = args[args.length -1] !== "noOutput";
    switch(args[0].toLowerCase())
    {
        case "ping":
            await channel.send("Pong!")
                .then(async () => await channel.send(":wink:"));
            break;
        case "time":
            await channel.send(Date.now());
            break;


        case "script":
            await client.commands.get("script").execute(connection, args, guild, conf, locale, channel, member);
            break;
        case "command_split":
            channel.send(splitCommand(args[1]));
            break;
        case "delay":
            await sleep(parseInt(args[1]));
        case "help":
            break;
        case "listener":
            await client.commands.get("listener").execute(client, connection, args, guild, conf, locale, channel, member);
            break;
        case "react":
            console.log(args[2]);
            await (await channel.messages.fetch(args[1])).react(args[2]);
            break;
        case "role":
            await client.commands.get("role").execute(args, guild, locale, channel, ping);//args, guild, locale, channel
            break;
        case "role-group":
            await client.commands.get("role-group").execute(connection, args, guild, conf, locale, channel, member)
            break
        case "say":
            if(args.length > 2)guild.channels.cache.get(args[1]).send(args[2]);
            else channel.send(args[1]);
            break;
        case "settings":
            await client.commands.get("settings").execute(connection, args, guild, conf, locale, channel);//connection, args, guild, conf, locale, channel
            break;
        case "var":
        case "let":
            break;
        case "collector_test":
            typeScript(channel, member.id, conf, "Type Some Commands To Test The Collector:", "Finish!!", "TIMEOUT!!!! GRRRRRR!!!!!", 5000)
            .then(inputs => channel.send(`Inputs:\n ${JSON.stringify(inputs)}`));
            break;
        case "window_test":
            channel.send(windowedText("*", "_", "|", 2, 2, "left", args[1]));
            break;

        case "yes_no":
            channel.send(`Answer: ${await promptYesNo(channel, member, conf, "Yes or No ?", 10000, "yes")}`);
            break;
        case "role-exist":
            channel.send((await roleExist(args[1], guild)) ? "🟢" : "⚠️");
            break;
        default:
            await connection.query("SELECT Script FROM Scripts WHERE ServerID=? AND ScriptName=?;", [guild.id, args[0].toLowerCase()])
                .then(async row => {
                    if(row.length)
                        for(let instruction of row[0].Script)
                            await commandExe(client, connection, guild, conf, instruction, channel, member, args.slice(1));

                })
                .catch(console.error);
            break;
    }
}

/**
 * 
 * @param {string} command 
 */
function splitCommand(command)
{
    let args = [];
    let argBuffer = "";
    for(let i = 0; i < command.length; i++)
    {
        let c = command[i]
        switch(c)
        {
            case " ":
                if(argBuffer.length > 0)
                {
                    args.push(argBuffer);
                    argBuffer = "";
                }
                break;
            case '"':
            case "'":
                if(argBuffer.length > 0)
                {
                    args.push(argBuffer);
                    argBuffer = "";
                }
                do
                {
                    argBuffer += command[i];
                    i++;
                }
                while(i < command.length && command[i] !== c)
                if(i < command.length)argBuffer += command[i];
                args.push(removeQuote(argBuffer));
                argBuffer = "";
                break;
            case "[":
            case "{":
                let opened = 1;
                do
                {
                    if(command[i] === c)opened++;
                    else if(command[i] === openClose(c))opened--;
                    argBuffer += command[i];
                    i++;
                }
                while(i < command.length && !(command[i] === openClose(c) && opened === 0));
                if(i < command.length)argBuffer += command[i];
                break;
            default:
                argBuffer += c;
                break;
        }
    }
    if(argBuffer.length > 0)args.push(argBuffer);
    return args;
}
function openClose(char)
{
    switch(char)
    {
        case "[":
            return "]";
        case "]":
            return "[";
        case "{":
            return "}";
        case "}":
            return "{";
        default:
            return null;
    }
}

module.exports = {
    typeScript,
    promptYesNo,
    interpretScript,
    sleep,
    prepareCommand,
    commandExe,
    matchCommand,
    splitCommand
}