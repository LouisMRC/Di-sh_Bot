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
                break;
        }
        return env;
    }
}