const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'ping',
    description: 'pong ;)',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        await env.channel.send("Pong!")
            .then(async () => await env.channel.send(":wink:"));
        return env;
    }
}