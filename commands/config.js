const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { configEditor } = require("../modules/editors");
const { getConfig, resetConfig, listConfigs } = require("../modules/system/db");
const { multiline_codeblock } = require("../modules/textDecorations");

module.exports = {
    name: 'config',
    illegalContextes: [],
    permissionLevel: 3,
    subCommands: [
        {
            name: 'edit',//hardcoded
            illegalContextes: ["script"],
            permissionLevel: 1,
            subCommands: [],
            async execute(env, args)
            {
                configEditor(env, 120_000, {name: args[2].toLowerCase(), data: (await getConfig(env, args[2].toLowerCase()))});//todo: check if file exist
            }
        },
        {
            name: 'reset',
            illegalContextes: ["script"],
            permissionLevel: 0,
            subCommands: [],
            async execute(env, args)
            {
                resetConfig(env, args[2].toLowerCase());
            }
        },
        {
            name: 'list',
            illegalContextes: [],
            permissionLevel: null,
            subCommands: [],
            execute: 0
            // async execute(env, args)
            // {
                
            // }
        },
        {
            name: 'show',
            illegalContextes: [],
            permissionLevel: 1,
            subCommands: [],
            execute: 0
            // async execute(env, args)
            // {
                
            // }
        },
        {
            name: 'import',
            illegalContextes: [],
            permissionLevel: 1,
            subCommands: [],
            execute: 0
            // async execute(env, args)
            // {
                
            // }
        },
        {
            name: 'export',
            illegalContextes: [],
            permissionLevel: 1,
            subCommands: [],
            execute: 0
            // async execute(env, args)
            // {
                
            // }
        }
    ],
    execute: null
}