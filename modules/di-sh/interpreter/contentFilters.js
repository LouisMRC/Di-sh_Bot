

/**
 * 
 * @param {string} prefix 
 * @param {array<Message>} commands 
 */
function messageFilter(prefix, commands, withPrefix)
{
    let output = [];
    commands.forEach(command => {if(!(startWithPrefix(prefix, command.content) ^ withPrefix))output.push(command.content)});
    return output;
}

/**
 * 
 * @param {string} prefix 
 * @param {Array<string>} commands 
 * @returns {Array<string>}
 */
function commandFilter(prefix, commands, withPrefix)
{
    let output = [];
    for(let command of commands)
        if(!(startWithPrefix(prefix, command) ^ withPrefix))output.push(command);
    return output;
}

/**
 * 
 * @param {string} prefix 
 * @param {string} command 
 */
function startWithPrefix(prefix, command)
{
    return command.startsWith(prefix);
}

module.exports = {
    messageFilter,
    commandFilter,
    
    startWithPrefix
}