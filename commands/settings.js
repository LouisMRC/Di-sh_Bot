const { Guild, Channel } = require("discord.js");
const ServerConfig = require("../modules/serverConfig");

Discord = require("discord.js");
GuildConf = require("../modules/serverConfig");
module.exports = {
    name: 'settings',
    description: 'bot settings',
    /**
     * 
     * @param connection 
     * @param {Array} args 
     * @param {Guild} guild 
     * @param {ServerConfig} conf 
     * @param locale 
     * @param {Channel} channel
     */
    async execute(connection, args, guild, conf, locale, channel)
    {
        switch(args[1].toLowerCase())
        {
            case "show":
                channel.send(locale.settings_general.replace("$prefix", conf.getPrefix()).replace("$language", conf.getLanguage()).replace("$AutoNOPING", (conf.isAutoNOPING() ? "ON" : "OFF")));
                break;
            case "edit":
                switch(args[2].toLowerCase())
                {
                    case "prefix":
                        if(args.length < 4)
                        {
                            channel.send(locale.settings_general_error_no_prefix);
                            break;
                        }
                        connection.query("UPDATE Servers SET CommandPrefix='" + args[3] + "' WHERE ServerID=" + guild.id)
                        conf.setPrefix(args[3]);
                        channel.send(locale.settings_update.replace("$setting", "prefix").replace("$value", conf.getPrefix()))
                        break;
                    case "language":
                        if(args.length < 4)
                        {
                            channel.send(locale.settings_general_error_no_language);
                            break;
                        }
                        if(setLang(connection, guild, conf, args[3]) === null)/*Send An Error Message*/;
                        else channel.send(locale.settings_update.replace("$setting", "language").replace("$value", conf.getLanguage()))
                        break;
                    case "auto-noping":
                        connection.query("UPDATE Servers SET AutoNOPING=" + !conf.isAutoNOPING() + " WHERE ServerID=" + guild.id)
                        conf.setAutoNOPING(!conf.isAutoNOPING());
                        channel.send(locale.settings_update.replace("$setting", "auto-noping").replace("$value", (conf.isAutoNOPING() ? "ON" : "OFF")))
                        break;
                }
                break
        }
    }
}
function setLang(connection, guild, conf, newLang)
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
    }
    if(lang !== null)
    {
        connection.query("UPDATE Servers SET Language='" + lang + "' WHERE ServerID=" + guild.id)
        conf.setLanguage(lang);
        return;
    }
    return null;
}