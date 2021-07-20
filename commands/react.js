const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'react',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [],
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