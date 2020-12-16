const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'emoji',
    description: 'emoji commands',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(connection, env, args)
    {
        
        return env;
    }
}