const ExecEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'update',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [],
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