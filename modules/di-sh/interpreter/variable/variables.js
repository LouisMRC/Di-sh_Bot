
class Variable
{
    /**
     * 
     * @param {string} newName 
     * @param {*} newValue 
     */
    constructor(newName, newValue)
    {
        this.m_Name = newName;
        this.m_Value = newValue;
        this.m_Type = typeof newValue;
    }
    get name()
    {
        return this.m_Name;
    }
    get value()
    {
        return this.m_Value;
    }
    get type()
    {
        return this.m_Type;
    }

    set value(newValue)
    {
        if(this.m_Value === null)this.m_Type = typeof newValue;
        this.m_Value = newValue;
    }

}

module.exports = {
    Variable
}