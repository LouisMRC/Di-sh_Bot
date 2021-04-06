const ExecEnv = require("../modules/di-sh/interpreter/execEnv");
const { isOption } = require("../modules/cliFuncs");

module.exports = {
    name: 'say',
    description: 'say something as the robot',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {ExecEnv} env
     * @param {Array} args 
     */
    async execute(env, args)
    {
        let options = {ping: true, output: 0, message: ""}//default options(ping: mentions->true, default output(0))
        
        for(let i = 1; i < args.length; i++)
        {
            switch(args[i])
            {
                case "--noping":
                case "-p":
                    options.ping = false;
                    break;
                case "--output":
                case "-o":
                    if(i+1 < args.length && !isNaN(args[i+1]))options.output = parseInt(args[++i]);
                    break;
                default:
                    if(options.message === "")options.message += args[i];
                    break;
            }
        }
        if(!options.message.length)return;
        env.pipeOutput((await env.send(options.message, options.output)).get(0)[0].id);
    }
}