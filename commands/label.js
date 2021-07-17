const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'label',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [],
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