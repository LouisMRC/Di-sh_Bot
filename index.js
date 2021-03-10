const fs = require('fs');
const { isUserMention, getUserID } = require("./modules/mention");
const Discord = require("discord.js");
const Mariadb = require("mariadb");
const { token, dbHost, dbName, dbUsername, dbUserPasswd } = require('./config.json');
const { getServer } = require("./modules/system/db");
const { languages, loadLanguages } = require("./modules/lang");
const { Interpreter, createUserTermEnv, prepareScript, spawnProcess } = require('./modules/di-sh/interpreter/interpreter');


const Client = new Discord.Client();
Client.commands = new Discord.Collection();
Client.processes = new Discord.Collection();
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
            let env = await createUserTermEnv(Client, connection, message);
            let script = prepareScript(env, message.content);
            if(script.length)spawnProcess(env, script[0].toLowerCase(), script);
            if(isUserMention(message.content) && getUserID(message.content) === Client.user.id)message.reply(languages.get(env.serverConfig.getLanguage()).help_dialog.replace("$prefix", env.serverConfig.getPrefix()).replace("$prefix", env.serverConfig.getPrefix()));
        });

        Client.on("messageUpdate", async (oldMessage, newMessage) => {
            if(newMessage.editedAt !== null && ((newMessage.editedAt.getTime() - oldMessage.createdAt.getTime()) / 1000) < 86400)
            {
                let env = await createUserTermEnv(Client, connection, newMessage);
                let script = prepareScript(env, newMessage.content);
                if(script.length)spawnProcess(env, script[0].toLowerCase(), script);
                if(isUserMention(newMessage.content) && getUserID(newMessage.content) === Client.user.id)newMessage.reply(languages.get(env.serverConfig.getLanguage()).help_dialog.replace("$prefix", env.serverConfig.getPrefix()).replace("$prefix", env.serverConfig.getPrefix()));
            }
        })

        Client.on("guildCreate", guild => {
            getServer(connection, guild.id, true);
        });
        
        Client.login(token);
    }).catch(err => console.error(err));
