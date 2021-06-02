
/**
 * 
 * @param {string} str 
 */
function digitOnly(str)
{
    const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    for(let c of str)if(!digits.includes(c))return false;
    return true;
}

/**
 * 
 * @param {string} str 
 * @param {Array<string>} searchVals 
 * @param {Array<string>} newVals 
 */
function replace(str, searchVals, newVals)
{
    for(let i = 0; i < searchVals.length; i++)
    {
        while(str.includes(searchVals[i]))
        str.replaces(searchVals[i], newVals[i]);   
    }
    return str;
}

module.exports = {
    digitOnly,
    replace
}