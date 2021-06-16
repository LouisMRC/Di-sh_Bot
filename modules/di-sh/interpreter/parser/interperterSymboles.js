const { calculateExpression } = require("../variable/operations");

const SymbolTypes = {
    IDENTIFIER: "IDENTIFIER",
    STRING: "STRING",
    NUMBER: "NUMBER",
    EXPRESSION: "EXPRESSION",
    IF_EPRESSION: "IF_EPRESSION"
}

class InterpreterSymbol
{
    constructor(newType, newValue = null)
    {
        this.m_Type = newType;
        this.m_Value = newValue;
    }
    calculate(env)
    {
        return this.m_Value;
    }
    get type()
    {
        return this.m_Type;
    }
    get value()
    {
        return this.m_Value;
    }
}

class Expression extends InterpreterSymbol
{
    constructor(newExpression)
    {
        super(SymbolTypes.EXPRESSION);
        this.m_Expression = newExpression;
    }

    calculate(env)
    {
        return new InterpreterSymbol(SymbolTypes.STRING, calculateExpression(env, this.m_Expression).value.toString());
    }

}
class If_Expression extends InterpreterSymbol
{
    constructor(conditionExpr, ifBlock, elseBlock = null)
    {
        super(SymbolTypes.IF_EPRESSION);
        this.m_Condition = conditionExpr;
        this.m_IfBlock = ifBlock;
        this.m_ElseBlock = elseBlock;
    }

    calculate(env)
    {
        return (calculateExpression(env, this.m_Expression).value ? this.m_IfBlock : this.m_ElseBlock);
    }

}

module.exports = {
    SymbolTypes,
    InterpreterSymbol,
    Expression,
    If_Expression
}