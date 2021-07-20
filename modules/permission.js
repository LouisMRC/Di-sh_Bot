const ExecEnv = require("./di-sh/interpreter/execEnv");
const { checkConnection } = require("./system/db");


/**
 * 
 * @param {ExecEnv} env 
 * @param {string} userID 
 */
async function calculatePermissionLevel(env, userID)
{
    const perms = [await getUserPermissionLevel(env, userID)];
    for(let role of (await env.server.members.fetch(userID)).roles.cache.array())
    {
        const permLevel = await getRolePermissionLevel(env, role.id);
        if(permLevel !== null)perms.push(permLevel);
    }

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
    env.connection = await checkConnection(env.client.db, env.connection);
    await env.connection.query("SELECT Role_ID FROM role_permissions WHERE Server_ID=? AND Permission_level <= ?;", [env.server.id, minPermLevel])
        .then(rows => {
            for(let row of rows)permissions.push(row.Role_ID);
        });
    for(let role of roles)if(permissions.includes(role.id))return true;
    return false;
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} userID 
 */
async function getUserPermissionLevel(env, userID)
{
    env.connection = await checkConnection(env.client.db, env.connection);
    if(userID === env.server.ownerID || userID === "0")return 0;
    const row = await env.connection.query("SELECT Permission_level FROM user_permissions WHERE Server_ID=? AND User_ID=?;", [env.server.id, userID]);
    if(!row.length)return 5;//hardcoded
    return row[0].Permission_level;
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} roleID 
 */
async function getRolePermissionLevel(env, roleID)
{
    env.connection = await checkConnection(env.client.db, env.connection);
    if((await (env.server.roles.fetch(roleID))).permissions.has("ADMINISTRATOR"))return 0;
    const row = await env.connection.query("SELECT Permission_level FROM role_permissions WHERE Server_ID=? AND Role_ID=?;", [env.server.id, roleID]);
    if(!row.length)return null;
    return row[0].Permission_level;
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} userID 
 * @param {number} newPermLevel 
 */
async function updateUserPermissionLevel(env, userID, newPermLevel)
{
    env.connection = await checkConnection(env.client.db, env.connection);
    if((await env.connection.query("SELECT Permission_level FROM user_permissions WHERE Server_ID=? AND User_ID=?;", [env.server.id, userID])).length)
    {
        await env.connection.query("UPDATE user_permissions SET Permission_level=? Where Server_ID=? AND User_ID=?;", [newPermLevel, env.server.id, userID]);
    }
    else await env.connection.query("INSERT INTO user_permissions (Server_ID, User_ID, Permission_level) VALUES (?, ?, ?);", [env.server.id, userID, newPermLevel]);
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} roleID 
 * @param {number} newPermLevel 
 */
async function updateRolePermissionLevel(env, roleID, newPermLevel)
{
    env.connection = await checkConnection(env.client.db, env.connection);
    if((await env.connection.query("SELECT Permission_level FROM role_permissions WHERE Server_ID=? AND Role_ID=?;", [env.server.id, roleID])).length)
    {
        await env.connection.query("UPDATE role_permissions SET Permission_level=? Where Server_ID=? AND Role_ID=?;", [newPermLevel, env.server.id, roleID]);
    }
    else await env.connection.query("INSERT INTO role_permissions (Server_ID, Role_ID, Permission_level) VALUES (?, ?, ?);", [env.server.id, roleID, newPermLevel]);
}

module.exports = {
    calculatePermissionLevel,
    checkPermissionLevel,
    getRolePermissionLevel,
    getUserPermissionLevel,

    updateUserPermissionLevel,
    updateRolePermissionLevel
}