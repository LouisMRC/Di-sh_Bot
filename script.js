const Mention = require("./modules/mention");
const TextDecorations = require("./modules/textDecorations");
const Discord = require("discord.js");
const Mariadb = require("mariadb");
const ServerConf = require("./modules/serverConfig");
const Client = new Discord.Client();
const LANGUAGES = new Map();
const{
    token,
    langPath,
    dbHost,
    dbName,
    dbUsername,
    dbUserPasswd
} = require('./config.json');
const mention = require("./modules/mention");

const pool = Mariadb.createPool( {
    host: dbHost,
    user: dbUsername,
    password: dbUserPasswd,
    database: dbName,
    connectionLimit: 5
});

let servers = new Map();

pool.getConnection()
    .then(async (connection) => {
        await loadConfig(connection);
        loadLanguages();
        console.log(servers);
        Client.once("ready", () => console.log("Let's Go!!!"));

        Client.on("message", (message) => {
            matchCommand(connection, message);
        });

        Client.on("messageUpdate", (oldMessage, newMessage) => {
            if(((newMessage.editedAt.getTime() - oldMessage.createdAt.getTime()) / 1000) < 86400)matchCommand(connection, newMessage);
        })

        Client.on("guildCreate", guild => {
            if(!servers.has(guild.id))
            {
                dbAddServer(connection, guild.id);
                loadServer(connection, guild.id);
            }
        });
        
        Client.login(token);
    }).catch(err => console.error(err));


async function loadConfig(connection)
{
        await connection.query("SELECT * FROM Servers")
            .then(rows => {
                rows.forEach(row => servers.set(row.ServerID, new ServerConf(row.CommandPrefix, row.Language, row.AutoNOPING)));
            })
            .catch(console.error);

}
async function loadServer(connection, serverID)
{
        await connection.query("SELECT * FROM Servers WHERE ServerID=" + serverID)
            .then(async (rows) => servers.set(rows[0].ServerID, new ServerConf(rows[0].CommandPrefix, rows[0].Language, row[0].AutoNOPING)))
            .catch(console.error);
}
async function dbAddServer(connection, serverID)
{
        await connection.query("INSERT INTO Servers (ServerID) VALUES (" + serverID + ")")
            .catch(console.error);
}
function loadLanguages()
{
    LANGUAGES.set("en", require(langPath + "en.json"));
    LANGUAGES.set("fr", require(langPath + "fr.json"));
}



/**
 * 
 * @param connection 
 * @param {Discord.Message} message 
 */
async function matchCommand(connection, message)
{
    if(!servers.has(message.guild.id))
    {
        await connection.query("SELECT * FROM Servers WHERE ServerID=" + message.guild.id)
            .then(async (rows) => { if(rows.length < 1)await dbAddServer(connection, message.guild.id); })
            .catch(err => console.error(err));
        await loadServer(connection, message.guild.id);
    }

    if(message.content.startsWith(servers.get(message.guild.id).getPrefix()))
    {
        const currentLocale = LANGUAGES.get(servers.get(message.guild.id).getLanguage());
        const args = message.content.slice(servers.get(message.guild.id).getPrefix().length).split(' ');
        const ping = (args[args.length -1] === "noping" || servers.get(message.guild.id).isAutoNOPING()) ? false : true;
        switch(args[0].toLowerCase())
        {
            case "ping":
                message.channel.send("Pong!")
                    .then(() => message.channel.send(":wink:"));
                break;
            case "time":
                message.channel.send(Date.now());
                break;
            case "count":
                switch(args[1].toLowerCase())
                {

                    case "emojis":
                        break;
                    case "members":
                        break;
                    break;
                }
            case "role":
                switch(args[1].toLowerCase())
                {
                    case "add":
                        break;
                    case "role":
                        break;
                    case "replace":
                        break;
                    case "count":
                        if(args.length < 3 || args[2].toLowerCase() === "all")
                        {
                            message.guild.roles.fetch()
                                .then(roles => message.channel.send(currentLocale.guild_rolecount.replace("$roleCount", roles.cache.size)))

                        }
                        else if(Mention.isUserMention(args[2]))
                        {
                            message.guild.members.fetch(Mention.getUserID(args[2]))
                                .then(member => message.channel.send(currentLocale.member_rolecount.replace("$member", ping ? mention.toUserMention(member.id) : TextDecorations.bold(member.nickname === null ? member.user.username : member.nickname)).replace("$roleCount", member.roles.cache.size)))
                                .catch(console.error);
                        }
                        else
                        {
                            message.guild.members.fetch()
                                .then(members => {
                                    const member = members.find(mem => mem.user.username === args[2] || mem.nickname === args[2]);
                                    if(member === undefined)message.channel.send(currentLocale.undefined_member.replace("$member", args[2]));
                                    else message.channel.send(currentLocale.member_rolecount.replace("$member", ping ? mention.toUserMention(member.id) : TextDecorations.bold(member.nickname === null ? member.user.username : member.nickname)).replace("$roleCount", member.roles.cache.size));
                                })
                                .catch(console.error);
                        }
                        break;
                    case "show":
                        break;
                }
                break;

            case "settings":
                switch(args[1].toLowerCase())
                {
                    case "show":
                        const config = servers.get(message.guild.id);
                        message.channel.send(currentLocale.bot_general_settings.replace("$prefix", config.getPrefix()).replace("$language", config.getLanguage()).replace("$AutoNOPING", (servers.get(message.guild.id).isAutoNOPING() ? "ON" : "OFF")));
                        break;
                    case "edit":
                        switch(args[2].toLowerCase())
                        {
                            case "prefix":
                                if(args.length < 4)
                                {
                                    message.channel.send(currentLocale.error_no_prefix_specified);
                                    break;
                                }
                                connection.query("UPDATE Servers SET CommandPrefix='" + args[3] + "' WHERE ServerID=" + message.guild.id)
                                servers.get(message.guild.id).setPrefix(args[3]);
                                break;
                            case "language":
                                if(args.length < 4)
                                {
                                    message.channel.send(currentLocale.error_no_language_specified);
                                    break;
                                }
                                setLang(connection, message, args[3]);
                                break;
                            case "auto-noping":
                                connection.query("UPDATE Servers SET AutoNOPING=" + !servers.get(message.guild.id).isAutoNOPING() + " WHERE ServerID=" + message.guild.id)
                                servers.get(message.guild.id).setAutoNOPING(!servers.get(message.guild.id).isAutoNOPING());
                                break;
                        }
                        break
                }
                break;
            case "help":
                break;
        }
    }
}

/**
 * 
 * @param connection 
 * @param {Discord.Message} message 
 * @param {string} newLang 
 */
function setLang(connection, message, newLang)
{
    let lang = null;
    switch(newLang.toLowerCase())
    {
        case "en":
        case "english":
        case "anglais":
            lang = "en";
            break;
        case "fr":
        case "français":
        case "francais":
        case "french":
            lang = "fr";
            break;
        default:
            //send an error message
    }
    if(lang !== null)
    {
        connection.query("UPDATE Servers SET Language='" + lang + "' WHERE ServerID=" + message.guild.id)
        servers.get(message.guild.id).setLanguage(lang);
    }
}
function searchUnusedRoles()
{

}