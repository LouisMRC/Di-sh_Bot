const { toChannelMention } = require("../modules/mention");
const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'env',
    description: 'env variables',
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     * @param {boolean} ping 
     */
    async execute(connection, env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "set":
                switch(args[2].toLowerCase())
                {
                    case "channel":
                        env.channel = env.server.channels.cache.get(args[3]);
                        break;
                }
                break;
            case "show":
                switch(args[2].toLowerCase())
                {
                    case "channel":
                        env.channel.send(`ENV/CHANNEL: ${toChannelMention(env.channel.id)}`);
                        break;
                }
                break;
        }
        return env;
    }
}