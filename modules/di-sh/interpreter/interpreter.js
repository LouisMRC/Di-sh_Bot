const { parse, removeTokensByType } = require("./parser/parser");
const { tokenize, Token, Types } = require("./parser/lexer");
const ExecEnv = require("./execEnv");
const { Message } = require("discord.js");
const { getGeneralConfig } = require("../../system/db");
const { languages } = require("../../lang");
const { commandFilter } = require("./contentFilters");
const { sleep } = require("../../system/system");
const EventEmitter = require("events");
const { ChannelOutput } = require("./output")
const { checkPermissionLevel } = require("../../permission");
const { calculateExpression } = require("./variable/operations");
const { Variable } = require("./variable/variables");
const { SymbolTypes, InterpreterSymbol } = require("./parser/interperterSymboles");

class Interpreter extends EventEmitter
{
    /**
     * 
     * @param {Array<string>} script 
     * @param {ExecEnv} env 
     * @param {Array<string>} scriptArgv 
     */
    constructor(script, env, interpreterArgv, scriptArgv)
    {
        super();
        this.m_Script = [new Scope(parse(tokenize(script)))];
        this.m_Env = env;
        this.m_InterpreterArgv = {logChannel: null};
        // this.m_ScriptArgv = scriptArgv;
        this.m_ProgrammCounter = 0;
        this.m_Active = false;
        this.m_Running = false;
        this.m_Terminated = false;

        for(let i = 0; i < scriptArgv.length; i++)this.currentScope().declareVariable(new Variable(i.toString(), scriptArgv[i]));
        this.currentScope().declareVariable(new Variable("argv", scriptArgv));

        this.m_LogOutput = (this.m_InterpreterArgv.logChannel === null ? null : new ChannelOutput(this.m_InterpreterArgv.logChannel));

        this.m_Env.interpreter = this;
    }
    async step(steps)
    {
        for(let i = 0; i < steps; i++)
        {
            if((await this.execute(this.currentScope().currentInstruction)) !== 1)
            {
                while(this.currentScope().step() == null)
                {
                    this.m_Script.pop();
                    if(this.m_Script.length == 0)
                    {
                        this.exit();
                        return;
                    }
                }
            }
        }
    }
    async run()
    {
        this.m_Active = true;
        this.m_Running = true;
        while(this.m_Active)
        {
            if((await this.execute(this.currentScope().currentInstruction)) !== 1)
            {
                while(this.currentScope().step() == null)
                {
                    this.m_Script.pop();
                    if(this.m_Script.length == 0)
                    {
                        this.m_Running = false;
                        this.exit();
                        return;
                    }
                }  
            }
        }
        this.m_Running = false;
    }
    exit(code = 0)
    {
        this.emit("terminated", code);
    }
    stop()
    {
        this.m_Active = false;
    }

    async awaitFullStop()
    {
        while(this.m_Running)await sleep(10);
    }

    /**
     * 
     * @param {Array<InterpreterSymbol>} instruction 
     */
    async execute(instruction)
    {
        // const ping = !(args[args.length -1] === "noping" || env.serverConfig.isAutoNOPING());
        const ping = true;
        // const comOutput = args[args.length -1] !== "noOutput";

        for(let i = 0; i < instruction.length; i++)
        {
            if(instruction[i].type == SymbolTypes.EXPRESSION)instruction[i] = instruction[i].calculate(this.env);//todo: rewrite
            else if(instruction[i].type == SymbolTypes.IF_EPRESSION)
            {
                const ifElseBlock = instruction[i].calculate(this.env);
                if(ifElseBlock != null)
                {
                    this.pushScope(new Scope(ifElseBlock, this.currentScope().variables));
                    return 1;
                }
            }
        }

        if(this.m_Env.client.commands.has(instruction[0].value))//permission and context check
        {
            let command = this.m_Env.client.commands.get(instruction[0].value);
            for(let arg of instruction.slice(1))
            {
                let subCommand = null;
                for(let subComm of command.subCommands)if(subComm.name == arg.value)subCommand = subComm;
                if(subCommand != null)
                {
                    if(subCommand.illegalContextes.includes(this.m_Env.context) || !(subCommand.permissionLevel == null || await checkPermissionLevel(this.m_Env, this.m_Env.user.id, subCommand.permissionLevel)))
                    {
                        await this.m_Env.send("ENV Error!!!");//create a REAL error handling system
                        return;
                    }
                    command = subCommand;
                }
                else break;
            }
            if(command.execute == 0)this.m_Env.send(this.m_Env.serverLocale.not_implemented);
            else if(command.execute != null)await command.execute(this.m_Env, prepareArgs(instruction));//temporary permission system for built-in commands
            else this.m_Env.send("ENV Error!!!");//hardcoded
        }
        else
        {
            let scriptName = instruction[0].value;
            await this.m_Env.connection.query("SELECT Script, Permission_level FROM scripts WHERE Server_ID=? AND Script_name=?;", [this.m_Env.server.id, scriptName])
            .then(async row => {
                if(row.length && await checkPermissionLevel(this.m_Env, this.m_Env.user.id, row[0].Permission_level))
                {
                    let scriptEnv = this.m_Env.copy();
                    scriptEnv.context = "script";
                    scriptEnv.pushCommand(scriptName);
                    this.m_Env.pipeOutput(await spawnProcess(scriptEnv, this.m_Env.processID, scriptName, row[0].Script, [], prepareArgs(instruction).slice(1)));     
                }
            })
            .catch(console.error);
        }
    }
    async executeStr(instruction)
    {
        this.execute(parse(tokenize([instruction]))[0]);
    }
    pushScope(scope)
    {
        this.m_Script.push(scope);
    }
    popScope()
    {
        return this.m_Script.pop();
    }
    currentScope()
    {
        return this.m_Script[this.m_Script.length-1];
    }

    get env()
    {
        return this.m_Env;
    }
    get active()
    {
        return this.m_Active;
    }
    get running()
    {
        return this.m_Running;
    }
}

class Scope
{
    constructor(instructions, prevScopVars = new Map())
    {
        this.m_Instructions = instructions;
        this.m_Labels = new Map();
        this.m_Variables = prevScopVars;
        this.m_CurrentLine = 0;
    }
    jump(instructionNumber)
    {
        this.m_CurrentLine = instructionNumber;
    }
    step()
    {
        if(++this.m_CurrentLine < this.m_Instructions.length)return this.m_Instructions;
        return null;
    }

    createLabel(name)
    {
        this.m_Labels.set(name, this.m_ProgrammCounter);
    }

    /**
     * 
     * @param {Variable} newVariable 
     */
    declareVariable(newVariable)
    {
        this.m_Variables.set(newVariable.name, newVariable);
    }

    get currentInstruction()
    {
        return this.m_Instructions[this.m_CurrentLine];
    }
    get currentLine()
    {
        return this.m_CurrentLine;
    }
    get labels()
    {
        return this.m_Labels;
    }
    get variables()
    {
        return this.m_Variables;
    }
}

/**
 * 
 * @param {Message} message 
 */
async function createUserTermEnv(client, connection, message)
{
    let conf = await getGeneralConfig(connection, message.guild.id);
    return new ExecEnv(client, connection, message.guild, conf, languages.get(conf.getLanguage()), message.channel, message.author, "user", []);
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
 * @param {Array<InterpreterSymbol>} symboles 
 * @param {ExecEnv} env
 */
function prepareArgs(symboles)
{
    let args = [];
    for(let symbol of symboles)
    {
        console.log(symbol);
        args.push(symbol.value);
    }
    return args;
}



class ProcessManager
{
    constructor()
    {
        this.m_Processes = new Map();
        this.m_InputQueue = [];
        this.nextPID = 0;
        this.requestHandler();
    }

    /**
     * 
     * @param {ExecEnv} env 
     * @param {number} parent 
     * @param {string} name 
     * @param {Array<string>} script 
     */
    spawn(env, parent, name, script, interpreterArgs, scriptArgs)
    {
        let parentProcess = null;
        if(parent !== null)
        {
            parentProcess = this.m_Processes.get(parent);
            if(parentProcess.childs().length >= 10 || env.exeStack.length >= 10)
            {
                this.kill(this.getRootProcess(parent));
                return;
            }
        }
        let newProcess = new Process(env, parent, name, script, interpreterArgs, scriptArgs);
        let pidPromise = new Promise(resolve => {
            newProcess.once("activated", pid => {
                if(parent !== null)parentProcess.addChild(pid);
                resolve(pid);
            });
        });
        this.m_InputQueue.push(newProcess);
        return pidPromise;
    }


    kill(processID)
    {
        let process = this.m_Processes.get(processID);
        process.interpreter.stop();
        for(let child of process.childs())this.kill(child);
        this.m_Processes.delete(processID);
    }

    stop(pid)
    {
        this.m_Processes.get(pid).interpreter.stop();
    }
    continue(pid)
    {
        this.m_Processes.get(pid).interpreter.run();
    }
    /**
     * 
     * @param {Process} process 
     */
    launchProcess(process)
    {
        let id = this.nextPID++;
        process.interpreter.once("terminated", async code => {
            while(this.m_Processes.has(id) && this.m_Processes.get(id).childs().length)await sleep(100);
            
            if(this.m_Processes.has(id))
            {
                let parentPID = this.m_Processes.get(id).parent;
                if(parentPID !== null)this.m_Processes.get(parentPID).removeChild(id);
                this.m_Processes.delete(id);
            }
        });
        process.interpreter.env.processID = id;
        this.m_Processes.set(id, process);
        process.emit("activated", id);
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

    getRootProcess(pid)
    {
        if(pid === null || this.m_Processes.get(pid).parent === null)return pid;
        return this.getRootProcess(this.m_Processes.get(pid).parent);
    }

    get processes()
    {
        return this.m_Processes;
    }
}

class Process extends EventEmitter
{
    /**
     * 
     * @param {ExecEnv} env 
     * @param {Array<string>} script 
     * @param {string} name 
     */
    constructor(env, parent, name, script, interpreterArgs, scriptArgs)
    {
        super();
        this.m_Name = name;
        this.m_Interpreter = new Interpreter(script, env, interpreterArgs, scriptArgs);
        this.m_parent = parent;//parent pid
        this.m_childProcesses = [];//child pids
    }
    addChild(childPID)
    {
        this.m_childProcesses.push(childPID);
    }
    removeChild(childPID)
    {
        let index = this.m_childProcesses.indexOf(childPID);
        if(index < 0)return;
        this.m_childProcesses.splice(index, 1);
    }
    childs()
    {
        return this.m_childProcesses;
    }
    get name()
    {
        return this.m_Name;
    }
    get interpreter()
    {
        return this.m_Interpreter;
    }
    get parent()
    {
        return this.m_parent;
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
function spawnProcess(env, parent, name, script, interpreterArgs, scriptArgs)
{
    if(!env.client.processes.has(env.server.id))env.client.processes.set(env.server.id, new ProcessManager());//verify if the current server has a process manager and create one if not
    return env.client.processes.get(env.server.id).spawn(env, parent, name, script, interpreterArgs, scriptArgs);
}

function killProcess(env, processID)
{
    env.client.processes.get(env.server.id).kill(processID);
}




module.exports = {
    Interpreter,

    createUserTermEnv,
    createScriptEnv,
    prepareScript,
    prepareArgs,

    ProcessManager,
    spawnProcess,
    killProcess
}