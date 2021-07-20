const execEnv = require("../modules/di-sh/interpreter/execEnv");
const { isUserMention, getUserID, getRoleID, isRoleMention } = require("../modules/mention");
const { calculatePermissionLevel, updateUserPermissionLevel, updateRolePermissionLevel } = require("../modules/permission");

module.exports = {
    name: 'permission',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [
        {
            name: 'calc',
            illegalContextes: ["script"],
            permissionLevel: null,
            subCommands: [],
            async execute(env, args)
            {
                let id = args.length === 3 && isUserMention(args[2]) ? getUserID(args[2]) : env.user.id;
                let permission = await calculatePermissionLevel(env, id);
                env.send(permission);
                env.pipeOutput(permission);

            }
        },
        {
            name: 'update',
            illegalContextes: ["script"],
            permissionLevel: 1,
            subCommands: [],
            async execute(env, args)
            {
                if(isRoleMention(args[2]))updateRolePermissionLevel(env, getRoleID(args[2]), parseInt(args[3]));
                else updateUserPermissionLevel(env, getUserID(args[2]), parseInt(args[3]));
            }
        }
    ],
    execute: null
}