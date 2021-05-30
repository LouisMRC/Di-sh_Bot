const { getConfig } = require("./db");
const { spawnProcess } = require("../di-sh/interpreter/interpreter")

async function onStart(env)
{
    let script = (await getConfig(env, "auto_exec")).get("onStart");
    if(script.length > 0)spawnProcess(env, null, "startup_script", [script]);
}

async function onStop()
{
    
}

module.exports = {
    onStart,
    onStop
};