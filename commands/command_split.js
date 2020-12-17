const { splitCommand, execEnv } = require("../modules/scripting");

module.exports = {
    name: 'command_split',
    description: 'just to test the spliter',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        env.channel.send(splitCommand(args[1]));
        return env;
    }
}