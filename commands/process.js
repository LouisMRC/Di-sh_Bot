const { ReactionEmoji } = require("discord.js");
const { Pages } = require("../modules/dataStruct");
const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { killProcess } = require("../modules/di-sh/interpreter/interpreter");

module.exports = {
    name: 'process',
    description: 'manage processes on the server',
    allowedContexts: ["user", "script"],
    permissionLevel: 0,
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        switch(args[1])
        {
            case "list":
                let processesManager = env.client.processes.get(env.server.id);
                let listHeader = `${processesManager.processes.size} Processes`;//hardcoded
                let processList = "";
                let activeProcesses = 0;
                let processes = new Pages(10);
                processesManager.processes.forEach((process, key) => {
                    let processData = {pid: key, pname: process.name, active: process.interpreter.active, user: process.interpreter.env.user};
                    if(processData.active)activeProcesses++;
                    processes.push(processData);
                });
                listHeader += `\n${activeProcesses} Active Processes`;//hardcoded
                listHeader += `\n\nPage ${"0"} of ${processes.length}`;//hardcoded
                for(let process of processes.getPage(0))//hardcoded
                {
                    processList += `${processList.length ? "\n" : ""}pid: ${process.pid}; name: ${process.pname}; user: ${process.user}; active: ${process.active}`;//hardcoded
                }
                env.send(listHeader);
                env.send(processList);
                break;
            case "spawn":
                break;
            case "kill":
                killProcess(env, parseInt(args[2]));
                break;
            case "await":
                env.pipeOutput(await awaitProcess(env, parseInt(args[2])));
                break;
            case "stop":
                env.client.processes.get(env.server.id).stop(parseInt(args[2]));
                break;
            case "continue":
                env.client.processes.get(env.server.id).continue(parseInt(args[2]));
                break;
            case "step":
                let process = env.client.processes.get(env.server.id).processes.get(parseInt(args[2]));
                process.interpreter.step(parseInt(args[3]));
                break;
        }
    }
}

/**
 * 
 * @param {number} processID 
 */
function awaitProcess(env, processID)
{
    return new Promise((resolve, reject) => {
        let process = env.client.processes.get(env.server.id).processes.get(processID);
        process.interpreter.once("terminated", code => resolve(code));

    });
}