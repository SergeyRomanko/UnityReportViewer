// https://stackoverflow.com/a/1597560

var Model = function()
{
    var privateStaticMethod = function() {};
    var privateStaticVariable = "foo";

    var constructor = function Model()
    {

    };

    constructor.getManifest = function(project, application, timestamp, emoji, version, deviceId) {
        return {
            project:     project,
            application: application,
            timestamp:   timestamp,
            emoji:       emoji,
            version:     version,
            deviceId:    deviceId
        };
    }

    constructor.getConsoleMessage = function(count, type, message, stack) {
        return {
            count:   count,
            type:    type,
            message: message,
            stack:   stack
        };
    }

    constructor.getFpsData = function(frames, average, last) {
        return {
            frames:  frames,
            average: average,
            last:    last
        };
    }

    constructor.getFrameData = function(frame, other, render, update) {
        return {
            frame:  frame,
            other:  other,
            render: render,
            update: update
        };
    }

    return constructor;
}();

var Console = function()
{
    var readMessageType = function (type)
    {
        switch(type)
        {
            case "exception":
            case "assert": 
            case "error":
                return Console.MessageType.Error;
            case "warning": 
                return Console.MessageType.Warning;
            case "log":
                return Console.MessageType.Message;
            default:   
                Console.MessageType.Unknown;
        }
    }

    var constructor = function Console()
    {

    };

    constructor.MessageType = Object.freeze({
        Unknown: "unknown",

        Error:   "error",
        Warning: "warning",
        Message: "message",
    });

    constructor.readData = function(data) {
        var result = [];

        for (const record of data) {
            result.push(Model.getConsoleMessage(
                record.count,
                readMessageType(record.type),
                record.message,
                record.stack
            ));
        }

        return result;
    };

    return constructor;
}();

var Fps = function()
{
    var constructor = function Fps() { };

    constructor.readData = function(data) {
        var frames = [];

        for (const record of data.frames) {
            frames.push(Model.getFrameData(record.frame, record.other, record.render, record.update));
        }

        return Model.getFpsData(frames, data.average, data.last);
    };

    return constructor;
}();

var Report = function()
{
    var getReportData = function (data) {
		if (data == null)
			throw "Null value provided";
	
		if (!(data instanceof ArrayBuffer)) 
			throw "Data type is wrong. " + data;
		
		if (data.byteLength == 0) 
			throw "File is empty";
	
		console.time('pako.ungzip')
	
		var json = pako.ungzip(data, { to: 'string' });
		
		console.timeEnd('pako.ungzip');
	
		console.time('JSON.parse')

		var result = JSON.parse(json);

		console.timeEnd('JSON.parse');
		
		return result;
	}

    var getModule = function (data, moduleName){
        for (const module of data.modules)
        {
            if (module.name == moduleName)
            {
                return module.data;
            }
        }

        return null;
    }

    var privateStaticMethod = function() {};
    var privateStaticVariable = "foo";

    var consoleData = null;

    var constructor = function Report(reportBinary)
    {
        var data = getReportData(reportBinary);

        var privateMethod = function() {};
        this.publicMethod = function() {};
		
		this.getBinaryData = function() { return data.emoji; };

        this.getManifest = function() { return Model.getManifest(data.project, data.application, data.timestamp, data.emoji, data.version, data.deviceId) };

        this.getConsole = function() { return consoleData != null ? consoleData : (consoleData = Console.readData(getModule(data, "console"))) };

        this.getFps = function() { return Fps.readData(getModule(data, "fps")) };
    };

    constructor.publicStaticMethod = function() {};

    return constructor;
}();