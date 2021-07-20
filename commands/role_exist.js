const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { roleExist } = require("../modules/mention");


module.exports = {
    name: 'role_exist',
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
        env.send((await roleExist(args[1], env.server)) ? "🟢" : "⚠️");
        return env;
    }
}