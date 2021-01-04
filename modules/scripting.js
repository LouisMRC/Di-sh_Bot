const { TextChannel, Collection, Client, Guild, User, Message, MessageEmbed } = require("discord.js");
const {languages, loadLanguages} = require("./lang");
const {removeQuote} = require("./textTransformations");
const ServerConfig = require("./serverConfig");
const { windowedText, multiline_codeblock } = require("./textDecorations");
const { OutputHandler } = require("./commandOutput");
const { roleExist } = require("./mention");
const { getServer, saveScript } = require("./db");


class execEnv
{
    /**
     * 
     * @param {Guild} server 
     * @param {ServerConfig} serverConfig 
     * @param serverLocale 
     * @param {TextChannel} channel
     * @param {User} user 
     * @param {string} context 
     */
    constructor(server, serverConfig, serverLocale, channel, user, context, outputType, outputTarget)
    {
        this.m_Server = server;
        this.m_ServerConfig = serverConfig;
        this.m_ServerLocale = serverLocale;
        this.m_CurrentChannel = channel;
        this.m_User = user;
        this.m_Context = context;
        this.m_PreviousOutput = null;
        // this.m_Output = new OutputHandler
    }
    copy()
    {
        return new execEnv(this.m_Server, this.m_ServerConfig, this.m_ServerLocale, this.m_CurrentChannel, this.m_User, this.m_Context);
    }
    return(value)
    {
        this.m_PreviousOutput = value;
    }
    get previousOuput()
    {
        return this.m_PreviousOutput;
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
 * @param {execEnv} env 
 * @param {string} msg 
 */
function textInput(env, msg, idleTimeout, allowRetry = false)
{
    return new Promise((resolve, reject) => {
        const filter = message => message.author === env.user && !startWithPrefix(env.serverConfig.getPrefix(), message.content);
        env.channel.send(msg)
            .then(async instructMsg => {
                const collector = env.channel.createMessageCollector(filter, {max: 1, time: idleTimeout});
                collector.on("end", async(message, reason) => {
                    instructMsg.delete();
                    if(reason === "limit")
                    {
                        const answer = message.array()[0].content;
                        message.delete();
                        resolve(answer);
                    }
                    if(reason === "time")
                    {
                        if(allowRetry)
                        {
                            if(promptYesNo(env, "hardcoded", 30_000))
                            {
                                textInput(env, msg, idleTimeout, false)
                                .then(answer => resolve(answer))
                                .catch(() => reject("time"));
                            }
                            else reject("abort");
                        }
                        else reject(reason);
                    }
                    else reject(reason);
                });
            });
        
    })
}
/**
 * 
 * @param {execEnv} env
 * @param {string} text 
 * @param {number} timeout 
 * @param {string} defaultAnswer 
 */
async function promptYesNo(env, text, timeout, defaultAnswer="no")
{
    env.channel.send(text + (defaultAnswer === "yes" ? " [Y/n]" : " [y/N]"));
    const answer = new Promise((resolve, reject) => {
        const filter = msg => msg.author.id === env.user.id && ["y", "yes", "n", "no"].includes(msg.content.toLowerCase());
        const collector = env.channel.createMessageCollector(filter, {max: 1, time: timeout});

        collector.on("end", async (collected, reason) => {
            if(reason === "limit")resolve(collected.array()[0].content.toLowerCase());
            else resolve(defaultAnswer);
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
    let previousOuput = null;
    for(let line of commandFilter(conf.getPrefix(), message.content.split("\n"), true))
    {
        let env = new execEnv(message.guild, conf, languages.get(conf.getLanguage()), message.channel, message.author, "user");
        env.return(previousOuput);
        previousOuput = (await commandExe(client, connection, env, pipe(splitCommand(line.slice(conf.getPrefix().length)), env))).previousOuput;
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
        env = await commandExe(client, connection, env, pipe(splitCommand(instruction), env));
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

    if(client.commands.has(args[0].toLowerCase()))
    {
        const command = client.commands.get(args[0].toLowerCase());
        if(command.allowedContexts.includes(env.context))env = await command.execute(client, connection, env, args);
        else env.channel.send("ENV Error!!!");//hardcoded
    }
    else
    {
        await connection.query("SELECT Script FROM scripts WHERE Server_ID=? AND Script_name=?;", [env.server.id, args[0].toLowerCase()])
        .then(async row => {
            if(row.length)
                await interpretScript(client, connection, env.copy(), row[0].Script);             
        })
        .catch(console.error);
    }
    return env;
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

/**
 * 
 * @param {Array<string>} args 
 * @param {execEnv} env 
 */
function pipe(args, env)
{
    let instruction = [];
    for(let arg of args)
    {
        if(arg === "-")instruction.push(env.previousOuput);
        else instruction.push(arg);
    }
    return instruction;
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

    textInput,
    promptYesNo,
    messageFilter,
    commandFilter,
    startWithPrefix,
    interpretScript,
    interpretUserInput,
    sleep,
    commandExe,
    splitCommand
}