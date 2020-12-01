function removeQuote(str)
{
    if(str.startsWith('"') && str.endsWith('"'))return str.slice(1, -1);
    if(str.startsWith("'") && str.endsWith("'"))return str.slice(1, -1);
    return str;
}

module.exports = {
    removeQuote
}