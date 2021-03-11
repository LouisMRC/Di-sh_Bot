const { ReactionEmoji } = require("discord.js");
const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { killProcess } = require("../modules/di-sh/interpreter/interpreter");

module.exports = {
    name: 'process',
    description: 'manage processes on the server',
    allowedContexts: ["user"],
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
                let processList = "Processes:";
                processesManager.processes.forEach((process, key) => {
                    processList += `\n${key}  ${process.name}  ${process.interpreter.env.user}${key === env.processID ? "  (current)" : ""}`;
                });
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
        }
        return env;
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