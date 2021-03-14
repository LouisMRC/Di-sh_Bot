const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { isUserMention, getUserID, getRoleID, isRoleMention } = require("../modules/mention");
const { calculatePermissionLevel, updateUserPermissionLevel, updateRolePermissionLevel } = require("../modules/permission");

module.exports = {
    name: 'permission',
    description: 'manage permissions',
    allowedContexts: ["user", "script"],
    permissionLevel: 0,
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
                let id = args.length === 3 && isUserMention(args[2]) ? getUserID(args[2]) : env.user.id;
                let permission = await calculatePermissionLevel(env, id);
                env.send(permission);
                env.pipeOutput(permission);
                break;
            case "update":
                if(isRoleMention(args[2]))updateRolePermissionLevel(env, getRoleID(args[2]), parseInt(args[3]));
                else updateUserPermissionLevel(env, getUserID(args[2]), parseInt(args[3]));
                break;
        }
    }
}