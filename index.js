const fs = require('fs');
const {isUserMention, getUserID} = require("./modules/mention");
const Discord = require("discord.js");
const Mariadb = require("mariadb");
const {token, dbHost, dbName, dbUsername, dbUserPasswd} = require('./config.json');
const {getServer} = require("./modules/db");
const {prepareCommand} = require("./modules/scripting");
const {languages, loadLanguages} = require("./modules/lang");


const Client = new Discord.Client();
Client.commands = new Discord.Collection();
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


pool.getConnection()
    .then(async (connection) => {
        loadLanguages();
        Client.once("ready", () => console.log("Let's Go!!!"));

        Client.on("message", async (message) => {
            const servConf = await getServer(connection, message.guild.id, true);
            prepareCommand(Client, connection, message.guild, servConf, message.content, message);
            if(isUserMention(message.content) && getUserID(message.content) === Client.user.id)message.reply(languages.get(servConf.getLanguage()).help_dialog.replace("$prefix", servConf.getPrefix()).replace("$prefix", servConf.getPrefix()));
        });

        Client.on("messageUpdate", async (oldMessage, newMessage) => {
            if(newMessage.editedAt !== null && ((newMessage.editedAt.getTime() - oldMessage.createdAt.getTime()) / 1000) < 86400)
            {
                const servConf = await getServer(connection, newMessage.guild.id, true);
                prepareCommand(Client, connection, newMessage.guild, servConf, newMessage.content, newMessage);

                if(isUserMention(newMessage.content) && getUserID(newMessage.content) === Client.user.id)newMessage.reply(languages.get(servConf.getLanguage()).help_dialog.replace("$prefix", servConf.getPrefix()).replace("$prefix", servConf.getPrefix()));
            }
        })

        Client.on("guildCreate", guild => {
            getServer(connection, guild.id, true);
        });
        
        Client.login(token);
    }).catch(err => console.error(err));
