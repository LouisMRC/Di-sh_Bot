const { execEnv, scriptEditor } = require("../modules/scripting");

module.exports = {
    name: 'collector_test',
    description: 'test the script editor',
    /**
     * 
     * @param {import("mariadb").PoolConnection} connection 
     * @param {execEnv} env 
     * @param {Array<string>} args 
     */
    async execute(client, connection, env, args)
    {
        scriptEditor(env.channel, env.user.id, env.serverConfig, "Type Some Commands To Test The Collector:", "Finish!!", "TIMEOUT!!!! GRRRRRR!!!!!", 5000)
            .then(inputs => env.channel.send(`Inputs:\n ${JSON.stringify(inputs)}`));
        return env;
    }
}