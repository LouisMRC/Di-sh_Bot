const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'goto',
    description: 'env variables',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {
        await env.interpreter.jump(env.interpreter.labels.get(args[1]));
    }
}