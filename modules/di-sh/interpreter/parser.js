const { isMention } = require("../../mention");



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
                    for(let element of obj)strVal += (((strVal.length !== 0 && withSpace) ? " " : "") + Token.toString(element));
                    return strVal;
                case "Token":
                    return Token.toString(obj.value);
                    break;
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
    
}
const Types = {
    PLUS: 0,
    PLUS_PLUS: 1,
    PLUS_EQUAL: 2,

    MINUS: 10,
    MINUS_MINUS: 11,
    MINUS_EQUAL: 12,

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

    QUOTE: 50,
    DOUBLE_QUOTE: 51,

    LEFT_PARENTHESIS: 52,
    RIGHT_PARENTHESIS: 53,

    LEFT_BRACKET: 54,
    RIGHT_BRACKET: 55,

    LEFT_CURLY: 56,
    RIGHT_CURLY: 57,

    IDENTIFIER: 60,
    NUMBER: 61,
    STRING: 62,

    EXPR: 65,

    SPACE: 70,

    EOL: 72,

    UNEXPECTED: 75

}

const OperatorPrecedence = {
    EQUAL: 0,
    COMPARE: 1,
    LOGIC: 2,
    ADD_SUB: 3,
    MULTI_DIVID_MOD: 4,
    INC_DEC: 5,
    LOGIC_NOT: 6
}

/**
 * 
 * @param {Array<string>} script 
 */
function tokenize(script)
{
    let tokenizedScript = [];
    for(let i = 0; i < script.length; i++)//tokenize line by line
    {
        const line = script[i];
        let tokenizedLine = [];
        for(let j = 0; j < line.length; j++)
        {
            const c = line[j];
            switch(c)
            {
                case "+":
                    tokenizedLine.push(new Token(Types.PLUS, i, j, c));
                    break;
                case "-":
                    tokenizedLine.push(new Token(Types.MINUS, i, j, c));
                    break;
                case "*":
                    tokenizedLine.push(new Token(Types.ASTERISK, i, j, c));
                    break;
                case "/":
                    tokenizedLine.push(new Token(Types.SLASH, i, j, c));
                    break;
                case "%":
                    tokenizedLine.push(new Token(Types.PERCENT, i, j, c));
                    break;
                case "=":
                    tokenizedLine.push(new Token(Types.EQUAL, i, j, c));
                    break;
                case ">":
                    tokenizedLine.push(new Token(Types.SUPERIOR, i, j, c));
                    break;
                case "<":
                    tokenizedLine.push(new Token(Types.INFERIOR, i, j, c));
                    break;
                case "&":
                    tokenizedLine.push(new Token(Types.AND, i, j, c));
                    break;
                case "|":
                    tokenizedLine.push(new Token(Types.OR, i, j, c));
                    break;
                case "!":
                    tokenizedLine.push(new Token(Types.NOT, i, j, c));
                    break;
                case "'":
                    tokenizedLine.push(new Token(Types.QUOTE, i, j, c));
                    break;
                case '"':
                    tokenizedLine.push(new Token(Types.DOUBLE_QUOTE, i, j, c));
                    break;
                case "(":
                    tokenizedLine.push(new Token(Types.LEFT_PARENTHESIS, i, j, c));
                    break;
                case ")":
                    tokenizedLine.push(new Token(Types.RIGHT_PARENTHESIS, i, j, c));
                    break;
                case "[":
                    tokenizedLine.push(new Token(Types.LEFT_BRACKET, i, j, c));
                    break;
                case "]":
                    tokenizedLine.push(new Token(Types.RIGHT_BRACKET, i, j, c));
                    break;
                case "{":
                    tokenizedLine.push(new Token(Types.LEFT_CURLY, i, j, c));
                    break;
                case "}":
                    tokenizedLine.push(new Token(Types.RIGHT_CURLY, i, j, c));
                    break;
                case " ":
                    tokenizedLine.push(new Token(Types.SPACE, i, j, c));
                    break;
                default:
                    if(isDigit(c))
                    {
                        let tokenValue = c;
                        while(j+1 < line.length && isDigit(line[j+1]))
                        {
                            j++;
                            tokenValue += line[j];
                        }
                        tokenizedLine.push(new Token(Types.NUMBER, i, j, tokenValue));
                    }
                    else if(isIdentifierChar(c))
                    {
                        let tokenValue = c;
                        let k = j;
                        while(k+1 < line.length && (isIdentifierChar(line[k+1]) || isDigit(line[k+1])))
                        {
                            k++;
                            tokenValue += line[k];
                        }
                        tokenizedLine.push(new Token(Types.IDENTIFIER, i, j, tokenValue));
                        j = k;
                    }
                    else tokenizedLine.push(new Token(Types.UNEXPECTED, i, j, c));
                    break;
            }
        }
        tokenizedLine.push(new Token(Types.EOL, i, line.length+1, "EOL"));
        tokenizedScript.push(tokenizedLine);
    }
    return tokenizedScript;
}

/**
 * 
 * @param {Array<Array<Token>>} script 
 */
function parse(script)
{
    let parsedScript = searchMention(script);
    parsedScript = searchString(parsedScript);
    parsedScript = searchExpr(parsedScript);
    // for(let i = 0; i < parsedScript.length; i++)parsedScript [i] = removeTokensByType(parsedScript[i], Types.SPACE);
    return parsedScript;
}

/**
 * 
 * @param {Array<Token>} tokens 
 * @param {number} tokenType 
 */
function removeTokensByType(tokens, tokenType)
{
    let output = []
    for(let token of tokens)if(token.type !== tokenType)output.push(token);
    return output;
}

/**
 * 
 * @param {Array<Array<Token>>} script 
 */
function searchMention(script)
{
    let updatedScript = [];
    for(let i = 0; i < script.length; i++)
    {
        let updatedLine = [];
        for(let j = 0; j < script[i].length; j++)
        {
            if(script[i][j].type === Types.INFERIOR)
            {
                let newMention = [script[i][j]];
                while(![Types.SUPERIOR, Types.EOL].includes(script[i][j].type))
                {
                    newMention.push(script[i][++j]);
                }
                console.log(Token.toString(newMention, false));
                if(isMention(Token.toString(newMention, false)))updatedLine.push(new Token(Types.STRING, newMention[0].line, newMention[0].pos, Token.toString(newMention, false)));
                else updatedLine.concat(newMention);
            }
            else updatedLine.push(script[i][j]);
        }
        updatedScript.push(updatedLine);
    }
    return updatedScript;
}

/**
 * 
 * @param {Array<Array<Token>>} script 
 */
function searchExpr(script)
{
    let updatedScript = [];
    for(let i = 0; i < script.length; i++)
    {
        let line = script[i];
        let updatedLine = [];
        for(let j = 0; j < line.length; j++)
        {
            const token = line[j];
            if([Types.STRING, Types.NUMBER, Types.IDENTIFIER].includes(token.type))
            {
                let expr = [token];
                let k = j + 1;
                while(([Types.STRING, Types.NUMBER, Types.IDENTIFIER, Types.LEFT_PARENTHESIS, Types.RIGHT_PARENTHESIS].includes(line[k].type) || isOperatorToken(line[k])) && line[k] !== Types.EOL)
                    expr.push(line[k++]);
                
                if(expr.length > 1)
                {
                    if(checkExpr(expr))updatedLine.push(new Token(Types.EXPR, i, j, shuntingYard(expr)));
                    else updatedLine.push(new Token(Types.UNEXPECTED, i, j, expr));
                    j = k-1;
                }
                else updatedLine.push(token);
            }
            else if(token.type === Types.LEFT_PARENTHESIS)
            {
                let expr = [token];
                let k = j + 1;
                let parentheses = 1;
                while(line[k].type !== Types.EOL && parentheses > 0)
                {
                    if(line[k].type === Types.LEFT_PARENTHESIS)parentheses++;
                    else if(line[k].type === Types.RIGHT_PARENTHESIS)parentheses--;
                    expr.push(line[k++]);
                }
                
                if(expr.length === 1)
                {
                    j = k-1;
                    updatedLine.push(new Token(Types.UNEXPECTED, i, j, token.value));
                }
                else
                {
                    expr = removeTokensByType(expr, Types.SPACE);
                    if(checkExpr(expr))
                    {
                        expr = shuntingYard(expr);
                        if(expr.length-1)updatedLine.push(new Token(Types.EXPR, i, j, expr));
                        else updatedLine.push(new Token(expr[0].type, i, j, expr[0].value));
                    }
                    else updatedLine.push(new Token(Types.UNEXPECTED, i, j, expr));
                    j = k-1;
                }
            }
            else updatedLine.push(token);
        }
        updatedScript.push(updatedLine);
    }
    return updatedScript;
}

/**
 * 
 * @param {Array<Token>} expr 
 */
function shuntingYard(expr)
{
    let output = [];
    let operationStack = [];
    for(let i = 0; i < expr.length; i++)
    {
        const token = expr[i];
        if([Types.NUMBER, Types.STRING, Types.IDENTIFIER].includes(token.type))output.push(token);
        else if(isOperatorToken(token))
        {
            while(operationStack.length > 0 && matchPrecedence(operationStack[operationStack.length-1].type) >= matchPrecedence(token.type))
                output.push(operationStack.pop());

            operationStack.push(token);
        }
        else if(token.type === Types.LEFT_PARENTHESIS)operationStack.push(token);
        else if(token.type === Types.RIGHT_PARENTHESIS)
        {
            while(operationStack.length > 0 && operationStack[operationStack.length-1].type !== Types.LEFT_PARENTHESIS)
                output.push(operationStack.pop());
            if(operationStack[operationStack.length-1].type === Types.LEFT_PARENTHESIS)operationStack.pop();
        }
    }
    while(operationStack.length > 0)output.push(operationStack.pop());
    return output;
}

/**
 * 
 * @param {Array<Token>} expr 
 */
function checkExpr(expr)
{
    let parentheses = 0;
    for(let i = 0; i < expr.length; i++)
    {
        let token = expr[i];
        if(isBinaryOperator(token))
        {
            if(i === 0 || i === expr.length-1 || (!isValueToken(expr[i-1]) && expr[i-1].type  !== Types.RIGHT_PARENTHESIS) || (!isValueToken(expr[i+1]) && expr[i+1].type !== Types.LEFT_PARENTHESIS && expr[i+1].type  !== Types.NOT))
                return false;
        }
        else if(isValueToken(token))
        {
            if((i > 0 && (isValueToken(expr[i-1]) || expr[i-1].type === Types.RIGHT_PARENTHESIS)) || (i < expr.length-1 && (isValueToken(expr[i+1]) || expr[i+1].type === Types.LEFT_PARENTHESIS)))
                return false;
        }
        else if(token.type === Types.LEFT_PARENTHESIS)
        {
            if(i === expr.length-1 || expr[i+1].type === Types.RIGHT_PARENTHESIS)return false;
            parentheses++;
        }
        else if(token.type === Types.RIGHT_PARENTHESIS)parentheses--;
        else return false;
    }
    if(parentheses === 0)return true;
    else return false;
}

/**
 * 
 * @param {Array<Array<Token>>} script 
 */
function searchTwoCharOperators(script)
{
    let updatedScript = [];
    for(let line of script)
    {
        let updatedLine = [];
        for(let i = 0; i < line.length; i++)
        {
            let token = line[i];
            switch(token.type)
            {
                case Types.PLUS:
                    switch(line[i+1].type)
                    {
                        case Types.PLUS:
                            updatedLine.push(new Token(Types.PLUS_PLUS, token.line, token.pos, "++"));
                            i++;
                            break;
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.PLUS_EQUAL, token.line, token.pos, "+="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.MINUS:
                    switch(line[i+1].type)
                    {
                        case Types.MINUS:
                            updatedLine.push(new Token(Types.MINUS_MINUS, token.line, token.pos, "--"));
                            i++;
                            break;
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.MINUS_EQUAL, token.line, token.pos, "-="));
                            i++;
                            break;
                        case Types.NUMBER:
                            updatedLine.push(new Token(Types.NUMBER, token.line, token.pos, "-" + line[i+1].value));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.ASTERISK:
                    switch(line[i+1].type)
                    {
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.ASTERISK_EQUAL, token.line, token.pos, "*="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.SLASH:
                    switch(line[i+1].type)
                    {
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.SLASH_EQUAL, token.line, token.pos, "/="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.PERCENT:
                    switch(line[i+1].type)
                    {
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.PERCENT_EQUAL, token.line, token.pos, "%="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.EQUAL:
                    switch(line[i+1].type)
                    {
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.EQUAL_EQUAL, token.line, token.pos, "=="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.SUPERIOR:
                    switch(line[i+1].type)
                    {
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.SUPERIOR_EQUAL, token.line, token.pos, ">="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.INFERIOR:
                    switch(line[i+1].type)
                    {
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.INFERIOR_EQUAL, token.line, token.pos, "<="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                        
                    }
                    break;
                case Types.AND:
                    switch(line[i+1].type)
                    {
                        case Types.AND:
                            updatedLine.push(new Token(Types.DOUBLE_AND, token.line, token.pos, "&&"));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                    }
                    break;
                case Types.OR:
                    switch(line[i+1].type)
                    {
                        case Types.OR:
                            updatedLine.push(new Token(Types.EQUAL_EQUAL, token.line, token.pos, "||"));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                    }
                    break;
                case Types.NOT:
                    switch(line[i+1].type)
                    {
                        case Types.EQUAL:
                            updatedLine.push(new Token(Types.NOT_EQUAL, token.line, token.pos, "!="));
                            i++;
                            break;
                        default:
                            updatedLine.push(token);
                            break;
                    }
                    break;
                default:
                    updatedLine.push(token);
                    break;
            }
        }
        updatedScript.push(updatedLine);
    }
    return updatedScript;
}

/**
 * 
 * @param {Array<Array<Token>>} script 
 */
function searchString(script)
{
    let updatedScript = [];
    for(let line of script)
    {
        let updatedLine = [];
        for(let i = 0; i < line.length; i++)
        {
            let token = line[i];
            if([Types.QUOTE, Types.DOUBLE_QUOTE].includes(token.type))
            {
                let j = i;
                let stringContent = "";
                while(line[j+1].type !== Types.EOL && line[j+1].type !== token.type)
                {
                    stringContent += line[++j].value;
                }
                if(line[j+1].type === token.type)
                {
                    updatedLine.push(new Token(Types.STRING, token.line, token.pos, stringContent));
                    i = j+1;
                }
                else updatedLine.push(new Token(Types.UNEXPECTED, token.line, token.pos, token.value));
            }
            else updatedLine.push(token);
        }
        updatedScript.push(updatedLine);
    }
    return updatedScript;
}

/**
 * 
 * @param {Token} operator 
 */
function matchPrecedence(operator)
{
    switch(operator)
    {
        case Types.EQUAL:
        case Types.PLUS_EQUAL:
        case Types.MINUS_EQUAL:
        case Types.ASTERISK_EQUAL:
        case Types.SLASH_EQUAL:
        case Types.PERCENT_EQUAL:
            return OperatorPrecedence.EQUAL;

        case Types.EQUAL_EQUAL:
        case Types.NOT_EQUAL:
        case Types.SUPERIOR:
        case Types.SUPERIOR_EQUAL:
        case Types.INFERIOR:
        case Types.INFERIOR_EQUAL:
            return OperatorPrecedence.COMPARE;
    
        case Types.AND:
        case Types.DOUBLE_AND:
        case Types.OR:
        case Types.DOUBLE_OR:
            return OperatorPrecedence.LOGIC;

        case Types.PLUS:
        case Types.MINUS:
            return OperatorPrecedence.ADD_SUB;

        case Types.ASTERISK:
        case Types.SLASH:
        case Types.PERCENT:
            return OperatorPrecedence.MULTI_DIVID_MOD;

        case Types.PLUS_PLUS:
        case Types.MINUS_MINUS:
            return OperatorPrecedence.INC_DEC;

        case Types.NOT:
            return OperatorPrecedence.LOGIC_NOT;
    }
}


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
        Types.MINUS_MINUS,
        Types.NOT
    ].includes(token.type);
}

/**
 * 
 * @param {string} c 
 */
function isDigit(c)
{
    const ascii = c.charCodeAt(0);
    return 47 < ascii && ascii < 58;
}

/**
 * 
 * @param {string} c 
 */
function isLetter(c)
{
    const ascii = c.charCodeAt(0);
    return (64 < ascii && ascii < 91) || (96 < ascii && ascii < 123);
}

/**
 * 
 * @param {string} c 
 */
function isIdentifierChar(c)
{
    const ascii = c.charCodeAt(0);
    return isLetter(c) || ascii === 95 || ascii === 45;
}

module.exports = {
    Token,
    Types,
    tokenize,
    parse,
    searchExpr,
    removeTokensByType,
    checkExpr,
    shuntingYard
}