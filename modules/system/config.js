

/**
 * 
 * @param {Array<Array<string>>} rawConf 
 */
function parseConf(rawConf)//array config -> map config
{
    let conf = new Map();
    // console.log(rawConf);
    for(let line of rawConf)conf.set(line[0], line[1]);
    return conf;
}

/**
 * 
 * @param {Map<string, string>} conf 
 */
 function stringifyConf(conf)
 {
     let strConf = "";
     for(let line of conf)strConf += `${strConf.length ? "," : ""}[\\"${line[0]}\\",\\"${line[1]}\\"]`;
     return `"[${strConf}]"`;
 }

module.exports = {
    parseConf,
    stringifyConf
};