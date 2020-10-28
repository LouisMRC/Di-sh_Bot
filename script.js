const fs = require('fs');
const Mention = require("./modules/mention");
const TextDecorations = require("./modules/textDecorations");
const Discord = require("discord.js");
const Mariadb = require("mariadb");
const ServerConf = require("./modules/serverConfig");
const Client = new Discord.Client();
Client.commands = new Discord.Collection();
const languages = new Map();
const{
    token,
    langPath,
    dbHost,
    dbName,
    dbUsername,
    dbUserPasswd
} = require('./config.json');
const mention = require("./modules/mention");
const ServerConfig = require('./modules/serverConfig');

const pool = Mariadb.createPool( {
    host: dbHost,
    user: dbUsername,
    password: dbUserPasswd,
    database: dbName,
    connectionLimit: 5
});

for(const file of fs.readdirSync('./commands').filter(file => file.endsWith('.js'))) 
{
	const command = require(`./commands/${file}`);
	Client.commands.set(command.name, command);
}

let servers = new Map();

pool.getConnection()
    .then(async (connection) => {
        await loadConfig(connection);
        loadLanguages();
        console.log(servers);
        Client.once("ready", () => console.log("Let's Go!!!"));

        Client.on("message", (message) => {
            commandExe(connection, message.guild, message.content, message);
            if(Mention.isUserMention(message.content) && Mention.getUserID(message.content) === Client.user.id)message.reply(languages.get(servers.get(message.guild.id).getLanguage()).help_dialog.replace("$prefix", servers.get(message.guild.id).getPrefix()).replace("$prefix", servers.get(message.guild.id).getPrefix()));
        });

        Client.on("messageUpdate", (oldMessage, newMessage) => {
            if(((newMessage.editedAt.getTime() - oldMessage.createdAt.getTime()) / 1000) < 86400)
            {
                commandExe(connection, message.guild, message.content, message);
                if(Mention.isUserMention(newMessage.content) && Mention.getUserID(newMessage.content) === Client.user.id)newMessage.reply(languages.get(servers.get(newMessage.guild.id).getLanguage()).help_dialog.replace("$prefix", servers.get(newMessage.guild.id).getPrefix()).replace("$prefix", servers.get(newMessage.guild.id).getPrefix()));
            }
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
    languages.set("en", require(langPath + "en.json"));
    languages.set("fr", require(langPath + "fr.json"));
}



/**
 * 
 * @param connection 
 * @param {Discord.Guild} guild 
 * @param {Array} args 
 * @param {ServerConfig} conf 
 * @param locale 
 * @param {Discord.Channel} channel 
 */
async function matchCommand(connection, guild, args, conf, locale, channel)
{
    const ping = (args[args.length -1] === "noping" || servers.get(guild.id).isAutoNOPING()) ? false : true;
    switch(args[0].toLowerCase())
    {
        case "ping":
            await channel.send("Pong!")
                .then(async () => await channel.send(":wink:"));
            break;
        case "time":
            await channel.send(Date.now());
            break;


        case "alias":
            await Client.commands.get("alias").execute(connection, args, guild, conf, locale, channel);
            break;
        case "role":
            await Client.commands.get("role").execute(args, guild, locale, channel, ping);//args, guild, locale, channel
            break;
        case "settings":
            await Client.commands.get("settings").execute(connection, args, guild, conf, locale, channel);//connection, args, guild, conf, locale, channel
            break;
        case "help":
            break;
        default:
            await connection.query("SELECT Commands FROM Aliases WHERE ServerID=? AND AliasName=?;", [guild.id, args[0].toLowerCase()])
                .then(async row => {
                    if(row.length)
                        for(let command of row[0].Commands)
                            await matchCommand(connection, guild, splitCommand(command).concat(args.slice(1)), conf, locale, channel);

                })
                .catch(console.error);
            break;
    }
}

/**
 * 
 * @param connection 
 * @param {Discord.Guild} guild 
 * @param {string} command 
 * @param {Discord.Message} message 
 */
async function commandExe(connection, guild, command, message, aliasArgs = null)
{
    if(!servers.has(guild.id))
    {
        await connection.query("SELECT * FROM Servers WHERE ServerID=" + guild.id)
            .then(async (rows) => { if(rows.length < 1)await dbAddServer(connection, guild.id); })
            .catch(err => console.error(err));
        await loadServer(connection, guild.id);
    }


    const guildPrefix = servers.get(guild.id).getPrefix();
    let channel;
    if(message === null)channel = guild.systemChannel;
    else
    {
        if(!command.startsWith(guildPrefix))return;
        channel = message.channel;
    }
    if(command.startsWith(guildPrefix))command = command.slice(guildPrefix.length);
    const conf = servers.get(guild.id);
    await matchCommand(connection, guild, (aliasArgs === null ? splitCommand(command).concat(aliasArgs) : splitCommand(command)), conf, languages.get(conf.getLanguage()), channel)

}

/**
 * 
 * @param {string} command 
 */
function splitCommand(command)
{
    let args = [];
    let argBuffer = "";
    for(let i = 0; i < command.length; i++)
    {
        let c = command[i]
        switch(c)
        {
            case " ":
                if(argBuffer.length > 0)
                {
                    args.push(argBuffer);
                    argBuffer = "";
                }
                break;
            case '"':
            case "'":
            case "[":
                if(argBuffer.length > 0)
                {
                    args.push(argBuffer);
                    argBuffer = "";
                }
                do
                {
                    argBuffer += command[i];
                    i++;
                }
                while(i < command.length && (command[i] !== c && !(c === "[" && command[i] === "]")));
                if(i < command.length)argBuffer += command[i];
                args.push(argBuffer);
                argBuffer = "";
                break;
            default:
                argBuffer += c;
                break;
        }
        //console.log(`------------\n${args}\n${argBuffer}\n${c}\n------------\n`)
    }
    if(argBuffer.length > 0)args.push(argBuffer);
    return args;
}
