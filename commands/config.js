const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { configEditor } = require("../modules/editors");
const { getConfig } = require("../modules/system/db");

module.exports = {
    name: 'config',
    description: 'edit configs',
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
                    .then(async () => await env.send("finished"))
                    .catch(async () => await env.send("timeout"));
                break;
            case "reset":
                break;
            case "list":
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