
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

module.exports = {
    digitOnly
}