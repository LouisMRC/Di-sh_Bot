const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'react',
    description: 'add a reaction as the robot',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        env.pipeOutput((await (await env.channel.messages.fetch(args[1])).react(args[2])).message.id);
        return env;
    }
}