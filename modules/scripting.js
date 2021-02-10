const { TextChannel, Collection, Client, Guild, User, Message, MessageEmbed } = require("discord.js");
const {languages, loadLanguages} = require("./lang");
const {removeQuote} = require("./textTransformations");
const ServerConfig = require("./serverConfig");
const { windowedText, multiline_codeblock } = require("./textDecorations");
const { OutputHandler } = require("./di-sh/interpreter/output");
const { roleExist } = require("./mention");
const { getServer, saveScript } = require("./db");
const ExecEnv = require("./di-sh/interpreter/execEnv");



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
        let env = new ExecEnv(message.guild, conf, languages.get(conf.getLanguage()), message.channel, message.author, "user");
        env.return(previousOuput);
        previousOuput = (await commandExe(client, connection, env, pipe(splitCommand(line.slice(conf.getPrefix().length)), env))).previousOuput;
    }
}

/**
 * 
 * @param {Client} client 
 * @param {import("mariadb").PoolConnection} connection 
 * @param {ExecEnv} env 
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
 * @param {ExecEnv} env 
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
 * @param {ExecEnv} env 
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
    interpretScript,
    interpretUserInput,
    commandExe,
    splitCommand
}