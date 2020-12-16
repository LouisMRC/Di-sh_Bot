const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'let',
    description: 'create a variable',
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(connection, env, args)
    {
        //todo: variable
        return env;
    }
}