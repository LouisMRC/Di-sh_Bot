const ExecEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'ping',
    description: 'pong ;)',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        await env.send("Pong!")
            .then(async () => await env.send(":wink:"));
        return env;
    }
}