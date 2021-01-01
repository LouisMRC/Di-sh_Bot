const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'say',
    description: 'say something as the robot',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        let returnVal;
        if(args.length > 2)returnVal = await env.server.channels.cache.get(args[1]).send(args[2]);
        else returnVal = await env.channel.send(args[1]);
        env.return(returnVal);
        return env;
    }
}