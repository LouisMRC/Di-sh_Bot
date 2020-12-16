const { TextChannel, Collection, Client, Guild, User, Message } = require("discord.js");
const {languages, loadLanguages} = require("./lang");
const {removeQuote} = require("./textTransformations");
const ServerConfig = require("./serverConfig");
const { windowedText } = require("./textDecorations");
const { roleExist } = require("./mention");
const { getServer } = require("./db");


class execEnv
{
    /**
     * 
     * @param {Guild} server 
     * @param {ServerConfig} serverConfig 
     * @param serverLocale 
     * @param {User} user 
     */
    constructor(server, serverConfig, serverLocale, channel, user, context)
    {
        this.m_Server = server;
        this.m_ServerConfig = serverConfig;
        this.m_ServerLocale = serverLocale;
        this.m_CurrentChannel = channel;
        this.m_User = user;
        this.m_Context = context;
    }
    get server()
    {
        return this.m_Server;
    }
    get serverConfig()
    {
        return this.m_ServerConfig;
    }
    get serverLocale()
    {
        return this.m_ServerLocale;
    }
    get channel()
    {
        return this.m_CurrentChannel;
    }
    get user()
    {
        return this.m_User;
    }
    get context()
    {
        return this.m_Context;
    }
    set server(server)
    {
        this.m_Server = server;
    }
    set serverConfig(serverConfig)
    {
        this.m_ServerConfig = serverConfig;
    }
    set serverLocale(serverLocale)
    {
        this.m_ServerLocale = serverLocale;
    }
    set channel(channel)
    {
        this.m_CurrentChannel = channel;
    }
    set user(user)
    {
        this.m_User = user;
    }
    set context(context)
    {
        this.m_Context = context;
    }
}

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

function scriptEditor(channel, member, conf, startMessage, finishMessage, timeoutMessage, idleTimeout)
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
                    resolve(messageFilter(conf.getPrefix(), collected.array(), false));
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
 * @param {string} prefix 
 * @param {array<Message>} commands 
 */
function messageFilter(prefix, commands, withPrefix)
{
    let output = [];
    commands.forEach(command => {if(!(startWithPrefix(prefix, command.content) ^ withPrefix))output.push(command.content)});
    return output;
}

/**
 * 
 * @param {string} prefix 
 * @param {array<string>} commands 
 */
function commandFilter(prefix, commands, withPrefix)
{
    let output = [];
    for(let command of commands)
        if(!(startWithPrefix(prefix, command) ^ withPrefix))output.push(command);
    return output;
}
/**
 * 
 * @param {string} prefix 
 * @param {string} command 
 */
function startWithPrefix(prefix, command)
{
    return command.startsWith(prefix);
}

/**
 * 
 * @param {number} ms 
 */
function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 
 * @param {Client} client
 * @param {import("mariadb").PoolConnection} connection 
 * @param {Message} message 
 */
async function interpretUserInput(client, connection, message)
{
    const conf = await getServer(connection, message.guild.id, true);
    for(let line of commandFilter(conf.getPrefix(), message.content.split("\n"), true))
    {
        await commandExe(client, connection, new execEnv(message.guild, conf, languages.get(conf.getLanguage()), message.channel, message.author, "user"), splitCommand(line.slice(conf.getPrefix().length)));
    }
}

/**
 * 
 * @param {Client} client 
 * @param {import("mariadb").PoolConnection} connection 
 * @param {execEnv} env 
 * @param {Array<string>} script 
 */
async function interpretScript(client, connection, env, script)
{
    //todo: syntax check
    env.context = "script"
    for(let instruction of script)
    {
        console.log(`Executing ${instruction} :`);
        await commandExe(client, connection, env, splitCommand(instruction));
    }
}

/**
 * 
 * @param {Client} client
 * @param {import("mariadb").PoolConnection} connection 
 * @param {execEnv} env 
 * @param {Array} args 
 */
async function commandExe(client, connection, env, args)
{
    const ping = !(args[args.length -1] === "noping" || env.serverConfig.isAutoNOPING());
    const comOutput = args[args.length -1] !== "noOutput";

    if(client.commands.has(args[0].toLowerCase()))await client.commands.get(args[0].toLowerCase()).execute(connection, env, args);
    else
    {
        await connection.query("SELECT Script FROM Scripts WHERE ServerID=? AND ScriptName=?;", [env.server.id, args[0].toLowerCase()])
        .then(async row => {
            if(row.length)
                await interpretScript(client, connection, env, row[0].Script);                    
        })
        .catch(console.error);
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
    execEnv,

    scriptEditor,
    promptYesNo,
    interpretScript,
    interpretUserInput,
    sleep,
    commandExe,
    splitCommand
}