const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'help',
    description: 'the documentation for the robot',
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