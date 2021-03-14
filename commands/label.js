const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'label',
    description: 'env variables',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {
        if(env.interpreter.labels.has(args[1]))return;
        env.interpreter.createLabel(args[1]);
    }
}