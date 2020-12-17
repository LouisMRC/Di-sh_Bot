const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'help',
    description: 'the documentation for the robot',
    allowedContexts: ["user"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        //todo: help
        return env;
    }
}