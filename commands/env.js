const { toChannelMention, toUserMention } = require("../modules/mention");
const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { ChannelOutput } = require("../modules/di-sh/interpreter/output");

module.exports = {
    name: 'env',
    description: 'env variables',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
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
            case "ouput_handler":
                switch(args[2].toLowerCase())
                {
                    case "add":
                        switch(args[3].toLocaleLowerCase())
                        {
                            case "channel":
                                env.outputManager.add(new ChannelOutput(env.server.channels.cache.get(args[4]), args[5] === "true"))
                                break;
                            case "console":
                                break;
                            case "file":
                                break;
                            default:
                                //error
                                break;
                        }
                        break;
                    case "remove":
                        break;
                }
                break;
        }
        return env;
    }
}