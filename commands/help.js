const { MessageEmbed } = require("discord.js");
const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'help',
    description: 'the documentation for the bot',
    allowedContexts: ["user"],
    permissionLevel: 5,
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        if(args.length < 2)env.send(env.serverLocale.help_message);
        else
        {
            const helpPage = env.client.help_pages.get(env.serverConfig.getLanguage(), args[1]);
            let message = new MessageEmbed()
                .setColor("BLUE")
                .addField(args[1], helpPage);
            env.send(message);
        }
        return env;
    }
}