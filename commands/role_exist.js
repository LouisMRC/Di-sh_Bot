const { roleExist } = require("../modules/mention");
const { execEnv } = require("../modules/scripting");

module.exports = {
    name: 'role_exist',
    description: 'check if a role exist',
    allowedContexts: ["user", "script"],
    /**
     * 
     * @param {execEnv} env
     * @param {Array} args 
     * @param {boolean} ping 
     */
    async execute(client, connection, env, args)
    {
        env.channel.send((await roleExist(args[1], env.server)) ? "🟢" : "⚠️");
        return env;
    }
}