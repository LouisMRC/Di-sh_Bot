const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'help',
    description: 'the documentation for the bot',
    allowedContexts: ["user"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        //todo: help
        return env;
    }
}