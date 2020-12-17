const { promptYesNo, execEnv } = require("../modules/scripting");

module.exports = {
    name: 'yes_no',
    description: 'yes or no, that is the question',
    allowedContexts: ["user"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        env.channel.send(`Answer: ${await promptYesNo(env, "Yes or No ?", 10000, "yes")}`);
        return env;
    }
}