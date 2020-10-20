const Discord = require("discord.js");
const Mariadb = require("mariadb");
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

const pool = Mariadb.createPool({
    host: dbHost,
    user: dbUsername,
    password: dbUserPasswd,
    database: dbName,
    connectionLimit: 5
});

let servers = [];

pool.getConnection()
    .then(connection => {
        Client.once("ready", () => console.log("Let's Go!!!"));

        Client.on("message", (message) => {
            const args = message.content.slice(prefix.length).split(' ');
            switch(args[0].toLowerCase())
            {
                case "count":
                    break;
                case "role":
                    switch(args[1].toLowerCase())
                    {
                        case "add":
                            break;
                        case "role":
                            break;
                        case "replace":
                            break;
                    }
                    break;
            }
        })
        
        Client.login(token);
    }).catch(err => console.error(err));

function loadLanguages()
{
    LANGUAGES.set("en", require(langPath + "en.json"));
    LANGUAGES.set("fr", require(langPath + "fr.json"));
}