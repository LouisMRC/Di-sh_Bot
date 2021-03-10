const { parse, tokenize, Token, removeTokensByType, Types } = require("./parser");
const ExecEnv = require("./execEnv");
const { Message } = require("discord.js");
const { getServer } = require("../../system/db");
const { languages } = require("../../lang");
const { commandFilter } = require("./contentFilters");
const { sleep } = require("../../system/system");
const EventEmitter = require("events");

class Interpreter extends EventEmitter
{
    /**
     * 
     * @param {Array<string>} script 
     * @param {ExecEnv} env 
     * @param {Array<string>} argv 
     */
    constructor(script, env, argv)
    {
        super();
        this.m_Script = parse(tokenize(script));
        this.m_Env = env;
        this.m_InterpreterArgv;
        this.m_ScriptArgv;
        this.m_Cursor = 0;
        this.m_Running = false;
        this.m_Terminated = false;

        // this.m_LogOutput;
    }
    step(steps)
    {
        for(let i = 0; this.m_Cursor < this.m_Script.length && i < steps; i++)
        {
            this.execute(this.m_Script[this.m_Cursor]);
            this.m_Cursor++;
        }
        if(this.m_Cursor >= this.m_Script.length)this.emit("terminated", 0);
    }
    async run()
    {
        this.m_Running = true;
        for( ; this.m_Cursor < this.m_Script.length && this.m_Running; this.m_Cursor++)await this.execute(this.m_Script[this.m_Cursor]);
        if(this.m_Cursor >= this.m_Script.length)this.emit("terminated", 0);
    }
    exit(code = 0)
    {
        this.emit("terminated", code);
    }
    stop()
    {
        this.m_Running = false;
    }
    jump(instructionNumber)
    {
        let isRunning = this.m_Running;
        this.m_Running = false;
        this.m_Cursor = instructionNumber;
        if(isRunning)this.m_Running = true;

    }

    /**
     * 
     * @param {Array<Token>} instruction 
     */
    async execute(instruction)
    {
        // const ping = !(args[args.length -1] === "noping" || env.serverConfig.isAutoNOPING());
        const ping = true;
        // const comOutput = args[args.length -1] !== "noOutput";
        if(this.m_Env.client.commands.has(Token.toString(instruction[0]).toLowerCase()))
        {
            const command = this.m_Env.client.commands.get(Token.toString(instruction[0]).toLowerCase());
            if(command.allowedContexts.includes(this.m_Env.context))await command.execute(this.m_Env, prepareArgs(removeTokensByType(instruction, Types.EOL), this.m_Env));
            else this.m_Env.send("ENV Error!!!").then(() => console.log("ENV ERROR!!!"));//hardcoded
        }
        else
        {
            await this.m_Env.connection.query("SELECT Script FROM scripts WHERE Server_ID=? AND Script_name=?;", [this.m_Env.server.id, Token.toString(instruction[0]).toLowerCase()])
            .then(async row => {
                if(row.length)spawnProcess(createScriptEnv(this.m_Env.copy()), Token.toString(instruction[0]).toLowerCase(), row[0].Script);
                    // await (new Interpreter(row[0].Script, createScriptEnv(this.m_Env.copy()), [Token.toString(instruction[0]).toLowerCase()])).run();        
            })
            .catch(console.error);
        }
    }

    get env()
    {
        return this.m_Env;
    }
    get running()
    {
        return this.m_Running;
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
 * @param {ExecEnv} env
 */
function prepareArgs(tokens, env)
{
    let args = [];
    let arg = [];
    for(let token of tokens)
    {
        console.log(token);
        if(token.type === Types.SPACE)
        {
            if(!arg.length)continue;
            args.push(Token.toString(arg, false));
            arg = [];
        }
        else if(token.type === Types.PIPE)args.push(env.pipe);
        else arg.push(Token.toString(token));
    }
    if(arg.length)args.push(Token.toString(arg, false));
    return args;
}



class ProcessManager
{
    constructor()
    {
        this.m_Processes = new Map();
        this.m_InputQueue = [];
        this.requestHandler();
    }


    spawn(env, name, script)
    {
        this.m_InputQueue.push(new Process(env, name, script));
    }
    kill(processID)
    {
        this.m_Processes.get(processID).interpreter.stop();
        this.m_Processes.delete(processID);
    }
    /**
     * 
     * @param {Process} process 
     */
    launchProcess(process)
    {
        let id = 0;
        while(this.m_Processes.has(id))id++;
        process.interpreter.once("terminated", code => {
            this.m_Processes.delete(id);
        });
        process.interpreter.env.processID = id;
        this.m_Processes.set(id, process);
        process.interpreter.run();
    }
    async requestHandler()
    {
        while(1)
        {
            await sleep(100);
            while(this.m_InputQueue.length > 0)this.launchProcess(this.m_InputQueue.shift());
        }
    }

    get processes()
    {
        return this.m_Processes;
    }
}

class Process
{
    /**
     * 
     * @param {ExecEnv} env 
     * @param {Array<string>} script 
     * @param {string} name 
     */
    constructor(env, name, script)
    {
        this.m_Name = name;
        this.m_Interpreter = new Interpreter(script, env, []);
    }
    get name()
    {
        return this.m_Name;
    }
    get interpreter()
    {
        return this.m_Interpreter;
    }

    set name(newName)
    {
        this.m_Name = newName;
    }
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {Array<string>} script 
 * @param {string} name 
 */
function spawnProcess(env, name, script)
{
    if(!env.client.processes.has(env.server.id))env.client.processes.set(env.server.id, new ProcessManager());
    env.client.processes.get(env.server.id).spawn(env, name, script);
}

function killProcess(env, processID)
{
    env.client.processes.get(env.server.id).kill(processID);
}




module.exports = {
    Interpreter,

    createUserTermEnv,
    prepareScript,
    prepareArgs,

    ProcessManager,
    spawnProcess,
    killProcess
}