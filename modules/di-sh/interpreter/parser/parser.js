const { isMention } = require("../../../mention");
const { calculateExpression } = require("../variable/operations");
const { Token, Types, isValueToken, isOperatorToken, isBinaryOperator, isUnaryOperator, isCastOperator } = require("./token");
const { SymbolTypes, InterpreterSymbol, Expression, If_Expression, While_Expression } = require("./interperterSymboles");
const keywords = require("../keywords/keywords.json");
const { createPool } = require("mariadb");
const { throwErr, SyntacticalError } = require("../error");


const OperatorPrecedence = {
    EQUAL: 0,
    LOGIC: 1,
    COMPARE: 2,
    ADD_SUB: 3,
    MULTI_DIVID_MOD: 4,
    INC_DEC: 5,
    CAST_NOT: 6
}


/**
 * 
 * @param {Array<Array<Token>>} tokens 
 */
function parse(tokens, interpreter = null)
{
    let script = [];
    for(let i = 0; i < tokens.length; i++)
    {
        let line = tokens[i];
        let newLine = [];
        for(let j = 0; j < line.length; j++)
        {
            const token = line[j];
            // if(isUnaryOperator(token) || [Types.MINUS, Types.STRING, Types.NUMBER, Types.IDENTIFIER].includes(token.type))
            // {
            //     let expr = [token];
            //     let k = j + 1;
            //     while(([Types.STRING, Types.NUMBER, Types.IDENTIFIER, Types.LEFT_PARENTHESIS, Types.RIGHT_PARENTHESIS].includes(line[k].type) || isOperatorToken(line[k])) && line[k] !== Types.EOL)
            //         expr.push(line[k++]);
                
            //     if(expr.length > 1)
            //     {
            //         if(checkExpr(expr))newLine.push(new Expression(shuntingYard(expr)));
            //         else newLine.push(new InterpreterSymbol(SymbolTypes.UNEXPECTED, expr));
            //         j = k-1;
            //     }
            // }
            if(token.type === Types.LEFT_PARENTHESIS)
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
                    newLine.push(new InterpreterSymbol(SymbolTypes.UNEXPECTED, token.value));
                }
                else
                {
                    if(checkExpr(expr))
                    {
                        expr = shuntingYard(expr);
                        if(expr.length-1)newLine.push(new Expression(expr));
                        else
                        {
                            switch(expr[0].type)
                            {
                                case Types.IDENTIFIER:
                                    newLine.push(new InterpreterSymbol(SymbolTypes.IDENTIFIER, expr[0].value));
                                    break;
                                case Types.NUMBER:
                                    newLine.push(new InterpreterSymbol(SymbolTypes.NUMBER, expr[0].value));
                                    break;
                                case Types.STRING:
                                    newLine.push(new InterpreterSymbol(SymbolTypes.STRING, expr[0].value));
                                    break;
                            }//check here
                        }
                    }
                    else newLine.push(new InterpreterSymbol(SymbolTypes.UNEXPECTED, expr));
                    j = k-1;
                }
            }
            else
            {
                if(token.type == Types.IDENTIFIER)
                {
                    if(token.value == keywords.If)//todo: add syntax check and security code
                    {
                        let conditionExpr = [];
                        let ifBlock = [];
                        let elseBlock = [];
                        let l = i;
                        k = j+1;
                        if(line[k++].type == Types.LEFT_PARENTHESIS)while(line[k].type != Types.RIGHT_PARENTHESIS)conditionExpr.push(line[k++]);
                        if(line[k+1].type != Types.EOL)
                        {
                            if(line[k+1].type == Types.LEFT_CURLY)
                            {
                                while(++l < tokens.length && tokens[l][0].type != Types.RIGHT_CURLY)ifBlock.push(tokens[l++]);
                                i = l;
                                j = 0;
                            }
                            else 
                            {
                                ifBlock.push(line.slice(k+1));
                                j = line.length;
                            }
                        }
                        else
                        {
                            if(tokens[l+1][0].type == Types.LEFT_CURLY)
                            {
                                l+=2;
                                while(l < tokens.length && tokens[l][0].type != Types.RIGHT_CURLY)ifBlock.push(tokens[l++]);
                                i = l;
                                j = 0;
                            }
                            else
                            {
                                ifBlock.push(tokens[++l]);
                                j = line.length;
                                i = l;
                            }
                        }
                        //todo: else block handling
                        newLine.push(new If_Expression(shuntingYard(conditionExpr), parse(ifBlock)));
                    }
                    else if(token.value == keywords.While)
                    {
                        let conditionExpr = [];
                        let whileBlock = [];
                        let l = i;
                        k = j+1;
                        if(line[k++].type == Types.LEFT_PARENTHESIS)while(line[k].type != Types.RIGHT_PARENTHESIS)conditionExpr.push(line[k++]);
                        if(line[k+1].type != Types.EOL)
                        {
                            if(line[k+1].type == Types.LEFT_CURLY)
                            {
                                while(++l < tokens.length && tokens[l][0].type != Types.RIGHT_CURLY)whileBlock.push(tokens[l++]);
                                i = l;
                                j = 0;
                            }
                            else 
                            {
                                whileBlock.push(line.slice(k+1));
                                j = line.length;
                            }
                        }
                        else
                        {
                            if(tokens[l+1][0].type == Types.LEFT_CURLY)
                            {
                                l+=2;
                                while(l < tokens.length && tokens[l][0].type != Types.RIGHT_CURLY)whileBlock.push(tokens[l++]);
                                i = l;
                                j = 0;
                            }
                            else
                            {
                                whileBlock.push(tokens[++l]);
                                j = line.length;
                                i = l;
                            }
                        }
                        newLine.push(new While_Expression(shuntingYard(conditionExpr), parse(whileBlock)));
                    }
                    else if(token.value == keywords.FunctionDef)
                    {
                        let functionName = "";
                        let functionParams = [];
                        let funcBlock = [];
                        let l = i;
                        k = j+1;
                        if(line[k+1].type != Types.IDENTIFIER)throwErr(new SyntacticalError("Bad function declaration", 'The "fn" keyword should be followed by a valid function identifier'), interpreter);//hardcoded
                        if(token[l+1][0].type != Types.LEFT_CURLY)throwErr(new SyntacticalError("Bad function declaration", "The function declaration should be followed by the function's body"), interpreter);//hardcoded
                        if(line[k++].type == Types.LEFT_PARENTHESIS)while(line[k].type != Types.RIGHT_PARENTHESIS)conditionExpr.push(line[k++]);
                        if(line[k+1].type != Types.EOL)
                        {
                            if(line[k+1].type == Types.LEFT_CURLY)
                            {
                                while(++l < tokens.length && tokens[l][0].type != Types.RIGHT_CURLY)whileBlock.push(tokens[l++]);
                                i = l;
                                j = 0;
                            }
                            else 
                            {
                                whileBlock.push(line.slice(k+1));
                                j = line.length;
                            }
                        }
                        else
                        {
                            if(tokens[l+1][0].type == Types.LEFT_CURLY)
                            {
                                l+=2;
                                while(l < tokens.length && tokens[l][0].type != Types.RIGHT_CURLY)whileBlock.push(tokens[l++]);
                                i = l;
                                j = 0;
                            }
                            else
                            {
                                whileBlock.push(tokens[++l]);
                                j = line.length;
                                i = l;
                            }
                        }
                        newLine.push(new While_Expression(shuntingYard(conditionExpr), parse(whileBlock)));
                    }
                    else newLine.push(new InterpreterSymbol(SymbolTypes.IDENTIFIER, token.value));
                }
                else if(token.type == Types.NUMBER)
                {
                    newLine.push(new InterpreterSymbol(SymbolTypes.NUMBER, token.value));
                }
                else if(token.type == Types.STRING)
                {
                    newLine.push(new InterpreterSymbol(SymbolTypes.STRING, token.value));
                }
                //check here
            }
            // else
            // {

            // }
        }
        // for(let i = 0; i < newLine.length; i++)if(newLine[i].type === Types.MINUS)newLine[i].type = Types.PIPE;
        script.push(newLine);
    }
    return script;
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
 * @param {Array<Token>} expr 
 */
function shuntingYard(expr)
{
    let output = [];
    let operationStack = [];
    for(let i = 0; i < expr.length; i++)
    {
        const token = expr[i];
        if([Types.NUMBER, Types.STRING, Types.IDENTIFIER].includes(token.type))
        {
            output.push(token);
            while(operationStack.length > 0 && isUnaryOperator(operationStack[operationStack.length-1]))
                output.push(operationStack.pop());
        }
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
            if(operationStack[operationStack.length-1].type === Types.LEFT_PARENTHESIS)
            {
                operationStack.pop();
                while(operationStack.length > 0 && isUnaryOperator(operationStack[operationStack.length-1]))
                output.push(operationStack.pop());
            }
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
            if(i === 0 || i === expr.length-1 || (!isValueToken(expr[i-1]) && expr[i-1].type  !== Types.RIGHT_PARENTHESIS) || (!isValueToken(expr[i+1]) && expr[i+1].type !== Types.LEFT_PARENTHESIS && !isUnaryOperator(expr[i+1])))
                return false;
        }
        else if(isUnaryOperator(token))
        {
            if(token.type === Types.PLUS_PLUS)
            {
                switch(`${(i > 0 && isValueToken(expr[i-1])) ? "1" : "0"}${(i < expr.length && isValueToken(expr[i+1])) ? "1" : "0"}`)
                {
                    case "10":
                        expr[i] = new Token(Types.POST_INCREMENT, token.line, token.pos, token.value);
                        break;
                    case "01":
                        expr[i] = new Token(Types.PRE_INCREMENT, token.line, token.pos, token.value);
                        break;
                    default:
                        return false;
                }
            }
            else if(token.type === Types.MINUS_MINUS)
            {
                switch(`${(i > 0 && isValueToken(expr[i-1].type)) ? "1" : "0"}${(i < expr.length && isValueToken(expr[i+1].type)) ? "1" : "0"}`)
                {
                    case "10":
                        expr[i] = new Token(Types.POST_DECREMENT, token.line, token.pos, token.value);
                        break;
                    case "01":
                        expr[i] = new Token(Types.PRE_DECREMENT, token.line, token.pos, token.value);
                        break;
                    default:
                        return false;
                }
            }
            else if(i === expr.length-1 || (!isValueToken(expr[i+1]) && expr[i+1].type !== Types.LEFT_PARENTHESIS && !isUnaryOperator(expr[i+1])))
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
        case Types.PRE_INCREMENT:
        case Types.POST_INCREMENT:
        case Types.PRE_DECREMENT:
        case Types.POST_DECREMENT:
            return OperatorPrecedence.INC_DEC;

        case Types.NOT:
        case Types.CAST_BOOL:
        case Types.CAST_NUM:
        case Types.CAST_OBJ:
        case Types.CAST_STR:
            return OperatorPrecedence.CAST_NOT;
    }
}



module.exports = {
    parse,
    removeTokensByType,
    checkExpr,
    shuntingYard
}