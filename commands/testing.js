const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { displayScript, createDisplay } = require("../modules/editors");

module.exports = {
    name: 'testing',
    description: 'some test commands(may be removed after release)',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [
        {
            name: 'display_script',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                let script = ['say "Alice: Hi!"', 'say "Bob: Hi!"'];
                env.channel.send(displayScript(script, parseInt(args[2]), parseInt(args[3]), parseInt(args[4])));
            }
        },
        {
            name: 'editor_win',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                let script = ['say "Alice: Hi!"', 'say "Bob: Hi!"'];
                env.channel.send(createDisplay("foo", displayScript(script, parseInt(args[2]), parseInt(args[3]), parseInt(args[4])), env));
            }
        },
        {
            name: 'msg_collect',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                msg_collect(env)
                .then(msg => env.channel.send(msg))
                .catch(() => env.channel.send("Error"));
            }
        },
        {
            name: 'split',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                env.send(splitCommand(args[2]));
            }
        },
        {
            name: 'yes_no',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                env.send(`Answer: ${await promptYesNo(env, "Yes or No ?", 10000, "yes")}`);
            }
        },
        {
            name: 'window',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                env.send(windowedText("*", "_", "|", 2, 2, "left", args[2]));
            }
        }
    ],
    execute: null
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