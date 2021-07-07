const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { configEditor } = require("../modules/editors");
const { getConfig, resetConfig, listConfigs } = require("../modules/system/db");
const { multiline_codeblock } = require("../modules/textDecorations");

module.exports = {
    name: 'config',
    description: 'manage bot configurations',
    allowedContexts: ["user", "script"],
    permissionLevel: 0,
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "edit":
                configEditor(env, 120_000, {name: args[2].toLowerCase(), data: (await getConfig(env, args[2].toLowerCase()))})
                break;
            case "reset":
                resetConfig(env, args[2].toLowerCase());
                break;
            case "list":
                let configs = "";
                for(let config of await listConfigs(env))configs += (configs.length ? "\n-" : "-") + config;
                env.send(multiline_codeblock(configs));
                break;
            case "show":
                break;
            case "import":
                break;
            case "export":
                break;
            default:
                break;
        }
    }
}