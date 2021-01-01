const { Client } = require("discord.js");
const { execEnv, displayScript } = require("../modules/scripting");

module.exports = {
    name: 'testing',
    description: 'some test commands(may be removed after release)',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {Client} client
     * @param {import("mariadb").PoolConnection} connection 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(client, connection, env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "display_script":
                var script = ['say "Alice: Hi!"', 'say "Bob: Hi!"'];
                env.channel.send(displayScript(script, parseInt(args[2]), parseInt(args[3]), parseInt(args[4])));
                break;
        }
        return env;
    }
}