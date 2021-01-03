const { toChannelMention, toUserMention } = require("../modules/mention");
const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'env',
    description: 'env variables',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
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
                    case "user":
                        env.channel.send(`ENV/USER: ${toUserMention(env.user.id)}`);
                        break;
                }
                break;
        }
        return env;
    }
}