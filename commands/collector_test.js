const execEnv = require("../modules/di-sh/interpreter/execEnv");


module.exports = {
    name: 'collector_test',
    description: 'test the script editor',
    allowedContexts: ["user"],
    /**
     * 
     * @param {execEnv} env 
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {
        scriptEditor(env.channel, env.user.id, env.serverConfig, "Type Some Commands To Test The Collector:", "Finish!!", "TIMEOUT!!!! GRRRRRR!!!!!", 5000)
            .then(inputs => env.send(`Inputs:\n ${JSON.stringify(inputs)}`));
        return env;
    }
}