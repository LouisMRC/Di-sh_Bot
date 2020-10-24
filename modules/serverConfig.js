module.exports = class ServerConfig
{
    constructor(prefix, language, autoNOPING)
    {
        this.m_Prefix = prefix;
        this.m_Language = language;
        this.m_AutoNOPING = autoNOPING;
    }
    getPrefix()
    {
        return this.m_Prefix;
    }
    getLanguage()
    {
        return this.m_Language;
    }
    isAutoNOPING()
    {
        return this.m_AutoNOPING;
    }
    setPrefix(newPrefix)
    {
        this.m_Prefix = newPrefix;
    }
    setLanguage(newLanguage)
    {
        this.m_Language = newLanguage;
    }
    setAutoNOPING(newAutoNOPING)
    {
        this.m_AutoNOPING = newAutoNOPING;
    }

}