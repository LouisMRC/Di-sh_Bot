const { Guild, Channel } = require("discord.js");
const { execEnv } = require("../modules/scripting");
const ServerConfig = require("../modules/serverConfig");

Discord = require("discord.js");
GuildConf = require("../modules/serverConfig");
module.exports = {
    name: 'settings',
    description: 'bot settings',
    /**
     * 
     * @param {import("mariadb").PoolConnection} connection 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(connection, env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "show":
                env.channel.send(env.serverLocale.settings_general.replace("$prefix", env.serverConfig.getPrefix()).replace("$language", env.serverConfig.getLanguage()).replace("$AutoNOPING", (env.serverConfig.isAutoNOPING() ? "ON" : "OFF")));
                break;
            case "edit":
                switch(args[2].toLowerCase())
                {
                    case "prefix":
                        if(args.length < 4)
                        {
                            env.channel.send(env.serverLocale.settings_general_error_no_prefix);
                            break;
                        }
                        connection.query("UPDATE Servers SET CommandPrefix=? WHERE ServerID=?", [args[3], env.server.id])
                        conf.setPrefix(args[3]);
                        channel.send(env.serverLocale.settings_update.replace("$setting", "prefix").replace("$value", env.serverConfig.getPrefix()))
                        break;
                    case "language":
                        if(args.length < 4)
                        {
                            env.channel.send(env.serverLocale.settings_general_error_no_language);
                            break;
                        }
                        if(setLang(connection, env.server, env.serverConfig, args[3]) === null)/*Send An Error Message*/;
                        else env.channel.send(env.serverLocale.settings_update.replace("$setting", "language").replace("$value", env.serverConfig.getLanguage()))
                        break;
                    case "auto-noping":
                        connection.query("UPDATE Servers SET AutoNOPING=? WHERE ServerID=?", [!env.serverConfig.isAutoNOPING(), env.server.id])
                        env.serverConfig.setAutoNOPING(!env.serverConfig.isAutoNOPING());
                        env.channel.send(env.serverLocale.settings_update.replace("$setting", "auto-noping").replace("$value", (env.serverConfig.isAutoNOPING() ? "ON" : "OFF")))
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