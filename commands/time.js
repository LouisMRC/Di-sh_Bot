const execEnv = require("../modules/di-sh/interpreter/execEnv");


module.exports = {
    name: 'time',
    description: 'juste in time',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        await env.channel.send(Date.now());
        return env;
    }
}