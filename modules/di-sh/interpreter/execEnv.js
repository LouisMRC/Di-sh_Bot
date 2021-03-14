const { Guild, TextChannel, User, Client } = require("discord.js");
const ServerConfig = require("../../system/serverConfig");
const { OutputManager, ChannelOutput } = require("./output");

module.exports = class ExecEnv
{
    /**
     * 
     * @param {Client} client 
     * @param {import("mariadb").PoolConnection} connection 
     * @param {Guild} server 
     * @param {ServerConfig} serverConfig 
     * @param serverLocale 
     * @param {TextChannel} channel
     * @param {User} user 
     * @param {string} context 
     */
    constructor(client, connection, server, serverConfig, serverLocale, channel, user, context, exeDepth)
    {
        this.m_Client = client;
        this.m_Connection = connection;
        this.m_Server = server;
        this.m_ServerConfig = serverConfig;
        this.m_ServerLocale = serverLocale;
        this.m_CurrentChannel = channel;
        this.m_User = user;
        this.m_Context = context;
        this.m_ProcessID = null;
        this.m_Pipe = null;
        this.m_Interpreter = null;
        this.m_OutputManager = new OutputManager(new ChannelOutput(null));
        this.m_ExeDepth = exeDepth;
    }
    copy()
    {
        return new ExecEnv(this.m_Client, this.m_Connection, this.m_Server, this.m_ServerConfig, this.m_ServerLocale, this.m_CurrentChannel, this.m_User, this.m_Context)
    }

    async send(content, targetID = 0)
    {
        return await this.m_OutputManager.send(content, this, targetID);
    }
    async display(targetID = -1)
    {
        return await this.m_OutputManager.display(this, targetID);
    }

    pipeOutput(value)
    {
        this.m_Pipe = value;
    }

    get client()
    {
        return this.m_Client;
    }
    get connection()
    {
        return this.m_Connection;
    }
    get server()
    {
        return this.m_Server;
    }
    get serverConfig()
    {
        return this.m_ServerConfig;
    }
    get serverLocale()
    {
        return this.m_ServerLocale;
    }
    get channel()
    {
        return this.m_CurrentChannel;
    }
    get user()
    {
        return this.m_User;
    }
    get context()
    {
        return this.m_Context;
    }
    get processID()
    {
        return this.m_ProcessID;
    }
    get pipe()
    {
        return this.m_Pipe;
    }
    get interpreter()
    {
        return this.m_Interpreter;
    }
    get outputManager()
    {
        return this.m_OutputManager;
    }
    get exeDepth()
    {
        return this.m_ExeDepth;
    }



    set server(server)
    {
        this.m_Server = server;
    }
    set serverConfig(serverConfig)
    {
        this.m_ServerConfig = serverConfig;
    }
    set serverLocale(serverLocale)
    {
        this.m_ServerLocale = serverLocale;
    }
    set channel(channel)
    {
        this.m_CurrentChannel = channel;
    }
    set user(user)
    {
        this.m_User = user;
    }
    set context(context)
    {
        this.m_Context = context;
    }
    set processID(processID)
    {
        this.m_ProcessID = processID;
    }
    set interpreter(interpreter)
    {
        this.m_Interpreter = interpreter;
    }
    set exeDepth(exeDepth)
    {
        this.m_ExeDepth = exeDepth;
    }
}