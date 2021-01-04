const { Client } = require("discord.js");
const { execEnv } = require("../modules/scripting");
const { displayScript, createDisplay } = require("../modules/editors");

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
            case "editor_win":
                var script = ['say "Alice: Hi!"', 'say "Bob: Hi!"'];
                env.channel.send(createDisplay("foo", displayScript(script, parseInt(args[2]), parseInt(args[3]), parseInt(args[4])), env));
                break;
            case "msg_collect":
                    msg_collect(env)
                    .then(msg => env.channel.send(msg))
                    .catch(() => env.channel.send("Error"));
                    
                break;
        }
        return env;
    }
}

// function msg_collect(env)
// {
//     return new Promise((resolve, reject) => {
//         env.channel.send("Collector:")
//         .then(() => {
//             const filter = m => m.author.id === env.user.id;
//             const collector = env.channel.createMessageCollector(filter, {max: 1});
//             collector.on("end", m => resolve(m.array()[0].content));
//         })
//     })
// }

function msg_collect(env)
{
    return new Promise((resolve, reject) => {
        const filter = message => message.author === env.user;
        // env.channel.send(createDisplay(scriptName, displayScript(script, true, true), env.copy()))
        env.channel.send("Editor")// idle: idleTimeout
            .then(async () => {
                const collector = env.channel.createMessageCollector(filter, {max: 1});
                collector.on("end", m => resolve(m.array()[0].content));
            });
        
    })
}