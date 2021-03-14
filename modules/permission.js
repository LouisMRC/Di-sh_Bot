const ExecEnv = require("./di-sh/interpreter/execEnv");


/**
 * 
 * @param {ExecEnv} env 
 * @param {string} userID 
 */
async function calculatePermissionLevel(env, userID)
{
    const perms = [await getUserPermissionLevel(env, userID)];
    await (await env.server.members.fetch(userID)).roles.cache.array().forEach(async role => {
        const permLevel = await getRolePermissionLevel(env, role.id);
        if(permLevel !== null)perms.push(permLevel);
    });
    if(perms.length === 1)return perms[0];
    await perms.sort();
    return perms[0];
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} userID 
 * @param {number} minPermLevel 
 */
async function checkPermissionLevel(env, userID, minPermLevel)
{
    if((await getUserPermissionLevel(env, userID)) <= minPermLevel)return true;
    const roles = (await env.server.members.fetch(userID)).roles.cache.array();
    const permissions = [];
    await await env.connection.query("SELECT Role_ID FROM role_permissions WHERE Server_ID=? AND Permission_level <= ?;", [env.server.id, minPermLevel])
        .then(rows => {
            for(let row of rows)permissions.push(row.Role_ID);
        });
    for(let role of roles)if(permissions.includes(role.id))return true;
    return false;
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} roleID 
 */
async function getRolePermissionLevel(env, roleID)
{
    if((await (env.server.roles.fetch(roleID))).permissions.has("ADMINISTRATOR"))return 0;
    const row = await env.connection.query("SELECT Permission_level FROM role_permissions WHERE Server_ID=? AND Role_ID=?;", [env.server.id, roleID]);
    if(!row.length)return null;
    return row[0].Permission_level;
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} userID 
 */
async function getUserPermissionLevel(env, userID)
{
    if(userID === env.server.ownerID)return 0;
    const row = await env.connection.query("SELECT Permission_level FROM user_permissions WHERE Server_ID=? AND User_ID=?;", [env.server.id, userID]);
    if(!row.length)return 5;//hardcoded
    return row[0].Permission_level;
}

module.exports = {
    calculatePermissionLevel,
    checkPermissionLevel,
    getRolePermissionLevel,
    getUserPermissionLevel
}