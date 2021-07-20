const { ReactionEmoji } = require("discord.js");
const { Pages } = require("../modules/dataStruct");
const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { killProcess } = require("../modules/di-sh/interpreter/interpreter");

module.exports = {
    name: 'process',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [
        {
            name: 'kill',
            illegalContextes: [],
            permissionLevel: 2,
            subCommands: [],
            async execute(env, args)
            {
                killProcess(env, parseInt(args[2]));
            }
        },
        {
            name: 'list',
            illegalContextes: [],
            permissionLevel: 3,
            subCommands: [],
            async execute(env, args)
            {
                let processesManager = env.client.processes.get(env.server.id);
                let listHeader = `${processesManager.processes.size} Processes`;//hardcoded
                let processList = "";
                let activeProcesses = 0;
                let processes = new Pages(10);
                processesManager.processes.forEach((process, key) => {
                    let processData = {pid: key, pname: process.name, user: process.interpreter.env.user, nchilds: process.childs().length, active: process.interpreter.active};
                    if(processData.active)activeProcesses++;
                    processes.push(processData);
                });
                listHeader += `\n${activeProcesses} Active Processes`;//hardcoded
                listHeader += `\n\nPage ${"0"} of ${processes.length}`;//hardcoded
                for(let process of processes.getPage(0))//hardcoded
                {
                    processList += `${processList.length ? "\n" : ""}pid: ${process.pid}; name: ${process.pname}; user: ${process.user}; childs: ${process.nchilds} ; active: ${process.active}`;//hardcoded
                }
                env.send(listHeader);
                env.send(processList);
            }
        },
        {
            name: 'await',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                env.pipeOutput(await awaitProcess(env, parseInt(args[2])));
            }
        },
        {
            name: 'stop',
            illegalContextes: [],
            permissionLevel: null,//todo: check permission level of the user who spawned the process to stop and compare
            subCommands: [],
            async execute(env, args)
            {
                var PID = parseInt(args[2]);
                var processManager = env.client.processes.get(env.server.id);
                if(processManager.has(PID))processManager.stop(PID);
            }
        },
        {
            name: 'resume',
            illegalContextes: [],
            permissionLevel: null,//todo: check permission level of the user who spawned the process to resume and compare
            subCommands: [],
            async execute(env, args)
            {
                env.client.processes.get(env.server.id).continue(parseInt(args[2]));
            }
        },
        {
            name: 'step',
            illegalContextes: [],
            permissionLevel: null,//todo: check permission level of the user who spawned the process to continue and compare
            subCommands: [],
            async execute(env, args)
            {
                let process = env.client.processes.get(env.server.id).processes.get(parseInt(args[2]));
                await process.interpreter.step(parseInt(args[3]));
            }
        }
    ],
    execute: null
}

/**
 * 
 * @param {number} processID 
 */
function awaitProcess(env, processID)//todo: move to interpreter class
{
    return new Promise((resolve, reject) => {
        let process = env.client.processes.get(env.server.id).processes.get(processID);
        process.interpreter.once("terminated", code => resolve(code));

    });
}