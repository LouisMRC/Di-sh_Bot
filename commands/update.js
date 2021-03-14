const ExecEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'update',
    description: 'update a message',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        await (await env.channel.messages.fetch(args[1])).edit(args[2])
        env.pipeOutput(args[1]);
        return env;
    }
}