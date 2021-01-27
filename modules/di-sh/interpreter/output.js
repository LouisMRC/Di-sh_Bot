
class OutputHandler
{
    constructor(outputs)
    {
        this.m_OutputBuffer = [];
    }
}


class ChannelOutput
{
    constructor(ouputTarget = null)
    {
        this.m_Target = ouputTarget;
        
    }
    send(output)
    {
        this.m_OutputBuffer.unshift(output);
    }
    /**
     * 
     * @param {execEnv} env 
     */
    async display(env)
    {
        for(let i = 0; i < this.m_OutputBuffer.length; i++)await env.channel.send(this.m_OutputBuffer.pop());
    }
}
class ConsoleOutput
{
    constructor(ouputTarget)
    {
        this.m_Target = ouputTarget;
    }
    send(output)
    {

    }
    async display(env)
    {

    }
}
class FileOutput
{
    constructor(ouputTarget)
    {
        this.m_Target = ouputTarget;
    }
    send(output)
    {

    }
    async display(env)
    {

    }
}

module.exports = {
    OutputHandler,

    ChannelOutput,
    ConsoleOutput,
    FileOutput
}
