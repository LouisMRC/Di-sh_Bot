

const Types = {
    PLUS: 0,
    PLUS_PLUS: 1,
    PLUS_EQUAL: 2,
    PRE_INCREMENT: 3,
    POST_INCREMENT: 4,

    MINUS: 10,
    MINUS_MINUS: 11,
    MINUS_EQUAL: 12,
    PRE_DECREMENT: 13,
    POST_DECREMENT: 14,

    CAST_NUM: 15,
    CAST_STR: 16,
    CAST_OBJ: 17,
    CAST_BOOL: 18,

    ASTERISK: 20,
    ASTERISK_EQUAL: 21,

    SLASH: 22,
    SLASH_EQUAL: 23,

    PERCENT: 24,
    PERCENT_EQUAL: 25,
    
    EQUAL: 30,
    EQUAL_EQUAL: 31,
    NOT_EQUAL: 32,

    SUPERIOR: 33,
    SUPERIOR_EQUAL: 34,

    INFERIOR: 35,
    INFERIOR_EQUAL: 36,

    AT: 37,

    AND: 40,
    DOUBLE_AND: 41,
    OR: 42,
    DOUBLE_OR: 43,
    NOT: 44,

    LEFT_PARENTHESIS: 52,
    RIGHT_PARENTHESIS: 53,

    LEFT_BRACKET: 54,
    RIGHT_BRACKET: 55,

    LEFT_CURLY: 56,
    RIGHT_CURLY: 57,

    IDENTIFIER: 60,
    NUMBER: 62,
    STRING: 63,

    EOL: 72,

    UNEXPECTED: 75

}


class Token
{
    constructor(type, line, pos, value)
    {
        this.m_Type = type;
        this.m_Line = line;
        this.m_Pos = pos;
        this.m_Value = value;
    }
    /**
     * 
     * @param {Token | Array<Token | string>} obj 
     * @returns {string}
     */
    static toString(obj, withSpace = true)
    {
        if((typeof obj) === "object")
        {
            switch(obj.constructor.name)
            {
                case "Array":
                    let strVal = "";
                    for(let element of obj)strVal += (((strVal.length !== 0 && withSpace) ? " " : "") + Token.toString(element, false));
                    return strVal;
                case "Token":
                    return Token.toString(obj.value, false);
            }
        }
        else return obj;
    }
    get type()
    {
        return this.m_Type;
    }
    get line()
    {
        return this.m_Line;
    }
    get pos()
    {
        return this.m_Pos;
    }
    get value()
    {
        return this.m_Value;
    }
    set type(newType)
    {
        this.m_Type = newType;
    }
}

class exprToken
{
    constructor(newType, newValue = null)
    {
        this.m_Type = newType;
        this.m_Value = newValue;
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


// const Operators = {
//     ADD: "ADD",
//     SUBSTRACT: "SUBSTRACT",
//     MULTIPLY: "MULTIPLY",
//     DIVIDE: "DIVIDE",
//     MODULO: "MODULO",
    
//     ASSIGNMENT: "ASSIGNMENT",
//     ASSIGN_ADD: "ASSIGN_ADD",
//     ASSIGN_SUBSTRACT: "ASSIGN_SUBSTRACT",
//     ASSIGN_MULTIPLY: "ASSIGN_MULTIPLY",
//     ASSIGN_DIVIDE: "ASSIGN_DIVIDE",

//     PREINCERMENT: "PREINCERMENT",
//     POSTINCERMENT: "POSTINCERMENT",
//     PREDECREMENT: "PREDECREMENT",
//     POSTDECREMENT: "POSTDECREMENT",
    
//     EQUAL: "EQUAL",
//     NOT_EQUAL: "NOT_EQUAL",
//     SUPERIOR: "SUPERIOR",
//     INFERIOR: "INFERIOR",
//     SUPERIOR_EQUAL: "SUPERIOR_EQUAL",
//     INFERIOR_EQUAL: "INFERIOR_EQUAL",

//     AND: "AND",
//     OR: "OR",
//     DOUBLE_AND: "DOUBLE_AND",
//     DOUBLE_OR: "DOUBLE_OR",
//     NOT: "NOT",

//     CAST_BOOL: "CAST_BOOL",
//     CAST_NUM: "CAST_NUM",
//     CAST_OBJ: "CAST_OBJ",
//     CAST_STR: "CAST_STR"
// }

// const Operandes = {
//     NUMBER: "number",
//     STRING: "string",
//     BOOL: "boolean",
//     OBJECT: "object",
//     VARIABLE: "VARIABLE",
//     FUNCTION: "FUNCTION"
// }

/**
 * 
 * @param {Token} token 
 */
 function isValueToken(token)
 {
     return [Types.IDENTIFIER, Types.NUMBER, Types.STRING].includes(token.type);
 }
 
 /**
  * 
  * @param {Token} token 
  */
 function isOperatorToken(token)
 {
     return isBinaryOperator(token) || isUnaryOperator(token);
 }
 
 /**
  * 
  * @param {Token} token 
  */
 function isBinaryOperator(token)
 {
     return [
         Types.PLUS, Types.PLUS_EQUAL,
 
         Types.MINUS, Types.MINUS_EQUAL,
 
         Types.ASTERISK, Types.ASTERISK_EQUAL,
 
         Types.SLASH, Types.SLASH_EQUAL,
     
         Types.PERCENT, Types.PERCENT_EQUAL,
         
         Types.EQUAL, Types.EQUAL_EQUAL, Types.NOT_EQUAL,
     
         Types.SUPERIOR, Types.SUPERIOR_EQUAL,
     
         Types.INFERIOR, Types.INFERIOR_EQUAL,
     
         Types.AND, Types.DOUBLE_AND, Types.OR, Types.DOUBLE_OR
     ].includes(token.type);
 }
 
 /**
  * 
  * @param {Token} token 
  */
 function isUnaryOperator(token)
 {
     return [
         Types.PLUS_PLUS,
         Types.PRE_INCREMENT,
         Types.POST_INCREMENT,
         Types.MINUS_MINUS,
         Types.PRE_DECREMENT,
         Types.POST_DECREMENT,
         Types.NOT,
         Types.CAST_BOOL,
         Types.CAST_NUM,
         Types.CAST_OBJ,
         Types.CAST_STR
     ].includes(token.type);
 }
 
 /**
  * 
  * @param {Token} token 
  */
 function isCastOperator(token)
 {
     return [
         Types.CAST_BOOL,
         Types.CAST_NUM,
         Types.CAST_OBJ,
         Types.CAST_STR
     ].includes(token.type);
 }

module.exports = {
    Types,
    Token,
    isValueToken,
    isOperatorToken,
    isBinaryOperator,
    isUnaryOperator,
    isCastOperator
}