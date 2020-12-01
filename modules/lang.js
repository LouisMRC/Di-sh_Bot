
const languages = new Map();
function loadLanguages()
{
    let path = "../lang/";
    languages.set("en", require(path + "en.json"));
    languages.set("fr", require(path + "fr.json"));
}

module.exports = {
    languages,
    loadLanguages
}