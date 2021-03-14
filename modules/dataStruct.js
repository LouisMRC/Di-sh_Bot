class Pair
{
    constructor(key, value)
    {
        this.key = key;
        this.value = value;
    }
}

class Pages
{
    constructor(pageSize)
    {
        this.m_PageSize = pageSize;
        this.m_Pages = [];
        this.m_Pages.push([]);
    }
    push(item)
    {
        if(this.m_Pages[this.m_Pages.length-1].length >= this.m_PageSize)this.m_Pages.push([]);
        this.m_Pages[this.m_Pages.length-1].push(item);
    }
    pop()
    {
        if(!this.m_Pages[this.m_Pages.length-1].length)this.m_Pages.pop();
        return this.m_Pages[this.m_Pages.length-1].pop();
    }
    getPage(pageNumber)
    {
        return this.m_Pages[pageNumber];
    }
    get length()
    {
        if(!this.m_Pages[this.m_Pages.length-1].length)return this.m_Pages.length-1;
        return this.m_Pages.length;
    }
    get lastPage()
    {
        if(this.m_Pages[this.m_Pages.length-1].length || this.m_Pages.length === 1)return this.m_Pages[this.m_Pages.length-1];
        return this.m_Pages[this.m_Pages.length-2];
    }
}

module.exports = {
    Pair,
    Pages
}