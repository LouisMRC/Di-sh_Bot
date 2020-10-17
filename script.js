const Discord = require("discord.js");
const Client = new Discord.Client();
const{
    token
} = require('./config.json');

Client.once("ready", () => console.log("Let's Go!!!"));

Client.on("message", (message) => {
    const args = message.content.slice(prefix.length).split(/ +/);
    switch(args[0])
    {
        
    }
})

Client.login(token);