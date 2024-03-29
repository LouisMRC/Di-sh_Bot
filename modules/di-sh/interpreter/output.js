const { Message, MessageAttachment } = require("discord.js");
const ExecEnv = require("./execEnv");
const fs = require("fs");

const BOT_FS = process.cwd() + "/botFs";
const DOWNLOAD = BOT_FS + "/download";
const UPLOAD = BOT_FS + "/upload";

class OutputManager
{
    constructor(defaultOutput)
    {
        this.m_OutputTargets = new Map();
        this.m_OutputTargets.set(0, defaultOutput);//Target0 -> default output
        this.m_NextOutputID = 1;
    }
    async send(outputContent, env, outputID = 0)//send the ouput to the selected ouput buffer(outputID, -1:all)
    {
        let outputs = new Map();
        if(outputID === -1)
        {
            for(let target of this.m_OutputTargets)
                outputs.set(target[0], await target[1].send(outputContent, env));
        }
        else outputs.set(outputID, await this.m_OutputTargets.get(outputID).send(outputContent, env));
        return outputs;
    }
    async display(env, outputID = 0)
    {
        let outputs = new Map();
        if(outputID === -1)for(let target of this.m_OutputTargets)outputs.set(target[0], await target[1].display(env));
        else outputs.set(outputID, await this.m_OutputTargets.get(outputID).display(env));
        return outputs;
    }

    add(newOutputTarget)
    {
        this.m_OutputTargets.set(this.m_NextOutputID++, newOutputTarget);
    }
    remove(id)
    {
        this.m_OutputTargets.delete(id);
    }
    setDefault(targetID)
    {
        this.m_OutputTargets.set(0, this.m_OutputTargets.get(targetID));
        this.m_OutputTargets.delete(targetID);
    }
    get outputTargets()
    {
        return this.m_OutputTargets;
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
    get target()
    {
        return this.m_Target;
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
    get target()
    {
        return this.m_Target;
    }
}
class FileOutput extends BasicOutput
{
    constructor(ouputTarget, direct=false, fileName=null)
    {
        super(ouputTarget, direct);
        this.m_FileName = fileName;
    }
    /**
     * 
     * @param {*} outputContent 
     * @param {ExecEnv} env 
     */
    async send(outputContent, env)
    {
        this.m_OutputBuffer.push(outputContent);
        if(this.m_IsDirectOutput)return await this.display(env);
        return null;
    }
    /**
     * 
     * @param {ExecEnv} env 
     */
    async display(env)
    {
        const filePath = `${UPLOAD}/${this.m_FileName === null ? env.server.name + "_output.txt" : `${env.server.name}_${this.m_FileName}`}`;//todo: file name
        if(!fs.existsSync(UPLOAD))fs.mkdirSync(UPLOAD, {recursive: true});
        let channel = (this.m_Target === null ? env.channel : this.m_Target);
        for(let line of this.m_OutputBuffer)fs.writeFileSync(filePath, line+"\n", {flag: "as"});
        return [await channel.send(new MessageAttachment(filePath)).then(() => fs.rmSync(filePath))];
    }
    get target()
    {
        return this.m_Target;
    }
}

module.exports = {
    OutputManager,

    ChannelOutput,
    ConsoleOutput,
    FileOutput
}


