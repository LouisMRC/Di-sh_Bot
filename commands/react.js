const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'react',
    description: 'add a reaction as the robot',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        if(typeof args[1] === "object")
        {
            switch(args[1].constructor.name)
            {
                case "Message":
                    env.return(await args[1].react(args[2]));
                    break;
                case "MessageReaction":
                    env.return(await args[1].message.react(args[2]));
                    break;
            }
        }
        else env.return(await (await env.channel.messages.fetch(args[1])).react(args[2]));
        return env;
    }
}