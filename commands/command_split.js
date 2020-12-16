const { splitCommand, execEnv } = require("../modules/scripting");

module.exports = {
    name: 'command_split',
    description: 'just to test the spliter',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(connection, env, args)
    {
        env.channel.send(splitCommand(args[1]));
        return env;
    }
}