const { toChannelMention, toUserMention } = require("../modules/mention");
const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { ChannelOutput } = require("../modules/di-sh/interpreter/output");

module.exports = {
    name: 'env',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [
        {
            name: 'set',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [
                {
                    name: 'channel',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [],
                    async execute(env, args)
                    {
                        env.channel = env.server.channels.cache.get(args[3]);
                    }
                }
            ],
            execute: null
        },
        {
            name: 'show',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [
                {
                    name: 'channel',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [],
                    async execute(env, args)
                    {
                        env.send(`ENV/CHANNEL: ${toChannelMention(env.channel.id)}`);
                    }
                },
                {
                    name: 'user',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [],
                    async execute(env, args)
                    {
                        env.send(`ENV/USER: ${toUserMention(env.user.id)}`);
                    }
                },
                {
                    name: 'context',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [],
                    async execute(env, args)
                    {
                        env.send(`ENV/CONTEXT: ${env.context}`);
                    }
                },
                {
                    name: 'pid',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [],
                    async execute(env, args)
                    {
                        let pid = env.processID;
                        env.send(`ENV/PID: ${pid}`);
                        env.pipeOutput(pid);
                    }
                }
            ],
            execute: 1
        },
        {
            name: 'outputs',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [
                {
                    name: 'add',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [
                        {
                            name: 'channel',
                            illegalContextes: [],
                            permissionLevel: null,
                            subCommands: [],
                            async execute(env, args)
                            {
                                env.outputManager.add(new ChannelOutput(env.server.channels.cache.get(args[4]), args[5] === "true"));
                            }
                        },
                        {
                            name: 'console',
                            illegalContextes: [],
                            permissionLevel: null,
                            subCommands: [],
                            execute: 1
                        },
                        {
                            name: 'file',
                            illegalContextes: [],
                            permissionLevel: null,
                            subCommands: [],
                            execute: 1
                        }
                    ],
                    execute: null
                },
                {
                    name: 'remove',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [],
                    execute: 1
                },
                {
                    name: 'list',
                    illegalContextes: [],
                    permissionLevel: null,
                    subCommands: [],
                    async execute(env, args)
                    {
                        let line = "OutputTargets:";
                        env.outputManager.outputTargets.forEach((output, id) => line += `\nid: ${id}, type: ${output.constructor.name}, target: ${output.target == null ? env.channel : output.target}`);
                        env.send(line);
                    }
                }
            ],
            execute: null
        }
    ],
    execute: null
}