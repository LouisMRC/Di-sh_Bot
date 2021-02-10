const ExecEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'say',
    description: 'say something as the robot',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        let returnVal;
        if(args.length > 2)returnVal = await env.server.channels.cache.get(args[1]).send(args[2]);
        else returnVal = await env.send(args[1]);
        env.return(returnVal);
        return env;
    }
}