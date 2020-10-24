function italic(str)
{
    return "*" + str + "*";
}
function bold(str)
{
    return "**" + str + "**";
}
function underline(str)
{
    return "__" + str + "__";
}
function strikethrough(str)
{
    return "~~" + str + "~~";
}

function codeblock(str)
{
    return "`" + str + "`";
}
function multiline_codeblock(str, language="")
{
    return "```" + language + "\n" + str + "\n```";
}

function quote(str)
{
    return "> " + str;
}
function multiline_quote(str)
{
    return ">>> " + str;
}

module.exports = {
    italic,
    bold,
    underline,
    strikethrough,
    
    codeblock,
    multiline_codeblock,
    
    quote,
    multiline_quote
}