const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'member',
    description: '',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        
        return env;
    }
}