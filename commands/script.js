const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { MessageEmbed } = require("discord.js");
const { displayScript, scriptEditor } = require("../modules/editors");
const { bold } = require("../modules/textDecorations");

module.exports = {
    name: 'script',
    description: 'command scripts',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
    * 
    * @param {ExecEnv} env
    * @param {Array<string>} args 
    */
    async execute(env, args)
    {
        switch(args[1])
        {
            case "create":
                if((await env.connection.query(`SELECT * FROM scripts WHERE Server_ID=? AND Script_name=?`, [env.server.id, args[2]])).length)
                {
                    // hardcoded
                    break;
                }
                await scriptEditor(env.client, env.connection, env, 120_000, {scriptName: args[2].toLowerCase(), script: []})
                    .catch(async () => await env.send("timeout"));
                break;
            case "delete"://hardcode
                if(env.user.id === env.server.owner.id)env.connection.query("DELETE FROM scripts WHERE Server_ID=? AND Script_name=?", [env.server.id, args[2].toLowerCase()]);
                break;
            case "edit":
                var script = await env.connection.query("SELECT Script_name, Script FROM scripts WHERE Server_ID=? AND Script_name=?;", [env.server.id, args[2].toLowerCase()]);
                
                if(script.length)await scriptEditor(env.client, env.connection, env, 120_000, {scriptName: script[0].Script_name, script: script[0].Script});
                else await scriptEditor(env.client, env.connection, env, 120_000, {scriptName: script[0].Script_name, script: []});

                break;
            case "editor":
                if(args.length > 2)
                {
                    const script = await env.connection.query("SELECT Script_name, Script FROM scripts WHERE Server_ID=? AND Script_name=?;", [env.server.id, args[2].toLowerCase()]);
                    if(script.length)await scriptEditor(env.client, env.connection, env, 120_000, {scriptName: script[0].Script_name, script: script[0].Script});
                    else await scriptEditor(env.client, env.connection, env, 120_000, {scriptName: script[0].Script_name, script: []});
                }
                else await scriptEditor(env.client, env.connection, env, 120_000);
                break;
            case "list":
                const scripts = await env.connection.query("SELECT Script_name, Script FROM scripts WHERE Server_ID=?;", [env.server.id]);
                var message = new MessageEmbed();
                let list = "";
                for(let i = 0; i < scripts.length; i++)list += (i ? "\n" : "") + env.serverLocale.script_list_item.replace("$scriptName", bold(scripts[i].Script_name)).replace("$scriptSize", scripts[i].Script.length);
                message.addField(bold(env.serverLocale.script_show_title), list)
                .setColor("BLUE");
                env.channel.send(message);
                break;
            case "show":
                var script = await env.connection.query(`SELECT Script_name, Script FROM scripts WHERE Server_ID=? AND Script_name=?;`, [env.server.id, args[2]]);
                var message = bold(`${script[0].Script_name}:`);
                message += displayScript(script[0].Script, false, false)
                env.channel.send(message);
                break;
            case "rename":
                await env.connection.query("UPDATE scripts SET Script_name=? WHERE Server_ID=? AND Script_name=?;", [args[3], env.server.id, args[2]]);
                break;
        }
        return env;
    }
}
