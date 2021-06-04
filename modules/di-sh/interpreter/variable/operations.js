const { digitOnly } = require("../../../string");
const ExecEnv = require("../execEnv");
const { Variable } = require("./variables");
const { Token, isOperatorToken, Types } = require("../parser")

/**
 * 
 * @param {Variable} variable 
 * @param {string} newType 
 * @returns 
 */
function cast(variable, newType)
{
    switch(variable.type)
    {
        case "number":
            switch(newType)
            {
                case "string":
                    return new Variable(variable.name, variable.value.toString());
                case "boolean":
                    return new Variable(variable.name, variable.value !== 0);
                case "number":
                    return new Variable(variable.name, variable.value);
            }
            break;
        case "string":
            switch(newType)
            {
                case "number":
                    if(digitOnly(variable.value))return new Variable(variable.name, parseInt(variable.value, 10));
                    throw new Error("can't parse: " + variable.value);
                case "boolean":
                    if(["true", "false"].includes(variable.value))return new Variable(variable.name, variable.value === "true");
                    throw new Error("can't parse: " + variable.value);
                case "object":
                    return new Variable(variable.name, JSON.parse(variable.value));
                case "string":
                    return new Variable(variable.name, variable.value);
            }
            break;
        case "boolean":
            switch(newType)
            {
                case "string":
                    return new Variable(variable.name, (variable.value ? "true" : "false"));
                case "number":
                    return new Variable(variable.name, (variable.value ? 1 : 0));
                case "boolean":
                    return new Variable(variable.name, variable.value);
            }
            break;
        case "object":
            switch(newType)
            {
                case "string":
                    return new Variable(variable.name, JSON.stringify(variable.value));
                case "object":
                    return new Variable(variable.name, variable.value);
            }
            break;
    }
}

/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function add(a, b)
{
    if(!["number", "string"].includes(a.type) || !["number", "string"].includes(b.type) || a.type !== b.type)throw new Error("can't add: " + a.value + " to: " + b.value);
    return new Variable(null, a.value+b.value);
}
/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function substract(a, b)
{
    if(!["number"].includes(a.type) || !["number"].includes(b.type))throw new Error("can't substract: " + a.value + " by: " + b.value);
    return new Variable(null, a.value-b.value);
}
/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function multiply(a, b)
{
    if(!["number"].includes(a.type) || !["number"].includes(b.type))throw new Error("can't multiply: " + a.value + " by: " + b.value);
    return new Variable(null, a.value*b.value);
}
/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function divide(a, b)
{
    if(!["number"].includes(a.type) || !["number"].includes(b.type))throw new Error("can't divide: " + a.value + " by: " + b.value);
    return new Variable(null, a.value/b.value);
}

/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function mod(a, b)
{
    if(!["number"].includes(a.type) || !["number"].includes(b.type))throw new Error("can't divide: " + a.value + " by: " + b.value);
    return new Variable(null, a.value%b.value);
}

/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function equal(a, b)
{
    return new Variable(null, a.value==b.value);
}

/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
 function superior(a, b)
 {
     if(!["number"].includes(a.type) || !["number"].includes(b.type))throw new Error("can't compare: " + a.value + " with: " + b.value);
     return new Variable(null, a.value>b.value);
 }

 /**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function inferior(a, b)
{
    if(!["number"].includes(a.type) || !["number"].includes(b.type))throw new Error("can't compare: " + a.value + " with: " + b.value);
    return new Variable(null, a.value<b.value);
}

/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
 function and(a, b)
 {
     if(!["boolean"].includes(a.type) || !["boolean"].includes(b.type))throw new Error("can't compare: " + a.value + " with: " + b.value);
     return new Variable(null, a.value&&b.value);
 }

 /**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function or(a, b)
{
    if(!["boolean"].includes(a.type) || !["boolean"].includes(b.type))throw new Error("can't compare: " + a.value + " with: " + b.value);
    console.log(new Variable(null, a.value|b.value))
    return new Variable(null, a.value||b.value);
}

/**
 * 
 * @param {Variable} a 
 * @param {Variable} b 
 */
function set(a, b)
{
    if(a.type !== b.type && a.value !== null)throw new Error("can't set: " + a.name + " to: " + b.value);
    a.value = b.value;
    return a;
}

/**
 * 
 * @param {ExecEnv} env 
 * @param {Token} expression 
 */
function calculateExpression(env, expression)
{
    console.log(expression);
    let operationStack = [];
    for(let token of expression.value)
    {
        if(isOperatorToken(token))
        {
            const rightOperande = operationStack.pop();
            const leftOperande = operationStack.pop();
            operationStack.push(matchOperator(env, leftOperande, rightOperande, token.type));
        }
        else
        {
            if(token.type === Types.IDENTIFIER)operationStack.push(env.interpreter.variables.get(token.value));
            else operationStack.push(new Variable(null, (token.type === Types.NUMBER ? parseInt(token.value, 10) : token.value)));
        }
    }
    return  operationStack[0];
}

function matchOperator(env, leftOperande, rightOperande, operator)
{
    console.log(`${JSON.stringify(leftOperande)}\n${JSON.stringify(rightOperande)}`);
    switch(operator)
    {
        case Types.PLUS:
            return add(leftOperande, rightOperande);
        case Types.MINUS:
            return substract(leftOperande, rightOperande);
        case Types.ASTERISK:
            return multiply(leftOperande, rightOperande);
        case Types.SLASH:
            return divide(leftOperande, rightOperande);
        case Types.PERCENT:
            return mod(leftOperande, rightOperande);
        case Types.EQUAL:
            let result = set(leftOperande, rightOperande);
            env.interpreter.variables.set(result.name, result);
            return result;
        case Types.EQUAL_EQUAL:
            return equal(leftOperande, rightOperande);
        case Types.SUPERIOR:
            return superior(leftOperande, rightOperande);
        case Types.INFERIOR:
            return inferior(leftOperande, rightOperande);
        case Types.SUPERIOR_EQUAL:
            return or(superior(leftOperande, rightOperande), equal(leftOperande, rightOperande));
        case Types.INFERIOR_EQUAL:
            return or(equal(leftOperande, rightOperande), inferior(leftOperande, rightOperande));
        case Types.AND:
            return and(leftOperande, rightOperande);
        case Types.OR:
            return or(leftOperande, rightOperande);
    }
}

module.exports = {
    add,
    substract,
    multiply,
    divide,
    mod,
    set,
    calculateExpression
}