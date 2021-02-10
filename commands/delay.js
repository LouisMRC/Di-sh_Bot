const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { sleep } = require("../modules/di-sh/interpreter/interpreter");
module.exports = {
    name: 'delay',
    description: 'a simple delay',
    allowedContexts: ["script"],
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