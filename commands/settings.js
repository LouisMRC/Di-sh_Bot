const ExecEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'settings',
    description: 'bot settings',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {
        switch(args[1].toLowerCase())
        {
            case "show":
                env.send(env.serverLocale.settings_general.replace("$prefix", env.serverConfig.getPrefix()).replace("$language", env.serverConfig.getLanguage()).replace("$AutoNOPING", (env.serverConfig.isAutoNOPING() ? "ON" : "OFF")));
                break;
            case "edit":
                switch(args[2].toLowerCase())
                {
                    case "prefix":
                        if(args.length < 4)
                        {
                            env.send(env.serverLocale.settings_general_error_no_prefix);
                            break;
                        }
                        env.connection.query("UPDATE servers SET Command_prefix=? WHERE Server_ID=?", [args[3], env.server.id])
                        env.serverConfig.setPrefix(args[3]);
                        channel.send(env.serverLocale.settings_update.replace("$setting", "prefix").replace("$value", env.serverConfig.getPrefix()))
                        break;
                    case "language":
                        if(args.length < 4)
                        {
                            env.send(env.serverLocale.settings_general_error_no_language);
                            break;
                        }
                        if(setLang(env.connection, env.server, env.serverConfig, args[3]) === null)/*Send An Error Message*/;
                        else env.send(env.serverLocale.settings_update.replace("$setting", "language").replace("$value", env.serverConfig.getLanguage()))
                        break;
                    case "auto-noping":
                        env.connection.query("UPDATE servers SET Auto_NOPING=? WHERE Server_ID=?", [!env.serverConfig.isAutoNOPING(), env.server.id])
                        env.serverConfig.setAutoNOPING(!env.serverConfig.isAutoNOPING());
                        env.send(env.serverLocale.settings_update.replace("$setting", "auto-noping").replace("$value", (env.serverConfig.isAutoNOPING() ? "ON" : "OFF")))
                        break;
                }
                break
        }
        return env;
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
        connection.query("UPDATE servers SET Language='" + lang + "' WHERE Server_ID=" + guild.id)
        conf.setLanguage(lang);
        return;
    }
    return null;
}