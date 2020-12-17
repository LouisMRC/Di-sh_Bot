const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'let',
    description: 'create a variable',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        //todo: variable
        return env;
    }
}