const { MessageEmbed } = require("discord.js");
const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'help',
    illegalContextes: [],
    permissionLevel: 5,
    subCommands: [],
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