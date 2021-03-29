const ExecEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'say',
    description: 'say something as the robot',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        let message;
        if(args.length > 2)message = await env.server.channels.cache.get(args[1]).send(args[2]);
        else message = (await env.send(args[1])).get(0)[0];
        env.pipeOutput(message.id);
    }
}