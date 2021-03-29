

/**
 * 
 * @param {string} str 
 */
function isOption(str)
{
    return str.startsWith("-");
}

module.exports = {
    isOption
}