const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'react',
    description: 'add a reaction as the robot',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(connection, env, args)
    {
        await (await env.channel.messages.fetch(args[1])).react(args[2]);
    }
}