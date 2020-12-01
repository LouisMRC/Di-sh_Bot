const ServerConf = require("./serverConfig");

async function getServer(connection, serverID, verify = false)
{
    let config = null;
        await connection.query("SELECT * FROM Servers WHERE ServerID=?;", [serverID])
            .then(async (rows) => config = new ServerConf(rows[0].CommandPrefix, rows[0].Language, rows[0].AutoNOPING))
            .catch(console.error);
    if(config === null && verify)
    {
        await dbAddServer(connection, serverID);
        config = await getServer(connection, serverID);
    }
    return config
}
async function dbAddServer(connection, serverID)
{
        await connection.query("INSERT INTO Servers (ServerID) VALUES (?);", [serverID])
            .catch(console.error);
}

module.exports = {
    getServer,
    dbAddServer
}