const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { Variable } = require("../modules/di-sh/interpreter/variable/variables");

module.exports = {
    name: 'let',
    description: 'create a variable',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        env.interpreter.variables.set(args[1], new Variable(args[1], null))
        return env;
    }
}