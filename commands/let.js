const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'let',
    description: 'create a variable',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        //todo: variable
        return env;
    }
}