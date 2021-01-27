

/**
 * 
 * @param {execEnv} env 
 * @param {string} msg 
 */
function text(env, msg, idleTimeout, allowRetry = false)
{
    return new Promise((resolve, reject) => {
        const filter = message => message.author === env.user && !startWithPrefix(env.serverConfig.getPrefix(), message.content);
        env.channel.send(msg)
            .then(async instructMsg => {
                const collector = env.channel.createMessageCollector(filter, {max: 1, time: idleTimeout});
                collector.on("end", async(message, reason) => {
                    instructMsg.delete();
                    if(reason === "limit")
                    {
                        const answer = message.array()[0].content;
                        message.delete();
                        resolve(answer);
                    }
                    if(reason === "time")
                    {
                        if(allowRetry)
                        {
                            if(promptYesNo(env, "hardcoded", 30_000))
                            {
                                textInput(env, msg, idleTimeout, false)
                                .then(answer => resolve(answer))
                                .catch(() => reject("time"));
                            }
                            else reject("abort");
                        }
                        else reject(reason);
                    }
                    else reject(reason);
                });
            });
        
    })
}

/**
 * 
 * @param {execEnv} env
 * @param {string} text 
 * @param {number} timeout 
 * @param {string} defaultAnswer 
 */
async function yesNo(env, text, timeout, defaultAnswer="no")
{
    env.channel.send(text + (defaultAnswer === "yes" ? " [Y/n]" : " [y/N]"));
    const answer = new Promise((resolve, reject) => {
        const filter = msg => msg.author.id === env.user.id && ["y", "yes", "n", "no"].includes(msg.content.toLowerCase());
        const collector = env.channel.createMessageCollector(filter, {max: 1, time: timeout});

        collector.on("end", async (collected, reason) => {
            if(reason === "limit")resolve(collected.array()[0].content.toLowerCase());
            else resolve(defaultAnswer);
        });
    });

    switch(await answer)
    {
        case "y":
        case "yes":
            return true;
        case "n":
        case "no":
            return false;
    }
}