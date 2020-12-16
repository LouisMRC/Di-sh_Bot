const { sleep, execEnv } = require("../modules/scripting");

module.exports = {
    name: 'delay',
    description: 'a simple delay',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        await sleep(parseInt(args[1]));
        return env;
    }
}