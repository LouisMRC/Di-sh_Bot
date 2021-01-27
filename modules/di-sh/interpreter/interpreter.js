

class Interpreter
{
    constructor(script, context, argv)
    {

    }
    /**
     * 
     * @param {number} ms 
     */
    sleep(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


module.exports = {
    
}