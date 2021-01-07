


class Token
{
    constructor(type, line, pos, value)
    {
        this.m_Type = type;
        this.m_Line = line;
        this.m_Pos = pos;
        this.m_Value = value;
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

    NEGATIVE: 13,

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

    MATH_EXPR: 65,

    SPACE: 70,

    UNEXPECTED: 75

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
            console.log(c);
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
                        while(j+1 < line.length && (isIdentifierChar(line[j+1]) || isDigit(line[j+1])))
                        {
                            j++;
                            tokenValue += line[j];
                        }
                        tokenizedLine.push(new Token(Types.IDENTIFIER, i, j, tokenValue));
                    }
                    else tokenizedLine.push(new Token(Types.UNEXPECTED, i, j, c));
                    break;
            }
        }
        tokenizedScript.push(tokenizedLine);
    }
    return tokenizedScript;
}

function parse(script)
{

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
    tokenize
}