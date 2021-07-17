const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { sleep } = require("../modules/system/system");
module.exports = {//todo: move to interpreter class
    name: 'delay',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        await sleep(parseInt(args[1]));
    }
}