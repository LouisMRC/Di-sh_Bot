const execEnv = require("../modules/di-sh/interpreter/execEnv");


module.exports = {
    name: 'emoji',
    description: 'emoji commands',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        
        return env;
    }
}