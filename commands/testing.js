const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { displayScript, createDisplay } = require("../modules/editors");

module.exports = {
    name: 'testing',
    description: 'some test commands(may be removed after release)',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
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
            case "split":
                env.send(splitCommand(args[2]));
                break;
            case "yes_no":
                env.send(`Answer: ${await promptYesNo(env, "Yes or No ?", 10000, "yes")}`);
                break;
            case "window":
                env.send(windowedText("*", "_", "|", 2, 2, "left", args[2]));
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