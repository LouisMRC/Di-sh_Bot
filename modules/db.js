const ServerConf = require("./serverConfig");

async function getServer(connection, serverID, verify = false)
{
    let config = null;
    await connection.query("SELECT * FROM servers WHERE Server_ID=?;", [serverID])
        .then(async (rows) => {
            if(rows.length)config = new ServerConf(rows[0].Command_prefix, rows[0].Language, rows[0].Auto_NOPING);
            else if(!rows.length && verify)
            {
                await dbAddServer(connection, serverID);
                config = await getServer(connection, serverID);
            }
        })
        .catch(console.error);
    return config
}
async function dbAddServer(connection, serverID)
{
    await connection.query("INSERT INTO servers (Server_ID) VALUES (?);", [serverID])
        .catch(console.error);
}

/**
 * 
 * @param {import("mariadb").PoolConnection} connection 
 * @param {execEnv} env 
 * @param {string} scriptName 
 * @param {Array<string>} script 
 */
async function saveScript(connection, env, scriptName, script)
{
    if((await connection.query("SELECT Script_name FROM scripts WHERE Server_ID=? AND Script_name=?;", [env.server.id, scriptName])).length)
    {
        await connection.query("UPDATE scripts SET Script=? Where Server_ID=? AND Script_name=?;", [JSON.stringify(script), env.server.id, scriptName]);
    }
    else await connection.query("INSERT INTO scripts (Server_ID, Script_name, Script) VALUES (?, ?, ?);", [env.server.id, scriptName, JSON.stringify(script)]);
}

module.exports = {
    getServer,
    dbAddServer,

    saveScript
}