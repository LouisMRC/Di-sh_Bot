const { throwErr, LexicalError } = require("../error");
const { Types, Token } = require("./token");

/**
 * 
 * @param {Array<string>} script 
 */
function tokenize(script, interpreter = null)//null: testing/debug
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
                    if(!(j+1 < line.length && "+=".includes(line[j+1])))tokenizedLine.push(new Token(Types.PLUS, i, j, c));
                    else if(line[j+1] === "+")
                    {
                        tokenizedLine.push(new Token(Types.PLUS_PLUS, i, j, c+"+"));
                        j++;
                    }
                    else if(line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.PLUS_EQUAL, i, j, c+"="));
                        j++;
                    }
                    break;
                case "-":
                    if(!(j+1 < line.length && "+=".includes(line[j+1])))tokenizedLine.push(new Token(Types.MINUS, i, j, c));
                    else if(line[j+1] === "-")
                    {
                        tokenizedLine.push(new Token(Types.MINUS_MINUS, i, j, c+"-"));
                        j++;
                    }
                    else if(line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.MINUS_EQUAL, i, j, c+"="));
                        j++;
                    }
                    break;
                case "*":
                    if(j+1 < line.length && line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.ASTERISK_EQUAL, i, j, c+"="));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.ASTERISK, i, j, c));
                    break;
                case "/":
                    if(j+1 < line.length && line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.SLASH_EQUAL, i, j, c+"="));
                        j++;
                    } 
                    else tokenizedLine.push(new Token(Types.SLASH, i, j, c));
                    break;
                case "%":
                    if(j+1 < line.length && line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.PERCENT_EQUAL, i, j, c+"="));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.PERCENT, i, j, c));
                    break;
                case "=":
                    if(j+1 < line.length && line[j+1] === "=") 
                    {
                        tokenizedLine.push(new Token(Types.EQUAL_EQUAL, i, j, c+"="));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.EQUAL, i, j, c));
                    break;
                case ">":
                    if(j+1 < line.length && line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.SUPERIOR_EQUAL, i, j, c+"="));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.SUPERIOR, i, j, c));
                    break;
                case "<":
                    if(j+1 < line.length && line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.INFERIOR_EQUAL, i, j, c+"="));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.INFERIOR, i, j, c));
                    break;
                case "&":
                    if(j+1 < line.length && line[j+1] === "&")
                    {
                        tokenizedLine.push(new Token(Types.DOUBLE_AND, i, j, c+"&"));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.AND, i, j, c));
                    break;
                case "|":
                    if(j+1 < line.length && line[j+1] === "|")
                    {
                        tokenizedLine.push(new Token(Types.DOUBLE_OR, i, j, c+"|"));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.OR, i, j, c));
                    break;
                case "!":
                    if(j+1 < line.length && line[j+1] === "=")
                    {
                        tokenizedLine.push(new Token(Types.NOT_EQUAL, i, j, c+"="));
                        j++;
                    }
                    else tokenizedLine.push(new Token(Types.NOT, i, j, c));
                    break;
                case "'":
                case '"':
                    let stringContent = "";
                    let k = j+1;
                    while(k < line.length && line[k] !== c)
                        stringContent += line[k++];
                        
                    if(k < line.length)
                    {
                        tokenizedLine.push(new Token(Types.STRING, i, j, stringContent));
                        j = k;
                    }
                    else tokenizedLine.push(new Token(Types.UNEXPECTED, i, j, c));
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
                // case "$":
                //     tokenizedLine.push(new Token(Types.DOLLARD, i, j, c));
                //     break;
                case " ":
                    break;
                default:
                    if(isDigit(c) || isIdentifierChar(c))
                    {
                        let type = isDigit(c) ? Types.NUMBER : Types.IDENTIFIER;
                        let tokenValue = c;
                        while(j+1 < line.length && (isIdentifierChar(line[j+1]) || isDigit(line[j+1])))
                        {
                            tokenValue += line[++j];
                            if(isIdentifierChar(line[j]) && type === Types.NUMBER)type = Types.IDENTIFIER;
                        }
                        if(j+1 < line.length && j-1 < 0 && tokenizedLine.length && tokenizedLine[tokenizedLine.length - 1].type === Types.LEFT_PARENTHESIS && ["bool", "num", "obj", "str"].includes(tokenValue) && line[j+1] === ")")
                        {
                            let token = tokenizedLine.pop();
                            switch(tokenValue)
                            {
                                case "bool":
                                    tokenizedLine.push(new Token(Types.CAST_BOOL, token.line, token.pos, `(${tokenValue})`));
                                    break;
                                case "num":
                                    tokenizedLine.push(new Token(Types.CAST_NUM, token.line, token.pos, `(${tokenValue})`));
                                    break;
                                case "obj":
                                    tokenizedLine.push(new Token(Types.CAST_OBJ, token.line, token.pos, `(${tokenValue})`));
                                    break;
                                case "str":
                                    tokenizedLine.push(new Token(Types.CAST_STR, token.line, token.pos, `(${tokenValue})`));
                                    break;
                            }
                            j++;
                        }
                        else tokenizedLine.push(new Token(type, i, j, tokenValue));
                    }
                    else
                    {
                        tokenizedLine.push(new Token(Types.UNEXPECTED, i, j, c));
                        throwErr(interpreter, new LexicalError("Unexpected Token", `unexpected token: ${c} at ${i}:${j}`));//hardcoded
                    }
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
function isIdentifierChar(c)
{
    const ascii = c.charCodeAt(0);
    return isLetter(c) || [36, 45, 95].includes(ascii);
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


module.exports = {
    Token,
    Types,
    tokenize
}