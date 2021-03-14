const execEnv = require("../modules/di-sh/interpreter/execEnv");

module.exports = {
    name: 'goto',
    description: 'goto label',
    allowedContexts: ["user", "script"],
    permissionLevel: 5,
    /**
     * 
     * @param {execEnv} env
     * @param {Array<string>} args 
     */
    async execute(env, args)
    {

        let isRunning = env.interpreter.active;
        env.interpreter.stop();
        env.interpreter.awaitFullStop()
            .then(() => {
                env.interpreter.jump(env.interpreter.labels.get(args[1]));
                if(isRunning)env.interpreter.run()
            });
    }
}