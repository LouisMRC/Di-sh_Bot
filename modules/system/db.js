const ExecEnv = require("../di-sh/interpreter/execEnv");
const { parseConf } = require("./config");
const ServerConf = require("./serverConfig");

/**
 * 
 * @param {import("mariadb").PoolConnection} connection 
 * @param {string} serverID 
 * @param {boolean} verify 
 * @returns {Promise<ServerConf>}
 */
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
 * @param {ExecEnv} env 
 * @param {string} scriptName 
 * @param {Array<string>} script 
 */
async function saveScript(env, scriptName, script)
{
    if((await env.connection.query("SELECT Script_name FROM scripts WHERE Server_ID=? AND Script_name=?;", [env.server.id, scriptName])).length)
    {
        await env.connection.query("UPDATE scripts SET Script=? Where Server_ID=? AND Script_name=?;", [JSON.stringify(script), env.server.id, scriptName]);
    }
    else await env.connection.query("INSERT INTO scripts (Server_ID, Script_name, Script) VALUES (?, ?, ?);", [env.server.id, scriptName, JSON.stringify(script)]);
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} name 
 * @param {boolean} getDefault
 */
async function getConfig(env, name)
{
    let rows = await env.connection.query("SELECT Server_ID, Data FROM configs WHERE (Server_ID=? OR Server_ID=0) AND Config_name=?;", [env.server.id, name]);
    for(let row of rows)if(row.Server_ID === env.server.id)return parseConf(JSON.parse(row.Data));
    return parseConf(JSON.parse(rows[0].Data));
}

/**
 * 
 * @param {ExecEnv} env 
 */
async function listConfigs(env)//get a list of all the default configurations (where serverID=0)
{
    let configs = []
    for(let config of await env.connection.query("SELECT Config_name FROM configs WHERE Server_ID=0;"))configs.push(config.Config_name);
    return configs;
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {string} name 
 * @param {string} config 
 */
async function updateConfig(env, name, config)
{
    if((await env.connection.query("SELECT Config_name FROM configs WHERE Server_ID=? AND Config_name=?;", [env.server.id, name])).length)//check if the configuration is already in the db
    {
        await env.connection.query("UPDATE configs SET Data=? Where Server_ID=? AND Config_name=?;", [config, env.server.id, name]);//update the existing configuration
    }
    else await env.connection.query("INSERT INTO configs (Server_ID, Config_name, Data) VALUES (?, ?, ?);", [env.server.id, name, config]);//create a new configuration
}

/**
 * 
 * @param {ExecEnv} env 
 */
 async function resetConfig(env, name)
 {
     await env.connection.query("DELETE FROM config WHERE Server_ID=? AND Config_name=?;", [env.server.id, name]);//delete the custom configuration
 }


module.exports = {
    getServer,
    dbAddServer,

    saveScript,
    
    getConfig,
    listConfigs,
    updateConfig,
    resetConfig
}