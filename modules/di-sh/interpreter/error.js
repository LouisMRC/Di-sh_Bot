class BasicError
{
    constructor(err, errMessage, errType, errFatal=false)
    {
        this.m_Error = err;
        this.m_Message = errMessage;
        this.m_Fatal = errFatal;
        this.m_Type = errType;
    }
    print()
    {
        return `${this.m_Fatal ? "Fatal " : ""}Error: ${this.m_Type}:${this.m_Error}\n${this.m_Message}`;
    }
    get error()
    {
        return this.m_Error;
    }
    get message()
    {
        return this.m_Message;
    }
    get fatal()
    {
        return this.m_Fatal;
    }
    get type()
    {
        return this.m_Type;
    }
}

class LexicalError extends BasicError
{
    constructor(err, errMessage)
    {
        super(err, errMessage, "LexicalError", true);
    }

}

class SyntacticalError extends BasicError
{
    constructor(err, errMessage)
    {
        super(err, errMessage, "SyntacticalError", true);
    }
    
}

class RuntimeError extends BasicError
{
    constructor(err, errMessage, errFatal=false)
    {
        super(err, errMessage, "RuntimeError", errFatal);
    }
    
}

class EnvError extends BasicError
{
    constructor(err, errMessage, errFatal=false)
    {
        super(err, errMessage, "EnvError", errFatal);
    }
}

module.exports = {
    BasicError,
    LexicalError,
    SyntacticalError,
    RuntimeError,
    EnvError   
}