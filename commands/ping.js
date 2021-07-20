const ExecEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'ping',
    description: 'pong ;)',
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
        await env.send("Pong!")
            .then(async () => await env.send(":wink:"));
        return env;
    }
}