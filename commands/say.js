const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'say',
    description: 'say something as the robot',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        if(args.length > 2)env.server.channels.cache.get(args[1]).send(args[2]);
        else env.channel.send(args[1]);
        return env;
    }
}