const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'time',
    description: 'juste in time',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(connection, env, args)
    {
        await env.channel.send(Date.now());
        return env;
    }
}