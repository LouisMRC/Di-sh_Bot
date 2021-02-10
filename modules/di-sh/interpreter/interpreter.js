const { parse, tokenize, Token, removeTokensByType, Types } = require("./parser");
const ExecEnv = require("./execEnv");
const { Message } = require("discord.js");
const { getServer } = require("../../db");
const { languages } = require("../../lang");
const script = require("../../../commands/script");
const { commandFilter } = require("./contentFilters");

class Interpreter
{
    /**
     * 
     * @param {Array<string>} script 
     * @param {ExecEnv} env 
     * @param {Array<string>} argv 
     */
    constructor(script, env, argv)
    {
        this.m_Script = parse(tokenize(script));
        this.m_Env = env;
        this.m_InterpreterArgv;
        this.m_ScriptArgv;
        this.m_cursor = 0;
        this.m_running = false;
    }
    step(steps)
    {
        for(let i = 0; i < steps; i++)
        {
            this.execute(this.m_Script[this.m_cursor]);
            this.m_cursor++;
        }
    }
    async run()
    {
        for( ; this.m_cursor < this.m_Script.length; this.m_cursor++)await this.execute(this.m_Script[this.m_cursor]);
    }

    /**
     * 
     * @param {Array<Token>} instruction 
     */
    async execute(instruction)
    {
        console.log(Token.toString(instruction));
        // const ping = !(args[args.length -1] === "noping" || env.serverConfig.isAutoNOPING());
        const ping = true;
        // const comOutput = args[args.length -1] !== "noOutput";
        if(this.m_Env.client.commands.has(Token.toString(instruction[0]).toLowerCase()))
        {
            const command = this.m_Env.client.commands.get(Token.toString(instruction[0]).toLowerCase());
            if(command.allowedContexts.includes(this.m_Env.context))await command.execute(this.m_Env, prepareArgs(removeTokensByType(instruction, Types.EOL)));
            else this.m_Env.send("ENV Error!!!").then(() => console.log("ENV ERROR!!!"));//hardcoded
        }
        else
        {
            await this.m_Env.connection.query("SELECT Script FROM scripts WHERE Server_ID=? AND Script_name=?;", [this.m_Env.server.id, Token.toString(instruction[0]).toLowerCase()])
            .then(async row => {
                if(row.length)
                    await (new Interpreter(row[0].Script, createScriptEnv(this.m_Env.copy()), [Token.toString(instruction[0]).toLowerCase()])).run();        
            })
            .catch(console.error);
        }
    }
}

/**
 * 
 * @param {Message} message 
 */
async function createUserTermEnv(client, connection, message)
{
    let conf = await getServer(connection, message.guild.id, true)
    return new ExecEnv(client, connection, message.guild, conf, languages.get(conf.getLanguage()), message.channel, message.author, "user");
}

/**
 * 
 * @param {ExecEnv} env 
 */
function createScriptEnv(env)
{
    env.context = "script";
    return env;
}

/**
 * 
 * @param {ExecEnv} env
 * @param {string} script
 */
function prepareScript(env, script)
{
    let output = commandFilter(env.serverConfig.getPrefix(), script.split("\n"), true);
    for(let i = 0; i < output.length; i++)output[i] = output[i].slice(env.serverConfig.getPrefix().length);
    return output;
}

/**
 * 
 * @param {Array<Token>} tokens 
 */
function prepareArgs(tokens)
{
    let args = [];
    for(let token of tokens)args.push(Token.toString(token));
    return args;
}

/**
 * 
 * @param {number} ms 
 */
function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    Interpreter,

    createUserTermEnv,
    prepareScript,
    prepareArgs,

    sleep
}