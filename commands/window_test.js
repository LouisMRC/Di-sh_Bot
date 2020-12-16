const { execEnv } = require("../modules/scripting");
const { windowedText } = require("../modules/textDecorations");

module.exports = {
    name: 'window_test',
    description: 'create a window with text',

    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        env.channel.send(windowedText("*", "_", "|", 2, 2, "left", args[1]));
        return env;
    }
}