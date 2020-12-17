const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'react',
    description: 'add a reaction as the robot',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        await (await env.channel.messages.fetch(args[1])).react(args[2]);
        return env;
    }
}