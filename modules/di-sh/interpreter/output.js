const { Message } = require("discord.js");
const ExecEnv = require("./execEnv");

class OutputManager
{
    constructor(defaultOutput)
    {
        this.m_OutputTargets = [defaultOutput];
    }
    async send(outputContent, env, outputID = 0)//send the ouput to the selected ouput buffer(outputID, -1:all)
    {
        let outputs = new Map();
        if(outputID === -1)
        {
            for(let i = 0; i < this.m_OutputTargets.length; i++)
                outputs.set(i, await target.send(outputContent, env));
        }
        else outputs.set(outputID, await this.m_OutputTargets[outputID].send(outputContent, env));
        return outputs;
    }
    async display(env, outputID = 0)
    {
        let outputs = new Map();
        if(outputID === -1)for(let i = 0; i < this.m_OutputTargets.length; i++)outputs.set(i, await this.m_OutputTargets[i].display(env));
        else outputs.set(outputID, await this.m_OutputTargets[outputID].display(env));
        return outputs;
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
    /**
     * 
     * @param {ExecEnv} env 
     * 
     * @returns {Array<Message>}
     */
    async send(outputContent, env)
    {
        this.m_OutputBuffer.unshift(outputContent);
        if(this.m_IsDirectOutput)return await this.display(env);
        return null;
    }
    /**
     * 
     * @param {ExecEnv} env 
     * 
     * @returns {Array<Message>}
     */
    async display(env)
    {
        let messages = [];//to store all displayed outputs
        let channel = (this.m_Target === null ? env.channel : this.m_Target);
        for(let i = 0; i < this.m_OutputBuffer.length; i++)messages.push(await channel.send(this.m_OutputBuffer.pop()));
        return messages;
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


