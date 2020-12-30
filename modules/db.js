const ServerConf = require("./serverConfig");

async function getServer(connection, serverID, verify = false)
{
    let config = null;
    await connection.query("SELECT * FROM servers WHERE Server_ID=?;", [serverID])
        .then(async (rows) => {
            if(rows.length)config = new ServerConf(rows[0].CommandPrefix, rows[0].Language, rows[0].AutoNOPING);
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

module.exports = {
    getServer,
    dbAddServer
}