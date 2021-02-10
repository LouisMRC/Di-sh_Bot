const ExecEnv = require("./execEnv");

class OutputManager
{
    constructor(defaultOutput)
    {
        this.m_OutputTargets = [defaultOutput];
    }
    async send(outputContent, env, outputID = 0)//send the ouput to the selected ouput buffer(outputID, -1:all)
    {
        if(outputID === -1)
        {
            for(let target of this.m_OutputTargets)
                await target.send(outputContent, env);
        }
        else await this.m_OutputTargets[outputID].send(outputContent, env);
    }
    async display(env, outputID = 0)
    {
        if(outputID === -1)for(let i = 0; i < this.m_OutputTargets.length; i++)await this.m_OutputTargets[i].display(env);
        else await this.m_OutputTargets[outputID].display(env);
    }

    add(newOutputTarget)
    {
        this.m_OutputTargets.push(newOutputTarget);
    }
    remove(id)
    {
        this.m_OutputTargets.splice(id, 1);
    }
}


class BasicOutput
{
    constructor(ouputTarget, direct = true)
    {
        this.m_Target = ouputTarget;
        this.m_IsDirectOutput = direct;
        this.m_OutputBuffer = [];
    }
}

class ChannelOutput extends BasicOutput
{
    constructor(ouputTarget, direct = true)
    {
        super(ouputTarget, direct);
    }
    async send(outputContent, env)
    {
        this.m_OutputBuffer.unshift(outputContent);
        if(this.m_IsDirectOutput)await this.display(env);
    }
    /**
     * 
     * @param {ExecEnv} env 
     */
    async display(env)
    {
        let channel = (this.m_Target === null ? env.channel : this.m_Target);
        for(let i = 0; i < this.m_OutputBuffer.length; i++)await channel.send(this.m_OutputBuffer.pop());
    }
}
class ConsoleOutput extends BasicOutput
{
    constructor(ouputTarget, direct = true)
    {
        super(ouputTarget, direct);
    }
    send(outputContent, env)
    {

    }
    async display(env)
    {

    }
}
class FileOutput extends BasicOutput
{
    constructor(ouputTarget, direct = true)
    {
        super(ouputTarget, direct);
    }
    send(outputContent, env)
    {

    }
    async display(env)
    {

    }
}

module.exports = {
    OutputManager,

    ChannelOutput,
    ConsoleOutput,
    FileOutput
}
