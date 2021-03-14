const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { calculatePermissionLevel } = require("../modules/permission");

module.exports = {
    name: 'permission',
    description: 'manage permissions',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {
        switch(args[1])
        {
            case "calc":
                env.send(await calculatePermissionLevel(env, env.user.id));
        }
    }
}