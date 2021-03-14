const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { sleep } = require("../modules/system/system");
module.exports = {
    name: 'delay',
    description: 'a simple delay',
    allowedContexts: ["script", "user"],
    permissionLevel: 5,
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(env, args)
    {
        await sleep(parseInt(args[1]));
        return env;
    }
}