const fs = require('fs');
const path = require("path");


module.exports = class HelpPageManager
{
    constructor()
    {
        this.m_pages = new Map();
        this.load();
    }
    load()
    {
        for(const file of fs.readdirSync("./help_pages").filter(file => file.endsWith('.json'))) 
        {
            for(let version of require(`../help_pages/${file}`))
            {
                if(!this.m_pages.has(version.lang))this.m_pages.set(version.lang, new Map());
                this.m_pages.get(version.lang).set(path.basename(file, ".json"), version.content);
            }
        }
    }
    get(lang, page)
    {
        return this.m_pages.get(lang).has(page) ? this.m_pages.get(lang).get(page) : this.m_pages.get("en").get(page);
    }
    has(pageName)
    {
        return this.m_pages.get("en").has(pageName);
    }
}